import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MousePointer2, ChevronDown, ChevronRight, Upload, Trash2, AlertTriangle, Search, X, Clock } from 'lucide-react';
import { CATALOGO, CAT_KEYS } from '../catalogo/piezas.js';
import { cargarPiezasImportadas, guardarPiezaImportada, eliminarPiezaImportada, leerArchivoPieza } from '../catalogo/importador.js';

// ─── Supergrupos lógicos (orden de armado) ─────────────────────────
const GRUPOS = [
  { id: 'estructura', label: 'Estructura', icon: '🏗️',
    cats: ['bases', 'collarines', 'verticales', 'horizontalesO', 'diagonales', 'diagonalesPlanta'] },
  { id: 'pisos', label: 'Pisos y Vigas', icon: '🪵',
    cats: ['vigasPuente', 'horizontalesU', 'stringers', 'plataformas', 'fenolicos'] },
  { id: 'proteccion', label: 'Protección y Acceso', icon: '🛡️',
    cats: ['rodapies', 'barandillas', 'escaleras'] },
  { id: 'complementos', label: 'Complementos', icon: '🔧',
    cats: ['mensulas', 'apoyaTechos', 'celosias', 'cumbreras', 'techos'] },
  { id: 'tecnica', label: 'Técnica / Rigging', icon: '🎤',
    cats: ['truss', 'vigasIPN'] },
];

