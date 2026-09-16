import { useMemo } from 'react';
import { ES_TIPO_VERTICAL, ES_TIPO_HORIZONTAL } from '../catalogo/constantes.js';

/**
 * Cotas automáticas: líneas de dimensión entre verticales (distancias X) y entre
 * horizontales (alturas Y). Se renderiza como overlay SVG dentro del canvas del Alzado.
 *
 * Posicionamiento:
 *  - CotasX: debajo del Y=0 (suelo), ancladas a las posiciones X de verticales
 *  - CotasY: a la izquierda del X mínimo de piezas, ancladas a alturas Y reales
 */
export default function Cotas({ piezas, worldToScreen, zoom, worldVisible, dimCanvas, modoTecnico }) {
  // X mínimo real de las piezas (para anclar cotas Y)
  const xMinPiezas = useMemo(() => {
    const xs = piezas.filter(p => ES_TIPO_VERTICAL(p.categoria)).map(p => p.x);
    return xs.length ? Math.min(...xs) : 0;
  }, [piezas]);

  // --- Cotas horizontales (distancias X entre verticales) ---
  const cotasX = useMemo(() => {
    const xs = [...new Set(
      piezas.filter(p => ES_TIPO_VERTICAL(p.categoria)).map(p => p.x)
    )].sort((a, b) => a - b);
    if (xs.length < 2) return [];
    const cotas = [];
    for (let i = 0; i < xs.length - 1; i++) {
      cotas.push({ x1: xs[i], x2: xs[i + 1], dist: Math.abs(xs[i + 1] - xs[i]), nivel: 0 });
    }
    if (xs.length > 2) {
      cotas.push({ x1: xs[0], x2: xs[xs.length - 1], dist: Math.abs(xs[xs.length - 1] - xs[0]), esTotal: true, nivel: 1 });
    }
    return cotas;
  }, [piezas]);

  // --- Cotas verticales (alturas Y) ---
  const cotasY = useMemo(() => {
    const ys = [0];
    piezas.forEach(p => {
      if (ES_TIPO_HORIZONTAL(p.categoria) && p.orientacion !== 'z') ys.push(p.y);
      if (ES_TIPO_VERTICAL(p.categoria)) { ys.push(p.y); ys.push(p.y + p.largo); }
    });
    const unique = [...new Set(ys.map(y => parseFloat(y.toFixed(3))))].sort((a, b) => a - b);
    if (unique.length < 2) return [];
    const cotas = [];
    for (let i = 0; i < unique.length - 1; i++) {
      cotas.push({ y1: unique[i], y2: unique[i + 1], dist: Math.abs(unique[i + 1] - unique[i]), nivel: 0 });
    }
    if (unique.length > 2) {
      cotas.push({ y1: unique[0], y2: unique[unique.length - 1], dist: Math.abs(unique[unique.length - 1] - unique[0]), esTotal: true, nivel: 1 });
    }
    return cotas;
  }, [piezas]);

  const color = modoTecnico ? '#000' : '#6366f1';
  const colorTotal = modoTecnico ? '#333' : '#4f46e5';
  const fontSize = Math.max(8, Math.min(11, zoom * 0.14));
  const gap = Math.max(16, zoom * 0.25); // separación base entre niveles de cotas

  return (
    <g className="cotas-overlay" pointerEvents="none">
      {/* Cotas X — debajo del suelo (Y=0), cada nivel más abajo */}
      {cotasX.map((c, i) => {
        const p1 = worldToScreen(c.x1, 0);
        const p2 = worldToScreen(c.x2, 0);
        const yBase = p1.y + 8; // justo debajo de la línea de suelo en pantalla
        const yLine = yBase + gap * (c.nivel + 1);
        const label = c.dist.toFixed(2) + 'm';
        const sc = c.esTotal ? colorTotal : color;
        return (
          <g key={`cx-${i}`} opacity={c.esTotal ? 0.65 : 0.85}>
            {/* Líneas de extensión vertical */}
            <line x1={p1.x} y1={yBase} x2={p1.x} y2={yLine + 4} stroke={sc} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={p2.x} y1={yBase} x2={p2.x} y2={yLine + 4} stroke={sc} strokeWidth="0.5" strokeDasharray="2 2" />
            {/* Línea de cota horizontal */}
            <line x1={p1.x + 6} y1={yLine} x2={p2.x - 6} y2={yLine} stroke={sc} strokeWidth={c.esTotal ? 1.2 : 0.8} />
            {/* Flechas */}
            <polygon points={`${p1.x},${yLine} ${p1.x + 6},${yLine - 3} ${p1.x + 6},${yLine + 3}`} fill={sc} />
            <polygon points={`${p2.x},${yLine} ${p2.x - 6},${yLine - 3} ${p2.x - 6},${yLine + 3}`} fill={sc} />
            {/* Texto centrado */}
            <rect x={(p1.x + p2.x) / 2 - label.length * fontSize * 0.32} y={yLine - fontSize - 2}
              width={label.length * fontSize * 0.64} height={fontSize + 3} rx="1"
              fill={modoTecnico ? 'white' : '#f8fafc'} fillOpacity="0.95" stroke={sc} strokeWidth="0.3" />
            <text x={(p1.x + p2.x) / 2} y={yLine - 4} textAnchor="middle"
              fontSize={fontSize} fontFamily="monospace" fontWeight={c.esTotal ? 'bold' : 'normal'}
              fill={sc}>{label}</text>
          </g>
        );
      })}

      {/* Cotas Y — a la izquierda de la pieza más a la izquierda */}
      {cotasY.map((c, i) => {
        const p1 = worldToScreen(xMinPiezas, c.y1);
        const p2 = worldToScreen(xMinPiezas, c.y2);
        const xBase = p1.x - 10;
        const xLine = Math.max(16, xBase - gap * (c.nivel + 1));
        const label = c.dist.toFixed(2) + 'm';
        const sc = c.esTotal ? colorTotal : color;
        return (
          <g key={`cy-${i}`} opacity={c.esTotal ? 0.65 : 0.85}>
            {/* Líneas de extensión horizontal */}
            <line x1={xBase} y1={p1.y} x2={xLine - 4} y2={p1.y} stroke={sc} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={xBase} y1={p2.y} x2={xLine - 4} y2={p2.y} stroke={sc} strokeWidth="0.5" strokeDasharray="2 2" />
            {/* Línea de cota vertical */}
            <line x1={xLine} y1={p1.y - 6} x2={xLine} y2={p2.y + 6} stroke={sc} strokeWidth={c.esTotal ? 1.2 : 0.8} />
            {/* Flechas (arriba apunta arriba = menor Y en pantalla) */}
            <polygon points={`${xLine},${p2.y} ${xLine - 3},${p2.y + 6} ${xLine + 3},${p2.y + 6}`} fill={sc} />
            <polygon points={`${xLine},${p1.y} ${xLine - 3},${p1.y - 6} ${xLine + 3},${p1.y - 6}`} fill={sc} />
            {/* Texto rotado centrado en la cota */}
            {(() => {
              const midY = (p1.y + p2.y) / 2;
              const textW = label.length * fontSize * 0.64;
              const textH = fontSize + 3;
              return <>
                <rect x={xLine - textH / 2} y={midY - textW / 2} width={textH} height={textW} rx="1"
                  fill={modoTecnico ? 'white' : '#f8fafc'} fillOpacity="0.95" stroke={sc} strokeWidth="0.3" />
                <text x={xLine} y={midY} textAnchor="middle" dominantBaseline="central"
                  fontSize={fontSize} fontFamily="monospace" fontWeight={c.esTotal ? 'bold' : 'normal'}
                  fill={sc} transform={`rotate(-90 ${xLine} ${midY})`}>{label}</text>
              </>;
            })()}
          </g>
        );
      })}
    </g>
  );
}
