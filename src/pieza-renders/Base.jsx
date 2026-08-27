export default function Base({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo, tipoId } = pieza;
  if (tipoId === 'CO') {
    const p = worldToScreen(x, y);
    const ancho = Math.max(10, zoom * 0.16), alto = Math.max(4, zoom * 0.05);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={p.x - ancho / 2 - 3} y={p.y - alto / 2 - 3} width={ancho + 6} height={alto + 6} fill="none" stroke="#E30613" strokeWidth="2" />}
        <rect x={p.x - ancho / 2} y={p.y - alto / 2} width={ancho} height={alto} fill={sc} rx="1" />
        <circle cx={p.x} cy={p.y} r={Math.max(1, zoom * 0.02)} fill="#fff" />
      </g>
    );
  }
  const pB = worldToScreen(x, y), pT = worldToScreen(x, y + largo);
  const g = Math.max(3, zoom * 0.06);
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />
      <rect x={pB.x - 12} y={pB.y - 2} width="24" height="4" fill={sc} />
    </g>
  );
}
