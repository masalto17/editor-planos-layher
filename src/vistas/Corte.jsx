import { useMemo } from 'react';
import { ES_TIPO_VERTICAL, ES_TIPO_HORIZONTAL } from '../catalogo/constantes.js';

/**
 * Vista de Corte Transversal — plano Y (altura) vs Z (profundidad/fila).
 * Muestra una sección a una posición X dada, con todas las filas visibles.
 *
 * Lo que se ve en un corte:
 *  - Verticales que pasan por ese X → línea vertical con rosetas + sección circular
 *  - Horizontales en eje X que cruzan ese X → círculo (perpendiculares al corte)
 *  - Horizontales en eje Z que están en ese X → línea horizontal (corren en profundidad)
 *  - Plataformas en ese X → rectángulo achurado (ancho = largo en Z si orientación z, o anchoPlat)
 *  - Diagonales que cruzan ese X → rombo/punto
 *  - Bases/husillos → bajo el suelo con placa
 *  - Collarines → rectángulo en base del vertical
 */
export default function VistaCorte({ piezas, filas, posX, zoom: zoomProp, modoTecnico, dimW, dimH }) {
  const W = dimW || 500;
  const H = dimH || 420;

  const { piezasCorte, zMin, zMax, yMin, yMax } = useMemo(() => {
    const tol = 0.05;
    const resultado = [];

    piezas.forEach(p => {
      const z = p.z ?? 0;

      // Verticales
      if (p.categoria === 'vertical') {
        if (Math.abs(p.x - posX) <= tol) {
          resultado.push({ tipo: 'vertical', z, yBase: p.y, yTop: p.y + p.largo, pieza: p });
        }
      }
      // Bases (husillos)
      else if (p.categoria === 'base') {
        if (Math.abs(p.x - posX) <= tol) {
          resultado.push({ tipo: 'base', z, y: p.y, largo: p.largo, pieza: p });
        }
      }
      // Collarines
      else if (p.categoria === 'collarin') {
        if (Math.abs(p.x - posX) <= tol) {
          resultado.push({ tipo: 'collarin', z, y: p.y, pieza: p });
        }
      }
      // Diagonales
      else if (p.categoria === 'diagonal') {
        const x1 = p.x, x2 = p.x2 ?? p.x;
        if ((posX >= Math.min(x1, x2) - tol) && (posX <= Math.max(x1, x2) + tol)) {
          // Interpolar Y en el punto de corte
          const t = x2 !== x1 ? (posX - x1) / (x2 - x1) : 0;
          const y1 = p.y, y2 = p.y2 ?? p.y;
          const yInterp = y1 + t * (y2 - y1);
          resultado.push({ tipo: 'diagonal', z, y: yInterp, pieza: p });
        }
      }
      // Horizontales y similares
      else if (ES_TIPO_HORIZONTAL(p.categoria)) {
        if (p.orientacion === 'z') {
          // Horizontal en Z: está en X=p.x, corre en Z
          if (Math.abs(p.x - posX) <= tol) {
            resultado.push({ tipo: 'horizontalZ', z0: z, z1: z + p.largo, y: p.y, pieza: p });
          }
        } else {
          // Horizontal en X: corre de p.x a p.x+largo
          if (posX >= p.x - tol && posX <= p.x + p.largo + tol) {
            if (p.categoria === 'plataforma') {
              resultado.push({ tipo: 'plataforma', z, y: p.y, ancho: p.anchoPlat || 0.32, pieza: p });
            } else {
              resultado.push({ tipo: 'horizontalX', z, y: p.y, pieza: p });
            }
          }
        }
      }
    });

    // Bounds
    const zs = [], ys = [0];
    resultado.forEach(r => {
      if (r.z !== undefined) zs.push(r.z);
      if (r.z0 !== undefined) { zs.push(r.z0); zs.push(r.z1); }
      if (r.yBase !== undefined) { ys.push(r.yBase); ys.push(r.yTop); }
      if (r.y !== undefined) ys.push(r.y);
      if (r.tipo === 'base') ys.push(r.y - r.largo); // husillo baja
    });
    filas.forEach(f => zs.push(f.z));

    return {
      piezasCorte: resultado,
      zMin: zs.length ? Math.min(...zs) : 0,
      zMax: zs.length ? Math.max(...zs) : 2.57,
      yMin: Math.min(...ys, -0.3),
      yMax: Math.max(...ys, 2),
    };
  }, [piezas, filas, posX]);

  // ─── Transformación mundo → pantalla ───
  const padZ = 0.8;
  const padYBot = 0.6; // espacio abajo para husillos
  const padYTop = 0.4;
  const rangoZ = Math.max(zMax - zMin + padZ * 2, 1.5);
  const rangoY = Math.max(yMax - yMin + padYBot + padYTop, 2);

  const headerH = 0; // sin título SVG interno, va en modal
  const cotaMargenIzq = 50; // px para cotas Y
  const cotaMargenBot = 30; // px para cotas Z
  const areaW = W - cotaMargenIzq - 20;
  const areaH = H - headerH - cotaMargenBot - 10;

  const escala = Math.min(areaW / rangoZ, areaH / rangoY) * 0.92;
  const oZ = zMin - padZ;
  const oY = yMin - padYBot;

  // Centro del dibujo
  const drawW = rangoZ * escala;
  const drawH = rangoY * escala;
  const offX = cotaMargenIzq + (areaW - drawW) / 2;
  const offY = (areaH - drawH) / 2;

  const toS = (z, y) => ({
    x: offX + (z - oZ) * escala,
    y: headerH + offY + drawH - (y - oY) * escala,
  });

  const m2px = m => m * escala;
  const tubeR = Math.max(3, m2px(0.024));
  const rosetaR = Math.max(2, tubeR * 0.6);
  const fontSize = Math.max(9, Math.min(12, escala * 0.1));

  // ─── Colores ───
  const col = modoTecnico ? {
    vert: '#222', horizO: '#444', horizZ: '#444', plat: '#333', vp: '#333',
    bar: '#555', base: '#333', coll: '#444', diag: '#444', suelo: '#000',
    cota: '#333', grid: '#ddd', fila: '#666', roseta: '#000',
  } : {
    vert: '#1e40af', horizO: '#059669', horizZ: '#059669', plat: '#7f1d1d',
    vp: '#b45309', bar: '#0891b2', base: '#78350f', coll: '#451a03',
    diag: '#7c3aed', suelo: '#374151', cota: '#4f46e5', grid: '#f0f0f0',
    fila: '#E30613', roseta: '#111',
  };

  const sueloY = toS(0, 0).y;

  return (
    <svg width={W} height={H} style={{ borderRadius: 4 }} className="bg-white">
      <defs>
        {/* Achurado de suelo */}
        <pattern id="hatch-suelo" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={col.suelo} strokeWidth="0.5" opacity="0.3" />
        </pattern>
        {/* Achurado plataforma */}
        <pattern id="hatch-plat" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={col.plat} strokeWidth="0.4" opacity="0.4" />
        </pattern>
        {/* Perfil U para vigas puente */}
        <marker id="corte-arrow-up" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
          <path d="M0,6 L3,0 L6,6" fill="none" stroke={col.cota} strokeWidth="1" />
        </marker>
        <marker id="corte-arrow-down" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
          <path d="M0,0 L3,6 L6,0" fill="none" stroke={col.cota} strokeWidth="1" />
        </marker>
      </defs>

      {/* ─── Grilla de fondo ─── */}
      {(() => {
        const lines = [];
        const step = escala > 50 ? 0.5 : 1;
        for (let z = Math.floor(oZ / step) * step; z <= zMax + padZ; z += step) {
          const p1 = toS(z, yMin - padYBot);
          const p2 = toS(z, yMax + padYTop);
          lines.push(<line key={`gz${z}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={col.grid} strokeWidth="0.5" />);
        }
        for (let y = Math.floor(oY / step) * step; y <= yMax + padYTop; y += step) {
          const p1 = toS(zMin - padZ, y);
          const p2 = toS(zMax + padZ, y);
          const isGround = Math.abs(y) < 0.001;
          if (!isGround) lines.push(<line key={`gy${y}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={col.grid} strokeWidth={y % 1 === 0 ? "0.8" : "0.5"} />);
        }
        return <g>{lines}</g>;
      })()}

      {/* ─── Suelo: línea gruesa + achurado debajo ─── */}
      {(() => {
        const p1 = toS(zMin - padZ, 0);
        const p2 = toS(zMax + padZ, 0);
        const pBot = toS(zMin - padZ, yMin - padYBot);
        return (
          <g>
            <rect x={p1.x} y={p1.y} width={p2.x - p1.x} height={pBot.y - p1.y}
              fill="url(#hatch-suelo)" />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={col.suelo} strokeWidth="2.5" />
          </g>
        );
      })()}

      {/* ─── Ejes de filas (líneas verticales punteadas) ─── */}
      {filas.map(f => {
        const pTop = toS(f.z, yMax + padYTop * 0.5);
        const pBot = toS(f.z, -0.15);
        const pLabel = toS(f.z, -0.35);
        return (
          <g key={`fila-${f.id}`}>
            <line x1={pTop.x} y1={pTop.y} x2={pBot.x} y2={pBot.y}
              stroke={col.fila} strokeWidth="0.8" strokeDasharray="6 3" opacity="0.4" />
            {/* Círculo con letra */}
            <circle cx={pLabel.x} cy={pLabel.y} r={fontSize * 0.85}
              fill="none" stroke={col.fila} strokeWidth="1.5" />
            <text x={pLabel.x} y={pLabel.y + fontSize * 0.35} textAnchor="middle"
              fontSize={fontSize} fontWeight="bold" fontFamily="monospace" fill={col.fila}>
              {f.nombre}
            </text>
          </g>
        );
      })}

      {/* ─── Bases (husillos) ─── */}
      {piezasCorte.filter(r => r.tipo === 'base').map((r, i) => {
        const pTop = toS(r.z, r.y);
        const pBot = toS(r.z, r.y - r.largo);
        const placaW = m2px(0.15); // placa base ~15cm
        const placaH = Math.max(3, m2px(0.02));
        return (
          <g key={`base-${i}`}>
            {/* Rosca del husillo */}
            <line x1={pBot.x} y1={pBot.y} x2={pTop.x} y2={pTop.y}
              stroke={col.base} strokeWidth="2" strokeDasharray="2 2" />
            {/* Placa base */}
            <rect x={pBot.x - placaW} y={pBot.y} width={placaW * 2} height={placaH}
              fill={col.base} stroke={col.base} strokeWidth="0.5" />
            {/* Tuerca regulable (rombo) */}
            <polygon points={`${pTop.x},${pTop.y - 4} ${pTop.x + 4},${pTop.y} ${pTop.x},${pTop.y + 4} ${pTop.x - 4},${pTop.y}`}
              fill={col.base} stroke="#fff" strokeWidth="0.5" />
          </g>
        );
      })}

      {/* ─── Collarines ─── */}
      {piezasCorte.filter(r => r.tipo === 'collarin').map((r, i) => {
        const p = toS(r.z, r.y);
        const w = m2px(0.06);
        const h = Math.max(3, m2px(0.02));
        return (
          <rect key={`coll-${i}`} x={p.x - w} y={p.y - h / 2} width={w * 2} height={h}
            fill={col.coll} stroke="#fff" strokeWidth="0.5" rx="1" />
        );
      })}

      {/* ─── Plataformas (rectángulo achurado) ─── */}
      {piezasCorte.filter(r => r.tipo === 'plataforma').map((r, i) => {
        const p = toS(r.z, r.y);
        const anchoScreen = Math.max(m2px(r.ancho), 6);
        const altoScreen = Math.max(4, m2px(0.05));
        return (
          <g key={`plat-${i}`}>
            <rect x={p.x - anchoScreen / 2} y={p.y - altoScreen}
              width={anchoScreen} height={altoScreen}
              fill={col.plat} opacity="0.15" stroke={col.plat} strokeWidth="1" />
            <rect x={p.x - anchoScreen / 2} y={p.y - altoScreen}
              width={anchoScreen} height={altoScreen}
              fill="url(#hatch-plat)" stroke="none" />
            {/* Etiqueta */}
            {anchoScreen > 20 && (
              <text x={p.x} y={p.y - altoScreen - 3} textAnchor="middle"
                fontSize={fontSize - 2} fill={col.plat} fontFamily="monospace" opacity="0.7">
                plat {r.ancho.toFixed(2)}m
              </text>
            )}
          </g>
        );
      })}

      {/* ─── Horizontales en Z (líneas que corren en profundidad) ─── */}
      {piezasCorte.filter(r => r.tipo === 'horizontalZ').map((r, i) => {
        const p1 = toS(r.z0, r.y);
        const p2 = toS(r.z1, r.y);
        const cat = r.pieza.categoria;
        const isVP = cat === 'vigaPuente';
        const isBar = cat === 'barandilla';
        const isRod = cat === 'rodapie';
        const sw = isVP ? 3 : isBar ? 1.2 : isRod ? 2 : 1.8;
        const dash = isBar ? '4 2' : 'none';
        const c = isVP ? col.vp : isBar ? col.bar : isRod ? col.plat : col.horizZ;

        return (
          <g key={`hz-${i}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={c} strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" />
            {/* Cabezales cuña en extremos */}
            {!isRod && (
              <>
                <rect x={p1.x - 2} y={p1.y - 3} width={4} height={6} fill={c} rx="0.5" />
                <rect x={p2.x - 2} y={p2.y - 3} width={4} height={6} fill={c} rx="0.5" />
              </>
            )}
            {/* Perfil U para vigas puente */}
            {isVP && (
              <>
                <path d={`M${p1.x - 3},${p1.y - 4} L${p1.x - 3},${p1.y + 4} L${p1.x + 3},${p1.y + 4} L${p1.x + 3},${p1.y - 4}`}
                  fill="none" stroke={c} strokeWidth="1.5" />
                <path d={`M${p2.x - 3},${p2.y - 4} L${p2.x - 3},${p2.y + 4} L${p2.x + 3},${p2.y + 4} L${p2.x + 3},${p2.y - 4}`}
                  fill="none" stroke={c} strokeWidth="1.5" />
              </>
            )}
          </g>
        );
      })}

      {/* ─── Horizontales en X (perpendiculares al corte → sección circular) ─── */}
      {piezasCorte.filter(r => r.tipo === 'horizontalX').map((r, i) => {
        const p = toS(r.z, r.y);
        const cat = r.pieza.categoria;
        const isVP = cat === 'vigaPuente';
        const isBar = cat === 'barandilla';
        const isRod = cat === 'rodapie';
        const c = isVP ? col.vp : isBar ? col.bar : isRod ? col.plat : col.horizO;

        if (isVP) {
          // Perfil U cortado — dibujar sección U
          const uw = Math.max(6, m2px(0.05));
          const uh = Math.max(8, m2px(0.07));
          return (
            <g key={`hx-${i}`}>
              <path d={`M${p.x - uw / 2},${p.y - uh / 2} L${p.x - uw / 2},${p.y + uh / 2} L${p.x + uw / 2},${p.y + uh / 2} L${p.x + uw / 2},${p.y - uh / 2}`}
                fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.5" />
              {/* Cruz de corte */}
              <line x1={p.x - 2} y1={p.y - 2} x2={p.x + 2} y2={p.y + 2} stroke={c} strokeWidth="0.8" />
              <line x1={p.x + 2} y1={p.y - 2} x2={p.x - 2} y2={p.y + 2} stroke={c} strokeWidth="0.8" />
            </g>
          );
        }

        if (isRod) {
          // Rodapié — sección rectangular baja
          const rw = Math.max(4, m2px(0.03));
          const rh = Math.max(6, m2px(0.15));
          return (
            <rect key={`hx-${i}`} x={p.x - rw / 2} y={p.y - rh} width={rw} height={rh}
              fill={col.plat} fillOpacity="0.3" stroke={col.plat} strokeWidth="1" />
          );
        }

        // Tubo circular cortado
        const rad = isBar ? tubeR * 0.8 : tubeR;
        return (
          <g key={`hx-${i}`}>
            <circle cx={p.x} cy={p.y} r={rad}
              fill="white" stroke={c} strokeWidth="1.5" />
            {/* Cruz de corte interior */}
            <line x1={p.x - rad * 0.5} y1={p.y - rad * 0.5}
              x2={p.x + rad * 0.5} y2={p.y + rad * 0.5} stroke={c} strokeWidth="0.6" />
            <line x1={p.x + rad * 0.5} y1={p.y - rad * 0.5}
              x2={p.x - rad * 0.5} y2={p.y + rad * 0.5} stroke={c} strokeWidth="0.6" />
          </g>
        );
      })}

      {/* ─── Verticales con rosetas ─── */}
      {piezasCorte.filter(r => r.tipo === 'vertical').map((r, i) => {
        const pBase = toS(r.z, r.yBase);
        const pTop = toS(r.z, r.yTop);
        // Rosetas cada 0.50m
        const rosetas = [];
        for (let y = r.yBase; y <= r.yTop + 0.001; y += 0.50) {
          rosetas.push(y);
        }
        return (
          <g key={`vert-${i}`}>
            {/* Tubo vertical */}
            <line x1={pBase.x} y1={pBase.y} x2={pTop.x} y2={pTop.y}
              stroke={col.vert} strokeWidth="3" strokeLinecap="round" />
            {/* Rosetas */}
            {rosetas.map((ry, j) => {
              const pr = toS(r.z, ry);
              return (
                <g key={`ros-${j}`}>
                  <circle cx={pr.x} cy={pr.y} r={rosetaR + 1}
                    fill="white" stroke={col.roseta} strokeWidth="1.2" />
                  <circle cx={pr.x} cy={pr.y} r={1}
                    fill={col.roseta} />
                </g>
              );
            })}
            {/* Sección circular arriba */}
            <circle cx={pTop.x} cy={pTop.y} r={tubeR}
              fill={col.vert} stroke="white" strokeWidth="1" />
          </g>
        );
      })}

      {/* ─── Diagonales (rombo en punto de intersección) ─── */}
      {piezasCorte.filter(r => r.tipo === 'diagonal').map((r, i) => {
        const p = toS(r.z, r.y);
        const s = Math.max(4, tubeR);
        return (
          <g key={`diag-${i}`}>
            <polygon points={`${p.x},${p.y - s} ${p.x + s},${p.y} ${p.x},${p.y + s} ${p.x - s},${p.y}`}
              fill={col.diag} fillOpacity="0.3" stroke={col.diag} strokeWidth="1.2" />
            <text x={p.x + s + 3} y={p.y + 3} fontSize={fontSize - 2}
              fill={col.diag} fontFamily="monospace" opacity="0.7">↗</text>
          </g>
        );
      })}

      {/* ─── Cotas Y (izquierda) ─── */}
      {(() => {
        // Recoger alturas significativas
        const ySet = new Set([0]);
        piezasCorte.forEach(r => {
          if (r.tipo === 'vertical') { ySet.add(r.yBase); ySet.add(r.yTop); }
          if (r.tipo === 'plataforma' || r.tipo === 'horizontalX' || r.tipo === 'horizontalZ') ySet.add(r.y);
        });
        const ys = [...ySet].filter(y => y >= 0).sort((a, b) => a - b);
        if (ys.length < 2) return null;

        const xLine = cotaMargenIzq - 20;
        return (
          <g>
            {/* Línea vertical de cotas */}
            <line x1={xLine} y1={toS(0, ys[0]).y} x2={xLine} y2={toS(0, ys[ys.length - 1]).y}
              stroke={col.cota} strokeWidth="0.8" />
            {ys.map((y, i) => {
              const py = toS(0, y).y;
              return (
                <g key={`cy-${i}`}>
                  {/* Tick horizontal */}
                  <line x1={xLine - 4} y1={py} x2={xLine + 4} y2={py}
                    stroke={col.cota} strokeWidth="0.8" />
                  {/* Etiqueta */}
                  <text x={xLine - 6} y={py + 3} textAnchor="end"
                    fontSize={fontSize - 1} fontFamily="monospace" fill={col.cota} fontWeight="bold">
                    {y.toFixed(2)}
                  </text>
                </g>
              );
            })}
            {/* Distancias entre niveles */}
            {ys.slice(0, -1).map((y, i) => {
              const y2 = ys[i + 1];
              if (y2 - y < 0.1) return null;
              const py1 = toS(0, y).y;
              const py2 = toS(0, y2).y;
              const midY = (py1 + py2) / 2;
              const dist = (y2 - y).toFixed(2);
              return (
                <text key={`cd-${i}`} x={xLine - 6} y={midY + 3} textAnchor="end"
                  fontSize={fontSize - 2} fontFamily="monospace" fill={col.cota} opacity="0.6">
                  ↕{dist}
                </text>
              );
            })}
          </g>
        );
      })()}

      {/* ─── Cotas Z (abajo, entre filas) ─── */}
      {(() => {
        if (filas.length < 2) return null;
        const sorted = [...filas].sort((a, b) => a.z - b.z);
        const yLine = H - cotaMargenBot + 10;
        return sorted.slice(0, -1).map((f, i) => {
          const f2 = sorted[i + 1];
          const p1 = toS(f.z, 0);
          const p2 = toS(f2.z, 0);
          const dist = (f2.z - f.z).toFixed(2) + 'm';
          const midX = (p1.x + p2.x) / 2;
          return (
            <g key={`cotaz-${i}`}>
              <line x1={p1.x} y1={yLine} x2={p2.x} y2={yLine}
                stroke={col.cota} strokeWidth="0.8" />
              <line x1={p1.x} y1={yLine - 4} x2={p1.x} y2={yLine + 4}
                stroke={col.cota} strokeWidth="0.8" />
              <line x1={p2.x} y1={yLine - 4} x2={p2.x} y2={yLine + 4}
                stroke={col.cota} strokeWidth="0.8" />
              <text x={midX} y={yLine + fontSize + 2} textAnchor="middle"
                fontSize={fontSize} fontFamily="monospace" fill={col.cota} fontWeight="bold">
                {dist}
              </text>
            </g>
          );
        });
      })()}

      {/* ─── Leyenda inferior ─── */}
      <text x={W - 8} y={H - 6} textAnchor="end" fontSize="8" fill="#999" fontFamily="monospace">
        Corte Y-Z · {piezasCorte.length} elem · X={posX.toFixed(2)}m
      </text>
    </svg>
  );
}
