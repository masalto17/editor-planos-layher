// Luces — fixtures de iluminación colgados de truss/estructura (moving head,
// wash, spot, barra LED, strobe, PAR). (x, y) es el punto de anclaje sobre
// la estructura; el fixture cuelga hacia abajo. El haz de luz (cono) se
// muestra tenue solo a zoom alto.
export default function MovingHead({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, tipoLuz = 'movingHead' } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const midX = (pL.x + pR.x) / 2;
  const topY = pL.y;
  const wAnchor = Math.max(pR.x - pL.x, 4);
  const gid = `mhg-${pieza.id}`;

  const clampW = Math.max(6, zoom * 0.05);
  const clampH = Math.max(2.5, zoom * 0.02);
  const tecW = Math.max(0.8, zoom * 0.01);
  const showBeam = zoom > 30;

  const esBarra = tipoLuz === 'barra';
  const esParStrobe = tipoLuz === 'par' || tipoLuz === 'strobe';
  const esWash = tipoLuz === 'wash';

  // ─── Barra LED: rectángulo horizontal a todo el ancho de la pieza ──
  if (esBarra) {
    const barH = Math.max(3, zoom * 0.03);
    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={pL.x - 3} y={topY - clampH - 3} width={wAnchor + 6} height={clampH + barH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <rect x={pL.x} y={topY} width={wAnchor} height={barH} fill="none" stroke={sc} strokeWidth={tecW} />
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 3} y={topY - clampH - 3} width={wAnchor + 6} height={clampH + barH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        <rect x={midX - clampW / 2} y={topY - clampH} width={clampW} height={clampH} fill="#333" rx="0.5" />
        <rect x={pL.x} y={topY} width={wAnchor} height={barH} fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.6" opacity="0.9" />
        <line x1={pL.x + 1} y1={topY + 0.8} x2={pR.x - 1} y2={topY + 0.8}
          stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.003)} opacity="0.3" />
        {zoom > 45 && Array.from({ length: Math.max(2, Math.round(wAnchor / 6)) }, (_, i) => (
          <circle key={i} cx={pL.x + (wAnchor * (i + 0.5)) / Math.max(2, Math.round(wAnchor / 6))}
            cy={topY + barH / 2} r={Math.max(0.5, barH * 0.15)} fill="#fff" opacity="0.5" />
        ))}
      </g>
    );
  }

  // ─── PAR / Strobe: cuerpo simple circular/cuadrado ──
  if (esParStrobe) {
    const r = Math.max(3, zoom * 0.03);
    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <circle cx={midX} cy={topY + clampH + r} r={r + 3} fill="none" stroke="#E30613" strokeWidth="2" />}
          <line x1={midX} y1={topY} x2={midX} y2={topY + clampH} stroke={sc} strokeWidth={tecW} />
          {tipoLuz === 'strobe'
            ? <rect x={midX - r} y={topY + clampH} width={r * 2} height={r * 1.4} fill="none" stroke={sc} strokeWidth={tecW} />
            : <circle cx={midX} cy={topY + clampH + r} r={r} fill="none" stroke={sc} strokeWidth={tecW} />}
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <circle cx={midX} cy={topY + clampH + r} r={r + 3} fill="none" stroke="#E30613" strokeWidth="2" />}
        <rect x={midX - clampW / 3} y={topY} width={clampW * 0.66} height={clampH} fill="#333" rx="0.5" />
        {tipoLuz === 'strobe' ? (
          <rect x={midX - r} y={topY + clampH} width={r * 2} height={r * 1.4}
            fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.5" opacity="0.9" />
        ) : (
          <circle cx={midX} cy={topY + clampH + r} r={r}
            fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.9" />
        )}
        <circle cx={midX - r * 0.3} cy={topY + clampH + r * 0.7} r={r * 0.25} fill="#fff" opacity="0.4" />
        {showBeam && (
          <polygon points={`${midX - 1.5},${topY + clampH + r * 1.6} ${midX + 1.5},${topY + clampH + r * 1.6} ${midX + r * 2.2},${topY + clampH + r * 6} ${midX - r * 2.2},${topY + clampH + r * 6}`}
            fill={sc} opacity="0.08" />
        )}
      </g>
    );
  }

  // ─── Moving Head / Wash / Spot: yugo (horquilla) + cabeza ──
  const yokeW = Math.max(6, zoom * 0.06);
  const yokeH = Math.max(6, zoom * 0.06);
  const headR = esWash ? Math.max(4.5, zoom * 0.045) : Math.max(3.5, zoom * 0.035);
  const headRy = esWash ? headR * 0.7 : headR; // wash: cabeza más achatada

  const yokeTop = topY + clampH;
  const headCy = yokeTop + yokeH * 0.75;

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={midX - yokeW / 2 - 3} y={topY - 3} width={yokeW + 6} height={yokeH + headR * 2 + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        <line x1={midX} y1={topY} x2={midX} y2={yokeTop} stroke={sc} strokeWidth={tecW} />
        <circle cx={midX} cy={headCy} r={headR} fill="none" stroke={sc} strokeWidth={tecW} />
        <line x1={midX - headR} y1={headCy} x2={midX + headR} y2={headCy} stroke={sc} strokeWidth={tecW * 0.7} />
        <line x1={midX} y1={headCy - headR} x2={midX} y2={headCy + headR} stroke={sc} strokeWidth={tecW * 0.7} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      <defs>
        <radialGradient id={gid} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </radialGradient>
      </defs>

      {seleccionada && <rect x={midX - yokeW / 2 - 3} y={topY - 3} width={yokeW + 6} height={yokeH + headR * 2 + 6}
        fill="none" stroke="#E30613" strokeWidth="2" />}

      {/* Abrazadera al truss */}
      <rect x={midX - clampW / 2} y={topY} width={clampW} height={clampH} fill="#333" stroke="#000" strokeWidth="0.3" rx="0.5" />
      <line x1={midX} y1={topY + clampH} x2={midX} y2={yokeTop} stroke="#555" strokeWidth={Math.max(0.8, zoom * 0.008)} />

      {/* Yugo (horquilla en U invertida) */}
      <path d={`M ${midX - yokeW / 2} ${yokeTop} L ${midX - yokeW / 2} ${headCy} M ${midX + yokeW / 2} ${yokeTop} L ${midX + yokeW / 2} ${headCy} M ${midX - yokeW / 2} ${yokeTop} L ${midX + yokeW / 2} ${yokeTop}`}
        fill="none" stroke={sc} strokeWidth={Math.max(1, zoom * 0.014)} strokeLinecap="round" opacity="0.9" />

      {/* Haz de luz (tenue) */}
      {showBeam && (
        <polygon points={`${midX - 1.5},${headCy + headRy * 0.7} ${midX + 1.5},${headCy + headRy * 0.7} ${midX + headR * 3},${headCy + headR * 7} ${midX - headR * 3},${headCy + headR * 7}`}
          fill={sc} opacity="0.1" />
      )}

      {/* Cabeza (elipse: wash más achatado, MH/spot más redondo) */}
      <ellipse cx={midX} cy={headCy} rx={headR} ry={headRy}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.92" />
      <ellipse cx={midX} cy={headCy} rx={headR} ry={headRy} fill={`url(#${gid})`} />
      {/* Lente frontal */}
      <ellipse cx={midX} cy={headCy} rx={headR * 0.45} ry={headRy * 0.45} fill="#111" opacity="0.75" />
      <circle cx={midX - headR * 0.15} cy={headCy - headRy * 0.15} r={headR * 0.14} fill="#fff" opacity="0.5" />

      {/* Etiqueta */}
      {zoom > 48 && (
        <text x={midX} y={headCy + headRy + 9}
          fontSize={Math.max(5.5, zoom * 0.04)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.5">
          {tipoLuz === 'movingHead' ? 'MH' : tipoLuz === 'wash' ? 'WASH' : 'SPOT'}
        </text>
      )}
    </g>
  );
}
