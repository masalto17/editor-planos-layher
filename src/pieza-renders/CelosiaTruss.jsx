// Celosía "U" Layher — viga reticulada con cordones superior/inferior y alma zigzag
// Alto real: 0.50m. En alzado se dibuja con escala mundo.
// Efecto galvanizado: gradiente metálico en cordones y cabezales, sombras y highlights.
export default function CelosiaTruss({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const ALTO = pieza.alto ?? 0.50; // alto real en metros

  // Puntos mundo de los 4 extremos
  const pTL = worldToScreen(x, y + ALTO);         // top-left (cordón superior)
  const pTR = worldToScreen(x + largo, y + ALTO);  // top-right
  const pBL = worldToScreen(x, y);                 // bottom-left (cordón inferior)
  const pBR = worldToScreen(x + largo, y);          // bottom-right

  const w = pTR.x - pTL.x;
  const h = pBL.y - pTL.y;
  const sw = Math.max(1.2, zoom * 0.018);
  const swWeb = Math.max(0.8, zoom * 0.012);
  const hlOff = sw * 0.25;
  const gid = `celg-${pieza.id}`;

  // Zigzag (V-pattern): triángulos alternados entre cordón superior e inferior
  const nTri = Math.max(3, Math.round(largo / 0.40));
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
          stroke={sc} strokeWidth={swWeb * 0.7} opacity={modoTecnico ? 0.4 : 0.5} />
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
  const cabR = Math.max(0.5, zoom * 0.005);
  const showDetail = zoom > 45;

  const tecW = Math.max(1, zoom * 0.012);

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && (
          <rect x={pTL.x - 3} y={pTL.y - 3} width={w + 6} height={Math.abs(h) + 6}
            fill="none" stroke="#E30613" strokeWidth="2" strokeDasharray="4 2" />
        )}
        {/* Cordón superior */}
        <line x1={pTL.x} y1={pTL.y} x2={pTR.x} y2={pTR.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="butt" />
        {/* Cordón inferior */}
        <line x1={pBL.x} y1={pBL.y} x2={pBR.x} y2={pBR.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="butt" />
        {/* Montantes extremos */}
        <line x1={pTL.x} y1={pTL.y} x2={pBL.x} y2={pBL.y}
          stroke={sc} strokeWidth={tecW} />
        <line x1={pTR.x} y1={pTR.y} x2={pBR.x} y2={pBR.y}
          stroke={sc} strokeWidth={tecW} />
        {/* Alma zigzag */}
        {zigzag}
        {/* Marcas extremos */}
        <circle cx={pTL.x} cy={(pTL.y + pBL.y) / 2} r={Math.max(1.5, zoom * 0.015)} fill={sc} />
        <circle cx={pTR.x} cy={(pTR.y + pBR.y) / 2} r={Math.max(1.5, zoom * 0.015)} fill={sc} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {seleccionada && (
        <rect x={pTL.x - 4} y={pTL.y - 4} width={w + 8} height={Math.abs(h) + cabH / 2 + 8}
          fill="none" stroke="#E30613" strokeWidth="2" rx="2" opacity="0.3" />
      )}

      {/* ═══ Sombras cordones ═══ */}
      <line x1={pTL.x} y1={pTL.y + 0.8} x2={pTR.x} y2={pTR.y + 0.8}
        stroke="#000" strokeWidth={sw} strokeLinecap="round" opacity="0.06" />
      <line x1={pBL.x} y1={pBL.y + 0.8} x2={pBR.x} y2={pBR.y + 0.8}
        stroke="#000" strokeWidth={sw} strokeLinecap="round" opacity="0.06" />

      {/* ═══ Cordón superior ═══ */}
      <line x1={pTL.x} y1={pTL.y} x2={pTR.x} y2={pTR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      <line x1={pTL.x} y1={pTL.y} x2={pTR.x} y2={pTR.y}
        stroke={`url(#${gid})`} strokeWidth={sw} strokeLinecap="round" />
      {/* Highlight cordón superior */}
      <line x1={pTL.x} y1={pTL.y - hlOff} x2={pTR.x} y2={pTR.y - hlOff}
        stroke="#fff" strokeWidth={sw * 0.2} strokeLinecap="round" opacity="0.35" />

      {/* ═══ Cordón inferior ═══ */}
      <line x1={pBL.x} y1={pBL.y} x2={pBR.x} y2={pBR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      <line x1={pBL.x} y1={pBL.y} x2={pBR.x} y2={pBR.y}
        stroke={`url(#${gid})`} strokeWidth={sw} strokeLinecap="round" />
      {/* Highlight cordón inferior */}
      <line x1={pBL.x} y1={pBL.y - hlOff} x2={pBR.x} y2={pBR.y - hlOff}
        stroke="#fff" strokeWidth={sw * 0.2} strokeLinecap="round" opacity="0.35" />

      {/* ═══ Montantes extremos ═══ */}
      <line x1={pTL.x} y1={pTL.y} x2={pBL.x} y2={pBL.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      <line x1={pTR.x} y1={pTR.y} x2={pBR.x} y2={pBR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />

      {/* ═══ Alma zigzag ═══ */}
      {zigzag}

      {/* ═══ Cabezales cuña ═══ */}
      {[pTL, pTR].map((p, idx) => {
        const cx = idx === 0 ? pTL.x : pTR.x;
        const cy = idx === 0 ? (pTL.y + pBL.y) / 2 : (pTR.y + pBR.y) / 2;
        const key = idx === 0 ? 'cl' : 'cr';
        return (
          <g key={key}>
            {/* Sombra cabezal */}
            <rect x={cx - cabW / 2 + 0.5} y={cy - cabH / 2 + 0.5}
              width={cabW} height={cabH} fill="#000" opacity="0.06" rx={cabR} />
            {/* Manguito */}
            <rect x={cx - cabW / 2} y={cy - cabH / 2}
              width={cabW} height={cabH}
              fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.004)} rx={cabR} opacity="0.92" />
            {/* Brillo metálico */}
            <rect x={cx - cabW / 2 + 0.8} y={cy - cabH / 2 + 0.8}
              width={Math.max(1.5, cabW * 0.22)} height={cabH - 1.6}
              fill="#fff" opacity="0.25" rx={0.5} />
            {/* Ranura */}
            {showDetail && (
              <line x1={cx - cabW / 2 + 1} y1={cy + cabH * 0.15}
                x2={cx + cabW / 2 - 1} y2={cy + cabH * 0.15}
                stroke="#000" strokeWidth={0.4} opacity="0.2" />
            )}
          </g>
        );
      })}

      {/* Etiqueta en zoom alto */}
      {zoom > 40 && w > 40 && (
        <text x={(pTL.x + pTR.x) / 2} y={pTL.y - 3}
          fontSize={Math.max(6, zoom * 0.05)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.4">CEL {largo.toFixed(2)}m</text>
      )}
    </g>
  );
}
