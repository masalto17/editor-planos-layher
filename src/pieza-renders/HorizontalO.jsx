export default function HorizontalO({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo, categoria } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const g = Math.max(2, zoom * 0.045);
  const isDashed = categoria === 'barandilla';
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke={sc} strokeWidth={g} strokeLinecap="round" strokeDasharray={isDashed ? '8 4' : 'none'} />
      <rect x={pL.x - 3} y={pL.y - 4} width="6" height="8" fill={sc} />
      <rect x={pR.x - 3} y={pR.y - 4} width="6" height="8" fill={sc} />
    </g>
  );
}
