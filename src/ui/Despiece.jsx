import { useMemo, useCallback, useState } from 'react';
import { X, Copy, CopyPlus, Trash2, FileSpreadsheet, ChevronDown, ChevronRight, Package, Weight, Layers, Keyboard } from 'lucide-react';
import { DESPIECE_ORDER } from '../catalogo/constantes.js';
import { CAT_KEYS } from '../catalogo/piezas.js';
import { CAT_KEYS_EVENTO } from '../catalogo/piezas.js';
import { resumenPeso, resumenVallado, resumenTrazos, computaMaterial } from '../modelo/entidades.js';
import { resumenConjuntos } from '../catalogo/torres.js';

const CAT_LABEL = { ...Object.fromEntries([...CAT_KEYS, ...CAT_KEYS_EVENTO].map(ck => [ck.cat, ck.label])), festival: '🎪 Predio / Festival' };
const kg = (v, dec = 1) => (v == null ? 'Sin dato' : `${v.toFixed(dec)} kg`);
const num = v => v.toLocaleString('es-AR', { maximumFractionDigits: 2 });

// Colores representativos de cada categoría (coinciden con los renders SVG)
const CAT_COLOR = {
  base: '#8B4513',
  collarin: '#5C3317',
  tacoMadera: '#8B6914',
  vertical: '#2563eb',
  horizontalO: '#16a34a',
  vigaPuente: '#d97706',
  horizontalU: '#d97706',
  horizontalUT14: '#92400e',
  mensula: '#6B21A8',
  stringer: '#64748b',
  plataforma: '#9f1239',
  fenolico: '#92400e',
  barandilla: '#06b6d4',
  rodapie: '#f59e0b',
  diagonal: '#7c3aed',
  diagonalPlanta: '#7c3aed',
  escalera: '#059669',
  apoyaTecho: '#374151',
  celosia: '#475569',
  cumbrera: '#78716c',
  techo: '#64748b',
  truss: '#374151',
  vigaIPN: '#374151',
  importada: '#6b7280',
  lineArray: '#1d4ed8',
  pantallaLED: '#0891b2',
  luz: '#eab308',
  festival: '#b45309',
};

function ColorDot({ categoria }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: CAT_COLOR[categoria] || '#9ca3af' }}
    />
  );
}

// Barra de distribución de peso
function PesoBar({ peso, maxPeso }) {
  const pct = maxPeso > 0 ? (peso / maxPeso) * 100 : 0;
  return (
    <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-0.5">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.max(pct, 2)}%`,
          backgroundColor: pct > 60 ? '#dc2626' : pct > 30 ? '#d97706' : '#16a34a',
        }}
      />
    </div>
  );
}

