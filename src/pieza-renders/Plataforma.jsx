// Plataforma — rectángulo con rejilla metálica, borde marco, ganchos de fijación.
// Rejilla visible a zoom medio. Efecto metálico con gradiente sutil.
export default function Plataforma({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;
  const h = Math.max(6, zoom * 0.065);       // espesor visual
  const hookW = Math.max(2, zoom * 0.018);   // ancho gancho
  const hookH = Math.max(3, zoom * 0.03);    // alto gancho colgante

  // Rejilla vertical
  const rejilla = [];
  if (zoom > 25) {
    const step = Math.max(6, zoom * 0.08);
    for (let px = pL.x + step; px < pR.x; px += step) {
      rejilla.push(
        <line key={`v${px}`} x1={px} y1={pL.y - h + 1} x2={px} y2={pL.y - 1}
          stroke="#000" strokeWidth={Math.max(0.2, zoom * 0.002)} opacity="0.15" />
      );
    }
  }
  // Rejilla horizontal (solo zoom alto)
  if (zoom > 50) {
    const hStep = Math.max(3, h / 3);
    for (let py = pL.y - h + hStep; py < pL.y; py += hStep) {
      rejilla.push(
        <line key={`h${py}`} x1={pL.x + 1} y1={py} x2={pR.x - 1} y2={py}
          stroke="#000" strokeWidth={Math.max(0.2, zoom * 0.001)} opacity="0.1" />
      );
    }
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección */}
      {seleccionada && <rect x={pL.x - 2} y={pL.y - h - 3} width={w + 4} height={h + hookH + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
      {/* Sombra */}
      <rect x={pL.x + 1} y={pL.y - h + 1} width={w} height={h}
        fill="#000" opacity="0.06" rx="1" />
      {/* Cuerpo plataforma */}
      <rect x={pL.x} y={pL.y - h} width={w} height={h}
        fill={sc} rx="1" opacity="0.9" />
      {/* Marco/borde */}
      <rect x={pL.x} y={pL.y - h} width={w} height={h}
        fill="none" stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} opacity="0.25" rx="1" />
      {/* Highlight superior */}
      <line x1={pL.x + 2} y1={pL.y - h + 1} x2={pR.x - 2} y2={pL.y - h + 1}
        stroke="#fff" strokeWidth={Math.max(0.5, zoom * 0.004)} opacity="0.3" />
      {/* Rejilla */}
      {rejilla}
      {/* Ganchos de fijación extremos */}
      <rect x={pL.x} y={pL.y} width={hookW} height={hookH}
        fill={sc} stroke="#000" strokeWidth="0.3" opacity="0.7" />
      <rect x={pR.x - hookW} y={pR.y} width={hookW} height={hookH}
        fill={sc} stroke="#000" strokeWidth="0.3" opacity="0.7" />
    </g>
  );
}
