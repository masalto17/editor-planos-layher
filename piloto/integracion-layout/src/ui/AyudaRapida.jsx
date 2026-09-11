import { useState, useEffect } from 'react';
import { X, MousePointer, Move, ZoomIn, Copy, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'layher-ayuda-vista';

/**
 * Panel de ayuda rápida — se muestra una vez en el primer uso.
 * El usuario lo puede cerrar y no vuelve a aparecer.
 * También se puede abrir desde el Toolbar con botón "?".
 */
export default function AyudaRapida({ forzar, onCerrar }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forzar) { setVisible(true); return; }
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* ignore */ }
  }, [forzar]);

  const cerrar = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    if (onCerrar) onCerrar();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cerrar}>
      <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[92vw] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-3 rounded-t-xl flex items-center justify-between">
          <div>
            <div className="font-bold text-base">Bienvenido al Editor de Planos</div>
            <div className="text-red-200 text-xs">MásAlto · Sistema Layher Allround</div>
          </div>
          <button onClick={cerrar} className="hover:bg-white/20 rounded p-1"><X size={18} /></button>
        </div>

        {/* Contenido */}
        <div className="px-5 py-4 space-y-4 text-sm text-gray-700">
          {/* Colocar piezas */}
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-2 mb-1">
              <MousePointer size={14} className="text-red-600" /> Colocar piezas
            </div>
            <p className="text-xs leading-relaxed">
              Elegí una pieza del <strong>catálogo izquierdo</strong> y hacé click en el canvas para colocarla.
              El snap automático alinea a rosetas y módulos estándar. Presioná <kbd className="bg-gray-200 px-1 rounded text-[10px]">Esc</kbd> para volver a modo selección.
            </p>
          </div>

          {/* Navegar */}
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-2 mb-1">
              <Move size={14} className="text-blue-600" /> Navegar el plano
            </div>
            <p className="text-xs leading-relaxed">
              <strong>Zoom:</strong> pinch en trackpad, o Ctrl+scroll, o botones <strong>+/−</strong> abajo a la derecha.<br/>
              <strong>Mover:</strong> 2 dedos en trackpad, o <kbd className="bg-gray-200 px-1 rounded text-[10px]">Space</kbd>+arrastrar, o flechas del teclado.
            </p>
          </div>

          {/* Selección */}
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-2 mb-1">
              <ZoomIn size={14} className="text-green-600" /> Seleccionar y editar
            </div>
            <p className="text-xs leading-relaxed">
              Click en una pieza para seleccionarla. <kbd className="bg-gray-200 px-1 rounded text-[10px]">Shift</kbd>+click agrega a la selección.
              Arrastrá un rectángulo para selección múltiple. Luego podés mover, copiar o eliminar.
            </p>
          </div>

          {/* Atajos */}
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-2 mb-1">
              <Copy size={14} className="text-purple-600" /> Atajos de teclado
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <div><kbd className="bg-gray-200 px-1 rounded text-[10px]">Ctrl+C/V/D</kbd> Copiar/Pegar/Duplicar</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-[10px]">Ctrl+Z/Y</kbd> Deshacer/Rehacer</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-[10px]">Del</kbd> Eliminar seleccionadas</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-[10px]">Ctrl+A</kbd> Seleccionar todo</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-[10px]">R</kbd> Alternar eje X/Z</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-[10px]">Esc</kbd> Deseleccionar / cancelar</div>
            </div>
          </div>

          {/* Vistas */}
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-2 mb-1">
              <Trash2 size={14} className="text-amber-600" /> Alzado y Planta
            </div>
            <p className="text-xs leading-relaxed">
              Cambiá entre <strong>Alzado</strong> (vista frontal X-Y) y <strong>Planta</strong> (vista superior X-Z)
              con los botones arriba. Ambas vistas comparten las mismas piezas.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-between">
          <span className="text-[10px] text-gray-400">No se muestra de nuevo</span>
          <button onClick={cerrar} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded">
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}
