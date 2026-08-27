import { useMemo } from 'react';
import { ES_TIPO_VERTICAL } from '../catalogo/constantes.js';

/**
 * Cotas automáticas para la vista de Planta (plano X-Z).
 *
 * - CotasX: distancias entre posiciones X de verticales (debajo de la fila más baja, Z máximo)
 * - CotasZ: distancias entre filas/posiciones Z de verticales (a la izquierda del X mínimo)
 */
export default function CotasPlanta({ piezas, filas, worldToScreen, zoom, worldVisible, dimCanvas, modoTecnico }) {
  // Posiciones X únicas de verticales
  const xPositions = useMemo(() => {
    const xs = [...new Set(
      piezas.filter(p => ES_TIPO_VERTICAL(p.categoria)).map(p => p.x)
    )].sort((a, b) => a - b);
    return xs;
  }, [piezas]);

  // Posiciones Z únicas de verticales (o filas definidas)
  const zPositions = useMemo(() => {
    // Usar posiciones Z reales de verticales colocados
    const zVerts = [...new Set(
      piezas.filter(p => ES_TIPO_VERTICAL(p.categoria)).map(p => p.z ?? 0)
    )];
    // Agregar posiciones Z de filas definidas aunque no tengan verticales
    filas.forEach(f => { if (!zVerts.includes(f.z)) zVerts.push(f.z); });
    return zVerts.sort((a, b) => a - b);
  }, [piezas, filas]);

  // Cotas X
  const cotasX = useMemo(() => {
    if (xPositions.length < 2) return [];
    const cotas = [];
    for (let i = 0; i < xPositions.length - 1; i++) {
      cotas.push({ x1: xPositions[i], x2: xPositions[i + 1], dist: Math.abs(xPositions[i + 1] - xPositions[i]), nivel: 0 });
    }
    if (xPositions.length > 2) {
      cotas.push({ x1: xPositions[0], x2: xPositions[xPositions.length - 1], dist: Math.abs(xPositions[xPositions.length - 1] - xPositions[0]), esTotal: true, nivel: 1 });
    }
    return cotas;
  }, [xPositions]);

  // Cotas Z (profundidad entre filas)
  const cotasZ = useMemo(() => {
    if (zPositions.length < 2) return [];
    const cotas = [];
    for (let i = 0; i < zPositions.length - 1; i++) {
      cotas.push({ z1: zPositions[i], z2: zPositions[i + 1], dist: Math.abs(zPositions[i + 1] - zPositions[i]), nivel: 0 });
    }
    if (zPositions.length > 2) {
      cotas.push({ z1: zPositions[0], z2: zPositions[zPositions.length - 1], dist: Math.abs(zPositions[zPositions.length - 1] - zPositions[0]), esTotal: true, nivel: 1 });
    }
    return cotas;
  }, [zPositions]);

  const color = modoTecnico ? '#000' : '#6366f1';
  const colorTotal = modoTecnico ? '#333' : '#4f46e5';
  const fontSize = Math.max(8, Math.min(11, zoom * 0.14));
  const gap = Math.max(16, zoom * 0.25);

  // Referencia Z máxima para anclar cotas X (debajo de la fila más baja en pantalla)
  const zMaxRef = zPositions.length ? Math.max(...zPositions) : 0;
  // Referencia X mínima para anclar cotas Z
  const xMinRef = xPositions.length ? Math.min(...xPositions) : 0;

  return (
    <g className="cotas-planta-overlay" pointerEvents="none">
      {/* Cotas X — debajo de la Z máxima */}
      {cotasX.map((c, i) => {
        const p1 = worldToScreen(c.x1, zMaxRef);
        const p2 = worldToScreen(c.x2, zMaxRef);
        const yBase = p1.y + 8;
        const yLine = yBase + gap * (c.nivel + 1);
        const label = c.dist.toFixed(2) + 'm';
        const sc = c.esTotal ? colorTotal : color;
        return (
          <g key={`cpx-${i}`} opacity={c.esTotal ? 0.65 : 0.85}>
            <line x1={p1.x} y1={yBase} x2={p1.x} y2={yLine + 4} stroke={sc} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={p2.x} y1={yBase} x2={p2.x} y2={yLine + 4} stroke={sc} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={p1.x + 6} y1={yLine} x2={p2.x - 6} y2={yLine} stroke={sc} strokeWidth={c.esTotal ? 1.2 : 0.8} />
            <polygon points={`${p1.x},${yLine} ${p1.x + 6},${yLine - 3} ${p1.x + 6},${yLine + 3}`} fill={sc} />
            <polygon points={`${p2.x},${yLine} ${p2.x - 6},${yLine - 3} ${p2.x - 6},${yLine + 3}`} fill={sc} />
            <rect x={(p1.x + p2.x) / 2 - label.length * fontSize * 0.32} y={yLine - fontSize - 2}
              width={label.length * fontSize * 0.64} height={fontSize + 3} rx="1"
              fill={modoTecnico ? 'white' : '#f8fafc'} fillOpacity="0.95" stroke={sc} strokeWidth="0.3" />
            <text x={(p1.x + p2.x) / 2} y={yLine - 4} textAnchor="middle"
              fontSize={fontSize} fontFamily="monospace" fontWeight={c.esTotal ? 'bold' : 'normal'}
              fill={sc}>{label}</text>
          </g>
        );
      })}

      {/* Cotas Z — a la izquierda del X mínimo (distancias entre filas/profundidad) */}
      {cotasZ.map((c, i) => {
        const p1 = worldToScreen(xMinRef, c.z1);
        const p2 = worldToScreen(xMinRef, c.z2);
        const xBase = p1.x - 10;
        const xLine = Math.max(16, xBase - gap * (c.nivel + 1));
        const label = c.dist.toFixed(2) + 'm';
        const sc = c.esTotal ? colorTotal : color;
        // En planta, Z crece hacia abajo en pantalla (sin flip), así que p2.y > p1.y
        const yTop = Math.min(p1.y, p2.y);
        const yBot = Math.max(p1.y, p2.y);
        return (
          <g key={`cpz-${i}`} opacity={c.esTotal ? 0.65 : 0.85}>
            <line x1={xBase} y1={p1.y} x2={xLine - 4} y2={p1.y} stroke={sc} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={xBase} y1={p2.y} x2={xLine - 4} y2={p2.y} stroke={sc} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={xLine} y1={yTop + 6} x2={xLine} y2={yBot - 6} stroke={sc} strokeWidth={c.esTotal ? 1.2 : 0.8} />
            <polygon points={`${xLine},${yTop} ${xLine - 3},${yTop + 6} ${xLine + 3},${yTop + 6}`} fill={sc} />
            <polygon points={`${xLine},${yBot} ${xLine - 3},${yBot - 6} ${xLine + 3},${yBot - 6}`} fill={sc} />
            {(() => {
              const midY = (yTop + yBot) / 2;
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
