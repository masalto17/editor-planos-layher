// Taco de madera — bloque que se coloca DEBAJO del husillo en terreno blando.
// Se dibuja como un rectángulo marrón con textura de veta de madera (líneas diagonales).
// En modoTecnico: rectángulo con achurado diagonal.
export default function TacoMadera({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y } = pieza;
  const ancho = pieza.anchoTaco || pieza.largo || 0.20;
  const espesor = pieza.espesor || 0.05;

  // El taco se centra en X y se ubica debajo del punto (y) hacia abajo
  const pTL = worldToScreen(x - ancho / 2, y);
  const pBR = worldToScreen(x + ancho / 2, y - espesor);
  const w = pBR.x - pTL.x;
  const h = pBR.y - pTL.y;
  const px = pTL.x;
  const py = Math.min(pTL.y, pBR.y);
  const absH = Math.abs(h) || Math.max(2, zoom * 0.03);
  const absW = Math.abs(w) || Math.max(6, zoom * 0.08);

  const sw = Math.max(0.5, zoom * 0.006);
  const showGrain = zoom > 30;
  const showLabel = zoom > 50;

  // Líneas de veta de madera (diagonales internas)
  const grainLines = [];
  if (showGrain && absW > 6) {
    const step = Math.max(4, zoom * 0.04);
    for (let d = step; d < absW + absH; d += step) {
      // Líneas diagonales de izquierda-arriba a derecha-abajo
      let x1g = px + d, y1g = py;
      let x2g = px + d - absH * 0.6, y2g = py + absH;
      // Recortar al rectángulo
      if (x1g > px + absW) { y1g += (x1g - (px + absW)) / 0.6; x1g = px + absW; }
      if (x2g < px) { y2g -= (px - x2g) * 0.6; x2g = px; }
      if (y1g < py + absH && y2g > py && x1g >= px && x2g <= px + absW) {
        grainLines.push(
          <line key={d} x1={x1g} y1={y1g} x2={x2g} y2={y2g}
            stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.2" />
        );
      }
    }
  }

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={px - 3} y={py - 3} width={absW + 6} height={absH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" opacity="0.3" />}
        {/* Rectángulo con achurado */}
        <rect x={px} y={py} width={absW} height={absH}
          fill="none" stroke={sc} strokeWidth={Math.max(0.8, zoom * 0.01)} />
        {/* Achurado diagonal (convención para madera) */}
        {grainLines}
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={px - 3} y={py - 3} width={absW + 6} height={absH + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" opacity="0.3" />}

      {/* Sombra */}
      <rect x={px + 0.5} y={py + 0.5} width={absW} height={absH}
        fill="#000" opacity="0.07" rx="0.5" />

      {/* Bloque de madera */}
      <rect x={px} y={py} width={absW} height={absH}
        fill={sc} fillOpacity="0.75" stroke="#000" strokeWidth={sw} rx="0.5" />

      {/* Brillo superior */}
      <rect x={px + 1} y={py + 0.5} width={absW - 2} height={Math.max(1, absH * 0.25)}
        fill="#fff" opacity="0.15" rx="0.3" />

      {/* Vetas de madera */}
      {grainLines}

      {/* Etiqueta (zoom alto) */}
      {showLabel && absW > 20 && (
        <text x={px + absW / 2} y={py - 2}
          fontSize={Math.max(5, zoom * 0.035)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.4">🪵 {(ancho * 100).toFixed(0)}×{(ancho * 100).toFixed(0)}</text>
      )}
    </g>
  );
}
