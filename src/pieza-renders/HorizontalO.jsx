// Horizontal O (tubo) y Barandilla — tubo Ø48.3mm con cabezales cuña AutoLock.
// Efecto galvanizado: gradiente metálico con reflejos especulares.
// Cabezales con manguito + cuña colgante + detalle de ranura.
export default function HorizontalO({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, categoria } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const isDashed = categoria === 'barandilla';
  const gid = `hg-${pieza.id}`;

  const tubeW = Math.max(2, zoom * 0.045);
  const hlOff = tubeW * 0.22;
  const dash = isDashed ? `${Math.max(6, zoom * 0.08)} ${Math.max(3, zoom * 0.04)}` : 'none';

  // Cabezal cuña dimensiones
  const mW = Math.max(5, zoom * 0.055);    // ancho manguito
  const mH = Math.max(7, zoom * 0.07);     // alto manguito
  const wW = Math.max(2.5, zoom * 0.025);  // ancho cuña
  const wH = Math.max(4, zoom * 0.04);     // largo cuña colgante
  const r = Math.max(0.5, zoom * 0.005);   // radio borde manguito

  const tecW = Math.max(1, zoom * 0.015); // stroke fino modo técnico
  const showDetail = zoom > 45; // detalle cuña/ranura

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
          stroke="#E30613" strokeWidth={tecW + 6} opacity="0.2" strokeLinecap="round" />}
        <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="butt" strokeDasharray={dash} />
        <line x1={pL.x} y1={pL.y - mH / 2} x2={pL.x} y2={pL.y + mH / 2}
          stroke={sc} strokeWidth={tecW * 1.5} />
        <line x1={pR.x} y1={pR.y - mH / 2} x2={pR.x} y2={pR.y + mH / 2}
          stroke={sc} strokeWidth={tecW * 1.5} />
      </g>
    );
  }

  // Cabezal cuña detallado (un lado)
  const renderCabezal = (px, py, key) => (
    <g key={key}>
      {/* Sombra del manguito */}
      <rect x={px - mW / 2 + 0.5} y={py - mH / 2 + 0.5} width={mW} height={mH}
        fill="#000" opacity="0.06" rx={r} />
      {/* Manguito (coupling sleeve) */}
      <rect x={px - mW / 2} y={py - mH / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.004)} rx={r}
        opacity="0.92" />
      {/* Brillo metálico manguito */}
      <rect x={px - mW / 2 + 0.8} y={py - mH / 2 + 0.8}
        width={Math.max(1.5, mW * 0.22)} height={mH - 1.6}
        fill="#fff" opacity="0.25" rx={0.5} />
      {/* Línea central ranura (donde entra la cuña) */}
      {showDetail && (
        <line x1={px - mW / 2 + 1} y1={py + mH * 0.15}
          x2={px + mW / 2 - 1} y2={py + mH * 0.15}
          stroke="#000" strokeWidth={0.4} opacity="0.2" />
      )}
      {/* Cuña colgante */}
      <rect x={px - wW / 2} y={py + mH / 2} width={wW} height={wH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)}
        opacity="0.85" rx={0.3} />
      {/* Brillo cuña */}
      {showDetail && (
        <line x1={px - wW / 2 + 0.5} y1={py + mH / 2 + 0.5}
          x2={px - wW / 2 + 0.5} y2={py + mH / 2 + wH - 0.5}
          stroke="#fff" strokeWidth={0.4} opacity="0.2" />
      )}
    </g>
  );

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado horizontal */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* Selección glow */}
      {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke="#E30613" strokeWidth={tubeW + 8} opacity="0.2" strokeLinecap="round" />}
      {/* Sombra inferior */}
      <line x1={pL.x} y1={pL.y + hlOff * 1.3} x2={pR.x} y2={pR.y + hlOff * 1.3}
        stroke="#000" strokeWidth={tubeW} strokeLinecap="butt" opacity="0.06"
        strokeDasharray={dash} />
      {/* Tubo principal */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke={sc} strokeWidth={tubeW} strokeLinecap="butt"
        strokeDasharray={dash} />
      {/* Overlay galvanizado */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke={`url(#${gid})`} strokeWidth={tubeW} strokeLinecap="butt"
        strokeDasharray={dash} />
      {/* Highlight superior (brillo cilindro) */}
      <line x1={pL.x} y1={pL.y - hlOff} x2={pR.x} y2={pR.y - hlOff}
        stroke="#fff" strokeWidth={tubeW * 0.22} strokeLinecap="butt" opacity="0.4"
        strokeDasharray={dash} />
      {/* Edge light inferior */}
      <line x1={pL.x} y1={pL.y + hlOff * 0.5} x2={pR.x} y2={pR.y + hlOff * 0.5}
        stroke="#fff" strokeWidth={tubeW * 0.06} strokeLinecap="butt" opacity="0.12"
        strokeDasharray={dash} />

      {/* Cabezales cuña */}
      {renderCabezal(pL.x, pL.y, 'cl')}
      {renderCabezal(pR.x, pR.y, 'cr')}

      {/* Etiqueta largo (zoom medio+) */}
      {zoom > 45 && (pR.x - pL.x) > 40 && (
        <text x={(pL.x + pR.x) / 2} y={pL.y - tubeW - 3}
          fontSize={Math.max(6, zoom * 0.05)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.4">{largo.toFixed(2)}m</text>
      )}
    </g>
  );
}
