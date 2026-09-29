import { useState, useMemo } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import { CAPAS, ESTADOS, USOS_AREA, USOS_RECORRIDO } from '../catalogo/festival.js';
import { capaDe, esFestival, esArea, esRecorrido, dimsDe, puntosAbs, superficie, largoPolilinea, normRot } from '../modelo/entidades.js';

const fmt = v => (v == null ? 'Sin dato' : v.toLocaleString('es-AR', { maximumFractionDigits: 2 }));
const SIN_DATO = <span className="text-amber-700 font-semibold">Sin dato</span>;

export function PanelCapas({ capas, toggleCapa, piezas }) {
  const [abierto, setAbierto] = useState(false);
  const cuenta = useMemo(() => {
    const m = {};
    piezas.forEach(p => { const c = capaDe(p); m[c] = (m[c] || 0) + 1; });
    return m;
  }, [piezas]);
  const ocultas = CAPAS.filter(c => capas[c.id]?.visible === false).length;
  return (
    <div className="bg-white/95 border border-gray-300 rounded shadow-sm text-[11px] w-48">
      <button onClick={() => setAbierto(a => !a)} className="w-full flex items-center gap-1.5 px-2 py-1 font-bold text-gray-700 hover:bg-gray-50">
        {abierto ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <Layers size={12} /> Capas
        {ocultas > 0 && <span className="ml-auto text-[9px] bg-gray-700 text-white px-1.5 rounded-full">{ocultas} oculta{ocultas > 1 ? 's' : ''}</span>}
      </button>
      {abierto && (
        <ul className="border-t border-gray-200 py-0.5">
          {CAPAS.map(c => {
            const st = capas[c.id] ?? { visible: true, bloqueada: false };
            return (
              <li key={c.id} className="flex items-center gap-1.5 px-2 py-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                <span className={`flex-1 truncate ${st.visible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{c.label}</span>
                <span className="text-[9px] text-gray-400 tabular-nums w-5 text-right">{cuenta[c.id] || ''}</span>
                <button onClick={() => toggleCapa(c.id, 'visible')} title={st.visible ? 'Ocultar capa' : 'Mostrar capa'}
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-500">
                  {st.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>
                <button onClick={() => toggleCapa(c.id, 'bloqueada')} title={st.bloqueada ? 'Desbloquear capa' : 'Bloquear capa'}
                  className={`p-0.5 rounded hover:bg-gray-100 ${st.bloqueada ? 'text-red-600' : 'text-gray-400'}`}>
                  {st.bloqueada ? <Lock size={11} /> : <Unlock size={11} />}
                </button>
              </li>
            );
          })}
          <li className="px-2 pt-1 text-[9px] text-gray-400">Ocultar una capa no la quita del despiece.</li>
        </ul>
      )}
    </div>
  );
}

// Campo numérico que confirma al salir o con Enter (una sola entrada en el historial).
function CampoNumero({ id, valor, onCommit, paso = 0.01, min, max, sufijo, vacioPermitido }) {
  return (
    <span className="inline-flex items-center gap-1">
      <input id={id} key={`${id}:${valor}`} type="number" step={paso} min={min} max={max}
        defaultValue={valor ?? ''} placeholder={vacioPermitido ? 'Sin dato' : ''}
        className="w-20 px-1 py-0.5 border border-gray-300 rounded text-[11px] font-mono"
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); e.stopPropagation(); }}
        onBlur={e => {
          const t = e.currentTarget.value.trim();
          if (t === '') { if (vacioPermitido && valor != null) onCommit(null); return; }
          let v = Number(t);
          if (!Number.isFinite(v)) return;
          if (min != null) v = Math.max(min, v);
          if (max != null) v = Math.min(max, v);
          if (v !== valor) onCommit(v);
        }} />
      {sufijo && <span className="text-gray-400">{sufijo}</span>}
    </span>
  );
}

function CampoTexto({ id, valor, onCommit, multilinea }) {
  const props = {
    id, defaultValue: valor ?? '',
    className: 'w-full px-1 py-0.5 border border-gray-300 rounded text-[11px]',
    onKeyDown: e => { if (e.key === 'Enter' && !multilinea) e.currentTarget.blur(); e.stopPropagation(); },
    onBlur: e => { const t = e.currentTarget.value.trim(); if (t !== (valor ?? '')) onCommit(t || null); },
  };
  const k = `${id}:${valor}`;
  return multilinea ? <textarea key={k} rows={2} {...props} /> : <input key={k} type="text" {...props} />;
}

