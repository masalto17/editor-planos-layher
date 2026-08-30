// Cumbrera — pieza especial (no Layher) para techo a 2 aguas
// Geometría tipo caballete simétrico:
//   - Cuerda inferior horizontal: 2.20m (pieza.largo)
//   - Cuerda superior quebrada: 2.37m (pieza.altoSuperior), con pendiente al centro
//   - Montante central vertical
//   - Montantes verticales en extremos (patas de conexión a parantes)
//   - Diagonales internas desde extremos inferiores al nodo superior central
//   - Nodos/discos de conexión en extremos y punto superior
// Color gris galvanizado, diferenciado de piezas Layher estándar.
export default function Cumbrera({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const ANCHO_INF = largo;                        // cuerda inferior: 2.20m
  const ANCHO_SUP = pieza.altoSuperior ?? 2.37;   // cuerda superior: 2.37m
  // La cuerda superior es más ancha que la inferior: los extremos superiores vuelan
  // (ANCHO_SUP - ANCHO_INF) / 2 = 0.085m a cada lado.
  const VOLADIZO = (ANCHO_SUP - ANCHO_INF) / 2;

  // Altura del pico (flecha central). Parametrizable — aprox 1.00m según fotos.
  const ALTO_PICO = 1.00;
  // Altura de las patas (montantes extremos que bajan por debajo de la cuerda inferior)
  const ALTO_PATA = 0.50;

  // ── Puntos en mundo ──
  // Cuerda inferior (base del caballete)
  const infL = { x: x, y: y };                          // inferior izquierda
  const infR = { x: x + ANCHO_INF, y: y };              // inferior derecha
  const infC = { x: x + ANCHO_INF / 2, y: y };          // centro inferior

  // Cuerda superior (quebrada: sube desde extremos al pico central)
  const supL = { x: x - VOLADIZO, y: y + ALTO_PICO * 0.35 };    // superior izq (arranque pendiente)
  const supR = { x: x + ANCHO_INF + VOLADIZO, y: y + ALTO_PICO * 0.35 }; // superior der
  const supC = { x: x + ANCHO_INF / 2, y: y + ALTO_PICO };      // pico central (punto más alto)

  // Patas (montantes que bajan)
  const pataL = { x: x, y: y - ALTO_PATA };
  const pataR = { x: x + ANCHO_INF, y: y - ALTO_PATA };

  // Convertir a pantalla
  const sInfL = worldToScreen(infL.x, infL.y);
  const sInfR = worldToScreen(infR.x, infR.y);
  const sInfC = worldToScreen(infC.x, infC.y);
  const sSupL = worldToScreen(supL.x, supL.y);
  const sSupR = worldToScreen(supR.x, supR.y);
  const sSupC = worldToScreen(supC.x, supC.y);
  const sPataL = worldToScreen(pataL.x, pataL.y);
  const sPataR = worldToScreen(pataR.x, pataR.y);

  const sw = Math.max(1.5, zoom * 0.025);       // grosor principal (tubos)
  const swInt = Math.max(0.8, zoom * 0.015);     // grosor diagonales internas
  const nodeR = Math.max(2.5, zoom * 0.035);     // radio nodos de conexión

  // Bounding box para selección
  const allX = [sInfL.x, sInfR.x, sSupL.x, sSupR.x, sSupC.x, sPataL.x, sPataR.x];
  const allY = [sInfL.y, sInfR.y, sSupL.y, sSupR.y, sSupC.y, sPataL.y, sPataR.y];
  const minX = Math.min(...allX) - 4;
  const minY = Math.min(...allY) - 4;
  const bW = Math.max(...allX) - minX + 8;
  const bH = Math.max(...allY) - minY + 8;

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && (
        <rect x={minX} y={minY} width={bW} height={bH}
          fill="none" stroke="#E30613" strokeWidth="2" strokeDasharray="4 2" />
      )}

      {/* Patas (montantes verticales extremos — conexión a parantes) */}
      <line x1={sPataL.x} y1={sPataL.y} x2={sInfL.x} y2={sInfL.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      <line x1={sPataR.x} y1={sPataR.y} x2={sInfR.x} y2={sInfR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />

      {/* Cuerda inferior (horizontal) */}
      <line x1={sInfL.x} y1={sInfL.y} x2={sInfR.x} y2={sInfR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />

      {/* Cuerda superior quebrada (pendiente izq → pico → pendiente der) */}
      <line x1={sSupL.x} y1={sSupL.y} x2={sSupC.x} y2={sSupC.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />
      <line x1={sSupC.x} y1={sSupC.y} x2={sSupR.x} y2={sSupR.y}
        stroke={sc} strokeWidth={sw} strokeLinecap="round" />

      {/* Montantes verticales en extremos (de cuerda inf a cuerda sup) */}
      <line x1={sInfL.x} y1={sInfL.y} x2={sSupL.x} y2={sSupL.y}
        stroke={sc} strokeWidth={swInt} strokeLinecap="round" />
      <line x1={sInfR.x} y1={sInfR.y} x2={sSupR.x} y2={sSupR.y}
        stroke={sc} strokeWidth={swInt} strokeLinecap="round" />

      {/* Montante central vertical (de cuerda inf al pico) */}
      <line x1={sInfC.x} y1={sInfC.y} x2={sSupC.x} y2={sSupC.y}
        stroke={sc} strokeWidth={sw * 0.9} strokeLinecap="round" />

      {/* Diagonales internas: de extremos inferiores al pico */}
      <line x1={sInfL.x} y1={sInfL.y} x2={sSupC.x} y2={sSupC.y}
        stroke={sc} strokeWidth={swInt} opacity={0.7} />
      <line x1={sInfR.x} y1={sInfR.y} x2={sSupC.x} y2={sSupC.y}
        stroke={sc} strokeWidth={swInt} opacity={0.7} />

      {/* Nodos/discos de conexión */}
      {/* Nodo pico superior */}
      <circle cx={sSupC.x} cy={sSupC.y} r={nodeR}
        fill={sc} stroke="#fff" strokeWidth={Math.max(0.5, zoom * 0.005)} />
      {/* Nodos extremos superiores */}
      <circle cx={sSupL.x} cy={sSupL.y} r={nodeR * 0.8}
        fill={sc} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} />
      <circle cx={sSupR.x} cy={sSupR.y} r={nodeR * 0.8}
        fill={sc} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} />
      {/* Nodos extremos inferiores */}
      <circle cx={sInfL.x} cy={sInfL.y} r={nodeR * 0.8}
        fill={sc} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} />
      <circle cx={sInfR.x} cy={sInfR.y} r={nodeR * 0.8}
        fill={sc} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} />
      {/* Nodo centro inferior */}
      <circle cx={sInfC.x} cy={sInfC.y} r={nodeR * 0.6}
        fill={sc} opacity="0.6" />
      {/* Nodos base patas */}
      <circle cx={sPataL.x} cy={sPataL.y} r={nodeR * 0.7}
        fill={sc} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} />
      <circle cx={sPataR.x} cy={sPataR.y} r={nodeR * 0.7}
        fill={sc} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} />

      {/* Etiqueta */}
      {zoom > 35 && !modoTecnico && (
        <text x={sInfC.x} y={sPataL.y + 14}
          fontSize={Math.max(7, zoom * 0.07)} fill={sc} textAnchor="middle"
          fontFamily="monospace" opacity="0.6">
          ⛺ Cumbrera {ANCHO_INF.toFixed(2)}m
        </text>
      )}
    </g>
  );
}
