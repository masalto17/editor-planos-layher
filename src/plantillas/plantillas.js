// ============================================================
// Plantillas predefinidas de estructuras comunes MásAlto
// Cada plantilla genera { nombre, piezas, filas } listo para
// cargar en el estado del diseño.
// ============================================================

import { CATALOGO } from '../catalogo/piezas.js';

let _uid = 0;
const uid = () => `tpl_${Date.now()}_${(_uid++).toString(36)}`;

// Helper: busca pieza en catálogo por id
const cat = (key, id) => {
  const arr = CATALOGO[key];
  if (!arr) return null;
  return arr.find(p => p.id === id) || null;
};

// Helper: crea pieza horizontal
const horiz = (catKey, catId, categoria, x, y, z, ori = 'x') => {
  const c = cat(catKey, catId);
  if (!c) return null;
  return { id: uid(), tipoId: c.id, nombre: c.nombre, categoria, largo: c.largo, peso: c.peso, ref: c.ref, color: c.color, x, y, z, orientacion: ori, ...(c.anchoPlat ? { anchoPlat: c.anchoPlat } : {}) };
};

// Helper: crea pieza vertical
const vert = (catId, x, y, z) => {
  const c = cat('verticales', catId);
  if (!c) return null;
  return { id: uid(), tipoId: c.id, nombre: c.nombre, categoria: 'vertical', largo: c.largo, peso: c.peso, ref: c.ref, color: c.color, x, y, z };
};

// Helper: base (husillo + collarín)
const base = (x, z) => {
  const hus = cat('bases', 'HUS060');
  const col = cat('collarines', 'CO');
  if (!hus || !col) return [];
  return [
    { id: uid(), tipoId: hus.id, nombre: hus.nombre, categoria: 'base', largo: hus.largo, peso: hus.peso, ref: hus.ref, color: hus.color, x, y: 0, z },
    { id: uid(), tipoId: col.id, nombre: col.nombre, categoria: 'collarin', largo: col.largo, peso: col.peso, ref: col.ref, color: col.color, x, y: 0, z },
  ];
};

// Helper: diagonal alzado
const diag = (x1, y1, x2, y2, z) => {
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  // Buscar diagonal más cercana
  let mejor = CATALOGO.diagonales[0], mejorScore = Infinity;
  CATALOGO.diagonales.forEach(d => {
    const score = Math.abs(d.ancho - dx) + Math.abs(d.alto - dy) * 1.2;
    if (score < mejorScore) { mejorScore = score; mejor = d; }
  });
  return { id: uid(), tipoId: mejor.id, nombre: mejor.nombre, categoria: 'diagonal', ancho: mejor.ancho, alto: mejor.alto, peso: mejor.peso, ref: mejor.ref, color: mejor.color, x1, y1, x2, y2, z };
};

// ─── PLANTILLA 1: Escenario básico ──────────────────────────
// 4 módulos × 2.57m = 10.28m ancho, 2m alto, 1 fila
export function escenarioBasico() {
  const piezas = [];
  const modulo = 2.57;
  const nMod = 4;
  const alto = 2.00;
  const z = 0;

  // Posiciones X de verticales
  const posX = [];
  for (let i = 0; i <= nMod; i++) posX.push(parseFloat((i * modulo).toFixed(3)));

  // Bases + collarines + verticales
  posX.forEach(x => {
    piezas.push(...base(x, z));
    piezas.push(vert('V200', x, 0, z));
  });

  // Horizontales O abajo y arriba
  for (let i = 0; i < nMod; i++) {
    const x = parseFloat((i * modulo).toFixed(3));
    piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', x, 0, z));
    piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', x, alto, z));
  }

  // Horizontal intermedia a 1.00m
  for (let i = 0; i < nMod; i++) {
    const x = parseFloat((i * modulo).toFixed(3));
    piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', x, 1.00, z));
  }

  // Vigas puente en el nivel superior
  for (let i = 0; i < nMod; i++) {
    const x = parseFloat((i * modulo).toFixed(3));
    piezas.push(horiz('vigasPuente', 'VP257', 'vigaPuente', x, alto, z));
  }

  // Plataformas 0.61m en el nivel superior
  for (let i = 0; i < nMod; i++) {
    const x = parseFloat((i * modulo).toFixed(3));
    piezas.push(horiz('plataformas', 'PL061_257', 'plataforma', x, alto, z));
  }

  // Barandillas perímetro a 1m sobre plataforma
  piezas.push(horiz('barandillas', 'BA257', 'barandilla', 0, alto + 1.0, z));
  piezas.push(horiz('barandillas', 'BA257', 'barandilla', modulo, alto + 1.0, z));
  piezas.push(horiz('barandillas', 'BA257', 'barandilla', modulo * 2, alto + 1.0, z));
  piezas.push(horiz('barandillas', 'BA257', 'barandilla', modulo * 3, alto + 1.0, z));

  // Rodapiés
  for (let i = 0; i < nMod; i++) {
    const x = parseFloat((i * modulo).toFixed(3));
    piezas.push(horiz('rodapies', 'RP257', 'rodapie', x, alto, z));
  }

  // 2 diagonales de arriostramiento
  piezas.push(diag(0, 0, modulo, alto, z));
  piezas.push(diag(modulo * 3, 0, modulo * 4, alto, z));

  return {
    nombre: 'Escenario básico 10.28m',
    descripcion: '4 módulos × 2.57m, altura 2m. Plataformas, barandillas y rodapiés incluidos.',
    icono: '🎤',
    piezas: piezas.filter(Boolean),
    filas: [{ id: 'A', nombre: 'A', z: 0 }],
  };
}

