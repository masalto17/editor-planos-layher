// Diagonal lateral (cara de fondo de una torre) vista en el Alzado: queda perpendicular al
// plano de la vista, así que se proyecta como un tramo vertical en su X, rotulado para no
// confundirlo con un parante.
export default function DiagonalLateral({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const a = worldToScreen(pieza.x, pieza.y), b = worldToScreen(pieza.x, pieza.y + pieza.alto);
  const sw = Math.max(1, zoom * 0.015);
  const off = Math.max(3, zoom * 0.04); // desplazada para no tapar el parante
  return (
    <g opacity={op * 0.75} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      <line x1={a.x + off} y1={a.y} x2={b.x + off} y2={b.y} stroke="transparent" strokeWidth={Math.max(8, sw * 4)} />
      {seleccionada && <line x1={a.x + off} y1={a.y} x2={b.x + off} y2={b.y} stroke="#E30613" strokeWidth={sw + 6} opacity="0.2" />}
      <line x1={a.x + off} y1={a.y} x2={b.x + off} y2={b.y} stroke={sc} strokeWidth={sw} strokeDasharray="2 3" />
      {zoom > 45 && (
        <text x={a.x + off + 3} y={(a.y + b.y) / 2} fontSize={Math.max(7, zoom * 0.055)} fill={sc} fontFamily="monospace" opacity="0.7">
          diag. lateral {pieza.ancho.toFixed(2)}
        </text>
      )}
    </g>
  );
}
