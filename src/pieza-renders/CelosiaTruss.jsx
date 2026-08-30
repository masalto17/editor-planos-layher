// Celosía / Truss: viga reticulada — rectángulo con diagonales internas (X pattern)
export default function CelosiaTruss({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const h = Math.max(6, zoom * 0.1);         // altura visual de la celosía
  const isTruss = pieza.categoria === 'truss';
  const sw = isTruss ? Math.max(1, zoom * 0.02) : Math.max(1.5, zoom * 0.03);
  const w = pR.x - pL.x;
  // Segmentos X internos
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
      {seleccionada && <rect x={pL.x - 3} y={pL.y - h / 2 - 3} width={w + 6} height={h + 6} fill="none" stroke="#E30613" strokeWidth="2" />}
      {/* Cordones superior e inferior */}
      <line x1={pL.x} y1={pL.y - h / 2} x2={pR.x} y2={pR.y - h / 2} stroke={sc} strokeWidth={sw} />
      <line x1={pL.x} y1={pL.y + h / 2} x2={pR.x} y2={pR.y + h / 2} stroke={sc} strokeWidth={sw} />
      {/* Montantes extremos */}
      <line x1={pL.x} y1={pL.y - h / 2} x2={pL.x} y2={pL.y + h / 2} stroke={sc} strokeWidth={sw} />
      <line x1={pR.x} y1={pR.y - h / 2} x2={pR.x} y2={pR.y + h / 2} stroke={sc} strokeWidth={sw} />
      {/* Diagonales internas */}
      {xPats}
      {/* Cabezales cuña */}
      <rect x={pL.x - 4} y={pL.y - 5} width="8" height="10" fill={sc} rx="1" />
      <rect x={pR.x - 4} y={pR.y - 5} width="8" height="10" fill={sc} rx="1" />
    </g>
  );
}
