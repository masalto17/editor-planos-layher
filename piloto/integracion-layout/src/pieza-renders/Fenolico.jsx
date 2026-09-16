// Placa Fenólico — panel de madera 1.22×2.44m sobre estructura.
// En alzado: rectángulo marrón oscuro con textura de vetas (zoom alto).
// Similar a Plataforma pero color madera y sin ganchos Layher.
export default function Fenolico({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const anchoPlat = pieza.anchoPlat || 1.22;
  const pL = worldToScreen(x, y);
  const pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;
  const h = Math.max(3, zoom * anchoPlat * 0.03); // espesor visual

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <rect x={pL.x - 3} y={pL.y - h - 3} width={w + 6} height={h * 2 + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}

      {modoTecnico ? <>
        {/* Rectángulo outline con X */}
        <rect x={pL.x} y={pL.y - h} width={w} height={h * 2}
          fill="none" stroke={sc} strokeWidth={Math.max(0.6, zoom * 0.008)} />
        <line x1={pL.x} y1={pL.y - h} x2={pL.x + w} y2={pL.y + h}
          stroke={sc} strokeWidth={Math.max(0.4, zoom * 0.005)} opacity="0.5" />
        <line x1={pL.x} y1={pL.y + h} x2={pL.x + w} y2={pL.y - h}
          stroke={sc} strokeWidth={Math.max(0.4, zoom * 0.005)} opacity="0.5" />
      </> : <>
        {/* Sombra */}
        <rect x={pL.x + 0.5} y={pL.y - h + 0.5} width={w} height={h * 2}
          fill="#000" opacity="0.06" rx="0.5" />
        {/* Panel principal */}
        <rect x={pL.x} y={pL.y - h} width={w} height={h * 2}
          fill={sc} stroke="#3a2010" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.5" opacity="0.9" />
        {/* Highlight borde superior */}
        <line x1={pL.x + 1} y1={pL.y - h + 0.8} x2={pR.x - 1} y2={pL.y - h + 0.8}
          stroke="#fff" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.15" />
        {/* Vetas de madera (solo zoom alto) */}
        {zoom > 50 && <>
          {[0.2, 0.4, 0.6, 0.8].map(t => {
            const vx = pL.x + w * t;
            return <line key={t} x1={vx} y1={pL.y - h + 1} x2={vx} y2={pL.y + h - 1}
              stroke="#3a2010" strokeWidth="0.3" opacity="0.2" />;
          })}
        </>}
        {/* Texto "FEN" centrado si hay espacio */}
        {w > 30 && (
          <text x={pL.x + w / 2} y={pL.y + 1} fontSize={Math.min(h * 1.2, 8)} fill="#fff" textAnchor="middle"
            fontFamily="monospace" fontWeight="bold" opacity="0.4">FEN</text>
        )}
      </>}
    </g>
  );
}
