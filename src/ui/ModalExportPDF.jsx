import { useState, useMemo } from 'react';
import { FileDown, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ES_TIPO_VERTICAL } from '../catalogo/constantes.js';

/**
 * Modal que pide datos del proyecto antes de exportar PDF.
 * Secciones: Proyecto, Datos técnicos, Opciones de páginas.
 */
export default function ModalExportPDF({ nombreActual, piezas, filas, onExportar, onCerrar, exportando, tienePlanta }) {
  // --- Proyecto ---
  const [nombre, setNombre] = useState(nombreActual || '');
  const [cliente, setCliente] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [evento, setEvento] = useState('');
  const [planoNum, setPlanoNum] = useState('');
  const [revision, setRevision] = useState('01');
  const [escala, setEscala] = useState('1:100');

  // --- Técnicos ---
  const [responsable, setResponsable] = useState('');
  const [matricula, setMatricula] = useState('');
  const [sobrecargaUso, setSobrecargaUso] = useState('150');
  const [clasificacionViento, setClasificacionViento] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // --- Opciones páginas ---
  const [incluirPlanta, setIncluirPlanta] = useState(!!tienePlanta);
  const [incluirCorte, setIncluirCorte] = useState(false);
  const [corteX, setCorteX] = useState('');
  const [secExpanded, setSecExpanded] = useState({ tec: false, pag: false });

  // Detectar posiciones X con verticales
  const posicionesX = useMemo(() => {
    if (!piezas) return [];
    return [...new Set(
      piezas.filter(p => ES_TIPO_VERTICAL(p.categoria)).map(p => parseFloat(p.x.toFixed(2)))
    )].sort((a, b) => a - b);
  }, [piezas]);

  // Resumen automático de la estructura
  const resumen = useMemo(() => {
    if (!piezas || !piezas.length) return null;
    const verts = piezas.filter(p => p.categoria === 'vertical');
    const allX = verts.map(p => p.x);
    const allY = verts.map(p => p.y + (p.largo || 0));
    const allZ = [...new Set(piezas.map(p => p.z ?? 0))];
    const pesoTotal = piezas.reduce((s, p) => s + (p.peso || 0), 0);
    const anchoEst = allX.length ? (Math.max(...allX) - Math.min(...allX)) : 0;
    const altoEst = allY.length ? Math.max(...allY) : 0;
    const profEst = allZ.length > 1 ? (Math.max(...allZ) - Math.min(...allZ)) : 0;
    // Alturas de piso únicas
    const altPisos = [...new Set(
      piezas.filter(p => p.categoria === 'plataforma').map(p => p.y)
    )].sort((a, b) => a - b);
    return {
      anchoEst, altoEst, profEst, pesoTotal,
      cantPiezas: piezas.length,
      cantFilas: filas?.length || 1,
      cantNiveles: altPisos.length,
      altPisos,
      cantVerts: verts.length,
    };
  }, [piezas, filas]);

  const handleExportar = () => {
    onExportar({
      nombre: nombre || 'Sin título',
      cliente, ubicacion, evento,
      planoNum, revision, escala,
      responsable, matricula,
      sobrecargaUso: parseFloat(sobrecargaUso) || 150,
      clasificacionViento,
      observaciones,
      incluirPlanta, incluirCorte,
      corteX: incluirCorte ? (parseFloat(corteX) || posicionesX[Math.floor(posicionesX.length / 2)] || 0) : null,
    });
  };

  const inputCls = 'w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100';
  const toggleSec = (key) => setSecExpanded(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCerrar}>
      <div className="bg-white rounded-lg shadow-xl w-[480px] max-w-[92vw] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-red-600 rounded-t-lg">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <FileDown size={16} /> Exportar PDF · A3 apaisado
          </div>
          <button onClick={onCerrar} className="text-white/70 hover:text-white"><X size={16} /></button>
        </div>

        {/* Formulario */}
        <div className="p-4 space-y-3">
          {/* ═══ SECCIÓN: PROYECTO ═══ */}
          <div className="text-[10px] uppercase tracking-wider text-red-600 font-bold border-b border-red-100 pb-1">
            Datos del proyecto
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Nombre del plano</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExportar()}
              className={inputCls}
              placeholder="Ej: Escenario Festival San Juan 2026" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Cliente</label>
              <input type="text" value={cliente} onChange={e => setCliente(e.target.value)}
                className={inputCls} placeholder="Ej: Municipalidad de San Juan" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Evento / Obra</label>
              <input type="text" value={evento} onChange={e => setEvento(e.target.value)}
                className={inputCls} placeholder="Ej: FNS 2026 — Esc. Mayor" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Ubicación</label>
            <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)}
              className={inputCls} placeholder="Ej: Predio Costanera Sur, San Juan" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Plano Nº</label>
              <input type="text" value={planoNum} onChange={e => setPlanoNum(e.target.value)}
                className={inputCls} placeholder="MA-2026-042" />
            </div>
            <div className="w-20">
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Revisión</label>
              <input type="text" value={revision} onChange={e => setRevision(e.target.value)}
                className={inputCls} placeholder="01" />
            </div>
            <div className="w-24">
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Escala</label>
              <select value={escala} onChange={e => setEscala(e.target.value)} className={inputCls}>
                <option value="1:50">1:50</option>
                <option value="1:100">1:100</option>
                <option value="1:150">1:150</option>
                <option value="1:200">1:200</option>
              </select>
            </div>
          </div>

          {/* ═══ SECCIÓN: DATOS TÉCNICOS (colapsable) ═══ */}
          <button onClick={() => toggleSec('tec')}
            className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-600 font-bold border-b border-gray-200 pb-1 w-full text-left mt-2 hover:text-gray-800">
            {secExpanded.tec ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Datos técnicos y verificación
          </button>

          {secExpanded.tec && (
            <div className="space-y-3 bg-gray-50 rounded p-3 border border-gray-200">
              {/* Resumen automático */}
              {resumen && (
                <div className="bg-white rounded p-2 border border-gray-200 text-[10px] text-gray-600 space-y-0.5">
                  <div className="font-bold text-gray-800 text-[10px] uppercase tracking-wide mb-1">Resumen calculado automáticamente</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <span>Dimensiones: <b className="text-gray-800">{resumen.anchoEst.toFixed(2)} × {resumen.altoEst.toFixed(2)}{resumen.profEst > 0 ? ` × ${resumen.profEst.toFixed(2)}` : ''}m</b></span>
                    <span>Peso total: <b className="text-gray-800">{resumen.pesoTotal.toFixed(0)} kg</b></span>
                    <span>Filas: <b className="text-gray-800">{resumen.cantFilas}</b></span>
                    <span>Piezas: <b className="text-gray-800">{resumen.cantPiezas}</b></span>
                    <span>Verticales: <b className="text-gray-800">{resumen.cantVerts}</b></span>
                    <span>Niveles de piso: <b className="text-gray-800">{resumen.cantNiveles || '—'}</b></span>
                  </div>
                  {resumen.altPisos.length > 0 && (
                    <div className="mt-0.5">Alturas piso: <b className="text-gray-800">{resumen.altPisos.map(a => `+${a.toFixed(2)}m`).join(', ')}</b></div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Responsable técnico</label>
                  <input type="text" value={responsable} onChange={e => setResponsable(e.target.value)}
                    className={inputCls} placeholder="Ing. Nombre Apellido" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Matrícula</label>
                  <input type="text" value={matricula} onChange={e => setMatricula(e.target.value)}
                    className={inputCls} placeholder="Mat. XXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Sobrecarga de uso (kg/m²)</label>
                  <input type="text" value={sobrecargaUso} onChange={e => setSobrecargaUso(e.target.value)}
                    className={inputCls} placeholder="150" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Clasif. viento (CIRSOC 102)</label>
                  <input type="text" value={clasificacionViento} onChange={e => setClasificacionViento(e.target.value)}
                    className={inputCls} placeholder="Ej: Zona II, Cat. III" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Observaciones</label>
                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  className={`${inputCls} h-14 resize-none`}
                  placeholder="Notas adicionales para el cuadro de datos..." />
              </div>
            </div>
          )}

          {/* ═══ SECCIÓN: OPCIONES DE PÁGINAS (colapsable) ═══ */}
          <button onClick={() => toggleSec('pag')}
            className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-600 font-bold border-b border-gray-200 pb-1 w-full text-left mt-1 hover:text-gray-800">
            {secExpanded.pag ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Opciones de páginas
          </button>

          {secExpanded.pag && (
            <div className="bg-gray-50 rounded p-3 space-y-2 border border-gray-200">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={incluirPlanta} onChange={e => setIncluirPlanta(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-400" />
                <span className="text-gray-700">Incluir vista de planta (página 2)</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={incluirCorte} onChange={e => setIncluirCorte(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-400" />
                <span className="text-gray-700">Incluir vista de corte transversal</span>
              </label>
              {incluirCorte && posicionesX.length > 0 && (
                <div className="ml-6 mt-1">
                  <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">
                    Posición X del corte
                  </label>
                  <select value={corteX} onChange={e => setCorteX(e.target.value)}
                    className={`${inputCls} text-xs`}>
                    <option value="">Central (automático)</option>
                    {posicionesX.map(px => (
                      <option key={px} value={px}>X = {px.toFixed(2)}m</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="text-[9px] text-gray-400 leading-tight mt-2">
            PDF A3 apaisado con membrete másalto/MYD, vistas, cuadro de datos técnicos, despiece y sellos legales.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <span className="text-[9px] text-gray-400">
            {1 + (incluirPlanta ? 1 : 0) + (incluirCorte ? 1 : 0)} pág.
          </span>
          <div className="flex gap-2">
            <button onClick={onCerrar} className="px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded border border-gray-300">
              Cancelar
            </button>
            <button onClick={handleExportar} disabled={exportando}
              className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded border border-red-700 font-bold disabled:opacity-50 flex items-center gap-1">
              <FileDown size={13} /> {exportando ? 'Generando…' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
