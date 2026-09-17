// Truss de iluminación — estructura modular de aluminio 30×30cm
// Render: rectángulo con diagonales X internas (patrón clásico truss)
// Altura visual proporcional al zoom (no escala mundo real)
export default function Truss({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const h = Math.max(6, zoom * 0.1);         // altura visual del truss
  const sw = Math.max(1, zoom * 0.02);
  const w = pR.x - pL.x;

  // Segmentos X internos (patrón cruzado clásico)
  const nSeg = Math.max(2, Math.round(w / Math.max(12, zoom * 0.15)));
  const segW = w / nSeg;
  const xPats = [];
  for (let i = 0; i < nSeg; i++) {
    const sx = pL.x + i * segW;
    xPats.push(
      <g key={i}>
        <line x1={sx} y1={pL.y - h / 2} x2={sx + segW} y2={pL.y + h / 2} stroke={sc} strokeWidth={sw * 0.7} />
        <line x1={sx + segW} y1={pL.y - h / 2} x2={sx} y2={pL.y + h / 2} stroke={sc} strokeWidth={sw * 0.7} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={pL.x - 3} y={pL.y - h / 2 - 3} width={w + 6} height={h + 6}
        fill="none" stroke="#E30613" strokeWidth="2" strokeDasharray="4 2" />}
      {/* Cordones superior e inferior */}
      <line x1={pL.x} y1={pL.y - h / 2} x2={pR.x} y2={pR.y - h / 2}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      <line x1={pL.x} y1={pL.y + h / 2} x2={pR.x} y2={pR.y + h / 2}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      {/* Montantes extremos */}
      <line x1={pL.x} y1={pL.y - h / 2} x2={pL.x} y2={pL.y + h / 2}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      <line x1={pR.x} y1={pR.y - h / 2} x2={pR.x} y2={pR.y + h / 2}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      {/* Diagonales internas (X pattern) */}
      {xPats}
      {/* Cabezales cuña en extremos */}
      <rect x={pL.x - 4} y={pL.y - 5} width="8" height="10" fill={sc} rx="1" />
      <rect x={pR.x - 4} y={pR.y - 5} width="8" height="10" fill={sc} rx="1" />
      {/* Etiqueta en zoom alto */}
      {zoom > 45 && !modoTecnico && (
        <text x={(pL.x + pR.x) / 2} y={pL.y + h / 2 + 12}
          fontSize={Math.max(7, zoom * 0.07)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.6">
          🎤 {largo.toFixed(1)}m
        </text>
      )}
    </g>
  );
}
