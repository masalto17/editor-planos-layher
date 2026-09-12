// Ménsula — voladizo lateral desde vertical con diagonal de apoyo.
// En alzado: brazo horizontal + diagonal triangular de refuerzo.
// Soporta `flip`: false = derecha (default), true = izquierda.
// Efecto galvanizado: gradiente metálico, sombras, highlights especulares.
export default function Mensula({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const dir = pieza.flip ? -1 : 1; // dirección del voladizo
  // Punto de conexión (roseta en vertical) y extremo del voladizo
  const pO = worldToScreen(x, y);
  const pE = worldToScreen(x + largo * dir, y);
  // Punto inferior de la diagonal de apoyo (una roseta abajo, 0.50m)
  const pD = worldToScreen(x, y - 0.50);
  const w = Math.abs(pE.x - pO.x);

  const g = Math.max(2, zoom * 0.04);     // grosor brazo
  const gd = Math.max(1.5, zoom * 0.025); // grosor diagonal
  const tecW = Math.max(1, zoom * 0.012);
  const hlOff = g * 0.22;
  const gid = `msg-${pieza.id}`;

  // Placa en extremo del voladizo
  const placaH = Math.max(4, zoom * 0.04);
  const placaW = Math.max(2, zoom * 0.02);

  // Bounds de selección
  const minScreenX = Math.min(pO.x, pE.x, pD.x);
  const maxScreenX = Math.max(pO.x, pE.x, pD.x);
  const minScreenY = Math.min(pO.y, pE.y, pD.y);
  const maxScreenY = Math.max(pO.y, pE.y, pD.y);

  // Ángulo de la diagonal para gradiente perpendicular
  const ddx = pE.x - pD.x, ddy = pE.y - pD.y;
  const dLen = Math.sqrt(ddx * ddx + ddy * ddy);
  const dnx = dLen > 0 ? -ddy / dLen : 0;
  const dny = dLen > 0 ? ddx / dLen : 1;
  const diagAngle = Math.atan2(ddy, ddx);
  const cosA = Math.cos(diagAngle + Math.PI / 2);
  const sinA = Math.sin(diagAngle + Math.PI / 2);
  const gidDiag = `msd-${pieza.id}`;

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={minScreenX - 4} y={minScreenY - 4}
          width={maxScreenX - minScreenX + 8} height={maxScreenY - minScreenY + 8}
          fill="none" stroke="#E30613" strokeWidth="2" rx="2" />}
        {/* Brazo horizontal */}
        <line x1={pO.x} y1={pO.y} x2={pE.x} y2={pE.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" />
        {/* Diagonal de apoyo */}
        <line x1={pD.x} y1={pD.y} x2={pE.x} y2={pE.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round"
          strokeDasharray={`${Math.max(3, zoom * 0.04)} ${Math.max(2, zoom * 0.02)}`} />
        {/* Punto de conexión */}
        <circle cx={pO.x} cy={pO.y} r={Math.max(1.5, zoom * 0.015)}
          fill={sc} stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.003)} />
        {/* Marca extremo */}
        <line x1={pE.x} y1={pE.y - placaH} x2={pE.x} y2={pE.y + placaH}
          stroke={sc} strokeWidth={tecW} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradientes galvanizados */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={gidDiag}
          x1={0.5 - cosA * 0.5} y1={0.5 - sinA * 0.5}
          x2={0.5 + cosA * 0.5} y2={0.5 + sinA * 0.5}>
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Selección glow */}
      {seleccionada && <rect x={minScreenX - 4} y={minScreenY - 4}
        width={maxScreenX - minScreenX + 8} height={maxScreenY - minScreenY + 8}
        fill="none" stroke="#E30613" strokeWidth="2" rx="2" opacity="0.3" />}

      {/* ═══ Sombra brazo ═══ */}
      <line x1={pO.x} y1={pO.y + hlOff * 1.3} x2={pE.x} y2={pE.y + hlOff * 1.3}
        stroke="#000" strokeWidth={g} strokeLinecap="round" opacity="0.06" />

      {/* ═══ Brazo horizontal ═══ */}
      <line x1={pO.x} y1={pO.y} x2={pE.x} y2={pE.y}
        stroke={sc} strokeWidth={g} strokeLinecap="round" />
      {/* Overlay galvanizado brazo */}
      <line x1={pO.x} y1={pO.y} x2={pE.x} y2={pE.y}
        stroke={`url(#${gid})`} strokeWidth={g} strokeLinecap="round" />
      {/* Highlight brazo */}
      <line x1={pO.x} y1={pO.y - hlOff} x2={pE.x} y2={pE.y - hlOff}
        stroke="#fff" strokeWidth={g * 0.25} strokeLinecap="round" opacity="0.35" />
      {/* Edge light brazo */}
      <line x1={pO.x} y1={pO.y + hlOff * 0.5} x2={pE.x} y2={pE.y + hlOff * 0.5}
        stroke="#fff" strokeWidth={g * 0.06} strokeLinecap="round" opacity="0.12" />

      {/* ═══ Sombra diagonal ═══ */}
      <line x1={pD.x + hlOff} y1={pD.y + hlOff} x2={pE.x + hlOff} y2={pE.y + hlOff}
        stroke="#000" strokeWidth={gd} strokeLinecap="round" opacity="0.05" />

      {/* ═══ Diagonal de apoyo ═══ */}
      <line x1={pD.x} y1={pD.y} x2={pE.x} y2={pE.y}
        stroke={sc} strokeWidth={gd} strokeLinecap="round" opacity="0.75" />
      {/* Overlay galvanizado diagonal */}
      <line x1={pD.x} y1={pD.y} x2={pE.x} y2={pE.y}
        stroke={`url(#${gidDiag})`} strokeWidth={gd} strokeLinecap="round" />
      {/* Highlight diagonal */}
      <line x1={pD.x - dnx * gd * 0.2} y1={pD.y - dny * gd * 0.2}
        x2={pE.x - dnx * gd * 0.2} y2={pE.y - dny * gd * 0.2}
        stroke="#fff" strokeWidth={gd * 0.2} strokeLinecap="round" opacity="0.25" />

      {/* ═══ Punto conexión roseta ═══ */}
      <circle cx={pO.x} cy={pO.y} r={Math.max(2.5, zoom * 0.025)}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
      {/* Brillo punto */}
      {zoom > 30 && <circle cx={pO.x - Math.max(0.5, zoom * 0.005)} cy={pO.y - Math.max(0.5, zoom * 0.005)}
        r={Math.max(0.5, zoom * 0.006)} fill="#fff" opacity="0.35" />}

      {/* ═══ Punto inferior diagonal ═══ */}
      <circle cx={pD.x} cy={pD.y} r={Math.max(2, zoom * 0.018)}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.7" />

      {/* ═══ Placa extremo voladizo (mejorada) ═══ */}
      <rect x={pE.x - placaW / 2 + 0.3} y={pE.y - placaH + 0.3}
        width={placaW} height={placaH * 2} fill="#000" opacity="0.06" rx="0.5" />
      <rect x={pE.x - placaW / 2} y={pE.y - placaH}
        width={placaW} height={placaH * 2}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.004)} rx="0.5" />
      {/* Brillo placa */}
      <line x1={pE.x - placaW / 2 + 0.3} y1={pE.y - placaH + 0.5}
        x2={pE.x - placaW / 2 + 0.3} y2={pE.y + placaH - 0.5}
        stroke="#fff" strokeWidth={0.4} opacity="0.25" />

      {/* Etiqueta largo (zoom medio+) */}
      {zoom > 40 && w > 25 && (
        <text x={(pO.x + pE.x) / 2} y={pO.y - g - 3}
          fontSize={Math.max(5, zoom * 0.04)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.4">M {largo.toFixed(2)}m</text>
      )}
    </g>
  );
}
