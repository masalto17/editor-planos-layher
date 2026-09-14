// Pantalla LED — panel de video colgado o apoyado en la estructura.
// (x, y) es el anclaje superior (punto de la estructura del que cuelga el rigging);
// el panel cuelga hacia abajo `alto` metros y se extiende `largo` metros a la derecha.
// Rigging visible (cables desde el anclaje al marco), marco tipo perfil de aluminio
// con leve efecto 3D, estructura trasera insinuada a zoom medio, grilla de módulos y
// píxeles LED individuales a zoom muy alto, punto de balanceo y resplandor (glow).
export default function PantallaLED({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, alto = largo * 0.55 } = pieza;
  const m = (v) => v * zoom;

  const pAnc = worldToScreen(x, y); // punto de anclaje en la estructura
  const pTL = worldToScreen(x, y);
  const pBR = worldToScreen(x + largo, y - alto);
  const rx = pTL.x, ry = pTL.y, rw = pBR.x - pTL.x, rh = pBR.y - pTL.y;
  const cxTop = rx + rw / 2;

  const gid = `ledg-${pieza.id}`;
  const glowId = `ledglow-${pieza.id}`;
  const frame = Math.max(1, zoom * 0.01);
  const tecW = Math.max(0.7, zoom * 0.009);
  const brW = Math.max(4, zoom * 0.03), brH = Math.max(2, zoom * 0.015);

  // Puntos de cuelgue de las cadenas/cables (a 0.2 y 0.8 del ancho, en x mundo)
  const rig1x = worldToScreen(x + largo * 0.2, y).x;
  const rig2x = worldToScreen(x + largo * 0.8, y).x;

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={rx - 3} y={ry - 3} width={rw + 6} height={rh + 6}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}

        {/* Cables de rigging (modo técnico: líneas finas desde el anclaje) */}
        <line x1={rig1x} y1={pAnc.y} x2={rig1x} y2={ry} stroke={sc} strokeWidth={tecW * 0.6} strokeDasharray="2,1.5" />
        <line x1={rig2x} y1={pAnc.y} x2={rig2x} y2={ry} stroke={sc} strokeWidth={tecW * 0.6} strokeDasharray="2,1.5" />

        <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke={sc} strokeWidth={tecW} />
        <line x1={rx} y1={ry} x2={rx + rw} y2={ry + rh} stroke={sc} strokeWidth={tecW * 0.7} />
        <line x1={rx + rw} y1={ry} x2={rx} y2={ry + rh} stroke={sc} strokeWidth={tecW * 0.7} />

        {/* Marca de centro (cruz) en el punto de balanceo */}
        <line x1={cxTop - m(0.08)} y1={ry} x2={cxTop + m(0.08)} y2={ry} stroke={sc} strokeWidth={tecW * 0.6} />
        <line x1={cxTop} y1={ry - m(0.08)} x2={cxTop} y2={ry + m(0.08)} stroke={sc} strokeWidth={tecW * 0.6} />

        {/* Cota de dimensiones */}
        {rw > 24 && (
          <text x={cxTop} y={ry + rh + Math.max(8, zoom * 0.09)}
            fontSize={Math.max(5, zoom * 0.045)} fill={sc} textAnchor="middle"
            fontFamily="monospace" opacity="0.8">{largo.toFixed(2)}×{alto.toFixed(2)}m</text>
        )}
      </g>
    );
  }

  // Grilla de módulos LED (visible a zoom alto)
  const showGrid = zoom > 30;
  const showPixels = zoom > 50;
  const showBackStruct = zoom > 40;
  const modSize = Math.max(0.5, zoom * 0.0065); // tamaño de módulo en px (decorativo)
  const nx = Math.max(2, Math.round(rw / Math.max(6, modSize * 8)));
  const ny = Math.max(2, Math.round(rh / Math.max(6, modSize * 8)));
  const gridLines = [];
  const pixels = [];
  if (showGrid) {
    for (let i = 1; i < nx; i++) {
      const gx = rx + (rw * i) / nx;
      gridLines.push(<line key={`v${i}`} x1={gx} y1={ry + frame} x2={gx} y2={ry + rh - frame}
        stroke="#000" strokeWidth={0.3} opacity="0.12" />);
    }
    for (let j = 1; j < ny; j++) {
      const gy = ry + (rh * j) / ny;
      gridLines.push(<line key={`h${j}`} x1={rx + frame} y1={gy} x2={rx + rw - frame} y2={gy}
        stroke="#000" strokeWidth={0.3} opacity="0.12" />);
    }
    // Píxeles LED individuales dentro de cada celda de módulo (solo a zoom muy alto,
    // 1-2 puntos por celda para no disparar el conteo de elementos)
    if (showPixels) {
      const cellW = rw / nx, cellH = rh / ny;
      const pr = Math.max(0.4, Math.min(cellW, cellH) * 0.08);
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const cx = rx + cellW * (i + 0.5);
          const cy = ry + cellH * (j + 0.5);
          pixels.push(<circle key={`p${i}-${j}`} cx={cx} cy={cy} r={pr} fill="#fff" opacity="0.22" />);
        }
      }
    }
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor={sc} stopOpacity="0.35" />
          <stop offset="100%" stopColor={sc} stopOpacity="0" />
        </radialGradient>
      </defs>

      {seleccionada && <rect x={rx - 4} y={ry - 4} width={rw + 8} height={rh + 8}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}

      {/* Resplandor (glow) alrededor de la pantalla */}
      <rect x={rx - rw * 0.15} y={ry - rh * 0.15} width={rw * 1.3} height={rh * 1.3}
        fill={`url(#${glowId})`} />

      {/* Estructura trasera insinuada (travesaño horizontal + montantes, detrás del panel) */}
      {showBackStruct && (
        <g opacity="0.35">
          <line x1={rx + rw * 0.04} y1={ry + rh * 0.5} x2={rx + rw * 0.96} y2={ry + rh * 0.5}
            stroke="#333" strokeWidth={Math.max(0.6, zoom * 0.006)} />
          <line x1={rx + rw * 0.5} y1={ry + rh * 0.06} x2={rx + rw * 0.5} y2={ry + rh * 0.94}
            stroke="#333" strokeWidth={Math.max(0.5, zoom * 0.005)} />
        </g>
      )}

      {/* Cadenas/cables de rigging desde el punto de anclaje de la estructura hasta el marco */}
      <line x1={rig1x} y1={pAnc.y} x2={rig1x} y2={ry} stroke="#555" strokeWidth={Math.max(0.8, zoom * 0.009)} opacity="0.85" />
      <line x1={rig2x} y1={pAnc.y} x2={rig2x} y2={ry} stroke="#555" strokeWidth={Math.max(0.8, zoom * 0.009)} opacity="0.85" />
      {zoom > 25 && (
        <>
          <circle cx={rig1x} cy={pAnc.y} r={Math.max(0.8, zoom * 0.008)} fill="#333" />
          <circle cx={rig2x} cy={pAnc.y} r={Math.max(0.8, zoom * 0.008)} fill="#333" />
        </>
      )}

      {/* Ménsulas de fijación superiores */}
      <rect x={rx + rw * 0.2 - brW / 2} y={ry - brH} width={brW} height={brH} fill={sc} opacity="0.85" rx="0.5" />
      <rect x={rx + rw * 0.8 - brW / 2} y={ry - brH} width={brW} height={brH} fill={sc} opacity="0.85" rx="0.5" />

      {/* Marco (perfil de aluminio) — más grueso, con highlight superior y sombra inferior para efecto 3D */}
      <rect x={rx} y={ry} width={rw} height={rh}
        fill="#161616" stroke="#000" strokeWidth={Math.max(0.4, zoom * 0.004)} rx="1" opacity="0.95" />
      {/* Highlight del borde superior del perfil (luz incidiendo desde arriba) */}
      <rect x={rx} y={ry} width={rw} height={Math.max(0.8, frame * 0.5)}
        fill="#fff" opacity="0.18" />
      {/* Sombra del borde inferior del perfil */}
      <rect x={rx} y={ry + rh - Math.max(0.8, frame * 0.5)} width={rw} height={Math.max(0.8, frame * 0.5)}
        fill="#000" opacity="0.3" />

      {/* Panel activo */}
      <rect x={rx + frame} y={ry + frame} width={Math.max(0, rw - frame * 2)} height={Math.max(0, rh - frame * 2)}
        fill={sc} opacity="0.85" />
      <rect x={rx + frame} y={ry + frame} width={Math.max(0, rw - frame * 2)} height={Math.max(0, rh - frame * 2)}
        fill={`url(#${gid})`} />

      {/* Grilla de módulos y píxeles LED */}
      {gridLines}
      {pixels}

      {/* Highlight superior del bisel del perfil (más fino, sobre el borde interno) */}
      <line x1={rx + 1} y1={ry + 1} x2={rx + rw - 1} y2={ry + 1}
        stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} opacity="0.25" />

      {/* Punto de balanceo (rigging point) — centro superior */}
      {zoom > 22 && (
        <circle cx={cxTop} cy={ry} r={Math.max(1, zoom * 0.011)}
          fill="none" stroke="#fff" strokeWidth={Math.max(0.5, zoom * 0.005)} opacity="0.7" />
      )}

      {/* Etiqueta */}
      {zoom > 40 && rw > 30 && (
        <text x={rx + rw / 2} y={ry + rh / 2}
          fontSize={Math.max(6, zoom * 0.05)} fill="#fff" textAnchor="middle" dominantBaseline="middle"
          fontFamily="monospace" opacity="0.55">LED {largo.toFixed(1)}×{alto.toFixed(1)}</text>
      )}
    </g>
  );
}
