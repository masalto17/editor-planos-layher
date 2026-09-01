// Techo a 2 aguas — pieza compuesta (celosías U 2.57m inclinadas + cumbrera)
// Pendiente estándar: 11° (sistema techo Cassette Layher)
// Cada celosía: 2.57m largo × 0.50m alto, patrón W/V interior
// Cumbrera: pieza triangular en el pico, ancho 1 módulo (2.57m)
// Unión entre celosías: parantes 0.50m (chaveta → roseta)
export default function TechoAguas({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const celosiasPorLado = pieza.celosiasPorLado ?? Math.floor((pieza.modulosAncho ?? Math.round(largo / 2.57)) / 2);
  const MODULO = 2.57;
  const ALTO_CEL = 0.50; // profundidad de la celosía (perpendicular al cordón)
  const PENDIENTE = 11; // grados
  const rad = (PENDIENTE * Math.PI) / 180;
  const tanP = Math.tan(rad);
  const cosP = Math.cos(rad);
  const sinP = Math.sin(rad);

  // Geometría del techo
  const mitad = largo / 2;
  const altoPico = mitad * tanP; // ~1.25m para 12.85m

  const toS = (wx, wy) => worldToScreen(wx, wy);

  // Grosores
  const swCordon = Math.max(1.8, zoom * 0.028);
  const swWeb = Math.max(0.7, zoom * 0.012);
  const swCumbrera = Math.max(2, zoom * 0.032);
  const nodeR = Math.max(1.5, zoom * 0.02);

  const color = modoTecnico ? '#333' : (sc || pieza.color || '#555');

  // ─── Dibujar una celosía individual ───
  // baseX, baseY = extremo inferior (junto a la base/torre)
  // peakDir = +1 si el pico está a la derecha, -1 si está a la izquierda
  function renderCelosia(idx, baseX, baseY, peakDir) {
    const elements = [];
    const side = peakDir > 0 ? 'L' : 'R';
    const key = `cel-${side}-${idx}`;

    // La celosía va desde base (abajo) hacia el pico (arriba)
    // X avanza hacia el centro, Y siempre sube
    const endX = baseX + MODULO * peakDir;
    const endY = baseY + MODULO * tanP;

    // Offset perpendicular al cordón para el cordón inferior
    // Perpendicular a la pendiente, apuntando "hacia abajo" (fuera del triángulo)
    // En el lado izquierdo: normal perpendicular hacia abajo-derecha
    // En el lado derecho: normal perpendicular hacia abajo-izquierda
    const offX = sinP * ALTO_CEL * peakDir;
    const offY = -cosP * ALTO_CEL; // siempre hacia abajo

    // Cordón superior (sobre la línea de pendiente)
    const supBase = toS(baseX, baseY);
    const supEnd = toS(endX, endY);

    // Cordón inferior (offset perpendicular hacia abajo)
    const infBase = toS(baseX + offX, baseY + offY);
    const infEnd = toS(endX + offX, endY + offY);

    // Cordones principales
    elements.push(
      <line key={`${key}-sup`} x1={supBase.x} y1={supBase.y} x2={supEnd.x} y2={supEnd.y}
        stroke={color} strokeWidth={swCordon} strokeLinecap="round" />,
      <line key={`${key}-inf`} x1={infBase.x} y1={infBase.y} x2={infEnd.x} y2={infEnd.y}
        stroke={color} strokeWidth={swCordon} strokeLinecap="round" />
    );

    // Montantes en extremos (conectan cordón sup a inf)
    elements.push(
      <line key={`${key}-m0`} x1={supBase.x} y1={supBase.y} x2={infBase.x} y2={infBase.y}
        stroke={color} strokeWidth={swWeb} />,
      <line key={`${key}-m1`} x1={supEnd.x} y1={supEnd.y} x2={infEnd.x} y2={infEnd.y}
        stroke={color} strokeWidth={swWeb} />
    );

    // Patrón W/V interior (4 triángulos en 2.57m de celosía real)
    const nTriangles = 4;
    for (let i = 0; i < nTriangles; i++) {
      const t0 = i / nTriangles;
      const t1 = (i + 1) / nTriangles;
      const tMid = (t0 + t1) / 2;

      // Punto en cordón superior en t0 y t1
      const s0 = toS(
        baseX + MODULO * peakDir * t0,
        baseY + MODULO * tanP * t0
      );
      const s1 = toS(
        baseX + MODULO * peakDir * t1,
        baseY + MODULO * tanP * t1
      );

      // Punto en cordón inferior en el medio del panel
      const iMid = toS(
        baseX + offX + MODULO * peakDir * tMid,
        baseY + offY + MODULO * tanP * tMid
      );

      // V-pattern: sup[t0] → inf[mid] → sup[t1]
      elements.push(
        <line key={`${key}-va-${i}`} x1={s0.x} y1={s0.y} x2={iMid.x} y2={iMid.y}
          stroke={color} strokeWidth={swWeb} opacity={0.8} />,
        <line key={`${key}-vb-${i}`} x1={iMid.x} y1={iMid.y} x2={s1.x} y2={s1.y}
          stroke={color} strokeWidth={swWeb} opacity={0.8} />
      );

      // Nodo inferior
      elements.push(
        <circle key={`${key}-ni-${i}`} cx={iMid.x} cy={iMid.y} r={nodeR * 0.6}
          fill={color} stroke="#fff" strokeWidth={Math.max(0.3, zoom * 0.003)} />
      );
    }

    // Nodos en cordón superior (extremos)
    [supBase, supEnd].forEach((pt, i) => {
      elements.push(
        <circle key={`${key}-ns-${i}`} cx={pt.x} cy={pt.y} r={nodeR}
          fill={color} stroke="#fff" strokeWidth={Math.max(0.3, zoom * 0.004)} />
      );
    });

    // Cabezales cuña en extremos del cordón superior
    const cabW = Math.max(2, zoom * 0.035);
    const cabH = Math.max(4, zoom * 0.055);
    elements.push(
      <rect key={`${key}-cab0`} x={supBase.x - cabW / 2} y={supBase.y - cabH / 2}
        width={cabW} height={cabH} fill={color} opacity={0.6} rx={0.5} />,
      <rect key={`${key}-cab1`} x={supEnd.x - cabW / 2} y={supEnd.y - cabH / 2}
        width={cabW} height={cabH} fill={color} opacity={0.6} rx={0.5} />
    );

    return elements;
  }

  // ─── Cumbrera (pieza triangular en el pico) ───
  function renderCumbrera() {
    const elements = [];
    // La cumbrera ocupa el módulo central
    const cumIzqX = x + celosiasPorLado * MODULO;
    const cumIzqY = y + celosiasPorLado * MODULO * tanP;
    const cumDerX = x + largo - celosiasPorLado * MODULO;
    const cumDerY = cumIzqY; // simétrico
    const picoX = x + mitad;
    const picoY2 = y + altoPico;

    const cIzq = toS(cumIzqX, cumIzqY);
    const cDer = toS(cumDerX, cumDerY);
    const pico = toS(picoX, picoY2);

    // Montantes verticales bajo los extremos de la cumbrera
    const cIzqBot = toS(cumIzqX, cumIzqY - ALTO_CEL);
    const cDerBot = toS(cumDerX, cumDerY - ALTO_CEL);

    elements.push(
      // Pendientes al pico
      <line key="cumb-izq" x1={cIzq.x} y1={cIzq.y} x2={pico.x} y2={pico.y}
        stroke={color} strokeWidth={swCumbrera} strokeLinecap="round" />,
      <line key="cumb-der" x1={cDer.x} y1={cDer.y} x2={pico.x} y2={pico.y}
        stroke={color} strokeWidth={swCumbrera} strokeLinecap="round" />,
      // Base horizontal
      <line key="cumb-base" x1={cIzq.x} y1={cIzq.y} x2={cDer.x} y2={cDer.y}
        stroke={color} strokeWidth={swCordon} strokeLinecap="round" />,
      // Montantes verticales en extremos
      <line key="cumb-mL" x1={cIzq.x} y1={cIzq.y} x2={cIzqBot.x} y2={cIzqBot.y}
        stroke={color} strokeWidth={swCordon} strokeLinecap="round" />,
      <line key="cumb-mR" x1={cDer.x} y1={cDer.y} x2={cDerBot.x} y2={cDerBot.y}
        stroke={color} strokeWidth={swCordon} strokeLinecap="round" />,
      // Horizontal inferior
      <line key="cumb-inf" x1={cIzqBot.x} y1={cIzqBot.y} x2={cDerBot.x} y2={cDerBot.y}
        stroke={color} strokeWidth={swCordon} strokeLinecap="round" />,
      // Diagonales internas al pico
      <line key="cumb-d1" x1={cIzqBot.x} y1={cIzqBot.y} x2={pico.x} y2={pico.y}
        stroke={color} strokeWidth={swWeb} opacity={0.65} />,
      <line key="cumb-d2" x1={cDerBot.x} y1={cDerBot.y} x2={pico.x} y2={pico.y}
        stroke={color} strokeWidth={swWeb} opacity={0.65} />
    );

    // Nodos
    [cIzq, cDer, pico, cIzqBot, cDerBot].forEach((pt, i) => {
      elements.push(
        <circle key={`cumb-n${i}`} cx={pt.x} cy={pt.y} r={nodeR * 1.1}
          fill={color} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.005)} />
      );
    });

    return elements;
  }

  // ─── Parantes de unión 0.50m entre celosías adyacentes ───
  function renderParantes() {
    const elements = [];
    for (let i = 1; i < celosiasPorLado; i++) {
      // Lado izquierdo
      const lx = x + i * MODULO;
      const ly = y + i * MODULO * tanP;
      const ltop = toS(lx, ly);
      const lbot = toS(lx, ly - ALTO_CEL);
      elements.push(
        <line key={`par-L${i}`} x1={ltop.x} y1={ltop.y} x2={lbot.x} y2={lbot.y}
          stroke={color} strokeWidth={swCordon * 0.7} opacity={0.5} />
      );
      // Lado derecho (simétrico)
      const rx = x + largo - i * MODULO;
      const ry = ly;
      const rtop = toS(rx, ry);
      const rbot = toS(rx, ry - ALTO_CEL);
      elements.push(
        <line key={`par-R${i}`} x1={rtop.x} y1={rtop.y} x2={rbot.x} y2={rbot.y}
          stroke={color} strokeWidth={swCordon * 0.7} opacity={0.5} />
      );
    }
    return elements;
  }

  // ─── Bounding box ───
  const sBaseIzq = toS(x, y);
  const sBaseDer = toS(x + largo, y);
  const sPico = toS(x + mitad, y + altoPico);
  // Incluir los cordones inferiores (offset abajo)
  const sInfIzq = toS(x + sinP * ALTO_CEL, y - cosP * ALTO_CEL);
  const sInfDer = toS(x + largo - sinP * ALTO_CEL, y - cosP * ALTO_CEL);
  const pad = 8;
  const pts = [sBaseIzq, sBaseDer, sPico, sInfIzq, sInfDer];
  const minX = Math.min(...pts.map(p => p.x)) - pad;
  const minY = Math.min(...pts.map(p => p.y)) - pad;
  const maxX = Math.max(...pts.map(p => p.x)) + pad;
  const maxY = Math.max(...pts.map(p => p.y)) + pad;

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && (
        <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY}
          fill="none" stroke="#E30613" strokeWidth="2" strokeDasharray="4 2" />
      )}

      {/* Relleno sutil del perfil triangular */}
      <polygon
        points={`${sBaseIzq.x},${sBaseIzq.y} ${sPico.x},${sPico.y} ${sBaseDer.x},${sBaseDer.y}`}
        fill={color} fillOpacity={0.03} stroke="none" />

      {/* Celosías lado izquierdo (base → pico, peakDir=+1) */}
      {Array.from({ length: celosiasPorLado }, (_, i) => {
        const bx = x + i * MODULO;
        const by = y + i * MODULO * tanP;
        return renderCelosia(i, bx, by, +1);
      })}

      {/* Celosías lado derecho (base → pico, peakDir=-1) */}
      {Array.from({ length: celosiasPorLado }, (_, i) => {
        const bx = x + largo - i * MODULO;
        const by = y + i * MODULO * tanP;
        return renderCelosia(i, bx, by, -1);
      })}

      {/* Parantes de unión */}
      {renderParantes()}

      {/* Cumbrera */}
      {renderCumbrera()}

      {/* Placas de apoyo en base */}
      {(() => {
        const pw = Math.max(5, zoom * 0.09);
        const ph = Math.max(2, zoom * 0.03);
        return <>
          <rect x={sBaseIzq.x - pw / 2} y={sBaseIzq.y - ph} width={pw} height={ph}
            fill={color} opacity={0.5} rx={0.5} />
          <rect x={sBaseDer.x - pw / 2} y={sBaseDer.y - ph} width={pw} height={ph}
            fill={color} opacity={0.5} rx={0.5} />
        </>;
      })()}

      {/* Etiqueta */}
      {zoom > 18 && (
        <text x={sPico.x} y={sPico.y - nodeR - 8}
          fontSize={Math.max(8, zoom * 0.07)} fill={color} textAnchor="middle"
          fontFamily="monospace" opacity="0.8" fontWeight="bold">
          Techo 2 aguas {largo}m
        </text>
      )}
    </g>
  );
}
