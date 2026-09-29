import { ESTADOS, definicionPorId } from '../catalogo/festival.js';
import {
  esFestival, esArea, esRecorrido, huellaXZ, localAMundo, dimsDe, puntosAbs, superficie, largoPolilinea,
  centroide, valladoPorRecorrido,
} from '../modelo/entidades.js';

const fmt = v => v.toLocaleString('es-AR', { maximumFractionDigits: 2 });
const SEL = '#E30613';
const aPantalla = (worldToScreen, q) => worldToScreen(q.x, q.z);

function Etiqueta({ x, y, texto, color = '#111', size = 10, fondo = true }) {
  const w = texto.length * size * 0.58 + 6;
  return (
    <g pointerEvents="none">
      {fondo && <rect x={x - w / 2} y={y - size * 0.8} width={w} height={size * 1.25} rx="2" fill="white" fillOpacity="0.85" />}
      <text x={x} y={y + size * 0.2} fontSize={size} fill={color} textAnchor="middle" fontFamily="monospace" fontWeight="bold">{texto}</text>
    </g>
  );
}

function PiezaFestivalPlanta({ pieza, worldToScreen, zoom, seleccionada, op, cur, onMouseDown, modoTecnico }) {
  const def = pieza._def ?? {};
  const color = seleccionada ? SEL : modoTecnico ? '#222' : (pieza.color ?? '#555');
  const estado = ESTADOS[def.estado];
  const provisional = def.estado !== 'validado';
  const h = huellaXZ(pieza);
  const c = worldToScreen(pieza.x, pieza.z ?? 0);

  // Volumen sin dimensiones: símbolo de tamaño fijo en pantalla, rotulado «sin escala».
  if (!h) {
    const s = 16;
    const kva = def.electrico?.kVA;
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        <rect x={c.x - s} y={c.y - s} width={s * 2} height={s * 2} fill={color} fillOpacity="0.12"
          stroke={color} strokeWidth={seleccionada ? 2.5 : 1.5} strokeDasharray="4 3" />
        <text x={c.x} y={c.y + 1} fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold" fill={color}>
          {def.familia === 'generador' ? 'GE' : '?'}
        </text>
        {kva != null && <text x={c.x} y={c.y + 11} fontSize="7" textAnchor="middle" fontFamily="monospace" fill={color}>{kva} kVA</text>}
        <Etiqueta x={c.x} y={c.y + s + 10} texto="sin dimensiones · sin escala" color={estado?.color ?? '#666'} size={8} />
      </g>
    );
  }

  const pts = h.puntos.map(q => worldToScreen(q.x, q.z));
  const { ancho } = dimsDe(pieza);
  const sw = Math.max(1, zoom * 0.02);

  // Portón o puerta: postes en los extremos y barrido de cada hoja (luz libre / hojas).
  if (def.geometria === 'abertura') {
    const hojas = pieza.opciones?.hojas ?? 2, s = (pieza.opciones?.abre ?? 'fondo') === 'fondo' ? 1 : -1;
    const hu = ancho / 2, R = ancho / hojas;
    const W = (u, w) => aPantalla(worldToScreen, localAMundo(pieza, u, w));
    const bisagras = hojas === 2 ? [[-hu, 1], [hu, -1]] : [[-hu, 1]];
    const a = W(-hu, 0), b = W(hu, 0), post = Math.max(3, zoom * 0.08);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="12" />
        {seleccionada && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={SEL} strokeWidth="8" opacity="0.25" />}
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="1" strokeDasharray="3 3" />
        {bisagras.map(([u0, dir], i) => {
          const arco = [...Array(9)].map((_, k) => { const t = (k / 8) * Math.PI / 2; const q = W(u0 + dir * R * Math.cos(t), s * R * Math.sin(t)); return `${q.x},${q.y}`; }).join(' ');
          const abierta = W(u0, s * R), gozne = W(u0, 0);
          return <g key={i}>
            <polyline points={arco} fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 3" />
            <line x1={gozne.x} y1={gozne.y} x2={abierta.x} y2={abierta.y} stroke={color} strokeWidth={Math.max(1.5, zoom * 0.03)} />
          </g>;
        })}
        {[a, b].map((q, i) => <rect key={i} x={q.x - post / 2} y={q.y - post / 2} width={post} height={post} fill={color} />)}
        {(seleccionada || zoom > 30) && <Etiqueta x={c.x} y={c.y + 12} texto={`${def.salidaEmergencia ? 'Salida emerg. · ' : ''}luz ${fmt(ancho)} m`} color={color} size={8} />}
      </g>
    );
  }

  // Sin profundidad confirmada: se dibuja la línea de frente, no una huella inventada.
  if (!h.profundidadConocida) {
    const a = aPantalla(worldToScreen, localAMundo(pieza, -ancho / 2, 0));
    const b = aPantalla(worldToScreen, localAMundo(pieza, ancho / 2, 0));
    const grosor = Math.max(3, zoom * 0.06);
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={Math.max(10, grosor + 6)} />
        {seleccionada && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={SEL} strokeWidth={grosor + 6} opacity="0.25" />}
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={grosor} strokeDasharray={provisional ? `${grosor * 2} ${grosor * 0.6}` : 'none'} />
        {[a, b].map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={grosor * 0.7} fill="white" stroke={color} strokeWidth="1" />)}
        {(seleccionada || zoom > 90) && <Etiqueta x={c.x} y={c.y - grosor - 6} texto={`${fmt(ancho)} m · prof. sin dato`} color={color} size={8} />}
      </g>
    );
  }

  const poly = pts.map(q => `${q.x},${q.y}`).join(' ');
  const esTarima = def.familia === 'tarima';
  // Antiavalancha: la flecha marca el lado público (placa de piso), según la referencia.
  const frentePub = def.familia === 'valladoAntiavalancha' ? (() => {
    const { profundidad } = dimsDe(pieza);
    const m = aPantalla(worldToScreen, localAMundo(pieza, 0, -profundidad / 2));
    const t = aPantalla(worldToScreen, localAMundo(pieza, 0, -profundidad / 2 - Math.min(0.5, 12 / zoom)));
    return { m, t };
  })() : null;
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <polygon points={poly} fill="none" stroke={SEL} strokeWidth={sw + 5} opacity="0.25" />}
      <polygon points={poly} fill={color} fillOpacity={esTarima ? 0.28 : 0.12} stroke={color} strokeWidth={sw}
        strokeDasharray={provisional ? `${Math.max(4, sw * 3)} ${Math.max(2, sw * 1.5)}` : 'none'} />
      {esTarima && <line x1={pts[0].x} y1={pts[0].y} x2={pts[2].x} y2={pts[2].y} stroke={color} strokeWidth={sw * 0.6} opacity="0.5" />}
      {esTarima && <line x1={pts[1].x} y1={pts[1].y} x2={pts[3].x} y2={pts[3].y} stroke={color} strokeWidth={sw * 0.6} opacity="0.5" />}
      {frentePub && zoom > 12 && (
        <line x1={frentePub.m.x} y1={frentePub.m.y} x2={frentePub.t.x} y2={frentePub.t.y} stroke={color} strokeWidth="1.2" markerEnd="url(#arrowR)" />
      )}
      {zoom > 25 && def.familia === 'generador' && <Etiqueta x={c.x} y={c.y} texto={`GE ${def.electrico?.kVA ?? ''} kVA`} color={color} size={8} />}
      {zoom > 40 && esTarima && <Etiqueta x={c.x} y={c.y} texto={`h ${fmt(dimsDe(pieza).alto)} m`} color={color} size={8} />}
    </g>
  );
}