// ─── Mini-preview SVG por categoría ────────────────────────────────
function PiezaPreview({ pieza, selected, size = 24 }) {
  const c = selected ? '#fff' : pieza.color;
  const bg = selected ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';
  const sw = 1.5;
  const s = size;
  const m = 3; // margin

  const cat = pieza.categoria;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0 rounded-sm" style={{ background: bg }}>
      {cat === 'vertical' && <>
        <line x1={s/2} y1={m} x2={s/2} y2={s-m} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        {[0.25, 0.5, 0.75].map(t => <circle key={t} cx={s/2} cy={m + (s-2*m)*t} r={1.5} fill={c} />)}
      </>}
      {cat === 'horizontalO' && <>
        <line x1={m} y1={s/2} x2={s-m} y2={s/2} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <rect x={m-1} y={s/2-2.5} width={4} height={5} fill={c} rx={0.5} />
        <rect x={s-m-3} y={s/2-2.5} width={4} height={5} fill={c} rx={0.5} />
      </>}
      {cat === 'vigaPuente' && <>
        <line x1={m} y1={s/2-2} x2={s-m} y2={s/2-2} stroke={c} strokeWidth={sw} />
        <line x1={m} y1={s/2+2} x2={s-m} y2={s/2+2} stroke={c} strokeWidth={sw} />
        <line x1={m} y1={s/2-2} x2={m} y2={s/2+2} stroke={c} strokeWidth={sw} />
        <line x1={s-m} y1={s/2-2} x2={s-m} y2={s/2+2} stroke={c} strokeWidth={sw} />
      </>}
      {cat === 'horizontalU' && <>
        <line x1={m} y1={s/2-1.5} x2={s-m} y2={s/2-1.5} stroke={c} strokeWidth={sw*0.8} />
        <line x1={m} y1={s/2+1.5} x2={s-m} y2={s/2+1.5} stroke={c} strokeWidth={sw*0.8} />
        <line x1={m} y1={s/2-1.5} x2={m} y2={s/2+1.5} stroke={c} strokeWidth={sw*0.8} />
      </>}
      {cat === 'plataforma' && <>
        <rect x={m} y={m+2} width={s-2*m} height={s-2*m-4} fill={c} opacity={0.25} stroke={c} strokeWidth={sw*0.6} rx={1} />
        {[0.3, 0.5, 0.7].map(t => <line key={t} x1={m + (s-2*m)*t} y1={m+3} x2={m + (s-2*m)*t} y2={s-m-3} stroke={c} strokeWidth={0.5} opacity={0.5} />)}
      </>}
      {cat === 'barandilla' && <>
        <line x1={m} y1={s/2} x2={s-m} y2={s/2} stroke={c} strokeWidth={sw} strokeDasharray="2 2" strokeLinecap="round" />
        <rect x={m-1} y={s/2-2} width={3} height={4} fill={c} rx={0.5} />
        <rect x={s-m-2} y={s/2-2} width={3} height={4} fill={c} rx={0.5} />
      </>}
      {cat === 'rodapie' && <rect x={m} y={s/2-1.5} width={s-2*m} height={3} fill={c} rx={0.5} />}
      {cat === 'diagonal' && <line x1={m} y1={s-m} x2={s-m} y2={m} stroke={c} strokeWidth={sw} strokeLinecap="round" />}
      {cat === 'diagonalPlanta' && <>
        <line x1={m} y1={s-m} x2={s-m} y2={m} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <circle cx={m} cy={s-m} r={1.5} fill={c} />
        <circle cx={s-m} cy={m} r={1.5} fill={c} />
      </>}
      {cat === 'base' && <>
        <line x1={s/2} y1={m} x2={s/2} y2={s-m-3} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <rect x={s/2-5} y={s-m-3} width={10} height={3} fill={c} rx={0.5} />
      </>}
      {cat === 'collarin' && <>
        <rect x={s/2-5} y={s/2-2} width={10} height={4} fill={c} opacity={0.3} stroke={c} strokeWidth={sw*0.6} rx={1} />
        <circle cx={s/2} cy={s/2} r={1.5} fill="#fff" stroke={c} strokeWidth={0.8} />
      </>}
      {cat === 'mensula' && <>
        <line x1={m} y1={s/2} x2={s-m} y2={s/2} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <line x1={m} y1={s-m-2} x2={s-m} y2={s/2} stroke={c} strokeWidth={sw*0.7} strokeDasharray="1.5 1.5" />
      </>}
      {cat === 'escalera' && <>
        <line x1={m} y1={s-m} x2={s-m} y2={m+2} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        {[0.25, 0.45, 0.65, 0.85].map(t => {
          const px = m + (s-2*m)*t, py = (s-m) - (s-2*m-2)*t;
          return <line key={t} x1={px-2} y1={py} x2={px+2} y2={py} stroke={c} strokeWidth={sw*0.7} />;
        })}
      </>}
      {cat === 'apoyaTecho' && <>
        <line x1={s/2} y1={s-m} x2={s/2} y2={m+2} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <line x1={s/2-4} y1={m+2} x2={s/2+4} y2={m+2} stroke={c} strokeWidth={sw} strokeLinecap="round" />
      </>}
      {cat === 'fenolico' && <rect x={m} y={m+3} width={s-2*m} height={s-2*m-6} fill="#5D3A1A" opacity={0.35} stroke="#5D3A1A" strokeWidth={sw*0.6} rx={1} />}
      {cat === 'stringer' && <rect x={m} y={s/2-2} width={s-2*m} height={4} fill={c} opacity={0.3} stroke={c} strokeWidth={sw*0.6} rx={0.5} />}
      {(cat === 'celosia' || cat === 'truss') && <>
        <line x1={m} y1={m+2} x2={s-m} y2={m+2} stroke={c} strokeWidth={sw*0.7} />
        <line x1={m} y1={s-m-2} x2={s-m} y2={s-m-2} stroke={c} strokeWidth={sw*0.7} />
        <line x1={m} y1={m+2} x2={m} y2={s-m-2} stroke={c} strokeWidth={sw*0.7} />
        <line x1={s-m} y1={m+2} x2={s-m} y2={s-m-2} stroke={c} strokeWidth={sw*0.7} />
        <line x1={m} y1={s-m-2} x2={s/2} y2={m+2} stroke={c} strokeWidth={sw*0.5} />
        <line x1={s/2} y1={m+2} x2={s-m} y2={s-m-2} stroke={c} strokeWidth={sw*0.5} />
      </>}
      {cat === 'cumbrera' && <>
        <line x1={m} y1={s-m-2} x2={s/2} y2={m+2} stroke={c} strokeWidth={sw} />
        <line x1={s/2} y1={m+2} x2={s-m} y2={s-m-2} stroke={c} strokeWidth={sw} />
      </>}
      {cat === 'techo' && <>
        <line x1={m} y1={s-m-2} x2={s/2} y2={m+1} stroke={c} strokeWidth={sw} />
        <line x1={s/2} y1={m+1} x2={s-m} y2={s-m-2} stroke={c} strokeWidth={sw} />
        <line x1={m} y1={s-m-2} x2={s-m} y2={s-m-2} stroke={c} strokeWidth={sw*0.5} opacity={0.4} />
      </>}
      {cat === 'vigaIPN' && <>
        <line x1={m} y1={s/2} x2={s-m} y2={s/2} stroke={c} strokeWidth={sw} />
        <line x1={m} y1={s/2-4} x2={m} y2={s/2+4} stroke={c} strokeWidth={sw*1.5} />
        <line x1={s-m} y1={s/2-4} x2={s-m} y2={s/2+4} stroke={c} strokeWidth={sw*1.5} />
      </>}
      {/* Fallback para categorías no dibujadas arriba */}
      {!['vertical','horizontalO','vigaPuente','horizontalU','plataforma','barandilla','rodapie','diagonal','diagonalPlanta','base','collarin','mensula','escalera','apoyaTecho','fenolico','stringer','celosia','truss','cumbrera','techo','vigaIPN'].includes(cat) &&
        <rect x={m} y={m} width={s-2*m} height={s-2*m} fill={c} opacity={0.2} stroke={c} strokeWidth={sw*0.5} rx={2} />
      }
    </svg>
  );
}

