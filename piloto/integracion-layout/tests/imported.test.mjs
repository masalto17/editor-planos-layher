import test from 'node:test';
import assert from 'node:assert/strict';
import { importedGeometry } from '../public/visualizador/imported.mjs';
import { parseDesign } from '../public/visualizador/model.mjs';

const piece = () => ({_importada:true, categoria:'importada', nombre:'LED', x:1,y:2,z:3,peso:18,
  _visual:[{tipo:'rectangulo',x:0,y:0,ancho:.5,alto:1}]});

test('Archivo antiguo: posiciones exactas en X-Y, sin profundidad inventada', () => {
  const p=piece(), before=structuredClone(p), g=importedGeometry(p,7);
  assert.equal(g.representation,'outline');
  assert.equal(g.primitives.length,4);
  assert.deepEqual(g.primitives[0].a,[1,2,3]);
  assert.deepEqual(g.primitives[0].b,[1.5,2,3]);
  assert.ok(g.primitives.every(s=>s.a[2]===3 && s.b[2]===3 && s.index===7));
  assert.deepEqual(p,before);
});
test('Eje Z rota el dibujo sin trasladar la fila ni duplicar escala', () => {
  const g=importedGeometry({...piece(),orientacion:'z'},0);
  assert.deepEqual(g.primitives[0].a,[1,2,3]);
  assert.deepEqual(g.primitives[0].b,[1,2,3.5]);
  assert.deepEqual(g.primitives[1].b,[1,3,3.5]);
});
test('Envolvente usa solo dimensiones explícitas y conserva dibujo colocado', () => {
  const p=piece();p._definicion={dimensiones:{largo:.5,alto:1,profundidad:.15},vistas:{alzado:{elementos:[]}}};
  const g=importedGeometry(p,0);
  assert.equal(g.representation,'envelope');
  assert.equal(g.primitives.length,16);
  assert.equal(Math.max(...g.primitives.flatMap(s=>[s.a[2],s.b[2]])),3.15);
  p._definicion.dimensiones.profundidad=-1;
  assert.equal(importedGeometry(p,0).representation,'outline');
});
test('Una pieza importada inválida no deja dibujo parcial ni impide ver otras piezas', () => {
  const p=piece();p._visual.push({tipo:'circulo',x:0,y:0,radio:-1});
  const model=parseDesign(JSON.stringify({piezas:[p,{...piece(),nombre:'Válida'}]}));
  assert.equal(model.items[0].rendered,false);
  assert.equal(model.items[1].rendered,true);
  assert.equal(model.primitives.length,4);
  assert.equal(model.weight,36);
  assert.ok(model.issues.some(s=>s.includes('sin representación')));
});
test('Círculos, líneas y polilíneas válidas; segmentos repetidos omitidos', () => {
  const p=piece();p._visual=[{tipo:'linea',desde:{x:0,y:0},hasta:{x:1,y:0}},
    {tipo:'circulo',x:0,y:0,radio:1},{tipo:'polilinea',puntos:[{x:0,y:0},{x:0,y:0},{x:1,y:1}]}];
  const g=importedGeometry(p,0);
  assert.equal(g.primitives.length,50);
  assert.ok(g.primitives.every(s=>[...s.a,...s.b].every(Number.isFinite)));
});
test('Limitar datos inválidos y dibujos excesivos', () => {
  assert.throws(()=>importedGeometry({...piece(),x:NaN},0));
  assert.throws(()=>importedGeometry({...piece(),orientacion:'q'},0));
  assert.throws(()=>importedGeometry({...piece(),_visual:Array(2001).fill(piece()._visual[0])},0));
});
