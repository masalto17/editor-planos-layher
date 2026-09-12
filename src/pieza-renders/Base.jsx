// Base — Husillo regulable: rosca visible, placa base con agujeros, tuerca de regulación.
// Collarín: anillo con tornillo de ajuste.
// Efecto galvanizado: gradiente metálico, reflejos especulares en placa y tuerca.
export default function Base({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo, tipoId } = pieza;

  // ── Collarín ── Aro de acero que abraza el tubo vertical sobre el husillo.
  if (tipoId === 'CO') {
    const p = worldToScreen(x, y);
    const ancho = Math.max(18, zoom * 0.24);
    const alto = Math.max(7, zoom * 0.075);
    const boltR = Math.max(1.8, zoom * 0.022);
    const boltOff = ancho / 2 + boltR * 1.8;
    const sw = Math.max(0.4, zoom * 0.005);
    const ranuraW = Math.max(2, zoom * 0.025);
    const gid = `cog-${pieza.id}`;

    if (modoTecnico) {
      return (
        <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
          {seleccionada && <rect x={p.x - ancho / 2 - 3} y={p.y - alto / 2 - 3}
            width={ancho + 6} height={alto + 6} fill="none" stroke="#E30613" strokeWidth="2" />}
          <rect x={p.x - ancho / 2} y={p.y - alto / 2} width={ancho} height={alto}
            fill="none" stroke={sc} strokeWidth={Math.max(0.8, zoom * 0.01)} />
        </g>
      );
    }

    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {seleccionada && <rect x={p.x - ancho / 2 - 5} y={p.y - alto / 2 - 3}
          width={ancho + boltR * 4 + 6} height={alto + 6} fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        {/* Sombra */}
        <rect x={p.x - ancho / 2 + 1} y={p.y - alto / 2 + 1} width={ancho} height={alto}
          fill="#000" opacity="0.07" rx="2.5" />
        {/* Mitad izquierda */}
        <rect x={p.x - ancho / 2} y={p.y - alto / 2} width={ancho / 2 - ranuraW / 2} height={alto}
          fill={sc} stroke="#000" strokeWidth={sw} rx="1.5" opacity="0.92" />
        {/* Mitad derecha */}
        <rect x={p.x + ranuraW / 2} y={p.y - alto / 2} width={ancho / 2 - ranuraW / 2} height={alto}
          fill={sc} stroke="#000" strokeWidth={sw} rx="1.5" opacity="0.92" />
        {/* Overlay galvanizado */}
        <rect x={p.x - ancho / 2} y={p.y - alto / 2} width={ancho} height={alto}
          fill={`url(#${gid})`} rx="1.5" />
        {/* Brillo metálico superior */}
        <rect x={p.x - ancho / 2 + 1.5} y={p.y - alto / 2 + 1} width={ancho - 3} height={alto * 0.3}
          fill="#fff" opacity="0.25" rx="1" />
        {/* Ranura central */}
        <line x1={p.x} y1={p.y - alto / 2 - 0.5} x2={p.x} y2={p.y + alto / 2 + 0.5}
          stroke="#000" strokeWidth={ranuraW * 0.5} opacity="0.15" />
        {/* Tornillo */}
        <line x1={p.x + ancho / 2} y1={p.y} x2={p.x + boltOff} y2={p.y}
          stroke="#555" strokeWidth={Math.max(1, zoom * 0.012)} />
        <circle cx={p.x + boltOff} cy={p.y} r={boltR}
          fill="#666" stroke="#333" strokeWidth={sw} />
        {/* Brillo tornillo */}
        {zoom > 25 && <circle cx={p.x + boltOff - boltR * 0.2} cy={p.y - boltR * 0.2}
          r={boltR * 0.25} fill="#fff" opacity="0.3" />}
        {zoom > 30 && <circle cx={p.x + boltOff} cy={p.y} r={boltR * 0.45}
          fill="none" stroke="#333" strokeWidth={0.5} />}
      </g>
    );
  }

  // ── Husillo regulable ──
  const pB = worldToScreen(x, y), pT = worldToScreen(x, y + largo);
  const tubeW = Math.max(3, zoom * 0.05);
  const hlOff = tubeW * 0.2;
  const gid = `bg-${pieza.id}`;

  // Placa base
  const placaW = Math.max(16, zoom * 0.2);
  const placaH = Math.max(3, zoom * 0.03);
  const holeR = Math.max(0.8, zoom * 0.01);
  const holeOff = placaW * 0.32;

  // Tuerca de regulación
  const tuercaW = Math.max(5, zoom * 0.06);
  const tuercaH = Math.max(3, zoom * 0.03);
  const tuercaY = pB.y + (pT.y - pB.y) * 0.3;

  // Rosca: marcas horizontales en la barra
  const roscas = [];
  if (zoom > 25) {
    const step = Math.max(3, zoom * 0.025);
    const startY = Math.min(pB.y, pT.y);
    const endY = Math.max(pB.y, pT.y);
    for (let py = startY + step; py < endY; py += step) {
      roscas.push(
        <line key={py} x1={pB.x - tubeW * 0.4} y1={py} x2={pB.x + tubeW * 0.4} y2={py}
          stroke="#000" strokeWidth={Math.max(0.2, zoom * 0.002)} opacity="0.15" />
      );
    }
  }

  const tecW = Math.max(1, zoom * 0.015);

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
          stroke="#E30613" strokeWidth={tecW + 6} opacity="0.2" strokeLinecap="round" />}
        <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="butt" />
        <rect x={pB.x - placaW / 2} y={pB.y - 1} width={placaW} height={placaH}
          fill="none" stroke={sc} strokeWidth={Math.max(0.8, zoom * 0.01)} />
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado */}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
          <stop offset="25%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="75%" stopColor="#000" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* Selección glow */}
      {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke="#E30613" strokeWidth={tubeW + 8} opacity="0.2" strokeLinecap="round" />}

      {/* Sombra */}
      <line x1={pT.x + hlOff * 1.3} y1={pT.y} x2={pB.x + hlOff * 1.3} y2={pB.y}
        stroke="#000" strokeWidth={tubeW} strokeLinecap="round" opacity="0.06" />

      {/* Barra husillo */}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke={sc} strokeWidth={tubeW} strokeLinecap="round" />

      {/* Overlay galvanizado */}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke={`url(#${gid})`} strokeWidth={tubeW} strokeLinecap="round" />

      {/* Highlight izquierdo */}
      <line x1={pT.x - hlOff} y1={pT.y} x2={pB.x - hlOff} y2={pB.y}
        stroke="#fff" strokeWidth={tubeW * 0.22} strokeLinecap="round" opacity="0.35" />

      {/* Edge light derecho */}
      <line x1={pT.x + hlOff * 0.5} y1={pT.y} x2={pB.x + hlOff * 0.5} y2={pB.y}
        stroke="#fff" strokeWidth={tubeW * 0.06} strokeLinecap="round" opacity="0.12" />

      {/* Marcas de rosca */}
      {roscas}

      {/* Tuerca de regulación (mejorada) */}
      <rect x={pB.x - tuercaW / 2 + 0.5} y={tuercaY - tuercaH / 2 + 0.5} width={tuercaW} height={tuercaH}
        fill="#000" opacity="0.06" rx="0.5" />
      <rect x={pB.x - tuercaW / 2} y={tuercaY - tuercaH / 2} width={tuercaW} height={tuercaH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.5" opacity="0.88" />
      {/* Brillo tuerca */}
      <line x1={pB.x - tuercaW / 2 + 1} y1={tuercaY - tuercaH / 2 + 0.5}
        x2={pB.x + tuercaW / 2 - 1} y2={tuercaY - tuercaH / 2 + 0.5}
        stroke="#fff" strokeWidth={0.5} opacity="0.3" />

      {/* Placa base (mejorada) */}
      <rect x={pB.x - placaW / 2 + 0.7} y={pB.y - 0.5} width={placaW} height={placaH}
        fill="#000" opacity="0.07" rx="0.5" />
      <rect x={pB.x - placaW / 2} y={pB.y - 1} width={placaW} height={placaH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.4, zoom * 0.004)} rx="0.5" />
      {/* Brillo placa */}
      <line x1={pB.x - placaW / 2 + 2} y1={pB.y - 0.5}
        x2={pB.x + placaW / 2 - 2} y2={pB.y - 0.5}
        stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} opacity="0.3" />

      {/* Agujeros placa */}
      {zoom > 30 && <>
        <circle cx={pB.x - holeOff} cy={pB.y + placaH / 2} r={holeR}
          fill="#000" opacity="0.3" />
        <circle cx={pB.x + holeOff} cy={pB.y + placaH / 2} r={holeR}
          fill="#000" opacity="0.3" />
      </>}

      {/* Etiqueta largo husillo (zoom medio+) */}
      {zoom > 45 && Math.abs(pT.y - pB.y) > 25 && (
        <text x={pB.x + tubeW + 3} y={(pB.y + pT.y) / 2}
          fontSize={Math.max(5, zoom * 0.04)} fill={sc} textAnchor="start"
          fontFamily="monospace" opacity="0.35" writingMode="vertical-rl"
          transform={`rotate(180 ${pB.x + tubeW + 3} ${(pB.y + pT.y) / 2})`}>{largo.toFixed(2)}m</text>
      )}
    </g>
  );
}
