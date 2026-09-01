export const MODULOS_STANDARD = [0.73, 1.09, 1.40, 1.57, 2.07, 2.57, 3.07];
export const ROSETA_STEP = 0.50;
export const SNAP_TOLERANCIA = 0.15;
export const SNAP_TOL_DIAGONAL = 0.30;
export const DRAG_UMBRAL_PX = 4;

// Categorías que se comportan como horizontal (línea entre orig y orig+largo a lo largo
// de un eje del piso). Cada pieza guarda además `orientacion: 'x' | 'z'` — 'x' corre a lo
// ancho del alzado, 'z' corre hacia el fondo (perpendicular al alzado).
const HORIZONTAL_CATS = new Set([
  'horizontalO', 'vigaPuente', 'horizontalU', 'plataforma', 'barandilla', 'rodapie',
  'vigaIPN', 'celosia', 'truss', 'techo',
]);
export const ES_TIPO_HORIZONTAL = c => HORIZONTAL_CATS.has(c);
export const ES_TIPO_VERTICAL = c => c === 'vertical' || c === 'base' || c === 'collarin';
export const TIENE_ORIENTACION = c => ES_TIPO_HORIZONTAL(c);

// Orden de dibujo (Z-order): primero lo de fondo, último lo de frente
export const Z_ORDER = {
  base: 0, collarin: 0.5, vertical: 1, diagonal: 2, diagonalPlanta: 2,
  horizontalO: 3, vigaIPN: 3.5, celosia: 3.5, truss: 3.5,
  vigaPuente: 4, horizontalU: 5,
  plataforma: 6, rodapie: 7, barandilla: 8,
  cumbrera: 9, techo: 9.5,
};

export const DESPIECE_ORDER = {
  base: 0, collarin: 1, vertical: 2, horizontalO: 3, vigaPuente: 4, horizontalU: 5,
  plataforma: 6, barandilla: 7, rodapie: 8,
  diagonal: 9, diagonalPlanta: 9.5,
  celosia: 10, cumbrera: 10.5, techo: 10.7, truss: 11, vigaIPN: 12,
};
