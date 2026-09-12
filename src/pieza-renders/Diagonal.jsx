// Diagonal — tubo Ø48.3mm con extremos aplanados (bridas) y puntos de fijación.
// Efecto galvanizado: gradiente metálico con reflejos cilíndricos.
// Bridas como rectángulos aplastados orientados perpendicular al tubo.
export default function Diagonal({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x1, y1, x2, y2 } = pieza;
  const pA = worldToScreen(x1, y1), pB = worldToScreen(x2, y2);
  const g = Math.max(1.8, zoom * 0.038);
  const hlOff = g * 0.22;
  const gid = `dg-${pieza.id}`;

  // Ángulo de la diagonal para orientar las bridas
  const dx = pB.x - pA.x, dy = pB.y - pA.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = len > 0 ? -dy / len : 0;  // normal perpendicular
  const ny = len > 0 ? dx / len : 1;

  // Brida dimensions
  const bridaR = Math.max(3, zoom * 0.04);
  const bridaW = Math.max(1, zoom * 0.012);

  const tecW = Math.max(1, zoom * 0.012);

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
          stroke="#E30613" strokeWidth={tecW + 6} opacity="0.2" strokeLinecap="round" />}
        <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" />
        <circle cx={pA.x} cy={pA.y} r={Math.max(1.5, zoom * 0.018)} fill={sc} />
        <circle cx={pB.x} cy={pB.y} r={Math.max(1.5, zoom * 0.018)} fill={sc} />
      </g>
    );
  }

  // Ángulo en radianes para rotar el gradiente a lo largo del tubo
  const angle = Math.atan2(dy, dx);
  const cosA = Math.cos(angle + Math.PI / 2);
  const sinA = Math.sin(angle + Math.PI / 2);

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado perpendicular al tubo */}
      <defs>
        <linearGradient id={gid}
          x1={0.5 - cosA * 0.5} y1={0.5 - sinA * 0.5}
          x2={0.5 + cosA * 0.5} y2={0.5 + sinA * 0.5}>
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* Selección glow */}
      {seleccionada && <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
        stroke="#E30613" strokeWidth={g + 8} opacity="0.2" strokeLinecap="round" />}

      {/* Sombra */}
      <line x1={pA.x + hlOff * 1.2} y1={pA.y + hlOff * 1.2}
        x2={pB.x + hlOff * 1.2} y2={pB.y + hlOff * 1.2}
        stroke="#000" strokeWidth={g} strokeLinecap="round" opacity="0.06" />

      {/* Tubo principal */}
      <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
        stroke={sc} strokeWidth={g} strokeLinecap="round" />

      {/* Overlay galvanizado */}
      <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
        stroke={`url(#${gid})`} strokeWidth={g} strokeLinecap="round" />

      {/* Highlight cilíndrico */}
      <line x1={pA.x - nx * hlOff} y1={pA.y - ny * hlOff}
        x2={pB.x - nx * hlOff} y2={pB.y - ny * hlOff}
        stroke="#fff" strokeWidth={g * 0.22} strokeLinecap="round" opacity="0.35" />

      {/* Edge light */}
      <line x1={pA.x + nx * hlOff * 0.5} y1={pA.y + ny * hlOff * 0.5}
        x2={pB.x + nx * hlOff * 0.5} y2={pB.y + ny * hlOff * 0.5}
        stroke="#fff" strokeWidth={g * 0.06} strokeLinecap="round" opacity="0.12" />

      {/* Puntos de fijación (más detallados) */}
      <circle cx={pA.x} cy={pA.y} r={Math.max(1.8, zoom * 0.02)}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} />
      <circle cx={pB.x} cy={pB.y} r={Math.max(1.8, zoom * 0.02)}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} />

      {/* Bridas en extremos */}
      <line x1={pA.x - nx * bridaR} y1={pA.y - ny * bridaR}
        x2={pA.x + nx * bridaR} y2={pA.y + ny * bridaR}
        stroke={sc} strokeWidth={bridaW + 1.2} strokeLinecap="round" />
      <line x1={pB.x - nx * bridaR} y1={pB.y - ny * bridaR}
        x2={pB.x + nx * bridaR} y2={pB.y + ny * bridaR}
        stroke={sc} strokeWidth={bridaW + 1.2} strokeLinecap="round" />

      {/* Brillo bridas */}
      {zoom > 40 && <>
        <circle cx={pA.x - nx * bridaR * 0.3} cy={pA.y - ny * bridaR * 0.3}
          r={Math.max(0.5, zoom * 0.005)} fill="#fff" opacity="0.3" />
        <circle cx={pB.x - nx * bridaR * 0.3} cy={pB.y - ny * bridaR * 0.3}
          r={Math.max(0.5, zoom * 0.005)} fill="#fff" opacity="0.3" />
      </>}

      {/* Etiqueta: largo real de la diagonal (zoom medio+) */}
      {zoom > 40 && len > 30 && (() => {
        const largo = pieza.largo || Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const midX = (pA.x + pB.x) / 2;
        const midY = (pA.y + pB.y) / 2;
        const offDist = Math.max(8, zoom * 0.06);
        return (
          <text x={midX + nx * offDist} y={midY + ny * offDist}
            fontSize={Math.max(6, zoom * 0.045)} fill={sc} textAnchor="middle"
            fontFamily="monospace" opacity="0.4"
            dominantBaseline="middle">{largo.toFixed(2)}m</text>
        );
      })()}
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
