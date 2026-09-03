import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { PLANTILLAS } from '../plantillas/plantillas.js';

export default function ModalPlantillas({ onCargar, onCerrar }) {
  const [preview, setPreview] = useState(null);

  const plantillas = useMemo(() => PLANTILLAS.map(p => {
    const data = p.generar();
    return { ...data, key: p.key };
  }), []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCerrar}>
      <div className="bg-white rounded-lg shadow-2xl w-[520px] max-w-[95vw] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-black text-white shrink-0">
          <h2 className="text-sm font-bold">Plantillas de arranque</h2>
          <button onClick={onCerrar} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto">
          <p className="text-xs text-gray-500 mb-3">Elegí una estructura base y modificala a tu gusto. Cada plantilla genera un diseño completo con piezas reales del catálogo.</p>
          <div className="space-y-2">
            {plantillas.map(tpl => (
              <div
                key={tpl.key}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-red-400 hover:bg-red-50 ${preview === tpl.key ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                onClick={() => setPreview(preview === tpl.key ? null : tpl.key)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tpl.icono}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900">{tpl.nombre}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tpl.descripcion}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono text-gray-600">{tpl.piezas.length} pzas</div>
                    <div className="text-[10px] text-gray-400">{tpl.piezas.reduce((s, p) => s + p.peso, 0).toFixed(0)} kg</div>
                  </div>
                </div>
                {preview === tpl.key && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(tpl.piezas.reduce((acc, p) => { acc[p.categoria] = (acc[p.categoria] || 0) + 1; return acc; }, {})).map(([cat, n]) => (
                        <span key={cat} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cat} ×{n}</span>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-400 mb-2">{tpl.filas.length} fila(s): {tpl.filas.map(f => `${f.nombre} (Z=${f.z}m)`).join(', ')}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onCargar(tpl); }}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-colors"
                    >
                      Usar esta plantilla
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
