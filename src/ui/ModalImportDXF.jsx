import { useState, useCallback, useRef, useMemo } from 'react';
import { X, Upload, FileDown, Layers, AlertTriangle, CheckCircle2, Eye, EyeOff, Zap } from 'lucide-react';
import { leerArchivoDXF, sugerenciasAPiezas } from '../import/dxfParser.js';

// Colores por categoría para el preview
const CAT_PREVIEW_COLOR = {
  vertical: '#3b82f6',
  horizontalO: '#22c55e',
  diagonal: '#a78bfa',
  plataforma: '#e11d48',
};

function PreviewSVG({ geometrias, sugerencias, bounds, capasVisibles, mostrarSugerencias }) {
  if (!geometrias.length) return null;

  const pad = 0.5;
  const w = (bounds.xMax - bounds.xMin) + pad * 2;
  const h = (bounds.yMax - bounds.yMin) + pad * 2;
  const vb = `${bounds.xMin - pad} ${-bounds.yMax - pad} ${w} ${h}`;

  return (
    <svg viewBox={vb} className="w-full h-48 bg-gray-900 rounded border border-gray-700" preserveAspectRatio="xMidYMid meet">
      {/* Geometría original del DXF */}
      {geometrias.map((g, i) => {
        if (!capasVisibles.has(g.layer || '')) return null;
        if (g.tipo === 'linea') {
          return <line key={`g${i}`} x1={g.x1} y1={-g.y1} x2={g.x2} y2={-g.y2}
            stroke="#6b7280" strokeWidth={w * 0.003} opacity="0.6" />;
        }
        if (g.tipo === 'circulo') {
          return <circle key={`g${i}`} cx={g.cx} cy={-g.cy} r={g.radio}
            fill="none" stroke="#6b7280" strokeWidth={w * 0.002} opacity="0.5" />;
        }
        if (g.tipo === 'polilinea' && g.vertices.length >= 2) {
          const pts = g.vertices.map(v => `${v.x},${-v.y}`).join(' ');
          return <polyline key={`g${i}`} points={pts}
            fill="none" stroke="#6b7280" strokeWidth={w * 0.002} opacity="0.5" />;
        }
        return null;
      })}

      {/* Sugerencias Layher encima */}
      {mostrarSugerencias && sugerencias.map((s, i) => {
        const color = CAT_PREVIEW_COLOR[s.categoria] || '#f59e0b';
        if (s.categoria === 'diagonal') {
          return <line key={`s${i}`} x1={s.x1} y1={-s.y1} x2={s.x2} y2={-s.y2}
            stroke={color} strokeWidth={w * 0.006} opacity="0.85" />;
        }
        if (s.categoria === 'vertical') {
          return <line key={`s${i}`} x1={s.x} y1={-s.y} x2={s.x} y2={-(s.y + s.largo)}
            stroke={color} strokeWidth={w * 0.006} opacity="0.85" />;
        }
        // horizontalO, plataforma
        return <line key={`s${i}`} x1={s.x} y1={-s.y} x2={s.x + s.largo} y2={-s.y}
          stroke={color} strokeWidth={w * 0.006} opacity="0.85" />;
      })}
    </svg>
  );
}

