// Escalera eventos — Viga Zanca 750 con peldaños.
// En alzado: 2 zancas inclinadas + peldaños horizontales.
// Se coloca en (x, y) = base inferior izquierda. Sube hacia (x+largo, y+desnivel).
export default function Escalera({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const desnivel = pieza.desnivel || 1.33;
  const numPeldanos = 8;

  // Esquinas del tramo
  const pBL = worldToScreen(x, y);               // base izquierda (abajo)
  const pTR = worldToScreen(x + largo, y + desnivel); // tope derecha (arriba)

  const tecW = Math.max(1, zoom * 0.012);
  const g = Math.max(2, zoom * 0.035);  // grosor zanca
  const gp = Math.max(1, zoom * 0.015); // grosor peldaño

  // Offset lateral para las 2 zancas (separación visual)
  const zancaOff = Math.max(1.5, zoom * 0.012);

  // Peldaños: distribuidos uniformemente entre base y tope
  const peldanos = [];
  for (let i = 1; i <= numPeldanos; i++) {
    const t = i / numPeldanos;
    const px = x + largo * t;
    const py = y + desnivel * t;
    // Cada peldaño es horizontal, ancho = largo/numPeldanos
    const peldanoAncho = largo / numPeldanos;
    const pL = worldToScreen(px - peldanoAncho, py);
    const pR = worldToScreen(px, py);
    peldanos.push({ pL, pR, py });
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
        stroke="#E30613" strokeWidth={g + 8} opacity="0.2" strokeLinecap="round" />}

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
        {/* Marcas extremo */}
        <circle cx={pBL.x} cy={pBL.y} r={Math.max(1.5, zoom * 0.015)}
          fill={sc} stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.003)} />
        <circle cx={pTR.x} cy={pTR.y} r={Math.max(1.5, zoom * 0.015)}
          fill={sc} stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.003)} />
      </> : <>
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
        {/* Puntos extremos */}
        <circle cx={pBL.x} cy={pBL.y} r={Math.max(2.5, zoom * 0.025)}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
        <circle cx={pTR.x} cy={pTR.y} r={Math.max(2.5, zoom * 0.025)}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
      </>}
    </g>
  );
}
