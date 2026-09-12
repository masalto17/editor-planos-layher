// Plataforma — rectángulo con rejilla metálica, borde marco, ganchos de fijación.
// Rejilla visible a zoom medio. Efecto metálico con gradiente sutil.
// Superficie galvanizada con reflejos y textura de rejilla antideslizante.
export default function Plataforma({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;
  const h = Math.max(6, zoom * 0.065);       // espesor visual
  const hookW = Math.max(2, zoom * 0.018);   // ancho gancho
  const hookH = Math.max(3, zoom * 0.03);    // alto gancho colgante
  const gid = `pg-${pieza.id}`;

  // Rejilla vertical
  const rejilla = [];
  if (zoom > 25) {
    const step = Math.max(6, zoom * 0.08);
    for (let px = pL.x + step; px < pR.x; px += step) {
      rejilla.push(
        <line key={`v${px}`} x1={px} y1={pL.y - h + 1} x2={px} y2={pL.y - 1}
          stroke="#000" strokeWidth={Math.max(0.2, zoom * 0.002)} opacity="0.15" />
      );
    }
  }
  // Rejilla horizontal (solo zoom alto)
  if (zoom > 50) {
    const hStep = Math.max(3, h / 3);
    for (let py = pL.y - h + hStep; py < pL.y; py += hStep) {
      rejilla.push(
        <line key={`h${py}`} x1={pL.x + 1} y1={py} x2={pR.x - 1} y2={py}
          stroke="#000" strokeWidth={Math.max(0.2, zoom * 0.001)} opacity="0.1" />
      );
    }
  }

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 2} y={pL.y - h - 3} width={w + 4} height={h + hookH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        <rect x={pL.x} y={pL.y - h} width={w} height={h}
          fill="none" stroke={sc} strokeWidth={Math.max(0.8, zoom * 0.01)} />
        {zoom > 25 && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pL.y - h}
          stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.004)} opacity="0.3" />}
        {zoom > 25 && <line x1={pL.x} y1={pL.y - h} x2={pR.x} y2={pL.y}
          stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.004)} opacity="0.3" />}
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente metálico para superficie */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="20%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="80%" stopColor="#000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Selección */}
      {seleccionada && <rect x={pL.x - 2} y={pL.y - h - 3} width={w + 4} height={h + hookH + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}

      {/* Sombra */}
      <rect x={pL.x + 1} y={pL.y - h + 1} width={w} height={h}
        fill="#000" opacity="0.06" rx="1" />

      {/* Cuerpo plataforma */}
      <rect x={pL.x} y={pL.y - h} width={w} height={h}
        fill={sc} rx="1" opacity="0.9" />

      {/* Overlay galvanizado */}
      <rect x={pL.x} y={pL.y - h} width={w} height={h}
        fill={`url(#${gid})`} rx="1" />

      {/* Marco/borde */}
      <rect x={pL.x} y={pL.y - h} width={w} height={h}
        fill="none" stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} opacity="0.25" rx="1" />

      {/* Highlight superior (brillo metálico) */}
      <line x1={pL.x + 2} y1={pL.y - h + 1} x2={pR.x - 2} y2={pL.y - h + 1}
        stroke="#fff" strokeWidth={Math.max(0.5, zoom * 0.005)} opacity="0.35" />

      {/* Highlight lateral izq */}
      {h > 4 && (
        <line x1={pL.x + 0.5} y1={pL.y - h + 2} x2={pL.x + 0.5} y2={pL.y - 2}
          stroke="#fff" strokeWidth={0.5} opacity="0.15" />
      )}

      {/* Rejilla */}
      {rejilla}

      {/* Ganchos de fijación extremos (mejorados) */}
      <rect x={pL.x} y={pL.y} width={hookW} height={hookH}
        fill={sc} stroke="#000" strokeWidth="0.3" opacity="0.7" rx="0.3" />
      <rect x={pR.x - hookW} y={pR.y} width={hookW} height={hookH}
        fill={sc} stroke="#000" strokeWidth="0.3" opacity="0.7" rx="0.3" />
      {/* Brillo ganchos */}
      {zoom > 40 && <>
        <line x1={pL.x + 0.3} y1={pL.y + 0.5} x2={pL.x + 0.3} y2={pL.y + hookH - 0.5}
          stroke="#fff" strokeWidth={0.3} opacity="0.2" />
        <line x1={pR.x - hookW + 0.3} y1={pR.y + 0.5} x2={pR.x - hookW + 0.3} y2={pR.y + hookH - 0.5}
          stroke="#fff" strokeWidth={0.3} opacity="0.2" />
      </>}

      {/* Etiqueta largo × ancho (zoom medio+) */}
      {zoom > 40 && w > 40 && (
        <text x={pL.x + w / 2} y={pL.y - h - 2}
          fontSize={Math.max(6, zoom * 0.045)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.4">{largo.toFixed(2)}×{(pieza.anchoPlat || 0.32).toFixed(2)}m</text>
      )}
    </g>
  );
}
