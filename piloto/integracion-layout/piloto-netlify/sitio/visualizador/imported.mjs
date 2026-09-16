// Draw saved vectors, not a guessed manufactured part. Depth is used only when explicitly saved.
export function importedGeometry(piece, index) {
  const number = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1000) throw Error('coordenada inválida');
    return value;
  };
  const x = number(piece.x), y = number(piece.y), z = number(piece.z ?? 0);
  if (piece.orientacion != null && !['x', 'z'].includes(piece.orientacion)) throw Error('orientación no admitida');
  const point = (u, v, w = 0) => piece.orientacion === 'z'
    ? [x + number(w), y + number(v), z + number(u)]
    : [x + number(u), y + number(v), z + number(w)];
  const result = [];
  const line = (a, b, kind = 'imported') => {
    if (a.every((value, i) => value === b[i])) return;
    if (result.length >= 8000) throw Error('dibujo demasiado complejo');
    result.push({type: 'line', a, b, r: .006, kind, index});
  };
  // Placed drawing takes precedence over a later/source definition.
  const elements = piece._visual ?? piece._definicion?.vistas?.alzado?.elementos;
  if (!Array.isArray(elements) || !elements.length) throw Error('falta el dibujo guardado');
  if (elements.length > 2000) throw Error('dibujo demasiado complejo');
  for (const el of elements) {
    if (!el || typeof el !== 'object') throw Error('elemento inválido');
    let pts;
    if (el.tipo === 'linea') pts = [point(el.desde?.x, el.desde?.y), point(el.hasta?.x, el.hasta?.y)];
    else if (el.tipo === 'rectangulo') {
      const u = number(el.x), v = number(el.y), w = number(el.ancho), h = number(el.alto);
      if (w <= 0 || h <= 0) throw Error('rectángulo inválido');
      pts = [[u,v],[u+w,v],[u+w,v+h],[u,v+h],[u,v]].map(([a,b]) => point(a,b));
    } else if (el.tipo === 'polilinea') {
      if (!Array.isArray(el.puntos) || el.puntos.length < 2 || el.puntos.length > 2000) throw Error('polilínea inválida');
      pts = el.puntos.map(p => point(p.x, p.y));
    } else if (el.tipo === 'circulo') {
      const u = number(el.x), v = number(el.y), radius = number(el.radio);
      if (radius <= 0) throw Error('radio inválido');
      pts = Array.from({length: 49}, (_, i) => point(u + radius * Math.cos(i * Math.PI / 24), v + radius * Math.sin(i * Math.PI / 24)));
    } else throw Error('tipo de dibujo no admitido');
    for (let i = 1; i < pts.length; i++) line(pts[i-1], pts[i]);
  }
  if (!result.length) throw Error('dibujo sin segmentos');
  let representation = 'outline';
  const dims = piece._definicion?.dimensiones;
  const validDims = dims && ['largo','alto','profundidad'].every(key =>
    typeof dims[key] === 'number' && Number.isFinite(dims[key]) && dims[key] > 0 && dims[key] <= 50);
  if (validDims) {
    const {largo: l, alto: h, profundidad: d} = dims;
    const corners = [[0,0,0],[l,0,0],[l,h,0],[0,h,0],[0,0,d],[l,0,d],[l,h,d],[0,h,d]].map(p => point(...p));
    for (const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]) line(corners[a],corners[b], 'envelope');
    representation = 'envelope';
  }
  return {primitives: result, representation};
}
