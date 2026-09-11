import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseDesign } from './model.mjs';

const example = parseDesign(await readFile(new URL('./ejemplo.masalto.json', import.meta.url), 'utf8'));

assert.equal(example.items.length, 223);
assert.equal(example.items.filter((item) => item.rendered).length, 223);
assert.equal(example.issues.filter((issue) => issue.includes('sin representación')).length, 0);
assert.ok(example.primitives.length > 500);
assert.ok(example.max[0] - example.min[0] > 10);
assert.ok(example.max[1] - example.min[1] > 5);
assert.ok(example.max[2] - example.min[2] >= 0);
assert.equal(Number(example.weight.toFixed(2)), 2612.9);

const zPlan = parseDesign(JSON.stringify({
  nombre: 'Orientacion Z',
  piezas: [{ categoria: 'horizontalO', nombre: 'Horizontal Z', ref: 'test', x: 1, y: 2, z: 3, largo: 2.57, orientacion: 'z', peso: 1 }],
}));
const segment = zPlan.primitives.find((p) => p.type === 'line');
assert.deepEqual(segment.a, [1, 2, 3]);
assert.deepEqual(segment.b, [1, 2, 5.57]);

const diagonal = parseDesign(JSON.stringify({
  piezas: [
    { categoria: 'diagonal', nombre: 'Diagonal alzado', x1: 0, y1: 0, x2: 2, y2: 1, z: 4, peso: 1 },
    { categoria: 'diagonalPlanta', nombre: 'Diagonal planta', x1: 0, z1: 0, x2: 2, z2: 1, y: 3, peso: 1 },
  ],
}));
assert.deepEqual(diagonal.primitives[0].a, [0, 0, 4]);
assert.deepEqual(diagonal.primitives[0].b, [2, 1, 4]);
assert.deepEqual(diagonal.primitives[1].a, [0, 3, 0]);
assert.deepEqual(diagonal.primitives[1].b, [2, 3, 1]);

const unsupported = parseDesign(JSON.stringify({
  piezas: [{ categoria: 'piezaNueva', nombre: 'Importada A', ref: 'x', _importada: true, x: 0, y: 0, z: 0, largo: 1, peso: 1 }],
}));
assert.equal(unsupported.items[0].rendered, false);
assert.equal(unsupported.primitives.length, 0);
assert.match(unsupported.issues[0], /sin representación/);

assert.throws(() => parseDesign('{"piezas":[{"categoria":"vertical","x":0,"y":0,"z":0,"largo":-1}]}'), /Largo fuera/);
assert.throws(() => parseDesign('{"nombre":"sin piezas"}'), /lista de piezas/);
assert.throws(() => parseDesign('no json'), /JSON válido/);

console.log('Pruebas del visor OK');
