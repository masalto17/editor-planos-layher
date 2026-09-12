// Line Array — cluster de sonido colgado de estructura/truss.
// Dibuja N cajas trapezoidales (tops) o rectangulares (subs) en coordenadas mundo,
// colgando desde (x, y) con bumper frame + cadena de rigging.
// `largo` = ancho real del cluster (≈1.09m tops, ≈0.70m subs)
// `altoCaja` = alto real de cada caja (≈0.35m tops, ≈0.55m subs)
export default function LineArray({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, altoCaja = 0.35, cajas = 1, tipoLA = 'top' } = pieza;
  const gid = `lag-${pieza.id}`;

  const esSub = tipoLA === 'subVolado' || tipoLA === 'subApilado';
  const esDelay = tipoLA === 'delay';
  const nCajas = Math.max(1, Math.min(cajas, 18));

  // Dimensiones mundo del cluster
  const bumperH = 0.08;       // alto del bumper frame (mundo)
  const cableH = 0.12;        // cable de rigging (mundo)
  const gap = 0.01;            // separación entre cajas (mundo)
  const anchoCluster = largo;
  const altoPorCaja = altoCaja;

  // Factor de ensanche trapecio: tops se ensanchan abajo ~15%
  const ensanche = (esSub || esDelay) ? 0 : 0.15;

  // Puntos mundo → pantalla
  const pAnchorL = worldToScreen(x, y);
  const pAnchorR = worldToScreen(x + anchoCluster, y);
  const midX = (pAnchorL.x + pAnchorR.x) / 2;
  const clusterW = pAnchorR.x - pAnchorL.x;

  // Bumper frame (arriba de todo, sobre punto de anclaje)
  const bumperWFrac = 0.6; // el bumper es 60% del ancho del cluster
  const pBumperTL = worldToScreen(x + anchoCluster * (1 - bumperWFrac) / 2, y);
  const pBumperTR = worldToScreen(x + anchoCluster * (1 + bumperWFrac) / 2, y);
  const pBumperBL = worldToScreen(x + anchoCluster * (1 - bumperWFrac) / 2, y - bumperH);
  const bumperW_px = pBumperTR.x - pBumperTL.x;
  const bumperH_px = pBumperBL.y - pBumperTL.y;

  // Cable (desde bumper hasta primera caja)
  const cableBottom = worldToScreen(x, y - bumperH - cableH);
  const cableH_px = cableBottom.y - pBumperBL.y;

  // Stack de cajas
  const stackStartY = y - bumperH - cableH;
  const cajasEls = [];
  for (let i = 0; i < nCajas; i++) {
    const cajaTopY = stackStartY - i * (altoPorCaja + gap);
    const cajaBotY = cajaTopY - altoPorCaja;
    const frac = nCajas > 1 ? i / (nCajas - 1) : 0;
    const ensancheI = ensanche * frac;

    const tl = worldToScreen(x - anchoCluster * ensancheI / 2, cajaTopY);
    const tr = worldToScreen(x + anchoCluster + anchoCluster * ensancheI / 2, cajaTopY);
    const bl = worldToScreen(x - anchoCluster * (ensancheI + ensanche / (nCajas || 1)) / 2, cajaBotY);
    const br = worldToScreen(x + anchoCluster + anchoCluster * (ensancheI + ensanche / (nCajas || 1)) / 2, cajaBotY);

    const pts = `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`;
    const boxW = tr.x - tl.x;
    const boxH = bl.y - tl.y;

    cajasEls.push(
      <g key={i}>
        {/* Sombra */}
        {!modoTecnico && (
          <polygon points={`${tl.x + 0.5},${tl.y + 0.5} ${tr.x + 0.5},${tr.y + 0.5} ${br.x + 0.5},${br.y + 0.5} ${bl.x + 0.5},${bl.y + 0.5}`}
            fill="#000" opacity="0.06" />
        )}
        {/* Caja */}
        <polygon points={pts} fill={modoTecnico ? 'none' : sc}
          stroke={modoTecnico ? sc : '#000'} strokeWidth={Math.max(0.3, zoom * 0.003)}
          opacity={modoTecnico ? 1 : 0.92} />
        {/* Overlay galvanizado */}
        {!modoTecnico && (
          <polygon points={pts} fill={`url(#${gid})`} />
        )}
        {/* Línea de junta entre cajas */}
        {!modoTecnico && i > 0 && (
          <line x1={tl.x + 1} y1={tl.y} x2={tr.x - 1} y2={tr.y}
            stroke="#000" strokeWidth={0.4} opacity="0.15" />
        )}
        {/* Brillo lateral */}
        {!modoTecnico && (
          <line x1={tl.x + 0.8} y1={tl.y + 0.8} x2={bl.x + 0.8} y2={bl.y - 0.8}
            stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.005)} opacity="0.2" />
        )}
        {/* Detalle: driver/altavoz circular en cada caja (zoom alto) */}
        {!modoTecnico && zoom > 40 && boxW > 12 && !esSub && (
          <>
            <circle cx={(tl.x + tr.x) / 2} cy={(tl.y + bl.y) / 2}
              r={Math.min(boxH * 0.3, boxW * 0.08)} fill="#111" opacity="0.4" />
            <circle cx={(tl.x + tr.x) / 2} cy={(tl.y + bl.y) / 2}
              r={Math.min(boxH * 0.15, boxW * 0.04)} fill="#333" opacity="0.5" />
          </>
        )}
        {/* Detalle: cono de sub (zoom alto) */}
        {!modoTecnico && zoom > 40 && boxW > 12 && esSub && (
          <circle cx={(tl.x + tr.x) / 2} cy={(tl.y + bl.y) / 2}
            r={Math.min(boxH * 0.35, boxW * 0.15)} fill="none" stroke="#111" strokeWidth={0.5} opacity="0.3" />
        )}
      </g>
    );
  }

  // Total height del cluster en pantalla
  const totalBottom = worldToScreen(x, stackStartY - nCajas * (altoPorCaja + gap));
  const totalH_px = totalBottom.y - pAnchorL.y;

  const tecW = Math.max(0.8, zoom * 0.012);

  if (modoTecnico) {
    const stackEnd = worldToScreen(x, stackStartY - nCajas * altoPorCaja - (nCajas - 1) * gap);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pAnchorL.x - 3} y={pAnchorL.y - 3}
          width={clusterW + 6} height={Math.abs(totalH_px) + 6}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        {/* Bumper */}
        <rect x={pBumperTL.x} y={pBumperTL.y} width={bumperW_px} height={bumperH_px}
          fill="none" stroke={sc} strokeWidth={tecW} />
        {/* Cable */}
        <line x1={midX} y1={pBumperTL.y + bumperH_px} x2={midX} y2={cableBottom.y}
          stroke={sc} strokeWidth={tecW * 0.7} />
        {/* Cajas (contorno) */}
        {cajasEls}
        {/* Eje central */}
        <line x1={midX} y1={cableBottom.y} x2={midX} y2={stackEnd.y}
          stroke={sc} strokeWidth={tecW * 0.5} strokeDasharray="2 2" />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {seleccionada && <rect x={pAnchorL.x - 3} y={pAnchorL.y - 3}
        width={clusterW + 6} height={Math.abs(totalH_px) + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" opacity="0.5" />}

      {/* Bumper frame de rigging */}
      <rect x={pBumperTL.x + 0.5} y={pBumperTL.y + 0.5} width={bumperW_px} height={bumperH_px}
        fill="#000" opacity="0.06" rx="1" />
      <rect x={pBumperTL.x} y={pBumperTL.y} width={bumperW_px} height={bumperH_px}
        fill="#333" stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="1" opacity="0.92" />
      <line x1={pBumperTL.x + 1} y1={pBumperTL.y + 1} x2={pBumperTR.x - 1} y2={pBumperTL.y + 1}
        stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} opacity="0.25" />

      {/* Cadena de rigging */}
      <line x1={midX - 2} y1={pBumperTL.y + bumperH_px} x2={midX - 2} y2={cableBottom.y}
        stroke="#555" strokeWidth={Math.max(0.5, zoom * 0.005)} strokeDasharray={zoom > 25 ? '1.5 1.5' : '0'} />
      <line x1={midX + 2} y1={pBumperTL.y + bumperH_px} x2={midX + 2} y2={cableBottom.y}
        stroke="#555" strokeWidth={Math.max(0.5, zoom * 0.005)} strokeDasharray={zoom > 25 ? '1.5 1.5' : '0'} />

      {/* Pila de cajas */}
      {cajasEls}

      {/* Etiqueta */}
      {zoom > 30 && clusterW > 20 && (
        <text x={midX} y={totalBottom.y + Math.max(8, zoom * 0.08)}
          fontSize={Math.max(7, zoom * 0.055)} fill={sc} textAnchor="middle"
          fontFamily="monospace" fontWeight="bold" opacity="0.6">
          {esDelay ? `DLY ×${cajas}` : esSub ? `SUB ×${cajas}` : `LA ×${cajas}`}
        </text>
      )}
    </g>
  );
}
