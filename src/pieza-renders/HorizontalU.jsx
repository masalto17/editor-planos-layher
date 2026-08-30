// Horizontal U — perfil U más liviano que Viga Puente. Misma forma, proporciones menores.
// Cabezales cuña + efecto 3D.
export default function HorizontalU({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;

  const g = Math.max(2.5, zoom * 0.05);      // grosor alma (más fino que VigaPuente)
  const alaH = Math.max(3, zoom * 0.035);    // altura ala
  const hlOff = g * 0.2;

  // Cabezal cuña (más chico que VigaPuente)
  const mW = Math.max(5, zoom * 0.05);
  const mH = Math.max(7, zoom * 0.065);
  const wdW = Math.max(2, zoom * 0.022);
  const wdH = Math.max(3.5, zoom * 0.035);
  const r = Math.max(0.5, zoom * 0.004);

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={pL.x - 3} y={pL.y - alaH - 3} width={w + 6} height={alaH + g + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" opacity="0.3" />}
      {/* Sombra */}
      <line x1={pL.x} y1={pL.y + hlOff} x2={pR.x} y2={pR.y + hlOff}
        stroke="#000" strokeWidth={g} strokeLinecap="butt" opacity="0.06" />
      {/* Alma */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke={sc} strokeWidth={g} strokeLinecap="butt" />
      {/* Highlight */}
      <line x1={pL.x} y1={pL.y - hlOff} x2={pR.x} y2={pR.y - hlOff}
        stroke="#fff" strokeWidth={g * 0.25} strokeLinecap="butt" opacity="0.3" />
      {/* Alas U extremos */}
      <line x1={pL.x} y1={pL.y + g * 0.3} x2={pL.x} y2={pL.y - alaH}
        stroke={sc} strokeWidth={Math.max(1, zoom * 0.013)} />
      <line x1={pR.x} y1={pR.y + g * 0.3} x2={pR.x} y2={pR.y - alaH}
        stroke={sc} strokeWidth={Math.max(1, zoom * 0.013)} />

      {/* Cabezal cuña izquierdo */}
      <rect x={pL.x - mW / 2} y={pL.y - mH / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx={r} opacity="0.9" />
      <rect x={pL.x - mW / 2 + 1} y={pL.y - mH / 2 + 1}
        width={Math.max(1, mW * 0.22)} height={mH - 2}
        fill="#fff" opacity="0.18" rx={0.5} />
      <rect x={pL.x - wdW / 2} y={pL.y + mH / 2} width={wdW} height={wdH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.8" rx={0.3} />
      {/* Cabezal cuña derecho */}
      <rect x={pR.x - mW / 2} y={pR.y - mH / 2} width={mW} height={mH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx={r} opacity="0.9" />
      <rect x={pR.x - mW / 2 + 1} y={pR.y - mH / 2 + 1}
        width={Math.max(1, mW * 0.22)} height={mH - 2}
        fill="#fff" opacity="0.18" rx={0.5} />
      <rect x={pR.x - wdW / 2} y={pR.y + mH / 2} width={wdW} height={wdH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.8" rx={0.3} />
    </g>
  );
}
