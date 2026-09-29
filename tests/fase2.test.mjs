import test from 'node:test';
import assert from 'node:assert/strict';
import { definicionPorId, USOS_AREA, USOS_RECORRIDO } from '../src/catalogo/festival.js';
import { generarTorre, tramosVertical, nivelesTorre, resumenConjuntos, MEDIDAS_TORRE } from '../src/catalogo/torres.js';
import { CATALOGO } from '../src/catalogo/piezas.js';
import { piezaBounds, piezaBoundsXZ, cruzaFilaZ, desplazarPieza, extremosDiagonalLateral } from '../src/modelo/operaciones.js';
import {
  crearInstanciaFestival, crearArea, crearRecorrido, asignarCodigos, paraCopia, migrarDiseno, dimsDe, resumenPeso,
} from '../public/compartido/entidades.js';

let n = 0;
const id = () => `id${n++}`;
const inst = (defId, pos = {}) => crearInstanciaFestival(definicionPorId(defId), { x: 0, z: 0, ...pos }, id());

test('Numeración: prefijo por familia, correlativa y estable', () => {
  const a = asignarCodigos([], [inst('GEN-HIM-200'), inst('GEN-HIM-200-ABI'), inst('REJA-300'), inst('PORTON-GEN')]);
  assert.deepEqual(a.map(p => p.codigo), ['GE-01', 'GE-02', 'RJ-001', 'PT-01']);
  const b = asignarCodigos(a, [inst('GEN-HIM-200')]);
  assert.equal(b[0].codigo, 'GE-03', 'continúa la numeración existente');
  const movida = desplazarPieza(a[0], 5, 0, 5);
  assert.equal(movida.codigo, 'GE-01', 'mover no cambia el código');
  const [dup] = asignarCodigos(a, paraCopia([a[0]], id));
  assert.equal(dup.codigo, 'GE-03', 'duplicar asigna código nuevo');
  const area = asignarCodigos([], [crearArea([{ x: 0, z: 0 }, { x: 5, z: 0 }, { x: 5, z: 5 }], USOS_AREA[0], id())]);
  assert.equal(area[0].codigo, 'AR-01');
  const layher = { id: 'v', categoria: 'vertical', nombre: 'Vertical 2.00m', peso: 7.7, x: 0, y: 0, z: 0 };
  assert.equal(asignarCodigos([], [layher])[0].codigo, undefined, 'las piezas Layher sueltas no se numeran');
});

test('Numeración: proyectos anteriores reciben código sin tocar sus propiedades', () => {
  const g = inst('GEN-HIM-200'); delete g.codigo;
  const doc = { piezas: [g, { id: 'v', categoria: 'vertical', x: 0, y: 0 }] };
  const m = migrarDiseno(doc);
  assert.equal(m.piezas[0].codigo, 'GE-01');
  assert.equal(m.piezas[1].codigo, undefined);
  for (const [k, v] of Object.entries(g)) assert.deepEqual(m.piezas[0][k], v);
  const conCodigo = { ...g, codigo: 'GE-07' };
  assert.equal(migrarDiseno({ piezas: [conCodigo] }).piezas[0].codigo, 'GE-07', 'un código existente se respeta');
});

test('Sectores y recorridos nuevos: carga de generadores, combustible, bandeja con cota, sentido', () => {
  assert.ok(USOS_AREA.some(u => u.id === 'cargaGeneradores' && u.capa === 'energia'));
  assert.ok(USOS_AREA.some(u => u.id === 'combustible'));
  const bandeja = crearRecorrido([{ x: 0, z: 0 }, { x: 10, z: 0 }], USOS_RECORRIDO.find(u => u.id === 'bandeja'), id());
  assert.equal(bandeja.cota, null, 'cota sin dato hasta que se informe');
  const pmr = crearRecorrido([{ x: 0, z: 0 }, { x: 10, z: 0 }], USOS_RECORRIDO.find(u => u.id === 'pmr'), id());
  assert.equal(pmr.sentido, 'ida');
});

