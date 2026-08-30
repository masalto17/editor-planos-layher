// Viga IPN en Alzado: perfil doble T (I-beam) con patines y alma.
// Efecto 3D: sombra + highlight. Patines (alas) en extremos + marcas intermedias.
export default function VigaIPN({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;

  const g = Math.max(3.5, zoom * 0.07);      // grosor alma
  const alaH = Math.max(6, zoom * 0.065);    // media-altura patín
  const alaW = Math.max(1.8, zoom * 0.028);  // grosor patín
  const hlOff = g * 0.2;

  // Alas intermedias (para lectura de perfil I)
  const alasInt = [];
  const step = Math.max(22, zoom * 0.28);
  for (let px = pL.x + step; px < pR.x - step / 2; px += step) {
    alasInt.push(
      <line key={px} x1={px} y1={pL.y - alaH * 0.55} x2={px} y2={pL.y + alaH * 0.55}
        stroke={sc} strokeWidth={alaW * 0.6} opacity="0.35" />
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={pL.x - 3} y={pL.y - alaH - 3} width={w + 6} height={alaH * 2 + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
      {/* Sombra */}
      <line x1={pL.x} y1={pL.y + hlOff} x2={pR.x} y2={pR.y + hlOff}
        stroke="#000" strokeWidth={g} strokeLinecap="butt" opacity="0.07" />
      {/* Alma horizontal */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y}
        stroke={sc} strokeWidth={g} strokeLinecap="butt" />
      {/* Highlight */}
      <line x1={pL.x} y1={pL.y - hlOff} x2={pR.x} y2={pR.y - hlOff}
        stroke="#fff" strokeWidth={g * 0.25} strokeLinecap="butt" opacity="0.3" />
      {/* Patín izquierdo */}
      <line x1={pL.x} y1={pL.y - alaH} x2={pL.x} y2={pL.y + alaH}
        stroke={sc} strokeWidth={alaW} />
      {/* Patín derecho */}
      <line x1={pR.x} y1={pR.y - alaH} x2={pR.x} y2={pR.y + alaH}
        stroke={sc} strokeWidth={alaW} />
      {/* Alas intermedias */}
      {alasInt}
    </g>
  );
}
