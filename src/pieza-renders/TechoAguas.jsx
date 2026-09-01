// Techo a 2 aguas — pieza compuesta (celosías inclinadas + cumbrera central)
// Solo representa 1 slice en ancho (profundidad se copia cada 2.57m)
// En alzado: perfil triangular con celosías inclinadas a ambos lados
// En despiece: se desglosa en celosías + cumbreras reales
export default function TechoAguas({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const modulosAncho = pieza.modulosAncho ?? Math.round(largo / 2.57);
  const celosiasPorLado = pieza.celosiasPorLado ?? Math.ceil(modulosAncho / 2);
  const MODULO = 2.57;
  const ALTO_CELOSIA = 0.50; // alto real celosía

  // Pendiente: ~18° para techos de escenario (relación 1:3 aprox)
  // Altura total del pico = (largo/2) × tan(pendiente)
  const pendienteRad = (18 * Math.PI) / 180;
  const altoPico = (largo / 2) * Math.tan(pendienteRad);

  // Puntos clave en mundo
  const baseIzq = { x: x, y: y };
  const baseDer = { x: x + largo, y: y };
  const pico = { x: x + largo / 2, y: y + altoPico };

  // Convertir a pantalla
  const sBaseIzq = worldToScreen(baseIzq.x, baseIzq.y);
  const sBaseDer = worldToScreen(baseDer.x, baseDer.y);
  const sPico = worldToScreen(pico.x, pico.y);

  const sw = Math.max(1.2, zoom * 0.02);
  const swCelosia = Math.max(1.5, zoom * 0.025);
  const nodeR = Math.max(2, zoom * 0.03);

  // Generar puntos de celosías inclinadas (cada módulo de 2.57m)
  const celosiasIzq = [];
  const celDer = [];
  for (let i = 0; i <= celosiasPorLado; i++) {
    const fracIzq = i / celosiasPorLado;
    const xw = x + (largo / 2) * fracIzq;
    const yw = y + altoPico * fracIzq;
    celosiasIzq.push(worldToScreen(xw, yw));
  }
  for (let i = 0; i <= celosiasPorLado; i++) {
    const fracDer = i / celosiasPorLado;
    const xw = x + largo - (largo / 2) * fracDer;
    const yw = y + altoPico * fracDer;
    celDer.push(worldToScreen(xw, yw));
  }

  // Bounding box
  const allX = [sBaseIzq.x, sBaseDer.x, sPico.x];
  const allY = [sBaseIzq.y, sBaseDer.y, sPico.y];
  const minX = Math.min(...allX) - 4;
  const minY = Math.min(...allY) - 4;
  const bW = Math.max(...allX) - minX + 8;
  const bH = Math.max(...allY) - minY + 8;

  const color = modoTecnico ? '#444' : (sc || pieza.color || '#dc2626');

  // Zigzag dentro de cada tramo de celosía (V-pattern como celosía real)
  function zigzagPath(p1, p2, nZigs = 4) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    // Normal perpendicular (hacia arriba/abajo)
    const len = Math.hypot(dx, dy);
    if (len < 2) return '';
    const nx = -dy / len;
    const ny = dx / len;
    const amp = Math.max(2, zoom * 0.04); // amplitud zigzag

    let d = `M${p1.x},${p1.y}`;
    for (let i = 1; i < nZigs; i++) {
      const t = i / nZigs;
      const mx = p1.x + dx * t;
      const my = p1.y + dy * t;
      const sign = i % 2 === 1 ? 1 : -1;
      d += ` L${mx + nx * amp * sign},${my + ny * amp * sign}`;
    }
    d += ` L${p2.x},${p2.y}`;
    return d;
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && (
        <rect x={minX} y={minY} width={bW} height={bH}
          fill="none" stroke="#E30613" strokeWidth="2" strokeDasharray="4 2" />
      )}

      {/* Relleno semi-transparente del triángulo */}
      <polygon
        points={`${sBaseIzq.x},${sBaseIzq.y} ${sPico.x},${sPico.y} ${sBaseDer.x},${sBaseDer.y}`}
        fill={color} fillOpacity={0.06} stroke="none" />

      {/* Línea de pendiente izquierda (cuerda superior izq) */}
      <line x1={sBaseIzq.x} y1={sBaseIzq.y} x2={sPico.x} y2={sPico.y}
        stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* Línea de pendiente derecha (cuerda superior der) */}
      <line x1={sPico.x} y1={sPico.y} x2={sBaseDer.x} y2={sBaseDer.y}
        stroke={color} strokeWidth={sw} strokeLinecap="round" />

      {/* Celosías inclinadas — lado izquierdo */}
      {celosiasIzq.map((pt, i) => {
        if (i >= celosiasIzq.length - 1) return null;
        const next = celosiasIzq[i + 1];
        return (
          <g key={`cel-izq-${i}`}>
            {/* Cuerda superior del tramo */}
            <line x1={pt.x} y1={pt.y} x2={next.x} y2={next.y}
              stroke={color} strokeWidth={swCelosia} strokeLinecap="round" opacity={0.8} />
            {/* Zigzag interior (alma reticulada) */}
            <path d={zigzagPath(pt, next, 5)}
              fill="none" stroke={color} strokeWidth={sw * 0.6} opacity={0.5} />
            {/* Nodo de conexión */}
            <circle cx={pt.x} cy={pt.y} r={nodeR * 0.7}
              fill={color} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} />
          </g>
        );
      })}

      {/* Celosías inclinadas — lado derecho */}
      {celDer.map((pt, i) => {
        if (i >= celDer.length - 1) return null;
        const next = celDer[i + 1];
        return (
          <g key={`cel-der-${i}`}>
            <line x1={pt.x} y1={pt.y} x2={next.x} y2={next.y}
              stroke={color} strokeWidth={swCelosia} strokeLinecap="round" opacity={0.8} />
            <path d={zigzagPath(pt, next, 5)}
              fill="none" stroke={color} strokeWidth={sw * 0.6} opacity={0.5} />
            <circle cx={pt.x} cy={pt.y} r={nodeR * 0.7}
              fill={color} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} />
          </g>
        );
      })}

      {/* Nodo del pico (cumbrera) */}
      <circle cx={sPico.x} cy={sPico.y} r={nodeR}
        fill={color} stroke="#fff" strokeWidth={Math.max(0.6, zoom * 0.006)} />

      {/* Línea vertical del montante central (pico a base) */}
      {(() => {
        const sBaseC = worldToScreen(x + largo / 2, y);
        return (
          <line x1={sBaseC.x} y1={sBaseC.y} x2={sPico.x} y2={sPico.y}
            stroke={color} strokeWidth={sw * 0.7} strokeDasharray={`${Math.max(2, zoom * 0.03)} ${Math.max(1, zoom * 0.015)}`}
            opacity={0.4} />
        );
      })()}

      {/* Etiqueta */}
      {zoom > 25 && !modoTecnico && (
        <text x={sPico.x} y={sPico.y - nodeR - 4}
          fontSize={Math.max(7, zoom * 0.065)} fill={color} textAnchor="middle"
          fontFamily="monospace" opacity="0.7" fontWeight="bold">
          🏠 Techo {largo.toFixed(2)}m
        </text>
      )}
    </g>
  );
}
