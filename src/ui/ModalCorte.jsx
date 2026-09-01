import { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Scissors } from 'lucide-react';
import { ES_TIPO_VERTICAL } from '../catalogo/constantes.js';
import VistaCorte from '../vistas/Corte.jsx';

/**
 * Modal para generar y visualizar vistas de corte transversal.
 * Detecta automáticamente posiciones X donde hay verticales y permite navegar entre ellas.
 */
export default function ModalCorte({ piezas, filas, onCerrar }) {
  // Posiciones X donde hay verticales (candidatas naturales para cortes)
  const posicionesX = useMemo(() => {
    const xs = [...new Set(
      piezas.filter(p => ES_TIPO_VERTICAL(p.categoria)).map(p => parseFloat(p.x.toFixed(3)))
    )].sort((a, b) => a - b);
    return xs;
  }, [piezas]);

  const [idxCorte, setIdxCorte] = useState(0);
  const [posXCustom, setPosXCustom] = useState('');
  const [usandoCustom, setUsandoCustom] = useState(false);

  const posX = usandoCustom
    ? parseFloat(posXCustom) || 0
    : (posicionesX[idxCorte] ?? 0);

  const prev = () => { setUsandoCustom(false); setIdxCorte(i => Math.max(0, i - 1)); };
  const next = () => { setUsandoCustom(false); setIdxCorte(i => Math.min(posicionesX.length - 1, i + 1)); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCerrar}>
      <div className="bg-white rounded-lg shadow-2xl w-[560px] max-w-[95vw] max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Scissors size={16} className="text-red-600" />
            Vista de Corte Transversal
          </div>
          <button onClick={onCerrar} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        </div>

        {/* Controles de posición */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3">
          {posicionesX.length > 0 ? (
            <>
              <button onClick={prev} disabled={idxCorte === 0 || usandoCustom}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500">Posición del corte</div>
                <div className="font-mono font-bold text-lg">X = {posX.toFixed(2)}m</div>
                {!usandoCustom && (
                  <div className="text-[10px] text-gray-400">
                    Vertical {idxCorte + 1} de {posicionesX.length}
                  </div>
                )}
              </div>
              <button onClick={next} disabled={idxCorte >= posicionesX.length - 1 || usandoCustom}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <div className="flex-1 text-center text-gray-500 text-sm py-2">
              No hay verticales colocadas. Usá una posición manual.
            </div>
          )}
        </div>

        {/* Input manual */}
        <div className="px-4 py-1.5 border-b border-gray-100 flex items-center gap-2 text-xs">
          <span className="text-gray-500">Posición manual:</span>
          <input type="number" step="0.01" value={posXCustom}
            onChange={e => { setPosXCustom(e.target.value); setUsandoCustom(true); }}
            placeholder="ej: 2.57"
            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-red-500" />
          <span className="text-gray-400">m</span>
          {usandoCustom && (
            <button onClick={() => setUsandoCustom(false)}
              className="text-[10px] text-red-600 hover:underline ml-1">
              Volver a verticales
            </button>
          )}
        </div>

        {/* Vista de corte */}
        <div className="flex-1 overflow-auto p-3 flex justify-center">
          <VistaCorte
            piezas={piezas}
            filas={filas}
            posX={posX}
            dimW={500}
            dimH={420}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
          Corte transversal Y-Z · Muestra todas las filas y piezas que pasan por X = {posX.toFixed(2)}m
        </div>
      </div>
    </div>
  );
}
