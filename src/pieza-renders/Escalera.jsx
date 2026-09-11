// Escalera eventos — Viga Zanca 750 con peldaños y pasamanos.
// En alzado: 2 zancas inclinadas + peldaños horizontales + pasamanos laterales.
// Se coloca en (x, y) = base inferior izquierda. Sube hacia (x+largo, y+desnivel).
export default function Escalera({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const desnivel = pieza.desnivel || 1.33;
  const numPeldanos = 8;
  const alturaPasamanos = 0.90; // 900mm pasamanos

  // Esquinas del tramo
  const pBL = worldToScreen(x, y);               // base izquierda (abajo)
  const pTR = worldToScreen(x + largo, y + desnivel); // tope derecha (arriba)

  // Pasamanos: corre paralelo a las zancas pero 0.90m por encima
  const pPasBase = worldToScreen(x, y + alturaPasamanos);
  const pPasTop = worldToScreen(x + largo, y + desnivel + alturaPasamanos);

  const tecW = Math.max(1, zoom * 0.012);
  const g = Math.max(2, zoom * 0.035);  // grosor zanca
  const gp = Math.max(1, zoom * 0.015); // grosor peldaño
  const gPas = Math.max(1, zoom * 0.018); // grosor pasamanos

  // Offset lateral para las 2 zancas (separación visual)
  const zancaOff = Math.max(1.5, zoom * 0.012);

  // Peldaños: distribuidos uniformemente entre base y tope
  const peldanos = [];
  for (let i = 1; i <= numPeldanos; i++) {
    const t = i / (numPeldanos + 1);
    const px = x + largo * t;
    const py = y + desnivel * t;
    // Cada peldaño es un travesaño horizontal corto
    const peldW = largo / (numPeldanos + 1) * 0.8;
    const pL = worldToScreen(px - peldW / 2, py);
    const pR = worldToScreen(px + peldW / 2, py);
    peldanos.push({ pL, pR });
  }

  // Montantes verticales del pasamanos (cada ~0.50m aprox)
  const montantes = [];
  if (zoom > 20) {
    const nMont = Math.max(2, Math.round(largo / 0.5));
    for (let i = 0; i <= nMont; i++) {
      const t = i / nMont;
      const mx = x + largo * t;
      const myBot = y + desnivel * t;
      const myTop = myBot + alturaPasamanos;
      const pmB = worldToScreen(mx, myBot);
      const pmT = worldToScreen(mx, myTop);
      montantes.push({ pmB, pmT });
    }
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <>
        <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
          stroke="#E30613" strokeWidth={g + 8} opacity="0.2" strokeLinecap="round" />
        <line x1={pPasBase.x} y1={pPasBase.y} x2={pPasTop.x} y2={pPasTop.y}
          stroke="#E30613" strokeWidth={gPas + 6} opacity="0.15" strokeLinecap="round" />
      </>}

      {modoTecnico ? <>
        {/* Zanca izquierda */}
        <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" />
        {/* Zanca derecha (offset visual) */}
        <line x1={pBL.x + zancaOff} y1={pBL.y + zancaOff} x2={pTR.x + zancaOff} y2={pTR.y + zancaOff}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" />
        {/* Peldaños */}
        {peldanos.map((p, i) => (
          <line key={i} x1={p.pL.x} y1={p.pL.y} x2={p.pR.x} y2={p.pR.y}
            stroke={sc} strokeWidth={tecW} />
        ))}
        {/* Pasamanos */}
        <line x1={pPasBase.x} y1={pPasBase.y} x2={pPasTop.x} y2={pPasTop.y}
          stroke={sc} strokeWidth={tecW * 0.8} strokeDasharray={`${Math.max(4, zoom * 0.04)} ${Math.max(2, zoom * 0.02)}`} />
        {/* Montantes */}
        {montantes.map((m, i) => (
          <line key={`m${i}`} x1={m.pmB.x} y1={m.pmB.y} x2={m.pmT.x} y2={m.pmT.y}
            stroke={sc} strokeWidth={tecW * 0.6} opacity="0.5" />
        ))}
        {/* Marcas extremo */}
        <circle cx={pBL.x} cy={pBL.y} r={Math.max(1.5, zoom * 0.015)}
          fill={sc} stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.003)} />
        <circle cx={pTR.x} cy={pTR.y} r={Math.max(1.5, zoom * 0.015)}
          fill={sc} stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.003)} />
      </> : <>
        {/* Montantes verticales pasamanos (detrás de todo) */}
        {montantes.map((m, i) => (
          <line key={`m${i}`} x1={m.pmB.x} y1={m.pmB.y} x2={m.pmT.x} y2={m.pmT.y}
            stroke={sc} strokeWidth={Math.max(0.8, zoom * 0.01)} opacity="0.35" />
        ))}
        {/* Sombra zanca */}
        <line x1={pBL.x + 1} y1={pBL.y + 1} x2={pTR.x + 1} y2={pTR.y + 1}
          stroke="#000" strokeWidth={g} strokeLinecap="round" opacity="0.06" />
        {/* Zanca izquierda */}
        <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
          stroke={sc} strokeWidth={g} strokeLinecap="round" />
        {/* Zanca derecha */}
        <line x1={pBL.x + zancaOff * 2} y1={pBL.y + zancaOff} x2={pTR.x + zancaOff * 2} y2={pTR.y + zancaOff}
          stroke={sc} strokeWidth={g} strokeLinecap="round" />
        {/* Highlight */}
        <line x1={pBL.x} y1={pBL.y - g * 0.2} x2={pTR.x} y2={pTR.y - g * 0.2}
          stroke="#fff" strokeWidth={g * 0.25} strokeLinecap="round" opacity="0.3" />
        {/* Peldaños */}
        {peldanos.map((p, i) => (
          <line key={i} x1={p.pL.x} y1={p.pL.y} x2={p.pR.x} y2={p.pR.y}
            stroke={sc} strokeWidth={gp} strokeLinecap="butt" />
        ))}
        {/* Pasamanos (línea inclinada paralela a zancas) */}
        <line x1={pPasBase.x} y1={pPasBase.y} x2={pPasTop.x} y2={pPasTop.y}
          stroke={sc} strokeWidth={gPas} strokeLinecap="round" opacity="0.6"
          strokeDasharray={`${Math.max(6, zoom * 0.06)} ${Math.max(3, zoom * 0.03)}`} />
        {/* Puntos extremos */}
        <circle cx={pBL.x} cy={pBL.y} r={Math.max(2.5, zoom * 0.025)}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
        <circle cx={pTR.x} cy={pTR.y} r={Math.max(2.5, zoom * 0.025)}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
      </>}
      {/* Etiqueta */}
      {zoom > 30 && <text x={(pBL.x + pTR.x) / 2 + 8} y={(pBL.y + pTR.y) / 2 - 4}
        fontSize={Math.max(7, zoom * 0.06)} fill={sc} textAnchor="start" fontFamily="monospace" opacity="0.5">
        🪜 {largo.toFixed(2)}m ↗{desnivel.toFixed(2)}m
      </text>}
    </g>
  );
}