function AreaPlanta({ pieza, worldToScreen, seleccionada, op, cur, onMouseDown, modoTecnico }) {
  const abs = puntosAbs(pieza);
  if (abs.length < 3) return null;
  const pts = abs.map(q => worldToScreen(q.x, q.z));
  const color = seleccionada ? SEL : modoTecnico ? '#444' : (pieza.color ?? '#94a3b8');
  const c = centroide(abs); const cs = worldToScreen(c.x, c.z);
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      <polygon points={pts.map(q => `${q.x},${q.y}`).join(' ')} fill={color} fillOpacity={modoTecnico ? 0.04 : 0.1}
        stroke={color} strokeWidth={seleccionada ? 2.5 : 1.5} strokeDasharray="8 4" pointerEvents="none" />
      {/* Se selecciona por el borde: el interior queda libre para colocar y seleccionar lo que contiene. */}
      <polygon points={pts.map(q => `${q.x},${q.y}`).join(' ')} fill="none" stroke="transparent" strokeWidth="10" pointerEvents="stroke" />
      <Etiqueta x={cs.x} y={cs.y - 6} texto={`${pieza.codigo ? `${pieza.codigo} · ` : ''}${pieza.nombre}`} color={color} size={11} />
      <Etiqueta x={cs.x} y={cs.y + 9} texto={`${fmt(superficie(abs))} m²`} color={color} size={9} />
    </g>
  );
}

