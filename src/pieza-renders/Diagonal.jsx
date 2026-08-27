export default function Diagonal({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x1, y1, x2, y2 } = pieza;
  const pA = worldToScreen(x1, y1), pB = worldToScreen(x2, y2);
  const g = Math.max(1.5, zoom * 0.035);
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
      <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />
      <circle cx={pA.x} cy={pA.y} r={Math.max(2, zoom * 0.03)} fill={sc} />
      <circle cx={pB.x} cy={pB.y} r={Math.max(2, zoom * 0.03)} fill={sc} />
    </g>
  );
}

export function PreviewDiagonal({ origen, destino, worldToScreen, catalogoElegirDiagonal }) {
  const pA = worldToScreen(origen.x, origen.y), pB = worldToScreen(destino.x, destino.y);
  const cat = catalogoElegirDiagonal(Math.abs(destino.x - origen.x), Math.abs(destino.y - origen.y));
  const mid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
  return (
    <g>
      <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 4" opacity="0.75" />
      <rect x={mid.x - 50} y={mid.y - 18} width="100" height="14" fill="#7c3aed" rx="2" />
      <text x={mid.x} y={mid.y - 8} fontSize="9" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="bold">→ {cat.nombre.replace('Diagonal ', 'D ')}</text>
    </g>
  );
}
