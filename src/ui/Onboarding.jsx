import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'masalto:onboarding-visto';

const PASOS = [
  {
    titulo: 'Bienvenido a MásAlto Layout',
    texto: 'Diseñá estructuras Layher Allround arrastrando piezas del catálogo al canvas. Todo snap automático a rosetas y módulos estándar.',
    icono: '🏗️',
  },
  {
    titulo: 'Elegí una pieza',
    texto: 'En el panel izquierdo seleccioná la pieza (vertical, horizontal, plataforma...) y hacé click en el canvas para colocarla. El sistema snapea automáticamente.',
    icono: '📦',
  },
  {
    titulo: 'Navegá el plano',
    texto: 'Zoom: pinch en trackpad o scroll. Mover: 2 dedos, Space+drag, o Alt+click. Flechas del teclado también mueven el plano.',
    icono: '🖱️',
  },
  {
    titulo: 'Despiece en vivo',
    texto: 'El panel derecho muestra el listado de materiales actualizado al instante. Podés exportar a CSV para tus remitos.',
    icono: '📋',
  },
  {
    titulo: 'Arrancá con una plantilla',
    texto: 'Si no sabés por dónde empezar, usá una plantilla predefinida desde el botón "Plantillas" en la barra superior. Después modificala a gusto.',
    icono: '🚀',
  },
];

export default function Onboarding({ forzar = false, onCerrar }) {
  const [visible, setVisible] = useState(false);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (forzar) {
      setVisible(true);
      setPaso(0);
      return;
    }
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {}
  }, [forzar]);

  const cerrar = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    if (onCerrar) onCerrar();
  };

  const siguiente = () => {
    if (paso < PASOS.length - 1) setPaso(paso + 1);
    else cerrar();
  };

  if (!visible) return null;

  const p = PASOS[paso];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={cerrar}>
      <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[92vw] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header rojo */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 text-white relative">
          <button onClick={cerrar} className="absolute top-3 right-3 text-white/60 hover:text-white"><X size={18} /></button>
          <div className="text-4xl mb-2">{p.icono}</div>
          <h2 className="text-lg font-bold leading-tight">{p.titulo}</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700 leading-relaxed">{p.texto}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-1.5">
            {PASOS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === paso ? 'bg-red-600' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={cerrar} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
              Saltar
            </button>
            <button
              onClick={siguiente}
              className="flex items-center gap-1 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-colors"
            >
              {paso < PASOS.length - 1 ? 'Siguiente' : 'Empezar'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
