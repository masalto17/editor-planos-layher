// Base — Husillo regulable: rosca visible, placa base con agujeros, tuerca de regulación.
// Collarín: anillo con tornillo de ajuste.
export default function Base({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown }) {
  const { x, y, largo, tipoId } = pieza;

  // ── Collarín ── Aro de acero que abraza el tubo vertical sobre el husillo.
  // En alzado se ve como un rectángulo horizontal ancho (más ancho que el tubo vertical)
  // con ranura central y tornillo de apriete a un lado.
  if (tipoId === 'CO') {
    const p = worldToScreen(x, y);
    const ancho = Math.max(18, zoom * 0.24);     // más ancho que tubo vertical
    const alto = Math.max(7, zoom * 0.075);      // altura del aro
    const boltR = Math.max(1.8, zoom * 0.022);
    const boltOff = ancho / 2 + boltR * 1.8;     // tornillo sobresale del cuerpo
    const sw = Math.max(0.4, zoom * 0.005);
    const ranuraW = Math.max(2, zoom * 0.025);   // ranura central (por donde pasa el tubo)
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={p.x - ancho / 2 - 5} y={p.y - alto / 2 - 3}
          width={ancho + boltR * 4 + 6} height={alto + 6} fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        {/* Sombra */}
        <rect x={p.x - ancho / 2 + 1} y={p.y - alto / 2 + 1} width={ancho} height={alto}
          fill="#000" opacity="0.07" rx="2.5" />
        {/* Cuerpo collarín — dos mitades con ranura */}
        <rect x={p.x - ancho / 2} y={p.y - alto / 2} width={ancho / 2 - ranuraW / 2} height={alto}
          fill={sc} stroke="#000" strokeWidth={sw} rx="1.5" opacity="0.92" />
        <rect x={p.x + ranuraW / 2} y={p.y - alto / 2} width={ancho / 2 - ranuraW / 2} height={alto}
          fill={sc} stroke="#000" strokeWidth={sw} rx="1.5" opacity="0.92" />
        {/* Highlight superior */}
        <rect x={p.x - ancho / 2 + 1.5} y={p.y - alto / 2 + 1} width={ancho - 3} height={alto * 0.3}
          fill="#fff" opacity="0.25" rx="1" />
        {/* Ranura central (apertura del aro) */}
        <line x1={p.x} y1={p.y - alto / 2 - 0.5} x2={p.x} y2={p.y + alto / 2 + 0.5}
          stroke="#000" strokeWidth={ranuraW * 0.5} opacity="0.15" />
        {/* Tornillo de apriete (sobresale a la derecha) */}
        <line x1={p.x + ancho / 2} y1={p.y} x2={p.x + boltOff} y2={p.y}
          stroke="#555" strokeWidth={Math.max(1, zoom * 0.012)} />
        <circle cx={p.x + boltOff} cy={p.y} r={boltR}
          fill="#666" stroke="#333" strokeWidth={sw} />
        {/* Cabeza hexagonal del tornillo (detalle zoom alto) */}
        {zoom > 30 && <circle cx={p.x + boltOff} cy={p.y} r={boltR * 0.45}
          fill="none" stroke="#333" strokeWidth={0.5} />}
      </g>
    );
  }

  // ── Husillo regulable ──
  const pB = worldToScreen(x, y), pT = worldToScreen(x, y + largo);
  const tubeW = Math.max(3, zoom * 0.05);
  const hlOff = tubeW * 0.2;

  // Placa base
  const placaW = Math.max(16, zoom * 0.2);
  const placaH = Math.max(3, zoom * 0.03);
  const holeR = Math.max(0.8, zoom * 0.01);
  const holeOff = placaW * 0.32;

  // Tuerca de regulación
  const tuercaW = Math.max(5, zoom * 0.06);
  const tuercaH = Math.max(3, zoom * 0.03);
  // Posición tuerca: ~30% desde abajo
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

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke="#E30613" strokeWidth={tubeW + 8} opacity="0.2" strokeLinecap="round" />}
      {/* Sombra barra */}
      <line x1={pT.x + hlOff} y1={pT.y} x2={pB.x + hlOff} y2={pB.y}
        stroke="#000" strokeWidth={tubeW} strokeLinecap="round" opacity="0.06" />
      {/* Barra husillo */}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke={sc} strokeWidth={tubeW} strokeLinecap="round" />
      {/* Highlight */}
      <line x1={pT.x - hlOff} y1={pT.y} x2={pB.x - hlOff} y2={pB.y}
        stroke="#fff" strokeWidth={tubeW * 0.28} strokeLinecap="round" opacity="0.3" />
      {/* Roscas */}
      {roscas}
      {/* Tuerca de regulación */}
      <rect x={pB.x - tuercaW / 2} y={tuercaY - tuercaH / 2} width={tuercaW} height={tuercaH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} rx="0.5" opacity="0.85" />
      {/* Placa base */}
      <rect x={pB.x - placaW / 2} y={pB.y - 1} width={placaW} height={placaH}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.4, zoom * 0.004)} rx="0.5" />
      {/* Highlight placa */}
      <line x1={pB.x - placaW / 2 + 2} y1={pB.y} x2={pB.x + placaW / 2 - 2} y2={pB.y}
        stroke="#fff" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.25" />
      {/* Agujeros placa (4 esquinas) */}
      {zoom > 30 && <>
        <circle cx={pB.x - holeOff} cy={pB.y + placaH / 2} r={holeR} fill="#000" opacity="0.3" />
        <circle cx={pB.x + holeOff} cy={pB.y + placaH / 2} r={holeR} fill="#000" opacity="0.3" />
      </>}
    </g>
  );
}
