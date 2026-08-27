import { useState, useEffect, useRef } from 'react';
import { Save, FolderOpen, Trash2, X, FileText, Clock } from 'lucide-react';

/**
 * Modal unificado para guardar / cargar / eliminar diseños.
 * Props:
 *  - modo: 'guardar' | 'cargar'
 *  - nombreActual: nombre del diseño abierto
 *  - listarDisenos(): [{nombre, fecha, cantPiezas}]
 *  - onGuardar(nombre): guarda con ese nombre
 *  - onCargar(nombre): carga ese diseño
 *  - onEliminar(nombre): borra ese diseño
 *  - onCerrar(): cierra modal
 */
export default function ModalGuardarCargar({ modo, nombreActual, listarDisenos, onGuardar, onCargar, onEliminar, onCerrar }) {
  const [nombre, setNombre] = useState(nombreActual || '');
  const [disenos, setDisenos] = useState([]);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setDisenos(listarDisenos());
  }, [listarDisenos]);

  useEffect(() => {
    if (modo === 'guardar' && inputRef.current) inputRef.current.focus();
  }, [modo]);

  const handleGuardar = () => {
    const n = nombre.trim();
    if (!n) return;
    onGuardar(n);
  };

  const handleCargar = (n) => {
    onCargar(n);
  };

  const handleEliminar = (n) => {
    if (confirmEliminar === n) {
      onEliminar(n);
      setDisenos(listarDisenos());
      setConfirmEliminar(null);
    } else {
      setConfirmEliminar(n);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCerrar}>
      <div className="bg-white rounded-lg shadow-2xl w-[480px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 font-semibold text-sm">
            {modo === 'guardar' ? <Save size={16} className="text-red-600" /> : <FolderOpen size={16} className="text-red-600" />}
            {modo === 'guardar' ? 'Guardar diseño' : 'Cargar diseño'}
          </div>
          <button onClick={onCerrar} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        </div>

        {/* Guardar: input nombre */}
        {modo === 'guardar' && (
          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
            <label className="text-xs text-gray-500 mb-1 block">Nombre del diseño</label>
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuardar()}
                placeholder="Ej: Escenario Rock 40m"
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500" />
              <button onClick={handleGuardar} disabled={!nombre.trim()}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Guardar
              </button>
            </div>
            {disenos.some(d => d.nombre === nombre.trim()) && (
              <p className="text-[10px] text-amber-600 mt-1">⚠ Ya existe — se sobreescribirá</p>
            )}
          </div>
        )}

        {/* Lista de diseños guardados */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {disenos.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">No hay diseños guardados</div>
          ) : (
            <div className="space-y-1">
              {disenos.map(d => (
                <div key={d.nombre}
                  className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 group ${modo === 'cargar' ? 'cursor-pointer' : ''}`}
                  onClick={() => modo === 'cargar' && handleCargar(d.nombre)}>
                  <FileText size={14} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.nombre}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><Clock size={9} /> {d.fechaCorta}</span>
                      <span>{d.cantPiezas} pieza{d.cantPiezas !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {modo === 'guardar' && (
                    <button onClick={(e) => { e.stopPropagation(); setNombre(d.nombre); }}
                      className="text-[10px] text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 px-1">
                      usar nombre
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleEliminar(d.nombre); }}
                    className={`p-1 rounded ${confirmEliminar === d.nombre ? 'bg-red-100 text-red-600' : 'text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100'}`}
                    title={confirmEliminar === d.nombre ? 'Click de nuevo para confirmar' : 'Eliminar'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
          Almacenamiento local del navegador · {disenos.length} diseño{disenos.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
