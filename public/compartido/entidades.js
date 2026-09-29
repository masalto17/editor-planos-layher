// Geometría y cómputo de entidades de predio (piezas de festival, áreas, recorridos).
// Compartido entre el editor (src/) y el visor 3D (public/visualizador/): sin dependencias.
//
// Convenciones:
// - Piezas de festival: anclaje (x, y, z) en el centro de la huella; y = cota de apoyo.
//   rot en grados alrededor del eje Y. Eje local u (frente) = (cos, sin) en X-Z; w (fondo) = (-sin, cos).
// - Áreas y recorridos: `puntos` relativos al anclaje (x, z), así mover/copiar/deshacer
//   funcionan igual que con cualquier pieza.
// - Dato desconocido = null. Nunca se reemplaza por 0 en cómputos.

export const VERSION_DISENO = '2.1';

export const esFestival = p => p?.categoria === 'festival';
export const esArea = p => p?.categoria === 'area';
export const esRecorrido = p => p?.categoria === 'recorrido';
export const esTrazo = p => esArea(p) || esRecorrido(p);
// Áreas y recorridos no suman materiales ni peso.
export const computaMaterial = p => !esTrazo(p);

const CATS_TECNICA = new Set(['lineArray', 'pantallaLED', 'luz']);
export function capaDe(p) {
  if (p.capa) return p.capa;
  if (esFestival(p)) return p._def?.capa ?? 'publico';
  if (CATS_TECNICA.has(p.categoria)) return 'tecnica';
  return 'estructura';
}

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const r3 = v => Math.round(v * 1000) / 1000;
export const normRot = r => { const v = ((num(r) ?? 0) % 360 + 360) % 360; return Math.round(v * 100) / 100; };

export function dimsDe(p) {
  const base = p._def?.dimensiones ?? {};
  const inst = p._def?.parametrico ? (p.dims ?? {}) : {};
  const v = k => num(inst[k]) ?? num(base[k]);
  return { ancho: v('ancho'), alto: v('alto'), profundidad: v('profundidad') };
}

export function localAMundo(p, u, w) {
  const t = (num(p.rot) ?? 0) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  return { x: p.x + u * c - w * s, z: (p.z ?? 0) + u * s + w * c };
}

// Huella rectangular en planta. null si falta el ancho (volumen sin dimensiones).
export function huellaXZ(p) {
  const { ancho, profundidad } = dimsDe(p);
  if (ancho == null) return null;
  const hu = ancho / 2, hw = (profundidad ?? 0) / 2;
  return {
    puntos: [[-hu, -hw], [hu, -hw], [hu, hw], [-hu, hw]].map(([u, w]) => localAMundo(p, u, w)),
    profundidadConocida: profundidad != null,
  };
}

export const puntosAbs = p => (p.puntos ?? []).map(q => ({ x: p.x + q.x, z: (p.z ?? 0) + q.z }));

function cajaDe(pts) {
  return {
    xMin: Math.min(...pts.map(q => q.x)), xMax: Math.max(...pts.map(q => q.x)),
    zMin: Math.min(...pts.map(q => q.z)), zMax: Math.max(...pts.map(q => q.z)),
  };
}

export function boundsXZEntidad(p) {
  if (esTrazo(p)) { const pts = puntosAbs(p); return pts.length ? cajaDe(pts) : { xMin: p.x, xMax: p.x, zMin: p.z ?? 0, zMax: p.z ?? 0 }; }
  const h = huellaXZ(p);
  if (!h) return { xMin: p.x, xMax: p.x, zMin: p.z ?? 0, zMax: p.z ?? 0 };
  return cajaDe(h.puntos);
}

// Semi-extensiones proyectadas sobre X y Z según la rotación.
function extensiones(p) {
  const { ancho, profundidad } = dimsDe(p);
  const t = (num(p.rot) ?? 0) * Math.PI / 180;
  const hu = (ancho ?? 0) / 2, hw = (profundidad ?? 0) / 2;
  return { ex: Math.abs(hu * Math.cos(t)) + Math.abs(hw * Math.sin(t)), ez: Math.abs(hu * Math.sin(t)) + Math.abs(hw * Math.cos(t)) };
}

// Bounds en el alzado (plano X-Y).
export function boundsAlzadoEntidad(p) {
  const { alto } = dimsDe(p);
  const { ex } = extensiones(p);
  return { xMin: p.x - ex, xMax: p.x + ex, yMin: p.y ?? 0, yMax: (p.y ?? 0) + (alto ?? 0) };
}

// Una pieza de festival aparece en el alzado de la fila que corta su huella.
export function cruzaFilaEntidad(p, zFila) {
  if (esTrazo(p)) return false;
  const { ez } = extensiones(p);
  const z = p.z ?? 0;
  return zFila >= z - ez - 0.001 && zFila <= z + ez + 0.001;
}

export function superficie(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.z - b.x * a.z; }
  return Math.abs(s) / 2;
}

export function largoPolilinea(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  return l;
}

export function centroide(pts) {
  const n = pts.length || 1;
  return { x: pts.reduce((s, q) => s + q.x, 0) / n, z: pts.reduce((s, q) => s + q.z, 0) / n };
}

