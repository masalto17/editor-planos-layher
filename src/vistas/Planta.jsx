import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DRAG_UMBRAL_PX, ES_TIPO_VERTICAL, ES_TIPO_HORIZONTAL } from '../catalogo/constantes.js';
import { piezaBoundsXZ } from '../modelo/operaciones.js';
import { elegirDiagonalPlanta } from '../catalogo/piezas.js';
import { Grilla, LineaBase, IndicadoresSnap } from './Compartidos.jsx';
import CotasPlanta from './CotasPlanta.jsx';

// Extremos de una horizontal en X-Z, respetando su orientacion.
function extremosXZ(pieza) {
  const z = pieza.z ?? 0;
  if (pieza.orientacion === 'z') return { x1: pieza.x, z1: z, x2: pieza.x, z2: z + pieza.largo };
  return { x1: pieza.x, z1: z, x2: pieza.x + pieza.largo, z2: z };
}

const TECNICO_COLORS_PLANTA = { vertical: '#111', horizontalO: '#333', vigaPuente: '#222', horizontalU: '#333', plataforma: '#555', barandilla: '#444', rodapie: '#444', diagonal: '#333', diagonalPlanta: '#333', base: '#222' };

function PiezaPlanta({ pieza, worldToScreen, zoom, seleccionada, fantasma, otraAltura, onMouseDown, modoTecnico }) {
  const op = fantasma ? 0.4 : otraAltura ? 0.18 : 1;
  const sc = seleccionada ? '#E30613' : (modoTecnico ? (TECNICO_COLORS_PLANTA[pieza.categoria] || '#333') : pieza.color);
  const cur = fantasma ? 'none' : 'pointer';
  const z = pieza.z ?? 0;

  if (ES_TIPO_VERTICAL(pieza.categoria)) {
    const p = worldToScreen(pieza.x, z);
    const r = Math.max(3, zoom * 0.06);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke="#E30613" strokeWidth="2" />}
        <circle cx={p.x} cy={p.y} r={r} fill={sc} stroke="#000" strokeWidth="0.5" />
      </g>
    );
  }
  if (pieza.categoria === 'plataforma') {
    const { x1, z1, x2, z2 } = extremosXZ(pieza);
    const pA = worldToScreen(x1, z1), pB = worldToScreen(x2, z2);
    // El ancho visual perpendicular al largo depende del eje: plataforma 0.61m ancha
    // se ve como banda de 0.61m en el eje transversal al largo.
    const anchoW = pieza.anchoPlat || 0.32;
    const hor = pieza.orientacion !== 'z';
    const px = hor ? Math.min(pA.x, pB.x) : Math.min(pA.x, pB.x) - anchoW * zoom / 2;
    const py = hor ? Math.min(pA.y, pB.y) - anchoW * zoom / 2 : Math.min(pA.y, pB.y);
    const w = hor ? Math.abs(pB.x - pA.x) : anchoW * zoom;
    const h = hor ? anchoW * zoom : Math.abs(pB.y - pA.y);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={px - 3} y={py - 3} width={w + 6} height={h + 6} fill="none" stroke="#E30613" strokeWidth="2" />}
        <rect x={px} y={py} width={w} height={h} fill={sc} fillOpacity="0.55" stroke={sc} strokeWidth="1" />
      </g>
    );
  }
  if (ES_TIPO_HORIZONTAL(pieza.categoria)) {
    const { x1, z1, x2, z2 } = extremosXZ(pieza);
    const pL = worldToScreen(x1, z1), pR = worldToScreen(x2, z2);
    const g = Math.max(2, zoom * 0.045);
    const isDashed = pieza.categoria === 'barandilla';
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
        <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke={sc} strokeWidth={g} strokeLinecap="round" strokeDasharray={isDashed ? '8 4' : 'none'} />
      </g>
    );
  }
  if (pieza.categoria === 'diagonal') {
    // Diagonal de alzado — proyección en planta: sólo se ve como marca en su fila.
    const midX = (pieza.x1 + pieza.x2) / 2;
    const p = worldToScreen(midX, z);
    return (
      <g opacity={op * 0.6} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        <rect x={p.x - 4} y={p.y - 4} width="8" height="8" fill="none" stroke={sc} strokeWidth="1.5" transform={`rotate(45 ${p.x} ${p.y})`} />
      </g>
    );
  }
  if (pieza.categoria === 'base') {
    // Husillo/collarín: cuadrado con X en planta
    const p = worldToScreen(pieza.x, z);
    const s = Math.max(4, zoom * 0.07);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={p.x - s - 3} y={p.y - s - 3} width={(s + 3) * 2} height={(s + 3) * 2} fill="none" stroke="#E30613" strokeWidth="2" />}
        <rect x={p.x - s} y={p.y - s} width={s * 2} height={s * 2} fill={sc} fillOpacity="0.7" stroke="#000" strokeWidth="0.5" />
        <line x1={p.x - s * 0.6} y1={p.y - s * 0.6} x2={p.x + s * 0.6} y2={p.y + s * 0.6} stroke="#fff" strokeWidth="0.8" />
        <line x1={p.x + s * 0.6} y1={p.y - s * 0.6} x2={p.x - s * 0.6} y2={p.y + s * 0.6} stroke="#fff" strokeWidth="0.8" />
      </g>
    );
  }
  if (pieza.categoria === 'diagonalPlanta') {
    const pA = worldToScreen(pieza.x1, pieza.z1), pB = worldToScreen(pieza.x2, pieza.z2);
    const g = Math.max(1.5, zoom * 0.035);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
        <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke={sc} strokeWidth={g} strokeLinecap="round" strokeDasharray="6 2" />
        <circle cx={pA.x} cy={pA.y} r={Math.max(2, zoom * 0.03)} fill={sc} />
        <circle cx={pB.x} cy={pB.y} r={Math.max(2, zoom * 0.03)} fill={sc} />
      </g>
    );
  }
  return null;
}

