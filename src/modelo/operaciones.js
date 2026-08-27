import { ES_TIPO_VERTICAL, ES_TIPO_HORIZONTAL } from '../catalogo/constantes.js';

export const uid = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
export const roundTo = (v, step) => Math.round(v / step) * step;

// Modelo 3D: cada pieza vive en (x, y, z). x = ancho (común Alzado+Planta),
// y = altura (visible en Alzado), z = profundidad/fila (visible en Planta).
// Horizontales tienen `orientacion: 'x' | 'z'` que indica a qué eje se extienden.
// Diagonales de alzado guardan (x1,y1)-(x2,y2) a una única z.
// Diagonales de planta guardan (x1,z1)-(x2,z2) a una única y.

export const piezaMinX = p => {
  if (p.categoria === 'diagonal') return Math.min(p.x1, p.x2);
  if (p.categoria === 'diagonalPlanta') return Math.min(p.x1, p.x2);
  return p.x;
};
export const piezaMinY = p => {
  if (p.categoria === 'diagonal') return Math.min(p.y1, p.y2);
  return p.y;
};
export const piezaMinZ = p => {
  if (p.categoria === 'diagonalPlanta') return Math.min(p.z1, p.z2);
  return p.z ?? 0;
};

// Bounds en plano X-Y (Alzado). Sólo tiene sentido para piezas que se ven en el alzado
// de una fila dada — el filtro de fila es responsabilidad del caller.
export const piezaBounds = p => {
  if (p.categoria === 'diagonal') return { xMin: Math.min(p.x1, p.x2), xMax: Math.max(p.x1, p.x2), yMin: Math.min(p.y1, p.y2), yMax: Math.max(p.y1, p.y2) };
  if (p.categoria === 'diagonalPlanta') return { xMin: Math.min(p.x1, p.x2), xMax: Math.max(p.x1, p.x2), yMin: p.y, yMax: p.y };
  if (ES_TIPO_VERTICAL(p.categoria)) return { xMin: p.x, xMax: p.x, yMin: p.y, yMax: p.y + p.largo };
  if (ES_TIPO_HORIZONTAL(p.categoria)) {
    // orientacion='z' se ve en el alzado como un punto (perpendicular al plano).
    if (p.orientacion === 'z') return { xMin: p.x, xMax: p.x, yMin: p.y, yMax: p.y };
    return { xMin: p.x, xMax: p.x + p.largo, yMin: p.y, yMax: p.y };
  }
  return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
};

// Bounds en plano X-Z (Planta).
export const piezaBoundsXZ = p => {
  const z = p.z ?? 0;
  if (p.categoria === 'diagonal') { const xMin = Math.min(p.x1, p.x2), xMax = Math.max(p.x1, p.x2); return { xMin, xMax, zMin: z, zMax: z }; }
  if (p.categoria === 'diagonalPlanta') return { xMin: Math.min(p.x1, p.x2), xMax: Math.max(p.x1, p.x2), zMin: Math.min(p.z1, p.z2), zMax: Math.max(p.z1, p.z2) };
  if (ES_TIPO_VERTICAL(p.categoria)) return { xMin: p.x, xMax: p.x, zMin: z, zMax: z };
  if (ES_TIPO_HORIZONTAL(p.categoria)) {
    if (p.orientacion === 'z') return { xMin: p.x, xMax: p.x, zMin: z, zMax: z + p.largo };
    return { xMin: p.x, xMax: p.x + p.largo, zMin: z, zMax: z };
  }
  return { xMin: 0, xMax: 0, zMin: 0, zMax: 0 };
};

// Devuelve true si una horizontal orientada en Z cruza la fila Z=zFila. Para todo
// lo demás basta con p.z === zFila (verticales, diagonales alzado, horiz-x).
export const cruzaFilaZ = (p, zFila) => {
  if (ES_TIPO_HORIZONTAL(p.categoria) && p.orientacion === 'z') {
    const z0 = p.z ?? 0;
    return zFila >= z0 - 0.001 && zFila <= z0 + p.largo + 0.001;
  }
  return (p.z ?? 0) === zFila;
};

// Desplaza en los tres ejes. Diagonales mueven ambos extremos.
export const desplazarPieza = (p, dx = 0, dy = 0, dz = 0) => {
  if (p.categoria === 'diagonal') return { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy, z: (p.z ?? 0) + dz };
  if (p.categoria === 'diagonalPlanta') return { ...p, x1: p.x1 + dx, x2: p.x2 + dx, z1: p.z1 + dz, z2: p.z2 + dz, y: p.y + dy };
  return { ...p, x: p.x + dx, y: p.y + dy, z: (p.z ?? 0) + dz };
};
