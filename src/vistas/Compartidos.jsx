// Elementos SVG comunes a Alzado y Planta: grilla de fondo, línea base y
// marcadores de snap. Reciben worldToScreen ya resuelto para el plano de cada vista.

export function Grilla({ worldVisible, worldToScreen, zoom }) {
  const ls = []; const step = zoom < 30 ? 1 : zoom < 80 ? 0.5 : 0.25;
  for (let x = Math.floor(worldVisible.xMin / step) * step; x <= Math.ceil(worldVisible.xMax / step) * step; x += step) {
    const p1 = worldToScreen(x, worldVisible.yMax), p2 = worldToScreen(x, worldVisible.yMin);
    const ent = Math.abs(x - Math.round(x)) < 0.01;
    ls.push(<line key={`v${x.toFixed(3)}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ent ? '#c0c4cc' : '#e8eaed'} strokeWidth={ent ? 0.7 : 0.3} />);
    if (ent && zoom > 25) ls.push(<text key={`vt${x.toFixed(3)}`} x={p1.x + 2} y={12} fontSize="9" fill="#94a3b8" fontFamily="monospace">{x.toFixed(0)}</text>);
  }
  for (let y = Math.floor(worldVisible.yMin / step) * step; y <= Math.ceil(worldVisible.yMax / step) * step; y += step) {
    const p1 = worldToScreen(worldVisible.xMin, y), p2 = worldToScreen(worldVisible.xMax, y);
    const ent = Math.abs(y - Math.round(y)) < 0.01;
    ls.push(<line key={`h${y.toFixed(3)}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ent ? '#c0c4cc' : '#e8eaed'} strokeWidth={ent ? 0.7 : 0.3} />);
    if (ent && zoom > 25) ls.push(<text key={`ht${y.toFixed(3)}`} x={4} y={p1.y - 2} fontSize="9" fill="#94a3b8" fontFamily="monospace">{y.toFixed(0)}</text>);
  }
  return <g>{ls}</g>;
}

// Línea base horizontal con achurado (suelo en Alzado, borde de referencia Z=0 en Planta).
export function LineaBase({ worldVisible, worldToScreen, y = 0 }) {
  const p1 = worldToScreen(worldVisible.xMin, y), p2 = worldToScreen(worldVisible.xMax, y);
  return (
    <g>
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeWidth="1.5" />
      {Array.from({ length: 60 }).map((_, i) => {
        const xW = worldVisible.xMin + (i * (worldVisible.xMax - worldVisible.xMin) / 60);
        const pa = worldToScreen(xW, y);
        return <line key={i} x1={pa.x} y1={pa.y} x2={pa.x + 6} y2={pa.y + 6} stroke="#000" strokeWidth="0.5" opacity="0.5" />;
      })}
    </g>
  );
}

export function IndicadoresSnap({ mousePos, worldToScreen, dimCanvas, ejeA = 'snapX', ejeB = 'snapY', destacado = 'snapRoseta' }) {
  const p = worldToScreen(mousePos.x, mousePos.y ?? mousePos.z);
  const c = mousePos[destacado] ? '#7c3aed' : '#E30613';
  return (
    <g pointerEvents="none">
      {mousePos[ejeB] && !mousePos[destacado] && <line x1={0} y1={p.y} x2={dimCanvas.w} y2={p.y} stroke={c} strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />}
      {mousePos[ejeA] && !mousePos[destacado] && <line x1={p.x} y1={0} x2={p.x} y2={dimCanvas.h} stroke={c} strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />}
      <circle cx={p.x} cy={p.y} r={mousePos[destacado] ? 7 : 5} fill="none" stroke={c} strokeWidth={mousePos[destacado] ? 2 : 1.5} />
    </g>
  );
}