function Fila({ label, children }) {
  return (
    <div className="grid grid-cols-[76px_1fr] gap-1.5 items-center py-0.5">
      <span className="text-gray-500">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SelectCapa({ id, valor, onChange }) {
  return (
    <select id={id} value={valor} onChange={e => onChange(e.target.value)} className="w-full px-1 py-0.5 border border-gray-300 rounded text-[11px]">
      {CAPAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
    </select>
  );
}

export function PanelPropiedades({ piezas, piezasSeleccionadas, actualizarPiezas }) {
  const [verPendientes, setVerPendientes] = useState(false);
  const sel = piezas.filter(p => piezasSeleccionadas.includes(p.id));
  // Conjunto (torre) seleccionado entero: resumen del grupo.
  const g = sel[0]?.grupo;
  if (g && sel.length > 1 && sel.every(p => p.grupo?.id === g.id)) {
    const peso = Math.round(sel.reduce((t, p) => t + (p.peso ?? 0), 0) * 10) / 10;
    const porCat = sel.reduce((m, p) => { m[p.nombre] = (m[p.nombre] || 0) + 1; return m; }, {});
    return (
      <div className="bg-white/97 border border-gray-300 rounded shadow-sm text-[11px] w-64 p-2 space-y-1">
        <div className="font-bold text-gray-800">{g.codigo} · {g.nombre}</div>
        <Fila label="Piezas"><span className="font-mono">{sel.length}</span></Fila>
        <Fila label="Peso"><span className="font-mono">{fmt(peso)} kg</span></Fila>
        <ul className="text-[10px] text-gray-600 max-h-28 overflow-y-auto">
          {Object.entries(porCat).map(([n, c]) => <li key={n} className="flex justify-between"><span className="truncate">{n}</span><span className="font-mono">×{c}</span></li>)}
        </ul>
        <div className="text-[9px] text-gray-400">Piezas Layher de catálogo. ⇧clic selecciona una pieza suelta.</div>
      </div>
    );
  }
  if (sel.length !== 1) return null;
  const p = sel[0];
  if (!esFestival(p) && !esArea(p) && !esRecorrido(p)) return null;
  const upd = cambios => actualizarPiezas([p.id], cambios);
  const idb = `prop-${p.id}`;

  if (esFestival(p)) {
    const def = p._def ?? {};
    const est = ESTADOS[def.estado];
    const d = dimsDe(p);
    const param = !!def.parametrico;
    const dimCampo = k => param
      ? <CampoNumero id={`${idb}-${k}`} valor={d[k]} min={def.rangos?.[k]?.[0]} max={def.rangos?.[k]?.[1]} sufijo="m"
          onCommit={v => upd(q => { const dims = { ...(q.dims ?? {}), [k]: v }; return k === 'ancho' ? { dims, largo: v } : { dims }; })} />
      : (d[k] == null ? SIN_DATO : <span className="font-mono">{fmt(d[k])} m</span>);
    return (
      <div className="bg-white/97 border border-gray-300 rounded shadow-sm text-[11px] w-64 p-2 space-y-1">
        <div className="flex items-start gap-1.5">
          <span className="font-bold text-gray-800 leading-tight flex-1">{def.nombre}</span>
          {est && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: est.color }}>{est.label}</span>}
        </div>
        <Fila label="Código"><CampoTexto id={`${idb}-cod`} valor={p.codigo} onCommit={v => v && upd({ codigo: v })} /></Fila>
        <Fila label="Nombre"><CampoTexto id={`${idb}-nom`} valor={p.nombre} onCommit={v => upd({ nombre: v ?? def.nombre })} /></Fila>
        {def.opciones?.map(o => (
          <Fila key={o.clave} label={o.label}>
            <select id={`${idb}-op-${o.clave}`} value={String(p.opciones?.[o.clave] ?? o.defecto)} className="w-full px-1 py-0.5 border border-gray-300 rounded text-[11px]"
              onChange={e => { const v = o.valores.find(([k]) => String(k) === e.target.value)[0]; upd(q => ({ opciones: { ...(q.opciones ?? {}), [o.clave]: v } })); }}>
              {o.valores.map(([k, l]) => <option key={k} value={String(k)}>{l}</option>)}
            </select>
          </Fila>
        ))}
        {(def.marca || def.modelo || def.variante || def.acabado) && (
          <Fila label="Modelo">
            <span>{[def.marca, def.modelo ?? (def.marca ? 'modelo pendiente' : null), def.variante, def.acabado].filter(Boolean).join(' · ')}</span>
          </Fila>
        )}
        <Fila label="Frente (u)">{dimCampo('ancho')}</Fila>
        <Fila label="Alto">{dimCampo('alto')}</Fila>
        <Fila label="Fondo (w)">{dimCampo('profundidad')}</Fila>
        <Fila label="Peso">{p.peso == null ? SIN_DATO : <span className="font-mono">{fmt(p.peso)} kg</span>}</Fila>
        {def.electrico && (
          <Fila label="Potencia">
            <span className="font-mono">{def.electrico.kVA ?? '—'} kVA · </span>{def.electrico.kW == null ? SIN_DATO : <span className="font-mono">{def.electrico.kW} kW</span>}
          </Fila>
        )}
        {def.electrico && 'depositoL' in def.electrico && (
          <Fila label="Depósito">{def.electrico.depositoL == null ? SIN_DATO : <span className="font-mono">{def.electrico.depositoL} L</span>}</Fila>
        )}
        <Fila label="Rotación"><CampoNumero id={`${idb}-rot`} valor={p.rot ?? 0} paso={1} sufijo="°  (R / ⇧R)" onCommit={v => upd({ rot: normRot(v) })} /></Fila>
        <Fila label="Cota apoyo"><CampoNumero id={`${idb}-y`} valor={p.y ?? 0} min={0} sufijo="m" onCommit={v => upd({ y: v })} /></Fila>
        <Fila label="Capa"><SelectCapa id={`${idb}-capa`} valor={capaDe(p)} onChange={v => upd({ capa: v })} /></Fila>
        <Fila label="Notas"><CampoTexto id={`${idb}-obs`} valor={p.obs} onCommit={v => upd({ obs: v })} multilinea /></Fila>
        {def.pendientes?.length > 0 && (
          <div className="pt-1 border-t border-gray-100">
            <button onClick={() => setVerPendientes(v => !v)} className="flex items-center gap-1 text-amber-700 font-semibold">
              {verPendientes ? <ChevronDown size={10} /> : <ChevronRight size={10} />} {def.pendientes.length} dato(s) pendiente(s)
            </button>
            {verPendientes && <ul className="list-disc pl-4 text-gray-600 mt-0.5">{def.pendientes.map(t => <li key={t}>{t}</li>)}</ul>}
          </div>
        )}
      </div>
    );
  }

  const usos = esArea(p) ? USOS_AREA : USOS_RECORRIDO;
  const abs = puntosAbs(p);
  return (
    <div className="bg-white/97 border border-gray-300 rounded shadow-sm text-[11px] w-64 p-2 space-y-1">
      <div className="font-bold text-gray-800">{esArea(p) ? 'Área' : 'Recorrido'}</div>
      <Fila label="Código"><CampoTexto id={`${idb}-cod`} valor={p.codigo} onCommit={v => v && upd({ codigo: v })} /></Fila>
      <Fila label="Nombre"><CampoTexto id={`${idb}-nom`} valor={p.nombre} onCommit={v => upd({ nombre: v ?? p.nombre })} /></Fila>
      <Fila label="Uso">
        <select id={`${idb}-uso`} value={p.uso} className="w-full px-1 py-0.5 border border-gray-300 rounded text-[11px]"
          onChange={e => {
            const u = usos.find(x => x.id === e.target.value);
            const antes = usos.find(x => x.id === p.uso);
            upd({ uso: u.id, color: u.color, capa: u.capa, ...(p.nombre === antes?.label ? { nombre: u.label } : {}) });
          }}>
          {usos.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
      </Fila>
      {esArea(p)
        ? <Fila label="Superficie"><span className="font-mono">{fmt(superficie(abs))} m²</span> <span className="text-gray-400">bruta</span></Fila>
        : <>
            <Fila label="Largo"><span className="font-mono">{fmt(largoPolilinea(abs))} m</span></Fila>
            <Fila label="Ancho útil"><CampoNumero id={`${idb}-ancho`} valor={p.ancho} min={0.1} sufijo="m" vacioPermitido onCommit={v => upd({ ancho: v })} /></Fila>
            <Fila label="Sentido">
              <select id={`${idb}-sentido`} value={p.sentido ?? ''} className="w-full px-1 py-0.5 border border-gray-300 rounded text-[11px]"
                onChange={e => upd({ sentido: e.target.value || null })}>
                <option value="">Sin indicar</option><option value="ida">Del primer punto al último</option>
                <option value="vuelta">Del último punto al primero</option><option value="doble">Doble sentido</option>
              </select>
            </Fila>
            <Fila label="Cota"><CampoNumero id={`${idb}-cota`} valor={p.cota ?? null} min={0} sufijo="m" vacioPermitido onCommit={v => upd({ cota: v })} /></Fila>
          </>}
      <Fila label="Capa"><SelectCapa id={`${idb}-capa`} valor={capaDe(p)} onChange={v => upd({ capa: v })} /></Fila>
      <Fila label="Notas"><CampoTexto id={`${idb}-obs`} valor={p.obs} onCommit={v => upd({ obs: v })} multilinea /></Fila>
      <div className="text-[9px] text-gray-400 pt-0.5">No suma materiales. {esArea(p) ? 'Aforo y superficie neta: próxima fase.' : ''}</div>
    </div>
  );
}
