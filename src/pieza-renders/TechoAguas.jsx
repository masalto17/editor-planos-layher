// Techo a 2 aguas — pieza compuesta (celosías inclinadas + cumbrera central)
// Render realista tipo plano técnico: cordón superior, cordón inferior,
// montantes verticales y diagonales entre cordones (reticulado triangulado)
export default function TechoAguas({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const modulosAncho = pieza.modulosAncho ?? Math.round(largo / 2.57);
  const celosiasPorLado = pieza.celosiasPorLado ?? Math.ceil(modulosAncho / 2);

  // Dimensiones reales de celosía Layher
  const ALTO_CELOSIA = 0.45; // profundidad del reticulado (alto de la celosía)
  const PENDIENTE_GRADOS = 15; // pendiente real para escenarios Layher
  const pendienteRad = (PENDIENTE_GRADOS * Math.PI) / 180;
  const altoPico = (largo / 2) * Math.tan(pendienteRad);

  // Número de paneles de reticulado por lado (cada ~1.28m de recorrido inclinado)
  const largoInclinado = (largo / 2) / Math.cos(pendienteRad);
  const nPaneles = Math.max(3, Math.round(largoInclinado / 1.28));

  // Dirección perpendicular a la pendiente (hacia abajo/adentro para cordón inferior)
  // Lado izquierdo: pendiente sube hacia la derecha
  const cosP = Math.cos(pendienteRad);
  const sinP = Math.sin(pendienteRad);

  // Construir puntos del cordón superior e inferior — LADO IZQUIERDO
  function buildLadoIzq() {
    const sup = []; // cordón superior (línea de pendiente)
    const inf = []; // cordón inferior (offset hacia abajo perpendicular)
    for (let i = 0; i <= nPaneles; i++) {
      const t = i / nPaneles;
      // Sobre la línea de pendiente
      const xSup = x + (largo / 2) * t;
      const ySup = y + altoPico * t;
      sup.push({ x: xSup, y: ySup });
      // Offset perpendicular hacia abajo (hacia dentro del triángulo)
      // Perpendicular a la pendiente izq: normal = (sinP, -cosP) en mundo (Y arriba)
      const xInf = xSup + sinP * ALTO_CELOSIA;
      const yInf = ySup - cosP * ALTO_CELOSIA;
      inf.push({ x: xInf, y: yInf });
    }
    return { sup, inf };
  }

  // LADO DERECHO (simétrico)
  function buildLadoDer() {
    const sup = [];
    const inf = [];
    for (let i = 0; i <= nPaneles; i++) {
      const t = i / nPaneles;
      const xSup = x + largo - (largo / 2) * t;
      const ySup = y + altoPico * t;
      sup.push({ x: xSup, y: ySup });
      // Perpendicular hacia abajo en lado derecho: normal = (-sinP, -cosP)
      const xInf = xSup - sinP * ALTO_CELOSIA;
      const yInf = ySup - cosP * ALTO_CELOSIA;
      inf.push({ x: xInf, y: yInf });
    }
    return { sup, inf };
  }

  const ladoIzq = buildLadoIzq();
  const ladoDer = buildLadoDer();

  // Convertir a pantalla
  const toS = (p) => worldToScreen(p.x, p.y);

  const supIzqS = ladoIzq.sup.map(toS);
  const infIzqS = ladoIzq.inf.map(toS);
  const supDerS = ladoDer.sup.map(toS);
  const infDerS = ladoDer.inf.map(toS);

  // Puntos clave pantalla
  const sBaseIzq = worldToScreen(x, y);
  const sBaseDer = worldToScreen(x + largo, y);
  const sPico = worldToScreen(x + largo / 2, y + altoPico);

  // Grosores
  const swCordon = Math.max(1.5, zoom * 0.025);  // cordón principal
  const swWeb = Math.max(0.8, zoom * 0.015);      // montantes/diagonales
  const nodeR = Math.max(1.8, zoom * 0.025);

  // Bounding box
  const allPts = [...supIzqS, ...infIzqS, ...supDerS, ...infDerS];
  const allX = allPts.map(p => p.x);
  const allY = allPts.map(p => p.y);
  const minX = Math.min(...allX) - 6;
  const minY = Math.min(...allY) - 6;
  const bW = Math.max(...allX) - minX + 12;
  const bH = Math.max(...allY) - minY + 12;

  const color = modoTecnico ? '#333' : (sc || pieza.color || '#555');
  const colorFill = modoTecnico ? '#666' : (sc || pieza.color || '#555');

  // Dibujar un lado de celosía
  function renderLado(supS, infS, keyPrefix) {
    const elements = [];

    // Cordón superior (línea continua gruesa)
    for (let i = 0; i < supS.length - 1; i++) {
      elements.push(
        <line key={`${keyPrefix}-sup-${i}`}
          x1={supS[i].x} y1={supS[i].y} x2={supS[i + 1].x} y2={supS[i + 1].y}
          stroke={color} strokeWidth={swCordon} strokeLinecap="round" />
      );
    }

    // Cordón inferior (línea continua gruesa)
    for (let i = 0; i < infS.length - 1; i++) {
      elements.push(
        <line key={`${keyPrefix}-inf-${i}`}
          x1={infS[i].x} y1={infS[i].y} x2={infS[i + 1].x} y2={infS[i + 1].y}
          stroke={color} strokeWidth={swCordon} strokeLinecap="round" />
      );
    }

    // Montantes verticales (perpendiculares entre cordones)
    for (let i = 0; i <= supS.length - 1; i++) {
      elements.push(
        <line key={`${keyPrefix}-mont-${i}`}
          x1={supS[i].x} y1={supS[i].y} x2={infS[i].x} y2={infS[i].y}
          stroke={color} strokeWidth={swWeb} strokeLinecap="round" />
      );
    }

    // Diagonales (V-pattern: alternando sup[i]->inf[i+1] e inf[i+1]->sup[i+1])
    for (let i = 0; i < supS.length - 1; i++) {
      // Diagonal desde cordón superior a cordón inferior del siguiente panel
      elements.push(
        <line key={`${keyPrefix}-diag-a-${i}`}
          x1={supS[i].x} y1={supS[i].y} x2={infS[i + 1].x} y2={infS[i + 1].y}
          stroke={color} strokeWidth={swWeb} strokeLinecap="round" />
      );
      // Diagonal desde cordón inferior al cordón superior del siguiente panel
      elements.push(
        <line key={`${keyPrefix}-diag-b-${i}`}
          x1={infS[i].x} y1={infS[i].y} x2={supS[i + 1].x} y2={supS[i + 1].y}
          stroke={color} strokeWidth={swWeb} strokeLinecap="round" />
      );
    }

    // Nodos en cordón superior
    for (let i = 0; i < supS.length; i++) {
      elements.push(
        <circle key={`${keyPrefix}-nsup-${i}`}
          cx={supS[i].x} cy={supS[i].y} r={nodeR}
          fill={colorFill} stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.005)} />
      );
    }

    // Nodos en cordón inferior
    for (let i = 0; i < infS.length; i++) {
      elements.push(
        <circle key={`${keyPrefix}-ninf-${i}`}
          cx={infS[i].x} cy={infS[i].y} r={nodeR * 0.8}
          fill={colorFill} stroke="#fff" strokeWidth={Math.max(0.3, zoom * 0.004)} />
      );
    }

    return elements;
  }

  // Cumbrera: pieza horizontal en el pico conectando ambos lados
  const cumbreraIzqSup = supIzqS[supIzqS.length - 1];
  const cumbreraIzqInf = infIzqS[infIzqS.length - 1];
  const cumbreraDerSup = supDerS[supDerS.length - 1];
  const cumbreraDerInf = infDerS[infDerS.length - 1];

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && (
        <rect x={minX} y={minY} width={bW} height={bH}
          fill="none" stroke="#E30613" strokeWidth="2" strokeDasharray="4 2" />
      )}

      {/* Relleno semi-transparente suave */}
      <polygon
        points={`${sBaseIzq.x},${sBaseIzq.y} ${sPico.x},${sPico.y} ${sBaseDer.x},${sBaseDer.y}`}
        fill={color} fillOpacity={0.03} stroke="none" />

      {/* Celosía lado izquierdo */}
      {renderLado(supIzqS, infIzqS, 'izq')}

      {/* Celosía lado derecho */}
      {renderLado(supDerS, infDerS, 'der')}

      {/* Cumbrera — unión superior entre ambos lados */}
      <line x1={cumbreraIzqSup.x} y1={cumbreraIzqSup.y}
        x2={cumbreraDerSup.x} y2={cumbreraDerSup.y}
        stroke={color} strokeWidth={swCordon * 1.2} strokeLinecap="round" />
      {/* Cumbrera — unión inferior */}
      <line x1={cumbreraIzqInf.x} y1={cumbreraIzqInf.y}
        x2={cumbreraDerInf.x} y2={cumbreraDerInf.y}
        stroke={color} strokeWidth={swCordon} strokeLinecap="round" />
      {/* Cumbrera — montante central vertical */}
      <line x1={sPico.x} y1={cumbreraIzqSup.y}
        x2={sPico.x} y2={cumbreraIzqInf.y}
        stroke={color} strokeWidth={swWeb} strokeLinecap="round" />

      {/* Placas de apoyo en base (donde apoya sobre vertical) */}
      {(() => {
        const pw = Math.max(4, zoom * 0.08);
        const ph = Math.max(2, zoom * 0.03);
        return <>
          <rect x={sBaseIzq.x - pw / 2} y={sBaseIzq.y - ph} width={pw} height={ph}
            fill={color} opacity={0.6} />
          <rect x={sBaseDer.x - pw / 2} y={sBaseDer.y - ph} width={pw} height={ph}
            fill={color} opacity={0.6} />
        </>;
      })()}

      {/* Etiqueta */}
      {zoom > 20 && (
        <text x={sPico.x} y={sPico.y - nodeR - 6}
          fontSize={Math.max(8, zoom * 0.07)} fill={color} textAnchor="middle"
          fontFamily="monospace" opacity="0.8" fontWeight="bold">
          Techo {largo.toFixed(2)}m
        </text>
      )}
    </g>
  );
}
