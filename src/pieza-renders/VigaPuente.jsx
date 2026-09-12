// Viga Puente U — perfil abierto U representado como DOS LÍNEAS PARALELAS horizontales
// (ala superior y alma inferior) unidas por alas verticales en extremos, como en planos
// profesionales tipo Balastegui. Cabezales cuña en cada extremo.
// Efecto galvanizado: gradiente metálico con reflejos especulares.
export default function VigaPuente({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;
  const gid = `vpg-${pieza.id}`;

  // Separación entre las dos líneas = altura del perfil U
  const sep = Math.max(4, zoom * 0.055);      // separación ala-alma
  const lineW = Math.max(1.2, zoom * 0.022);  // grosor cada línea
  const alaW = Math.max(1, zoom * 0.015);     // grosor alas verticales (extremos)
  const hlOff = lineW * 0.3;

  // Cabezal cuña (manguito + cuña colgante)
  const mW = Math.max(6, zoom * 0.06);
  const mH = Math.max(8, zoom * 0.08);
  const wdW = Math.max(2.5, zoom * 0.025);
  const wdH = Math.max(4, zoom * 0.04);
  const r = Math.max(0.5, zoom * 0.005);
  const showDetail = zoom > 45;

  // Y superior (ala) e inferior (alma) — la pieza se ancla por su eje (y) que es alma
  const yAlma = pL.y;            // línea inferior (alma)
  const yAla = pL.y - sep;       // línea superior (ala/pestaña)

  // Alas verticales intermedias para reforzar lectura de perfil U (cada ~60px)
  const alasInt = [];
  if (zoom > 18) {
    const step = Math.max(28, zoom * 0.35);
    for (let px = pL.x + step; px < pR.x - step * 0.4; px += step) {
      alasInt.push(
        <line key={px} x1={px} y1={yAla} x2={px} y2={yAlma}
          stroke={sc} strokeWidth={alaW * 0.7} opacity="0.25" />
      );
    }
  }

  const tecW = Math.max(1, zoom * 0.012);

  // Cabezal cuña detallado (reutilizable)
  const renderCabezal = (px, py, key) => (
    <g key={key}>
      {/* Sombra manguito */}
      <rect x={px - mW / 2 + 0.5} y={py - mH / 2 + sep / 2 + 0.5} width={mW} height={mH}
        fill="#000" opacity="0.06" rx={r} />
      {/* Manguito */}
      <rect x={px - mW / 2} y={py - mH / 2 + sep / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.004)} rx={r} opacity="0.92" />
      {/* Brillo metálico manguito */}
      <rect x={px - mW / 2 + 0.8} y={py - mH / 2 + sep / 2 + 0.8}
        width={Math.max(1.5, mW * 0.22)} height={mH - 1.6}
        fill="#fff" opacity="0.25" rx={0.5} />
      {/* Línea ranura (slot) */}
      {showDetail && (
        <line x1={px - mW / 2 + 1} y1={py + mH * 0.15 + sep / 2}
          x2={px + mW / 2 - 1} y2={py + mH * 0.15 + sep / 2}
          stroke="#000" strokeWidth={0.4} opacity="0.2" />
      )}
      {/* Cuña colgante */}
      <rect x={px - wdW / 2} y={py + mH / 2 + sep / 2} width={wdW} height={wdH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.85" rx={0.3} />
      {/* Brillo cuña */}
      {showDetail && (
        <line x1={px - wdW / 2 + 0.5} y1={py + mH / 2 + sep / 2 + 0.5}
          x2={px - wdW / 2 + 0.5} y2={py + mH / 2 + sep / 2 + wdH - 0.5}
          stroke="#fff" strokeWidth={0.4} opacity="0.2" />
      )}
    </g>
  );

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 4} y={yAla - 4} width={w + 8} height={sep + mH / 2 + 8}
          fill="none" stroke="#E30613" strokeWidth="2" rx="2" opacity="0.3" />}
        <line x1={pL.x} y1={yAla} x2={pR.x} y2={yAla} stroke={sc} strokeWidth={tecW} strokeLinecap="butt" />
        <line x1={pL.x} y1={yAlma} x2={pR.x} y2={yAlma} stroke={sc} strokeWidth={tecW} strokeLinecap="butt" />
        <line x1={pL.x} y1={yAla} x2={pL.x} y2={yAlma} stroke={sc} strokeWidth={tecW} />
        <line x1={pR.x} y1={yAla} x2={pR.x} y2={yAlma} stroke={sc} strokeWidth={tecW} />
        <line x1={pL.x} y1={yAla - 2} x2={pL.x} y2={yAlma + 2} stroke={sc} strokeWidth={tecW} />
        <line x1={pR.x} y1={yAla - 2} x2={pR.x} y2={yAlma + 2} stroke={sc} strokeWidth={tecW} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado horizontal */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="65%" stopColor="#000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Selección glow */}
      {seleccionada && <rect x={pL.x - 4} y={yAla - 4} width={w + 8} height={sep + mH / 2 + 8}
        fill="none" stroke="#E30613" strokeWidth="2" rx="2" opacity="0.3" />}

      {/* ═══ Sombras ═══ */}
      <line x1={pL.x} y1={yAla + 0.8} x2={pR.x} y2={yAla + 0.8}
        stroke="#000" strokeWidth={lineW} strokeLinecap="butt" opacity="0.06" />
      <line x1={pL.x} y1={yAlma + 0.8} x2={pR.x} y2={yAlma + 0.8}
        stroke="#000" strokeWidth={lineW} strokeLinecap="butt" opacity="0.06" />

      {/* ═══ Línea superior (ala/pestaña) ═══ */}
      <line x1={pL.x} y1={yAla} x2={pR.x} y2={yAla}
        stroke={sc} strokeWidth={lineW} strokeLinecap="butt" />
      {/* Overlay galvanizado ala */}
      <line x1={pL.x} y1={yAla} x2={pR.x} y2={yAla}
        stroke={`url(#${gid})`} strokeWidth={lineW} strokeLinecap="butt" />
      {/* Highlight ala */}
      <line x1={pL.x} y1={yAla - hlOff} x2={pR.x} y2={yAla - hlOff}
        stroke="#fff" strokeWidth={lineW * 0.2} strokeLinecap="butt" opacity="0.35" />

      {/* ═══ Línea inferior (alma) ═══ */}
      <line x1={pL.x} y1={yAlma} x2={pR.x} y2={yAlma}
        stroke={sc} strokeWidth={lineW} strokeLinecap="butt" />
      {/* Overlay galvanizado alma */}
      <line x1={pL.x} y1={yAlma} x2={pR.x} y2={yAlma}
        stroke={`url(#${gid})`} strokeWidth={lineW} strokeLinecap="butt" />
      {/* Highlight alma */}
      <line x1={pL.x} y1={yAlma - hlOff} x2={pR.x} y2={yAlma - hlOff}
        stroke="#fff" strokeWidth={lineW * 0.2} strokeLinecap="butt" opacity="0.35" />

      {/* ═══ Alas verticales extremos (cierran la U) ═══ */}
      <line x1={pL.x} y1={yAla} x2={pL.x} y2={yAlma}
        stroke={sc} strokeWidth={alaW} />
      <line x1={pR.x} y1={yAla} x2={pR.x} y2={yAlma}
        stroke={sc} strokeWidth={alaW} />

      {/* Alas intermedias (lectura perfil U) */}
      {alasInt}

      {/* ── Cabezales cuña ── */}
      {renderCabezal(pL.x, yAlma, 'cl')}
      {renderCabezal(pR.x, yAlma, 'cr')}

      {/* Etiqueta largo (zoom medio+) */}
      {zoom > 40 && w > 40 && (
        <text x={pL.x + w / 2} y={yAla - 3}
          fontSize={Math.max(6, zoom * 0.05)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.4">VP {largo.toFixed(2)}m</text>
      )}
    </g>
  );
}
