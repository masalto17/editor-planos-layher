'use strict';
// Interactive conceptual diagram, independent from the production editors.
const canvas = document.querySelector('#structure');
const ctx = canvas.getContext('2d');
const scene = document.querySelector('#scene');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let width=1, height=1, dpr=1, frame=0, visible=true, last=0;
let mode=0, targetMode=0, angle=-0.64, targetAngle=-0.64, tilt=0.38, targetTilt=0.38;
let separation=0, targetSeparation=0, dragging=false, previousX=0, previousY=0;
let automatic=!reduced.matches, raf=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const models={structure:[],piece:[]};
function member(list,a,b,kind='steel',radius=.026,group=0){list.push({a,b,kind,radius,group});}
// All dimensions below belong to a visual demonstration, not a verified design.
for(let row=0;row<3;row++){
  const z=(row-1)*2.57;
  for(let col=0;col<5;col++){
    const x=(col-2)*2.57;
    member(models.structure,[x,-1.6,z],[x,1.4,z],'steel',.026,0);
    member(models.structure,[x-.12,-1.64,z],[x+.12,-1.64,z],'base',.07,0);
    for(let y=-1.1;y<=1.41;y+=.5){
      const ring=[];for(let i=0;i<8;i++){let t=i*Math.PI/4;ring.push([x+Math.cos(t)*.078,y,z+Math.sin(t)*.078]);}
      for(let i=0;i<8;i++)member(models.structure,ring[i],ring[(i+1)%8],'ring',.011,0);
    }
    if(col<4){for(const y of [-1.1,.9])member(models.structure,[x,y,z],[x+2.57,y,z],row===0&&y===.9?'red':'steel',.024,y>0?1:-1);}
    if(row<2){for(const y of [-1.1,.9])member(models.structure,[x,y,z],[x,y,z+2.57],'steel',.024,y>0?1:-1);}
    if(col<4&&row!==1){member(models.structure,[x,-1.1,z],[x+2.57,.9,z],row===0?'red':'brace',.022,2);}
    if(row<2&&(col===0||col===4))member(models.structure,[x,-1.1,z],[x,.9,z+2.57],'brace',.022,2);
  }
}
// A reticulated beam geometry for the piece-design demonstration.
for(const z of [-.28,.28]){
  for(const y of [-.55,.55])member(models.piece,[-3.2,y,z],[3.2,y,z],'steel',.04,0);
  for(let i=0;i<=8;i++){
    const x=-3.2+i*.8;
    member(models.piece,[x,-.55,z],[x,.55,z],'steel',.024,1);
    if(i<8)member(models.piece,[x,i%2? .55:-.55,z],[x+.8,i%2?-.55:.55,z],'red',.024,2);
  }
}
for(const x of [-3.2,3.2])for(const y of [-.55,.55])member(models.piece,[x,y,-.28],[x,y,.28],'steel',.032,1);
function resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);requestDraw();}
function project(point,explode=0,group=0,piece=false){
  let [x,y,z]=point;
  if(piece){if(group===1)y+=Math.sign(y)*explode*.7;if(group===2)z+=Math.sign(z)*explode*1.7;}
  else {x*=1+explode*.13;z*=1+explode*.25;if(group===1)y+=explode*1.25;if(group===-1)y-=explode*.6;if(group===2)z+=Math.sign(z||1)*explode*.6;}
  const ca=Math.cos(angle),sa=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
  const rx=x*ca+z*sa,rz=-x*sa+z*ca,ry=y*ct-rz*st,depth=y*st+rz*ct;
  const scale=Math.min(width/(piece?8.8:14.5),height/(piece?5.2:9.0));
  const perspective=20/(20+depth);
  return {x:width*.5+rx*scale*perspective,y:height*.51-ry*scale*perspective,d:depth,scale:scale*perspective};
}
function stroke(a,b,color,lineWidth=1){ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function grid(alpha){ctx.save();ctx.globalAlpha=alpha;for(let n=-8;n<=8;n++){
  stroke(project([n,-1.75,-8]),project([n,-1.75,8]),n===0?'#ffffff1c':'#ffffff09');
  stroke(project([-8,-1.75,n]),project([8,-1.75,n]),n===0?'#ffffff1c':'#ffffff09');
}ctx.restore();}
function dimension(a,b,label,alpha,piece=false){let p=project(a,0,0,piece),q=project(b,0,0,piece);ctx.save();ctx.globalAlpha=alpha;stroke(p,q,'#a6a69866');for(const v of [p,q]){stroke({x:v.x-3,y:v.y-4},{x:v.x+3,y:v.y+4},'#bdbdaf99');}const x=(p.x+q.x)/2,y=(p.y+q.y)/2;ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='center';const size=ctx.measureText(label).width;ctx.fillStyle='#181817';ctx.fillRect(x-size/2-7,y-8,size+14,17);ctx.fillStyle='#c5c5b9';ctx.fillText(label,x,y+4);ctx.restore();}
function drawModel(list,alpha,piece){
  if(alpha<.002)return;
  let projected=list.map(m=>({...m,p:project(m.a,separation,m.group,piece),q:project(m.b,separation,m.group,piece)}));
  projected.sort((a,b)=>(b.p.d+b.q.d)-(a.p.d+a.q.d));
  ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';
  for(const m of projected){let w=Math.max(m.kind==='ring'?.75:1.3,m.radius*2*(m.p.scale+m.q.scale)/2);let red=m.kind==='red';
    stroke(m.p,m.q,red?'#79040b':m.kind==='brace'?'#414440':'#535751',w+1.25);
    let grad=ctx.createLinearGradient(m.p.x-w,m.p.y-w,m.q.x+w,m.q.y+w);grad.addColorStop(0,red?'#ff5660':'#f0f0dc');grad.addColorStop(.38,red?'#e30613':'#b6b9aa');grad.addColorStop(.7,red?'#a2050e':'#686e65');grad.addColorStop(1,red?'#ee343e':'#c8ccbd');
    stroke(m.p,m.q,grad,w);
    if(w>2.8)stroke({x:m.p.x-.35,y:m.p.y-.5},{x:m.q.x-.35,y:m.q.y-.5},red?'#ff88884d':'#ffffff70',.55);
  }
  ctx.restore();
  if(separation<.4){if(piece)dimension([-3.2,-1.15,.4],[3.2,-1.15,.4],'Geometría de ejemplo',alpha,true);else dimension([-5.14,-1.8,3.45],[5.14,-1.8,3.45],'4 × 2,57 m',alpha);}
}
function draw(time=0){raf=0;if(!visible||document.hidden)return;
  const dt=Math.min((time-last)||16,40);last=time;
  const f=reduced.matches?1:1-Math.exp(-dt/130);
  mode=mix(mode,targetMode,f);separation=mix(separation,targetSeparation,f);
  if(automatic&&!dragging){targetAngle+=dt*.000023;}
  angle=mix(angle,targetAngle,f);tilt=mix(tilt,targetTilt,f);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  // Render the ground datum separately so the dimensional relationship stays readable.
  grid(1-mode*.6);
  drawModel(models.structure,1-mode,false);drawModel(models.piece,mode,true);
  frame++;
  const unsettled=Math.abs(mode-targetMode)+Math.abs(separation-targetSeparation)+Math.abs(angle-targetAngle)+Math.abs(tilt-targetTilt)>.001;
  if(automatic||unsettled)requestDraw();
}
function requestDraw(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(draw);}
function updateMotion(){document.querySelector('#motion').setAttribute('aria-pressed',String(automatic));document.querySelector('#motion').setAttribute('aria-label',automatic?'Pausar movimiento automático':'Activar movimiento automático');document.querySelector('#motion-text').textContent=automatic?'Pausar':'Animar';document.querySelector('#motion-symbol').textContent=automatic?'Ⅱ':'▷';}
function stopMotion(){automatic=false;updateMotion();}
function clearView(){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));}
function setView(view){stopMotion();if(view==='front'){targetAngle=0;targetTilt=0;}else if(view==='top'){targetAngle=0;targetTilt=Math.PI/2;}else {targetAngle=-.64;targetTilt=.38;}document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));requestDraw();}
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;previousX=e.clientX;previousY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');scene.classList.add('engaged');stopMotion();clearView();});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;targetAngle+=(e.clientX-previousX)*.009;if(e.pointerType!=='touch')targetTilt=clamp(targetTilt+(e.clientY-previousY)*.006,-.4,1.5);previousX=e.clientX;previousY=e.clientY;requestDraw();});
function release(){dragging=false;canvas.classList.remove('dragging');}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();stopMotion();clearView();if(e.key==='ArrowLeft')targetAngle-=.12;if(e.key==='ArrowRight')targetAngle+=.12;if(e.key==='ArrowUp')targetTilt=clamp(targetTilt+.1,-.4,1.5);if(e.key==='ArrowDown')targetTilt=clamp(targetTilt-.1,-.4,1.5);if(e.key==='Home')setView('perspective');requestDraw();});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
  targetMode=b.dataset.mode==='piece'?1:0;
  document.querySelectorAll('[data-mode]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));
  document.querySelector('.mode-control').classList.toggle('piece',!!targetMode);
  document.querySelector('#object-title').textContent=targetMode?'El detalle':'El conjunto';
  document.querySelector('#object-subtitle').textContent=targetMode?'Pieza reticulada · geometría de ejemplo':'Estructura modular · esquema conceptual';
  document.querySelector('#model-number').textContent=targetMode?'02':'01';
  targetAngle=targetMode?-.42:-.64;targetTilt=targetMode?.22:.38;
  canvas.setAttribute('aria-label',(targetMode?'Pieza reticulada conceptual.':'Estructura modular conceptual.')+' Arrastrá para girar o usá las flechas. No es el editor real.');
  clearView();document.querySelector('[data-view="perspective"]').setAttribute('aria-pressed','true');requestDraw();
}));
document.querySelector('#explode').addEventListener('input',e=>{targetSeparation=Number(e.target.value)/100;document.querySelector('#explode-value').value=e.target.value+'%';requestDraw();});
document.querySelector('#reset').addEventListener('click',()=>{targetSeparation=0;document.querySelector('#explode').value=0;document.querySelector('#explode-value').value='0%';setView('perspective');});
document.querySelector('#motion').addEventListener('click',()=>{automatic=!automatic;if(automatic)clearView();updateMotion();requestDraw();});
reduced.addEventListener('change',()=>{if(reduced.matches)stopMotion();requestDraw();});
new ResizeObserver(resize).observe(canvas);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=performance.now();requestDraw();}else if(raf){cancelAnimationFrame(raf);raf=0;}},{threshold:0}).observe(scene);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=performance.now();requestDraw();}});
updateMotion();resize();
for(const portal of document.querySelectorAll('.portal'))portal.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;const r=portal.getBoundingClientRect();portal.style.setProperty('--mx',`${e.clientX-r.left}px`);portal.style.setProperty('--my',`${e.clientY-r.top}px`);});
const dialog=document.querySelector('#app-dialog');
const appAccess={
  planos:{title:'Diseño de planos',description:'Organizá la estructura por vistas y filas. Consultá el despiece y abrí el plano actual con Ver en 3D.',href:'../',cta:'Abrir Layout ↗',route:'Planificá la estructura',notice:'Se abre en otra pestaña para conservar tu trabajo. Desde Layout podés crear piezas y enviar el plano al visualizador.'},
  piezas:{title:'Diseño de piezas',description:'Definí una pieza especial, revisá sus dimensiones y agregala al catálogo de Layout.',href:'../piezas/index.html',cta:'Crear una pieza ↗',route:'Ampliá tu biblioteca',notice:'Se abre en otra pestaña. Agregar a Layout actualiza el catálogo de esta copia local; las piezas ya colocadas conservan sus datos.'},
  visualizador:{title:'Visualizador 3D',description:'Recorré un diseño guardado desde diferentes perspectivas antes de llevar la estructura a obra.',href:'../visualizador/index.html',cta:'Abrir visualizador ↗',route:'Del plano a la estructura',notice:'Abrí un archivo .masalto.json o explorá un ejemplo. Para ver el plano que estás editando, usá Ver en 3D desde Layout.'}
};
for(const button of document.querySelectorAll('[data-app]'))button.addEventListener('click',()=>{const app=appAccess[button.dataset.app];if(!app)return;document.querySelector('#app-title').textContent=app.title;document.querySelector('#app-description').textContent=app.description;document.querySelector('#open-app').href=app.href;document.querySelector('#open-app').textContent=app.cta;document.querySelector('#app-route').textContent=app.route;document.querySelector('#app-notice').textContent=app.notice;dialog.showModal();});
document.querySelector('#close-dialog').addEventListener('click',()=>dialog.close());document.querySelector('#return-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
