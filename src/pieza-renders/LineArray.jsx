// Line Array — cluster de sonido profesional colgado de estructura/truss.
// Render tipo L-Acoustics K2 / JBL VTX / d&b J-Series.
// (x, y) = punto de anclaje superior (bumper frame); las cajas cuelgan hacia abajo.
// `largo` = ancho real del cluster (≈1.09m tops, ≈0.70m subs)
// `altoCaja` = alto real de cada caja (≈0.35m tops, ≈0.55m subs)
export default function LineArray({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, altoCaja = 0.35, cajas = 1, tipoLA = 'top' } = pieza;
  const gid = `lag-${pieza.id}`;

  const esSub = tipoLA === 'subVolado' || tipoLA === 'subApilado';
  const esDelay = tipoLA === 'delay';
  const nCajas = Math.max(1, Math.min(cajas, 18));

  // Dimensiones mundo
  const bumperH = 0.10;
  const cableH = 0.15;
  const gap = 0.008;
  const anchoCluster = largo;

  // Ensanche trapecio: tops se ensanchan progresivamente (curva de array)
  const ensancheMax = (esSub || esDelay) ? 0 : 0.12;

  // Puntos mundo → pantalla
  const pAnchorL = worldToScreen(x, y);
  const pAnchorR = worldToScreen(x + anchoCluster, y);
  const midX = (pAnchorL.x + pAnchorR.x) / 2;
  const clusterW = pAnchorR.x - pAnchorL.x;

  // Bumper frame centrado (70% del ancho)
  const bumperFrac = 0.70;
  const bumpOffX = anchoCluster * (1 - bumperFrac) / 2;
  const pBTL = worldToScreen(x + bumpOffX, y);
  const pBTR = worldToScreen(x + anchoCluster - bumpOffX, y);
  const pBBL = worldToScreen(x + bumpOffX, y - bumperH);
  const bumperW = pBTR.x - pBTL.x;
  const bumperH_px = pBBL.y - pBTL.y;

  // Punto de rigging (cable desde bumper hasta primera caja)
  const pCableEnd = worldToScreen(x, y - bumperH - cableH);
  const cableEndY = pCableEnd.y;

  // ─── Stack de cajas ───
  const stackStartY = y - bumperH - cableH;
  const cajasEls = [];
  const sw = Math.max(0.4, zoom * 0.004);

  for (let i = 0; i < nCajas; i++) {
    const cajaTopY = stackStartY - i * (altoCaja + gap);
    const cajaBotY = cajaTopY - altoCaja;

    // Ensanche progresivo (curva J del array)
    const t = nCajas > 1 ? i / (nCajas - 1) : 0;
    const ens = ensancheMax * t * t; // cuadrático — la curva se abre más abajo

    const tl = worldToScreen(x - anchoCluster * ens / 2, cajaTopY);
    const tr = worldToScreen(x + anchoCluster + anchoCluster * ens / 2, cajaTopY);
    // Ensanche del borde inferior: un poquito más que el superior
    const tNext = nCajas > 1 ? Math.min(1, (i + 1) / (nCajas - 1)) : 0;
    const ensBot = ensancheMax * tNext * tNext;
    const bl = worldToScreen(x - anchoCluster * ensBot / 2, cajaBotY);
    const br = worldToScreen(x + anchoCluster + anchoCluster * ensBot / 2, cajaBotY);

    const pts = `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`;
    const boxW = tr.x - tl.x;
    const boxH = bl.y - tl.y;
    const cx = (tl.x + tr.x) / 2;
    const cy = (tl.y + bl.y) / 2;

    cajasEls.push(
      <g key={i}>
        {/* Sombra lateral */}
        {!modoTecnico && (
          <polygon points={`${tl.x + 1},${tl.y + 1} ${tr.x + 1},${tr.y + 1} ${br.x + 1},${br.y + 1} ${bl.x + 1},${bl.y + 1}`}
            fill="#000" opacity="0.08" />
        )}
        {/* Cuerpo de la caja */}
        <polygon points={pts}
          fill={modoTecnico ? 'none' : '#1a1a2e'}
          stroke={modoTecnico ? sc : '#000'}
          strokeWidth={modoTecnico ? Math.max(0.8, zoom * 0.01) : sw}
          opacity={modoTecnico ? 1 : 0.95} />
        {/* Panel frontal (grille de bocinas) */}
        {!modoTecnico && (
          <polygon points={pts} fill={`url(#${gid})`} opacity="0.9" />
        )}
        {/* Franja de grille (la cara visible del altoparlante) */}
        {!modoTecnico && boxH > 3 && (
          <rect x={tl.x + boxW * 0.05} y={tl.y + boxH * 0.15}
            width={boxW * 0.9} height={boxH * 0.7}
            fill="#111" opacity="0.35" rx={Math.max(0.3, zoom * 0.003)} />
        )}
        {/* Línea de junta entre cajas */}
        {i > 0 && (
          <line x1={tl.x} y1={tl.y} x2={tr.x} y2={tr.y}
            stroke={modoTecnico ? sc : '#000'} strokeWidth={modoTecnico ? sw * 0.5 : 0.5} opacity={modoTecnico ? 0.5 : 0.3} />
        )}
        {/* Brillo highlight superior */}
        {!modoTecnico && boxW > 6 && (
          <line x1={tl.x + 1.5} y1={tl.y + 1} x2={tr.x - 1.5} y2={tl.y + 1}
            stroke="#fff" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.15" />
        )}
        {/* Detalle: bocinas/drivers visibles (tops, zoom alto) */}
        {!modoTecnico && zoom > 35 && boxW > 15 && !esSub && (
          <>
            {/* Driver HF (tweeter) */}
            <rect x={cx - boxW * 0.06} y={cy - boxH * 0.2} width={boxW * 0.12} height={boxH * 0.4}
              fill="#222" opacity="0.5" rx={0.5} />
            {/* Bocinas LF (woofers a cada lado) */}
            <circle cx={cx - boxW * 0.25} cy={cy} r={Math.min(boxH * 0.25, boxW * 0.06)}
              fill="#0a0a0a" stroke="#333" strokeWidth={0.3} opacity="0.5" />
            <circle cx={cx + boxW * 0.25} cy={cy} r={Math.min(boxH * 0.25, boxW * 0.06)}
              fill="#0a0a0a" stroke="#333" strokeWidth={0.3} opacity="0.5" />
          </>
        )}
        {/* Detalle: cono de sub (subs, zoom alto) */}
        {!modoTecnico && zoom > 35 && boxW > 15 && esSub && (
          <>
            <circle cx={cx - boxW * 0.22} cy={cy} r={Math.min(boxH * 0.32, boxW * 0.12)}
              fill="none" stroke="#333" strokeWidth={0.6} opacity="0.35" />
            <circle cx={cx + boxW * 0.22} cy={cy} r={Math.min(boxH * 0.32, boxW * 0.12)}
              fill="none" stroke="#333" strokeWidth={0.6} opacity="0.35" />
            {/* Puerto reflex central */}
            <rect x={cx - boxW * 0.04} y={cy - boxH * 0.25} width={boxW * 0.08} height={boxH * 0.5}
              fill="#0a0a0a" opacity="0.3" rx={0.5} />
          </>
        )}
        {/* Marca lateral de modelo (zoom muy alto) */}
        {!modoTecnico && zoom > 55 && boxW > 30 && (
          <text x={tr.x - 3} y={cy + 1} fontSize={Math.max(4, boxH * 0.25)}
            fill="#555" textAnchor="end" fontFamily="sans-serif" fontWeight="bold" opacity="0.3">
            {esSub ? 'SUB' : esDelay ? 'DLY' : 'K2'}
          </text>
        )}
      </g>
    );
  }

  // Total height del cluster
  const stackEndY = stackStartY - nCajas * altoCaja - (nCajas - 1) * gap;
  const pStackEnd = worldToScreen(x, stackEndY);
  const totalBottom_px = pStackEnd.y;

  const tecW = Math.max(0.8, zoom * 0.012);

  // ─── MODO TÉCNICO ───
  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pAnchorL.x - 4} y={pAnchorL.y - 4}
          width={clusterW + 8} height={totalBottom_px - pAnchorL.y + 8}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        {/* Bumper frame */}
        <rect x={pBTL.x} y={pBTL.y} width={bumperW} height={bumperH_px}
          fill="none" stroke={sc} strokeWidth={tecW} />
        {/* Punto de cuelgue */}
        <circle cx={midX} cy={pBTL.y} r={Math.max(1.5, zoom * 0.015)}
          fill="none" stroke={sc} strokeWidth={tecW * 0.8} />
        {/* Cable central */}
        <line x1={midX} y1={pBTL.y + bumperH_px} x2={midX} y2={cableEndY}
          stroke={sc} strokeWidth={tecW * 0.7} />
        {/* Cajas */}
        {cajasEls}
        {/* Eje central (dash) */}
        <line x1={midX} y1={cableEndY} x2={midX} y2={totalBottom_px}
          stroke={sc} strokeWidth={tecW * 0.4} strokeDasharray="3 2" />
        {/* Cota: cantidad */}
        <text x={pAnchorR.x + 5} y={(pAnchorL.y + totalBottom_px) / 2}
          fontSize={Math.max(6, zoom * 0.05)} fill={sc} fontFamily="monospace" opacity="0.7">
          {esSub ? 'SUB' : esDelay ? 'DLY' : 'LA'} ×{nCajas}
        </text>
      </g>
    );
  }

  // ─── MODO DECORATIVO ───
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#444" stopOpacity="0.10" />
          <stop offset="30%" stopColor="#222" stopOpacity="0.05" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {seleccionada && <rect x={pAnchorL.x - 4} y={pAnchorL.y - 4}
        width={clusterW + 8} height={totalBottom_px - pAnchorL.y + 8}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" opacity="0.6" />}

      {/* ── Bumper frame de rigging ── */}
      {/* Sombra */}
      <rect x={pBTL.x + 1} y={pBTL.y + 1} width={bumperW} height={bumperH_px}
        fill="#000" opacity="0.08" rx="1" />
      {/* Cuerpo bumper (acero negro) */}
      <rect x={pBTL.x} y={pBTL.y} width={bumperW} height={bumperH_px}
        fill="#2a2a2a" stroke="#000" strokeWidth={sw} rx="1" />
      {/* Highlight bumper */}
      <line x1={pBTL.x + 2} y1={pBTL.y + 1} x2={pBTR.x - 2} y2={pBTL.y + 1}
        stroke="#666" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.4" />
      {/* Ojo de cuelgue */}
      <circle cx={midX} cy={pBTL.y - Math.max(1, zoom * 0.01)} r={Math.max(1.5, zoom * 0.012)}
        fill="none" stroke="#555" strokeWidth={Math.max(0.5, zoom * 0.005)} />

      {/* ── Cadena/cable de rigging ── */}
      {zoom > 20 ? (
        // Cadenas dobles (detalle)
        <>
          <line x1={midX - Math.max(1, zoom * 0.01)} y1={pBTL.y + bumperH_px}
            x2={midX - Math.max(1, zoom * 0.01)} y2={cableEndY}
            stroke="#444" strokeWidth={Math.max(0.6, zoom * 0.006)}
            strokeDasharray={zoom > 30 ? '1.5 1' : 'none'} />
          <line x1={midX + Math.max(1, zoom * 0.01)} y1={pBTL.y + bumperH_px}
            x2={midX + Math.max(1, zoom * 0.01)} y2={cableEndY}
            stroke="#444" strokeWidth={Math.max(0.6, zoom * 0.006)}
            strokeDasharray={zoom > 30 ? '1.5 1' : 'none'} />
        </>
      ) : (
        <line x1={midX} y1={pBTL.y + bumperH_px} x2={midX} y2={cableEndY}
          stroke="#444" strokeWidth={Math.max(0.8, zoom * 0.008)} />
      )}

      {/* ── Pila de cajas ── */}
      {cajasEls}

      {/* ── Etiqueta inferior ── */}
      {zoom > 22 && clusterW > 14 && (
        <text x={midX} y={totalBottom_px + Math.max(9, zoom * 0.09)}
          fontSize={Math.max(7, zoom * 0.06)} fill={sc} textAnchor="middle"
          fontFamily="sans-serif" fontWeight="bold" opacity="0.55">
          {esDelay ? `DELAY ×${nCajas}` : esSub ? `SUB ×${nCajas}` : `LA ×${nCajas}`}
        </text>
      )}
    </g>
  );
}