export default function Despiece({ piezas, piezasSeleccionadas, setPiezasSeleccionadas, copiar, duplicar, eliminarSeleccion, isMobile }) {
  const [gruposColapsados, setGruposColapsados] = useState(() => {
    try { return JSON.parse(localStorage.getItem('masalto_despiece_collapsed') || '{}'); } catch { return {}; }
  });

  const toggleGrupo = useCallback((cat) => {
    setGruposColapsados(prev => {
      const next = { ...prev, [cat]: !prev[cat] };
      try { localStorage.setItem('masalto_despiece_collapsed', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const despiece = useMemo(() => {
    const ag = {};
    const materiales = piezas.filter(computaMaterial);
    materiales.forEach(p => {
      // Techos compuestos: desglosan en componentes reales
      if (p.categoria === 'techo' && Array.isArray(p.componentes)) {
        p.componentes.forEach(c => {
          const cat = c.tipoId.startsWith('CEL') ? 'celosia'
            : c.tipoId.startsWith('CUMB') ? 'cumbrera'
            : c.tipoId.startsWith('V') ? 'vertical' : 'otro';
          if (!ag[c.tipoId]) ag[c.tipoId] = { nombre: c.nombre, categoria: cat, peso: c.peso, ref: c.ref, cantidad: 0 };
          ag[c.tipoId].cantidad += c.cantidad;
        });
        return;
      }
      // Agrupa por modelo + variante + acabado (en festival, cada variante tiene su propio id).
      if (!ag[p.tipoId]) ag[p.tipoId] = { nombre: p._def?.nombre ?? p.nombre, categoria: p.categoria === 'diagonalLateral' ? 'diagonal' : p.categoria, peso: p.peso ?? null, ref: p.ref, cantidad: 0, estado: p._def?.estado ?? p.estado };
      ag[p.tipoId].cantidad += 1;
    });
    const lista = Object.values(ag).sort((a, b) => (DESPIECE_ORDER[a.categoria] ?? 99) - (DESPIECE_ORDER[b.categoria] ?? 99));
    const grupos = [];
    let grupoActual = null;
    lista.forEach(it => {
      if (!grupoActual || grupoActual.categoria !== it.categoria) {
        grupoActual = { categoria: it.categoria, label: CAT_LABEL[it.categoria] || it.categoria, items: [], pesoGrupo: 0, cantGrupo: 0, sinDato: 0 };
        grupos.push(grupoActual);
      }
      grupoActual.items.push(it);
      if (it.peso == null) grupoActual.sinDato += it.cantidad; else grupoActual.pesoGrupo += it.cantidad * it.peso;
      grupoActual.cantGrupo += it.cantidad;
    });
    const peso = resumenPeso(piezas);
    const maxPesoGrupo = Math.max(...grupos.map(g => g.pesoGrupo), 1);
    return { grupos, peso, pesoTotal: peso.conocido, cantidadTotal: materiales.length, maxPesoGrupo, vallado: resumenVallado(piezas), trazos: resumenTrazos(piezas), conjuntos: resumenConjuntos(piezas) };
  }, [piezas]);

  const piezaUnica = piezasSeleccionadas.length === 1 ? piezas.find(p => p.id === piezasSeleccionadas[0]) : null;

  const exportarCSV = useCallback(() => {
    if (!despiece.grupos.length) return;
    const rows = [['Categoría', 'Pieza', 'Referencia', 'Cantidad', 'Peso unitario (kg)', 'Peso total (kg)']];
    despiece.grupos.forEach(g => {
      g.items.forEach(it => {
        rows.push([g.label, it.nombre, it.ref || '', it.cantidad, it.peso ?? 'Sin dato', it.peso == null ? 'Sin dato' : (it.cantidad * it.peso).toFixed(1)]);
      });
    });
    rows.push([]);
    rows.push([despiece.peso.completo ? 'TOTAL' : 'SUBTOTAL CONOCIDO', '', '', despiece.cantidadTotal, '', despiece.pesoTotal.toFixed(1)]);
    if (!despiece.peso.completo) rows.push(['Piezas sin peso', despiece.peso.nombresSinDato.join(' / '), '', despiece.peso.sinDato, '', 'Sin dato']);
    const { areas, recorridos } = despiece.trazos;
    if (areas.length || recorridos.length) {
      rows.push([]);
      rows.push(['Áreas y recorridos (no suman material)', '', '', '', '', '']);
      areas.forEach(a => rows.push(['Área', a.nombre, '', '', '', `${a.m2} m²`]));
      recorridos.forEach(r => rows.push(['Recorrido', r.nombre, '', '', r.ancho == null ? 'ancho sin dato' : `ancho ${r.ancho} m`, `${r.largo} m`]));
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'despiece-masalto.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [despiece]);

  const selCount = piezasSeleccionadas.length;
  const pesoSelR = resumenPeso(piezas.filter(p => piezasSeleccionadas.includes(p.id)));
  const pesoSel = pesoSelR.conocido;

  return (
    <div className={`${isMobile ? 'w-full' : 'w-64'} bg-white border-l border-gray-300 overflow-y-auto flex flex-col text-xs`}>
      {/* Panel de selección múltiple */}
      {selCount > 1 && (
        <div className="p-2 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Layers size={11} className="text-blue-600" />
              <span className="text-[10px] uppercase tracking-wide text-blue-700 font-bold">{selCount} piezas seleccionadas</span>
            </div>
            <button onClick={() => setPiezasSeleccionadas([])} className="text-gray-400 hover:text-gray-700"><X size={12} /></button>
          </div>
          <div className="flex items-center gap-2 text-gray-600 mb-1.5">
            <span>Peso: <span className="font-mono font-bold text-blue-700">{pesoSel.toFixed(1)} kg</span>{!pesoSelR.completo && <span className="text-amber-700"> + {pesoSelR.sinDato} sin dato</span>}</span>
            {pesoSel >= 1000 && <span className="text-gray-400 text-[10px]">({(pesoSel / 1000).toFixed(2)}t)</span>}
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={copiar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><Copy size={10} />Copiar</button>
            <button onClick={duplicar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><CopyPlus size={10} />Duplicar</button>
            <button onClick={eliminarSeleccion} className="flex items-center justify-center gap-0.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px]"><Trash2 size={10} />Borrar</button>
          </div>
        </div>
      )}

      {/* Panel de pieza única seleccionada */}
      {piezaUnica && (
        <div className="p-2 border-b border-gray-200 bg-red-50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <ColorDot categoria={piezaUnica.categoria} />
              <span className="text-[10px] uppercase tracking-wide text-red-700 font-bold">Seleccionada</span>
            </div>
            <button onClick={() => setPiezasSeleccionadas([])} className="text-gray-400 hover:text-gray-700"><X size={12} /></button>
          </div>
          <div className="font-semibold text-black">{piezaUnica.nombre}</div>
          <div className="text-gray-600 mt-0.5 flex items-center gap-1">
            <span className="font-mono text-[10px] text-gray-400">{piezaUnica.ref}</span>
            <span className="text-gray-300">·</span>
            <span className="font-mono font-semibold">{computaMaterial(piezaUnica) ? kg(piezaUnica.peso, 1) : 'No computa material'}</span>
          </div>
          {/* Coordenadas */}
          <div className="text-gray-500 font-mono text-[10px] mt-1 bg-white/60 rounded px-1.5 py-0.5">
            {piezaUnica.categoria === 'diagonal'
              ? <>
                  <div>De: ({piezaUnica.x1.toFixed(2)}, {piezaUnica.y1.toFixed(2)})</div>
                  <div>A: ({piezaUnica.x2.toFixed(2)}, {piezaUnica.y2.toFixed(2)})</div>
                  <div>Z: {(piezaUnica.z ?? 0).toFixed(2)}m</div>
                </>
              : piezaUnica.categoria === 'diagonalPlanta'
              ? <>
                  <div>De: ({piezaUnica.x1.toFixed(2)}, {piezaUnica.z1.toFixed(2)})</div>
                  <div>A: ({piezaUnica.x2.toFixed(2)}, {piezaUnica.z2.toFixed(2)})</div>
                  <div>Y: {piezaUnica.y.toFixed(2)}m</div>
                </>
              : <>
                  <div>X: {piezaUnica.x.toFixed(2)}m · Y: {(piezaUnica.y ?? 0).toFixed(2)}m · Z: {(piezaUnica.z ?? 0).toFixed(2)}m</div>
                  {piezaUnica.rot != null && <div>Rotación: {piezaUnica.rot}°</div>}
                  {piezaUnica.orientacion && <div>Eje: {piezaUnica.orientacion.toUpperCase()}</div>}
                  {piezaUnica.largo && <div>Largo: {piezaUnica.largo.toFixed(2)}m</div>}
                </>}
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1.5">
            <button onClick={duplicar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><CopyPlus size={10} />Duplicar</button>
            <button onClick={eliminarSeleccion} className="flex items-center justify-center gap-0.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px]"><Trash2 size={10} />Borrar</button>
          </div>
        </div>
      )}

      {/* Resumen rápido */}
      {despiece.grupos.length > 0 && (
        <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package size={11} className="text-gray-400" />
              <span className="text-[10px] text-gray-500">{despiece.grupos.length} categorías</span>
              <span className="text-gray-300">·</span>
              <span className="text-[10px] text-gray-500">{despiece.cantidadTotal} pzas</span>
            </div>
            <div className="flex items-center gap-1">
              <Weight size={10} className="text-gray-400" />
              <span className="text-[10px] font-bold font-mono text-gray-700" title={despiece.peso.completo ? 'Peso total' : 'Subtotal conocido'}>{despiece.peso.completo ? '' : '≥ '}{despiece.pesoTotal.toFixed(0)} kg</span>
              {despiece.pesoTotal >= 1000 && (
                <span className="text-[9px] text-gray-400">({(despiece.pesoTotal / 1000).toFixed(2)}t)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lista de despiece */}
      <div className="p-2 flex-1">
        {despiece.grupos.length === 0
          ? (
            <div className="text-center py-8">
              <Package size={24} className="mx-auto text-gray-300 mb-2" />
              <div className="text-gray-400 italic text-[11px]">Elegí una pieza de la paleta</div>
              <div className="text-gray-400 italic text-[10px] mt-0.5">y hacé click en el canvas para colocarla.</div>
            </div>
          )
          : <>
            {despiece.grupos.map((g) => {
              const collapsed = gruposColapsados[g.categoria];
              return (
                <div key={g.categoria} className="mb-1.5">
                  {/* Header de grupo — clickeable para colapsar */}
                  <button
                    onClick={() => toggleGrupo(g.categoria)}
                    className="flex items-center gap-1 w-full bg-gray-100 hover:bg-gray-200 px-1.5 py-1 rounded text-left transition-colors"
                  >
                    {collapsed
                      ? <ChevronRight size={10} className="text-gray-400 flex-shrink-0" />
                      : <ChevronDown size={10} className="text-gray-400 flex-shrink-0" />
                    }
                    <ColorDot categoria={g.categoria} />
                    <span className="text-[10px] font-bold text-gray-700 flex-1 truncate">{g.label}</span>
                    <span className="text-[10px] font-mono text-gray-400">{g.cantGrupo}</span>
                    <span className="text-gray-300 mx-0.5">·</span>
                    <span className="text-[10px] font-mono font-semibold text-gray-600">{g.pesoGrupo.toFixed(0)}kg{g.sinDato > 0 && <span className="text-amber-700" title={`${g.sinDato} sin peso`}> +s/d</span>}</span>
                  </button>
                  {/* Barra de distribución */}
                  <PesoBar peso={g.pesoGrupo} maxPeso={despiece.maxPesoGrupo} />
                  {/* Items del grupo */}
                  {!collapsed && (
                    <table className="w-full text-[11px] mt-0.5">
                      <tbody>{g.items.map((it, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-0.5 pl-3">
                            <div className="font-semibold text-gray-800 leading-tight truncate" title={it.nombre}>{it.nombre}</div>
                            <div className="text-[9px] text-gray-400 font-mono">{it.ref}{it.estado && it.estado !== 'validado' && <span className="ml-1 text-amber-700 font-sans font-bold">{it.estado === 'esquematico' ? 'ESQ' : 'PEND'}</span>}</div>
                          </td>
                          <td className="text-right py-0.5 font-mono w-6 text-gray-500" title="Cantidad">×{it.cantidad}</td>
                          <td className={`text-right py-0.5 font-mono w-10 text-[10px] ${it.peso == null ? 'text-amber-700' : 'text-gray-400'}`} title="Peso unitario">{it.peso == null ? 's/d' : `${it.peso}kg`}</td>
                          <td className={`text-right py-0.5 font-mono font-semibold w-14 ${it.peso == null ? 'text-amber-700' : 'text-gray-700'}`} title={it.peso == null ? 'Sin dato' : 'Peso total'}>{it.peso == null ? 's/d' : (it.cantidad * it.peso).toFixed(1)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              );
            })}

            {/* Total final */}
            <div className="mt-3 pt-2 border-t-2 border-gray-900">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm text-gray-900">{despiece.peso.completo ? 'TOTAL' : 'SUBTOTAL CONOCIDO'}</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm">{despiece.pesoTotal.toFixed(1)} kg</span>
                  {despiece.pesoTotal >= 1000 && (
                    <span className="text-gray-500 text-[10px] ml-1">({(despiece.pesoTotal / 1000).toFixed(2)}t)</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                <span>{despiece.cantidadTotal} piezas · {despiece.grupos.length} categorías</span>
                {despiece.pesoTotal >= 3000 && <span className="text-orange-600 font-semibold">⚠ +3t</span>}
              </div>
              {!despiece.peso.completo && (
                <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-1">
                  {despiece.peso.sinDato} pieza(s) sin peso: {despiece.peso.nombresSinDato.join(', ')}. El total no se informa hasta completar esos datos.
                </div>
              )}
              {/* Indicador de transporte */}
              {despiece.peso.completo && despiece.pesoTotal > 0 && (
                <div className="mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">
                  🚚 {despiece.pesoTotal < 3000 ? 'Flete común' : despiece.pesoTotal < 10000 ? 'Chasis' : 'Semi'}
                </div>
              )}
            </div>

            {despiece.vallado.cantidad > 0 && (
              <div className="mt-3 text-[10px] border border-gray-200 rounded p-1.5">
                <div className="font-bold text-gray-700 mb-0.5">Vallados</div>
                {despiece.vallado.porModelo.map(m => (
                  <div key={m.tipoId} className="flex justify-between"><span className="truncate">{m.cantidad} × {m.nombre}</span><span className="font-mono">{num(m.largoNominal)} m</span></div>
                ))}
                <div className="flex justify-between border-t border-gray-100 mt-0.5 pt-0.5 font-semibold"><span>Largo nominal</span><span className="font-mono">{num(despiece.vallado.largoNominal)} m</span></div>
                <div className="flex justify-between text-gray-500"><span>Cobertura instalada</span><span className={despiece.vallado.coberturaInstalada == null ? 'text-amber-700' : 'font-mono'}>{despiece.vallado.coberturaInstalada == null ? 'Sin dato (unión pendiente)' : `${num(despiece.vallado.coberturaInstalada)} m`}</span></div>
              </div>
            )}
            {despiece.conjuntos.length > 0 && (
              <div className="mt-3 text-[10px] border border-gray-200 rounded p-1.5">
                <div className="font-bold text-gray-700 mb-0.5">Torres <span className="font-normal text-gray-400">(sus piezas ya están en el despiece)</span></div>
                {despiece.conjuntos.map(g => (
                  <button key={g.id} onClick={() => setPiezasSeleccionadas(g.ids)} className="w-full flex justify-between gap-2 hover:bg-gray-50">
                    <span className="truncate text-left">{g.codigo} · {g.nombre}</span><span className="font-mono shrink-0">{num(g.peso)} kg</span>
                  </button>
                ))}
              </div>
            )}
            {/* Exportar */}
            <button onClick={exportarCSV} className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 text-[10px] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded font-bold text-gray-700 transition-colors">
              <FileSpreadsheet size={11} /> Exportar CSV
            </button>
          </>}
        {(despiece.trazos.areas.length > 0 || despiece.trazos.recorridos.length > 0) && (
          <div className="mt-3 text-[10px] border border-dashed border-gray-300 rounded p-1.5">
            <div className="font-bold text-gray-700 mb-0.5">Áreas y recorridos <span className="font-normal text-gray-400">(no suman material)</span></div>
            {despiece.trazos.areas.map(a => (
              <button key={a.id} onClick={() => setPiezasSeleccionadas([a.id])} className="w-full flex justify-between hover:bg-gray-50"><span className="truncate">⬠ {a.nombre}</span><span className="font-mono">{num(a.m2)} m²</span></button>
            ))}
            {despiece.trazos.recorridos.map(r => (
              <button key={r.id} onClick={() => setPiezasSeleccionadas([r.id])} className="w-full flex justify-between hover:bg-gray-50"><span className="truncate">⤳ {r.nombre}</span><span className="font-mono">{num(r.largo)} m</span></button>
            ))}
          </div>
        )}
      </div>

      {/* Footer: referencia a atajos */}
      {!isMobile && (
        <div className="border-t border-gray-200 px-2 py-1.5 bg-gray-50 flex items-center justify-center gap-1 text-[9px] text-gray-400">
          <Keyboard size={9} />
          <span>Presioná</span>
          <kbd className="font-mono bg-white px-1 rounded border border-gray-200 text-gray-500">?</kbd>
          <span>para ver atajos</span>
        </div>
      )}
    </div>
  );
}
