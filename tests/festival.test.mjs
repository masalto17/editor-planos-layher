import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFINICIONES_FESTIVAL, definicionPorId, USOS_AREA, USOS_RECORRIDO } from '../src/catalogo/festival.js';
import {
  crearInstanciaFestival, crearArea, crearRecorrido, dimsDe, huellaXZ, boundsXZEntidad, boundsAlzadoEntidad,
  cruzaFilaEntidad, valladoPorRecorrido, resumenVallado, resumenPeso, resumenTrazos, superficie, puntosAbs,
  migrarDiseno, normRot,
} from '../public/compartido/entidades.js';

const fixture = name => JSON.parse(readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8'));
const def = id => definicionPorId(id);
let n = 0;
const inst = (id, pos = {}) => crearInstanciaFestival(def(id), { x: 0, z: 0, ...pos }, `t${n++}`);

test('Definiciones: ids únicos, estados válidos y ningún peso o medida inventada como 0', () => {
  const ids = DEFINICIONES_FESTIVAL.map(d => d.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const d of DEFINICIONES_FESTIVAL) {
    assert.ok(['esquematico', 'pendienteReferencia', 'validado', 'archivado'].includes(d.estado), d.id);
    assert.notEqual(d.peso, 0, `${d.id}: peso desconocido debe ser null`);
    for (const v of Object.values(d.dimensiones)) assert.ok(v === null || v > 0, `${d.id}: medida inválida`);
  }
});

test('Vallado antiavalancha: 1,00 × 1,25 m, negro y plateado con la misma geometría', () => {
  const neg = inst('VALL-AA-100-NEG'), pla = inst('VALL-AA-100-PLA');
  assert.deepEqual(dimsDe(neg), { ancho: 1, alto: 1.25, profundidad: 1.2 });
  assert.deepEqual(dimsDe(pla), dimsDe(neg));
  assert.notEqual(neg._def.acabado, pla._def.acabado);
  assert.equal(neg.peso, null);
});

test('Rejas: variantes 3,00 × 1,20 y 2,50 × 1,25 diferenciadas y sin escalado libre', () => {
  const r3 = inst('REJA-300'), r25 = inst('REJA-250');
  assert.deepEqual(dimsDe(r3), { ancho: 3, alto: 1.2, profundidad: null });
  assert.deepEqual(dimsDe(r25), { ancho: 2.5, alto: 1.25, profundidad: null });
  const estirada = { ...r3, dims: { ancho: 3.4 } };
  assert.equal(dimsDe(estirada).ancho, 3, 'una variante fija ignora medidas de instancia');
});

test('Tarima genérica: única familia paramétrica', () => {
  const t = { ...inst('TARIMA-GEN'), dims: { ancho: 3, profundidad: 2 } };
  assert.deepEqual(dimsDe(t), { ancho: 3, alto: 0.4, profundidad: 2 });
});

test('Tramo nominal de rejas: 4 × 3 m + 2 × 2,5 m = 6 piezas y 17 m, sin cobertura instalada inventada', () => {
  const piezas = [...Array(4)].map(() => inst('REJA-300')).concat([inst('REJA-250'), inst('REJA-250')]);
  const r = resumenVallado(piezas);
  assert.equal(r.cantidad, 6);
  assert.equal(r.largoNominal, 17);
  assert.equal(r.coberturaInstalada, null);
});

test('Recorrido no divisible: módulos completos y remanente informado', () => {
  const r = valladoPorRecorrido([{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 5 }], def('REJA-300'));
  assert.equal(r.cantidad, 4); // 3 en el tramo de 10 m + 1 en el de 5 m
  assert.equal(r.largoNominal, 12);
  assert.equal(r.largoRecorrido, 15);
  assert.deepEqual(r.remanentes, [{ segmento: 1, largo: 1 }, { segmento: 2, largo: 2 }]);
  assert.equal(r.giros, 1);
  assert.deepEqual(r.modulos[3], { x: 10, z: 1.5, rot: 90 });
  assert.throws(() => valladoPorRecorrido([{ x: 0, z: 0 }, { x: 5, z: 0 }], def('GEN-HIM-200')));
});

test('Generador 200 kVA: sin geometría inventada ni conversión automática a kW', () => {
  const g = inst('GEN-HIM-200');
  assert.deepEqual(dimsDe(g), { ancho: null, alto: null, profundidad: null });
  assert.equal(huellaXZ(g), null);
  assert.equal(g._def.electrico.kVA, 200);
  assert.equal(g._def.electrico.kW, null);
});

test('Datos faltantes: peso nulo queda pendiente y no hay total', () => {
  const layher = { id: 'v', categoria: 'vertical', nombre: 'Vertical 2.00m', peso: 7.7, x: 0, y: 0, z: 0 };
  const area = crearArea([{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 10 }], USOS_AREA[0], 'a');
  const r = resumenPeso([layher, inst('REJA-300'), inst('GEN-HIM-200'), area]);
  assert.equal(r.conocido, 7.7);
  assert.equal(r.total, null);
  assert.equal(r.completo, false);
  assert.equal(r.sinDato, 2);
  assert.equal(r.cantidad, 3, 'el área no computa material');
  assert.equal(resumenPeso([layher]).total, 7.7);
});

test('Áreas y recorridos: superficie y largo con puntos relativos al anclaje', () => {
  const a = crearArea([{ x: 5, z: 5 }, { x: 15, z: 5 }, { x: 15, z: 15 }, { x: 5, z: 15 }], USOS_AREA[1], 'a');
  assert.equal(a.x, 5);
  assert.deepEqual(a.puntos[2], { x: 10, z: 10 });
  assert.equal(superficie(puntosAbs(a)), 100);
  const movida = { ...a, x: a.x + 3 };
  assert.equal(superficie(puntosAbs(movida)), 100);
  assert.deepEqual(boundsXZEntidad(movida), { xMin: 8, xMax: 18, zMin: 5, zMax: 15 });
  const rec = crearRecorrido([{ x: 0, z: 0 }, { x: 3, z: 4 }], USOS_RECORRIDO[1], 'r');
  const t = resumenTrazos([a, rec]);
  assert.equal(t.areas[0].m2, 100);
  assert.equal(t.recorridos[0].largo, 5);
  assert.equal(t.recorridos[0].ancho, null);
  assert.throws(() => crearArea([{ x: 0, z: 0 }, { x: 1, z: 0 }], USOS_AREA[0], 'x'));
});

test('Rotación: huella y proyección en alzado coherentes', () => {
  const v = inst('VALL-AA-100-NEG', { x: 10, z: 20, rot: 90 });
  const b = boundsXZEntidad(v);
  assert.ok(Math.abs(b.xMax - b.xMin - 1.2) < 1e-9);
  assert.ok(Math.abs(b.zMax - b.zMin - 1.0) < 1e-9);
  const a = boundsAlzadoEntidad(v);
  assert.ok(Math.abs(a.xMax - a.xMin - 1.2) < 1e-9);
  assert.equal(a.yMax, 1.25);
  assert.ok(cruzaFilaEntidad(v, 20.4));
  assert.ok(!cruzaFilaEntidad(v, 21));
  assert.equal(normRot(-90), 270);
});

test('La instancia conserva su definición aunque cambie el catálogo', () => {
  const d = structuredClone(def('REJA-300'));
  const p = crearInstanciaFestival(d, { x: 0, z: 0 }, 'x');
  d.dimensiones.ancho = 9;
  assert.equal(dimsDe(p).ancho, 3);
});

for (const name of ['1285 mts con techo pantalla cc.masalto.json', 'Escenario 1285.masalto.json']) {
  test(`Migración 2.1 conserva todas las propiedades: ${name}`, () => {
    const original = fixture(name);
    const before = structuredClone(original);
    const migrado = migrarDiseno(original);
    assert.deepEqual(original, before, 'no muta el documento');
    assert.equal(migrado.piezas.length, original.piezas.length);
    original.piezas.forEach((p, i) => {
      for (const [k, v] of Object.entries(p)) assert.deepEqual(migrado.piezas[i][k], v);
      assert.equal(typeof migrado.piezas[i].z, 'number');
    });
  });
}

test('Visor 3D: entidades de predio sin geometría ni pesos inventados', async () => {
  const { parseDesign } = await import('../public/visualizador/model.mjs');
  const area = crearArea([{ x: 0, z: 0 }, { x: 20, z: 0 }, { x: 20, z: 10 }], USOS_AREA[0], 'a');
  const rec = crearRecorrido([{ x: 0, z: 12 }, { x: 20, z: 12 }], USOS_RECORRIDO[0], 'r');
  const vertical = { id: 'v', categoria: 'vertical', nombre: 'Vertical 2.00m', largo: 2, peso: 7.7, x: 0, y: 0, z: 0 };
  const soloMedidos = parseDesign(JSON.stringify({ piezas: [vertical, area, rec] }));
  assert.equal(soloMedidos.weight, 7.7, 'áreas y recorridos no afectan el peso');
  assert.ok(soloMedidos.primitives.some(q => q.kind === 'area'));

  const piezas = [inst('VALL-AA-100-NEG', { rot: 45 }), inst('REJA-300'), inst('GEN-HIM-200'), inst('TARIMA-GEN'), area, rec];
  const m = parseDesign(JSON.stringify({ piezas }));
  const [valla, reja, gen, tarima, a, r] = m.items;
  assert.ok(valla.rendered && reja.rendered && tarima.rendered && a.rendered && r.rendered);
  const primsGen = m.primitives.filter(q => q.index === 2);
  assert.equal(gen.representation, 'marcador');
  assert.ok(primsGen.every(q => q.kind === 'marker'), 'el generador sin medidas solo se marca, sin volumen');
  assert.ok(m.labels.some(l => l.index === 2 && l.text.includes('sin dimensiones')));
  assert.ok(m.labels.some(l => l.text.includes('m²')), 'las áreas llevan rótulo con superficie');
  assert.equal(m.weight, null, 'hay pesos sin dato: no se informa total');
  assert.ok(m.issues.some(t => t.includes('sin dimensiones confirmadas')));
  assert.ok(m.issues.some(t => t.includes('profundidad pendientes')));
  const vertices = idx => m.primitives.filter(q => q.index === idx).flatMap(q => (q.type === 'face' ? q.pts : [q.a, q.b]));
  const vAA = vertices(0);
  assert.equal(Math.max(...vAA.map(v => v[1])), 1.25, 'el vallado respeta el alto confirmado');
  // El esquema interno del antiavalancha queda dentro de su envolvente confirmada (1,00 × 1,20), aun rotado.
  const aa = piezas[0], t = aa.rot * Math.PI / 180;
  for (const [x, , z] of vAA) {
    const dx = x - aa.x, dz = z - aa.z;
    const u = dx * Math.cos(t) + dz * Math.sin(t), w = -dx * Math.sin(t) + dz * Math.cos(t);
    assert.ok(Math.abs(u) <= 0.5 + 1e-9 && Math.abs(w) <= 0.6 + 1e-9, `vértice fuera de la envolvente: u=${u} w=${w}`);
  }
});

test('Datos aproximados existentes marcados como esquemáticos sin cambiar valores', async () => {
  const { CATALOGO, CATALOGO_EVENTO } = await import('../src/catalogo/piezas.js');
  assert.ok(CATALOGO.truss.every(p => p.estado === 'esquematico'));
  assert.ok(CATALOGO.vigasIPN.every(p => p.estado === 'esquematico'));
  assert.ok(Object.values(CATALOGO_EVENTO).flat().every(p => p.estado === 'esquematico'));
  assert.equal(CATALOGO.truss.find(p => p.id === 'TRUSS200').peso, 15.0);
  assert.ok(CATALOGO.verticales.every(p => p.estado === undefined), 'Layher real no se marca');
});
