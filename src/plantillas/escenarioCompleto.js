// ============================================================
// Plantilla: Escenario Completo 12.85m × 10.28m
// Boca: 12.85m (5 × 2.57m) — Profundidad: 10.28m (4 × 2.57m)
// Torres PA laterales 12m — Espalda 10m — Piso escenario 1.50m
// Techo 2 aguas sobre HU 1.09 a 8m en extremos
// ============================================================

import { CATALOGO } from '../catalogo/piezas.js';

let _uid = 0;
const uid = () => `esc_${Date.now()}_${(_uid++).toString(36)}`;

const cat = (key, id) => {
  const arr = CATALOGO[key];
  if (!arr) return null;
  return arr.find(p => p.id === id) || null;
};

const horiz = (catKey, catId, categoria, x, y, z, ori = 'x') => {
  const c = cat(catKey, catId);
  if (!c) return null;
  return { id: uid(), tipoId: c.id, nombre: c.nombre, categoria, largo: c.largo, peso: c.peso, ref: c.ref, color: c.color, x, y, z, orientacion: ori, ...(c.anchoPlat ? { anchoPlat: c.anchoPlat } : {}) };
};

const vert = (catId, x, y, z) => {
  const c = cat('verticales', catId);
  if (!c) return null;
  return { id: uid(), tipoId: c.id, nombre: c.nombre, categoria: 'vertical', largo: c.largo, peso: c.peso, ref: c.ref, color: c.color, x, y, z };
};

const base080 = (x, z) => {
  const hus = cat('bases', 'HUS080');
  const col = cat('collarines', 'CO');
  if (!hus || !col) return [];
  return [
    { id: uid(), tipoId: hus.id, nombre: hus.nombre, categoria: 'base', largo: hus.largo, peso: hus.peso, ref: hus.ref, color: hus.color, x, y: 0, z },
    { id: uid(), tipoId: col.id, nombre: col.nombre, categoria: 'collarin', largo: col.largo, peso: col.peso, ref: col.ref, color: col.color, x, y: 0, z },
  ];
};

const diag = (x1, y1, x2, y2, z) => {
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  let mejor = CATALOGO.diagonales[0], mejorScore = Infinity;
  CATALOGO.diagonales.forEach(d => {
    const score = Math.abs(d.ancho - dx) + Math.abs(d.alto - dy) * 1.2;
    if (score < mejorScore) { mejorScore = score; mejor = d; }
  });
  return { id: uid(), tipoId: mejor.id, nombre: mejor.nombre, categoria: 'diagonal', ancho: mejor.ancho, alto: mejor.alto, peso: mejor.peso, ref: mejor.ref, color: mejor.color, x1, y1, x2, y2, z };
};

