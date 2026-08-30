// Celosía "U" Layher — viga reticulada con cordones superior/inferior y alma zigzag
// Alto real: 0.50m. En alzado se dibuja con escala mundo.
export default function CelosiaTruss({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const ALTO = pieza.alto ?? 0.50; // alto real en metros

  // Puntos mundo de los 4 extremos
  const pTL = worldToScreen(x, y + ALTO);         // top-left (cordón superior)
  const pTR = worldToScreen(x + largo, y + ALTO);  // top-right
  const pBL = worldToScreen(x, y);                 // bottom-left (cordón inferior)
  const pBR = worldToScreen(x + largo, y);          // bottom-right

  const w = pTR.x - pTL.x;
  const h = pBL.y - pTL.y; // px (en SVG Y crece hacia abajo, pero worldToScreen invierte)
  const sw = Math.max(1.2, zoom * 0.018);
  const swWeb = Math.max(0.8, zoom * 0.012);

  // Zigzag (V-pattern): triángulos alternados entre cordón superior e inferior
  // Número de triángulos depende del largo y zoom
  const nTri = Math.max(3, Math.round(largo / 0.40)); // ~1 triángulo cada 0.40m
  const stepX = largo / nTri;
  const zigzag = [];
  for (let i = 0; i <= nTri; i++) {
    const wx = x + i * stepX;
    const pTop = worldToScreen(wx, y + ALTO);
    const pBot = worldToScreen(wx, y);
    // Montante vertical cada triángulo
    if (i > 0 && i < nTri) {
      zigzag.push(
        <line key={`m${i}`} x1={pTop.x} y1={pTop.y} x2={pBot.x} y2={pBot.y}
          stroke={sc} strokeWidth={swWeb * 0.7} opacity={0.5} />
      );
    }
    // Diagonal zigzag
    if (i < nTri) {
      const wxMid = x + (i + 0.5) * stepX;
      const isUp = i % 2 === 0;
      const pStart = isUp ? worldToScreen(wx, y) : worldToScreen(wx, y + ALTO);
      const pMid = isUp ? worldToScreen(wxMid, y + ALTO) : worldToScreen(wxMid, y);
      const pEnd = isUp ? worldToScreen(wx + stepX, y) : worldToScreen(wx + stepX, y + ALTO);
      zigzag.push(
        <polyline key={`z${i}`}
          points={`${pStart.x},${pStart.y} ${pMid.x},${pMid.y} ${pEnd.x},${pEnd.y}`}
          fill="none" stroke={sc} strokeWidth={swWeb} />
      );
    }
  }

  // Cabezales cuña (conexión a roseta)
  const cabW = Math.max(6, zoom * 0.07);
  const cabH = Math.max(8, zoom * 0.09);

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && (
        <rect x={pTL.x - 3} y={pTL.y - 3} width={w + 6} height={Math.abs(h) + 6}
          fill="none" stroke="#E30613" strokeWidth="2" strokeDasharray="4 2" />
      )}
      {/* Cordón superior */}
      <line x1={pTL.x} y1={pTL.y} x2={pTR.x} y2={pTR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      {/* Cordón inferior */}
      <line x1={pBL.x} y1={pBL.y} x2={pBR.x} y2={pBR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      {/* Montantes extremos */}
      <line x1={pTL.x} y1={pTL.y} x2={pBL.x} y2={pBL.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      <line x1={pTR.x} y1={pTR.y} x2={pBR.x} y2={pBR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      {/* Alma zigzag */}
      {zigzag}
      {/* Cabezales cuña en extremos (centrados verticalmente) */}
      <rect x={pTL.x - cabW / 2} y={(pTL.y + pBL.y) / 2 - cabH / 2}
        width={cabW} height={cabH} fill={sc} rx="1.5" opacity="0.8" />
      <rect x={pTR.x - cabW / 2} y={(pTR.y + pBR.y) / 2 - cabH / 2}
        width={cabW} height={cabH} fill={sc} rx="1.5" opacity="0.8" />
      {/* Etiqueta en zoom alto */}
      {zoom > 45 && !modoTecnico && (
        <text x={(pTL.x + pTR.x) / 2} y={(pTL.y + pBL.y) / 2 + 3}
          fontSize={Math.max(7, zoom * 0.08)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.6">
          {largo.toFixed(2)}m
        </text>
      )}
    </g>
  );
}
