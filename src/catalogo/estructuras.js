// ============================================================
// Estructuras generales como conjuntos de piezas Layher reales.
// Dos tipos:
//   1. Andamio (estructura de módulos sin piso): solo parantes, horizontales,
//      bases, collarines y diagonales.
//   2. Escenario (módulo con piso): parantes, horizontales, vigas puente,
//      stringers, fenólico, bases, collarines y diagonales.
//
// Reglas de diagonales de planta (manual de armado Layher):
//   - Andamio de fachada: 1 de cada 5 módulos; si hay plataformas con anti-levantamiento
//     en ese nivel, no hace falta (las plataformas rigidizan la planta).
//     Se coloca siempre en la base (replanteo) para asegurar escuadra.
//   - Torres independientes: en todas las caras y en toda su altura, alternando dirección.
//
// Tipos de diagonales de planta:
//   - De replanteo: sin cabezas cuña, se conectan por tetones en roseta del collarín.
//   - Estructurales con cabeza Allround: tienen cuña, se usan para niveles bajo carga.
//
// Ejes: X = ancho (frente), Z = profundidad, Y = alto.
// (x, z) es la esquina de menor X y menor Z del conjunto.
// ============================================================

import { CATALOGO, elegirDiagonalPlanta } from './piezas.js';

const r3 = v => Math.round(v * 1000) / 1000;
const cat = (key, pred) => CATALOGO[key]?.find(pred) ?? null;
const pieza = (c, categoria, extra) => ({
  tipoId: c.id, nombre: c.nombre, categoria, peso: c.peso, ref: c.ref, color: c.color, ...extra,
});

// Modulaciones disponibles = largos de horizontal O del catálogo.
export const MODULACIONES = CATALOGO.horizontalesO.map(h => h.largo);

// Alturas de piso que se pueden armar con verticales de catálogo (rosetas cada 0.50m).
export const ALTURAS_PISO = [0.50, 1.00, 1.50, 2.00];

// Máximos razonables.
export const MAX_MODULOS_ANCHO = 20;
export const MAX_MODULOS_PROFUNDIDAD = 10;
export const MAX_PISOS = 16;

// Tramos de vertical para una altura dada.
function tramosVertical(alto) {
  const largos = CATALOGO.verticales.map(v => v.largo).sort((a, b) => b - a);
  const out = [];
  let resto = r3(alto);
  for (const l of largos) while (resto >= l - 1e-9) { out.push(l); resto = r3(resto - l); }
  if (resto > 1e-9) return null;
  return out;
}

// Niveles Y donde van horizontales: suelo (0), cada piso, y el tope.
function nivelesHorizontales(altoTotal, alturaPiso) {
  const niveles = [];
  for (let y = 0; y < altoTotal - 1e-9; y = r3(y + alturaPiso)) niveles.push(y);
  niveles.push(r3(altoTotal));
  return niveles;
}

