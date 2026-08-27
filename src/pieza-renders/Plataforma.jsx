export default function Plataforma({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const h = Math.max(5, zoom * 0.06); // espesor visual de la plataforma
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={pL.x} y={pL.y - h - 3} width={pR.x - pL.x} height={h + 6} fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
      <rect x={pL.x} y={pL.y - h} width={pR.x - pL.x} height={h} fill={sc} rx="1" stroke={seleccionada ? '#E30613' : '#4a1010'} strokeWidth="0.5" />
      {/* Textura: líneas horizontales finas simulando la rejilla */}
      {zoom > 35 && Array.from({ length: Math.max(1, Math.floor((pR.x - pL.x) / 12)) }).map((_, i) => (
        <line key={i} x1={pL.x + 6 + i * 12} y1={pL.y - h + 1} x2={pL.x + 6 + i * 12} y2={pL.y - 1} stroke="#4a1010" strokeWidth="0.3" opacity="0.5" />
      ))}
    </g>
  );
}
