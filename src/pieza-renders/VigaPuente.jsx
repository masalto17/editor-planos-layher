export default function VigaPuente({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const g = Math.max(3, zoom * 0.065);
  const alaH = Math.max(3, zoom * 0.04);
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke="#E30613" strokeWidth={g + 8} opacity="0.25" strokeLinecap="round" />}
      {/* Perfil U: alma horizontal + dos alas arriba */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />
      <line x1={pL.x} y1={pL.y} x2={pL.x} y2={pL.y - alaH} stroke={sc} strokeWidth={g * 0.6} />
      <line x1={pR.x} y1={pR.y} x2={pR.x} y2={pR.y - alaH} stroke={sc} strokeWidth={g * 0.6} />
      {/* Indicador U en el centro */}
      <line x1={(pL.x + pR.x) / 2 - 4} y1={pL.y} x2={(pL.x + pR.x) / 2 - 4} y2={pL.y - alaH * 0.7} stroke={sc} strokeWidth={g * 0.4} />
      <line x1={(pL.x + pR.x) / 2 + 4} y1={pR.y} x2={(pL.x + pR.x) / 2 + 4} y2={pR.y - alaH * 0.7} stroke={sc} strokeWidth={g * 0.4} />
      {/* Cabezales cuña */}
      <rect x={pL.x - 4} y={pL.y - 5} width="8" height="10" fill={sc} rx="1" />
      <rect x={pR.x - 4} y={pR.y - 5} width="8" height="10" fill={sc} rx="1" />
    </g>
  );
}
