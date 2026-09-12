// Luces — fixtures de iluminación colgados de truss/estructura.
// Todas las dimensiones en metros reales → convertidas via zoom para escala correcta.
// (x, y) = punto de anclaje (clamp al truss); el fixture cuelga hacia abajo.
export default function MovingHead({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, tipoLuz = 'movingHead' } = pieza;
  const gid = `mhg-${pieza.id}`;

  // Posiciones y dimensiones en pantalla
  const pL = worldToScreen(x, y);
  const pR = worldToScreen(x + largo, y);
  const midX = (pL.x + pR.x) / 2;
  const topY = pL.y;
  const wPx = Math.max(4, pR.x - pL.x);

  // metros → píxeles (para dimensiones proporcionales)
  const m = (v) => v * zoom;
  const sw = Math.max(0.4, zoom * 0.004);
  const tecW = Math.max(0.8, zoom * 0.012);
  const showDetail = zoom > 25;
  const showBeam = zoom > 18;

  // ── Clamp universal (abrazadera al truss) ──
  const clampW = m(0.08);
  const clampH = m(0.035);

  const renderClamp = (cx, cy, cw = clampW, ch = clampH) => (
    <>
      <rect x={cx - cw / 2} y={cy} width={cw} height={ch}
        fill={modoTecnico ? 'none' : '#333'} stroke={modoTecnico ? sc : '#000'}
        strokeWidth={modoTecnico ? tecW : sw} rx={Math.max(0.3, m(0.003))} />
      {!modoTecnico && cw > 3 && (
        <line x1={cx - cw / 2 + 0.5} y1={cy + 0.5} x2={cx + cw / 2 - 0.5} y2={cy + 0.5}
          stroke="#fff" strokeWidth={0.4} opacity="0.2" />
      )}
    </>
  );

  // ─── BARRA LED ──────────────────────────────────────────────
  if (tipoLuz === 'barra') {
    const barH = m(0.08);
    const nLEDs = Math.max(3, Math.round(wPx / Math.max(3, m(0.06))));
    const totalH = clampH + barH;

    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <rect x={pL.x} y={topY + clampH} width={wPx} height={barH}
            fill="none" stroke={sc} strokeWidth={tecW} />
          <line x1={pL.x + wPx * 0.2} y1={topY} x2={pL.x + wPx * 0.2} y2={topY + clampH}
            stroke={sc} strokeWidth={tecW * 0.7} />
          <line x1={pL.x + wPx * 0.8} y1={topY} x2={pL.x + wPx * 0.8} y2={topY + clampH}
            stroke={sc} strokeWidth={tecW * 0.7} />
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(pL.x + wPx * 0.2, topY, clampW * 0.7, clampH)}
        {renderClamp(pL.x + wPx * 0.8, topY, clampW * 0.7, clampH)}
        {/* Sombra */}
        <rect x={pL.x + 0.5} y={topY + clampH + 0.5} width={wPx} height={barH}
          fill="#000" opacity="0.06" rx={m(0.005)} />
        {/* Cuerpo */}
        <rect x={pL.x} y={topY + clampH} width={wPx} height={barH}
          fill={sc} stroke="#000" strokeWidth={sw} rx={m(0.005)} opacity="0.9" />
        {/* Highlight */}
        <line x1={pL.x + 1} y1={topY + clampH + 0.8} x2={pR.x - 1} y2={topY + clampH + 0.8}
          stroke="#fff" strokeWidth={Math.max(0.4, m(0.003))} opacity="0.3" />
        {/* LEDs individuales */}
        {showDetail && Array.from({ length: nLEDs }, (_, i) => (
          <circle key={i} cx={pL.x + (wPx * (i + 0.5)) / nLEDs}
            cy={topY + clampH + barH / 2} r={Math.max(0.8, barH * 0.2)}
            fill="#fff" opacity="0.45" />
        ))}
        {/* Haz de luz difuso */}
        {showBeam && (
          <rect x={pL.x} y={topY + totalH} width={wPx} height={m(0.15)}
            fill={sc} opacity="0.06" />
        )}
        {/* Etiqueta */}
        {showDetail && wPx > 15 && (
          <text x={midX} y={topY + totalH + m(0.10)}
            fontSize={Math.max(6, m(0.05))} fill={sc} textAnchor="middle"
            fontFamily="sans-serif" fontWeight="bold" opacity="0.5">
            BARRA
          </text>
        )}
      </g>
    );
  }

  // ─── BLINDER ────────────────────────────────────────────────
  if (tipoLuz === 'blinder') {
    const bodyH = m(0.18);
    const nCells = largo >= 0.5 ? 4 : 2;
    const cellGap = m(0.01);
    const totalH = clampH + bodyH;

    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <rect x={pL.x} y={topY + clampH} width={wPx} height={bodyH}
            fill="none" stroke={sc} strokeWidth={tecW} />
          {Array.from({ length: nCells - 1 }, (_, i) => (
            <line key={i} x1={pL.x + (wPx * (i + 1)) / nCells} y1={topY + clampH}
              x2={pL.x + (wPx * (i + 1)) / nCells} y2={topY + clampH + bodyH}
              stroke={sc} strokeWidth={tecW * 0.5} />
          ))}
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(midX, topY)}
        {/* Sombra */}
        <rect x={pL.x + 0.5} y={topY + clampH + 0.5} width={wPx} height={bodyH}
          fill="#000" opacity="0.06" rx={m(0.004)} />
        {/* Cuerpo */}
        <rect x={pL.x} y={topY + clampH} width={wPx} height={bodyH}
          fill="#222" stroke="#000" strokeWidth={sw} rx={m(0.004)} opacity="0.9" />
        {/* Celdas con lámparas */}
        {Array.from({ length: nCells }, (_, i) => {
          const cellW = (wPx - (nCells + 1) * cellGap) / nCells;
          const cx = pL.x + cellGap + i * (cellW + cellGap) + cellW / 2;
          const cy = topY + clampH + bodyH / 2;
          const r = Math.min(cellW, bodyH) * 0.35;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="#fde68a" opacity="0.7" />
              {showDetail && <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.2} fill="#fff" opacity="0.4" />}
            </g>
          );
        })}
        {/* Haz de luz cálido */}
        {showBeam && (
          <rect x={pL.x - m(0.02)} y={topY + totalH} width={wPx + m(0.04)} height={m(0.20)}
            fill="#fde68a" opacity="0.06" />
        )}
      </g>
    );
  }

  // ─── HAZER (máquina de haze) ────────────────────────────────
  if (tipoLuz === 'hazer') {
    const bodyH = m(0.22);
    const totalH = clampH + bodyH;

    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <rect x={pL.x} y={topY + clampH} width={wPx} height={bodyH}
            fill="none" stroke={sc} strokeWidth={tecW} />
          <text x={midX} y={topY + clampH + bodyH / 2 + m(0.02)}
            fontSize={Math.max(5, m(0.04))} fill={sc} textAnchor="middle" fontFamily="monospace">H</text>
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(midX, topY)}
        {/* Sombra */}
        <rect x={pL.x + 0.5} y={topY + clampH + 0.5} width={wPx} height={bodyH}
          fill="#000" opacity="0.06" rx={m(0.008)} />
        {/* Cuerpo */}
        <rect x={pL.x} y={topY + clampH} width={wPx} height={bodyH}
          fill={sc} stroke="#000" strokeWidth={sw} rx={m(0.008)} opacity="0.85" />
        {/* Highlight */}
        <line x1={pL.x + 1} y1={topY + clampH + 1} x2={pR.x - 1} y2={topY + clampH + 1}
          stroke="#fff" strokeWidth={0.4} opacity="0.2" />
        {/* Salida de humo */}
        {showDetail && (
          <circle cx={pL.x + wPx * 0.7} cy={topY + clampH + bodyH / 2}
            r={Math.max(1.5, bodyH * 0.2)} fill="#e2e8f0" opacity="0.4" />
        )}
        {/* Etiqueta */}
        {showDetail && wPx > 10 && (
          <text x={midX} y={topY + totalH + m(0.08)}
            fontSize={Math.max(5, m(0.04))} fill={sc} textAnchor="middle"
            fontFamily="sans-serif" fontWeight="bold" opacity="0.5">HAZE</text>
        )}
      </g>
    );
  }

  // ─── LÁSER ──────────────────────────────────────────────────
  if (tipoLuz === 'laser') {
    const dropH = m(0.02);
    const bodyH = m(0.18);
    const laserTopY = topY + clampH + dropH;
    const totalH = clampH + dropH + bodyH;

    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={midX - wPx / 2 - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <line x1={midX} y1={topY} x2={midX} y2={laserTopY} stroke={sc} strokeWidth={tecW} />
          <rect x={midX - wPx / 2} y={laserTopY} width={wPx} height={bodyH}
            fill="none" stroke={sc} strokeWidth={tecW} />
        </g>
      );
    }
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={midX - wPx / 2 - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(midX, topY, clampW * 0.7, clampH)}
        <line x1={midX} y1={topY + clampH} x2={midX} y2={laserTopY}
          stroke="#555" strokeWidth={Math.max(0.8, m(0.006))} />
        {/* Sombra */}
        <rect x={midX - wPx / 2 + 0.5} y={laserTopY + 0.5} width={wPx} height={bodyH}
          fill="#000" opacity="0.06" rx={m(0.005)} />
        {/* Cuerpo */}
        <rect x={midX - wPx / 2} y={laserTopY} width={wPx} height={bodyH}
          fill="#111" stroke="#000" strokeWidth={sw} rx={m(0.005)} opacity="0.9" />
        {/* Apertura láser */}
        <circle cx={midX} cy={laserTopY + bodyH * 0.35} r={wPx * 0.2}
          fill={sc} opacity="0.8" />
        <circle cx={midX} cy={laserTopY + bodyH * 0.35} r={wPx * 0.1}
          fill="#fff" opacity="0.6" />
        {/* Haces de láser */}
        {showBeam && (
          <>
            <line x1={midX} y1={laserTopY + bodyH}
              x2={midX - m(0.40)} y2={laserTopY + bodyH + m(0.80)}
              stroke={sc} strokeWidth={0.6} opacity="0.12" />
            <line x1={midX} y1={laserTopY + bodyH}
              x2={midX + m(0.30)} y2={laserTopY + bodyH + m(0.70)}
              stroke={sc} strokeWidth={0.6} opacity="0.12" />
            <line x1={midX} y1={laserTopY + bodyH}
              x2={midX} y2={laserTopY + bodyH + m(0.90)}
              stroke={sc} strokeWidth={0.6} opacity="0.10" />
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

    // Dimensiones reales: el fixture cuelga proporcional a su largo
    const dropH = m(esFollow ? 0.04 : 0.02);
    const bodyH = esRect ? m(0.12) : esFollow ? m(0.45) : m(largo * 0.65);
    const bodyR = wPx / 2;
    const fixtureTopY = topY + clampH + dropH;
    const totalH = clampH + dropH + bodyH;

    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={midX - wPx / 2 - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
            fill="none" stroke="#E30613" strokeWidth="2" />}
          <line x1={midX} y1={topY} x2={midX} y2={fixtureTopY} stroke={sc} strokeWidth={tecW} />
          {esRect
            ? <rect x={midX - wPx / 2} y={fixtureTopY} width={wPx} height={bodyH}
                fill="none" stroke={sc} strokeWidth={tecW} />
            : <ellipse cx={midX} cy={fixtureTopY + Math.min(bodyR, bodyH / 2)}
                rx={bodyR} ry={Math.min(bodyR, bodyH / 2)}
                fill="none" stroke={sc} strokeWidth={tecW} />}
        </g>
      );
    }

    const bodyCy = fixtureTopY + Math.min(bodyR, bodyH / 2);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={midX - wPx / 2 - 3} y={topY - 3} width={wPx + 6} height={totalH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        {renderClamp(midX, topY, clampW * (esFollow ? 0.5 : 0.66), clampH)}
        {/* Brazo */}
        <line x1={midX} y1={topY + clampH} x2={midX} y2={fixtureTopY}
          stroke="#555" strokeWidth={Math.max(0.8, m(0.006))} />

        {/* Haz de luz */}
        {showBeam && !esRect && (
          <polygon points={`${midX - m(0.02)},${fixtureTopY + bodyH} ${midX + m(0.02)},${fixtureTopY + bodyH} ${midX + m(0.30)},${fixtureTopY + bodyH + m(0.60)} ${midX - m(0.30)},${fixtureTopY + bodyH + m(0.60)}`}
            fill={sc} opacity="0.06" />
        )}

        {esRect ? (
          <>
            <rect x={midX - wPx / 2 + 0.5} y={fixtureTopY + 0.5} width={wPx} height={bodyH}
              fill="#000" opacity="0.06" rx={m(0.003)} />
            <rect x={midX - wPx / 2} y={fixtureTopY} width={wPx} height={bodyH}
              fill={sc} stroke="#000" strokeWidth={sw} rx={m(0.003)} opacity="0.9" />
            {/* Flash del strobe */}
            <rect x={midX - wPx * 0.35} y={fixtureTopY + bodyH * 0.2} width={wPx * 0.7} height={bodyH * 0.6}
              fill="#fff" opacity="0.3" rx={m(0.002)} />
          </>
        ) : (
          <>
            {/* Follow spot: cuerpo cilíndrico detrás de la lente */}
            {esFollow && (
              <rect x={midX - wPx * 0.35} y={fixtureTopY} width={wPx * 0.7} height={bodyH * 0.85}
                fill={sc} stroke="#000" strokeWidth={sw} rx={m(0.008)} opacity="0.85" />
            )}
            {/* Sombra */}
            <ellipse cx={midX + 0.5} cy={bodyCy + 0.5} rx={bodyR} ry={Math.min(bodyR, bodyH / 2)}
              fill="#000" opacity="0.06" />
            {/* Cuerpo/lente */}
            <ellipse cx={midX} cy={bodyCy} rx={bodyR} ry={Math.min(bodyR, bodyH / 2)}
              fill={sc} stroke="#000" strokeWidth={sw} opacity="0.9" />
            {/* Reflejo */}
            <circle cx={midX - bodyR * 0.15} cy={bodyCy - bodyR * 0.1}
              r={bodyR * 0.2} fill="#fff" opacity="0.4" />
          </>
        )}

        {/* Etiqueta */}
        {showDetail && (
          <text x={midX} y={fixtureTopY + bodyH + m(0.08)}
            fontSize={Math.max(5, m(0.04))} fill={sc} textAnchor="middle"
            fontFamily="sans-serif" fontWeight="bold" opacity="0.5">
            {tipoLuz === 'fresnel' ? 'FRES' : tipoLuz === 'profile' ? 'PROF'
              : tipoLuz === 'followSpot' ? 'FOLLOW' : tipoLuz === 'strobe' ? 'STRB' : 'PAR'}
          </text>
        )}
      </g>
    );
  }

  // ─── Moving Head / Wash / Beam / Spot: yugo + cabeza ───────
  const esWash = tipoLuz === 'wash';
  const esBeam = tipoLuz === 'beam';

  // Dimensiones proporcionales al largo real del fixture
  const dropH = m(0.02);
  const yokeW = wPx * 0.75;
  const yokeH = m(largo * 0.35);
  const headRx = esWash ? wPx * 0.45 : esBeam ? wPx * 0.30 : wPx * 0.38;
  const headRy = esWash ? headRx * 0.65 : headRx;

  const yokeTopY = topY + clampH + dropH;
  const headCy = yokeTopY + yokeH * 0.75;
  const extentW = Math.max(yokeW, headRx * 2);
  const totalH = clampH + dropH + yokeH + headRy;

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={midX - extentW / 2 - 3} y={topY - 3} width={extentW + 6} height={totalH + 6}
          fill="none" stroke="#E30613" strokeWidth="2" />}
        <line x1={midX} y1={topY} x2={midX} y2={yokeTopY} stroke={sc} strokeWidth={tecW} />
        <path d={`M ${midX - yokeW / 2} ${yokeTopY} L ${midX - yokeW / 2} ${headCy} M ${midX + yokeW / 2} ${yokeTopY} L ${midX + yokeW / 2} ${headCy} M ${midX - yokeW / 2} ${yokeTopY} L ${midX + yokeW / 2} ${yokeTopY}`}
          fill="none" stroke={sc} strokeWidth={tecW} />
        <ellipse cx={midX} cy={headCy} rx={headRx} ry={headRy}
          fill="none" stroke={sc} strokeWidth={tecW} />
        <line x1={midX - headRx * 0.6} y1={headCy} x2={midX + headRx * 0.6} y2={headCy}
          stroke={sc} strokeWidth={tecW * 0.5} />
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

      {seleccionada && <rect x={midX - extentW / 2 - 3} y={topY - 3} width={extentW + 6} height={totalH + 6}
        fill="none" stroke="#E30613" strokeWidth="2" />}

      {/* Abrazadera */}
      {renderClamp(midX, topY)}
      <line x1={midX} y1={topY + clampH} x2={midX} y2={yokeTopY}
        stroke="#555" strokeWidth={Math.max(0.8, m(0.006))} />

      {/* Haz de luz (debajo, tenue) */}
      {showBeam && (
        <polygon points={`${midX - m(0.02)},${headCy + headRy * 0.7} ${midX + m(0.02)},${headCy + headRy * 0.7} ${midX + m(0.40)},${headCy + headRy + m(0.80)} ${midX - m(0.40)},${headCy + headRy + m(0.80)}`}
          fill={sc} opacity={esBeam ? 0.05 : 0.07} />
      )}

      {/* Yugo (horquilla U invertida) */}
      <path d={`M ${midX - yokeW / 2} ${yokeTopY} L ${midX - yokeW / 2} ${headCy} M ${midX + yokeW / 2} ${yokeTopY} L ${midX + yokeW / 2} ${headCy} M ${midX - yokeW / 2} ${yokeTopY} L ${midX + yokeW / 2} ${yokeTopY}`}
        fill="none" stroke={sc} strokeWidth={Math.max(1, m(0.012))} strokeLinecap="round" opacity="0.9" />

      {/* Cabeza — sombra */}
      <ellipse cx={midX + 0.5} cy={headCy + 0.5} rx={headRx} ry={headRy}
        fill="#000" opacity="0.06" />
      {/* Cabeza — cuerpo */}
      <ellipse cx={midX} cy={headCy} rx={headRx} ry={headRy}
        fill={sc} stroke="#000" strokeWidth={sw} opacity="0.92" />
      {/* Gradiente */}
      <ellipse cx={midX} cy={headCy} rx={headRx} ry={headRy}
        fill={`url(#${gid})`} />
      {/* Lente frontal */}
      <ellipse cx={midX} cy={headCy} rx={headRx * 0.45} ry={headRy * 0.45}
        fill="#111" opacity="0.7" />
      {/* Brillo especular */}
      <circle cx={midX - headRx * 0.15} cy={headCy - headRy * 0.15}
        r={headRx * 0.14} fill="#fff" opacity="0.5" />

      {/* Etiqueta */}
      {showDetail && (
        <text x={midX} y={headCy + headRy + m(0.06)}
          fontSize={Math.max(5, m(0.04))} fill={sc} textAnchor="middle"
          fontFamily="sans-serif" fontWeight="bold" opacity="0.5">
          {esBeam ? 'BEAM' : esWash ? 'WASH' : tipoLuz === 'spot' ? 'SPOT' : 'MH'}
        </text>
      )}
    </g>
  );
}
