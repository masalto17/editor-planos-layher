// Line Array — cluster de sonido colgado de la estructura (truss/horizontal).
// Se dibuja como una pila de cajas trapezoidales (más anchas abajo, más
// angostas arriba, como un cluster real) colgando desde el punto de anclaje
// (x, y) mediante un cable/cadena y un bumper de rigging.
// Subs: cajas rectangulares más grandes. Delay: una sola caja chica.
export default function LineArray({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, cajas = 1, tipoLA = 'top' } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const midX = (pL.x + pR.x) / 2;
  const topY = pL.y;
  const wAnchor = pR.x - pL.x;
  const gid = `lag-${pieza.id}`;

  const esSub = tipoLA === 'subVolado' || tipoLA === 'subApilado';
  const esDelay = tipoLA === 'delay';

  // Cantidad de cajas a dibujar (acotada para que no sature el canvas a bajo zoom)
  const nCajas = esDelay ? 1 : Math.max(1, Math.min(cajas, 14));

  // Dimensiones de caja en px, escaladas por zoom (representación decorativa)
  const boxWTop = esSub ? Math.max(14, zoom * 0.16) : Math.max(10, zoom * 0.13);
  const boxWBot = esSub ? boxWTop : boxWTop * 1.35; // trapecio: base más ancha
  const boxH = esSub ? Math.max(7, zoom * 0.075) : Math.max(4.5, zoom * 0.045);
  const gap = Math.max(0.5, zoom * 0.006);
  const bumperW = Math.max(boxWBot * 0.55, 8);
  const bumperH = Math.max(3, zoom * 0.025);
  const cableLen = Math.max(4, zoom * 0.04);
  const tecW = Math.max(0.8, zoom * 0.01);

  const totalH = nCajas * (boxH + gap) - gap;
  const stackTop = topY + bumperH + cableLen;

  const cajasEls = [];
  for (let i = 0; i < nCajas; i++) {
    const cy = stackTop + i * (boxH + gap);
    const wTop = esSub ? boxWTop : boxWTop;
    const wBot = esSub ? boxWBot : boxWBot;
    const pts = esSub
      ? `${midX - wTop / 2},${cy} ${midX + wTop / 2},${cy} ${midX + wBot / 2},${cy + boxH} ${midX - wBot / 2},${cy + boxH}`
      : `${midX - wTop / 2},${cy} ${midX + wTop / 2},${cy} ${midX + wBot / 2},${cy + boxH} ${midX - wBot / 2},${cy + boxH}`;
    cajasEls.push(
      <g key={i}>
        <polygon points={pts} fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.9" rx="1" />
        {!modoTecnico && (
          <polygon points={pts} fill={`url(#${gid})`} />
        )}
        {!modoTecnico && (
          <line x1={midX - wTop / 2 + 0.6} y1={cy + 0.6} x2={midX - wBot / 2 + 0.6} y2={cy + boxH - 0.6}
            stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} opacity="0.22" />
        )}
      </g>
    );
  }

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={midX - bumperW - 3} y={topY - 3} width={bumperW * 2 + 6} height={totalH + bumperH + cableLen + 6}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        <rect x={midX - bumperW / 2} y={topY} width={bumperW} height={bumperH} fill="none" stroke={sc} strokeWidth={tecW} />
        <line x1={midX} y1={topY + bumperH} x2={midX} y2={stackTop} stroke={sc} strokeWidth={tecW} />
        <rect x={midX - boxWBot / 2} y={stackTop} width={boxWBot} height={totalH} fill="none" stroke={sc} strokeWidth={tecW} />
        <line x1={midX} y1={stackTop} x2={midX} y2={stackTop + totalH} stroke={sc} strokeWidth={tecW * 0.7} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {seleccionada && <rect x={midX - bumperW - 3} y={topY - 3} width={bumperW * 2 + 6} height={totalH + bumperH + cableLen + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" opacity="0.5" />}

      {/* Bumper de rigging (chapa de fijación al truss/horizontal) */}
      <rect x={midX - bumperW / 2} y={topY} width={bumperW} height={bumperH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="1" opacity="0.9" />
      <line x1={midX - bumperW / 2 + 0.8} y1={topY + 0.8} x2={midX + bumperW / 2 - 0.8} y2={topY + 0.8}
        stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.003)} opacity="0.3" />

      {/* Cadena/cable de rigging */}
      <line x1={midX} y1={topY + bumperH} x2={midX} y2={stackTop}
        stroke="#444" strokeWidth={Math.max(0.5, zoom * 0.006)} strokeDasharray={zoom > 30 ? '1.5 1.2' : '0'} />

      {/* Pila de cajas */}
      {cajasEls}

      {/* Etiqueta */}
      {zoom > 40 && (
        <text x={midX} y={stackTop + totalH + 10}
          fontSize={Math.max(6, zoom * 0.045)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.55">
          {esDelay ? 'DLY' : esSub ? `SUB×${cajas}` : `LA×${cajas}`}
        </text>
      )}
    </g>
  );
}
