import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { convertirAPiezaCatalogo, validarPiezaImportada } from '../src/catalogo/importador.js';
import { datosImportados } from '../src/modelo/datosImportados.js';
import { serializarDiseno } from '../src/export/visualizador.js';
import { parseDesign } from '../public/visualizador/model.mjs';

const fixture = name => JSON.parse(readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8'));

for (const name of ['EXT_PIEZA_LED_P4.masalto-pieza.json', 'EXT_PIEZA_BIN1000LTS.masalto-pieza.json']) {
  test(`Definición íntegra al importar, colocar y transferir: ${name}`, () => {
    const original = fixture(name);
    const before = structuredClone(original);
    assert.deepEqual(validarPiezaImportada(original), []);
    const catalogo = convertirAPiezaCatalogo(original);
    const placed = { id: 'prueba', categoria: 'importada', nombre: catalogo.nombre,
      x: 1, y: 2, z: 3, largo: catalogo.largo, peso: catalogo.peso, ...datosImportados(catalogo) };
    const saved = JSON.parse(serializarDiseno({ nombreDiseno: 'Prueba', piezas: [placed], filas: [] }));
    assert.deepEqual(saved.piezas[0]._definicion, original);
    const parsed = parseDesign(JSON.stringify(saved));
    assert.equal(parsed.items.length, 1);
    assert.equal(parsed.items[0].rendered, true);
    assert.equal(parsed.items[0].representation, 'envelope');
    assert.equal(parsed.weight, original.despiece.pesoKg);
    assert.ok(parsed.issues.length > 0);
    placed._definicion.dimensiones.profundidad = 999;
    assert.deepEqual(catalogo._definicion, before);
    assert.deepEqual(original, before);
  });
}

for (const name of ['1285 mts con techo pantalla cc.masalto.json', 'Escenario 1285.masalto.json']) {
  test(`Diseño anterior conserva todos sus datos: ${name}`, () => {
    const original = fixture(name);
    const before = structuredClone(original);
    const text = serializarDiseno({nombreDiseno: original.nombre, piezas: original.piezas, filas: original.filas});
    const saved = JSON.parse(text);
    assert.deepEqual(saved.piezas, original.piezas);
    assert.deepEqual(saved.filas, original.filas);
    assert.deepEqual(original, before);
    const parsed = parseDesign(text);
    assert.equal(parsed.items.length, original.piezas.length);
    const weight = original.piezas.reduce((sum, piece) => sum + piece.peso, 0);
    assert.ok(Math.abs(parsed.weight - weight) < 1e-7);
    for (const item of parsed.items.filter(item => item.raw._importada)) {
      assert.equal(item.rendered, true);
      assert.equal(item.representation, 'outline');
    }
    console.log(`${name}: ${parsed.items.filter(item => item.rendered).length}/${parsed.items.length} representadas; ${weight.toFixed(1)} kg`);
  });
}

test('No inventar definiciones ausentes en piezas antiguas', () => {
  const old = { _importada: true, _visual: [], _verificacion: 'pendienteVerificacion' };
  assert.equal(datosImportados(old)._definicion, undefined);
  assert.deepEqual(datosImportados({}), {});
});

test('Rechazar formatos incorrectos', () => {
  assert.throws(() => parseDesign('{'));
  assert.throws(() => parseDesign(JSON.stringify(fixture('EXT_PIEZA_LED_P4.masalto-pieza.json'))));
  assert.throws(() => serializarDiseno({piezas: null}));
});
