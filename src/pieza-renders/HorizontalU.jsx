// Horizontal U — perfil U más liviano que Viga Puente. Misma forma, proporciones menores.
// Cabezales cuña + efecto galvanizado: gradiente metálico con reflejos.
export default function HorizontalU({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;
  const gid = `hug-${pieza.id}`;

  const g = Math.max(2.5, zoom * 0.05);      // grosor alma (más fino que VigaPuente)
  const alaH = Math.max(3, zoom * 0.035);    // altura ala
  const hlOff = g * 0.2;

  // Cabezal cuña (más chico que VigaPuente)
  const mW = Math.max(5, zoom * 0.05);
  const mH = Math.max(7, zoom * 0.065);
  const wdW = Math.max(2, zoom * 0.022);
  const wdH = Math.max(3.5, zoom * 0.035);
  const r = Math.max(0.5, zoom * 0.004);
  const showDetail = zoom > 45;

  const tecW = Math.max(1, zoom * 0.012);

  // Cabezal cuña reutilizable
  const renderCabezal = (px, py, key) => (
    <g key={key}>
      {/* Sombra manguito */}
      <rect x={px - mW / 2 + 0.5} y={py - mH / 2 + 0.5} width={mW} height={mH}
        fill="#000" opacity="0.06" rx={r} />
      {/* Manguito */}
      <rect x={px - mW / 2} y={py - mH / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx={r} opacity="0.92" />
      {/* Brillo metálico manguito */}
      <rect x={px - mW / 2 + 0.8} y={py - mH / 2 + 0.8}
        width={Math.max(1, mW * 0.22)} height={mH - 1.6}
        fill="#fff" opacity="0.25" rx={0.5} />
      {/* Línea ranura (slot) */}
      {showDetail && (
        <line x1={px - mW / 2 + 1} y1={py + mH * 0.15}
          x2={px + mW / 2 - 1} y2={py + mH * 0.15}
          stroke="#000" strokeWidth={0.4} opacity="0.2" />
      )}
      {/* Cuña colgante */}
      <rect x={px - wdW / 2} y={py + mH / 2} width={wdW} height={wdH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.85" rx={0.3} />
      {/* Brillo cuña */}
      {showDetail && (
        <line x1={px - wdW / 2 + 0.5} y1={py + mH / 2 + 0.5}
          x2={px - wdW / 2 + 0.5} y2={py + mH / 2 + wdH - 0.5}
          stroke="#fff" strokeWidth={0.4} opacity="0.2" />
      )}
    </g>
  );

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 3} y={pL.y - alaH - 3} width={w + 6} height={alaH + g + 6}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" opacity="0.3" />}
        {/* Alma */}
        <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="butt" />
        {/* Alas U extremos */}
        <line x1={pL.x} y1={pL.y + g * 0.3} x2={pL.x} y2={pL.y - alaH}
          stroke={sc} strokeWidth={tecW} />
        <line x1={pR.x} y1={pR.y + g * 0.3} x2={pR.x} y2={pR.y - alaH}
          stroke={sc} strokeWidth={tecW} />
        {/* Cabezales simplificados */}
        <line x1={pL.x} y1={pL.y - mH / 2} x2={pL.x} y2={pL.y + mH / 2}
          stroke={sc} strokeWidth={tecW} />
        <line x1={pR.x} y1={pR.y - mH / 2} x2={pR.x} y2={pR.y + mH / 2}
          stroke={sc} strokeWidth={tecW} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="65%" stopColor="#000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {seleccionada && <rect x={pL.x - 3} y={pL.y - alaH - 3} width={w + 6} height={alaH + mH / 2 + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" opacity="0.3" />}

      {/* ═══ Sombra alma ═══ */}
      <line x1={pL.x} y1={pL.y + hlOff * 1.2} x2={pR.x} y2={pR.y + hlOff * 1.2}
        stroke="#000" strokeWidth={g} strokeLinecap="butt" opacity="0.06" />

      {/* ═══ Alma (línea principal) ═══ */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke={sc} strokeWidth={g} strokeLinecap="butt" />
      {/* Overlay galvanizado */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke={`url(#${gid})`} strokeWidth={g} strokeLinecap="butt" />
      {/* Highlight */}
      <line x1={pL.x} y1={pL.y - hlOff} x2={pR.x} y2={pR.y - hlOff}
        stroke="#fff" strokeWidth={g * 0.22} strokeLinecap="butt" opacity="0.35" />
      {/* Edge light */}
      <line x1={pL.x} y1={pL.y + hlOff * 0.5} x2={pR.x} y2={pR.y + hlOff * 0.5}
        stroke="#fff" strokeWidth={g * 0.06} strokeLinecap="butt" opacity="0.12" />

      {/* ═══ Alas U extremos ═══ */}
      <line x1={pL.x} y1={pL.y + g * 0.3} x2={pL.x} y2={pL.y - alaH}
        stroke={sc} strokeWidth={Math.max(1, zoom * 0.013)} />
      <line x1={pR.x} y1={pR.y + g * 0.3} x2={pR.x} y2={pR.y - alaH}
        stroke={sc} strokeWidth={Math.max(1, zoom * 0.013)} />

      {/* ═══ Cabezales cuña ═══ */}
      {renderCabezal(pL.x, pL.y, 'cl')}
      {renderCabezal(pR.x, pR.y, 'cr')}

      {/* Etiqueta largo (zoom medio+) */}
      {zoom > 45 && w > 35 && (
        <text x={pL.x + w / 2} y={pL.y - alaH - 3}
          fontSize={Math.max(6, zoom * 0.045)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.4">U {largo.toFixed(2)}m</text>
      )}
    </g>
  );
}
