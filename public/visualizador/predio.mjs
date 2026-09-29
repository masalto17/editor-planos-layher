import { esFestival, esArea, esRecorrido, dimsDe, localAMundo, puntosAbs, superficie, largoPolilinea, centroide } from '../compartido/entidades.js';

const f = v => v.toLocaleString('es-AR', { maximumFractionDigits: 2 });

// Proporciones internas del antiavalancha medidas sobre las fotos reales y el croquis lateral
// (fracciones del fondo y del alto). Solo ubican placa, panel, tornapuntas y escalón dentro de
// la envolvente confirmada: no son datos de la pieza ni entran en ningún cómputo.
// La ficha puede traer su propio `esquema`; este es el valor por defecto.
const ESQUEMA_ANTIAVALANCHA = { panel: 0.66, escalon: 0.39, tornapunta: 0.97, tornapuntaU: 0.2 };
const PASO_BARROTES = 0.15; // visual: el relleno real de la reja está pendiente

// Proporciones del grupo electrógeno medidas sobre la foto de frente (fracciones del largo u y
// del alto v). Solo ubican bancada, puertas y tablero dentro de la envolvente de la ficha.
const ESQUEMA_GENERADOR = {
  apoyo: 0.03, bancada: 0.23,
  puertas: [[0.05, 0.31], [0.33, 0.53], [0.58, 0.79]], puertaV: [0.34, 0.94],
  tablero: { u: 0.12, v: 0.78, lado: 0.08 }, franja: [0.87, 0.95],
};

// Caja en coordenadas locales (u, v, w) con sus 6 caras.
function caja(W, face, [u0, u1], [v0, v1], [w0, w1], kind) {
  const b = [[u0, v0, w0], [u1, v0, w0], [u1, v1, w0], [u0, v1, w0], [u0, v0, w1], [u1, v0, w1], [u1, v1, w1], [u0, v1, w1]].map(([u, v, w]) => W(u, v, w));
  [[0, 1, 2, 3], [4, 5, 6, 7], [3, 2, 6, 7], [0, 1, 5, 4], [0, 3, 7, 4], [1, 2, 6, 5]].forEach(q => face(q.map(k => b[k]), kind));
}

