import { useState } from 'react';
import { FileDown, X } from 'lucide-react';

/**
 * Modal que pide datos del proyecto antes de exportar PDF.
 * Campos: nombre, cliente, ubicación, plano Nº, revisión.
 */
export default function ModalExportPDF({ nombreActual, onExportar, onCerrar, exportando }) {
  const [nombre, setNombre] = useState(nombreActual || '');
  const [cliente, setCliente] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [planoNum, setPlanoNum] = useState('');
  const [revision, setRevision] = useState('01');

  const handleExportar = () => {
    onExportar({ nombre: nombre || 'Sin título', cliente, ubicacion, planoNum, revision });
  };

  const inputCls = 'w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCerrar}>
      <div className="bg-white rounded-lg shadow-xl w-[420px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-red-600 rounded-t-lg">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <FileDown size={16} /> Exportar PDF · A3
          </div>
          <button onClick={onCerrar} className="text-white/70 hover:text-white"><X size={16} /></button>
        </div>

        {/* Formulario */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Nombre del plano</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExportar()}
              className={inputCls}
              placeholder="Ej: Escenario Festival 2026" autoFocus />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Cliente</label>
            <input type="text" value={cliente} onChange={e => setCliente(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExportar()}
              className={inputCls}
              placeholder="Ej: Municipalidad de San Juan" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Ubicación</label>
            <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExportar()}
              className={inputCls}
              placeholder="Ej: Predio Costanera Sur, San Juan" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Plano Nº</label>
              <input type="text" value={planoNum} onChange={e => setPlanoNum(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleExportar()}
                className={inputCls}
                placeholder="MA-2025-042" />
            </div>
            <div className="w-20">
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Revisión</label>
              <input type="text" value={revision} onChange={e => setRevision(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleExportar()}
                className={inputCls}
                placeholder="01" />
            </div>
          </div>

          <div className="text-[9px] text-gray-400 leading-tight mt-2">
            PDF A3 apaisado con membrete másalto/MYD, vista del plano, despiece y sellos legales.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
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
  );
}
