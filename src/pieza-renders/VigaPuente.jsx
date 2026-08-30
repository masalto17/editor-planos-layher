// Viga Puente U — perfil abierto U representado como DOS LÍNEAS PARALELAS horizontales
// (ala superior y alma inferior) unidas por alas verticales en extremos, como en planos
// profesionales tipo Balastegui. Cabezales cuña en cada extremo.
export default function VigaPuente({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;

  // Separación entre las dos líneas = altura del perfil U
  const sep = Math.max(4, zoom * 0.055);      // separación ala-alma
  const lineW = Math.max(1.2, zoom * 0.022);  // grosor cada línea
  const alaW = Math.max(1, zoom * 0.015);     // grosor alas verticales (extremos)

  // Cabezal cuña (manguito + cuña colgante)
  const mW = Math.max(6, zoom * 0.06);
  const mH = Math.max(8, zoom * 0.08);
  const wdW = Math.max(2.5, zoom * 0.025);
  const wdH = Math.max(4, zoom * 0.04);
  const r = Math.max(0.5, zoom * 0.005);

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

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <rect x={pL.x - 4} y={yAla - 4} width={w + 8} height={sep + mH / 2 + 8}
        fill="none" stroke="#E30613" strokeWidth="2" rx="2" opacity="0.3" />}

      {/* ═══ Línea superior (ala/pestaña) ═══ */}
      {/* Sombra */}
      <line x1={pL.x} y1={yAla + 0.7} x2={pR.x} y2={yAla + 0.7}
        stroke="#000" strokeWidth={lineW} strokeLinecap="butt" opacity="0.06" />
      {/* Línea */}
      <line x1={pL.x} y1={yAla} x2={pR.x} y2={yAla}
        stroke={sc} strokeWidth={lineW} strokeLinecap="butt" />

      {/* ═══ Línea inferior (alma) ═══ */}
      {/* Sombra */}
      <line x1={pL.x} y1={yAlma + 0.7} x2={pR.x} y2={yAlma + 0.7}
        stroke="#000" strokeWidth={lineW} strokeLinecap="butt" opacity="0.06" />
      {/* Línea */}
      <line x1={pL.x} y1={yAlma} x2={pR.x} y2={yAlma}
        stroke={sc} strokeWidth={lineW} strokeLinecap="butt" />

      {/* ═══ Alas verticales extremos (cierran la U) ═══ */}
      <line x1={pL.x} y1={yAla} x2={pL.x} y2={yAlma}
        stroke={sc} strokeWidth={alaW} />
      <line x1={pR.x} y1={yAla} x2={pR.x} y2={yAlma}
        stroke={sc} strokeWidth={alaW} />

      {/* Alas intermedias (lectura perfil U) */}
      {alasInt}

      {/* ── Cabezal cuña izquierdo ── */}
      <rect x={pL.x - mW / 2} y={yAlma - mH / 2 + sep / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.004)} rx={r} opacity="0.92" />
      <rect x={pL.x - mW / 2 + 1} y={yAlma - mH / 2 + sep / 2 + 1}
        width={Math.max(1.5, mW * 0.25)} height={mH - 2}
        fill="#fff" opacity="0.2" rx={0.5} />
      <rect x={pL.x - wdW / 2} y={yAlma + mH / 2 + sep / 2} width={wdW} height={wdH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.85" rx={0.3} />

      {/* ── Cabezal cuña derecho ── */}
      <rect x={pR.x - mW / 2} y={yAlma - mH / 2 + sep / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.004)} rx={r} opacity="0.92" />
      <rect x={pR.x - mW / 2 + 1} y={yAlma - mH / 2 + sep / 2 + 1}
        width={Math.max(1.5, mW * 0.25)} height={mH - 2}
        fill="#fff" opacity="0.2" rx={0.5} />
      <rect x={pR.x - wdW / 2} y={yAlma + mH / 2 + sep / 2} width={wdW} height={wdH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.85" rx={0.3} />
    </g>
  );
}
