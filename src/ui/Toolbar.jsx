import { useState } from 'react';
import {
  Save, FolderOpen, Trash2, Grid3x3, Undo2, Redo2, Info, Copy, ClipboardPaste,
  CopyPlus, CheckSquare, LayoutPanelTop, Rows3, RotateCw, Plus, Minus, Pencil,
  Ruler, PenTool, Check, X, FileDown, Maximize2, HelpCircle, Menu, SaveAll, Scissors,
  FilePlus2,
} from 'lucide-react';
import { TIENE_ORIENTACION } from '../catalogo/constantes.js';

export default function Toolbar({
  vista, setVista, nombreDiseno, mensajeGuardado,
  nuevo, guardar, guardarComo, cargar, exportarPDF, exportando, undo, redo, historialIdx, historialLen,
  copiar, pegar, duplicar, seleccionarTodo, piezasSeleccionadas, clipboard,
  mostrarGrilla, setMostrarGrilla, zoomEncuadrar, borrarTodo, herramientaActiva,
  diagonalOrigen, diagonalPlantaOrigen,
  filas, filaActivaId, setFilaActivaId, agregarFila, eliminarFila, renombrarFila, moverFila,
  alturaY, setAlturaY,
  orientacionActiva, toggleOrientacion,
  mostrarCotas, setMostrarCotas,
  modoTecnico, setModoTecnico,
  pesoTotal, cantPiezas,
  onAyuda, onCorte,
  isMobile, onTogglePaleta, onToggleDespiece,
}) {
  const filaActiva = filas.find(f => f.id === filaActivaId);
  const [editandoFila, setEditandoFila] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editZ, setEditZ] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const iniciarEdicionFila = () => {
    if (!filaActiva) return;
    setEditNombre(filaActiva.nombre);
    setEditZ(String(filaActiva.z));
    setEditandoFila(true);
  };
  const confirmarEdicionFila = () => {
    if (editNombre && editNombre !== filaActiva.nombre) renombrarFila(filaActiva.id, editNombre);
    const n = parseFloat(editZ);
    if (!isNaN(n) && n !== filaActiva.z) moverFila(filaActiva.id, n);
    setEditandoFila(false);
  };
  const cancelarEdicionFila = () => setEditandoFila(false);
  const orientacionUsable = herramientaActiva && TIENE_ORIENTACION(herramientaActiva.categoria);

  // ═══ MOBILE TOOLBAR ═══
  if (isMobile) {
    return (
      <>
        {/* Header compacto */}
        <div className="bg-black text-white px-3 py-1.5 flex items-center justify-between border-b-2 border-red-600">
          <div className="flex items-center gap-1.5 shrink-0">
            <img src={`${import.meta.env.BASE_URL}branding/masalto-isotipo.svg`} alt="" style={{ height: 20 }} />
            <div className="text-red-600 font-black text-lg tracking-tight">MÁSALTO</div>
          </div>
          <div className="flex items-center gap-0.5 bg-gray-800 rounded p-0.5">
            <button onClick={() => setVista('alzado')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded ${vista === 'alzado' ? 'bg-red-600 text-white' : 'text-gray-300'}`}>
              <LayoutPanelTop size={12} /> Alzado
            </button>
            <button onClick={() => setVista('planta')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded ${vista === 'planta' ? 'bg-red-600 text-white' : 'text-gray-300'}`}>
              <Rows3 size={12} /> Planta
            </button>
          </div>
          <button onClick={() => setMobileMenuOpen(m => !m)} className="p-1 text-gray-300 hover:text-white">
            <Menu size={20} />
          </button>
        </div>

        {/* Barra contextual compacta */}
        <div className="bg-white border-b border-gray-300 px-2 py-1 flex items-center gap-1 text-[10px]">
          {vista === 'alzado' ? (
            <div className="flex items-center gap-1 text-gray-600 flex-1 min-w-0">
              <span className="shrink-0">Fila:</span>
              <select value={filaActivaId} onChange={e => setFilaActivaId(e.target.value)}
                className="px-1 py-0.5 border border-gray-300 rounded text-[11px] font-mono bg-white min-w-0">
                {filas.map(f => <option key={f.id} value={f.id}>{f.nombre} · Z={f.z.toFixed(2)}m</option>)}
              </select>
              <button onClick={agregarFila} className="p-1 bg-gray-100 rounded border border-gray-300 shrink-0"><Plus size={11} /></button>
            </div>
          ) : (
            <label className="flex items-center gap-1 text-gray-600 flex-1">
              <span className="shrink-0">Altura:</span>
              <input type="number" step="0.1" value={alturaY} onChange={e => setAlturaY(parseFloat(e.target.value) || 0)}
                className="w-14 px-1 py-0.5 border border-gray-300 rounded text-[11px] font-mono" />
              <span>m</span>
            </label>
          )}
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={toggleOrientacion}
              className={`px-1.5 py-0.5 text-[10px] rounded border font-mono ${orientacionUsable ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
              <RotateCw size={10} className="inline mr-0.5" />{orientacionActiva.toUpperCase()}
            </button>
            <button onClick={zoomEncuadrar} className="p-1 bg-gray-100 rounded border border-gray-300"><Maximize2 size={12} /></button>
            <button onClick={() => setMostrarGrilla(g => !g)}
              className={`p-1 rounded border ${mostrarGrilla ? 'bg-red-50 border-red-300' : 'bg-gray-100 border-gray-300'}`}><Grid3x3 size={12} /></button>
          </div>
        </div>

        {/* Menu desplegable móvil */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute right-2 top-12 z-50 bg-white rounded-lg shadow-xl border border-gray-300 py-1 w-48">
              <button onClick={() => { nuevo(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100"><FilePlus2 size={14} /> Nuevo</button>
              <button onClick={() => { guardar(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100"><Save size={14} /> Guardar</button>
              <button onClick={() => { guardarComo(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100"><SaveAll size={14} /> Guardar como</button>
              <button onClick={() => { cargar(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100"><FolderOpen size={14} /> Cargar</button>
              <button onClick={() => { exportarPDF(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100 text-red-700"><FileDown size={14} /> Exportar PDF</button>
              <div className="border-t border-gray-200 my-1" />
              <button onClick={() => { setMostrarCotas(c => !c); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100">
                <Ruler size={14} /> Cotas {mostrarCotas ? '✓' : ''}</button>
              <button onClick={() => { setModoTecnico(m => !m); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100">
                <PenTool size={14} /> Modo CAD {modoTecnico ? '✓' : ''}</button>
              <button onClick={() => { onCorte?.(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100">
                <Scissors size={14} /> Vista de corte</button>
              <div className="border-t border-gray-200 my-1" />
              <button onClick={() => { borrarTodo(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100 text-red-600"><Trash2 size={14} /> Borrar todo</button>
              <button onClick={() => { onAyuda(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100"><HelpCircle size={14} /> Ayuda</button>
              {cantPiezas > 0 && (
                <div className="px-3 py-1 text-[10px] text-gray-500 border-t border-gray-200 mt-1">{cantPiezas} pzas · {pesoTotal.toFixed(0)} kg</div>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  // ═══ DESKTOP TOOLBAR (sin cambios) ═══
  return (
    <>
      {/* HEADER */}
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between border-b-2 border-red-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}branding/masalto-isotipo.svg`} alt="MásAlto" style={{ height: 28 }} />
            <div className="text-red-600 font-black text-xl tracking-tight">MÁSALTO</div>
          </div>
          <div className="text-gray-400 text-xs">/</div>
          <div className="font-semibold text-sm">Layout</div>
          <div className="text-gray-500 text-xs">v2.0</div>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded p-0.5">
          <button onClick={() => setVista('alzado')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded ${vista === 'alzado' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <LayoutPanelTop size={13} /> Alzado
          </button>
          <button onClick={() => setVista('planta')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded ${vista === 'planta' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <Rows3 size={13} /> Planta
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <span>{nombreDiseno}</span>
          {mensajeGuardado && <span className={mensajeGuardado.startsWith('✓') ? 'text-green-400' : 'text-red-400'}>{mensajeGuardado}</span>}
          {cantPiezas > 0 && <span className="text-gray-500 font-mono text-[10px]">{cantPiezas} pzas · {pesoTotal.toFixed(0)} kg</span>}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white border-b border-gray-300 px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
        <button onClick={nuevo} title="Nuevo diseño" className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><FilePlus2 size={13} /> Nuevo</button>
        <button onClick={guardar} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Save size={13} /> Guardar</button>
        <button onClick={guardarComo} title="Guardar como…" className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><SaveAll size={13} /> Guardar como</button>
        <button onClick={cargar} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><FolderOpen size={13} /> Cargar</button>
        <button onClick={exportarPDF} disabled={exportando} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded border border-red-700 disabled:opacity-50"><FileDown size={13} /> {exportando ? 'Exportando…' : 'PDF'}</button>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button onClick={undo} disabled={historialIdx === 0} title="Ctrl+Z" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><Undo2 size={13} /></button>
        <button onClick={redo} disabled={historialIdx >= historialLen - 1} title="Ctrl+Y" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><Redo2 size={13} /></button>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button onClick={copiar} disabled={piezasSeleccionadas.length === 0} title="Ctrl+C" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><Copy size={13} /></button>
        <button onClick={() => pegar()} disabled={clipboard.length === 0} title="Ctrl+V" className="flex items-center gap-0.5 p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40">
          <ClipboardPaste size={13} />{clipboard.length > 0 && <span className="text-[9px] text-gray-500">{clipboard.length}</span>}
        </button>
        <button onClick={duplicar} disabled={piezasSeleccionadas.length === 0} title="Ctrl+D" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><CopyPlus size={13} /></button>
        <button onClick={seleccionarTodo} title="Ctrl+A" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><CheckSquare size={13} /></button>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button onClick={zoomEncuadrar} title="Encuadrar todo" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Maximize2 size={13} /></button>
        <button onClick={() => setMostrarGrilla(g => !g)} title="Grilla" className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${mostrarGrilla ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-100 border-gray-300'}`}><Grid3x3 size={13} /></button>
        <button onClick={() => setMostrarCotas(c => !c)} title="Cotas automáticas" className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${mostrarCotas ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-100 border-gray-300'}`}><Ruler size={13} /></button>
        <button onClick={() => setModoTecnico(m => !m)} title="Modo plano técnico" className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border ${modoTecnico ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-600'}`}><PenTool size={12} /> {modoTecnico ? 'CAD' : 'CAD'}</button>
        <button onClick={onCorte} title="Vista de corte transversal" className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border bg-gray-100 border-gray-300 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"><Scissors size={12} /> Corte</button>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        {vista === 'alzado' ? (
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            Fila:
            {editandoFila ? (
              <>
                <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmarEdicionFila()}
                  className="w-10 px-1 py-0.5 border border-blue-400 rounded text-[11px] font-mono bg-blue-50 focus:outline-none"
                  autoFocus placeholder="Nombre" />
                <span className="text-gray-400">Z:</span>
                <input type="number" step="0.01" value={editZ} onChange={e => setEditZ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmarEdicionFila()}
                  className="w-14 px-1 py-0.5 border border-blue-400 rounded text-[11px] font-mono bg-blue-50 focus:outline-none" />
                <span className="text-gray-400">m</span>
                <button onClick={confirmarEdicionFila} title="Confirmar"
                  className="p-1 bg-green-100 hover:bg-green-200 rounded border border-green-400 text-green-700"><Check size={11} /></button>
                <button onClick={cancelarEdicionFila} title="Cancelar"
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><X size={11} /></button>
              </>
            ) : (
              <>
                <select value={filaActivaId} onChange={e => setFilaActivaId(e.target.value)}
                  className="px-1 py-0.5 border border-gray-300 rounded text-[11px] font-mono bg-white">
                  {filas.map(f => <option key={f.id} value={f.id}>{f.nombre} · Z={f.z.toFixed(2)}m</option>)}
                </select>
                <button onClick={iniciarEdicionFila} title="Editar nombre / Z"
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Pencil size={11} /></button>
                <button onClick={agregarFila} title="Nueva fila (+2.57m)"
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Plus size={11} /></button>
                <button onClick={() => eliminarFila(filaActivaId)} disabled={filas.length <= 1} title="Eliminar fila activa"
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><Minus size={11} /></button>
              </>
            )}
          </div>
        ) : (
          <label className="flex items-center gap-1 text-[10px] text-gray-600">
            Altura (Y):
            <input type="number" step="0.1" value={alturaY} onChange={e => setAlturaY(parseFloat(e.target.value) || 0)}
              className="w-16 px-1 py-0.5 border border-gray-300 rounded text-[11px] font-mono" />
            m
          </label>
        )}
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button onClick={toggleOrientacion}
          title="Alterna eje X/Z de horizontales (tecla R)"
          className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border font-mono ${orientacionUsable ? 'bg-white border-gray-300 hover:bg-gray-100' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
          <RotateCw size={11} /> Eje: <b>{orientacionActiva.toUpperCase()}</b>
        </button>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button onClick={borrarTodo} className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-300"><Trash2 size={13} /></button>
        <button onClick={onAyuda} title="Ayuda rápida" className="p-1 bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 rounded border border-gray-300"><HelpCircle size={13} /></button>
        <div className="flex-1" />
        <div className="text-[10px] text-gray-500 flex items-center gap-1"><Info size={11} />
          {vista === 'alzado' && herramientaActiva?.categoria === 'diagonal'
            ? (diagonalOrigen ? 'Click segunda roseta · ESC cancela' : 'Click roseta de origen')
            : vista === 'planta' && herramientaActiva?.categoria === 'diagonalPlanta'
            ? (diagonalPlantaOrigen ? 'Click segundo extremo · ESC cancela' : 'Click primer extremo de la diagonal en planta')
            : orientacionUsable
            ? `R = alternar eje (actual: ${orientacionActiva.toUpperCase()})`
            : piezasSeleccionadas.length > 1 ? `${piezasSeleccionadas.length} piezas · arrastrá para mover grupo`
            : '2 dedos / Space+arrastrar / flechas = mover plano · Ctrl+scroll = zoom'}
        </div>
      </div>
    </>
  );
}
