// ============================================================
// Torres como conjuntos de piezas Layher reales (Fase 2 del catálogo festival).
// Una torre no es una pieza nueva: es un grupo de verticales, horizontales, diagonales
// y bases del catálogo F4-2018-SP, con su peso real. El grupo guarda uso, código y medidas
// para mostrarlo y seleccionarlo como una unidad; el despiece cuenta cada pieza.
//
// Ejes: frente sobre X, fondo sobre Z. (x, z) es la esquina de menor X y menor Z.
// ============================================================

import { CATALOGO } from './piezas.js';

export const USOS_TORRE = [
  { id: 'pa', label: 'Torre PA', prefijo: 'PA' },
  { id: 'delay', label: 'Torre delay', prefijo: 'DL' },
  { id: 'video', label: 'Torre de video', prefijo: 'VI' },
  { id: 'foh', label: 'Torre FOH', prefijo: 'FOH' },
  { id: 'iluminacion', label: 'Torre de iluminación', prefijo: 'IL' },
  { id: 'vigilancia', label: 'Torre de vigilancia', prefijo: 'VG' },
];

// Regla de armado de MasAlto (29/09/2026): diagonales en todos los pisos, en las 2 caras del
// lado largo (frente y contrafrente) o, a elección, en las 4 caras; sin diagonal de planta;
// sin plataforma, barandas ni rodapiés en el tope.
// Frente y fondo: cualquier horizontal O. Si una cara con diagonal no tiene diagonal de catálogo
// para su largo y alto de piso, se informa como faltante.
export const MEDIDAS_FONDO = CATALOGO.horizontalesO.map(h => h.largo);
export const MEDIDAS_TORRE = MEDIDAS_FONDO;
export const OPCIONES_DIAGONALES = [[2, '2 caras (lado largo)'], [4, '4 caras']];
export const ALTURA_PISO = 2.00;
export const ALTO_MIN = 2.00, ALTO_MAX = 16.00;

const r3 = v => Math.round(v * 1000) / 1000;
const cat = (key, pred) => CATALOGO[key]?.find(pred) ?? null;
const pieza = (c, categoria, extra) => ({
  tipoId: c.id, nombre: c.nombre, categoria, peso: c.peso, ref: c.ref, color: c.color, ...extra,
});

// Tramos de vertical para una altura: de mayor a menor largo de catálogo.
export function tramosVertical(alto) {
  const largos = CATALOGO.verticales.map(v => v.largo).sort((a, b) => b - a);
  const out = [];
  let resto = r3(alto);
  for (const l of largos) while (resto >= l - 1e-9) { out.push(l); resto = r3(resto - l); }
  if (resto > 1e-9) throw Error(`La altura ${alto} m no se arma con verticales de catálogo.`);
  return out;
}

// Niveles de horizontales: base, cada piso de 2,00 m y el tope.
export function nivelesTorre(alto) {
  const niveles = [];
  for (let y = 0; y < alto - 1e-9; y = r3(y + ALTURA_PISO)) niveles.push(y);
  niveles.push(r3(alto));
  return niveles;
}