function generador(d, def, W, face, line, label) {
  const E = ESQUEMA_GENERADOR, L = d.ancho, H = d.alto, hu = L / 2, hw = d.profundidad / 2;
  const U = t => -hu + t * L;
  const vb = H * E.bancada, va = H * E.apoyo;
  for (const t of [0.25, 0.75]) caja(W, face, [U(t) - 0.12, U(t) + 0.12], [0, va], [-hw + 0.05, hw - 0.05], 'generadorBase');
  caja(W, face, [-hu, hu], [va, vb], [-hw, hw], 'generadorBase');
  const cabina = def.carroceria !== 'abierto';
  if (cabina) {
    caja(W, face, [-hu, hu], [vb, H], [-hw, hw], 'generadorCabina');
    const wf = hw + 0.006; // frente (tablero) en +w, hacia la vista de Alzado; apenas por delante de la cara
    for (const [a, b] of E.puertas) {
      const c = [W(U(a), H * E.puertaV[0], wf), W(U(b), H * E.puertaV[0], wf), W(U(b), H * E.puertaV[1], wf), W(U(a), H * E.puertaV[1], wf)];
      c.forEach((q, i) => line(q, c[(i + 1) % 4], 0.006, 'festivalNegro'));
    }
    const T = E.tablero, s = (T.lado * L) / 2;
    face([W(U(T.u) - s, H * T.v - s, wf), W(U(T.u) + s, H * T.v - s, wf), W(U(T.u) + s, H * T.v + s, wf), W(U(T.u) - s, H * T.v + s, wf)], 'generadorBase');
    face([W(U(E.franja[0]), vb, wf), W(U(E.franja[1]), vb, wf), W(U(E.franja[1]), H * 0.94, wf), W(U(E.franja[0]), H * 0.94, wf)], 'generadorBase');
  } else {
    // Abierto sobre bancada: bloque motor-alternador y radiador en un extremo, sin cabina.
    caja(W, face, [-hu + 0.1, hu - 0.35], [vb, H * 0.8], [-hw + 0.12, hw - 0.12], 'festival');
    caja(W, face, [hu - 0.3, hu - 0.12], [vb, H], [-hw + 0.05, hw - 0.05], 'generadorBase');
  }
  label(W(0, H + 0.45, 0), `GE ${def.electrico?.kVA ?? ''} kVA · ${cabina ? 'insonorizado' : 'abierto'}`);
}

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
    label([c.x, 0.6, c.z], `${p.codigo ? `${p.codigo} · ` : ''}${p.nombre} · ${f(superficie(pts))} m²`);
    return { primitives, labels, aviso: null };
  }

  if (esRecorrido(p)) {
    const pts = puntosAbs(p);
    const yc = typeof p.cota === 'number' ? p.cota : 0; // bandejas: altura sobre el terreno
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      line([a.x, yc + 0.05, a.z], [b.x, yc + 0.05, b.z], 0.05, 'route', { color: p.color });
      if (p.ancho) {
        const L = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = -(b.z - a.z) / L * p.ancho / 2, nz = (b.x - a.x) / L * p.ancho / 2;
        face([[a.x + nx, yc + 0.025, a.z + nz], [b.x + nx, yc + 0.025, b.z + nz], [b.x - nx, yc + 0.025, b.z - nz], [a.x - nx, yc + 0.025, a.z - nz]], 'area', { color: p.color });
      }
    }
    const m = pts[Math.floor(pts.length / 2)];
    label([m.x, yc + 0.6, m.z], `${p.codigo ? `${p.codigo} · ` : ''}${p.nombre} · ${f(largoPolilinea(pts))} m`);
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

  if (def.geometria === 'abertura') {
    // Portón / puerta: postes en los extremos y hojas cerradas en el plano del frente.
    const hojas = p.opciones?.hojas ?? 2, H = d.alto, paso = d.ancho / hojas;
    for (const u of [-hu, hu]) line(W(u, 0), W(u, H), 0.04, kind);
    for (let k = 0; k < hojas; k++) {
      const u0 = -hu + k * paso + 0.02, u1 = -hu + (k + 1) * paso - 0.02;
      const c = [W(u0, 0.05), W(u1, 0.05), W(u1, H - 0.02), W(u0, H - 0.02)];
      c.forEach((q, i) => line(q, c[(i + 1) % 4], 0.02, kind));
      line(W(u0, H / 2), W(u1, H / 2), 0.012, kind);
    }
    if (def.salidaEmergencia) label(W(0, H + 0.35), `${p.codigo ?? ''} Salida de emergencia`.trim());
    return { primitives, labels, representacion: 'esquema', aviso: `abertura paramétrica: luz libre ${f(d.ancho)} m, alto ${f(H)} m; hojas y postes esquemáticos.` };
  }

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
    // Lado público en -w: placa de piso lisa (el público la pisa y la carga).
    // Lado seguridad en +w: dos tornapuntas interiores y el escalón entre ellas.
    const E = { ...ESQUEMA_ANTIAVALANCHA, ...(def.esquema ?? {}) };
    const H = d.alto, wp = -hw + d.profundidad * E.panel;
    const negro = def.acabado === 'negro', chapa = negro ? 'chapaNegra' : 'chapaPlata', placa = negro ? 'placaNegra' : 'placaPlata';
    face([W(-hu, 0.02, -hw), W(hu, 0.02, -hw), W(hu, 0.02, wp), W(-hu, 0.02, wp)], placa);
    const marco = [W(-hu, 0, wp), W(hu, 0, wp), W(hu, H, wp), W(-hu, H, wp)];
    marco.forEach((q, i) => line(q, marco[(i + 1) % 4], 0.022, kind));
    face([W(-hu + 0.02, 0.02, wp), W(hu - 0.02, 0.02, wp), W(hu - 0.02, H - 0.02, wp), W(-hu + 0.02, H - 0.02, wp)], chapa);
    const ut = d.ancho * E.tornapuntaU, vt = H * E.tornapunta, ve = H * E.escalon;
    for (const u of [-ut, ut]) {
      line(W(u, 0, wp), W(u, vt, wp), 0.018, kind);
      line(W(u, vt, wp), W(u, 0, hw), 0.022, kind);
      line(W(u, 0.02, wp), W(u, 0.02, hw), 0.022, kind);
    }
    const we = wp + (hw - wp) * (1 - ve / vt); // el escalón llega hasta la tornapunta
    face([W(-ut, ve, wp), W(ut, ve, wp), W(ut, ve, we), W(-ut, ve, we)], placa);
    return {
      primitives, labels, representacion: 'esquema',
      aviso: `${f(d.ancho)} × ${f(H)} × ${f(d.profundidad)} m confirmados; placa, panel, tornapuntas y escalón en proporción según fotos y croquis de MasAlto.`,
    };
  }

  if (def.familia === 'generador') {
    generador(d, def, W, face, line, label);
    return {
      primitives, labels, representacion: 'esquema',
      aviso: `${f(d.ancho)} × ${f(d.alto)} × ${f(d.profundidad)} m según ficha; puertas, tablero y bancada en proporción esquemática según la foto.`,
    };
  }

  const box = [[-hu, 0, -hw], [hu, 0, -hw], [hu, d.alto, -hw], [-hu, d.alto, -hw], [-hu, 0, hw], [hu, 0, hw], [hu, d.alto, hw], [-hu, d.alto, hw]].map(([u, v, w]) => W(u, v, w));
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) line(box[a], box[b], 0.012, 'envelope');
  return { primitives, labels, representacion: 'esquema', aviso: `envolvente ${f(d.ancho)} × ${f(d.alto)} × ${f(d.profundidad)} m; forma real pendiente de referencia.` };
}