// Coloca módulos completos a lo largo de un recorrido. Nunca estira ni recorta:
// el tramo que no alcanza para un módulo se informa como remanente.
// El paso entre módulos es el ancho nominal; la separación real depende de la unión (pendiente).
export function valladoPorRecorrido(puntos, def) {
  const ancho = num(def?.dimensiones?.ancho);
  if (ancho == null || ancho <= 0) throw Error('La valla elegida no tiene ancho confirmado.');
  const modulos = [], remanentes = [];
  let largoRecorrido = 0;
  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1], b = puntos[i];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    if (L < 1e-6) continue;
    largoRecorrido += L;
    const ux = dx / L, uz = dz / L, rot = Math.atan2(dz, dx) * 180 / Math.PI;
    const n = Math.floor(L / ancho + 1e-9);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) * ancho;
      modulos.push({ x: r3(a.x + ux * t), z: r3(a.z + uz * t), rot: normRot(rot) });
    }
    const rem = L - n * ancho;
    if (rem > 1e-6) remanentes.push({ segmento: i, largo: r3(rem) });
  }
  return {
    modulos, cantidad: modulos.length,
    largoNominal: r3(modulos.length * ancho),
    largoRecorrido: r3(largoRecorrido),
    remanentes, remanenteTotal: r3(remanentes.reduce((s, r) => s + r.largo, 0)),
    giros: Math.max(0, puntos.length - 2),
  };
}

const FAMILIAS_VALLA = new Set(['valladoAntiavalancha', 'rejaModular']);
export const esValla = p => esFestival(p) && FAMILIAS_VALLA.has(p.familia ?? p._def?.familia);

// Largo nominal de vallas: suma de anchos de módulo. La cobertura instalada depende
// de la unión entre módulos y se informa aparte (null mientras la unión no esté definida).
export function resumenVallado(piezas) {
  const vallas = piezas.filter(esValla);
  const porModelo = {};
  for (const p of vallas) {
    const k = p.tipoId;
    porModelo[k] ??= { tipoId: k, nombre: p.nombre, cantidad: 0, largoNominal: 0 };
    porModelo[k].cantidad++;
    porModelo[k].largoNominal = r3(porModelo[k].largoNominal + (dimsDe(p).ancho ?? 0));
  }
  const pasoConocido = vallas.every(p => num(p._def?.conexion?.paso) != null);
  return {
    cantidad: vallas.length,
    largoNominal: r3(vallas.reduce((s, p) => s + (dimsDe(p).ancho ?? 0), 0)),
    coberturaInstalada: vallas.length && pasoConocido ? r3(vallas.reduce((s, p) => s + p._def.conexion.paso, 0)) : null,
    porModelo: Object.values(porModelo),
  };
}

// Peso con cobertura explícita: si falta algún dato, no hay total, solo subtotal conocido.
export function resumenPeso(piezas) {
  let conocido = 0;
  const sinDato = [];
  let cantidad = 0;
  for (const p of piezas) {
    if (!computaMaterial(p)) continue;
    cantidad++;
    if (num(p.peso) != null) conocido += p.peso; else sinDato.push(p);
  }
  conocido = Math.round(conocido * 10) / 10;
  const completo = sinDato.length === 0;
  return { conocido, total: completo ? conocido : null, completo, sinDato: sinDato.length, nombresSinDato: [...new Set(sinDato.map(p => p.nombre))], cantidad };
}

export function etiquetaPeso(r, dec = 1) {
  if (r.completo) return `${r.conocido.toFixed(dec)} kg`;
  return `${r.conocido.toFixed(dec)} kg conocidos · ${r.sinDato} sin dato`;
}

export function resumenTrazos(piezas) {
  return {
    areas: piezas.filter(esArea).map(p => ({ id: p.id, nombre: p.nombre, uso: p.uso, m2: Math.round(superficie(puntosAbs(p)) * 100) / 100 })),
    recorridos: piezas.filter(esRecorrido).map(p => ({ id: p.id, nombre: p.nombre, uso: p.uso, largo: r3(largoPolilinea(puntosAbs(p))), ancho: num(p.ancho) })),
  };
}

export function crearInstanciaFestival(def, { x, y = 0, z = 0, rot = 0 }, id) {
  return {
    id, tipoId: def.id, nombre: def.nombre, categoria: 'festival', familia: def.familia, tipoEntidad: 'pieza',
    x: r3(x), y: r3(y), z: r3(z), rot: normRot(rot), capa: def.capa,
    largo: def.dimensiones?.ancho ?? null, peso: def.peso ?? null,
    ref: def.modelo ?? def.id, color: def.color,
    // Copia de la definición: si el catálogo cambia, el proyecto guardado no se altera.
    _def: structuredClone(def),
  };
}

function relativos(puntos) {
  const o = puntos[0];
  return { x: r3(o.x), z: r3(o.z), puntos: puntos.map(q => ({ x: r3(q.x - o.x), z: r3(q.z - o.z) })) };
}

export function crearArea(puntos, uso, id) {
  if (puntos.length < 3) throw Error('Un área necesita al menos 3 vértices.');
  return { id, categoria: 'area', tipoEntidad: 'area', tipoId: 'AREA', nombre: uso.label, uso: uso.id, capa: uso.capa, color: uso.color, y: 0, ...relativos(puntos) };
}

export function crearRecorrido(puntos, uso, id, ancho = null) {
  if (puntos.length < 2) throw Error('Un recorrido necesita al menos 2 puntos.');
  return { id, categoria: 'recorrido', tipoEntidad: 'recorrido', tipoId: 'RECORRIDO', nombre: uso.label, uso: uso.id, capa: uso.capa, color: uso.color, ancho: num(ancho), y: 0, ...relativos(puntos) };
}

export function normalizarCapas(capas, ids) {
  const out = {};
  for (const id of ids) out[id] = { visible: capas?.[id]?.visible !== false, bloqueada: !!capas?.[id]?.bloqueada };
  return out;
}

// Proyectos guardados antes de 2.1 abren tal cual: solo se completa z=0 donde faltaba.
// No se reescribe ninguna propiedad existente.
export function migrarDiseno(doc) {
  if (!doc || !Array.isArray(doc.piezas)) throw Error('El archivo no contiene una lista de piezas.');
  return { ...doc, piezas: doc.piezas.map(p => ({ z: 0, ...p })) };
}
