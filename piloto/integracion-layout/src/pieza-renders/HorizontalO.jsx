// Horizontal O (tubo) y Barandilla — tubo Ø48.3mm con cabezales cuña AutoLock.
// Efecto 3D: sombra + highlight cilíndrico. Cabezales con manguito + cuña colgante.
// Barandilla usa misma forma pero punteada.
export default function HorizontalO({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, categoria } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const isDashed = categoria === 'barandilla';

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

  if (modoTecnico) {
    // Modo plano técnico: línea simple con marcas en extremos
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
          stroke="#E30613" strokeWidth={tecW + 6} opacity="0.2" strokeLinecap="round" />}
        <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="butt" strokeDasharray={dash} />
        {/* Marcas cabezal simples */}
        <line x1={pL.x} y1={pL.y - mH / 2} x2={pL.x} y2={pL.y + mH / 2}
          stroke={sc} strokeWidth={tecW * 1.5} />
        <line x1={pR.x} y1={pR.y - mH / 2} x2={pR.x} y2={pR.y + mH / 2}
          stroke={sc} strokeWidth={tecW * 1.5} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke="#E30613" strokeWidth={tubeW + 8} opacity="0.2" strokeLinecap="round" />}
      {/* Sombra inferior */}
      <line x1={pL.x} y1={pL.y + hlOff} x2={pR.x} y2={pR.y + hlOff}
        stroke="#000" strokeWidth={tubeW} strokeLinecap="butt" opacity="0.07"
        strokeDasharray={dash} />
      {/* Tubo principal */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke={sc} strokeWidth={tubeW} strokeLinecap="butt"
        strokeDasharray={dash} />
      {/* Highlight superior (brillo cilindro) */}
      <line x1={pL.x} y1={pL.y - hlOff} x2={pR.x} y2={pR.y - hlOff}
        stroke="#fff" strokeWidth={tubeW * 0.28} strokeLinecap="butt" opacity="0.3"
        strokeDasharray={dash} />

      {/* ── Cabezal cuña izquierdo ── */}
      {/* Manguito (coupling sleeve) */}
      <rect x={pL.x - mW / 2} y={pL.y - mH / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.004)} rx={r}
        opacity="0.92" />
      {/* Brillo manguito */}
      <rect x={pL.x - mW / 2 + 1} y={pL.y - mH / 2 + 1}
        width={Math.max(1.5, mW * 0.25)} height={mH - 2}
        fill="#fff" opacity="0.2" rx={0.5} />
      {/* Cuña colgante */}
      <rect x={pL.x - wW / 2} y={pL.y + mH / 2} width={wW} height={wH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)}
        opacity="0.85" rx={0.3} />

      {/* ── Cabezal cuña derecho ── */}
      <rect x={pR.x - mW / 2} y={pR.y - mH / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.004)} rx={r}
        opacity="0.92" />
      <rect x={pR.x - mW / 2 + 1} y={pR.y - mH / 2 + 1}
        width={Math.max(1.5, mW * 0.25)} height={mH - 2}
        fill="#fff" opacity="0.2" rx={0.5} />
      <rect x={pR.x - wW / 2} y={pR.y + mH / 2} width={wW} height={wH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)}
        opacity="0.85" rx={0.3} />
    </g>
  );
}
