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
export function LineaBase({ worldVisible, worldToScreen, y = 0, label }) {
  const p1 = worldToScreen(worldVisible.xMin, y), p2 = worldToScreen(worldVisible.xMax, y);
  return (
    <g>
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeWidth="1.5" />
      {Array.from({ length: 60 }).map((_, i) => {
        const xW = worldVisible.xMin + (i * (worldVisible.xMax - worldVisible.xMin) / 60);
        const pa = worldToScreen(xW, y);
        return <line key={i} x1={pa.x} y1={pa.y} x2={pa.x + 6} y2={pa.y + 6} stroke="#000" strokeWidth="0.5" opacity="0.5" />;
      })}
      {label && (
        <g>
          <rect x={p2.x - 52} y={p1.y - 14} width={48} height={13} rx="2" fill="#000" fillOpacity="0.7" />
          <text x={p2.x - 28} y={p1.y - 4} fontSize="9" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{label}</text>
        </g>
      )}
    </g>
  );
}

import { MODULOS_STANDARD } from '../catalogo/constantes.js';

export function IndicadoresSnap({ mousePos, worldToScreen, dimCanvas, ejeA = 'snapX', ejeB = 'snapY', destacado = 'snapRoseta', zoom }) {
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

/**
 * Guías de modulación Layher: cuando hay herramienta activa, dibuja líneas verticales
 * en cada posición de módulo estándar desde los verticales existentes, y una cota
 * horizontal mostrando la distancia al vertical de referencia.
 */
export function GuiasModulacion({ mousePos, worldToScreen, dimCanvas, zoom, vista = 'alzado' }) {
  const posVertX = mousePos.posVertX;
  if (!posVertX || posVertX.length === 0) return null;
  const elements = [];
  const snapX = mousePos.x;
  const yCoord = vista === 'alzado' ? (mousePos.y ?? 0) : (mousePos.z ?? 0);

  // 1. Líneas tenues de modulaciones posibles desde verticales cercanos al cursor
  // Solo mostramos desde los 2 verticales más cercanos para no saturar
  const sortedV = [...posVertX].sort((a, b) => Math.abs(a - snapX) - Math.abs(b - snapX)).slice(0, 2);
  const modulosVisibles = new Set();
  sortedV.forEach(vx => {
    MODULOS_STANDARD.forEach(mod => {
      [vx + mod, vx - mod].forEach(mx => {
        const key = mx.toFixed(3);
        if (modulosVisibles.has(key)) return;
        modulosVisibles.add(key);
        // Solo si está razonablemente cerca del cursor (dentro de 2 módulos)
        if (Math.abs(mx - snapX) > 4) return;
        const pm = worldToScreen(mx, 0);
        const esActivo = Math.abs(mx - snapX) < 0.02;
        if (!esActivo) {
          elements.push(
            <line key={`mod-${key}`} x1={pm.x} y1={0} x2={pm.x} y2={dimCanvas.h}
              stroke="#E30613" strokeWidth="0.3" strokeDasharray="2 4" opacity="0.25" />
          );
          // Mini etiqueta con distancia
          if (zoom > 30) {
            elements.push(
              <text key={`modt-${key}`} x={pm.x} y={14} fontSize="7" fill="#E30613" opacity="0.4"
                textAnchor="middle" fontFamily="monospace">{mod.toFixed(2)}</text>
            );
          }
        }
      });
    });
  });

  // 2. Cota de distancia al vertical de referencia (cuando snapea a módulo)
  const vertRef = mousePos.verticalCercanoX ?? mousePos.snapDesdeX;
  const dist = mousePos.distanciaVertical ?? (mousePos.snapModulo > 0 ? mousePos.snapModulo : null);
  if (vertRef !== null && vertRef !== undefined && dist !== null && dist > 0.01) {
    const pRef = worldToScreen(vertRef, yCoord);
    const pSnap = worldToScreen(snapX, yCoord);
    const cotaY = Math.min(pRef.y, pSnap.y) - 12;
    const esModulo = MODULOS_STANDARD.some(m => Math.abs(dist - m) < 0.005);
    const colorCota = esModulo ? '#16a34a' : '#E30613';
    // Línea horizontal de cota
    elements.push(
      <g key="cota-dist">
        <line x1={pRef.x} y1={cotaY} x2={pSnap.x} y2={cotaY} stroke={colorCota} strokeWidth="1" />
        {/* Flechitas */}
        <line x1={pRef.x} y1={cotaY - 3} x2={pRef.x} y2={cotaY + 3} stroke={colorCota} strokeWidth="1" />
        <line x1={pSnap.x} y1={cotaY - 3} x2={pSnap.x} y2={cotaY + 3} stroke={colorCota} strokeWidth="1" />
        {/* Líneas verticales tenues al punto */}
        <line x1={pRef.x} y1={cotaY + 3} x2={pRef.x} y2={pRef.y} stroke={colorCota} strokeWidth="0.3" strokeDasharray="2 3" opacity="0.4" />
        <line x1={pSnap.x} y1={cotaY + 3} x2={pSnap.x} y2={pSnap.y} stroke={colorCota} strokeWidth="0.3" strokeDasharray="2 3" opacity="0.4" />
        {/* Etiqueta de distancia */}
        <rect x={(pRef.x + pSnap.x) / 2 - 22} y={cotaY - 12} width={44} height={13} rx="2"
          fill={esModulo ? '#16a34a' : '#000'} fillOpacity="0.85" />
        <text x={(pRef.x + pSnap.x) / 2} y={cotaY - 2.5} fontSize="9" fill="white"
          textAnchor="middle" fontFamily="monospace" fontWeight="bold">
          {dist.toFixed(2)}m
        </text>
        {esModulo && (
          <>
            <rect x={(pRef.x + pSnap.x) / 2 - 14} y={cotaY - 23} width={28} height={10} rx="2" fill="#16a34a" />
            <text x={(pRef.x + pSnap.x) / 2} y={cotaY - 15} fontSize="7" fill="white"
              textAnchor="middle" fontFamily="monospace" fontWeight="bold">MOD ✓</text>
          </>
        )}
      </g>
    );
  }

  return <g pointerEvents="none">{elements}</g>;
}
