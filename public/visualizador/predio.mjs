import { esFestival, esArea, esRecorrido, dimsDe, localAMundo, puntosAbs } from '../compartido/entidades.js';

// Geometría 3D de entidades de predio a partir de la ficha guardada en cada instancia.
// Solo se dibujan medidas confirmadas; lo que falta se informa como aviso, no se supone.
export function geometriaPredio(p, index) {
  const primitives = [];
  const line = (a, b, r = 0.02, kind = 'festival') => primitives.push({ type: 'line', a, b, r, kind, index });
  const face = (pts, kind) => primitives.push({ type: 'face', pts, kind, index });

  if (esArea(p)) {
    const pts = puntosAbs(p);
    if (pts.length < 3) return { primitives, aviso: 'área sin vértices suficientes.' };
    face(pts.map(q => [q.x, 0.02, q.z]), 'area');
    pts.forEach((q, i) => { const n = pts[(i + 1) % pts.length]; line([q.x, 0.03, q.z], [n.x, 0.03, n.z], 0.025, 'route'); });
    return { primitives, aviso: null };
  }

  if (esRecorrido(p)) {
    const pts = puntosAbs(p);
    for (let i = 1; i < pts.length; i++) line([pts[i - 1].x, 0.04, pts[i - 1].z], [pts[i].x, 0.04, pts[i].z], 0.05, 'route');
    return { primitives, aviso: p.ancho == null ? 'recorrido sin ancho útil informado: se dibuja su eje.' : null };
  }

  if (!esFestival(p)) return { primitives, aviso: null };
  const d = dimsDe(p);
  const def = p._def ?? {};
  if (d.ancho == null || d.alto == null) {
    return { primitives, aviso: 'sin dimensiones confirmadas: no se dibuja un volumen supuesto.' };
  }
  const y0 = p.y ?? 0;
  const W = (u, v, w = 0) => { const q = localAMundo(p, u, w); return [q.x, y0 + v, q.z]; };
  const hu = d.ancho / 2;

  if (d.profundidad == null) {
    // Solo el plano del frente: marco rectangular. Bases, relleno y fondo pendientes.
    const c = [W(-hu, 0), W(hu, 0), W(hu, d.alto), W(-hu, d.alto)];
    c.forEach((q, i) => line(q, c[(i + 1) % 4], 0.02));
    return { primitives, aviso: 'marco esquemático del frente; bases, relleno y profundidad pendientes.' };
  }

  const hw = d.profundidad / 2;
  const box = [[-hu, 0, -hw], [hu, 0, -hw], [hu, d.alto, -hw], [-hu, d.alto, -hw], [-hu, 0, hw], [hu, 0, hw], [hu, d.alto, hw], [-hu, d.alto, hw]]
    .map(([u, v, w]) => W(u, v, w));
  if (def.familia === 'tarima') {
    [[0, 1, 2, 3], [4, 5, 6, 7], [3, 2, 6, 7], [0, 1, 5, 4], [0, 3, 7, 4], [1, 2, 6, 5]].forEach(f => face(f.map(k => box[k]), 'deck'));
    return { primitives, aviso: 'tarima genérica: volumen sin patas ni estructura.' };
  }
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) line(box[a], box[b], 0.012, 'envelope');
  const f = v => v.toLocaleString('es-AR');
  return { primitives, aviso: `envolvente ${f(d.ancho)} × ${f(d.alto)} × ${f(d.profundidad)} m; perfil real pendiente de referencia.` };
}