// Flechas de sentido de circulación a mitad de cada tramo.
function FlechasSentido({ pts, sentido, color }) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.y - a.y);
    if (L < 30) continue;
    const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const flecha = (dir, off) => {
      const cx = mx + ux * off, cy = my + uy * off, tx = ux * dir, ty = uy * dir;
      return `M${cx - tx * 6 - ty * 5},${cy - ty * 6 + tx * 5} L${cx + tx * 6},${cy + ty * 6} L${cx - tx * 6 + ty * 5},${cy - ty * 6 - tx * 5}`;
    };
    if (sentido === 'ida' || sentido === 'doble') out.push(<path key={`i${i}`} d={flecha(1, sentido === 'doble' ? 10 : 0)} fill="none" stroke={color} strokeWidth="2" />);
    if (sentido === 'vuelta' || sentido === 'doble') out.push(<path key={`v${i}`} d={flecha(-1, sentido === 'doble' ? -10 : 0)} fill="none" stroke={color} strokeWidth="2" />);
  }
  return <g pointerEvents="none">{out}</g>;
}

function RecorridoPlanta({ pieza, worldToScreen, zoom, seleccionada, op, cur, onMouseDown, modoTecnico }) {
  const abs = puntosAbs(pieza);
  if (abs.length < 2) return null;
  const pts = abs.map(q => worldToScreen(q.x, q.z));
  const d = pts.map(q => `${q.x},${q.y}`).join(' ');
  const color = seleccionada ? SEL : modoTecnico ? '#333' : (pieza.color ?? '#2563eb');
  const banda = pieza.ancho ? pieza.ancho * zoom : 0;
  const i = Math.floor((pts.length - 1) / 2);
  const m = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      <polyline points={d} fill="none" stroke="transparent" strokeWidth={Math.max(12, banda)} />
      {banda > 0 && <polyline points={d} fill="none" stroke={color} strokeWidth={banda} strokeOpacity="0.14" strokeLinejoin="round" />}
      <polyline points={d} fill="none" stroke={color} strokeWidth={seleccionada ? 2.5 : 1.5} strokeDasharray="10 5" />
      {pieza.sentido && <FlechasSentido pts={pts} sentido={pieza.sentido} color={color} />}
      <Etiqueta x={m.x} y={m.y - 8} texto={`${pieza.codigo ? `${pieza.codigo} · ` : ''}${pieza.nombre} · ${fmt(largoPolilinea(abs))} m${pieza.ancho ? ` · ancho ${fmt(pieza.ancho)} m` : ' · ancho sin dato'}${pieza.cota != null ? ` · cota ${fmt(pieza.cota)} m` : ''}`} color={color} size={9} />
    </g>
  );
}

