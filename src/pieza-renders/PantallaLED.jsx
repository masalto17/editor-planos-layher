// Pantalla LED — panel de video colgado o apoyado en la estructura.
// (x, y) es el anclaje superior; el panel cuelga hacia abajo `alto` metros
// y se extiende `largo` metros a la derecha. Grilla de módulos LED visible
// a zoom alto, marco con bisel y leve resplandor (glow) alrededor.
export default function PantallaLED({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, alto = largo * 0.55 } = pieza;
  const pTL = worldToScreen(x, y);
  const pBR = worldToScreen(x + largo, y - alto);
  const rx = pTL.x, ry = pTL.y, rw = pBR.x - pTL.x, rh = pBR.y - pTL.y;
  const gid = `ledg-${pieza.id}`;
  const glowId = `ledglow-${pieza.id}`;
  const frame = Math.max(1, zoom * 0.01);
  const tecW = Math.max(0.7, zoom * 0.009);
  const brW = Math.max(4, zoom * 0.03), brH = Math.max(2, zoom * 0.015);

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={rx - 3} y={ry - 3} width={rw + 6} height={rh + 6}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke={sc} strokeWidth={tecW} />
        <line x1={rx} y1={ry} x2={rx + rw} y2={ry + rh} stroke={sc} strokeWidth={tecW * 0.7} />
        <line x1={rx + rw} y1={ry} x2={rx} y2={ry + rh} stroke={sc} strokeWidth={tecW * 0.7} />
      </g>
    );
  }

  // Grilla de módulos LED (visible a zoom alto)
  const showGrid = zoom > 30;
  const modSize = Math.max(0.5, zoom * 0.0065); // tamaño de módulo en px (decorativo)
  const nx = Math.max(2, Math.round(rw / Math.max(6, modSize * 8)));
  const ny = Math.max(2, Math.round(rh / Math.max(6, modSize * 8)));
  const gridLines = [];
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

      {/* Ménsulas de fijación superiores */}
      <rect x={rx + rw * 0.2 - brW / 2} y={ry - brH} width={brW} height={brH} fill={sc} opacity="0.85" rx="0.5" />
      <rect x={rx + rw * 0.8 - brW / 2} y={ry - brH} width={brW} height={brH} fill={sc} opacity="0.85" rx="0.5" />

      {/* Marco (bisel oscuro) */}
      <rect x={rx} y={ry} width={rw} height={rh}
        fill="#111" stroke="#000" strokeWidth={Math.max(0.4, zoom * 0.004)} rx="1" opacity="0.95" />

      {/* Panel activo */}
      <rect x={rx + frame} y={ry + frame} width={Math.max(0, rw - frame * 2)} height={Math.max(0, rh - frame * 2)}
        fill={sc} opacity="0.85" />
      <rect x={rx + frame} y={ry + frame} width={Math.max(0, rw - frame * 2)} height={Math.max(0, rh - frame * 2)}
        fill={`url(#${gid})`} />

      {/* Grilla de módulos */}
      {gridLines}

      {/* Highlight superior */}
      <line x1={rx + 1} y1={ry + 1} x2={rx + rw - 1} y2={ry + 1}
        stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} opacity="0.25" />

      {/* Etiqueta */}
      {zoom > 40 && rw > 30 && (
        <text x={rx + rw / 2} y={ry + rh / 2}
          fontSize={Math.max(6, zoom * 0.05)} fill="#fff" textAnchor="middle" dominantBaseline="middle"
          fontFamily="monospace" opacity="0.55">{largo.toFixed(1)}×{alto.toFixed(1)}</text>
      )}
    </g>
  );
}
