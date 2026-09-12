import { roofGeometry } from './roof.mjs';
import { importedGeometry } from './imported.mjs';
export const SUPPORTED=new Set(['vertical','horizontalO','barandilla','diagonal','diagonalPlanta','plataforma','base','collarin','celosia','truss','rodapie','horizontalU','vigaPuente','vigaIPN','techo','mensula','apoyaTecho','fenolico','escalera','stringer','lineArray','pantallaLED','luz']);
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
 const eDir=p.flip?-1:1;const eLen=len*eDir;
 // Zancas (stringers laterales inclinados)
 line(P(0,0,-hw),P(eLen,desn,-hw),.018,'tube');line(P(0,0,hw),P(eLen,desn,hw),.018,'tube');
 // Peldaños (8 travesaños)
 const nPeld=8;for(let k=0;k<nPeld;k++){const t=(k+1)/(nPeld+1);line(P(t*eLen,t*desn,-hw),P(t*eLen,t*desn,hw),.012);}
 // Pasamanos
 line(P(0,.9,-hw),P(eLen,desn+.9,-hw),.008,'rail');line(P(0,.9,hw),P(eLen,desn+.9,hw),.008,'rail');
 issues.push(`${item.name}: zancas, peldaños y pasamanos esquemáticos; ancho ${anchoE}m.`);
 }else if(p.categoria==='apoyaTecho'){
 line(P(),P(0,len));line(P(-.05,len),P(.05,len),.008,'head');
 issues.push(`${item.name}: soporte y pasador esquemáticos.`);
 }else if(p.categoria==='fenolico'){
 const w=n(p,'anchoPlat');if(w<=0||w>5)throw Error('Ancho de fenólico inválido.');
 // Fenólico apoya sobre stringers, que apoyan sobre viga puente:
 // offset Y = perfil VP (0.055) + stringer 80mm (0.08) = 0.135m
 y+=0.135;
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
 // Plataforma apoya sobre horizontal O / viga puente (offset +0.055m)
 y+=0.055;
 box(len,.06,w);for(let t=.12;t<len;t+=.16)line(P(t,.061,-w/2),P(t,.061,w/2),.004,'grating');
 }else if(p.categoria==='celosia'||p.categoria==='truss'){
 const h=n(p,'alto',.5);if(h<=0||h>5)throw Error('Alto de celosía inválido.');line(P(),P(len),.024);line(P(0,h),P(len,h),.024);line(P(),P(0,h));line(P(len),P(len,h));const count=Math.max(3,Math.round(len/.4));for(let j=0;j<count;j++){const u=j*len/count,v=(j+1)*len/count;line(P(u,j%2?h:0),P(v,j%2?0:h),.012,'brace');}
 }else if(p.categoria==='rodapie'){box(len,.15,.025)}
 else if(p.categoria==='stringer'){
 // Caño estructural 40×80×2.50mm — apoya sobre viga puente (offset +0.055m)
 y+=0.055;
 box(len,.08,.04);
 }else if(['vigaPuente','horizontalU','vigaIPN'].includes(p.categoria)){
 // Schematic profiles only; not fabricated catalogue sections.
 line(P(),P(len),.012);line(P(0,.055),P(len,.055),.012);line(P(),P(0,.055),.012);line(P(len),P(len,.055),.012);
 issues.push(`${item.name}: perfil esquemático, sección real pendiente.`);
 }else if(p.categoria==='lineArray'){
 // Line Array: bumper frame + rigging cables + stacked speaker boxes
 const altoCaja=n(p,'altoCaja',.35);const cajas=Math.max(1,Math.min(p.cajas||1,18));
 const bumperH=0.10;const cableH=0.15;const gap=0.008;const depth=0.50;
 const esSub=(p.tipoLA==='subVolado'||p.tipoLA==='subApilado');
 // Bumper frame (centered, 70% width)
 const bFrac=0.70;const bw=len*bFrac;const bOff=(len-bw)/2;const bd=depth*0.5;
 const bf=[[bOff,0,-bd/2],[bOff+bw,0,-bd/2],[bOff+bw,-bumperH,-bd/2],[bOff,-bumperH,-bd/2],
            [bOff,0,bd/2],[bOff+bw,0,bd/2],[bOff+bw,-bumperH,bd/2],[bOff,-bumperH,bd/2]].map(([u,v,w])=>P(u,v,w));
 [[0,1,2,3],[4,5,6,7],[3,2,6,7],[0,1,5,4],[0,3,7,4],[1,2,6,5]].forEach(idx=>face(idx.map(k=>bf[k]),'plate'));
 // Rigging point (small cross at top)
 line(P(len/2,0.02),P(len/2,0),.010,'tube');
 // Two cables from bumper to first box
 const cOff=len*0.15;
 line(P(len/2-cOff,-bumperH),P(len/2-cOff,-bumperH-cableH),.006,'tube');
 line(P(len/2+cOff,-bumperH),P(len/2+cOff,-bumperH-cableH),.006,'tube');
 // Stack of speaker boxes with progressive widening (J-curve for tops)
 const ensMax=esSub?0:0.08;
 for(let j=0;j<cajas;j++){
   const topYj=-(bumperH+cableH+j*(altoCaja+gap));
   const t=cajas>1?j/(cajas-1):0;const tN=cajas>1?Math.min(1,(j+1)/(cajas-1)):0;
   const ensT=ensMax*t*t;const ensB=ensMax*tN*tN;
   const wTop=len*(1+ensT);const wBot=len*(1+ensB);
   const offT=(len-wTop)/2;const offB=(len-wBot)/2;
   // Front face (Z-) and back face (Z+), top and bottom with different widths
   const c8=[[offT,topYj,-depth/2],[offT+wTop,topYj,-depth/2],[offB+wBot,topYj-altoCaja,-depth/2],[offB,topYj-altoCaja,-depth/2],
              [offT,topYj,depth/2],[offT+wTop,topYj,depth/2],[offB+wBot,topYj-altoCaja,depth/2],[offB,topYj-altoCaja,depth/2]].map(([u,v,w])=>P(u,v,w));
   [[0,1,2,3],[4,5,6,7],[3,2,6,7],[0,1,5,4],[0,3,7,4],[1,2,6,5]].forEach(idx=>face(idx.map(k=>c8[k]),'plate'));
   // Grille stripe on front face (thin darker band)
   if(j<cajas-1){
     const gy=topYj-altoCaja;const gw=wBot*0.9;const gOff=offB+(wBot-gw)/2;
     line(P(gOff,gy,-depth/2-0.001),P(gOff+gw,gy,-depth/2-0.001),.003,'tube');
   }
 }
 issues.push(`${item.name}: cluster de ${cajas} caja(s) con curva J; geometría esquemática.`);
 }else if(p.categoria==='pantallaLED'){
 // Pantalla LED: thin panel with frame + mounting brackets
 const alto=n(p,'alto',2);const depth=0.10;const frameD=0.02;
 // Main panel body
 const c=[[0,0,-depth/2],[len,0,-depth/2],[len,alto,-depth/2],[0,alto,-depth/2],
           [0,0,depth/2],[len,0,depth/2],[len,alto,depth/2],[0,alto,depth/2]].map(([u,v,w])=>P(u,v,w));
 [[0,1,2,3],[4,5,6,7],[3,2,6,7],[0,1,5,4],[0,3,7,4],[1,2,6,5]].forEach(idx=>face(idx.map(k=>c[k]),'plate'));
 // Mounting brackets at top (two vertical tubes at 20% and 80% width)
 const brkH=0.12;
 line(P(len*0.2,alto),P(len*0.2,alto+brkH),.012,'tube');
 line(P(len*0.8,alto),P(len*0.8,alto+brkH),.012,'tube');
 // Cross bar between brackets
 line(P(len*0.2,alto+brkH),P(len*0.8,alto+brkH),.010,'tube');
 // Module grid lines on front face (decorative)
 const nModH=Math.max(2,Math.round(alto/0.5));const nModW=Math.max(2,Math.round(len/0.5));
 for(let mi=1;mi<nModH;mi++){const gy=mi*alto/nModH;line(P(0,gy,-depth/2-0.001),P(len,gy,-depth/2-0.001),.002,'tube');}
 for(let mi=1;mi<nModW;mi++){const gx=mi*len/nModW;line(P(gx,0,-depth/2-0.001),P(gx,alto,-depth/2-0.001),.002,'tube');}
 issues.push(`${item.name}: panel LED ${len}×${alto}m con soporte superior.`);
 }else if(p.categoria==='luz'){
 // Luz: fixture with clamp, yoke/arm, and body
 const tipoLuz=p.tipoLuz||'movingHead';const fixtureD=len*0.7;
 const clampH=0.04;const dropH=0.03;
 // Clamp at truss
 line(P(len/2,0),P(len/2,-clampH),.015,'tube');
 if(tipoLuz==='barra'){
   // LED bar: long thin box
   const barH=0.08;const barD=0.10;
   const bc=[[0,-clampH,-barD/2],[len,-clampH,-barD/2],[len,-clampH-barH,-barD/2],[0,-clampH-barH,-barD/2],
              [0,-clampH,barD/2],[len,-clampH,barD/2],[len,-clampH-barH,barD/2],[0,-clampH-barH,barD/2]].map(([u,v,w])=>P(u,v,w));
   [[0,1,2,3],[4,5,6,7],[3,2,6,7],[0,1,5,4],[0,3,7,4],[1,2,6,5]].forEach(idx=>face(idx.map(k=>bc[k])));
 }else if(tipoLuz==='blinder'){
   // Blinder: wide short box
   const bH=0.18;const bD=0.15;
   const bc=[[0,-clampH,-bD/2],[len,-clampH,-bD/2],[len,-clampH-bH,-bD/2],[0,-clampH-bH,-bD/2],
              [0,-clampH,bD/2],[len,-clampH,bD/2],[len,-clampH-bH,bD/2],[0,-clampH-bH,bD/2]].map(([u,v,w])=>P(u,v,w));
   [[0,1,2,3],[4,5,6,7],[3,2,6,7],[0,1,5,4],[0,3,7,4],[1,2,6,5]].forEach(idx=>face(idx.map(k=>bc[k])));
 }else{
   // Moving head / wash / beam / par / fresnel / etc: yoke + head
   const yokeW=len*0.6;const yokeH=len*0.35;const headR=len*0.35;
   const yokeOff=(len-yokeW)/2;const yokeTop=-clampH-dropH;
   // Drop from clamp
   line(P(len/2,-clampH),P(len/2,yokeTop),.008,'tube');
   // Yoke arms (two vertical tubes + cross bar)
   line(P(yokeOff,yokeTop),P(yokeOff,yokeTop-yokeH),.008,'tube');
   line(P(yokeOff+yokeW,yokeTop),P(yokeOff+yokeW,yokeTop-yokeH),.008,'tube');
   line(P(yokeOff,yokeTop),P(yokeOff+yokeW,yokeTop),.008,'tube');
   // Head as box (approximation of the round head)
   const headCy=yokeTop-yokeH*0.6;const hW=headR*1.4;const hH=headR;const hD=headR*1.2;
   const hOff=len/2-hW/2;
   const hc=[[hOff,headCy+hH/2,-hD/2],[hOff+hW,headCy+hH/2,-hD/2],[hOff+hW,headCy-hH/2,-hD/2],[hOff,headCy-hH/2,-hD/2],
              [hOff,headCy+hH/2,hD/2],[hOff+hW,headCy+hH/2,hD/2],[hOff+hW,headCy-hH/2,hD/2],[hOff,headCy-hH/2,hD/2]].map(([u,v,w])=>P(u,v,w));
   [[0,1,2,3],[4,5,6,7],[3,2,6,7],[0,1,5,4],[0,3,7,4],[1,2,6,5]].forEach(idx=>face(idx.map(k=>hc[k])));
 }
 issues.push(`${item.name}: fixture ${tipoLuz} esquemático de referencia.`);
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
