// Luces — fixtures de iluminación colgados de truss/estructura.
// Soporta: movingHead, wash, beam, spot, par, fresnel, profile, followSpot,
// strobe, blinder, laser, barra, hazer.
// (x, y) = punto de anclaje; el fixture cuelga hacia abajo.
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
  const showBeam = zoom > 25;

  // ─── Abrazadera al truss (reutilizable) ──
  const renderClamp = (cx, cy, w = clampW, h = clampH) => (
    <>
      <rect x={cx - w / 2} y={cy} width={w} height={h}
        fill={modoTecnico ? 'none' : '#333'} stroke={modoTecnico ? sc : '#000'}
        strokeWidth={modoTecnico ? tecW : 0.3} rx="0.5" />
      {!modoTecnico && (
        <line x1={cx - w / 2 + 0.5} y1={cy + 0.5} x2={cx + w / 2 - 0.5} y2={cy + 0.5}
          stroke="#fff" strokeWidth={0.4} opacity="0.2" />
      )}
    </>
  );

  // ─── BARRA LED ──────────────────────────────────────────────
  if (tipoLuz === 'barra') {
    const barH = Math.max(3, zoom * 0.03);
    const nLEDs = Math.max(3, Math.round(wAnchor / Math.max(4, zoom * 0.04)));
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
        {renderClamp(pL.x + wAnchor * 0.2, topY - clampH, clampW * 0.7, clampH)}
        {renderClamp(pL.x + wAnchor * 0.8, topY - clampH, clampW * 0.7, clampH)}
        <rect x={pL.x + 0.4} y={topY + 0.4} width={wAnchor} height={barH}
          fill="#000" opacity="0.06" rx="0.6" />
        <rect x={pL.x} y={topY} width={wAnchor} height={barH}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.6" opacity="0.9" />
        <line x1={pL.x + 1} y1={topY + 0.8} x2={pR.x - 1} y2={topY + 0.8}
          stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.003)} opacity="0.3" />
        {zoom > 35 && Array.from({ length: nLEDs }, (_, i) => (
          <circle key={i} cx={pL.x + (wAnchor * (i + 0.5)) / nLEDs}
            cy={topY + barH / 2} r={Math.max(0.8, barH * 0.2)} fill="#fff" opacity="0.45" />
        ))}
        {showBeam && (
          <rect x={pL.x} y={topY + barH} width={wAnchor} height={Math.max(4, zoom * 0.04)}
            fill={sc} opacity="0.06" />
        )}
      </g>
    );
  }

  // ─── BLINDER ────────────────────────────────────────────────
  if (tipoLuz === 'blinder') {
    const bodyH = Math.max(5, zoom * 0.05);
    const nCells = largo >= 0.5 ? 4 : 2;
    const cellGap = Math.max(1, zoom * 0.01);
    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wAnchor + 6} height={clampH + bodyH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <rect x={pL.x} y={topY + clampH} width={wAnchor} height={bodyH} fill="none" stroke={sc} strokeWidth={tecW} />
          {Array.from({ length: nCells - 1 }, (_, i) => (
            <line key={i} x1={pL.x + (wAnchor * (i + 1)) / nCells} y1={topY + clampH}
              x2={pL.x + (wAnchor * (i + 1)) / nCells} y2={topY + clampH + bodyH}
              stroke={sc} strokeWidth={tecW * 0.5} />
          ))}
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wAnchor + 6} height={clampH + bodyH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(midX, topY)}
        <rect x={pL.x} y={topY + clampH} width={wAnchor} height={bodyH}
          fill="#222" stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.5" opacity="0.9" />
        {Array.from({ length: nCells }, (_, i) => {
          const cellW = (wAnchor - (nCells + 1) * cellGap) / nCells;
          const cx = pL.x + cellGap + i * (cellW + cellGap) + cellW / 2;
          const cy = topY + clampH + bodyH / 2;
          return <circle key={i} cx={cx} cy={cy} r={Math.min(cellW, bodyH) * 0.35}
            fill="#fde68a" opacity="0.7" />;
        })}
        {showBeam && (
          <rect x={pL.x - 1} y={topY + clampH + bodyH} width={wAnchor + 2} height={Math.max(6, zoom * 0.06)}
            fill="#fde68a" opacity="0.08" />
        )}
      </g>
    );
  }

  // ─── HAZER (máquina de haze) ────────────────────────────────
  if (tipoLuz === 'hazer') {
    const bodyH = Math.max(5, zoom * 0.05);
    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wAnchor + 6} height={clampH + bodyH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <rect x={pL.x} y={topY + clampH} width={wAnchor} height={bodyH} fill="none" stroke={sc} strokeWidth={tecW} />
          <text x={midX} y={topY + clampH + bodyH / 2 + 2} fontSize={Math.max(4, zoom * 0.03)}
            fill={sc} textAnchor="middle" fontFamily="monospace">H</text>
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wAnchor + 6} height={clampH + bodyH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(midX, topY)}
        <rect x={pL.x + 0.4} y={topY + clampH + 0.4} width={wAnchor} height={bodyH}
          fill="#000" opacity="0.06" rx="1" />
        <rect x={pL.x} y={topY + clampH} width={wAnchor} height={bodyH}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="1" opacity="0.85" />
        <line x1={pL.x + 1} y1={topY + clampH + 1} x2={pL.x + wAnchor - 1} y2={topY + clampH + 1}
          stroke="#fff" strokeWidth={0.4} opacity="0.2" />
        {/* Salida de humo */}
        {zoom > 35 && (
          <circle cx={pL.x + wAnchor * 0.7} cy={topY + clampH + bodyH / 2}
            r={Math.max(1.5, bodyH * 0.2)} fill="#e2e8f0" opacity="0.4" />
        )}
        {zoom > 40 && (
          <text x={midX} y={topY + clampH + bodyH + 8}
            fontSize={Math.max(5, zoom * 0.035)} fill={sc} textAnchor="middle"
            fontFamily="monospace" opacity="0.5">HAZE</text>
        )}
      </g>
    );
  }

  // ─── LÁSER ──────────────────────────────────────────────────
  if (tipoLuz === 'laser') {
    const bodyR = Math.max(4, zoom * 0.04);
    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={midX - bodyR - 3} y={topY - 3} width={bodyR * 2 + 6} height={clampH + bodyR * 2 + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <line x1={midX} y1={topY} x2={midX} y2={topY + clampH} stroke={sc} strokeWidth={tecW} />
          <rect x={midX - bodyR} y={topY + clampH} width={bodyR * 2} height={bodyR * 1.5}
            fill="none" stroke={sc} strokeWidth={tecW} />
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={midX - bodyR - 3} y={topY - 3} width={bodyR * 2 + 6} height={clampH + bodyR * 2 + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(midX, topY, clampW * 0.7, clampH)}
        <rect x={midX - bodyR} y={topY + clampH} width={bodyR * 2} height={bodyR * 1.5}
          fill="#111" stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="1" opacity="0.9" />
        <circle cx={midX} cy={topY + clampH + bodyR * 0.5} r={bodyR * 0.3}
          fill={sc} opacity="0.8" />
        <circle cx={midX} cy={topY + clampH + bodyR * 0.5} r={bodyR * 0.15}
          fill="#fff" opacity="0.6" />
        {/* Haces de láser */}
        {showBeam && (
          <>
            <line x1={midX} y1={topY + clampH + bodyR * 1.5}
              x2={midX - bodyR * 4} y2={topY + clampH + bodyR * 8}
              stroke={sc} strokeWidth={0.6} opacity="0.15" />
            <line x1={midX} y1={topY + clampH + bodyR * 1.5}
              x2={midX + bodyR * 3} y2={topY + clampH + bodyR * 7}
              stroke={sc} strokeWidth={0.6} opacity="0.15" />
            <line x1={midX} y1={topY + clampH + bodyR * 1.5}
              x2={midX} y2={topY + clampH + bodyR * 9}
              stroke={sc} strokeWidth={0.6} opacity="0.12" />
          </>
        )}
      </g>
    );
  }

  // ─── PAR / Fresnel / Profile / Strobe / Follow Spot ────────
  const esSimple = ['par', 'fresnel', 'profile', 'strobe', 'followSpot'].includes(tipoLuz);
  if (esSimple) {
    const esRect = tipoLuz === 'strobe';
    const esFollow = tipoLuz === 'followSpot';
    const r = esFollow ? Math.max(5, zoom * 0.05) : Math.max(3.5, zoom * 0.035);
    const bodyH = esRect ? r * 1.4 : esFollow ? r * 2 : r * 2;

    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={midX - r - 3} y={topY - 3} width={r * 2 + 6} height={clampH + bodyH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <line x1={midX} y1={topY} x2={midX} y2={topY + clampH} stroke={sc} strokeWidth={tecW} />
          {esRect
            ? <rect x={midX - r} y={topY + clampH} width={r * 2} height={bodyH} fill="none" stroke={sc} strokeWidth={tecW} />
            : <circle cx={midX} cy={topY + clampH + r} r={r} fill="none" stroke={sc} strokeWidth={tecW} />}
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={midX - r - 3} y={topY - 3} width={r * 2 + 6} height={clampH + bodyH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(midX, topY, clampW * (esFollow ? 0.5 : 0.66), clampH)}
        {/* Brazo articulado (follow spot es más largo) */}
        <line x1={midX} y1={topY + clampH} x2={midX} y2={topY + clampH + (esFollow ? 3 : 0)}
          stroke="#555" strokeWidth={Math.max(0.8, zoom * 0.008)} />
        {esRect ? (
          <rect x={midX - r} y={topY + clampH} width={r * 2} height={bodyH}
            fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.5" opacity="0.9" />
        ) : (
          <>
            {esFollow && (
              <rect x={midX - r * 0.7} y={topY + clampH + 3} width={r * 1.4} height={r * 2.5}
                fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="1" opacity="0.85" />
            )}
            <circle cx={midX} cy={topY + clampH + r + (esFollow ? 3 : 0)} r={r}
              fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.9" />
          </>
        )}
        {/* Lente */}
        <circle cx={midX - r * 0.2} cy={topY + clampH + r * 0.8 + (esFollow ? 3 : 0)}
          r={r * 0.22} fill="#fff" opacity="0.4" />
        {/* Haz de luz */}
        {showBeam && (
          <polygon points={`${midX - 1.5},${topY + clampH + bodyH + (esFollow ? 3 : 0)} ${midX + 1.5},${topY + clampH + bodyH + (esFollow ? 3 : 0)} ${midX + r * 2.5},${topY + clampH + bodyH + r * 6} ${midX - r * 2.5},${topY + clampH + bodyH + r * 6}`}
            fill={sc} opacity="0.07" />
        )}
        {/* Etiqueta (fresnel/profile/follow) */}
        {zoom > 45 && (
          <text x={midX} y={topY + clampH + bodyH + (esFollow ? 12 : 9)}
            fontSize={Math.max(5, zoom * 0.035)} fill={sc} textAnchor="middle"
            fontFamily="monospace" opacity="0.5">
            {tipoLuz === 'fresnel' ? 'FRES' : tipoLuz === 'profile' ? 'PROF' : tipoLuz === 'followSpot' ? 'FOLLOW' : tipoLuz === 'strobe' ? 'STRB' : 'PAR'}
          </text>
        )}
      </g>
    );
  }

  // ─── Moving Head / Wash / Beam / Spot: yugo + cabeza ───────
  const esWash = tipoLuz === 'wash';
  const esBeam = tipoLuz === 'beam';
  const yokeW = Math.max(6, zoom * 0.06);
  const yokeH = Math.max(6, zoom * 0.06);
  const headR = esWash ? Math.max(5, zoom * 0.05) : esBeam ? Math.max(3, zoom * 0.028) : Math.max(4, zoom * 0.04);
  const headRy = esWash ? headR * 0.65 : headR;

  const yokeTop = topY + clampH;
  const headCy = yokeTop + yokeH * 0.75;

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={midX - yokeW / 2 - 3} y={topY - 3} width={yokeW + 6} height={yokeH + headR * 2 + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        <line x1={midX} y1={topY} x2={midX} y2={yokeTop} stroke={sc} strokeWidth={tecW} />
        <path d={`M ${midX - yokeW / 2} ${yokeTop} L ${midX - yokeW / 2} ${headCy} M ${midX + yokeW / 2} ${yokeTop} L ${midX + yokeW / 2} ${headCy} M ${midX - yokeW / 2} ${yokeTop} L ${midX + yokeW / 2} ${yokeTop}`}
          fill="none" stroke={sc} strokeWidth={tecW} />
        <ellipse cx={midX} cy={headCy} rx={headR} ry={headRy} fill="none" stroke={sc} strokeWidth={tecW} />
        <line x1={midX - headR * 0.6} y1={headCy} x2={midX + headR * 0.6} y2={headCy} stroke={sc} strokeWidth={tecW * 0.5} />
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

      {/* Abrazadera */}
      {renderClamp(midX, topY)}
      <line x1={midX} y1={topY + clampH} x2={midX} y2={yokeTop}
        stroke="#555" strokeWidth={Math.max(0.8, zoom * 0.008)} />

      {/* Haz de luz (debajo, tenue) */}
      {showBeam && (
        <polygon points={`${midX - 1.5},${headCy + headRy * 0.7} ${midX + 1.5},${headCy + headRy * 0.7} ${midX + headR * 3.5},${headCy + headR * 8} ${midX - headR * 3.5},${headCy + headR * 8}`}
          fill={sc} opacity={esBeam ? 0.06 : 0.08} />
      )}

      {/* Yugo (horquilla en U invertida) */}
      <path d={`M ${midX - yokeW / 2} ${yokeTop} L ${midX - yokeW / 2} ${headCy} M ${midX + yokeW / 2} ${yokeTop} L ${midX + yokeW / 2} ${headCy} M ${midX - yokeW / 2} ${yokeTop} L ${midX + yokeW / 2} ${yokeTop}`}
        fill="none" stroke={sc} strokeWidth={Math.max(1, zoom * 0.014)} strokeLinecap="round" opacity="0.9" />

      {/* Cabeza */}
      <ellipse cx={midX + 0.4} cy={headCy + 0.4} rx={headR} ry={headRy}
        fill="#000" opacity="0.06" />
      <ellipse cx={midX} cy={headCy} rx={headR} ry={headRy}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.92" />
      <ellipse cx={midX} cy={headCy} rx={headR} ry={headRy} fill={`url(#${gid})`} />
      {/* Lente frontal */}
      <ellipse cx={midX} cy={headCy} rx={headR * 0.45} ry={headRy * 0.45} fill="#111" opacity="0.7" />
      <circle cx={midX - headR * 0.15} cy={headCy - headRy * 0.15} r={headR * 0.14} fill="#fff" opacity="0.5" />

      {/* Etiqueta */}
      {zoom > 42 && (
        <text x={midX} y={headCy + headRy + Math.max(8, zoom * 0.06)}
          fontSize={Math.max(5.5, zoom * 0.04)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.5">
          {esBeam ? 'BEAM' : esWash ? 'WASH' : tipoLuz === 'spot' ? 'SPOT' : 'MH'}
        </text>
      )}
    </g>
  );
}
