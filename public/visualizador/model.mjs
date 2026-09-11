import { roofGeometry } from './roof.mjs';
import { importedGeometry } from './imported.mjs';
export const SUPPORTED=new Set(['vertical','horizontalO','barandilla','diagonal','diagonalPlanta','plataforma','base','collarin','celosia','truss','rodapie','horizontalU','vigaPuente','vigaIPN','techo','mensula','apoyaTecho','fenolico','escalera']);
const n=(v,key,fallback)=>{const a=v[key]??fallback;if(typeof a!=='number'||!Number.isFinite(a)||Math.abs(a)>1000)throw Error(`Dato inválido: ${key}.`);return a;};
export function parseDesign(text){
 let doc;try{doc=JSON.parse(text)}catch{throw Error('El archivo no contiene JSON válido.')}
 if(!doc||!Array.isArray(doc.piezas))throw Error('Elegí un diseño de planos con una lista de piezas; el archivo individual del editor de piezas usa otro formato.');
 if(doc.piezas.length>5000)throw Error('Esta prueba admite hasta 5.000 piezas.');
 const issues=[],items=[],primitives=[];let missingZ=0;
 doc.piezas.forEach((p,i)=>{if(!p||typeof p!=='object')throw Error(`Pieza ${i+1}: registro inválido.`);
 const item={index:i,name:String(p.nombre??p.categoria??'Pieza').slice(0,180),category:String(p.categoria??'sin categoría'),ref:String(p.ref??p.tipoId??'—').slice(0,80),raw:p,rendered:false};items.push(item);
 if(p._importada || p.categoria==='importada') {
   try {
     const imported = importedGeometry(p,i);
     primitives.push(...imported.primitives);
     if (primitives.length>160000) throw Error('La geometría excede el tamaño admitido para esta prueba.');
     item.rendered=true;
     item.representation=imported.representation;
     issues.push(`${item.name}: ${imported.representation==='envelope' ? 'dibujo guardado y envolvente dimensional de referencia; no representa su fabricación.' : 'solo dibujo frontal guardado, sin volumen ni profundidad de la pieza.'}`);
     if(p.z==null) missingZ++;
   } catch(error) {
     if(primitives.length>160000) throw error;
     issues.push(`${item.name}: sin representación en este visor (${error.message}).`);
   }
   return;
 }
 if(!SUPPORTED.has(p.categoria)){issues.push(`${item.name}: sin representación en este visor.`);return;}
 try{
 const start=primitives.length;
 const line=(a,b,r=.024,kind='tube')=>primitives.push({type:'line',a,b,r,kind,index:i});
 const face=(pts,kind='plate')=>primitives.push({type:'face',pts,kind,index:i});
 let z=n(p,'z',0);if(p.z==null&&p.categoria!=='diagonalPlanta')missingZ++;
 if(p.categoria==='diagonal'){line([n(p,'x1'),n(p,'y1'),z],[n(p,'x2'),n(p,'y2'),z],.024,'brace');}
 else if(p.categoria==='diagonalPlanta'){line([n(p,'x1'),n(p,'y'),n(p,'z1')],[n(p,'x2'),n(p,'y'),n(p,'z2')],.024,'brace');}
 else{
 let x=n(p,'x'),y=n(p,'y'),len=n(p,'largo',p.categoria==='collarin'?.1:undefined);if(len<=0||len>50)throw Error('Largo fuera del rango admitido (0–50 m).');
 if(p.orientacion!=null&&!['x','z'].includes(p.orientacion))throw Error('Orientación no admitida.');
 const P=(u=0,v=0,w=0)=>p.orientacion==='z'?[x+w,y+v,z+u]:[x+u,y+v,z+w];
 const box=(l,h,w)=>{const a=P(0,0,-w/2),b=P(l,0,-w/2),c=P(l,h,-w/2),d=P(0,h,-w/2),e=P(0,0,w/2),f=P(l,0,w/2),g=P(l,h,w/2),j=P(0,h,w/2);[ [a,b,c,d],[e,f,g,j],[d,c,g,j],[a,b,f,e],[a,d,j,e],[b,c,g,f] ].forEach(v=>face(v));};
 if(p.categoria==='techo'){
 roofGeometry(p,len,P,line);
 issues.push(`${item.name}: geometría esquemática de Layout, pendiente de 11°; sin cubierta ni uniones verificadas.`);
 }else if(p.categoria==='mensula'){
 const dir=p.flip?-1:1;const Pm=(u=0,v=0,w=0)=>p.orientacion==='z'?[x+w,y+v,z+u*dir]:[x+u*dir,y+v,z+w];
 line(Pm(),Pm(len));line(Pm(0,-.5),Pm(len),.016,'brace');
 issues.push(`${item.name}: brazo y diagonal según esquema de Layout; detalles de fabricación simplificados.`);
 }else if(p.categoria==='escalera'){
 const desn=n(p,'desnivel',1.33);const anchoE=n(p,'anchoEscalera',.75);const hw=anchoE/2;
 // Zancas (stringers laterales inclinados)
 line(P(0,0,-hw),P(len,desn,-hw),.018,'tube');line(P(0,0,hw),P(len,desn,hw),.018,'tube');
 // Peldaños (8 travesaños)
 const nPeld=8;for(let k=0;k<nPeld;k++){const t=(k+1)/(nPeld+1);line(P(t*len,t*desn,-hw),P(t*len,t*desn,hw),.012);}
 // Pasamanos
 line(P(0,.9,-hw),P(len,desn+.9,-hw),.008,'rail');line(P(0,.9,hw),P(len,desn+.9,hw),.008,'rail');
 issues.push(`${item.name}: zancas, peldaños y pasamanos esquemáticos; ancho ${anchoE}m.`);
 }else if(p.categoria==='apoyaTecho'){
 line(P(),P(0,len));line(P(-.05,len),P(.05,len),.008,'head');
 issues.push(`${item.name}: soporte y pasador esquemáticos.`);
 }else if(p.categoria==='fenolico'){
 const w=n(p,'anchoPlat');if(w<=0||w>5)throw Error('Ancho de fenólico inválido.');
 const startFaces=primitives.length;box(len,.018,w);
 for(let k=startFaces;k<primitives.length;k++)primitives[k].kind='wood';
 issues.push(`${item.name}: panel de referencia de 18 mm según catálogo de Layout.`);
 }else if(p.categoria==='vertical'){
 line([x,y,z],[x,y+len,z]);for(let h=0;h<=len+.0001;h+=.5){const pts=Array.from({length:8},(_,k)=>[x+Math.cos(k*Math.PI/4)*.061,y+h,z+Math.sin(k*Math.PI/4)*.061]);pts.forEach((a,k)=>line(a,pts[(k+1)%8],.008,'rosette'));}
 }else if(p.categoria==='base'){
 line([x,y,z],[x,y+len,z],.018);face([[x-.075,y,z-.075],[x+.075,y,z-.075],[x+.075,y,z+.075],[x-.075,y,z+.075]]);
 }else if(p.categoria==='collarin'){line([x,y,z],[x,y+len,z],.03);for(let k=0;k<8;k++){const a=k*Math.PI/4,b=(k+1)*Math.PI/4;line([x+Math.cos(a)*.061,y+len/2,z+Math.sin(a)*.061],[x+Math.cos(b)*.061,y+len/2,z+Math.sin(b)*.061],.008,'rosette');}}
 else if(p.categoria==='plataforma'){
 const w=n(p,'anchoPlat');if(w<=0||w>5)throw Error('Falta ancho de plataforma válido.');
 // The editor centers platforms about z (or x for orientation z).
 box(len,.06,w);for(let t=.12;t<len;t+=.16)line(P(t,.061,-w/2),P(t,.061,w/2),.004,'grating');
 }else if(p.categoria==='celosia'||p.categoria==='truss'){
 const h=n(p,'alto',.5);if(h<=0||h>5)throw Error('Alto de celosía inválido.');line(P(),P(len),.024);line(P(0,h),P(len,h),.024);line(P(),P(0,h));line(P(len),P(len,h));const count=Math.max(3,Math.round(len/.4));for(let j=0;j<count;j++){const u=j*len/count,v=(j+1)*len/count;line(P(u,j%2?h:0),P(v,j%2?0:h),.012,'brace');}
 }else if(p.categoria==='rodapie'){box(len,.15,.025)}
 else if(['vigaPuente','horizontalU','vigaIPN'].includes(p.categoria)){
 // Schematic profiles only; not fabricated catalogue sections.
 line(P(),P(len),.012);line(P(0,.055),P(len,.055),.012);line(P(),P(0,.055),.012);line(P(len),P(len,.055),.012);
 issues.push(`${item.name}: perfil esquemático, sección real pendiente.`);
 }else{
 line(P(),P(len),.024,p.categoria==='barandilla'?'rail':'tube');for(const u of [0,len]){line(P(u,-.045),P(u,.045),.028,'head');}
 }
 }
 item.rendered=primitives.length>start;
 }catch(e){throw Error(`Pieza ${i+1} (${item.name}): ${e.message}`)}
 });
 if(primitives.length>160000)throw Error('La geometría excede el tamaño admitido para esta prueba.');
 let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const v of primitives){for(const p of v.type==='face'?v.pts:[v.a,v.b]){for(let j=0;j<3;j++){min[j]=Math.min(min[j],p[j]);max[j]=Math.max(max[j],p[j]);}}}
 if(!primitives.length){min=[0,0,0];max=[1,1,1]}
 if(missingZ)issues.push(`${missingZ} piezas sin profundidad explícita: ubicadas en Z = 0, como en el editor.`);
 const weights=items.map(i=>i.raw.peso);const weight=weights.every(w=>typeof w==='number'&&Number.isFinite(w)&&w>=0)?weights.reduce((a,b)=>a+b,0):null;
 return {name:String(doc.nombre??'Diseño sin nombre').slice(0,180),items,primitives,min,max,center:min.map((v,j)=>(v+max[j])/2),issues:[...new Set(issues)],weight};
}
