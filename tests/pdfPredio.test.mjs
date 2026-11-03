import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { definicionPorId, USOS_AREA } from '../src/catalogo/festival.js';
import { generarTorre } from '../src/catalogo/torres.js';
import { crearInstanciaFestival, crearArea, asignarCodigos } from '../public/compartido/entidades.js';
import { escalaPredio, capasPresentes, tienePredio, dibujarPlantaPredio, dibujarLeyendaPredio } from '../src/export/pdfPredio.js';

const { jsPDF } = createRequire(import.meta.url)('jspdf');
let n = 0;
const id = () => `p${n++}`;

test('Planta de predio: escala normalizada que hace entrar el predio', () => {
  assert.equal(escalaPredio({ xMin: 0, xMax: 80, zMin: 0, zMax: 60 }, 296, 233), 500);
  assert.equal(escalaPredio({ xMin: 0, xMax: 20, zMin: 0, zMax: 10 }, 296, 233), 100);
  assert.equal(escalaPredio({ xMin: 0, xMax: 400, zMin: 0, zMax: 300 }, 296, 233), 1500, '404 m en 296 mm pide 1:1.365');
});

test('Planta de predio: leyenda por capa y dibujo sin errores', () => {
  const piezas = asignarCodigos([], [
    crearArea([{ x: 0, z: 0 }, { x: 30, z: 0 }, { x: 30, z: 20 }], USOS_AREA.find(u => u.id === 'campo'), id()),
    crearInstanciaFestival(definicionPorId('GEN-HIM-200'), { x: 5, z: 5 }, id()),
    crearInstanciaFestival(definicionPorId('REJA-300'), { x: 10, z: 2 }, id()),
    ...generarTorre({ frente: 2.57, fondo: 1.57, alto: 6, x: 15, z: 10, grupoId: 'g', nuevoId: id }).piezas,
  ]);
  assert.ok(tienePredio(piezas));
  assert.ok(!tienePredio([{ id: 'v', categoria: 'vertical', x: 0, y: 0, z: 0, largo: 2 }]));
  const capas = capasPresentes(piezas);
  assert.deepEqual(capas.map(c => c.id), ['estructura', 'publico', 'energia']);
  assert.equal(capas.find(c => c.id === 'estructura').cantidad, 38, 'la torre es estructura');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const r = dibujarPlantaPredio(doc, piezas, capas.map(c => c.id), 12, 30, 312, 245);
  assert.equal(r.cantidad, piezas.length);
  assert.ok(dibujarLeyendaPredio(doc, piezas, ['publico'], 328, 30, 80, 245) > 30);
  const soloPublico = dibujarPlantaPredio(doc, piezas, ['publico'], 12, 30, 312, 245);
  assert.equal(soloPublico.cantidad, 2, 'las capas no incluidas no se dibujan');
});
