// Apoya Techo — soporte de celosía cassette sobre vertical.
// En alzado: pieza vertical corta con articulación (espiga + pasador).
// Se comporta como vertical (se apoya sobre roseta del parante).
export default function ApoyaTecho({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pB = worldToScreen(x, y);          // base (roseta donde apoya)
  const pT = worldToScreen(x, y + largo);  // tope (donde conecta celosía)

  const tecW = Math.max(1, zoom * 0.012);
  const g = Math.max(2.5, zoom * 0.045);   // grosor tubo
  const hlOff = g * 0.22;

  // Articulación: círculo en tope
  const artR = Math.max(3, zoom * 0.035);
  // Pin de pasador
  const pinW = Math.max(4, zoom * 0.05);
  const pinH = Math.max(1.5, zoom * 0.012);

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <rect x={pB.x - artR - 3} y={Math.min(pB.y, pT.y) - artR - 3}
        width={artR * 2 + 6} height={Math.abs(pT.y - pB.y) + artR * 2 + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="2" />}

      {modoTecnico ? <>
        {/* Tubo vertical */}
        <line x1={pB.x} y1={pB.y} x2={pT.x} y2={pT.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" />
        {/* Articulación (círculo) */}
        <circle cx={pT.x} cy={pT.y} r={artR * 0.7}
          fill="none" stroke={sc} strokeWidth={tecW} />
        {/* Pin horizontal */}
        <line x1={pT.x - pinW * 0.7} y1={pT.y} x2={pT.x + pinW * 0.7} y2={pT.y}
          stroke={sc} strokeWidth={tecW} />
        {/* Punto base */}
        <circle cx={pB.x} cy={pB.y} r={Math.max(1.5, zoom * 0.015)}
          fill={sc} stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.003)} />
      </> : <>
        {/* Sombra tubo */}
        <line x1={pB.x + hlOff} y1={pB.y} x2={pT.x + hlOff} y2={pT.y}
          stroke="#000" strokeWidth={g} strokeLinecap="round" opacity="0.07" />
        {/* Tubo vertical */}
        <line x1={pB.x} y1={pB.y} x2={pT.x} y2={pT.y}
          stroke={sc} strokeWidth={g} strokeLinecap="round" />
        {/* Highlight */}
        <line x1={pB.x - hlOff * 0.5} y1={pB.y} x2={pT.x - hlOff * 0.5} y2={pT.y}
          stroke="#fff" strokeWidth={g * 0.3} strokeLinecap="round" opacity="0.3" />
        {/* Articulación — disco */}
        <circle cx={pT.x} cy={pT.y} r={artR}
          fill="#ddd" stroke={sc} strokeWidth={Math.max(1, zoom * 0.012)} />
        <circle cx={pT.x} cy={pT.y} r={artR * 0.35}
          fill={sc} />
        {/* Pin pasador horizontal */}
        <line x1={pT.x - pinW} y1={pT.y} x2={pT.x + pinW} y2={pT.y}
          stroke={sc} strokeWidth={pinH} strokeLinecap="round" />
        {/* Punto base (roseta) */}
        <circle cx={pB.x} cy={pB.y} r={Math.max(2.5, zoom * 0.025)}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
      </>}
    </g>
  );
}
