// Rodapié — chapa vertical baja con borde superior doblado y fijaciones en extremos.
// Efecto 3D: sombra + highlight. Marca de doblez superior.
export default function Rodapie({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;
  const h = Math.max(4, zoom * 0.04);         // altura chapa
  const foldH = Math.max(1, zoom * 0.01);     // doblez superior
  const clipW = Math.max(2, zoom * 0.02);     // ancho clip fijación
  const clipH = Math.max(3, zoom * 0.025);    // alto clip

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={pL.x - 2} y={pL.y - h - foldH - 2} width={w + 4} height={h + foldH + clipH + 4}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
      {modoTecnico ? <>
        <rect x={pL.x} y={pL.y - h} width={w} height={h}
          fill="none" stroke={sc} strokeWidth={Math.max(0.6, zoom * 0.008)} />
      </> : <>
        <rect x={pL.x + 0.5} y={pL.y - h + 0.5} width={w} height={h}
          fill="#000" opacity="0.06" rx="0.5" />
        <rect x={pL.x} y={pL.y - h} width={w} height={h}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.5" opacity="0.9" />
        <line x1={pL.x + 1} y1={pL.y - h + 1} x2={pR.x - 1} y2={pL.y - h + 1}
          stroke="#fff" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.25" />
        <line x1={pL.x} y1={pL.y - h} x2={pR.x} y2={pL.y - h}
          stroke={sc} strokeWidth={foldH + 1} strokeLinecap="butt" />
        <line x1={pL.x} y1={pL.y - h - foldH * 0.3} x2={pR.x} y2={pL.y - h - foldH * 0.3}
          stroke="#000" strokeWidth={Math.max(0.2, zoom * 0.002)} opacity="0.2" />
        <rect x={pL.x} y={pL.y} width={clipW} height={clipH}
          fill={sc} stroke="#000" strokeWidth="0.3" opacity="0.6" />
        <rect x={pR.x - clipW} y={pR.y} width={clipW} height={clipH}
          fill={sc} stroke="#000" strokeWidth="0.3" opacity="0.6" />
      </>}
    </g>
  );
}
