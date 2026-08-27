import { useState, useMemo } from 'react';
import { MousePointer2, ChevronDown, ChevronRight } from 'lucide-react';
import { CATALOGO, CAT_KEYS } from '../catalogo/piezas.js';

function SeccionPaleta({ titulo, piezas, activa, onSelect, cantColocadas }) {
  const [abierta, setAbierta] = useState(true);
  const tieneActiva = piezas.some(p => activa?.id === p.id);
  return (
    <div className="mb-2">
      <button onClick={() => setAbierta(!abierta)}
        className={`w-full flex items-center gap-1 px-1 py-1 text-[10px] uppercase tracking-wider font-bold rounded hover:bg-gray-100 ${tieneActiva ? 'text-red-700' : 'text-gray-500'}`}>
        {abierta ? <ChevronDown size={10} /> : <ChevronRight size={10} />} {titulo}
        {cantColocadas > 0 && <span className="ml-auto bg-red-600 text-white text-[8px] font-bold px-1.5 py-0 rounded-full">{cantColocadas}</span>}
      </button>
      {abierta && (
        <div className="space-y-0.5 mt-0.5">
          {piezas.map(p => (
            <button key={p.id} onClick={() => onSelect(p)}
              className={`w-full flex items-center justify-between px-2 py-1 text-[11px] rounded border transition ${
                activa?.id === p.id ? 'bg-red-600 text-white border-red-700' : 'bg-white border-gray-200 hover:border-gray-400 text-gray-800'}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: activa?.id === p.id ? 'white' : p.color }} />
                <span className="font-semibold">
                  {p.categoria === 'diagonal' ? `${p.ancho.toFixed(2)}×${p.alto.toFixed(2)}` :
                   p.anchoPlat ? `${p.anchoPlat.toFixed(2)}×${p.largo.toFixed(2)}` :
                   `${p.largo.toFixed(2)}m`}
                </span>
              </div>
              <span className={`text-[9px] ${activa?.id === p.id ? 'text-red-100' : 'text-gray-400'}`}>{p.peso}kg</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Paleta({ herramientaActiva, setHerramientaActiva, vista, piezas }) {
  const secciones = CAT_KEYS.filter(ck => !ck.vistas || ck.vistas.includes(vista));
  const cantPorCat = useMemo(() => {
    const m = {};
    (piezas || []).forEach(p => { m[p.categoria] = (m[p.categoria] || 0) + 1; });
    return m;
  }, [piezas]);
  return (
    <div className="w-52 bg-white border-r border-gray-300 overflow-y-auto">
      <div className="p-2">
        <button onClick={() => setHerramientaActiva(null)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 mb-2 text-xs rounded border ${!herramientaActiva ? 'bg-red-600 text-white border-red-700' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}>
          <MousePointer2 size={13} /> Seleccionar / mover
        </button>
        {secciones.map(ck => (
          <SeccionPaleta key={ck.key} titulo={ck.label}
            piezas={CATALOGO[ck.key].map(p => ({ ...p, categoria: ck.cat }))}
            activa={herramientaActiva} onSelect={setHerramientaActiva}
            cantColocadas={cantPorCat[ck.cat] || 0} />
        ))}
      </div>
    </div>
  );
}
