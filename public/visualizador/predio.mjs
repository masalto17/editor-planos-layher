import { esFestival, esArea, esRecorrido, dimsDe, localAMundo, puntosAbs, superficie, largoPolilinea, centroide } from '../compartido/entidades.js';

const f = v => v.toLocaleString('es-AR', { maximumFractionDigits: 2 });

// Proporciones internas del antiavalancha tomadas de la referencia visual (sin escala).
// Solo ubican placa, panel y escalón dentro de la envolvente confirmada: no son datos
// de la pieza ni entran en ningún cómputo.
const ESQUEMA_ANTIAVALANCHA = { panel: 0.55, escalon: 0.36, tornapunta: 0.85 };
const PASO_BARROTES = 0.15; // visual: el relleno real de la reja está pendiente

// Geometría 3D de entidades de predio a partir de la ficha guardada en cada instancia.
// Las medidas confirmadas se respetan; lo que falta se informa como aviso, no se supone.
export function geometriaPredio(p, index) {
  const primitives = [], labels = [];
  const line = (a, b, r = 0.02, kind = 'festival', extra) => primitives.push({ type: 'line', a, b, r, kind, index, ...extra });
  const face = (pts, kind, extra) => primitives.push({ type: 'face', pts, kind, index, ...extra });
  const label = (pos, text) => labels.push({ pos, text, index });

  if (esArea(p)) {
    const pts = puntosAbs(p);
    if (pts.length < 3) return { primitives, labels, aviso: 'área sin vértices suficientes.' };
    face(pts.map(q => [q.x, 0.02, q.z]), 'area', { color: p.color });
    pts.forEach((q, i) => { const n = pts[(i + 1) % pts.length]; line([q.x, 0.03, q.z], [n.x, 0.03, n.z], 0.03, 'route', { color: p.color }); });
    const c = centroide(pts);
    label([c.x, 0.6, c.z], `${p.nombre} · ${f(superficie(pts))} m²`);
    return { primitives, labels, aviso: null };
  }

  if (esRecorrido(p)) {
    const pts = puntosAbs(p);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      line([a.x, 0.05, a.z], [b.x, 0.05, b.z], 0.05, 'route', { color: p.color });
      if (p.ancho) {
        const L = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = -(b.z - a.z) / L * p.ancho / 2, nz = (b.x - a.x) / L * p.ancho / 2;
        face([[a.x + nx, 0.025, a.z + nz], [b.x + nx, 0.025, b.z + nz], [b.x - nx, 0.025, b.z - nz], [a.x - nx, 0.025, a.z - nz]], 'area', { color: p.color });
      }
    }
    const m = pts[Math.floor(pts.length / 2)];
    label([m.x, 0.6, m.z], `${p.nombre} · ${f(largoPolilinea(pts))} m`);
    return { primitives, labels, aviso: p.ancho == null ? 'recorrido sin ancho útil informado: se dibuja su eje.' : null };
  }

  if (!esFestival(p)) return { primitives, labels, aviso: null };
  const d = dimsDe(p);
  const def = p._def ?? {};
  const y0 = p.y ?? 0;
  const W = (u, v, w = 0) => { const q = localAMundo(p, u, w); return [q.x, y0 + v, q.z]; };

  // Sin medidas: marcador rotulado en la posición, nunca un volumen supuesto.
  if (d.ancho == null || d.alto == null) {
    line(W(0, 0), W(0, 2.2), 0.035, 'marker');
    label(W(0, 2.6), `${def.nombre ?? p.nombre} · sin dimensiones`);
    return { primitives, labels, representacion: 'marcador', aviso: 'sin dimensiones confirmadas: se marca la posición, no se dibuja un volumen supuesto.' };
  }

  const kind = def.acabado === 'negro' ? 'festivalNegro' : 'festival';
  const hu = d.ancho / 2;

  if (d.profundidad == null) {
    // Reja: marco y barrotes en el plano del frente. Bases y profundidad pendientes.
    const c = [W(-hu, 0), W(hu, 0), W(hu, d.alto), W(-hu, d.alto)];
    c.forEach((q, i) => line(q, c[(i + 1) % 4], 0.02, kind));
    const n = Math.max(2, Math.round(d.ancho / PASO_BARROTES));
    for (let k = 1; k < n; k++) { const u = -hu + (k * d.ancho) / n; line(W(u, 0), W(u, d.alto), 0.008, kind); }
    return { primitives, labels, representacion: 'esquema', aviso: 'marco y barrotes esquemáticos; bases, relleno y profundidad pendientes.' };
  }

  const hw = d.profundidad / 2;
  if (def.familia === 'tarima') {
    const e = Math.min(0.05, d.alto), yt = d.alto - e;
    const b = [[-hu, yt, -hw], [hu, yt, -hw], [hu, d.alto, -hw], [-hu, d.alto, -hw], [-hu, yt, hw], [hu, yt, hw], [hu, d.alto, hw], [-hu, d.alto, hw]].map(([u, v, w]) => W(u, v, w));
    [[0, 1, 2, 3], [4, 5, 6, 7], [3, 2, 6, 7], [0, 1, 5, 4], [0, 3, 7, 4], [1, 2, 6, 5]].forEach(q => face(q.map(k => b[k]), 'deck'));
    if (yt > 0.02) for (const [u, w] of [[-hu + 0.05, -hw + 0.05], [hu - 0.05, -hw + 0.05], [hu - 0.05, hw - 0.05], [-hu + 0.05, hw - 0.05]]) line(W(u, 0, w), W(u, yt, w), 0.025, 'festival');
    return { primitives, labels, representacion: 'esquema', aviso: 'tarima genérica: tablero y patas esquemáticos, sin estructura de un sistema comercial.' };
  }

  if (def.familia === 'valladoAntiavalancha') {
    // Frente público en -w (placa de piso), seguridad en +w (tornapuntas y escalón).
    const E = ESQUEMA_ANTIAVALANCHA;
    const wp = -hw + d.profundidad * E.panel;
    face([W(-hu, 0.03, -hw), W(hu, 0.03, -hw), W(hu, 0.03, wp), W(-hu, 0.03, wp)], 'plate');
    for (let k = 1; k < 8; k++) { const w = -hw + (k * (wp + hw)) / 8; line(W(-hu, 0.035, w), W(hu, 0.035, w), 0.006, kind); }
    const marco = [W(-hu, 0, wp), W(hu, 0, wp), W(hu, d.alto, wp), W(-hu, d.alto, wp)];
    marco.forEach((q, i) => line(q, marco[(i + 1) % 4], 0.025, kind));
    for (const v of [d.alto * 0.33, d.alto * 0.66]) line(W(-hu, v, wp), W(hu, v, wp), 0.014, kind);
    const n = Math.round(d.ancho / 0.08);
    for (let k = 1; k < n; k++) { const u = -hu + (k * d.ancho) / n; line(W(u, 0, wp), W(u, d.alto, wp), 0.004, kind); }
    for (const u of [-hu + 0.06, hu - 0.06]) {
      line(W(u, d.alto * E.tornapunta, wp), W(u, 0, hw), 0.022, kind);
      line(W(u, 0.02, wp), W(u, 0.02, hw), 0.022, kind);
    }
    const we = wp + (hw - wp) * 0.5;
    face([W(-hu + 0.06, d.alto * E.escalon, wp), W(hu - 0.06, d.alto * E.escalon, wp), W(hu - 0.06, d.alto * E.escalon, we), W(-hu + 0.06, d.alto * E.escalon, we)], 'plate');
    return {
      primitives, labels, representacion: 'esquema',
      aviso: `${f(d.ancho)} × ${f(d.alto)} × ${f(d.profundidad)} m confirmados; placa, panel y escalón en proporción esquemática según la referencia visual.`,
    };
  }

  const box = [[-hu, 0, -hw], [hu, 0, -hw], [hu, d.alto, -hw], [-hu, d.alto, -hw], [-hu, 0, hw], [hu, 0, hw], [hu, d.alto, hw], [-hu, d.alto, hw]].map(([u, v, w]) => W(u, v, w));
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) line(box[a], box[b], 0.012, 'envelope');
  return { primitives, labels, representacion: 'esquema', aviso: `envolvente ${f(d.ancho)} × ${f(d.alto)} × ${f(d.profundidad)} m; forma real pendiente de referencia.` };
}
