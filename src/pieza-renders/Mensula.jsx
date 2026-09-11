// Ménsula — voladizo lateral desde vertical con diagonal de apoyo.
// En alzado: brazo horizontal + diagonal triangular de refuerzo.
// Soporta `flip`: false = derecha (default), true = izquierda.
// Efecto 3D: sombra + highlight. Modo técnico: líneas finas sin decoración.
export default function Mensula({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const dir = pieza.flip ? -1 : 1; // dirección del voladizo
  // Punto de conexión (roseta en vertical) y extremo del voladizo
  const pO = worldToScreen(x, y);
  const pE = worldToScreen(x + largo * dir, y);
  // Punto inferior de la diagonal de apoyo (una roseta abajo, 0.50m)
  const pD = worldToScreen(x, y - 0.50);
  const w = Math.abs(pE.x - pO.x);

  const g = Math.max(2, zoom * 0.04);     // grosor brazo
  const gd = Math.max(1.5, zoom * 0.025); // grosor diagonal
  const tecW = Math.max(1, zoom * 0.012);
  const hlOff = g * 0.22;

  // Placa en extremo del voladizo
  const placaH = Math.max(4, zoom * 0.04);
  const placaW = Math.max(2, zoom * 0.02);

  // Bounds de selección: cubrir brazo + diagonal
  const minScreenX = Math.min(pO.x, pE.x, pD.x);
  const maxScreenX = Math.max(pO.x, pE.x, pD.x);
  const minScreenY = Math.min(pO.y, pE.y, pD.y);
  const maxScreenY = Math.max(pO.y, pE.y, pD.y);

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <rect x={minScreenX - 4} y={minScreenY - 4}
        width={maxScreenX - minScreenX + 8} height={maxScreenY - minScreenY + 8}
        fill="none" stroke="#E30613" strokeWidth="2" rx="2" />}

      {modoTecnico ? <>
        {/* Brazo horizontal */}
        <line x1={pO.x} y1={pO.y} x2={pE.x} y2={pE.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" />
        {/* Diagonal de apoyo */}
        <line x1={pD.x} y1={pD.y} x2={pE.x} y2={pE.y}
          stroke={sc} strokeWidth={tecW} strokeLinecap="round" strokeDasharray={`${Math.max(3, zoom * 0.04)} ${Math.max(2, zoom * 0.02)}`} />
        {/* Punto de conexión */}
        <circle cx={pO.x} cy={pO.y} r={Math.max(1.5, zoom * 0.015)}
          fill={sc} stroke={sc} strokeWidth={Math.max(0.3, zoom * 0.003)} />
        {/* Marca extremo */}
        <line x1={pE.x} y1={pE.y - placaH} x2={pE.x} y2={pE.y + placaH}
          stroke={sc} strokeWidth={tecW} />
      </> : <>
        {/* Sombra brazo */}
        <line x1={pO.x} y1={pO.y + hlOff} x2={pE.x} y2={pE.y + hlOff}
          stroke="#000" strokeWidth={g} strokeLinecap="round" opacity="0.06" />
        {/* Brazo horizontal */}
        <line x1={pO.x} y1={pO.y} x2={pE.x} y2={pE.y}
          stroke={sc} strokeWidth={g} strokeLinecap="round" />
        {/* Highlight brazo */}
        <line x1={pO.x} y1={pO.y - hlOff} x2={pE.x} y2={pE.y - hlOff}
          stroke="#fff" strokeWidth={g * 0.3} strokeLinecap="round" opacity="0.3" />
        {/* Diagonal de apoyo */}
        <line x1={pD.x} y1={pD.y} x2={pE.x} y2={pE.y}
          stroke={sc} strokeWidth={gd} strokeLinecap="round" opacity="0.7"
          strokeDasharray={`${Math.max(4, zoom * 0.05)} ${Math.max(2, zoom * 0.025)}`} />
        {/* Punto conexión roseta */}
        <circle cx={pO.x} cy={pO.y} r={Math.max(2.5, zoom * 0.025)}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.005)} />
        {/* Punto inferior diagonal */}
        <circle cx={pD.x} cy={pD.y} r={Math.max(2, zoom * 0.018)}
          fill={sc} stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.6" />
        {/* Placa extremo voladizo */}
        <rect x={pE.x - placaW / 2} y={pE.y - placaH} width={placaW} height={placaH * 2}
          fill={sc} stroke="#000" strokeWidth="0.5" rx="0.5" />
        {/* Etiqueta largo (zoom medio+) */}
        {zoom > 40 && w > 25 && (
          <text x={(pO.x + pE.x) / 2} y={pO.y - g - 3}
            fontSize={Math.max(5, zoom * 0.04)} fill={sc} textAnchor="middle"
            fontFamily="monospace" opacity="0.4">M {largo.toFixed(2)}m</text>
        )}
      </>}
    </g>
  );
}
