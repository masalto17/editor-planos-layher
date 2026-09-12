// Panel de atajos de teclado — se activa con ? o Shift+?
import { X } from 'lucide-react';

const SECCIONES = [
  { titulo: 'Navegación', atajos: [
    { tecla: '2 dedos / Space+arrastrar', desc: 'Mover plano (pan)' },
    { tecla: 'Pinch / Ctrl+scroll', desc: 'Zoom' },
    { tecla: '← → ↑ ↓', desc: 'Mover plano con flechas' },
    { tecla: 'Alt+click', desc: 'Pan desde punto' },
    { tecla: '0', desc: 'Encuadrar todo (zoom fit)' },
  ]},
  { titulo: 'Edición', atajos: [
    { tecla: 'Esc', desc: 'Deseleccionar herramienta / cancelar' },
    { tecla: 'Click', desc: 'Seleccionar pieza / colocar pieza' },
    { tecla: 'Shift+click', desc: 'Agregar a selección' },
    { tecla: 'Arrastrar vacío', desc: 'Rectángulo de selección' },
    { tecla: 'Arrastrar pieza', desc: 'Mover pieza(s) con snap' },
    { tecla: 'Delete / Backspace', desc: 'Eliminar seleccionadas' },
  ]},
  { titulo: 'Acciones', atajos: [
    { tecla: '⌘Z', desc: 'Deshacer' },
    { tecla: '⌘Y / ⌘⇧Z', desc: 'Rehacer' },
    { tecla: '⌘C', desc: 'Copiar' },
    { tecla: '⌘V', desc: 'Pegar' },
    { tecla: '⌘D', desc: 'Duplicar' },
    { tecla: '⌘A', desc: 'Seleccionar todo' },
    { tecla: '⌘S', desc: 'Guardar' },
  ]},
  { titulo: 'Herramientas', atajos: [
    { tecla: 'R', desc: 'Alternar orientación X / Z' },
    { tecla: 'F', desc: 'Voltear ménsula / escalera (flip)' },
    { tecla: 'G', desc: 'Mostrar/ocultar grilla' },
    { tecla: 'T', desc: 'Modo técnico (CAD)' },
    { tecla: '?', desc: 'Mostrar este panel de atajos' },
  ]},
  { titulo: 'Diagonales', atajos: [
    { tecla: 'Click 1', desc: 'Roseta de origen' },
    { tecla: 'Click 2', desc: 'Roseta de destino → coloca diagonal' },
    { tecla: 'Esc', desc: 'Cancelar colocación' },
  ]},
];

export default function AtajosPanel({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Atajos de teclado</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">MásAlto Layout · Editor de planos Layher</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-3 space-y-4">
          {SECCIONES.map(s => (
            <div key={s.titulo}>
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">{s.titulo}</h3>
              <div className="space-y-1">
                {s.atajos.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="text-[11px] text-gray-700">{a.desc}</span>
                    <kbd className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 min-w-[3rem] text-center whitespace-nowrap">{a.tecla}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-5 py-2 rounded-b-xl">
          <p className="text-[10px] text-gray-400 text-center">Presioná <kbd className="font-mono bg-white px-1 rounded border border-gray-200">?</kbd> o <kbd className="font-mono bg-white px-1 rounded border border-gray-200">Esc</kbd> para cerrar</p>
        </div>
      </div>
    </div>
  );
}