// Vista de planta: plano X (horizontal) - Z (profundidad/fila). Comparte piezas, selección
// e historial con el Alzado — es el mismo modelo de datos visto desde arriba.
export default function Planta({ modelo, mostrarGrilla, mostrarCotas, modoTecnico, svgRefCb, fitTrigger }) {
  const {
    piezas, herramientaActiva, piezasSeleccionadas, setPiezasSeleccionadas,
    clipboard, orientacionActiva, filas, alturaY,
    diagonalPlantaOrigen, setDiagonalPlantaOrigen,
    colocarPiezaPlanta, colocarDiagonalPlanta, calcularSnapPlanta, moverPiezasZ, commitPiezasActuales, pegar,
  } = modelo;

  const [arrastrando, setArrastrando] = useState(null);
  const [seleccionRect, setSeleccionRect] = useState(null);
  const [seleccionInicio, setSeleccionInicio] = useState(null);
  const [zoom, setZoom] = useState(60);
  const [pan, setPan] = useState({ x: 1, y: -1 });
  const [mousePos, setMousePos] = useState({ x: 0, z: 0 });
  const [mouseEnCanvas, setMouseEnCanvas] = useState(false);
  const [panneando, setPanneando] = useState(false);
  const [panInicio, setPanInicio] = useState(null);
  const [hoverPieza, setHoverPieza] = useState(null);
  const svgRef = useRef(null);
  const [dimCanvas, setDimCanvas] = useState({ w: 1000, h: 600 });
  const spaceHeld = useRef(false);
  const stateRef = useRef({});
  stateRef.current = { mousePos, clipboard, _zoom: zoom, _pan: pan, _dimCanvas: dimCanvas };

  useEffect(() => {
    const act = () => { if (svgRef.current) { const r = svgRef.current.getBoundingClientRect(); setDimCanvas({ w: r.width, h: r.height }); } };
    act(); window.addEventListener('resize', act); return () => window.removeEventListener('resize', act);
  }, []);

  useEffect(() => { if (svgRefCb) svgRefCb(svgRef.current); return () => { if (svgRefCb) svgRefCb(null); }; }, [svgRefCb]);

  // Zoom-to-fit: encuadrar todas las piezas
  useEffect(() => {
    if (!fitTrigger || !piezas.length) return;
    const bounds = piezas.reduce((acc, p) => {
      const b = piezaBoundsXZ(p);
      return { xMin: Math.min(acc.xMin, b.xMin), xMax: Math.max(acc.xMax, b.xMax), zMin: Math.min(acc.zMin, b.zMin), zMax: Math.max(acc.zMax, b.zMax) };
    }, { xMin: Infinity, xMax: -Infinity, zMin: Infinity, zMax: -Infinity });
    const pad = 1;
    const wW = (bounds.xMax - bounds.xMin) + pad * 2;
    const wH = (bounds.zMax - bounds.zMin) + pad * 2;
    if (wW <= 0 || wH <= 0) return;
    const nz = Math.min(dimCanvas.w / wW, dimCanvas.h / wH, 200);
    const cx = (bounds.xMin + bounds.xMax) / 2;
    const cz = (bounds.zMin + bounds.zMax) / 2;
    setZoom(Math.max(15, nz));
    setPan({ x: cx - dimCanvas.w / (2 * nz), y: cz - dimCanvas.h / (2 * nz) });
  }, [fitTrigger]);

  // Nota: sin flip vertical (la profundidad Z no tiene "gravedad") — Z crece hacia abajo en pantalla.
  const worldToScreen = useCallback((wx, wz) => ({ x: (wx - pan.x) * zoom, y: (wz - pan.y) * zoom }), [pan, zoom]);
  const screenToWorld = useCallback((sx, sy) => ({ x: sx / zoom + pan.x, z: sy / zoom + pan.y }), [pan, zoom]);

  useEffect(() => {
    const kd = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      const PAN_STEP = 0.5;
      if (e.key === ' ' && !ctrl) { e.preventDefault(); spaceHeld.current = true; return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setPan(p => ({ ...p, x: p.x - PAN_STEP })); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); setPan(p => ({ ...p, x: p.x + PAN_STEP })); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPan(p => ({ ...p, y: p.y - PAN_STEP })); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setPan(p => ({ ...p, y: p.y + PAN_STEP })); return; }
      if (ctrl && e.key.toLowerCase() === 'v') { e.preventDefault(); pegar({ x: stateRef.current.mousePos.x, z: stateRef.current.mousePos.z }, 'planta'); }
    };
    const ku = (e) => { if (e.key === ' ') spaceHeld.current = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [pegar]);

  const onMouseMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (panneando && panInicio) {
      setPan({ x: panInicio.panX - (sx - panInicio.sx) / zoom, y: panInicio.panY - (sy - panInicio.sy) / zoom }); return;
    }
    if (arrastrando) {
      const distPx = Math.hypot(sx - arrastrando.mouseIniPx.x, sy - arrastrando.mouseIniPx.y);
      if (distPx < DRAG_UMBRAL_PX && !arrastrando.moved) return;
      const w = screenToWorld(sx, sy);
      const posI = arrastrando.snapshotPosiciones[arrastrando.piezaAnclaId];
      const posIX = (arrastrando.categoriaAncla === 'diagonal' || arrastrando.categoriaAncla === 'diagonalPlanta') ? posI.x1 : posI.x;
      const posIZ = arrastrando.categoriaAncla === 'diagonalPlanta' ? posI.z1 : (posI.z ?? 0);
      const snapped = calcularSnapPlanta(w.x - arrastrando.offsetX, w.z - arrastrando.offsetZ, arrastrando.idsAMover);
      const dX = snapped.x - posIX, dZ = snapped.z - posIZ;
      moverPiezasZ(arrastrando.idsAMover, arrastrando.snapshotPosiciones, dX, dZ);
      setArrastrando(a => ({ ...a, moved: true })); return;
    }
    if (seleccionInicio) {
      if (Math.hypot(sx - seleccionInicio.sx, sy - seleccionInicio.sy) > 3) {
        const w = screenToWorld(sx, sy);
        setSeleccionRect({ x1: seleccionInicio.wx, z1: seleccionInicio.wz, x2: w.x, z2: w.z });
      }
    }
    const world = screenToWorld(sx, sy);
    setMousePos(calcularSnapPlanta(world.x, world.z));
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
      if (herramientaActiva.categoria === 'diagonal') return; // diagonales de alzado solo desde el Alzado
      if (herramientaActiva.categoria === 'diagonalPlanta') {
        if (!diagonalPlantaOrigen) setDiagonalPlantaOrigen({ x: mousePos.x, z: mousePos.z });
        else { colocarDiagonalPlanta(diagonalPlantaOrigen, { x: mousePos.x, z: mousePos.z }); setDiagonalPlantaOrigen(null); }
        return;
      }
      colocarPiezaPlanta(herramientaActiva, mousePos.x, mousePos.z);
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const w = screenToWorld(sx, sy);
    setSeleccionInicio({ sx, sy, wx: w.x, wz: w.z, shift: e.shiftKey });
  };

  const onMouseUp = () => {
    setPanneando(false);
    if (arrastrando) { if (arrastrando.moved) commitPiezasActuales(); setArrastrando(null); }
    if (seleccionInicio) {
      if (seleccionRect) {
        const xMin = Math.min(seleccionRect.x1, seleccionRect.x2), xMax = Math.max(seleccionRect.x1, seleccionRect.x2);
        const zMin = Math.min(seleccionRect.z1, seleccionRect.z2), zMax = Math.max(seleccionRect.z1, seleccionRect.z2);
        const ns = piezas.filter(p => { const b = piezaBoundsXZ(p); return !(b.xMax < xMin || b.xMin > xMax || b.zMax < zMin || b.zMin > zMax); }).map(p => p.id);
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
      const z = sw._zoom ?? 60, p = sw._pan ?? { x: 1, y: -1 };
      const s2w = (sx2, sy2) => ({ x: sx2 / z + p.x, z: sy2 / z + p.y });
      if (e.ctrlKey || e.metaKey) {
        const wa = s2w(sx, sy); const f = e.deltaY < 0 ? 1.08 : 0.93;
        const nz = Math.max(15, Math.min(220, z * f)); setZoom(nz);
        setPan({ x: wa.x - sx / nz, y: wa.z - sy / nz }); return;
      }
      if (Math.abs(e.deltaX) > 0 || !e.shiftKey) {
        setPan(pp => ({ x: pp.x + e.deltaX / z, y: pp.y + e.deltaY / z }));
      } else {
        const wa = s2w(sx, sy); const nz = Math.max(15, Math.min(220, z * (e.deltaY < 0 ? 1.15 : 0.87)));
        setZoom(nz); setPan({ x: wa.x - sx / nz, y: wa.z - sy / nz });
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
    ids.forEach(id => {
      const p = piezas.find(x => x.id === id); if (!p) return;
      if (p.categoria === 'diagonal') snap[id] = { x1: p.x1, x2: p.x2, z: p.z ?? 0 };
      else if (p.categoria === 'diagonalPlanta') snap[id] = { x1: p.x1, x2: p.x2, z1: p.z1, z2: p.z2 };
      else snap[id] = { x: p.x, z: p.z ?? 0 };
    });
    const offX = w.x - (pieza.categoria === 'diagonal' || pieza.categoria === 'diagonalPlanta' ? pieza.x1 : pieza.x);
    const offZ = w.z - (pieza.categoria === 'diagonalPlanta' ? pieza.z1 : (pieza.z ?? 0));
    setArrastrando({ idsAMover: ids, piezaAnclaId: pieza.id, categoriaAncla: pieza.categoria, offsetX: offX, offsetZ: offZ, snapshotPosiciones: snap, moved: false, mouseIniPx: { x: sx, y: sy } });
  };

  const worldVisible = useMemo(() => {
    const tl = screenToWorld(0, 0), br = screenToWorld(dimCanvas.w, dimCanvas.h);
    return { xMin: Math.min(br.x, tl.x), xMax: Math.max(br.x, tl.x), yMin: Math.min(br.z, tl.z), yMax: Math.max(br.z, tl.z) };
  }, [pan, zoom, dimCanvas, screenToWorld]);

  return (
    <div className={`flex-1 ${modoTecnico ? 'bg-white' : 'bg-gray-50'} relative overflow-hidden`}>
      <svg ref={svgRef} className="w-full h-full select-none" tabIndex={0}
        onMouseMove={onMouseMove} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown} onMouseUp={onMouseUp}
        style={{ cursor: panneando ? 'grabbing' : arrastrando ? 'grabbing' : herramientaActiva ? 'crosshair' : 'default' }}>
        {mostrarGrilla && <Grilla worldVisible={worldVisible} worldToScreen={worldToScreen} zoom={zoom} />}
        <LineaBase worldVisible={worldVisible} worldToScreen={worldToScreen} y={0} />
        {/* Ejes de columna verticales — números 1, 2, 3... basados en posiciones X de verticales */}
        {(() => {
          const xs = [...new Set(piezas.filter(p => p.categoria === 'vertical' || p.categoria === 'base').map(p => p.x))].sort((a, b) => a - b);
          if (!xs.length) return null;
          const r = 9;
          const ejeColor = modoTecnico ? '#333' : '#999';
          const ejeFill = modoTecnico ? '#444' : '#666';
          return xs.map((xw, i) => {
            const p1 = worldToScreen(xw, worldVisible.yMin);
            const p2 = worldToScreen(xw, worldVisible.yMax);
            const label = String(i + 1);
            return (
              <g key={`eje-x-${i}`}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ejeColor} strokeWidth="0.4" strokeDasharray="4 6" opacity="0.3" />
                <circle cx={p1.x} cy={8} r={r} fill="none" stroke={ejeColor} strokeWidth="1" />
                <text x={p1.x} y={12} fontSize="10" fill={ejeFill} textAnchor="middle" fontFamily="monospace" fontWeight="bold">{label}</text>
              </g>
            );
          });
        })()}
        {/* Guías horizontales para cada fila — ejes con círculos tipo plano profesional */}
        {filas.map(f => {
          const p1 = worldToScreen(worldVisible.xMin, f.z), p2 = worldToScreen(worldVisible.xMax, f.z);
          const r = 9;
          const filaColor = modoTecnico ? '#222' : '#E30613';
          return (
            <g key={f.id}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={filaColor} strokeWidth="0.6" strokeDasharray="6 4" opacity="0.3" />
              {/* Círculo eje izquierdo */}
              <circle cx={6} cy={p1.y} r={r} fill={filaColor} fillOpacity="0.9" stroke="none" />
              <text x={6} y={p1.y + 3.5} fontSize="10" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{f.nombre}</text>
              {/* Círculo eje derecho */}
              <circle cx={dimCanvas.w - 6} cy={p1.y} r={r} fill={filaColor} fillOpacity="0.9" stroke="none" />
              <text x={dimCanvas.w - 6} y={p1.y + 3.5} fontSize="10" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{f.nombre}</text>
            </g>
          );
        })}
        {piezas.map(p => (
          <g key={p.id}
            onMouseEnter={(e) => { if (!arrastrando && !herramientaActiva) setHoverPieza({ pieza: p, screenX: e.clientX, screenY: e.clientY }); }}
            onMouseLeave={() => setHoverPieza(null)}>
            <PiezaPlanta pieza={p} worldToScreen={worldToScreen} zoom={zoom}
              seleccionada={piezasSeleccionadas.includes(p.id)}
              otraAltura={(p.y ?? 0) !== alturaY}
              modoTecnico={modoTecnico}
              onMouseDown={(e) => onMouseDownPieza(e, p)} />
          </g>
        ))}
        {mouseEnCanvas && herramientaActiva && herramientaActiva.categoria !== 'diagonal' && herramientaActiva.categoria !== 'diagonalPlanta' && !panneando && !arrastrando && (
          <PiezaPlanta pieza={{ ...herramientaActiva, x: mousePos.x, z: mousePos.z, id: 'ghost', orientacion: orientacionActiva }} worldToScreen={worldToScreen} zoom={zoom} fantasma modoTecnico={modoTecnico} />
        )}
        {mouseEnCanvas && herramientaActiva?.categoria === 'diagonalPlanta' && diagonalPlantaOrigen && (() => {
          const pA = worldToScreen(diagonalPlantaOrigen.x, diagonalPlantaOrigen.z);
          const pB = worldToScreen(mousePos.x, mousePos.z);
          const cat = elegirDiagonalPlanta(mousePos.x - diagonalPlantaOrigen.x, mousePos.z - diagonalPlantaOrigen.z);
          const mid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
          return <g>
            <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke="#c026d3" strokeWidth="2" strokeDasharray="6 4" opacity="0.75" />
            <circle cx={pA.x} cy={pA.y} r="7" fill="none" stroke="#c026d3" strokeWidth="2" />
            <rect x={mid.x - 55} y={mid.y - 18} width="110" height="14" fill="#c026d3" rx="2" />
            <text x={mid.x} y={mid.y - 8} fontSize="9" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="bold">→ {cat.nombre.replace('Diagonal planta ', 'DP ')}</text>
          </g>;
        })()}
        {mostrarCotas && <CotasPlanta piezas={piezas} filas={filas} worldToScreen={worldToScreen} zoom={zoom} worldVisible={worldVisible} dimCanvas={dimCanvas} modoTecnico={modoTecnico} />}
        {seleccionRect && (() => {
          const p1 = worldToScreen(seleccionRect.x1, seleccionRect.z1), p2 = worldToScreen(seleccionRect.x2, seleccionRect.z2);
          return <rect x={Math.min(p1.x, p2.x)} y={Math.min(p1.y, p2.y)} width={Math.abs(p2.x - p1.x)} height={Math.abs(p2.y - p1.y)}
            fill="#3b82f6" fillOpacity="0.08" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 3" />;
        })()}
        {mouseEnCanvas && herramientaActiva && (mousePos.snapX || mousePos.snapZ) && (
          <IndicadoresSnap mousePos={{ x: mousePos.x, y: mousePos.z, snapX: mousePos.snapX, snapY: mousePos.snapZ }} worldToScreen={(wx, wy) => worldToScreen(wx, wy)} dimCanvas={dimCanvas} />
        )}
      </svg>
      {mouseEnCanvas && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded font-mono">
          X:{mousePos.x.toFixed(2)}m Z:{mousePos.z.toFixed(2)}m
          {mousePos.snapX && <span className="text-red-400 ml-1">◆X</span>}
          {mousePos.snapZ && <span className="text-red-400 ml-1">◆Z</span>}
        </div>
      )}
      {/* Badge altura Y activa */}
      <div className="absolute top-2 right-2 bg-blue-600/90 text-white text-xs font-bold px-3 py-1 rounded shadow">
        Altura Y = {alturaY.toFixed(2)}m
      </div>
      {/* Banner selección cruzada: piezas seleccionadas en otra altura */}
      {(() => {
        const selFuera = piezasSeleccionadas.filter(id => { const p = piezas.find(x => x.id === id); return p && (p.y ?? 0) !== alturaY; });
        if (!selFuera.length) return null;
        const alturas = [...new Set(selFuera.map(id => { const p = piezas.find(x => x.id === id); return (p?.y ?? 0); }))];
        return (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-purple-600/90 text-white text-[11px] px-3 py-1.5 rounded shadow flex items-center gap-2">
            <span>{selFuera.length} pieza(s) en otra altura</span>
            {alturas.map(a => (
              <button key={a} onClick={() => modelo.setAlturaY(a)}
                className="bg-white/20 hover:bg-white/40 px-2 py-0.5 rounded text-[10px] font-bold">
                → Y={a.toFixed(2)}m
              </button>
            ))}
          </div>
        );
      })()}
      <div className="absolute bottom-2 right-2 bg-white/95 border border-gray-300 text-[9px] text-gray-500 px-2 py-0.5 rounded">
        Vista de planta · Z = profundidad/fila · Esquemático preliminar
      </div>
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
            <div className="text-gray-300">{p.ref} · {p.peso} kg · Y={p.y?.toFixed(2) ?? '0.00'}m</div>
          </div>
        );
      })()}
    </div>
  );
}