test('Portón y puerta de emergencia: paramétricos, sin peso inventado', () => {
  const p = inst('PORTON-GEN'), e = inst('PUERTA-EMER');
  assert.deepEqual(p.opciones, { hojas: 2, abre: 'fondo' });
  assert.equal(p.peso, null);
  assert.equal(dimsDe({ ...p, dims: { ancho: 6 } }).ancho, 6, 'la luz libre es editable');
  assert.equal(dimsDe(p).profundidad, null);
  assert.equal(e._def.salidaEmergencia, true);
  assert.equal(e._def.capa, 'seguridad');
  assert.equal(resumenPeso([p]).total, null);
});

test('Torre: solo piezas Layher de catálogo con su peso real', () => {
  const r = generarTorre({ uso: 'pa', frente: 2.57, fondo: 1.57, alto: 6, x: 10, z: 20, grupoId: 'g1', nuevoId: id });
  const todas = Object.values(CATALOGO).flat();
  for (const p of r.piezas) {
    const c = todas.find(q => q.id === p.tipoId);
    assert.ok(c, `${p.tipoId} no es de catálogo`);
    assert.equal(p.peso, c.peso);
    assert.equal(p.grupo.id, 'g1');
  }
  const cuenta = cat => r.piezas.filter(p => p.categoria === cat).length;
  assert.equal(cuenta('base'), 4);
  assert.equal(cuenta('collarin'), 4);
  assert.equal(cuenta('vertical'), 8, '6 m = 4,00 + 2,00 por columna');
  assert.equal(cuenta('horizontalO'), 16, '4 niveles × 4 caras');
  assert.equal(cuenta('diagonal'), 6, '3 pisos × frente y contrafrente');
  assert.deepEqual(r.faltantes, []);
  const peso = r.piezas.reduce((s, p) => s + p.peso, 0);
  // 4 × (4,5 + 1,3) bases · 4 × (15,4 + 7,7) verticales · 4 niveles × (2 × 9,7 + 2 × 5,9) · 6 × 8,5 diagonales
  assert.ok(Math.abs(peso - 291.4) < 0.01, `peso ${peso}`);
});

test('Torre: regla MasAlto — diagonales solo en frente y contrafrente, sin plataforma ni barandas', () => {
  const r = generarTorre({ frente: 2.07, fondo: 2.07, alto: 4, x: 0, z: 0, grupoId: 'g', nuevoId: id });
  const diag = r.piezas.filter(p => p.categoria === 'diagonal');
  assert.equal(diag.length, 4);
  assert.deepEqual([...new Set(diag.map(p => p.z))].sort(), [0, 2.07]);
  const [p1, p2] = diag.filter(p => p.z === 0);
  assert.ok(p1.y2 > p1.y1 && p2.y2 < p2.y1, 'el piso siguiente alterna el sentido');
  for (const cat of ['diagonalLateral', 'diagonalPlanta', 'plataforma', 'barandilla', 'rodapie']) {
    assert.ok(!r.piezas.some(p => p.categoria === cat), `no lleva ${cat}`);
  }
});

test('Torre: 2 caras van en el lado largo; 4 caras a elección', () => {
  const cuenta = (r, cat) => r.piezas.filter(p => p.categoria === cat).length;
  const fondoLargo = generarTorre({ frente: 1.57, fondo: 2.57, alto: 4, grupoId: 'g', nuevoId: id });
  assert.equal(cuenta(fondoLargo, 'diagonal'), 0);
  assert.equal(cuenta(fondoLargo, 'diagonalLateral'), 4, 'el lado largo es el fondo');
  const cuatro = generarTorre({ frente: 2.57, fondo: 1.57, alto: 4, diagonales: 4, grupoId: 'g', nuevoId: id });
  assert.equal(cuenta(cuatro, 'diagonal'), 4);
  assert.equal(cuenta(cuatro, 'diagonalLateral'), 4);
  assert.equal(cuatro.grupo.diagonales, 4);
  assert.throws(() => generarTorre({ diagonales: 3, grupoId: 'g', nuevoId: id }));
});