export function escenarioCompleto() {
  const piezas = [];
  const MOD = 2.57;
  const nModX = 5;   // 5 × 2.57 = 12.85m
  const nModZ = 4;   // 4 × 2.57 = 10.28m

  // Posiciones X de ejes verticales (6 ejes: 0.00, 2.57, 5.14, 7.71, 10.28, 12.85)
  const ejX = [];
  for (let i = 0; i <= nModX; i++) ejX.push(parseFloat((i * MOD).toFixed(3)));

  // Posiciones Z de filas (5 filas: A=0, B=2.57, C=5.14, D=7.71, E=10.28)
  const ejZ = [];
  for (let i = 0; i <= nModZ; i++) ejZ.push(parseFloat((i * MOD).toFixed(3)));

  const FILAS = ejZ.map((z, i) => ({ id: String.fromCharCode(65 + i), nombre: String.fromCharCode(65 + i), z }));

  // ═══════════════════════════════════════
  // PISO DE ESCENARIO (altura 1.50m)
  // ═══════════════════════════════════════
  const PISO_H = 1.50;

  // Bases 0.80 + collarín + vertical 1.50m en TODAS las intersecciones
  for (const x of ejX) {
    for (const z of ejZ) {
      piezas.push(...base080(x, z));
      piezas.push(vert('V150', x, 0, z));
    }
  }

  // Vigas puente en el nivel de piso (eje X) — todas las filas
  for (const z of ejZ) {
    for (let i = 0; i < nModX; i++) {
      piezas.push(horiz('vigasPuente', 'VP257', 'vigaPuente', ejX[i], PISO_H, z));
    }
  }

  // Horizontales en profundidad (eje Z) a nivel piso
  for (const x of ejX) {
    for (let j = 0; j < nModZ; j++) {
      piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', x, PISO_H, ejZ[j], 'z'));
    }
  }

  // Horizontales O a nivel suelo (eje X) — arriostramiento inferior — todas las filas
  for (const z of ejZ) {
    for (let i = 0; i < nModX; i++) {
      piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', ejX[i], 0, z));
    }
  }

  // Horizontales O a nivel suelo en profundidad (eje Z)
  for (const x of ejX) {
    for (let j = 0; j < nModZ; j++) {
      piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', x, 0, ejZ[j], 'z'));
    }
  }

  // Plataformas 0.61 × 2.57 cubriendo toda la superficie del piso
  // En cada módulo X, colocar plataformas en cada fila Z
  // Ancho plataforma 0.61m → caben ~4 por módulo de 2.57m en Z (4 × 0.61 = 2.44 ≈ 2.57)
  // Simplificamos: 1 plataforma por módulo X por fila (el editor la dibuja como rectángulo)
  for (let i = 0; i < nModX; i++) {
    for (const z of ejZ) {
      piezas.push(horiz('plataformas', 'PL061_257', 'plataforma', ejX[i], PISO_H, z));
    }
  }

  // Diagonales de arriostramiento bajo piso (cada fila, extremos)
  for (const z of ejZ) {
    piezas.push(diag(ejX[0], 0, ejX[1], PISO_H, z));
    piezas.push(diag(ejX[nModX - 1], 0, ejX[nModX], PISO_H, z));
  }

  // ═══════════════════════════════════════
  // TORRES PA LATERALES (ejes 1 y 6) — 12m
  // ═══════════════════════════════════════
  const TORRE_H = 12.00;
  const torreEjes = [ejX[0], ejX[nModX]]; // X=0 y X=12.85

  // Verticales apiladas hasta 12m (1.50 + 3×2.00 + 2×2.00 + 0.50 = ... usamos V200 y V400)
  // Desde piso 1.50m: 1.50 + 2.00 + 2.00 + 2.00 + 2.00 + 2.00 + 0.50 = 12.00m
  // Simplificado: V200 apilados desde nivel de piso
  for (const tX of torreEjes) {
    for (const z of ejZ) {
      // Ya tenemos V150 de 0 a 1.50. Apilar V200 de 1.50 a 11.50, luego V050 de 11.50 a 12.00
      // 1.50 + 5×2.00 = 11.50 + 0.50 = 12.00
      for (let piso = 0; piso < 5; piso++) {
        const yBase = PISO_H + piso * 2.00;
        piezas.push(vert('V200', tX, yBase, z));
      }
      piezas.push(vert('V050', tX, 11.50, z));
    }
  }

  // Horizontales O en torres cada 2m (eje X entre filas A-E, y eje Z entre ejes de torre)
  const alturasHorizTorre = [2.00, 4.00, 6.00, 8.00, 10.00, 12.00];
  for (const tX of torreEjes) {
    for (const y of alturasHorizTorre) {
      // Horizontales en Z (profundidad) conectando filas
      for (let j = 0; j < nModZ; j++) {
        piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', tX, y, ejZ[j], 'z'));
      }
    }
  }

  // Horizontales O a lo ancho en torres (primer y último módulo) cada 2m
  for (const z of ejZ) {
    for (const y of alturasHorizTorre) {
      // Módulo izquierdo (eje 1 a 2)
      piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', ejX[0], y, z));
      // Módulo derecho (eje 5 a 6)
      piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', ejX[nModX - 1], y, z));
    }
  }

  // Diagonales de arriostramiento torres cada 2 pisos (4m)
  for (const tX of torreEjes) {
    for (const z of ejZ) {
      // Diagonal de 2.00 a 4.00
      piezas.push(diag(tX, 2.00, tX === ejX[0] ? tX + MOD : tX - MOD, 4.00, z));
      // Diagonal de 6.00 a 8.00
      piezas.push(diag(tX, 6.00, tX === ejX[0] ? tX + MOD : tX - MOD, 8.00, z));
      // Diagonal de 10.00 a 12.00
      piezas.push(diag(tX, 10.00, tX === ejX[0] ? tX + MOD : tX - MOD, 12.00, z));
    }
  }

  // ═══════════════════════════════════════
  // ESPALDA (BACKWALL) — Fila E — 10m
  // ═══════════════════════════════════════
  const ESPALDA_H = 10.00;
  const zEspalda = ejZ[nModZ]; // fila E

  // Verticales apiladas en fila E (ejes interiores 2-5) hasta 10m
  // Ya tenemos V150 (0-1.50). Apilar V200 hasta 9.50, luego V050
  // 1.50 + 4×2.00 = 9.50 + 0.50 = 10.00
  for (let i = 1; i < nModX; i++) { // ejes 2,3,4,5 (interiores)
    for (let piso = 0; piso < 4; piso++) {
      piezas.push(vert('V200', ejX[i], PISO_H + piso * 2.00, zEspalda));
    }
    piezas.push(vert('V050', ejX[i], 9.50, zEspalda));
  }

  // Horizontales O espalda cada 2m
  const alturasEspalda = [2.00, 4.00, 6.00, 8.00, 10.00];
  for (const y of alturasEspalda) {
    for (let i = 0; i < nModX; i++) {
      piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', ejX[i], y, zEspalda));
    }
  }

  // Diagonales espalda
  for (let i = 1; i < nModX - 1; i += 2) {
    piezas.push(diag(ejX[i], 2.00, ejX[i + 1], 4.00, zEspalda));
    piezas.push(diag(ejX[i], 6.00, ejX[i + 1], 8.00, zEspalda));
  }

  // ═══════════════════════════════════════
  // HORIZONTALES INTERMEDIAS (conectan torres con espalda)
  // ═══════════════════════════════════════
  // Horizontales a lo ancho (eje X) en filas intermedias B,C,D a alturas intermedias
  const filasInteriores = ejZ.slice(1, -1); // B, C, D
  const alturasInterm = [2.00, 4.00, 6.00, 8.00];

  for (const z of filasInteriores) {
    for (const y of alturasInterm) {
      // Módulos interiores (ejes 2-5) — solo horizontal de conexión
      for (let i = 0; i < nModX; i++) {
        piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', ejX[i], y, z));
      }
    }
    // Verticales interiores hasta la altura que corresponda según posición
    // Filas B,C,D interiores: verticales solo hasta 8m para soporte de techo
    for (let i = 1; i < nModX; i++) {
      // V200 apilados: 1.50 + 3×2.00 = 7.50 + V050 = 8.00
      for (let piso = 0; piso < 3; piso++) {
        piezas.push(vert('V200', ejX[i], PISO_H + piso * 2.00, z));
      }
      piezas.push(vert('V050', ejX[i], 7.50, z));
    }
  }

  // Horizontales en profundidad (Z) a alturas intermedias para ejes interiores
  for (let i = 1; i < nModX; i++) {
    for (const y of alturasInterm) {
      for (let j = 0; j < nModZ; j++) {
        piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', ejX[i], y, ejZ[j], 'z'));
      }
    }
  }

  // ═══════════════════════════════════════
  // APOYO DE TECHO — HU 1.09 + collarín + diagonal en extremos a 8m
  // ═══════════════════════════════════════
  // 4 apoyos en los extremos: (eje 1, fila A), (eje 6, fila A), (eje 1, fila E), (eje 6, fila E)
  const apoyosTecho = [
    { x: ejX[0], z: ejZ[0] },
    { x: ejX[nModX], z: ejZ[0] },
    { x: ejX[0], z: ejZ[nModZ] },
    { x: ejX[nModX], z: ejZ[nModZ] },
  ];

  for (const ap of apoyosTecho) {
    // HU 1.09 vertical (como soporte de techo, orientación X)
    piezas.push(horiz('horizontalesU', 'HU109', 'horizontalU', ap.x, 8.00, ap.z));
    // Collarín en la unión
    const col = cat('collarines', 'CO');
    if (col) {
      piezas.push({ id: uid(), tipoId: col.id, nombre: col.nombre, categoria: 'collarin', largo: col.largo, peso: col.peso, ref: col.ref, color: col.color, x: ap.x, y: 8.00, z: ap.z });
    }
  }

  // ═══════════════════════════════════════
  // BARANDILLAS perímetro del piso de escenario
  // ═══════════════════════════════════════
  const BARAN_H = PISO_H + 1.00; // 2.50m

  // Frente (fila A) — barandilla
  for (let i = 0; i < nModX; i++) {
    piezas.push(horiz('barandillas', 'BA257', 'barandilla', ejX[i], BARAN_H, ejZ[0]));
  }
  // Laterales
  for (let j = 0; j < nModZ; j++) {
    piezas.push(horiz('barandillas', 'BA257', 'barandilla', ejX[0], BARAN_H, ejZ[j], 'z'));
    piezas.push(horiz('barandillas', 'BA257', 'barandilla', ejX[nModX], BARAN_H, ejZ[j], 'z'));
  }
  // Espalda
  for (let i = 0; i < nModX; i++) {
    piezas.push(horiz('barandillas', 'BA257', 'barandilla', ejX[i], BARAN_H, zEspalda));
  }

  // Rodapiés en perímetro del piso
  for (let i = 0; i < nModX; i++) {
    piezas.push(horiz('rodapies', 'RP257', 'rodapie', ejX[i], PISO_H, ejZ[0]));
    piezas.push(horiz('rodapies', 'RP257', 'rodapie', ejX[i], PISO_H, zEspalda));
  }
  for (let j = 0; j < nModZ; j++) {
    piezas.push(horiz('rodapies', 'RP257', 'rodapie', ejX[0], PISO_H, ejZ[j], 'z'));
    piezas.push(horiz('rodapies', 'RP257', 'rodapie', ejX[nModX], PISO_H, ejZ[j], 'z'));
  }

  return {
    nombre: 'Escenario completo 12.85×10.28m',
    descripcion: 'Escenario profesional: boca 12.85m, prof 10.28m, torres PA 12m, espalda 10m, piso 1.50m, apoyos techo 8m. 5 filas A-E.',
    icono: '🎪',
    piezas: piezas.filter(Boolean),
    filas: FILAS,
  };
}
