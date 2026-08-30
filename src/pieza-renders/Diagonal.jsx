// Diagonal — tubo con extremos aplanados (bridas) y puntos de fijación.
// Efecto 3D: sombra + highlight cilíndrico. Bridas como rectángulos aplastados.
export default function Diagonal({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x1, y1, x2, y2 } = pieza;
  const pA = worldToScreen(x1, y1), pB = worldToScreen(x2, y2);
  const g = Math.max(1.8, zoom * 0.038);
  const hlOff = g * 0.22;

  // Ángulo de la diagonal para orientar las bridas
  const dx = pB.x - pA.x, dy = pB.y - pA.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = len > 0 ? -dy / len : 0;  // normal perpendicular
  const ny = len > 0 ? dx / len : 1;

  // Brida dimensions
  const bridaR = Math.max(3, zoom * 0.04);
  const bridaW = Math.max(1, zoom * 0.012);

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
        stroke="#E30613" strokeWidth={g + 6} opacity="0.2" strokeLinecap="round" />}
      {/* Sombra */}
      <line x1={pA.x + hlOff} y1={pA.y + hlOff} x2={pB.x + hlOff} y2={pB.y + hlOff}
        stroke="#000" strokeWidth={g} strokeLinecap="round" opacity="0.06" />
      {/* Tubo diagonal */}
      <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
        stroke={sc} strokeWidth={g} strokeLinecap="round" />
      {/* Highlight */}
      <line x1={pA.x - hlOff * nx * 0.5} y1={pA.y - hlOff * ny * 0.5}
            x2={pB.x - hlOff * nx * 0.5} y2={pB.y - hlOff * ny * 0.5}
        stroke="#fff" strokeWidth={g * 0.28} strokeLinecap="round" opacity="0.3" />
      {/* Brida extremo A (aplastado) */}
      <line x1={pA.x - nx * bridaR} y1={pA.y - ny * bridaR}
            x2={pA.x + nx * bridaR} y2={pA.y + ny * bridaR}
        stroke={sc} strokeWidth={bridaW + 1} strokeLinecap="round" />
      <circle cx={pA.x} cy={pA.y} r={Math.max(1.5, zoom * 0.018)}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} />
      {/* Brida extremo B */}
      <line x1={pB.x - nx * bridaR} y1={pB.y - ny * bridaR}
            x2={pB.x + nx * bridaR} y2={pB.y + ny * bridaR}
        stroke={sc} strokeWidth={bridaW + 1} strokeLinecap="round" />
      <circle cx={pB.x} cy={pB.y} r={Math.max(1.5, zoom * 0.018)}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} />
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