export default function ModalImportDXF({ onClose, onImportar }) {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [capasVisibles, setCapasVisibles] = useState(new Set());
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const [confianzaMin, setConfianzaMin] = useState(0.5);
  const [escala, setEscala] = useState(1);
  const [unidad, setUnidad] = useState('m'); // m, cm, mm
  const fileRef = useRef(null);

  const handleArchivo = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true);
    setError(null);
    try {
      const res = await leerArchivoDXF(file);
      setResultado({ ...res, nombre: file.name });
      setCapasVisibles(new Set(res.capas.length > 0 ? res.capas : ['']));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const escalaFinal = useMemo(() => {
    const base = escala;
    if (unidad === 'cm') return base * 0.01;
    if (unidad === 'mm') return base * 0.001;
    return base;
  }, [escala, unidad]);

  const piezasImportar = useMemo(() => {
    if (!resultado) return [];
    return sugerenciasAPiezas(resultado.sugerencias, {
      escala: escalaFinal,
      confianzaMinima: confianzaMin,
    });
  }, [resultado, escalaFinal, confianzaMin]);

  const toggleCapa = (capa) => {
    setCapasVisibles(prev => {
      const next = new Set(prev);
      if (next.has(capa)) next.delete(capa);
      else next.add(capa);
      return next;
    });
  };

  const confirmarImportar = () => {
    if (piezasImportar.length > 0) {
      onImportar(piezasImportar);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileDown size={16} className="text-blue-600" />
              Importar archivo DXF
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              SketchUp, AutoCAD, Tekla y otros → detección automática de piezas Layher
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Zona de carga */}
          {!resultado && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".dxf" onChange={handleArchivo} className="hidden" />
              <Upload size={32} className="mx-auto text-gray-400 mb-3" />
              <div className="text-sm font-semibold text-gray-700">
                {cargando ? 'Leyendo archivo...' : 'Arrastrá un archivo .dxf aquí'}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                o hacé click para seleccionar
              </div>
              <div className="text-[10px] text-gray-400 mt-3">
                Formatos soportados: DXF (ASCII) de SketchUp, AutoCAD, AutoCAD LT, Tekla, etc.
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-red-700">Error al leer el archivo</div>
                <div className="text-[11px] text-red-600 mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <>
              {/* Estadísticas */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
                  {resultado.nombre}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white rounded p-2 border border-gray-200">
                    <div className="text-lg font-bold font-mono text-gray-800">{resultado.stats.totalEntidades}</div>
                    <div className="text-[9px] text-gray-500">Entidades</div>
                  </div>
                  <div className="bg-white rounded p-2 border border-gray-200">
                    <div className="text-lg font-bold font-mono text-blue-600">{resultado.stats.verticales}</div>
                    <div className="text-[9px] text-gray-500">Verticales</div>
                  </div>
                  <div className="bg-white rounded p-2 border border-gray-200">
                    <div className="text-lg font-bold font-mono text-green-600">{resultado.stats.horizontales}</div>
                    <div className="text-[9px] text-gray-500">Horizontales</div>
                  </div>
                  <div className="bg-white rounded p-2 border border-gray-200">
                    <div className="text-lg font-bold font-mono text-amber-600">{resultado.stats.sugerenciasLayher}</div>
                    <div className="text-[9px] text-gray-500">Piezas Layher</div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Vista previa</span>
                  <button
                    onClick={() => setMostrarSugerencias(p => !p)}
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${mostrarSugerencias ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                  >
                    <Zap size={10} /> {mostrarSugerencias ? 'Layher ON' : 'Layher OFF'}
                  </button>
                </div>
                <PreviewSVG
                  geometrias={resultado.geometrias}
                  sugerencias={resultado.sugerencias}
                  bounds={resultado.bounds}
                  capasVisibles={capasVisibles}
                  mostrarSugerencias={mostrarSugerencias}
                />
                <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400">
                  <span className="inline-block w-3 h-0.5 bg-gray-500" /> DXF original
                  <span className="inline-block w-3 h-0.5 bg-blue-500 ml-2" /> Vertical
                  <span className="inline-block w-3 h-0.5 bg-green-500 ml-2" /> Horizontal
                  <span className="inline-block w-3 h-0.5 bg-purple-400 ml-2" /> Diagonal
                  <span className="inline-block w-3 h-0.5 bg-rose-600 ml-2" /> Plataforma
                </div>
              </div>

              {/* Capas */}
              {resultado.capas.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5 flex items-center gap-1">
                    <Layers size={10} /> Capas ({resultado.capas.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {resultado.capas.map(capa => (
                      <button
                        key={capa}
                        onClick={() => toggleCapa(capa)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors ${
                          capasVisibles.has(capa)
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-gray-100 border-gray-200 text-gray-400'
                        }`}
                      >
                        {capasVisibles.has(capa) ? <Eye size={9} /> : <EyeOff size={9} />}
                        {capa || '(sin nombre)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opciones de importación */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-blue-700 font-bold">Opciones</div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="text-[11px] text-gray-700">
                    <span className="block text-[9px] text-gray-500 mb-0.5">Unidad del DXF</span>
                    <select value={unidad} onChange={e => setUnidad(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white">
                      <option value="m">Metros (m)</option>
                      <option value="cm">Centímetros (cm)</option>
                      <option value="mm">Milímetros (mm)</option>
                    </select>
                  </label>
                  <label className="text-[11px] text-gray-700">
                    <span className="block text-[9px] text-gray-500 mb-0.5">Escala</span>
                    <input type="number" step="0.01" min="0.01" value={escala}
                      onChange={e => setEscala(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono" />
                  </label>
                  <label className="text-[11px] text-gray-700">
                    <span className="block text-[9px] text-gray-500 mb-0.5">Confianza mínima</span>
                    <select value={confianzaMin} onChange={e => setConfianzaMin(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white">
                      <option value="0.3">Baja (0.3) — más piezas</option>
                      <option value="0.5">Media (0.5) — recomendado</option>
                      <option value="0.7">Alta (0.7) — solo seguras</option>
                      <option value="0.9">Muy alta (0.9)</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Resumen de importación */}
              <div className={`rounded-lg p-3 ${piezasImportar.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                {piezasImportar.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <div>
                      <div className="text-xs font-semibold text-green-800">
                        {piezasImportar.length} piezas Layher detectadas
                      </div>
                      <div className="text-[10px] text-green-600 mt-0.5">
                        {piezasImportar.filter(p => p.categoria === 'vertical').length} verticales ·{' '}
                        {piezasImportar.filter(p => p.categoria === 'horizontalO').length} horizontales ·{' '}
                        {piezasImportar.filter(p => p.categoria === 'diagonal').length} diagonales ·{' '}
                        {piezasImportar.filter(p => p.categoria === 'plataforma').length} plataformas
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <div>
                      <div className="text-xs font-semibold text-amber-800">No se detectaron piezas</div>
                      <div className="text-[10px] text-amber-600 mt-0.5">
                        Probá cambiar la unidad, escala o confianza mínima
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón cargar otro */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setResultado(null); setError(null); }}
                  className="text-[11px] text-gray-500 hover:text-gray-700 underline"
                >
                  Cargar otro archivo
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-5 py-3 rounded-b-xl flex items-center justify-between">
          <div className="text-[10px] text-gray-400">
            Formatos: DXF ASCII · SketchUp exporta DXF desde Archivo → Exportar → Gráfico 2D
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded border border-gray-300">
              Cancelar
            </button>
            <button
              onClick={confirmarImportar}
              disabled={!piezasImportar.length}
              className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FileDown size={12} />
              Importar {piezasImportar.length > 0 ? `${piezasImportar.length} piezas` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
