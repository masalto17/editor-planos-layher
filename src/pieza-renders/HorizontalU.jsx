export default function HorizontalU({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const g = Math.max(2.5, zoom * 0.055);
  const alaH = Math.max(2, zoom * 0.03);
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" />}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />
      <line x1={pL.x} y1={pL.y} x2={pL.x} y2={pL.y - alaH} stroke={sc} strokeWidth={g * 0.5} />
      <line x1={pR.x} y1={pR.y} x2={pR.x} y2={pR.y - alaH} stroke={sc} strokeWidth={g * 0.5} />
      <rect x={pL.x - 3} y={pL.y - 4} width="6" height="8" fill={sc} />
      <rect x={pR.x - 3} y={pR.y - 4} width="6" height="8" fill={sc} />
    </g>
  );
}
