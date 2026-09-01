import { useMemo } from 'react';
import { X, Copy, CopyPlus, Trash2 } from 'lucide-react';
import { DESPIECE_ORDER } from '../catalogo/constantes.js';
import { CAT_KEYS } from '../catalogo/piezas.js';

const CAT_LABEL = Object.fromEntries(CAT_KEYS.map(ck => [ck.cat, ck.label]));

export default function Despiece({ piezas, piezasSeleccionadas, setPiezasSeleccionadas, copiar, duplicar, eliminarSeleccion, isMobile }) {
  const despiece = useMemo(() => {
    const ag = {};
    piezas.forEach(p => {
      // Techos compuestos: desglosan en componentes reales (celosías + cumbreras + parantes)
      if (p.categoria === 'techo' && Array.isArray(p.componentes)) {
        p.componentes.forEach(c => {
          const cat = c.tipoId.startsWith('CEL') ? 'celosia'
            : c.tipoId.startsWith('CUMB') ? 'cumbrera'
            : c.tipoId.startsWith('V') ? 'vertical' : 'otro';
          if (!ag[c.tipoId]) ag[c.tipoId] = { nombre: c.nombre, categoria: cat, peso: c.peso, ref: c.ref, cantidad: 0 };
          ag[c.tipoId].cantidad += c.cantidad;
        });
        return;
      }
      if (!ag[p.tipoId]) ag[p.tipoId] = { nombre: p.nombre, categoria: p.categoria, peso: p.peso, ref: p.ref, cantidad: 0 };
      ag[p.tipoId].cantidad += 1;
    });
    const lista = Object.values(ag).sort((a, b) => (DESPIECE_ORDER[a.categoria] ?? 99) - (DESPIECE_ORDER[b.categoria] ?? 99));
    // Agrupar por categoría
    const grupos = [];
    let grupoActual = null;
    lista.forEach(it => {
      if (!grupoActual || grupoActual.categoria !== it.categoria) {
        grupoActual = { categoria: it.categoria, label: CAT_LABEL[it.categoria] || it.categoria, items: [], pesoGrupo: 0, cantGrupo: 0 };
        grupos.push(grupoActual);
      }
      grupoActual.items.push(it);
      grupoActual.pesoGrupo += it.cantidad * it.peso;
      grupoActual.cantGrupo += it.cantidad;
    });
    return { grupos, pesoTotal: piezas.reduce((s, p) => s + p.peso, 0), cantidadTotal: piezas.length };
  }, [piezas]);

  const piezaUnica = piezasSeleccionadas.length === 1 ? piezas.find(p => p.id === piezasSeleccionadas[0]) : null;

  return (
    <div className={`${isMobile ? 'w-full' : 'w-64'} bg-white border-l border-gray-300 overflow-y-auto flex flex-col text-xs`}>
      {piezasSeleccionadas.length > 1 && (
        <div className="p-2 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wide text-blue-700 font-bold">{piezasSeleccionadas.length} piezas</span>
            <button onClick={() => setPiezasSeleccionadas([])} className="text-gray-400 hover:text-gray-700"><X size={12} /></button>
          </div>
          <div className="text-gray-600 mb-1.5">Peso: <span className="font-mono font-bold">{piezas.filter(p => piezasSeleccionadas.includes(p.id)).reduce((s, p) => s + p.peso, 0).toFixed(1)} kg</span></div>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={copiar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><Copy size={10} />Copiar</button>
            <button onClick={duplicar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><CopyPlus size={10} />Duplicar</button>
            <button onClick={eliminarSeleccion} className="flex items-center justify-center gap-0.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px]"><Trash2 size={10} />Borrar</button>
          </div>
        </div>
      )}
      {piezaUnica && (
        <div className="p-2 border-b border-gray-200 bg-red-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wide text-red-700 font-bold">Seleccionada</span>
            <button onClick={() => setPiezasSeleccionadas([])} className="text-gray-400 hover:text-gray-700"><X size={12} /></button>
          </div>
          <div className="font-semibold text-black">{piezaUnica.nombre}</div>
          <div className="text-gray-600 mt-0.5">Ref: {piezaUnica.ref} · {piezaUnica.peso} kg</div>
          <div className="text-gray-500 font-mono text-[10px]">
            {piezaUnica.categoria === 'diagonal'
              ? `XY (${piezaUnica.x1.toFixed(2)},${piezaUnica.y1.toFixed(2)})→(${piezaUnica.x2.toFixed(2)},${piezaUnica.y2.toFixed(2)}) · Z:${(piezaUnica.z ?? 0).toFixed(2)}`
              : piezaUnica.categoria === 'diagonalPlanta'
              ? `XZ (${piezaUnica.x1.toFixed(2)},${piezaUnica.z1.toFixed(2)})→(${piezaUnica.x2.toFixed(2)},${piezaUnica.z2.toFixed(2)}) · Y:${piezaUnica.y.toFixed(2)}`
              : `X:${piezaUnica.x.toFixed(2)} Y:${piezaUnica.y.toFixed(2)} Z:${(piezaUnica.z ?? 0).toFixed(2)}${piezaUnica.orientacion ? ` · eje ${piezaUnica.orientacion.toUpperCase()}` : ''}`}
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1.5">
            <button onClick={duplicar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><CopyPlus size={10} />Duplicar</button>
            <button onClick={eliminarSeleccion} className="flex items-center justify-center gap-0.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px]"><Trash2 size={10} />Borrar</button>
          </div>
        </div>
      )}
      <div className="p-2 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1.5">Despiece total</div>
        {despiece.grupos.length === 0
          ? <div className="text-gray-400 italic text-[10px]">Elegí una pieza y hacé click en el canvas.</div>
          : <>
            {despiece.grupos.map((g, gi) => (
              <div key={gi} className="mb-2">
                <div className="flex items-center justify-between bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 mb-0.5">
                  <span>{g.label}</span>
                  <span className="font-mono text-gray-500">{g.pesoGrupo.toFixed(1)} kg</span>
                </div>
                <table className="w-full text-[11px]">
                  <tbody>{g.items.map((it, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-0.5 pl-1"><div className="font-semibold text-gray-800 leading-tight">{it.nombre}</div><div className="text-[9px] text-gray-400">{it.ref}</div></td>
                      <td className="text-right py-0.5 font-mono w-8">{it.cantidad}</td>
                      <td className="text-right py-0.5 font-mono text-gray-600 w-12">{(it.cantidad * it.peso).toFixed(1)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ))}
            <div className="mt-2 pt-1.5 border-t-2 border-black flex justify-between text-sm">
              <span className="font-bold">TOTAL</span>
              <span className="font-mono font-bold">{despiece.pesoTotal.toFixed(1)} kg</span>
            </div>
            <div className="text-[9px] text-gray-500 text-right">{despiece.cantidadTotal} piezas</div>
          </>}
      </div>
      {!isMobile && (
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Atajos</div>
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-0 text-[9px] text-gray-600">
            <span>Ctrl+C/V/D</span><span className="text-gray-400">Copiar/Pegar/Duplicar</span>
            <span>Ctrl+A</span><span className="text-gray-400">Seleccionar todo</span>
            <span>Ctrl+Z/Y</span><span className="text-gray-400">Deshacer/Rehacer</span>
            <span>Del</span><span className="text-gray-400">Eliminar</span>
            <span>Esc</span><span className="text-gray-400">Deseleccionar</span>
            <span>R</span><span className="text-gray-400">Alternar eje X/Z</span>
            <span>2 dedos / Space</span><span className="text-gray-400">Mover plano</span>
            <span>Flechas</span><span className="text-gray-400">Mover plano</span>
          </div>
        </div>
      )}
    </div>
  );
}
