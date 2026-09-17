import test from 'node:test';
import assert from 'node:assert/strict';
import { guardarPiezaImportada, cargarPiezasImportadas } from '../public/compartido/importador.js';
test('Agregar y actualizar un ID mantiene otras piezas y copias colocadas', () => {
  const store=new Map();
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  try {
    guardarPiezaImportada({id:'AAA',nombre:'Primera',peso:1});
    guardarPiezaImportada({id:'BBB',nombre:'Otra',peso:2});
    const placed=structuredClone(cargarPiezasImportadas()[0]);
    guardarPiezaImportada({id:'AAA',nombre:'Actualizada',peso:3});
    assert.equal(cargarPiezasImportadas().length,2);
    assert.equal(cargarPiezasImportadas()[1].nombre,'Otra');
    assert.equal(placed.peso,1);
    assert.equal(cargarPiezasImportadas()[0].peso,3);
  } finally { delete globalThis.localStorage; }
});
test('Almacenamiento lleno informa fallo, sin devolver éxito',()=>{
  globalThis.localStorage={getItem:()=>null,setItem:()=>{throw Error('QuotaExceeded');}};
  try { assert.throws(()=>guardarPiezaImportada({id:'AAA'}),/No se pudo guardar/); }
  finally { delete globalThis.localStorage; }
});
