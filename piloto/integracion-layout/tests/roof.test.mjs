import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDesign} from '../public/visualizador/model.mjs';
const model = p => parseDesign(JSON.stringify({piezas:[{x:1,y:2,z:3,peso:10,...p}]}));
test('Techo: pico a 11 grados, extremos y fila conservados en ambos ejes',()=>{
 for(const orientacion of ['x','z']) {
  const m=model({categoria:'techo',largo:12.85,celosiasPorLado:2,orientacion});
  assert.equal(m.items[0].rendered,true);
  assert.ok(Math.abs(m.max[1]-(2+6.425*Math.tan(11*Math.PI/180)))<1e-9);
  const axis=orientacion==='x'?0:2, offset=axis===0?1:3;
  assert.ok(Math.abs(m.min[axis]-offset)<1e-9);
  assert.ok(Math.abs(m.max[axis]-offset-12.85)<1e-9);
  assert.equal(m.min[axis===0?2:0],axis===0?3:1);
 }
});
test('Voladizos preservan luz completa sin sumar piezas ni peso',()=>{
 const m=model({categoria:'techo',largo:15.42,celosiasPorLado:2});
 assert.ok(Math.abs(m.max[0]-m.min[0]-15.42)<1e-9);
 assert.equal(m.weight,10);assert.equal(m.items.length,1);
});
test('Ménsula y apoya techo respetan puntos de referencia',()=>{
 const m=model({categoria:'mensula',largo:1.09,orientacion:'z'});
 assert.deepEqual(m.primitives[0].a,[1,2,3]);
 assert.deepEqual(m.primitives[1].a,[1,1.5,3]);
 assert.deepEqual(m.primitives[1].b,[1,2,4.09]);
 const a=model({categoria:'apoyaTecho',largo:.73});
 assert.deepEqual(a.primitives[0].b,[1,2.73,3]);
});
test('Fenólico: largo, ancho y espesor de referencia sin nervaduras metálicas',()=>{
 const m=model({categoria:'fenolico',largo:2.44,anchoPlat:1.22});
 const dimensions=m.max.map((v,i)=>v-m.min[i]);
 [2.44,.018,1.22].forEach((v,i)=>assert.ok(Math.abs(dimensions[i]-v)<1e-9));
 assert.equal(m.primitives.length,6);assert.ok(m.primitives.every(p=>p.kind==='wood'));
});
test('Configuraciones de techo inválidas se rechazan',()=>{
 assert.throws(()=>model({categoria:'techo',largo:12.85,celosiasPorLado:100}));
 assert.throws(()=>model({categoria:'techo',largo:12.85,celosiasPorLado:1.5}));
});