export default function EntidadPlanta(props) {
  const { pieza, fantasma } = props;
  const op = fantasma ? 0.45 : 1;
  const cur = fantasma ? 'none' : 'pointer';
  const p = { ...props, op, cur };
  if (esFestival(pieza)) {
    const c = props.worldToScreen(pieza.x, pieza.z ?? 0);
    return <g>
      <PiezaFestivalPlanta {...p} />
      {pieza.codigo && !fantasma && props.zoom > 20 && <Etiqueta x={c.x} y={c.y - 14} texto={pieza.codigo} color={props.seleccionada ? SEL : '#111'} size={8} />}
    </g>;
  }
  if (esArea(pieza)) return <AreaPlanta {...p} />;
  if (esRecorrido(pieza)) return <RecorridoPlanta {...p} />;
  return null;
}

// Vista previa del trazo en curso (área, recorrido o vallado por recorrido).
export function TrazoEnCurso({ herramienta, puntos, cursor, worldToScreen, zoom }) {
  const todos = cursor ? [...puntos, cursor] : puntos;
  if (!todos.length) return null;
  const pts = todos.map(q => worldToScreen(q.x, q.z));
  const cat = herramienta.categoria;
  const color = cat === 'area' ? '#7c3aed' : cat === 'recorrido' ? '#2563eb' : '#E30613';
  let informe = null, modulos = [];
  if (cat === 'valladoRecorrido' && todos.length >= 2) {
    try {
      const def = definicionPorId(herramienta.defId);
      const r = valladoPorRecorrido(todos, def);
      const half = def.dimensiones.ancho / 2;
      modulos = r.modulos.map(mo => {
        const t = mo.rot * Math.PI / 180;
        return [worldToScreen(mo.x - Math.cos(t) * half, mo.z - Math.sin(t) * half), worldToScreen(mo.x + Math.cos(t) * half, mo.z + Math.sin(t) * half)];
      });
      informe = `${r.cantidad} × ${def.variante} · ${fmt(r.largoNominal)} m nominal${r.remanenteTotal > 0 ? ` · ${fmt(r.remanenteTotal)} m sin cubrir` : ''}`;
    } catch { /* herramienta sin ancho */ }
  } else if (cat === 'area' && todos.length >= 3) {
    informe = `${fmt(superficie(todos))} m²`;
  } else if (todos.length >= 2) {
    informe = `${fmt(largoPolilinea(todos))} m`;
  }
  const ult = pts[pts.length - 1];
  return (
    <g pointerEvents="none">
      {cat === 'area' && pts.length >= 3 && <polygon points={pts.map(q => `${q.x},${q.y}`).join(' ')} fill={color} fillOpacity="0.08" stroke="none" />}
      <polyline points={pts.map(q => `${q.x},${q.y}`).join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="6 4" />
      {modulos.map(([a, b], i) => (
        <g key={i}>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#111" strokeWidth={Math.max(3, zoom * 0.05)} opacity="0.7" />
          <circle cx={a.x} cy={a.y} r="2" fill="white" stroke="#111" />
        </g>
      ))}
      {pts.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r="3.5" fill="white" stroke={color} strokeWidth="1.5" />)}
      {informe && <Etiqueta x={ult.x} y={ult.y - 14} texto={informe} color={color} size={10} />}
    </g>
  );
}

// Recuadro y rótulo de cada conjunto (torre) visible: código, uso y medidas.
export function EtiquetasConjuntos({ conjuntos, worldToScreen, seleccionadas }) {
  return <g pointerEvents="none">
    {conjuntos.map(g => {
      const a = worldToScreen(g.xMin, g.zMin), b = worldToScreen(g.xMax, g.zMax), sel = g.ids.some(id => seleccionadas.includes(id));
      const color = sel ? SEL : '#1e3a8a';
      return <g key={g.id}>
        <rect x={a.x - 6} y={a.y - 6} width={b.x - a.x + 12} height={b.y - a.y + 12} fill="none" stroke={color} strokeWidth={sel ? 1.5 : 1} strokeDasharray="2 3" />
        <Etiqueta x={(a.x + b.x) / 2} y={a.y - 14} texto={`${g.codigo ?? ''} · ${g.nombre}`} color={color} size={9} />
      </g>;
    })}
  </g>;
}