test('Diagonal lateral: geometría coherente (queda disponible para armados a mano)', () => {
  const lat = { id: 'dl', categoria: 'diagonalLateral', ancho: 2.07, alto: 2, x: 0, y: 0, z: 0, invertida: false };
  assert.deepEqual(extremosDiagonalLateral(lat), [[0, 0, 0], [0, 2, 2.07]]);
  assert.deepEqual(piezaBoundsXZ(lat), { xMin: 0, xMax: 0, zMin: 0, zMax: 2.07 });
  assert.deepEqual(piezaBounds(lat), { xMin: 0, xMax: 0, yMin: 0, yMax: 2 });
  assert.ok(cruzaFilaZ(lat, 1) && !cruzaFilaZ(lat, 3));
});

test('Torre: lo que no se arma con catálogo se informa, no se inventa', () => {
  const r = generarTorre({ frente: 1.57, fondo: 1.57, alto: 5, grupoId: 'g', nuevoId: id });
  assert.equal(r.faltantes.length, 1, 'piso superior de 1,00 m sin diagonal 1,57 × 1,00');
  assert.deepEqual(tramosVertical(5), [4, 1]);
  assert.deepEqual(nivelesTorre(5), [0, 2, 4, 5]);
  const sinDiag = generarTorre({ frente: 0.73, fondo: 0.73, alto: 4, grupoId: 'g', nuevoId: id });
  assert.equal(sinDiag.faltantes.length, 2, 'no hay diagonal 0,73 en catálogo: se informa por piso');
  assert.ok(!sinDiag.piezas.some(p => p.categoria === 'diagonal'));
  assert.throws(() => generarTorre({ frente: 2.57, fondo: 1.57, alto: 4.2, grupoId: 'g', nuevoId: id }));
});

test('Torre: código de conjunto por uso y copia con conjunto nuevo', () => {
  const r = generarTorre({ uso: 'delay', frente: 2.57, fondo: 2.57, alto: 4, grupoId: 'g', nuevoId: id });
  const a = asignarCodigos([], r.piezas);
  assert.ok(a.every(p => p.grupo.codigo === 'DL-01' && p.codigo === undefined));
  const copia = asignarCodigos(a, paraCopia(a, id).map(p => ({ ...p, id: id() })));
  assert.ok(copia.every(p => p.grupo.codigo === 'DL-02' && p.grupo.id !== 'g'));
  const conj = resumenConjuntos([...a, ...copia]);
  assert.equal(conj.length, 2);
  assert.equal(conj[0].cantidad, a.length);
});

test('Visor 3D: torre, diagonal lateral y portón dentro de su envolvente', async () => {
  const { parseDesign } = await import('../public/visualizador/model.mjs');
  const r = generarTorre({ frente: 2.57, fondo: 1.57, alto: 4, grupoId: 'g', nuevoId: id });
  const m = parseDesign(JSON.stringify({ piezas: r.piezas }));
  assert.ok(m.items.every(i => i.rendered), 'todas las piezas de la torre se dibujan');
  const lat = { id: 'dl', categoria: 'diagonalLateral', nombre: 'Diagonal 1.57×2.00m', ancho: 1.57, alto: 2, peso: 6.7, x: 0, y: 0, z: 0 };
  const ml = parseDesign(JSON.stringify({ piezas: [lat] }));
  const pr = ml.primitives[0];
  assert.deepEqual([pr.a, pr.b].map(v => v.map(c => Math.round(c * 100) / 100)), [[0, 0, 0], [0, 2, 1.57]]);
  const porton = { ...inst('PORTON-GEN'), dims: { ancho: 5, alto: 2.2 } };
  const mp = parseDesign(JSON.stringify({ piezas: [porton] }));
  const vs = mp.primitives.flatMap(q => (q.type === 'face' ? q.pts : [q.a, q.b]));
  assert.ok(Math.max(...vs.map(v => Math.abs(v[0]))) <= 2.5 + 1e-9);
  assert.ok(Math.max(...vs.map(v => v[1])) <= 2.2 + 1e-9);
  assert.equal(mp.weight, null);
});
