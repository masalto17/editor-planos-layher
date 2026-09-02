import { useState, useMemo, useCallback } from 'react';
import { MousePointer2, ChevronDown, ChevronRight, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { CATALOGO, CAT_KEYS } from '../catalogo/piezas.js';
import { cargarPiezasImportadas, guardarPiezaImportada, eliminarPiezaImportada, leerArchivoPieza } from '../catalogo/importador.js';

function SeccionPaleta({ titulo, piezas, activa, onSelect, cantColocadas }) {
  const [abierta, setAbierta] = useState(true);
  const tieneActiva = piezas.some(p => activa?.id === p.id);
  return (
    <div className="mb-2">
      <button onClick={() => setAbierta(!abierta)}
        className={`w-full flex items-center gap-1 px-1 py-1 text-[10px] uppercase tracking-wide font-bold rounded hover:bg-gray-100 min-w-0 ${tieneActiva ? 'text-red-700' : 'text-gray-500'}`}>
        {abierta ? <ChevronDown size={10} className="shrink-0" /> : <ChevronRight size={10} className="shrink-0" />}
        <span className="truncate">{titulo}</span>
        {cantColocadas > 0 && <span className="ml-auto shrink-0 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0 rounded-full">{cantColocadas}</span>}
      </button>
      {abierta && (
        <div className="space-y-0.5 mt-0.5">
          {piezas.map(p => (
            <button key={p.id} onClick={() => onSelect(p)}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded border transition ${
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

// Mini-preview SVG para piezas importadas — renderiza _visual en miniatura
function MiniPreview({ visual, largo, alto, color, selected }) {
  if (!visual?.length || !largo) return (
    <div className="w-6 h-6 rounded-sm shrink-0" style={{ backgroundColor: selected ? 'white' : color }} />
  );
  const h = alto || largo * 0.5;
  const pad = Math.max(largo, h) * 0.08;
  const vb = `${-pad} ${-pad} ${largo + pad * 2} ${h + pad * 2}`;
  return (
    <svg width="28" height="28" viewBox={vb} className="shrink-0 rounded-sm" style={{ background: selected ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.04)' }}>
      {visual.map((el, i) => {
        const stroke = el.stroke === 'color' ? color : (el.stroke || color);
        const fill = (el.fill && el.fill !== 'color') ? el.fill : 'none';
        const sw = el.strokeWidth || 0.01;
        if (el.tipo === 'rectangulo')
          return <rect key={i} x={el.x} y={h - el.y - el.alto} width={el.ancho} height={el.alto} stroke={stroke} strokeWidth={sw} fill={fill} />;
        if (el.tipo === 'linea')
          return <line key={i} x1={el.desde.x} y1={h - el.desde.y} x2={el.hasta.x} y2={h - el.hasta.y} stroke={stroke} strokeWidth={sw} />;
        if (el.tipo === 'circulo')
          return <circle key={i} cx={el.x} cy={h - el.y} r={el.radio} stroke={stroke} strokeWidth={sw} fill={fill} />;
        if (el.tipo === 'polilinea' && el.puntos)
          return <polyline key={i} points={el.puntos.map(p => `${p.x},${h - p.y}`).join(' ')} stroke={stroke} strokeWidth={sw} fill={fill} strokeLinejoin="round" />;
        return null;
      })}
    </svg>
  );
}

function SeccionImportadas({ piezasImportadas, activa, onSelect, onEliminar, onImportar, cantColocadas }) {
  const [abierta, setAbierta] = useState(true);
  if (!piezasImportadas.length && !onImportar) return null;

  return (
    <div className="mb-2 mt-3 pt-2 border-t border-dashed border-gray-300">
      <button onClick={() => setAbierta(!abierta)}
        className={`w-full flex items-center gap-1 px-1 py-1 text-[10px] uppercase tracking-wide font-bold rounded hover:bg-gray-100 text-amber-700`}>
        {abierta ? <ChevronDown size={10} className="shrink-0" /> : <ChevronRight size={10} className="shrink-0" />}
        <span className="truncate">📥 Piezas importadas</span>
        {cantColocadas > 0 && <span className="ml-auto shrink-0 bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0 rounded-full">{cantColocadas}</span>}
      </button>
      {abierta && (
        <div className="space-y-0.5 mt-0.5">
          {piezasImportadas.map(p => (
            <div key={p.id} className="flex items-center gap-0.5">
              <button onClick={() => onSelect({ ...p, categoria: 'importada' })}
                className={`flex-1 flex items-center justify-between px-2 py-1.5 text-[11px] rounded-l border transition ${
                  activa?.id === p.id ? 'bg-amber-600 text-white border-amber-700' : 'bg-white border-gray-200 hover:border-gray-400 text-gray-800'}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <MiniPreview visual={p._visual} largo={p.largo} alto={p.alto} color={p.color} selected={activa?.id === p.id} />
                  <span className="font-semibold truncate">{p.nombre}</span>
                  {p._verificacion !== 'verificadaCatalogo' && (
                    <AlertTriangle size={9} className={activa?.id === p.id ? 'text-amber-200' : 'text-amber-500'} />
                  )}
                </div>
                <span className={`text-[9px] shrink-0 ml-1 ${activa?.id === p.id ? 'text-amber-100' : 'text-gray-400'}`}>{p.peso}kg</span>
              </button>
              <button onClick={() => onEliminar(p.id)} title="Quitar"
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-r border border-l-0 border-gray-200">
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          <button onClick={onImportar}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] rounded border border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 font-semibold">
            <Upload size={10} /> Importar pieza (.json)
          </button>
        </div>
      )}
    </div>
  );
}

export default function Paleta({ herramientaActiva, setHerramientaActiva, vista, piezas, embedded }) {
  const secciones = CAT_KEYS.filter(ck => !ck.vistas || ck.vistas.includes(vista));
  const [importadas, setImportadas] = useState(() => cargarPiezasImportadas());
  const cantPorCat = useMemo(() => {
    const m = {};
    (piezas || []).forEach(p => { m[p.categoria] = (m[p.categoria] || 0) + 1; });
    return m;
  }, [piezas]);

  const handleImportar = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.masalto-pieza.json';
    input.multiple = true;
    input.onchange = async () => {
      let nuevas = importadas;
      for (const file of input.files) {
        try {
          const { catalogoEntry } = await leerArchivoPieza(file);
          nuevas = guardarPiezaImportada(catalogoEntry);
        } catch (e) {
          alert(e.message);
        }
      }
      setImportadas([...nuevas]);
    };
    input.click();
  }, [importadas]);

  const handleEliminar = useCallback((id) => {
    const nuevas = eliminarPiezaImportada(id);
    setImportadas([...nuevas]);
    if (herramientaActiva?.id === id) setHerramientaActiva(null);
  }, [herramientaActiva, setHerramientaActiva]);

  const content = (
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
      <SeccionImportadas
        piezasImportadas={importadas}
        activa={herramientaActiva}
        onSelect={setHerramientaActiva}
        onEliminar={handleEliminar}
        onImportar={handleImportar}
        cantColocadas={cantPorCat['importada'] || 0}
      />
    </div>
  );

  // Modo embedded: solo contenido (el wrapper lo pone LayherEditor)
  if (embedded) return content;

  return (
    <div className="w-52 bg-white border-r border-gray-300 overflow-y-auto">
      {content}
    </div>
  );
}