export function generarTorre({ uso = 'pa', frente = 2.57, fondo = 1.57, alto = 6, diagonales = 2, x = 0, z = 0, grupoId, nuevoId }) {
  const u = USOS_TORRE.find(t => t.id === uso);
  if (!u) throw Error(`Uso de torre desconocido: ${uso}`);
  if (!MEDIDAS_FONDO.includes(frente) || !MEDIDAS_FONDO.includes(fondo)) throw Error('Frente y fondo deben ser largos de horizontal O de catálogo.');
  if (diagonales !== 2 && diagonales !== 4) throw Error('Las diagonales van en 2 o en 4 caras.');
  if (!(alto >= ALTO_MIN && alto <= ALTO_MAX) || Math.abs(alto * 2 - Math.round(alto * 2)) > 1e-9) throw Error('El alto va de 2,00 a 16,00 m en pasos de 0,50 m (rosetas).');

  const fmt = v => v.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const grupo = { id: grupoId, tipo: 'torre', uso: u.id, prefijo: u.prefijo, nombre: `${u.label} ${fmt(frente)} × ${fmt(fondo)} × ${fmt(alto)} m`, frente, fondo, alto, diagonales };
  const piezas = [], faltantes = [];
  const add = p => piezas.push({ id: nuevoId(), ...p, grupo });
  const x2 = r3(x + frente), z2 = r3(z + fondo);
  const columnas = [[x, z], [x2, z], [x, z2], [x2, z2]];

  // Bases y verticales
  const husillo = cat('bases', b => b.id === 'HUS060'), collarin = cat('collarines', c => c.id === 'CO');
  const tramos = tramosVertical(alto);
  for (const [cx, cz] of columnas) {
    add(pieza(husillo, 'base', { largo: husillo.largo, x: cx, y: 0, z: cz }));
    add(pieza(collarin, 'collarin', { largo: collarin.largo, x: cx, y: 0, z: cz }));
    let y = 0;
    for (const l of tramos) {
      add(pieza(cat('verticales', v => v.largo === l), 'vertical', { largo: l, x: cx, y, z: cz }));
      y = r3(y + l);
    }
  }

  // Horizontales O en cada nivel, en las cuatro caras
  const niveles = nivelesTorre(alto);
  const hoFrente = cat('horizontalesO', h => h.largo === frente), hoFondo = cat('horizontalesO', h => h.largo === fondo);
  for (const y of niveles) {
    for (const cz of [z, z2]) add(pieza(hoFrente, 'horizontalO', { largo: frente, x, y, z: cz, orientacion: 'x' }));
    for (const cx of [x, x2]) add(pieza(hoFondo, 'horizontalO', { largo: fondo, x: cx, y, z, orientacion: 'z' }));
  }

  // Diagonales en cada piso, alternando el sentido piso a piso. Con 2 caras van en el lado
  // largo: caras de frente (plano X-Y) o, si el fondo es más largo, caras laterales (plano X = x).
  const enFrente = diagonales === 4 || frente >= fondo;
  const enLateral = diagonales === 4 || fondo > frente;
  for (let i = 1; i < niveles.length; i++) {
    const y0 = niveles[i - 1], h = r3(niveles[i] - y0), sube = i % 2 === 1;
    const piso = `piso ${fmt(y0)}–${fmt(niveles[i])} m`;
    if (enFrente) {
      const d = cat('diagonales', q => q.ancho === frente && q.alto === h);
      if (d) for (const cz of [z, z2]) add(pieza(d, 'diagonal', { ancho: frente, alto: h, x1: x, y1: sube ? y0 : r3(y0 + h), x2, y2: sube ? r3(y0 + h) : y0, z: cz }));
      else faltantes.push(`Diagonal ${fmt(frente)} × ${fmt(h)} m (frente y contrafrente, ${piso}): no está en catálogo`);
    }
    if (enLateral) {
      const d = cat('diagonales', q => q.ancho === fondo && q.alto === h);
      if (d) for (const cx of [x, x2]) add(pieza(d, 'diagonalLateral', { ancho: fondo, alto: h, x: cx, y: y0, z, invertida: !sube }));
      else faltantes.push(`Diagonal ${fmt(fondo)} × ${fmt(h)} m (caras laterales, ${piso}): no está en catálogo`);
    }
  }

  return { piezas, faltantes, grupo };
}

// Resumen de conjuntos presentes en un diseño: una fila por grupo.
export function resumenConjuntos(piezas) {
  const g = new Map();
  for (const p of piezas) {
    if (!p.grupo) continue;
    const e = g.get(p.grupo.id) ?? { ...p.grupo, cantidad: 0, peso: 0, ids: [] };
    e.cantidad++; e.peso = r3(e.peso + (p.peso ?? 0)); e.ids.push(p.id);
    g.set(p.grupo.id, e);
  }
  return [...g.values()];
}
