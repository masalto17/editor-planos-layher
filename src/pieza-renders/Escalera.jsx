// Escalera eventos — Viga Zanca 750 con peldaños y pasamanos.
// En alzado: 2 zancas inclinadas + peldaños horizontales + pasamanos laterales.
// Se coloca en (x, y) = base inferior. Sube hacia (x+largo, y+desnivel).
// Soporta `flip`: false = sube a la derecha (default), true = sube a la izquierda.
// Efecto galvanizado: gradiente metálico en zancas, sombras y highlights.
export default function Escalera({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const desnivel = pieza.desnivel || 1.33;
  const dir = pieza.flip ? -1 : 1; // dirección horizontal
  const numPeldanos = 8;
  const alturaPasamanos = 0.90; // 900mm pasamanos

  // Esquinas del tramo
  const pBL = worldToScreen(x, y);                            // base (abajo)
  const pTR = worldToScreen(x + largo * dir, y + desnivel);   // tope (arriba)

  // Pasamanos: corre paralelo a las zancas pero 0.90m por encima
  const pPasBase = worldToScreen(x, y + alturaPasamanos);
  const pPasTop = worldToScreen(x + largo * dir, y + desnivel + alturaPasamanos);

  const tecW = Math.max(1, zoom * 0.012);
  const g = Math.max(2, zoom * 0.035);  // grosor zanca
  const gp = Math.max(1, zoom * 0.015); // grosor peldaño
  const gPas = Math.max(1, zoom * 0.018); // grosor pasamanos
  const hlOff = g * 0.22;

  // Ángulo de la zanca para gradiente perpendicular
  const zdx = pTR.x - pBL.x, zdy = pTR.y - pBL.y;
  const zLen = Math.sqrt(zdx * zdx + zdy * zdy);
  const znx = zLen > 0 ? -zdy / zLen : 0;
  const zny = zLen > 0 ? zdx / zLen : 1;
  const zAngle = Math.atan2(zdy, zdx);
  const cosA = Math.cos(zAngle + Math.PI / 2);
  const sinA = Math.sin(zAngle + Math.PI / 2);
  const gid = `escg-${pieza.id}`;

  // Offset lateral para las 2 zancas (separación visual)
  const zancaOff = Math.max(1.5, zoom * 0.012);
  const zancaDir = dir;

  // Peldaños: distribuidos uniformemente entre base y tope
  const peldanos = [];
  for (let i = 1; i <= numPeldanos; i++) {
    const t = i / (numPeldanos + 1);
    const px = x + largo * dir * t;
    const py = y + desnivel * t;
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
      const mx = x + largo * dir * t;
      const myBot = y + desnivel * t;
      const myTop = myBot + alturaPasamanos;
      const pmB = worldToScreen(mx, myBot);
      const pmT = worldToScreen(mx, myTop);
      montantes.push({ pmB, pmT });
    }
  }

  // Flecha indicando dirección de subida
  const arrowLabel = pieza.flip ? '↖' : '↗';

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <>
          <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
            stroke="#E30613" strokeWidth={g + 8} opacity="0.2" strokeLinecap="round" />
          <line x1={pPasBase.x} y1={pPasBase.y} x2={pPasTop.x} y2={pPasTop.y}
            stroke="#E30613" strokeWidth={gPas + 6} opacity="0.15" strokeLinecap="round" />
        </>}
        {/* Zanca izquierda */}
        <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" />
        {/* Zanca derecha (offset visual) */}
        <line x1={pBL.x + zancaOff * zancaDir} y1={pBL.y + zancaOff} x2={pTR.x + zancaOff * zancaDir} y2={pTR.y + zancaOff}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" />
        {/* Peldaños */}
        {peldanos.map((p, i) => (
          <line key={i} x1={p.pL.x} y1={p.pL.y} x2={p.pR.x} y2={p.pR.y}
            stroke={sc} strokeWidth={tecW} />
        ))}
        {/* Pasamanos */}
        <line x1={pPasBase.x} y1={pPasBase.y} x2={pPasTop.x} y2={pPasTop.y}
          stroke={sc} strokeWidth={tecW * 0.8}
          strokeDasharray={`${Math.max(4, zoom * 0.04)} ${Math.max(2, zoom * 0.02)}`} />
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
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado perpendicular a zancas */}
      <defs>
        <linearGradient id={gid}
          x1={0.5 - cosA * 0.5} y1={0.5 - sinA * 0.5}
          x2={0.5 + cosA * 0.5} y2={0.5 + sinA * 0.5}>
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* Selección glow */}
      {seleccionada && <>
        <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
          stroke="#E30613" strokeWidth={g + 8} opacity="0.2" strokeLinecap="round" />
        <line x1={pPasBase.x} y1={pPasBase.y} x2={pPasTop.x} y2={pPasTop.y}
          stroke="#E30613" strokeWidth={gPas + 6} opacity="0.15" strokeLinecap="round" />
      </>}

      {/* ═══ Montantes verticales pasamanos (detrás de todo) ═══ */}
      {montantes.map((m, i) => (
        <line key={`m${i}`} x1={m.pmB.x} y1={m.pmB.y} x2={m.pmT.x} y2={m.pmT.y}
          stroke={sc} strokeWidth={Math.max(0.8, zoom * 0.01)} opacity="0.35" />
      ))}

      {/* ═══ Sombra zanca principal ═══ */}
      <line x1={pBL.x + hlOff * 1.2} y1={pBL.y + hlOff * 1.2}
        x2={pTR.x + hlOff * 1.2} y2={pTR.y + hlOff * 1.2}
        stroke="#000" strokeWidth={g} strokeLinecap="round" opacity="0.06" />

      {/* ═══ Zanca izquierda ═══ */}
      <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
        stroke={sc} strokeWidth={g} strokeLinecap="round" />
      {/* Overlay galvanizado */}
      <line x1={pBL.x} y1={pBL.y} x2={pTR.x} y2={pTR.y}
        stroke={`url(#${gid})`} strokeWidth={g} strokeLinecap="round" />
      {/* Highlight cilíndrico */}
      <line x1={pBL.x - znx * hlOff} y1={pBL.y - zny * hlOff}
        x2={pTR.x - znx * hlOff} y2={pTR.y - zny * hlOff}
        stroke="#fff" strokeWidth={g * 0.22} strokeLinecap="round" opacity="0.35" />

      {/* ═══ Zanca derecha ═══ */}
      <line x1={pBL.x + zancaOff * 2 * zancaDir} y1={pBL.y + zancaOff}
        x2={pTR.x + zancaOff * 2 * zancaDir} y2={pTR.y + zancaOff}
        stroke={sc} strokeWidth={g} strokeLinecap="round" />
      {/* Overlay galvanizado zanca derecha */}
      <line x1={pBL.x + zancaOff * 2 * zancaDir} y1={pBL.y + zancaOff}
        x2={pTR.x + zancaOff * 2 * zancaDir} y2={pTR.y + zancaOff}
        stroke={`url(#${gid})`} strokeWidth={g} strokeLinecap="round" />

      {/* ═══ Peldaños ═══ */}
      {peldanos.map((p, i) => (
        <g key={i}>
          {/* Sombra peldaño */}
          <line x1={p.pL.x} y1={p.pL.y + 0.5} x2={p.pR.x} y2={p.pR.y + 0.5}
            stroke="#000" strokeWidth={gp} strokeLinecap="butt" opacity="0.04" />
          {/* Peldaño */}
          <line x1={p.pL.x} y1={p.pL.y} x2={p.pR.x} y2={p.pR.y}
            stroke={sc} strokeWidth={gp} strokeLinecap="butt" />
          {/* Highlight peldaño */}
          {zoom > 35 && <line x1={p.pL.x} y1={p.pL.y - gp * 0.3} x2={p.pR.x} y2={p.pR.y - gp * 0.3}
            stroke="#fff" strokeWidth={gp * 0.3} strokeLinecap="butt" opacity="0.2" />}
        </g>
      ))}

      {/* ═══ Pasamanos (línea inclinada paralela a zancas) ═══ */}
      <line x1={pPasBase.x} y1={pPasBase.y} x2={pPasTop.x} y2={pPasTop.y}
        stroke={sc} strokeWidth={gPas} strokeLinecap="round" opacity="0.6"
        strokeDasharray={`${Math.max(6, zoom * 0.06)} ${Math.max(3, zoom * 0.03)}`} />
      {/* Highlight pasamanos */}
      <line x1={pPasBase.x - znx * gPas * 0.2} y1={pPasBase.y - zny * gPas * 0.2}
        x2={pPasTop.x - znx * gPas * 0.2} y2={pPasTop.y - zny * gPas * 0.2}
        stroke="#fff" strokeWidth={gPas * 0.2} strokeLinecap="round" opacity="0.2"
        strokeDasharray={`${Math.max(6, zoom * 0.06)} ${Math.max(3, zoom * 0.03)}`} />

      {/* ═══ Puntos extremos (mejorados) ═══ */}
      <circle cx={pBL.x} cy={pBL.y} r={Math.max(2.5, zoom * 0.025)}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
      {zoom > 30 && <circle cx={pBL.x - Math.max(0.4, zoom * 0.004)} cy={pBL.y - Math.max(0.4, zoom * 0.004)}
        r={Math.max(0.4, zoom * 0.005)} fill="#fff" opacity="0.35" />}
      <circle cx={pTR.x} cy={pTR.y} r={Math.max(2.5, zoom * 0.025)}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
      {zoom > 30 && <circle cx={pTR.x - Math.max(0.4, zoom * 0.004)} cy={pTR.y - Math.max(0.4, zoom * 0.004)}
        r={Math.max(0.4, zoom * 0.005)} fill="#fff" opacity="0.35" />}

      {/* Etiqueta */}
      {zoom > 30 && <text x={(pBL.x + pTR.x) / 2 + 8 * dir} y={(pBL.y + pTR.y) / 2 - 4}
        fontSize={Math.max(7, zoom * 0.06)} fill={sc} textAnchor="start" fontFamily="monospace" opacity="0.5">
        🪜 {largo.toFixed(2)}m {arrowLabel}{desnivel.toFixed(2)}m
      </text>}
    </g>
  );
}