// ── Diagonales de fachada (alzado) ──────────────────────────
// Se colocan alternando sentido piso a piso en las caras largas (frente/contrafrente)
// y en las caras cortas (laterales), según la regla estándar.
function agregarDiagonalesFachada(piezas, faltantes, colXs, colZs, niveles, add) {
  const fmt = v => v.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  // Caras en X (frente/contrafrente): una diagonal por cada módulo de ancho, en cada piso.
  for (let i = 1; i < niveles.length; i++) {
    const y0 = niveles[i - 1], h = r3(niveles[i] - y0), sube = i % 2 === 1;
    for (let mx = 0; mx < colXs.length - 1; mx++) {
      const x1 = colXs[mx], x2 = colXs[mx + 1], ancho = r3(x2 - x1);
      const d = cat('diagonales', q => Math.abs(q.ancho - ancho) < 0.01 && Math.abs(q.alto - h) < 0.01);
      if (d) {
        // Frente (z mínimo) y contrafrente (z máximo).
        for (const cz of [colZs[0], colZs[colZs.length - 1]]) {
          add(pieza(d, 'diagonal', { ancho, alto: h, x1, y1: sube ? y0 : r3(y0 + h), x2, y2: sube ? r3(y0 + h) : y0, z: cz }));
        }
      } else {
        faltantes.push(`Diagonal ${fmt(ancho)} × ${fmt(h)} m (frente/contrafrente, piso ${fmt(y0)}–${fmt(niveles[i])} m): no está en catálogo`);
      }
    }
    // Caras laterales (en Z): una diagonal por cada módulo de profundidad.
    for (let mz = 0; mz < colZs.length - 1; mz++) {
      const z1 = colZs[mz], z2 = colZs[mz + 1], fondo = r3(z2 - z1);
      const d = cat('diagonales', q => Math.abs(q.ancho - fondo) < 0.01 && Math.abs(q.alto - h) < 0.01);
      if (d) {
        for (const cx of [colXs[0], colXs[colXs.length - 1]]) {
          add(pieza(d, 'diagonalLateral', { ancho: fondo, alto: h, x: cx, y: y0, z: z1, invertida: !sube }));
        }
      } else {
        faltantes.push(`Diagonal ${fmt(fondo)} × ${fmt(h)} m (laterales, piso ${fmt(y0)}–${fmt(niveles[i])} m): no está en catálogo`);
      }
    }
  }
}

// ── Diagonales de planta ────────────────────────────────────
// Regla andamio fachada: 1 de cada 5 módulos en X, siempre en la base (nivel 0).
// Si tienePlataformas en ese nivel, solo obligatoria en base.
// Regla estructura independiente: en todos los módulos, todos los niveles, alternando dirección.
function agregarDiagonalesPlanta(piezas, faltantes, colXs, colZs, niveles, tipo, add) {
  const fmt = v => v.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  if (tipo === 'andamio') {
    // Base (nivel 0) siempre, y luego 1 de cada 5 módulos en X en cada nivel sin plataforma.
    // Como el andamio no tiene plataformas, se aplican en todos los niveles con la regla 1/5.
    for (const y of niveles) {
      for (let mx = 0; mx < colXs.length - 1; mx++) {
        // En la base: todos los módulos; en niveles superiores: 1 de cada 5.
        const enBase = Math.abs(y) < 0.01;
        if (!enBase && mx % 5 !== 0) continue;
        for (let mz = 0; mz < colZs.length - 1; mz++) {
          const x1 = colXs[mx], z1 = colZs[mz];
          const x2 = colXs[mx + 1], z2 = colZs[mz + 1];
          const dx = r3(x2 - x1), dz = r3(z2 - z1);
          const dp = elegirDiagonalPlanta(dx, dz);
          if (dp) {
            // Alternar dirección según paridad del módulo.
            const invertir = (mx + mz) % 2 === 1;
            add(pieza(dp, 'diagonalPlanta', {
              largo: dp.largo,
              x1: invertir ? x2 : x1,
              z1: invertir ? z1 : z1,
              x2: invertir ? x1 : x2,
              z2: invertir ? z2 : z2,
              y,
              orientacion: 'planta',
            }));
          } else {
            faltantes.push(`Diagonal planta ${fmt(dx)} × ${fmt(dz)} m (nivel ${fmt(y)} m): no hay medida adecuada`);
          }
        }
      }
    }
  } else {
    // Escenario / estructura independiente: en todos los módulos de cada nivel, alternando.
    for (let ni = 0; ni < niveles.length; ni++) {
      const y = niveles[ni];
      for (let mx = 0; mx < colXs.length - 1; mx++) {
        for (let mz = 0; mz < colZs.length - 1; mz++) {
          const x1 = colXs[mx], z1 = colZs[mz];
          const x2 = colXs[mx + 1], z2 = colZs[mz + 1];
          const dx = r3(x2 - x1), dz = r3(z2 - z1);
          const dp = elegirDiagonalPlanta(dx, dz);
          if (dp) {
            const invertir = (mx + mz + ni) % 2 === 1;
            add(pieza(dp, 'diagonalPlanta', {
              largo: dp.largo,
              x1: invertir ? x2 : x1,
              z1: invertir ? z1 : z1,
              x2: invertir ? x1 : x2,
              z2: invertir ? z2 : z2,
              y,
              orientacion: 'planta',
            }));
          } else {
            faltantes.push(`Diagonal planta ${fmt(dx)} × ${fmt(dz)} m (nivel ${fmt(y)} m): no hay medida adecuada`);
          }
        }
      }
    }
  }
}

