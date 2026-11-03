// ============================================================
// Hoja «Planta de predio» del PDF: dibujo vectorial del predio completo por capas,
// a escala normalizada, con leyenda y resúmenes armados solos a partir del diseño.
// Datos desconocidos se informan como «sin dato»; nunca se completan con supuestos.
// ============================================================

import { CAPAS } from '../catalogo/festival.js';
import {
  esFestival, esArea, esRecorrido, capaDe, puntosAbs, huellaXZ, superficie, largoPolilinea, centroide,
  resumenVallado, resumenPeso, dimsDe, localAMundo,
} from '../modelo/entidades.js';
import { piezaBoundsXZ } from '../modelo/operaciones.js';

const ESCALAS = [50, 100, 200, 250, 500, 750, 1000, 1500, 2000, 2500, 5000, 10000];
const fmt = (v, d = 2) => v.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: d });

const rgb = hex => { const h = (hex || '#777777').replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
// Color aclarado hacia el blanco (relleno de áreas, sin transparencias).
const claro = (hex, t = 0.82) => rgb(hex).map(c => Math.round(c + (255 - c) * t));

export const capasPresentes = piezas => {
  const m = new Map();
  for (const p of piezas) { const c = capaDe(p); m.set(c, (m.get(c) || 0) + 1); }
  return CAPAS.filter(c => m.has(c.id)).map(c => ({ ...c, cantidad: m.get(c.id) }));
};

export const tienePredio = piezas => piezas.some(p => esFestival(p) || esArea(p) || esRecorrido(p) || p.grupo);

function boundsDe(piezas) {
  let b = { xMin: Infinity, xMax: -Infinity, zMin: Infinity, zMax: -Infinity };
  for (const p of piezas) {
    const q = piezaBoundsXZ(p);
    if (![q.xMin, q.xMax, q.zMin, q.zMax].every(Number.isFinite)) continue;
    b = { xMin: Math.min(b.xMin, q.xMin), xMax: Math.max(b.xMax, q.xMax), zMin: Math.min(b.zMin, q.zMin), zMax: Math.max(b.zMax, q.zMax) };
  }
  return Number.isFinite(b.xMin) ? b : { xMin: 0, xMax: 10, zMin: 0, zMax: 10 };
}

// Escala normalizada 1:N que hace entrar el predio (más un margen de 2 m) en el área.
export function escalaPredio(bounds, areaW, areaH) {
  const dx = bounds.xMax - bounds.xMin + 4, dz = bounds.zMax - bounds.zMin + 4;
  const necesaria = Math.max((dx * 1000) / areaW, (dz * 1000) / areaH);
  return ESCALAS.find(n => n >= necesaria) ?? Math.ceil(necesaria / 1000) * 1000;
}

/**
 * Dibuja la planta del predio en el rectángulo (x0, y0, w, h) en mm.
 * Devuelve { escala } para el pie de página.
 */
export function dibujarPlantaPredio(doc, piezasTodas, capasIncluidas, x0, y0, w, h) {
  const piezas = piezasTodas.filter(p => capasIncluidas.includes(capaDe(p)));
  const b = boundsDe(piezas);
  const N = escalaPredio(b, w, h - 12);
  const s = 1000 / N; // mm de papel por metro
  const cx = (b.xMin + b.xMax) / 2, cz = (b.zMin + b.zMax) / 2;
  const ox = x0 + w / 2 - cx * s, oz = y0 + (h - 12) / 2 - cz * s;
  const P = (x, z) => [ox + x * s, oz + z * s];

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(x0, y0, w, h - 12);

  const poligono = (pts, relleno, trazo, ancho = 0.3, estilo = 'FD') => {
    if (pts.length < 2) return;
    const [a, ...resto] = pts.map(q => P(q.x, q.z));
    const lineas = resto.map((q, i) => [q[0] - (i === 0 ? a[0] : resto[i - 1][0]), q[1] - (i === 0 ? a[1] : resto[i - 1][1])]);
    if (relleno) doc.setFillColor(...relleno);
    doc.setDrawColor(...trazo);
    doc.setLineWidth(ancho);
    doc.lines(lineas, a[0], a[1], [1, 1], estilo, true);
  };
  const texto = (t, x, z, tam = 5.5, color = [30, 30, 30], opts = {}) => {
    const [px, pz] = P(x, z);
    doc.setFont('helvetica', opts.negrita ? 'bold' : 'normal');
    doc.setFontSize(tam);
    doc.setTextColor(...color);
    doc.text(t, px, pz, { align: 'center', baseline: 'middle' });
  };

  // 1. Áreas (fondo)
  for (const p of piezas.filter(esArea)) {
    const pts = puntosAbs(p);
    if (pts.length < 3) continue;
    poligono(pts, claro(p.color), rgb(p.color), 0.35);
    const c = centroide(pts);
    texto(`${p.codigo ? `${p.codigo} · ` : ''}${p.nombre}`, c.x, c.z - 1.5 / s, 6, rgb(p.color), { negrita: true });
    texto(`${fmt(superficie(pts))} m²`, c.x, c.z + 1.5 / s, 5.5, rgb(p.color));
  }

  // 2. Recorridos
  for (const p of piezas.filter(esRecorrido)) {
    const pts = puntosAbs(p);
    if (pts.length < 2) continue;
    if (p.ancho) {
      doc.setDrawColor(...claro(p.color, 0.7));
      doc.setLineWidth(Math.max(0.3, p.ancho * s));
      for (let i = 1; i < pts.length; i++) doc.line(...P(pts[i - 1].x, pts[i - 1].z), ...P(pts[i].x, pts[i].z));
    }
    doc.setDrawColor(...rgb(p.color));
    doc.setLineWidth(0.45);
    doc.setLineDashPattern([2, 1], 0);
    for (let i = 1; i < pts.length; i++) doc.line(...P(pts[i - 1].x, pts[i - 1].z), ...P(pts[i].x, pts[i].z));
    doc.setLineDashPattern([], 0);
    const i = Math.floor((pts.length - 1) / 2), m = { x: (pts[i].x + pts[i + 1].x) / 2, z: (pts[i].z + pts[i + 1].z) / 2 };
    texto(`${p.codigo ? `${p.codigo} · ` : ''}${p.nombre} · ${fmt(largoPolilinea(pts))} m`, m.x, m.z - 2.2 / s, 5, rgb(p.color), { negrita: true });
  }

  // 3. Piezas Layher sueltas y de torres: trazo fino gris (la planta de predio no detalla nudos)
  doc.setDrawColor(110, 110, 110);
  doc.setLineWidth(0.12);
  for (const p of piezas) {
    if (esFestival(p) || esArea(p) || esRecorrido(p)) continue;
    const q = piezaBoundsXZ(p);
    if (![q.xMin, q.xMax, q.zMin, q.zMax].every(Number.isFinite)) continue;
    const [a1, a2] = P(q.xMin, q.zMin), [b1, b2] = P(q.xMax, q.zMax);
    if (b1 - a1 < 0.05 && b2 - a2 < 0.05) { doc.setFillColor(80, 80, 80); doc.circle(a1, a2, 0.25, 'F'); }
    else if (b1 - a1 < 0.05 || b2 - a2 < 0.05) doc.line(a1, a2, b1, b2);
    else doc.rect(a1, a2, b1 - a1, b2 - a2);
  }

  // 4. Piezas de predio (festival)
  for (const p of piezas.filter(esFestival)) {
    const def = p._def ?? {};
    const color = rgb(p.color ?? def.color);
    const hx = huellaXZ(p);
    if (!hx) {
      // Sin dimensiones: símbolo sin escala, rotulado.
      const [px, pz] = P(p.x, p.z ?? 0);
      doc.setDrawColor(...color); doc.setLineWidth(0.3); doc.setLineDashPattern([0.8, 0.6], 0);
      doc.rect(px - 2, pz - 2, 4, 4); doc.setLineDashPattern([], 0);
      texto(`${p.codigo ?? ''} s/escala`, p.x, (p.z ?? 0) + 3.5 / s, 4.5, color);
      continue;
    }
    const { ancho } = dimsDe(p);
    if (!hx.profundidadConocida || def.familia === 'rejaModular' || def.geometria === 'abertura') {
      const a = localAMundo(p, -ancho / 2, 0), c = localAMundo(p, ancho / 2, 0);
      doc.setDrawColor(...color); doc.setLineWidth(def.geometria === 'abertura' ? 0.5 : 0.6);
      doc.line(...P(a.x, a.z), ...P(c.x, c.z));
    } else {
      poligono(hx.puntos, claro(p.color ?? def.color, 0.55), color, 0.25);
    }
    // Código solo en piezas sueltas grandes (los vallados se cuentan en la leyenda)
    if (p.codigo && def.familia !== 'rejaModular' && def.familia !== 'valladoAntiavalancha' && ancho * s > 4) {
      texto(p.codigo, p.x, p.z ?? 0, 4.5, [20, 20, 20], { negrita: true });
    }
  }

  // 5. Conjuntos (torres): recuadro y rótulo
  const grupos = new Map();
  for (const p of piezas) {
    if (!p.grupo) continue;
    const q = piezaBoundsXZ(p);
    const g = grupos.get(p.grupo.id) ?? { ...p.grupo, xMin: Infinity, xMax: -Infinity, zMin: Infinity, zMax: -Infinity };
    g.xMin = Math.min(g.xMin, q.xMin); g.xMax = Math.max(g.xMax, q.xMax); g.zMin = Math.min(g.zMin, q.zMin); g.zMax = Math.max(g.zMax, q.zMax);
    grupos.set(p.grupo.id, g);
  }
  doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.3); doc.setLineDashPattern([0.8, 0.8], 0);
  for (const g of grupos.values()) {
    const [a1, a2] = P(g.xMin, g.zMin), [b1, b2] = P(g.xMax, g.zMax);
    doc.rect(a1 - 0.8, a2 - 0.8, b1 - a1 + 1.6, b2 - a2 + 1.6);
  }
  doc.setLineDashPattern([], 0);
  for (const g of grupos.values()) texto(g.codigo ?? '', (g.xMin + g.xMax) / 2, g.zMin - 2.5 / s, 5.5, [30, 58, 138], { negrita: true });

  // 6. Escala gráfica y norte del dibujo
  const largos = [1, 2, 5, 10, 20, 25, 50, 100, 200];
  const L = largos.find(l => l * s >= 30) ?? 200;
  const by = y0 + h - 6, bx = x0 + 2;
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
  for (let k = 0; k < 4; k++) {
    if (k % 2 === 0) { doc.setFillColor(0, 0, 0); doc.rect(bx + (k * L * s) / 4, by, (L * s) / 4, 1.4, 'FD'); }
    else doc.rect(bx + (k * L * s) / 4, by, (L * s) / 4, 1.4);
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(60, 60, 60);
  doc.text('0', bx, by - 0.8, { align: 'center' });
  doc.text(`${L} m`, bx + L * s, by - 0.8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(`ESCALA 1:${N}  ·  vista de planta, Z hacia abajo`, bx + L * s + 6, by + 1.2);

  return { escala: N, bounds: b, cantidad: piezas.length };
}

/** Panel derecho: leyenda por capa y resúmenes del predio. Devuelve la Y final. */
export function dibujarLeyendaPredio(doc, piezasTodas, capasIncluidas, x0, y0, w, maxH) {
  const piezas = piezasTodas.filter(p => capasIncluidas.includes(capaDe(p)));
  let y = y0;
  const limite = y0 + maxH - 4;
  const titulo = t => {
    if (y > limite) return;
    doc.setFillColor(0, 0, 0); doc.rect(x0, y, w, 4.6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(255, 255, 255);
    doc.text(t, x0 + 1.5, y + 3.2);
    y += 8;
  };
  const fila = (izq, der = '', color, negrita = false) => {
    if (y > limite) return false;
    if (color) { doc.setFillColor(...color); doc.rect(x0 + 1, y - 2.2, 2.6, 2.6, 'F'); }
    doc.setFont('helvetica', negrita ? 'bold' : 'normal'); doc.setFontSize(6); doc.setTextColor(30, 30, 30);
    doc.text(izq, x0 + (color ? 5 : 1.5), y, { maxWidth: w - 22 });
    if (der) doc.text(der, x0 + w - 1.5, y, { align: 'right' });
    y += 3.6;
    return true;
  };
  const lista = (items, render, max = 8) => {
    items.slice(0, max).forEach(render);
    if (items.length > max) fila(`y ${items.length - max} más`, '');
  };

  titulo('LEYENDA POR CAPA');
  for (const c of capasPresentes(piezas)) fila(c.label, `${c.cantidad}`, rgb(c.color));
  const ocultas = capasPresentes(piezasTodas).filter(c => !capasIncluidas.includes(c.id));
  if (ocultas.length) fila(`No incluidas: ${ocultas.map(c => c.label).join(', ')}`);
  y += 1.5;

  const areas = piezas.filter(esArea).map(p => ({ p, m2: superficie(puntosAbs(p)) }));
  if (areas.length) {
    titulo('SUPERFICIES (BRUTAS)');
    lista(areas, a => fila(`${a.p.codigo ? `${a.p.codigo} ` : ''}${a.p.nombre}`, `${fmt(a.m2)} m²`, rgb(a.p.color)));
    // El límite de predio contiene a los demás sectores: no se suma con ellos.
    const sectores = areas.filter(a => a.p.uso !== 'predio');
    if (sectores.length > 1) fila('Suma de sectores (sin límite de predio)', `${fmt(sectores.reduce((s, a) => s + a.m2, 0))} m²`, null, true);
    y += 1.5;
  }

  const recs = piezas.filter(esRecorrido);
  if (recs.length) {
    titulo('RECORRIDOS');
    lista(recs, p => fila(`${p.codigo ? `${p.codigo} ` : ''}${p.nombre}`, `${fmt(largoPolilinea(puntosAbs(p)))} m${p.ancho ? ` × ${fmt(p.ancho)}` : ''}`, rgb(p.color)));
    y += 1.5;
  }

  const v = resumenVallado(piezas);
  if (v.cantidad) {
    titulo('VALLADO');
    for (const m of v.porModelo) fila(`${m.cantidad} × ${m.nombre}`, `${fmt(m.largoNominal)} m`);
    fila('Largo nominal', `${fmt(v.largoNominal)} m`, null, true);
    fila('Cobertura instalada', v.coberturaInstalada == null ? 'sin dato' : `${fmt(v.coberturaInstalada)} m`);
    y += 1.5;
  }

  const grupos = [...new Map(piezas.filter(p => p.grupo).map(p => [p.grupo.id, p.grupo])).values()];
  if (grupos.length) {
    titulo('TORRES (PIEZAS LAYHER)');
    lista(grupos, g => {
      const peso = piezas.filter(p => p.grupo?.id === g.id).reduce((s, p) => s + (p.peso ?? 0), 0);
      fila(`${g.codigo ?? ''} ${g.nombre}`, `${fmt(peso, 1)} kg`);
    });
    y += 1.5;
  }

  const sueltas = piezas.filter(p => esFestival(p) && !['rejaModular', 'valladoAntiavalancha'].includes(p._def?.familia));
  if (sueltas.length) {
    titulo('EQUIPOS Y ACCESOS');
    lista(sueltas, p => fila(`${p.codigo ?? ''} ${p._def?.nombre ?? p.nombre}`, p.peso == null ? 'peso s/d' : `${fmt(p.peso, 1)} kg`), 10);
    y += 1.5;
  }

  const r = resumenPeso(piezas);
  titulo('PESO');
  fila(r.completo ? 'Total' : 'Subtotal conocido', `${fmt(r.conocido, 1)} kg`, null, true);
  if (!r.completo) fila(`${r.sinDato} pieza(s) sin peso: no se informa total`);
  return y;
}