// ─── PLANTILLA 2: Torre PA / Delay ──────────────────────────
// 1.57m × 2.57m base, 6m alto (3 × V200)
export function torrePA() {
  const piezas = [];
  const z = 0;
  const ancho = 2.57;
  const prof = 1.57;
  const altPiso = 2.00;
  const nPisos = 3;

  // 4 columnas en esquinas (fila A, z=0)
  const esquinas = [[0, z], [ancho, z]];

  esquinas.forEach(([x, zz]) => {
    piezas.push(...base(x, zz));
    for (let piso = 0; piso < nPisos; piso++) {
      piezas.push(vert('V200', x, piso * altPiso, zz));
    }
  });

  // Fila B (z = 1.57)
  const z2 = prof;
  esquinas.forEach(([x]) => {
    piezas.push(...base(x, z2));
    for (let piso = 0; piso < nPisos; piso++) {
      piezas.push(vert('V200', x, piso * altPiso, z2));
    }
  });

  // Horizontales O en cada nivel (ambas filas)
  for (let piso = 0; piso <= nPisos; piso++) {
    const y = piso * altPiso;
    // Fila A (z=0): horizontal ancho
    piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', 0, y, z));
    // Fila B (z=prof): horizontal ancho
    piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', 0, y, z2));
    // Horizontales en profundidad (eje Z) en ambos extremos
    piezas.push(horiz('horizontalesO', 'HO157', 'horizontalO', 0, y, z, 'z'));
    piezas.push(horiz('horizontalesO', 'HO157', 'horizontalO', ancho, y, z, 'z'));
  }

  // Diagonal de arriostramiento en fila A
  piezas.push(diag(0, 0, ancho, altPiso, z));
  piezas.push(diag(0, altPiso * 2, ancho, altPiso * 3, z));

  // Vigas puente arriba
  piezas.push(horiz('vigasPuente', 'VP257', 'vigaPuente', 0, nPisos * altPiso, z));
  piezas.push(horiz('vigasPuente', 'VP257', 'vigaPuente', 0, nPisos * altPiso, z2));

  return {
    nombre: 'Torre PA 2.57×1.57m × 6m',
    descripcion: 'Torre de sonido/delay. 2 filas, 3 pisos de 2m. Lista para vigas IPN.',
    icono: '🔊',
    piezas: piezas.filter(Boolean),
    filas: [
      { id: 'A', nombre: 'A', z: 0 },
      { id: 'B', nombre: 'B', z: prof },
    ],
  };
}

// ─── PLANTILLA 3: Tribuna 3 niveles ─────────────────────────
// Gradas escalonadas: 3 niveles de 1m de alto, 2.57m de ancho cada uno
export function tribuna3Niveles() {
  const piezas = [];
  const z = 0;
  const modulo = 2.57;
  const nNiveles = 3;

  for (let nivel = 0; nivel < nNiveles; nivel++) {
    const xBase = nivel * modulo;
    const altBase = nivel * 1.00;
    const posXVerticals = [xBase, xBase + modulo];

    // Bases y verticales
    posXVerticals.forEach(x => {
      if (nivel === 0 || x === xBase) {
        piezas.push(...base(x, z));
      }
      // Altura del vertical: desde suelo (0) hasta nivel de piso
      const alturaVertical = altBase + 1.00;
      if (alturaVertical === 1.00) {
        piezas.push(vert('V100', x, 0, z));
      } else if (alturaVertical === 2.00) {
        piezas.push(vert('V200', x, 0, z));
      } else if (alturaVertical === 3.00) {
        piezas.push(vert('V300', x, 0, z));
      }
    });

    // Horizontal abajo
    piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', xBase, 0, z));

    // Horizontal en nivel de piso
    const yPiso = altBase + 1.00;
    piezas.push(horiz('horizontalesO', 'HO257', 'horizontalO', xBase, yPiso, z));

    // Viga puente en nivel de piso
    piezas.push(horiz('vigasPuente', 'VP257', 'vigaPuente', xBase, yPiso, z));

    // Plataforma
    piezas.push(horiz('plataformas', 'PL061_257', 'plataforma', xBase, yPiso, z));

    // Barandilla atrás del nivel más alto
    if (nivel === nNiveles - 1) {
      piezas.push(horiz('barandillas', 'BA257', 'barandilla', xBase, yPiso + 1.0, z));
    }

    // Rodapié
    piezas.push(horiz('rodapies', 'RP257', 'rodapie', xBase, yPiso, z));
  }

  // Barandilla costados
  const yMax = nNiveles * 1.00;
  // Vertical extra para barandilla del último nivel
  piezas.push(vert('V100', nNiveles * modulo, (nNiveles - 1) * 1.00 + 1.00, z));

  return {
    nombre: 'Tribuna 3 niveles',
    descripcion: 'Grada escalonada: 3 niveles de 1m, ancho total 7.71m. Barandillas incluidas.',
    icono: '🏟️',
    piezas: piezas.filter(Boolean),
    filas: [{ id: 'A', nombre: 'A', z: 0 }],
  };
}

export const PLANTILLAS = [
  { key: 'escenario', generar: escenarioBasico },
  { key: 'torre-pa', generar: torrePA },
  { key: 'tribuna', generar: tribuna3Niveles },
];