// ============================================================
// 1. ANDAMIO — estructura de módulos sin piso
// ============================================================
export function generarAndamio({
  modulacion = 2.57,
  modulosAncho = 3,
  modulosProfundidad = 1,
  pisos = 3,
  alturaPiso = 2.00,
  x = 0, z = 0,
  grupoId, nuevoId,
}) {
  if (!MODULACIONES.includes(modulacion)) throw Error(`Modulación ${modulacion} no disponible en catálogo.`);
  if (modulosAncho < 1 || modulosAncho > MAX_MODULOS_ANCHO) throw Error(`Módulos de ancho: 1 a ${MAX_MODULOS_ANCHO}.`);
  if (modulosProfundidad < 1 || modulosProfundidad > MAX_MODULOS_PROFUNDIDAD) throw Error(`Módulos de profundidad: 1 a ${MAX_MODULOS_PROFUNDIDAD}.`);
  if (pisos < 1 || pisos > MAX_PISOS) throw Error(`Pisos: 1 a ${MAX_PISOS}.`);
  if (!ALTURAS_PISO.includes(alturaPiso)) throw Error(`Altura de piso ${alturaPiso} m no disponible.`);

  const altoTotal = r3(pisos * alturaPiso);
  const tramos = tramosVertical(altoTotal);
  if (!tramos) throw Error(`La altura total ${altoTotal} m no se arma con verticales de catálogo.`);

  const anchoTotal = r3(modulosAncho * modulacion);
  const profTotal = r3(modulosProfundidad * modulacion);
  const fmt = v => v.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const grupo = {
    id: grupoId, tipo: 'andamio', prefijo: 'AN',
    nombre: `Andamio ${fmt(anchoTotal)} × ${fmt(profTotal)} × ${fmt(altoTotal)} m (${modulosAncho}×${modulosProfundidad}×${pisos} mód. ${fmt(modulacion)})`,
    modulacion, modulosAncho, modulosProfundidad, pisos, alturaPiso, altoTotal,
  };

  const piezas = [], faltantes = [];
  const add = p => piezas.push({ id: nuevoId(), ...p, grupo });

  // Posiciones de columnas.
  const colXs = Array.from({ length: modulosAncho + 1 }, (_, i) => r3(x + i * modulacion));
  const colZs = Array.from({ length: modulosProfundidad + 1 }, (_, i) => r3(z + i * modulacion));

  // Bases y verticales en cada intersección.
  const husillo = cat('bases', b => b.id === 'HUS060');
  const collarin = cat('collarines', c => c.id === 'CO');
  for (const cx of colXs) {
    for (const cz of colZs) {
      add(pieza(husillo, 'base', { largo: husillo.largo, x: cx, y: 0, z: cz }));
      add(pieza(collarin, 'collarin', { largo: collarin.largo, x: cx, y: 0, z: cz }));
      let y = 0;
      for (const l of tramos) {
        add(pieza(cat('verticales', v => v.largo === l), 'vertical', { largo: l, x: cx, y, z: cz }));
        y = r3(y + l);
      }
    }
  }

  // Horizontales O en cada nivel.
  const niveles = nivelesHorizontales(altoTotal, alturaPiso);
  const hoMod = cat('horizontalesO', h => Math.abs(h.largo - modulacion) < 0.01);
  for (const y of niveles) {
    // En X (frente/contrafrente y cada fila intermedia).
    for (let mx = 0; mx < colXs.length - 1; mx++) {
      for (const cz of colZs) {
        add(pieza(hoMod, 'horizontalO', { largo: modulacion, x: colXs[mx], y, z: cz, orientacion: 'x' }));
      }
    }
    // En Z (laterales y cada columna intermedia).
    for (let mz = 0; mz < colZs.length - 1; mz++) {
      for (const cx of colXs) {
        add(pieza(hoMod, 'horizontalO', { largo: modulacion, x: cx, y, z: colZs[mz], orientacion: 'z' }));
      }
    }
  }

  // Diagonales de fachada.
  agregarDiagonalesFachada(piezas, faltantes, colXs, colZs, niveles, add);

  // Diagonales de planta (regla andamio: 1/5 + siempre en base).
  agregarDiagonalesPlanta(piezas, faltantes, colXs, colZs, niveles, 'andamio', add);

  return { piezas, faltantes, grupo };
}

