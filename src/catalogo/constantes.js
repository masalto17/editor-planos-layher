export const MODULOS_STANDARD = [0.73, 1.09, 1.40, 1.57, 2.07, 2.57, 3.07];
export const ROSETA_STEP = 0.50;
export const SNAP_TOLERANCIA = 0.15;
export const SNAP_TOL_DIAGONAL = 0.30;
export const DRAG_UMBRAL_PX = 4;

// Categorías que se comportan como horizontal (línea entre orig y orig+largo a lo largo
// de un eje del piso). Cada pieza guarda además `orientacion: 'x' | 'z'` — 'x' corre a lo
// ancho del alzado, 'z' corre hacia el fondo (perpendicular al alzado).
export const ES_TIPO_HORIZONTAL = c => ['horizontalO', 'vigaPuente', 'horizontalU', 'plataforma', 'barandilla', 'rodapie'].includes(c);
export const ES_TIPO_VERTICAL = c => ['vertical', 'base'].includes(c);
export const TIENE_ORIENTACION = c => ES_TIPO_HORIZONTAL(c);

// Orden de dibujo (Z-order): primero lo de fondo, último lo de frente
export const Z_ORDER = { base: 0, vertical: 1, diagonal: 2, diagonalPlanta: 2, horizontalO: 3, vigaPuente: 4, horizontalU: 5, plataforma: 6, rodapie: 7, barandilla: 8 };
export const DESPIECE_ORDER = { vertical: 0, horizontalO: 1, vigaPuente: 2, horizontalU: 3, plataforma: 4, barandilla: 5, rodapie: 6, diagonal: 7, diagonalPlanta: 7.5, base: 8 };
