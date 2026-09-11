import { useState, useMemo, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Scissors, Maximize2, Minimize2 } from 'lucide-react';
import { ES_TIPO_VERTICAL } from '../catalogo/constantes.js';
import VistaCorte from '../vistas/Corte.jsx';

/**
 * Modal para generar y visualizar vistas de corte transversal.
 * Detecta automáticamente posiciones X donde hay verticales y permite navegar entre ellas.
 */
export default function ModalCorte({ piezas, filas, onCerrar }) {
  const posicionesX = useMemo(() => {
    const xs = [...new Set(
      piezas.filter(p => ES_TIPO_VERTICAL(p.categoria)).map(p => parseFloat(p.x.toFixed(3)))
    )].sort((a, b) => a - b);
    return xs;
  }, [piezas]);

  const [idxCorte, setIdxCorte] = useState(0);
  const [posXCustom, setPosXCustom] = useState('');
  const [usandoCustom, setUsandoCustom] = useState(false);
  const [expandido, setExpandido] = useState(false);

  const posX = usandoCustom
    ? parseFloat(posXCustom) || 0
    : (posicionesX[idxCorte] ?? 0);

  const prev = useCallback(() => { setUsandoCustom(false); setIdxCorte(i => Math.max(0, i - 1)); }, []);
  const next = useCallback(() => { setUsandoCustom(false); setIdxCorte(i => Math.min(posicionesX.length - 1, i + 1)); }, [posicionesX.length]);

  // Resumen de piezas en este corte
  const resumenCorte = useMemo(() => {
    const tol = 0.05;
    let verts = 0, horizX = 0, horizZ = 0, plats = 0, bases = 0;
    piezas.forEach(p => {
      const matchX = Math.abs(p.x - posX) <= tol;
      const inRangeX = posX >= p.x - tol && posX <= p.x + (p.largo || 0) + tol;
      if (p.categoria === 'vertical' && matchX) verts++;
      else if (p.categoria === 'base' && matchX) bases++;
      else if (p.categoria === 'plataforma' && inRangeX) plats++;
      else if (p.orientacion === 'z' && matchX) horizZ++;
      else if (p.orientacion === 'x' && inRangeX) horizX++;
    });
    return { verts, horizX, horizZ, plats, bases, total: verts + horizX + horizZ + plats + bases };
  }, [piezas, posX]);

  const modalSize = expandido
    ? 'w-[95vw] h-[90vh]'
    : 'w-[620px] max-w-[95vw] max-h-[90vh]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCerrar}>
      <div className={`bg-white rounded-xl shadow-2xl ${modalSize} flex flex-col transition-all duration-200`}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-black text-white rounded-t-xl shrink-0">
          <div className="flex items-center gap-2">
            <Scissors size={14} className="text-red-400" />
            <span className="text-xs font-bold tracking-wide">CORTE TRANSVERSAL</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setExpandido(!expandido)}
              className="p-1.5 text-white/60 hover:text-white rounded transition-colors" title={expandido ? 'Reducir' : 'Expandir'}>
              {expandido ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button onClick={onCerrar} className="p-1.5 text-white/60 hover:text-white rounded transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Controles de posición */}
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-3 shrink-0">
          {posicionesX.length > 0 ? (
            <>
              <button onClick={prev} disabled={idxCorte === 0 || usandoCustom}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-20 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 text-center">
                <div className="font-mono font-black text-xl tracking-tight">
                  X = {posX.toFixed(2)}m
                </div>
                {!usandoCustom && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Eje {idxCorte + 1} de {posicionesX.length}
                    {' · '}{resumenCorte.total} elementos en corte
                  </div>
                )}
              </div>
              <button onClick={next} disabled={idxCorte >= posicionesX.length - 1 || usandoCustom}
                className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-20 transition-colors">
                <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <div className="flex-1 text-center text-gray-500 text-sm py-2">
              No hay verticales colocadas. Usá una posición manual.
            </div>
          )}
        </div>

        {/* Barra de posición rápida (minimap) */}
        {posicionesX.length > 1 && !usandoCustom && (
          <div className="px-4 py-1.5 border-b border-gray-100 flex items-center gap-1 overflow-x-auto shrink-0">
            {posicionesX.map((x, i) => (
              <button key={i} onClick={() => { setUsandoCustom(false); setIdxCorte(i); }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors whitespace-nowrap ${
                  i === idxCorte ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {x.toFixed(2)}
              </button>
            ))}
          </div>
        )}

        {/* Input manual */}
        <div className="px-4 py-1.5 border-b border-gray-100 flex items-center gap-2 text-xs shrink-0">
          <span className="text-gray-400">Manual:</span>
          <input type="number" step="0.01" value={posXCustom}
            onChange={e => { setPosXCustom(e.target.value); setUsandoCustom(true); }}
            placeholder="ej: 2.57"
            className="w-20 px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-100" />
          <span className="text-gray-300">m</span>
          {usandoCustom && (
            <button onClick={() => setUsandoCustom(false)}
              className="text-[10px] text-red-600 hover:underline ml-1">
              Volver a ejes
            </button>
          )}
          {/* Chips resumen */}
          <div className="flex-1" />
          <div className="flex gap-1.5 text-[9px]">
            {resumenCorte.verts > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">V×{resumenCorte.verts}</span>}
            {resumenCorte.horizX > 0 && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">H⊥{resumenCorte.horizX}</span>}
            {resumenCorte.horizZ > 0 && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">H∥{resumenCorte.horizZ}</span>}
            {resumenCorte.plats > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">P×{resumenCorte.plats}</span>}
            {resumenCorte.bases > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">B×{resumenCorte.bases}</span>}
          </div>
        </div>

        {/* Vista de corte */}
        <div className="flex-1 overflow-hidden p-3 flex justify-center items-center bg-white min-h-0">
          <VistaCorte
            piezas={piezas}
            filas={filas}
            posX={posX}
            dimW={expandido ? Math.min(window.innerWidth * 0.9 - 32, 1200) : 560}
            dimH={expandido ? Math.min(window.innerHeight * 0.9 - 220, 800) : 380}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-1.5 border-t border-gray-100 text-[9px] text-gray-400 text-center shrink-0 bg-gray-50 rounded-b-xl">
          Corte transversal Y-Z · Plano perpendicular al eje X en la posición indicada · {filas.length} fila(s)
        </div>
      </div>
    </div>
  );
}