// ============================================================
// 2. ESCENARIO — módulo armado con piso completo
// ============================================================
export function generarEscenario({
  modulacion = 2.57,
  modulosAncho = 5,
  modulosProfundidad = 3,
  alturaPiso = 2.00,
  x = 0, z = 0,
  grupoId, nuevoId,
}) {
  if (!MODULACIONES.includes(modulacion)) throw Error(`Modulación ${modulacion} no disponible en catálogo.`);
  if (modulosAncho < 1 || modulosAncho > MAX_MODULOS_ANCHO) throw Error(`Módulos de ancho: 1 a ${MAX_MODULOS_ANCHO}.`);
  if (modulosProfundidad < 1 || modulosProfundidad > MAX_MODULOS_PROFUNDIDAD) throw Error(`Módulos de profundidad: 1 a ${MAX_MODULOS_PROFUNDIDAD}.`);
  if (!ALTURAS_PISO.includes(alturaPiso)) throw Error(`Altura de piso ${alturaPiso} m no disponible.`);

  const altoTotal = r3(alturaPiso);
  const tramos = tramosVertical(altoTotal);
  if (!tramos) throw Error(`La altura ${altoTotal} m no se arma con verticales de catálogo.`);

  const anchoTotal = r3(modulosAncho * modulacion);
  const profTotal = r3(modulosProfundidad * modulacion);
  const fmt = v => v.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const grupo = {
    id: grupoId, tipo: 'escenario', prefijo: 'ES',
    nombre: `Escenario ${fmt(anchoTotal)} × ${fmt(profTotal)} × ${fmt(altoTotal)} m (${modulosAncho}×${modulosProfundidad} mód. ${fmt(modulacion)})`,
    modulacion, modulosAncho, modulosProfundidad, alturaPiso, altoTotal,
  };

  const piezas = [], faltantes = [];
  const add = p => piezas.push({ id: nuevoId(), ...p, grupo });

  const colXs = Array.from({ length: modulosAncho + 1 }, (_, i) => r3(x + i * modulacion));
  const colZs = Array.from({ length: modulosProfundidad + 1 }, (_, i) => r3(z + i * modulacion));

  // Bases y verticales.
  const husillo = cat('bases', b => b.id === 'HUS060');
  const collarin = cat('collarines', c => c.id === 'CO');
  for (const cx of colXs) {
    for (const cz of colZs) {
      add(pieza(husillo, 'base', { largo: husillo.largo, x: cx, y: 0, z: cz }));
      add(pieza(collarin, 'collarin', { largo: collarin.largo, x: cx, y: 0, z: cz }));
      let y = 0;
      for (const l of tramos) {
        add(pieza(cat('verticales', v => v.largo === l), 'vertical', { largo: l, x: cx, y, z: cz }));
        y = r3(y + l);
      }
    }
  }

  // Horizontales O en suelo (y=0) y en el nivel del piso (y=altoTotal).
  const niveles = [0, altoTotal];
  const hoMod = cat('horizontalesO', h => Math.abs(h.largo - modulacion) < 0.01);
  for (const y of niveles) {
    for (let mx = 0; mx < colXs.length - 1; mx++) {
      for (const cz of colZs) {
        add(pieza(hoMod, 'horizontalO', { largo: modulacion, x: colXs[mx], y, z: cz, orientacion: 'x' }));
      }
    }
    for (let mz = 0; mz < colZs.length - 1; mz++) {
      for (const cx of colXs) {
        add(pieza(hoMod, 'horizontalO', { largo: modulacion, x: cx, y, z: colZs[mz], orientacion: 'z' }));
      }
    }
  }

  // Vigas puente U en el nivel del piso: van en X, en cada fila Z.
  const vp = cat('vigasPuente', v => Math.abs(v.largo - modulacion) < 0.01);
  if (vp) {
    for (let mx = 0; mx < colXs.length - 1; mx++) {
      for (const cz of colZs) {
        add(pieza(vp, 'vigaPuente', { largo: modulacion, x: colXs[mx], y: altoTotal, z: cz, orientacion: 'x' }));
      }
    }
  } else {
    faltantes.push(`Viga Puente U ${fmt(modulacion)} m: no está en catálogo`);
  }

  // Stringers perpendiculares a las vigas puente (orientación Z), separados ~0.60m.
  // Van sobre las vigas puente, cubriendo cada módulo de profundidad.
  const strMod = cat('stringers', s => Math.abs(s.largo - modulacion) < 0.01);
  if (strMod) {
    for (let mx = 0; mx < colXs.length - 1; mx++) {
      const xIni = colXs[mx], xFin = colXs[mx + 1];
      const anchoMod = r3(xFin - xIni);
      // Stringers separados ~0.60m dentro del módulo de ancho.
      const nStr = Math.max(2, Math.round(anchoMod / 0.60) + 1);
      const sepStr = anchoMod / (nStr - 1);
      for (let si = 0; si < nStr; si++) {
        const sx = r3(xIni + si * sepStr);
        for (let mz = 0; mz < colZs.length - 1; mz++) {
          add(pieza(strMod, 'stringer', { largo: modulacion, x: sx, y: altoTotal, z: colZs[mz], orientacion: 'z' }));
        }
      }
    }
  } else {
    faltantes.push(`Stringer ${fmt(modulacion)} m: no está en catálogo`);
  }

  // Fenólico cubriendo toda la superficie del piso.
  // Placa estándar 2.44 × 1.22m; se modulan para cubrir el total.
  const fen = CATALOGO.fenolicos[0];
  if (fen) {
    // Colocar placas en grilla, orientación larga en X.
    const fenLargo = fen.largo;       // 2.44m
    const fenAncho = fen.anchoPlat;   // 1.22m
    let fx = x;
    while (fx < x + anchoTotal - 0.01) {
      let fz = z;
      while (fz < z + profTotal - 0.01) {
        add(pieza(fen, 'fenolico', { largo: fenLargo, anchoPlat: fenAncho, x: fx, y: altoTotal, z: fz, orientacion: 'x' }));
        fz = r3(fz + fenAncho);
      }
      fx = r3(fx + fenLargo);
    }
  }

  // Diagonales de fachada (un solo piso).
  agregarDiagonalesFachada(piezas, faltantes, colXs, colZs, niveles, add);

  // Diagonales de planta (estructura independiente: todos los módulos, todos los niveles).
  agregarDiagonalesPlanta(piezas, faltantes, colXs, colZs, niveles, 'escenario', add);

  return { piezas, faltantes, grupo };
}
