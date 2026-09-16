import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DRAG_UMBRAL_PX, Z_ORDER } from '../catalogo/constantes.js';
import { piezaBounds, cruzaFilaZ } from '../modelo/operaciones.js';
import PiezaRender, { PreviewDiagonal } from '../pieza-renders/index.jsx';
import { Grilla, LineaBase, IndicadoresSnap, GuiasModulacion } from './Compartidos.jsx';
import Cotas from './Cotas.jsx';
import FlashColocacion from '../ui/FlashColocacion.jsx';
import { elegirDiagonal } from '../catalogo/piezas.js';

// Vista de alzado frontal: plano X (horizontal) - Y (altura), a la profundidad `filaZ` activa.
export default function Alzado({ modelo, mostrarGrilla, mostrarCotas, modoTecnico, svgRefCb, fitTrigger }) {
  const {
    piezas, herramientaActiva, setHerramientaActiva, piezasSeleccionadas, setPiezasSeleccionadas,
    diagonalOrigen, setDiagonalOrigen, clipboard, filaZ, orientacionActiva,
    filas, setFilaActivaId,
    commit, copiar, pegar, duplicar, eliminarSeleccion,
    colocarPiezaAlzado, colocarDiagonalAlzado, calcularSnapAlzado, moverPiezas, commitPiezasActuales,
  } = modelo;

  // Piezas seleccionadas que están fuera de la fila visible ahora. Sirve para avisar
  // al usuario cuando su selección vino de la Planta y no cae en el Alzado actual.
  const seleccionadasFueraFila = useMemo(() => piezas.filter(p => piezasSeleccionadas.includes(p.id) && !cruzaFilaZ(p, filaZ)), [piezas, piezasSeleccionadas, filaZ]);
  const filasSeleccionadas = useMemo(() => {
    const zs = [...new Set(seleccionadasFueraFila.map(p => p.z ?? 0))];
    return zs.map(z => filas.find(f => f.z === z) || { id: null, nombre: `Z=${z.toFixed(2)}m`, z });
  }, [seleccionadasFueraFila, filas]);

  // Filtra piezas visibles en la fila Z activa. Horizontales orientadas en Z pueden
  // atravesar la fila (arrancan en un z0 y llegan hasta z0+largo) — cruzaFilaZ maneja eso.
  const piezasFila = useMemo(() => piezas.filter(p => cruzaFilaZ(p, filaZ)), [piezas, filaZ]);

  const [arrastrando, setArrastrando] = useState(null);
  const [seleccionRect, setSeleccionRect] = useState(null);
  const [seleccionInicio, setSeleccionInicio] = useState(null);
  const [zoom, setZoom] = useState(60);
  const [pan, setPan] = useState({ x: 1, y: 0.5 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseEnCanvas, setMouseEnCanvas] = useState(false);
  const [panneando, setPanneando] = useState(false);
  const [panInicio, setPanInicio] = useState(null);
  const [hoverPieza, setHoverPieza] = useState(null); // { pieza, screenX, screenY }
  const svgRef = useRef(null);
  const [dimCanvas, setDimCanvas] = useState({ w: 1000, h: 600 });
  const spaceHeld = useRef(false);
  const stateRef = useRef({});
  stateRef.current = { piezas: piezasFila, mousePos, clipboard, _zoom: zoom, _pan: pan, _dimCanvas: dimCanvas };

  useEffect(() => {
    const act = () => { if (svgRef.current) { const r = svgRef.current.getBoundingClientRect(); setDimCanvas({ w: r.width, h: r.height }); } };
    act(); window.addEventListener('resize', act); return () => window.removeEventListener('resize', act);
  }, []);

  // Exponer ref del SVG al padre para PDF export
  useEffect(() => { if (svgRefCb) svgRefCb(svgRef.current); return () => { if (svgRefCb) svgRefCb(null); }; }, [svgRefCb]);

  // Zoom-to-fit: encuadrar todas las piezas visibles
  useEffect(() => {
    if (!fitTrigger || !piezasFila.length) return;
    const bounds = piezasFila.reduce((acc, p) => {
      const b = piezaBounds(p);
      return { xMin: Math.min(acc.xMin, b.xMin), xMax: Math.max(acc.xMax, b.xMax), yMin: Math.min(acc.yMin, b.yMin), yMax: Math.max(acc.yMax, b.yMax) };
    }, { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity });
    const pad = 1; // 1m margen
    const wW = (bounds.xMax - bounds.xMin) + pad * 2;
    const wH = (bounds.yMax - bounds.yMin) + pad * 2;
    if (wW <= 0 || wH <= 0) return;
    const nz = Math.min(dimCanvas.w / wW, dimCanvas.h / wH, 200);
    const cx = (bounds.xMin + bounds.xMax) / 2;
    const cy = (bounds.yMin + bounds.yMax) / 2;
    setZoom(Math.max(15, nz));
    setPan({ x: cx - dimCanvas.w / (2 * nz), y: cy - dimCanvas.h / (2 * nz) });
  }, [fitTrigger]);

  const worldToScreen = useCallback((wx, wy) => ({ x: (wx - pan.x) * zoom, y: dimCanvas.h - (wy - pan.y) * zoom }), [pan, zoom, dimCanvas]);
  const screenToWorld = useCallback((sx, sy) => ({ x: sx / zoom + pan.x, y: (dimCanvas.h - sy) / zoom + pan.y }), [pan, zoom, dimCanvas]);

  // Pegado con Ctrl+V posicionado en el mouse (atajo local: Alzado coloca en X,Y de la fila activa)
  useEffect(() => {
    const kd = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      const PAN_STEP = 0.5;
      if (e.key === ' ' && !ctrl) { e.preventDefault(); spaceHeld.current = true; return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setPan(p => ({ ...p, x: p.x - PAN_STEP })); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); setPan(p => ({ ...p, x: p.x + PAN_STEP })); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPan(p => ({ ...p, y: p.y + PAN_STEP })); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setPan(p => ({ ...p, y: p.y - PAN_STEP })); return; }
      if (ctrl && e.key.toLowerCase() === 'v') { e.preventDefault(); pegar(stateRef.current.mousePos, 'alzado'); }
    };
    const ku = (e) => { if (e.key === ' ') spaceHeld.current = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [pegar]);

  const onMouseMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (panneando && panInicio) {
      setPan({ x: panInicio.panX - (sx - panInicio.sx) / zoom, y: panInicio.panY + (sy - panInicio.sy) / zoom }); return;
    }
    if (arrastrando) {
      const distPx = Math.hypot(sx - arrastrando.mouseIniPx.x, sy - arrastrando.mouseIniPx.y);
      if (distPx < DRAG_UMBRAL_PX && !arrastrando.moved) return;
      const w = screenToWorld(sx, sy);
      const posI = arrastrando.snapshotPosiciones[arrastrando.piezaAnclaId];
      const posIX = arrastrando.categoriaAncla === 'diagonal' ? posI.x1 : posI.x;
      const posIY = arrastrando.categoriaAncla === 'diagonal' ? posI.y1 : posI.y;
      const snapped = calcularSnapAlzado(w.x - arrastrando.offsetX, w.y - arrastrando.offsetY, null, arrastrando.idsAMover);
      const dX = snapped.x - posIX, dY = snapped.y - posIY;
      moverPiezas(arrastrando.idsAMover, arrastrando.snapshotPosiciones, dX, dY);
      setArrastrando(a => ({ ...a, moved: true })); return;
    }
    if (seleccionInicio) {
      if (Math.hypot(sx - seleccionInicio.sx, sy - seleccionInicio.sy) > 3) {
        const w = screenToWorld(sx, sy);
        setSeleccionRect({ x1: seleccionInicio.wx, y1: seleccionInicio.wy, x2: w.x, y2: w.y });
      }
    }
    const world = screenToWorld(sx, sy);
    setMousePos(calcularSnapAlzado(world.x, world.y, herramientaActiva));
  };
  const onMouseEnter = () => setMouseEnCanvas(true);
  const onMouseLeave = () => { setMouseEnCanvas(false); setPanneando(false); if (arrastrando?.moved) commitPiezasActuales(); setArrastrando(null); setSeleccionInicio(null); setSeleccionRect(null); };

  const onMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && (e.altKey || spaceHeld.current))) {
      e.preventDefault(); const rect = svgRef.current.getBoundingClientRect();
      setPanneando(true); setPanInicio({ sx: e.clientX - rect.left, sy: e.clientY - rect.top, panX: pan.x, panY: pan.y }); return;
    }
    if (e.button !== 0) return;
    if (herramientaActiva) {
      if (herramientaActiva.categoria === 'diagonal') {
        if (!diagonalOrigen) setDiagonalOrigen({ x: mousePos.x, y: mousePos.y });
        else { colocarDiagonalAlzado(diagonalOrigen, { x: mousePos.x, y: mousePos.y }); setDiagonalOrigen(null); }
      } else colocarPiezaAlzado(herramientaActiva, mousePos.x, mousePos.y);
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const w = screenToWorld(sx, sy);
    setSeleccionInicio({ sx, sy, wx: w.x, wy: w.y, shift: e.shiftKey });
  };

  const onMouseUp = () => {
    setPanneando(false);
    if (arrastrando) { if (arrastrando.moved) commitPiezasActuales(); setArrastrando(null); }
    if (seleccionInicio) {
      if (seleccionRect) {
        const xMin = Math.min(seleccionRect.x1, seleccionRect.x2), xMax = Math.max(seleccionRect.x1, seleccionRect.x2);
        const yMin = Math.min(seleccionRect.y1, seleccionRect.y2), yMax = Math.max(seleccionRect.y1, seleccionRect.y2);
        const ns = piezasFila.filter(p => { const b = piezaBounds(p); return !(b.xMax < xMin || b.xMin > xMax || b.yMax < yMin || b.yMin > yMax); }).map(p => p.id);
        setPiezasSeleccionadas(seleccionInicio.shift ? prev => [...new Set([...prev, ...ns])] : ns);
      } else if (!seleccionInicio.shift) setPiezasSeleccionadas([]);
      setSeleccionInicio(null); setSeleccionRect(null);
    }
  };

  // Wheel con { passive: false } para evitar warnings de preventDefault
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const sw = stateRef.current;
      const z = sw._zoom ?? 60, p = sw._pan ?? { x: 1, y: 0.5 }, dc = sw._dimCanvas ?? { w: 1000, h: 600 };
      const s2w = (sx2, sy2) => ({ x: sx2 / z + p.x, y: (dc.h - sy2) / z + p.y });
      if (e.ctrlKey || e.metaKey) {
        const wa = s2w(sx, sy); const f = e.deltaY < 0 ? 1.08 : 0.93;
        const nz = Math.max(15, Math.min(220, z * f)); setZoom(nz);
        setPan({ x: wa.x - sx / nz, y: wa.y - (dc.h - sy) / nz }); return;
      }
      if (Math.abs(e.deltaX) > 0 || !e.shiftKey) {
        setPan(pp => ({ x: pp.x + e.deltaX / z, y: pp.y - e.deltaY / z }));
      } else {
        const wa = s2w(sx, sy); const nz = Math.max(15, Math.min(220, z * (e.deltaY < 0 ? 1.15 : 0.87)));
        setZoom(nz); setPan({ x: wa.x - sx / nz, y: wa.y - (dc.h - sy) / nz });
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const onMouseDownPieza = (e, pieza) => {
    e.stopPropagation(); if (herramientaActiva) return;
    const yaSel = piezasSeleccionadas.includes(pieza.id);
    if (e.shiftKey) { setPiezasSeleccionadas(yaSel ? prev => prev.filter(id => id !== pieza.id) : prev => [...prev, pieza.id]); return; }
    let ids = yaSel ? piezasSeleccionadas : [pieza.id];
    if (!yaSel) setPiezasSeleccionadas([pieza.id]);
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top, w = screenToWorld(sx, sy);
    const snap = {};
    ids.forEach(id => { const p = piezasFila.find(x => x.id === id); if (!p) return; snap[id] = p.categoria === 'diagonal' ? { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 } : { x: p.x, y: p.y }; });
    const offX = w.x - (pieza.categoria === 'diagonal' ? pieza.x1 : pieza.x);
    const offY = w.y - (pieza.categoria === 'diagonal' ? pieza.y1 : pieza.y);
    setArrastrando({ idsAMover: ids, piezaAnclaId: pieza.id, categoriaAncla: pieza.categoria, offsetX: offX, offsetY: offY, snapshotPosiciones: snap, moved: false, mouseIniPx: { x: sx, y: sy } });
  };

  const worldVisible = useMemo(() => {
    const tl = screenToWorld(0, 0), br = screenToWorld(dimCanvas.w, dimCanvas.h);
    return { xMin: Math.min(br.x, tl.x), xMax: Math.max(br.x, tl.x), yMin: Math.min(br.y, tl.y), yMax: Math.max(br.y, tl.y) };
  }, [pan, zoom, dimCanvas, screenToWorld]);

  const piezasOrdenadas = useMemo(() => [...piezasFila].sort((a, b) => (Z_ORDER[a.categoria] ?? 5) - (Z_ORDER[b.categoria] ?? 5)), [piezasFila]);

  return (
    <div className={`flex-1 relative overflow-hidden ${modoTecnico ? 'bg-white' : 'bg-gray-50'}`}>
      <svg ref={svgRef} className="w-full h-full select-none" tabIndex={0}
        onMouseMove={onMouseMove} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown} onMouseUp={onMouseUp}
        style={{ cursor: panneando ? 'grabbing' : arrastrando ? 'grabbing' : herramientaActiva ? 'crosshair' : 'default' }}>
        {mostrarGrilla && <Grilla worldVisible={worldVisible} worldToScreen={worldToScreen} zoom={zoom} />}
        <LineaBase worldVisible={worldVisible} worldToScreen={worldToScreen} label="SUELO" />
        {/* Niveles de piso — marcas de altura cada 0.50m en borde izquierdo */}
        {(() => {
          const step = zoom > 80 ? 0.5 : zoom > 40 ? 1.0 : 2.0;
          const yMin = Math.floor(worldVisible.yMin / step) * step;
          const yMax = Math.ceil(worldVisible.yMax / step) * step;
          const niveles = [];
          for (let y = Math.max(0, yMin); y <= yMax; y += step) niveles.push(y);
          const color = modoTecnico ? '#555' : '#94a3b8';
          const isMajor = (y) => Math.abs(y % 1.0) < 0.01;
          return niveles.map(y => {
            const p = worldToScreen(0, y);
            const major = isMajor(y);
            return (
              <g key={`niv-${y}`}>
                {major && <line x1={0} y1={p.y} x2={dimCanvas.w} y2={p.y} stroke={color} strokeWidth="0.3" strokeDasharray="2 6" opacity="0.25" />}
                <rect x={0} y={p.y - 7} width={38} height={14} fill={major ? (modoTecnico ? '#444' : '#475569') : (modoTecnico ? '#888' : '#94a3b8')} rx="2" opacity={major ? 0.85 : 0.55} />
                <text x={19} y={p.y + 3} fontSize={major ? '9' : '8'} fill="white" textAnchor="middle" fontFamily="monospace" fontWeight={major ? 'bold' : 'normal'}>{y.toFixed(step < 1 ? 2 : 1)}m</text>
              </g>
            );
          });
        })()}
        {/* Ejes de columna — números 1, 2, 3... arriba, basados en posiciones X de verticales */}
        {(() => {
          const xs = [...new Set(piezasFila.filter(p => p.categoria === 'vertical' || p.categoria === 'base').map(p => p.x))].sort((a, b) => a - b);
          if (!xs.length) return null;
          const r = 9;
          const ejeColor = modoTecnico ? '#333' : '#999';
          const ejeFill = modoTecnico ? '#444' : '#666';
          return xs.map((xw, i) => {
            const p1 = worldToScreen(xw, worldVisible.yMax);
            const p2 = worldToScreen(xw, worldVisible.yMin);
            return (
              <g key={`eje-${i}`}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ejeColor} strokeWidth="0.4" strokeDasharray="4 6" opacity="0.2" />
                <circle cx={p1.x} cy={8} r={r} fill="none" stroke={ejeColor} strokeWidth="1" />
                <text x={p1.x} y={12} fontSize="10" fill={ejeFill} textAnchor="middle" fontFamily="monospace" fontWeight="bold">{String(i + 1)}</text>
              </g>
            );
          });
        })()}
        {piezasOrdenadas.map(p => (
          <PiezaRender key={p.id} pieza={p} worldToScreen={worldToScreen} zoom={zoom}
            seleccionada={piezasSeleccionadas.includes(p.id)}
            onMouseDown={(e) => onMouseDownPieza(e, p)} cursorMover={!herramientaActiva && !arrastrando}
            modoTecnico={modoTecnico}
            onMouseEnter={(e) => { if (!arrastrando && !herramientaActiva) setHoverPieza({ pieza: p, screenX: e.clientX, screenY: e.clientY }); }}
            onMouseLeave={() => setHoverPieza(null)} />
        ))}
        <FlashColocacion piezas={piezasFila} worldToScreen={worldToScreen} />
        {mostrarCotas && <Cotas piezas={piezasFila} worldToScreen={worldToScreen} zoom={zoom} worldVisible={worldVisible} dimCanvas={dimCanvas} modoTecnico={modoTecnico} />}
        {mouseEnCanvas && herramientaActiva && !panneando && !arrastrando && herramientaActiva.categoria !== 'diagonal' && herramientaActiva.categoria !== 'diagonalPlanta' && (
          <PiezaRender pieza={{ ...herramientaActiva, x: mousePos.x, y: mousePos.y, id: 'ghost', orientacion: orientacionActiva }}
            worldToScreen={worldToScreen} zoom={zoom} fantasma modoTecnico={modoTecnico} />
        )}
        {mouseEnCanvas && herramientaActiva?.categoria === 'diagonal' && diagonalOrigen && (
          <PreviewDiagonal origen={diagonalOrigen} destino={mousePos} worldToScreen={worldToScreen} catalogoElegirDiagonal={elegirDiagonal} />
        )}
        {herramientaActiva?.categoria === 'diagonal' && diagonalOrigen && (() => {
          const p = worldToScreen(diagonalOrigen.x, diagonalOrigen.y);
          return <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#7c3aed" strokeWidth="2" />;
        })()}
        {seleccionRect && (() => {
          const p1 = worldToScreen(seleccionRect.x1, seleccionRect.y1), p2 = worldToScreen(seleccionRect.x2, seleccionRect.y2);
          return <rect x={Math.min(p1.x, p2.x)} y={Math.min(p1.y, p2.y)} width={Math.abs(p2.x - p1.x)} height={Math.abs(p2.y - p1.y)}
            fill="#3b82f6" fillOpacity="0.08" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 3" />;
        })()}
        {mouseEnCanvas && herramientaActiva && (mousePos.snapX || mousePos.snapY) && (
          <IndicadoresSnap mousePos={mousePos} worldToScreen={worldToScreen} dimCanvas={dimCanvas} zoom={zoom} />
        )}
        {mouseEnCanvas && herramientaActiva && !panneando && !arrastrando && (
          <GuiasModulacion mousePos={mousePos} worldToScreen={worldToScreen} dimCanvas={dimCanvas} zoom={zoom} vista="alzado" />
        )}
      </svg>
      {mouseEnCanvas && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded font-mono">
          X:{mousePos.x.toFixed(2)}m Y:{mousePos.y.toFixed(2)}m
          {mousePos.snapRoseta && <span className="text-purple-300 ml-1">◆roseta</span>}
          {!mousePos.snapRoseta && mousePos.snapX && <span className="text-red-400 ml-1">◆X</span>}
          {!mousePos.snapRoseta && mousePos.snapY && <span className="text-red-400 ml-1">◆Y</span>}
          {mousePos.distanciaVertical > 0.01 && (
            <span className={mousePos.snapModulo > 0 ? 'text-green-400 ml-1' : 'text-yellow-300 ml-1'}>
              ↔{mousePos.distanciaVertical.toFixed(2)}m
              {mousePos.snapModulo > 0 && ' ✓mod'}
            </span>
          )}
        </div>
      )}
      {/* Controles de zoom */}
      <div className="absolute bottom-2 right-44 flex items-center gap-1">
        <button onClick={() => { const nz = Math.max(15, zoom * 0.8); setZoom(nz); }} className="bg-white/90 hover:bg-gray-100 border border-gray-300 text-gray-600 w-6 h-6 rounded text-sm font-bold flex items-center justify-center" title="Alejar">−</button>
        <div className="bg-white/90 border border-gray-300 text-[9px] text-gray-500 px-1.5 py-0.5 rounded font-mono min-w-[40px] text-center">{Math.round(zoom)}%</div>
        <button onClick={() => { const nz = Math.min(220, zoom * 1.25); setZoom(nz); }} className="bg-white/90 hover:bg-gray-100 border border-gray-300 text-gray-600 w-6 h-6 rounded text-sm font-bold flex items-center justify-center" title="Acercar">+</button>
      </div>
      <div className="absolute bottom-2 right-2 bg-white/95 border border-gray-300 text-[9px] text-gray-500 px-2 py-0.5 rounded">
        Esquemático preliminar · No usar como guía de armado
      </div>
      {seleccionadasFueraFila.length > 0 && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] px-2 py-1 rounded shadow flex items-center gap-2">
          <span>{seleccionadasFueraFila.length} pieza(s) seleccionada(s) fuera de esta fila</span>
          {filasSeleccionadas.map(f => (
            <button key={f.id ?? f.z} onClick={() => f.id && setFilaActivaId(f.id)}
              disabled={!f.id}
              className="bg-white text-purple-700 px-1.5 py-0.5 rounded font-bold hover:bg-purple-100 disabled:opacity-60"
              title={f.id ? `Ir a fila ${f.nombre}` : 'Sin fila nombrada en ese Z'}>
              → {f.nombre}
            </button>
          ))}
        </div>
      )}
      {hoverPieza && !arrastrando && !herramientaActiva && (() => {
        const p = hoverPieza.pieza;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const left = hoverPieza.screenX - rect.left + 12;
        const top = hoverPieza.screenY - rect.top - 10;
        return (
          <div className="absolute pointer-events-none bg-black/90 text-white text-[10px] px-2 py-1 rounded shadow-lg max-w-48 z-50"
            style={{ left, top }}>
            <div className="font-bold">{p.nombre}</div>
            <div className="text-gray-300">{p.ref} · {p.peso} kg</div>
          </div>
        );
      })()}
    </div>
  );
}
