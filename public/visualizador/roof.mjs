// Mirrors Layout's TechoAguas.jsx centerlines. No inferred covering or cross-row connections.
export function roofGeometry(piece, length, P, line) {
  const module = 2.57, height = .5, angle = 11 * Math.PI / 180;
  const slope = Math.tan(angle), sin = Math.sin(angle), cos = Math.cos(angle);
  const count = piece.celosiasPorLado ?? Math.floor((piece.modulosAncho ?? Math.round(length / module)) / 2);
  if (!Number.isInteger(count) || count < 0 || count > 10 || count * 2 * module >= length) throw Error('Configuración de techo inválida.');
  const overhang = Math.max(0, (length - (count * 2 + 1) * module) / 2);
  const segment = (a,b,r=.024) => line(P(...a),P(...b),r);
  for (const direction of [1,-1]) {
    const X = u => direction === 1 ? u : length-u;
    for (let j=0;j<count;j++) {
      const u=overhang+j*module, v=u*slope;
      const top = t => [X(u+module*t),v+module*slope*t];
      const bottom = t => [X(u+module*t+sin*height),v+module*slope*t-cos*height];
      segment(top(0),top(1));segment(bottom(0),bottom(1));
      segment(top(0),bottom(0),.012);segment(top(1),bottom(1),.012);
      for(let k=0;k<4;k++) { segment(top(k/4),bottom((k+.5)/4),.012);segment(bottom((k+.5)/4),top((k+1)/4),.012); }
    }
    for(let j=1;j<count;j++) {
      const u=overhang+j*module;segment([X(u),u*slope],[X(u),u*slope-height],.016);
    }
    if(overhang>0) {
      segment([X(0),0],[X(overhang),overhang*slope]);
      segment([X(sin*height),-cos*height],[X(overhang+sin*height),overhang*slope-cos*height]);
      segment([X(0),0],[X(sin*height),-cos*height],.012);
    }
  }
  const u=overhang+count*module, v=u*slope;
  const a=[u,v],b=[length-u,v],c=[length/2,length/2*slope],d=[u,v-height],e=[length-u,v-height];
  for(const [s,t] of [[a,c],[b,c],[a,b],[a,d],[b,e],[d,e],[d,c],[e,c]])segment(s,t);
}
