import { useState } from 'react';
import {
  Save, FolderOpen, Trash2, Grid3x3, Undo2, Redo2, Info, Copy, ClipboardPaste,
  CopyPlus, CheckSquare, LayoutPanelTop, Rows3, RotateCw, Plus, Minus, Pencil,
  Ruler, PenTool, Check, X, FileDown, Maximize2,
} from 'lucide-react';
import { TIENE_ORIENTACION } from '../catalogo/constantes.js';

export default function Toolbar({
  vista, setVista, nombreDiseno, mensajeGuardado,
  guardar, cargar, exportarPDF, exportando, undo, redo, historialIdx, historialLen,
  copiar, pegar, duplicar, seleccionarTodo, piezasSeleccionadas, clipboard,
  mostrarGrilla, setMostrarGrilla, zoomEncuadrar, borrarTodo, herramientaActiva,
  diagonalOrigen, diagonalPlantaOrigen,
  filas, filaActivaId, setFilaActivaId, agregarFila, eliminarFila, renombrarFila, moverFila,
  alturaY, setAlturaY,
  orientacionActiva, toggleOrientacion,
  mostrarCotas, setMostrarCotas,
  modoTecnico, setModoTecnico,
  pesoTotal, cantPiezas,
}) {
  const filaActiva = filas.find(f => f.id === filaActivaId);
  const [editandoFila, setEditandoFila] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editZ, setEditZ] = useState('');
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
  return (
    <>
      {/* HEADER */}
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between border-b-2 border-red-600">
        <div className="flex items-center gap-3">
          <div className="text-red-600 font-black text-xl tracking-tight">MÁSALTO</div>
          <div className="text-gray-400 text-xs">/</div>
          <div className="font-semibold text-sm">Editor de Planos Layher</div>
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
        <button onClick={guardar} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Save size={13} /> Guardar</button>
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
