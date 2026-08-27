export default function Rodapie({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const h = Math.max(3, zoom * 0.035);
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={pL.x} y={pL.y - h - 2} width={pR.x - pL.x} height={h + 4} fill="none" stroke="#E30613" strokeWidth="2" />}
      <rect x={pL.x} y={pL.y - h} width={pR.x - pL.x} height={h} fill={sc} stroke={sc} strokeWidth="0.5" rx="0.5" />
    </g>
  );
}
