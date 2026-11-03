// Genera un predio de prueba con N instancias (por defecto 2.000) para medir rendimiento:
//   node scripts/generar-prueba-rendimiento.mjs salida.masalto.json 2000
// 80 % vallado (rejas y antiavalancha en filas de 150 m), 20 % torres Layher y 10 áreas.
import { definicionPorId, USOS_AREA } from '../src/catalogo/festival.js';
import { generarTorre } from '../src/catalogo/torres.js';
import { crearInstanciaFestival, valladoPorRecorrido, crearArea, asignarCodigos } from '../public/compartido/entidades.js';
import { writeFileSync } from 'node:fs';
let n = 0; const id = () => 'k' + n++; let piezas = [];
const N = Number(process.argv[3] || 2000);
const rj = definicionPorId('REJA-300'), aa = definicionPorId('VALL-AA-100-NEG');
let fila = 0;
while (piezas.length < N * 0.8) {
  const d = fila % 2 ? aa : rj;
  for (const m of valladoPorRecorrido([{ x: 0, z: fila * 3 }, { x: 150, z: fila * 3 }], d).modulos) piezas.push(crearInstanciaFestival(d, m, id()));
  fila++;
}
let t = 0;
while (piezas.length < N) { piezas.push(...generarTorre({ frente: 2.57, fondo: 1.57, alto: 8, x: 160 + (t % 5) * 5, z: Math.floor(t / 5) * 4, grupoId: id(), nuevoId: id }).piezas); t++; }
for (let i = 0; i < 10; i++) piezas.push(crearArea([{ x: i * 15, z: -20 }, { x: i * 15 + 12, z: -20 }, { x: i * 15 + 12, z: -8 }], USOS_AREA[i % USOS_AREA.length], id()));
piezas = asignarCodigos([], piezas);
writeFileSync(process.argv[2] ?? 'prueba-2000.masalto.json', JSON.stringify({ nombre: 'Prueba 2000', piezas, version: '2.1' }));
console.log(piezas.length);
