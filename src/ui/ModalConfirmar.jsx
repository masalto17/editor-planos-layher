import { AlertTriangle, X } from 'lucide-react';

/**
 * Modal de confirmación genérica — reemplaza confirm() nativo.
 * Props: mensaje, detalle (opcional), onConfirmar, onCancelar, labelConfirmar (default "Confirmar")
 */
export default function ModalConfirmar({ mensaje, detalle, onConfirmar, onCancelar, labelConfirmar = 'Confirmar' }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancelar}>
      <div className="bg-white rounded-lg shadow-xl w-80 max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <AlertTriangle size={18} className="text-amber-500" />
          <span className="font-bold text-sm text-gray-800">{mensaje}</span>
          <button onClick={onCancelar} className="ml-auto text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>
        {detalle && <div className="px-4 py-2 text-xs text-gray-600">{detalle}</div>}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button onClick={onCancelar} className="px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded border border-gray-300">
            Cancelar
          </button>
          <button onClick={onConfirmar}
            className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded border border-red-700 font-bold">
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