// Mini-preview SVG para piezas importadas — renderiza _visual en miniatura
function MiniPreviewImportada({ visual, largo, alto, color, selected }) {
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

// ─── Pieza individual ──────────────────────────────────────────────
function PiezaItem({ pieza, activa, onSelect, showRef }) {
  const sel = activa?.id === pieza.id;
  const medida = pieza.categoria === 'diagonal'
    ? `${pieza.ancho.toFixed(2)}×${pieza.alto.toFixed(2)}`
    : pieza.anchoPlat
      ? `${pieza.anchoPlat.toFixed(2)}×${pieza.largo.toFixed(2)}`
      : pieza.categoria === 'techo'
        ? `${pieza.largo.toFixed(2)}m (${pieza.modulosAncho} mód)`
        : `${pieza.largo.toFixed(2)}m`;

  return (
    <button onClick={() => onSelect(pieza)}
      title={`${pieza.nombre}\nRef: ${pieza.ref}\nPeso: ${pieza.peso} kg`}
      className={`w-full flex items-center gap-1.5 px-1.5 py-1 text-[11px] rounded border transition-all group ${
        sel ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-400 hover:shadow-sm text-gray-800'}`}>
      <PiezaPreview pieza={pieza} selected={sel} size={22} />
      <div className="flex-1 min-w-0 text-left">
        <span className="font-semibold">{medida}</span>
        {showRef && <span className={`ml-1 text-[8px] ${sel ? 'text-red-200' : 'text-gray-400'}`}>{pieza.ref}</span>}
      </div>
      <span className={`text-[9px] shrink-0 tabular-nums ${sel ? 'text-red-100' : 'text-gray-400'}`}>{pieza.peso}kg</span>
    </button>
  );
}

// ─── Sección colapsable ────────────────────────────────────────────
function SeccionPaleta({ titulo, piezas, activa, onSelect, cantColocadas, tooltip, showRef, defaultOpen = true }) {
  const [abierta, setAbierta] = useState(defaultOpen);
  const tieneActiva = piezas.some(p => activa?.id === p.id);

  // Abrir automáticamente si la pieza activa está en esta sección
  useEffect(() => {
    if (tieneActiva && !abierta) setAbierta(true);
  }, [tieneActiva]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-1">
      <button onClick={() => setAbierta(!abierta)} title={tooltip || ''}
        className={`w-full flex items-center gap-1 px-1 py-0.5 text-[10px] uppercase tracking-wide font-bold rounded hover:bg-gray-100 min-w-0 ${tieneActiva ? 'text-red-700' : 'text-gray-500'}`}>
        {abierta ? <ChevronDown size={9} className="shrink-0" /> : <ChevronRight size={9} className="shrink-0" />}
        <span className="truncate">{titulo}</span>
        {cantColocadas > 0 && <span className="ml-auto shrink-0 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0 rounded-full">{cantColocadas}</span>}
      </button>
      {abierta && (
        <div className="space-y-0.5 mt-0.5">
          {piezas.map(p => (
            <PiezaItem key={p.id} pieza={p} activa={activa} onSelect={onSelect} showRef={showRef} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Supergrupo (contiene varias secciones) ────────────────────────
function SuperGrupo({ grupo, secciones, activa, onSelect, cantPorCat, showRef, searchMode }) {
  const [abierto, setAbierto] = useState(true);
  const totalColocadas = secciones.reduce((sum, ck) => sum + (cantPorCat[ck.cat] || 0), 0);
  const tieneActiva = secciones.some(ck =>
    CATALOGO[ck.key].some(p => activa?.id === p.id)
  );

  // Abrir automáticamente si tiene pieza activa
  useEffect(() => {
    if (tieneActiva && !abierto) setAbierto(true);
  }, [tieneActiva]); // eslint-disable-line react-hooks/exhaustive-deps

  if (secciones.length === 0) return null;

  return (
    <div className="mb-1">
      <button onClick={() => setAbierto(!abierto)}
        className={`w-full flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-extrabold rounded transition-colors ${
          tieneActiva ? 'bg-red-50 text-red-800' : 'hover:bg-gray-50 text-gray-700'}`}>
        {abierto ? <ChevronDown size={11} className="shrink-0" /> : <ChevronRight size={11} className="shrink-0" />}
        <span>{grupo.icon}</span>
        <span className="truncate">{grupo.label}</span>
        {totalColocadas > 0 && <span className="ml-auto shrink-0 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0 rounded-full">{totalColocadas}</span>}
      </button>
      {abierto && (
        <div className="pl-2 border-l-2 border-gray-100 ml-2 mt-0.5 space-y-0">
          {secciones.map(ck => (
            <SeccionPaleta key={ck.key} titulo={ck.label}
              tooltip={ck.tooltip}
              piezas={CATALOGO[ck.key].map(p => ({ ...p, categoria: ck.cat }))}
              activa={activa} onSelect={onSelect}
              cantColocadas={cantPorCat[ck.cat] || 0}
              showRef={showRef}
              defaultOpen={searchMode || secciones.length <= 2} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sección Importadas ────────────────────────────────────────────
function SeccionImportadas({ piezasImportadas, activa, onSelect, onEliminar, onImportar, cantColocadas }) {
  const [abierta, setAbierta] = useState(true);
  if (!piezasImportadas.length && !onImportar) return null;

  return (
    <div className="mb-2 mt-2 pt-2 border-t border-dashed border-gray-300">
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
                  <MiniPreviewImportada visual={p._visual} largo={p.largo} alto={p.alto} color={p.color} selected={activa?.id === p.id} />
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

// ─── Sección Últimas usadas ────────────────────────────────────────
function UltimasUsadas({ recientes, activa, onSelect }) {
  if (recientes.length === 0) return null;
  return (
    <div className="mb-2 pb-1.5 border-b border-gray-200">
      <div className="flex items-center gap-1 px-1 py-0.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
        <Clock size={9} /> Recientes
      </div>
      <div className="flex flex-wrap gap-1 mt-0.5 px-0.5">
        {recientes.map(p => {
          const sel = activa?.id === p.id;
          const medida = p.categoria === 'diagonal'
            ? `${p.ancho.toFixed(2)}×${p.alto.toFixed(2)}`
            : p.anchoPlat ? `${p.anchoPlat.toFixed(2)}×${p.largo.toFixed(2)}`
            : `${p.largo.toFixed(2)}m`;
          return (
            <button key={p.id} onClick={() => onSelect(p)}
              title={`${p.nombre}\n${p.ref}`}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border transition ${
                sel ? 'bg-red-600 text-white border-red-700' : 'bg-gray-50 border-gray-200 hover:border-gray-400 text-gray-700'}`}>
              <PiezaPreview pieza={p} selected={sel} size={16} />
              <span className="font-semibold">{medida}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Paleta principal ──────────────────────────────────────────────
export default function Paleta({ herramientaActiva, setHerramientaActiva, vista, piezas, embedded }) {
  const [busqueda, setBusqueda] = useState('');
  const [showRef, setShowRef] = useState(false);
  const [recientes, setRecientes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('layher:recientes') || '[]'); } catch { return []; }
  });
  const searchRef = useRef(null);

  const [importadas, setImportadas] = useState(() => cargarPiezasImportadas());
  useEffect(() => {
    const refresh = event => { if (event.key === 'layher:piezas-importadas') setImportadas(cargarPiezasImportadas()); };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const cantPorCat = useMemo(() => {
    const m = {};
    (piezas || []).forEach(p => { m[p.categoria] = (m[p.categoria] || 0) + 1; });
    return m;
  }, [piezas]);

  // Rastrear piezas recientes
  const handleSelect = useCallback((pieza) => {
    setHerramientaActiva(pieza);
    if (pieza) {
      setRecientes(prev => {
        const next = [pieza, ...prev.filter(p => p.id !== pieza.id)].slice(0, 6);
        try { localStorage.setItem('layher:recientes', JSON.stringify(next)); } catch { /* noop */ }
        return next;
      });
    }
  }, [setHerramientaActiva]);

  // Todas las secciones visibles según vista
  const seccionesVisibles = useMemo(() =>
    CAT_KEYS.filter(ck => !ck.vistas || ck.vistas.includes(vista)),
    [vista]
  );

  // Búsqueda: filtrar secciones y piezas
  const hayBusqueda = busqueda.trim().length > 0;
  const terminoBusqueda = busqueda.trim().toLowerCase();

  const seccionesFiltradas = useMemo(() => {
    if (!hayBusqueda) return seccionesVisibles;
    return seccionesVisibles.filter(ck => {
      // Filtrar si la sección misma o alguna pieza coincide
      if (ck.label.toLowerCase().includes(terminoBusqueda)) return true;
      return CATALOGO[ck.key].some(p =>
        (p.nombre || '').toLowerCase().includes(terminoBusqueda) ||
        (p.ref || '').toLowerCase().includes(terminoBusqueda) ||
        String(p.largo).includes(terminoBusqueda) ||
        (p.anchoPlat && `${p.anchoPlat}`.includes(terminoBusqueda))
      );
    });
  }, [seccionesVisibles, hayBusqueda, terminoBusqueda]);

  // Agrupar secciones filtradas en supergrupos
  const gruposVisibles = useMemo(() => {
    return GRUPOS.map(g => ({
      ...g,
      secciones: seccionesFiltradas.filter(ck => g.cats.includes(ck.key))
    })).filter(g => g.secciones.length > 0);
  }, [seccionesFiltradas]);

  // Atajo teclado: Ctrl+F enfoca la búsqueda (solo cuando la paleta está visible)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && searchRef.current) {
        // No capturar si estamos en un input/textarea del canvas
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="p-1.5">
      {/* Buscador */}
      <div className="relative mb-1.5">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
        <input ref={searchRef}
          type="text" value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar pieza, ref, medida..."
          className="w-full pl-6 pr-7 py-1.5 text-[11px] rounded border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none bg-gray-50 placeholder:text-gray-400" />
        {busqueda && (
          <button onClick={() => setBusqueda('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
            <X size={11} />
          </button>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-1 mb-1.5">
        <button onClick={() => setHerramientaActiva(null)}
          className={`flex-1 flex items-center justify-center gap-1 px-1 py-1 text-[10px] rounded border transition font-semibold ${
            !herramientaActiva ? 'bg-red-600 text-white border-red-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
          <MousePointer2 size={11} /> Seleccionar
        </button>
        <button onClick={() => setShowRef(!showRef)}
          title="Mostrar/ocultar referencias de catálogo"
          className={`px-2 py-1 text-[10px] rounded border transition font-mono ${
            showRef ? 'bg-gray-700 text-white border-gray-800' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-500'}`}>
          Ref
        </button>
        <a href={`${import.meta.env.BASE_URL}piezas/index.html`} target="_blank" rel="noopener noreferrer"
          className="px-2 py-1 text-[10px] rounded border border-amber-400 text-amber-700 hover:bg-amber-50 font-semibold flex items-center">
          + Crear
        </a>
      </div>

      {/* Últimas usadas */}
      {!hayBusqueda && <UltimasUsadas recientes={recientes} activa={herramientaActiva} onSelect={handleSelect} />}

      {/* Catálogo agrupado */}
      {hayBusqueda && seccionesFiltradas.length === 0 && (
        <div className="text-center py-4 text-gray-400 text-[11px]">
          Sin resultados para «{busqueda}»
        </div>
      )}
      {gruposVisibles.map(g => (
        <SuperGrupo key={g.id}
          grupo={g}
          secciones={g.secciones}
          activa={herramientaActiva}
          onSelect={handleSelect}
          cantPorCat={cantPorCat}
          showRef={showRef}
          searchMode={hayBusqueda} />
      ))}

      {/* Importadas */}
      <SeccionImportadas
        piezasImportadas={importadas}
        activa={herramientaActiva}
        onSelect={p => handleSelect({ ...p, categoria: 'importada' })}
        onEliminar={handleEliminar}
        onImportar={handleImportar}
        cantColocadas={cantPorCat['importada'] || 0}
      />
    </div>
  );

  // Modo embedded: solo contenido (el wrapper lo pone LayherEditor)
  if (embedded) return content;

  return (
    <div className="w-56 bg-white border-r border-gray-300 overflow-y-auto">
      {content}
    </div>
  );
}
