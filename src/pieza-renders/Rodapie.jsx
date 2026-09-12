// Rodapié — chapa vertical baja con borde superior doblado y fijaciones en extremos.
// Efecto galvanizado: gradiente metálico, sombras, highlights, clips mejorados.
export default function Rodapie({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;
  const h = Math.max(4, zoom * 0.04);         // altura chapa
  const foldH = Math.max(1, zoom * 0.01);     // doblez superior
  const clipW = Math.max(2, zoom * 0.02);     // ancho clip fijación
  const clipH = Math.max(3, zoom * 0.025);    // alto clip
  const gid = `rpg-${pieza.id}`;

  const tecW = Math.max(0.6, zoom * 0.008);

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 2} y={pL.y - h - foldH - 2} width={w + 4} height={h + foldH + clipH + 4}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        <rect x={pL.x} y={pL.y - h} width={w} height={h}
          fill="none" stroke={sc} strokeWidth={tecW} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="25%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="75%" stopColor="#000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {seleccionada && <rect x={pL.x - 2} y={pL.y - h - foldH - 2} width={w + 4} height={h + foldH + clipH + 4}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}

      {/* Sombra chapa */}
      <rect x={pL.x + 0.5} y={pL.y - h + 0.5} width={w} height={h}
        fill="#000" opacity="0.06" rx="0.5" />

      {/* Chapa principal */}
      <rect x={pL.x} y={pL.y - h} width={w} height={h}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.5" opacity="0.9" />

      {/* Overlay galvanizado */}
      <rect x={pL.x} y={pL.y - h} width={w} height={h}
        fill={`url(#${gid})`} rx="0.5" />

      {/* Highlight superior (brillo metálico) */}
      <line x1={pL.x + 1} y1={pL.y - h + 1} x2={pR.x - 1} y2={pL.y - h + 1}
        stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} opacity="0.3" />

      {/* Borde doblado superior (refuerzo) */}
      <line x1={pL.x} y1={pL.y - h} x2={pR.x} y2={pL.y - h}
        stroke={sc} strokeWidth={foldH + 1} strokeLinecap="butt" />
      {/* Línea marca de doblez */}
      <line x1={pL.x} y1={pL.y - h - foldH * 0.3} x2={pR.x} y2={pL.y - h - foldH * 0.3}
        stroke="#000" strokeWidth={Math.max(0.2, zoom * 0.002)} opacity="0.2" />

      {/* Clips de fijación mejorados */}
      <rect x={pL.x + 0.3} y={pL.y + 0.3} width={clipW} height={clipH}
        fill="#000" opacity="0.05" rx="0.3" />
      <rect x={pL.x} y={pL.y} width={clipW} height={clipH}
        fill={sc} stroke="#000" strokeWidth="0.3" opacity="0.7" rx="0.3" />
      {zoom > 35 && <line x1={pL.x + 0.3} y1={pL.y + 0.5} x2={pL.x + 0.3} y2={pL.y + clipH - 0.5}
        stroke="#fff" strokeWidth={0.3} opacity="0.2" />}

      <rect x={pR.x - clipW + 0.3} y={pR.y + 0.3} width={clipW} height={clipH}
        fill="#000" opacity="0.05" rx="0.3" />
      <rect x={pR.x - clipW} y={pR.y} width={clipW} height={clipH}
        fill={sc} stroke="#000" strokeWidth="0.3" opacity="0.7" rx="0.3" />
      {zoom > 35 && <line x1={pR.x - clipW + 0.3} y1={pR.y + 0.5} x2={pR.x - clipW + 0.3} y2={pR.y + clipH - 0.5}
        stroke="#fff" strokeWidth={0.3} opacity="0.2" />}

      {/* Etiqueta largo (zoom medio+) */}
      {zoom > 45 && w > 30 && (
        <text x={pL.x + w / 2} y={pL.y - h - foldH - 2}
          fontSize={Math.max(5, zoom * 0.04)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.4">{largo.toFixed(2)}m</text>
      )}
    </g>
  );
}
