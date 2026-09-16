import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, X } from 'lucide-react';

// ─── Motor de validaciones ───────────────────────────────────
// Analiza piezas y devuelve avisos clasificados por severidad.
// Cada regla retorna array de { tipo, mensaje, detalle, piezaIds? }

const SEVERIDAD = { error: 0, advertencia: 1, info: 2 };
const SEVERIDAD_ICON = { error: '🔴', advertencia: '🟡', info: '🔵' };
const SEVERIDAD_COLOR = { error: 'text-red-600', advertencia: 'text-amber-600', info: 'text-blue-600' };
const SEVERIDAD_BG = { error: 'bg-red-50 border-red-200', advertencia: 'bg-amber-50 border-amber-200', info: 'bg-blue-50 border-blue-200' };

function validar(piezas, filas) {
  const avisos = [];
  if (!piezas.length) return avisos;

  const verticales = piezas.filter(p => p.categoria === 'vertical');
  const bases = piezas.filter(p => p.categoria === 'base');
  const collarines = piezas.filter(p => p.categoria === 'collarin');
  const horizontalesO = piezas.filter(p => p.categoria === 'horizontalO');
  const diagonales = piezas.filter(p => p.categoria === 'diagonal');
  const diagonalesPlanta = piezas.filter(p => p.categoria === 'diagonalPlanta');
  const plataformas = piezas.filter(p => p.categoria === 'plataforma');
  const vigasPuente = piezas.filter(p => p.categoria === 'vigaPuente');
  const barandillas = piezas.filter(p => p.categoria === 'barandilla');
  const rodapies = piezas.filter(p => p.categoria === 'rodapie');

  // Agrupar por fila (z)
  const filaMap = {};
  filas.forEach(f => { filaMap[f.z] = f; });

  // ─── 1. Verticales sin base ───
  const posBaseSet = new Set(bases.map(b => `${b.x.toFixed(3)}_${(b.z ?? 0).toFixed(3)}`));
  const vertSinBase = verticales.filter(v => v.y === 0 && !posBaseSet.has(`${v.x.toFixed(3)}_${(v.z ?? 0).toFixed(3)}`));
  if (vertSinBase.length) {
    avisos.push({
      tipo: 'error',
      mensaje: `${vertSinBase.length} vertical(es) sin base (husillo)`,
      detalle: 'Toda vertical que arranca del suelo (Y=0) necesita husillo regulable + collarín.',
      piezaIds: vertSinBase.map(v => v.id),
    });
  }

  // ─── 2. Bases sin collarín ───
  const posCollarinSet = new Set(collarines.map(c => `${c.x.toFixed(3)}_${(c.z ?? 0).toFixed(3)}`));
  const baseSinCol = bases.filter(b => !posCollarinSet.has(`${b.x.toFixed(3)}_${(b.z ?? 0).toFixed(3)}`));
  if (baseSinCol.length) {
    avisos.push({
      tipo: 'advertencia',
      mensaje: `${baseSinCol.length} base(s) sin collarín`,
      detalle: 'El collarín asegura la vertical al husillo. Sin él, la estructura puede deslizarse.',
      piezaIds: baseSinCol.map(b => b.id),
    });
  }

  // ─── 3. Sin arriostramiento (diagonales) ───
  // Agrupar verticales por fila Z
  const vertPorFila = {};
  verticales.forEach(v => {
    const k = (v.z ?? 0).toFixed(3);
    if (!vertPorFila[k]) vertPorFila[k] = [];
    vertPorFila[k].push(v);
  });

  // Diagonales por fila Z
  const diagPorFila = {};
  diagonales.forEach(d => {
    const k = (d.z ?? 0).toFixed(3);
    if (!diagPorFila[k]) diagPorFila[k] = [];
    diagPorFila[k].push(d);
  });

  for (const [zKey, verts] of Object.entries(vertPorFila)) {
    const nVert = verts.length;
    const diags = diagPorFila[zKey] || [];
    const filaInfo = filaMap[parseFloat(zKey)];
    const filaLabel = filaInfo ? `fila ${filaInfo.nombre}` : `Z=${zKey}m`;

    if (nVert >= 2 && diags.length === 0) {
      avisos.push({
        tipo: 'error',
        mensaje: `Sin arriostramiento en ${filaLabel}`,
        detalle: `${nVert} verticales sin ninguna diagonal. Estructura inestable lateralmente. Colocar al menos 1 diagonal cada 4 módulos.`,
      });
    } else if (nVert >= 6 && diags.length < 2) {
      avisos.push({
        tipo: 'advertencia',
        mensaje: `Arriostramiento insuficiente en ${filaLabel}`,
        detalle: `${nVert} verticales con solo ${diags.length} diagonal(es). Recomendable: 1 diagonal cada 3-4 módulos (mínimo 2 para ${nVert} verticales).`,
      });
    }
  }

  // ─── 4. Sin arriostramiento en planta (filas > 1) ───
  if (filas.length > 1 && diagonalesPlanta.length === 0) {
    // Verificar si hay horizontales en Z (conexión entre filas)
    const horizEnZ = horizontalesO.filter(h => h.orientacion === 'z');
    if (horizEnZ.length === 0) {
      avisos.push({
        tipo: 'error',
        mensaje: 'Filas sin conexión entre sí',
        detalle: `${filas.length} filas definidas pero sin horizontales en eje Z ni diagonales de planta. Las filas deben estar vinculadas.`,
      });
    } else {
      avisos.push({
        tipo: 'advertencia',
        mensaje: 'Sin diagonales de planta',
        detalle: 'Hay horizontales entre filas pero ninguna diagonal de planta. Se recomienda arriostrar en planta para estabilidad.',
      });
    }
  }

  // ─── 5. Plataforma sin viga puente ───
  const vpSet = new Set(vigasPuente.map(v => `${v.x.toFixed(3)}_${v.y.toFixed(3)}_${(v.z ?? 0).toFixed(3)}`));
  const platSinVP = plataformas.filter(p => !vpSet.has(`${p.x.toFixed(3)}_${p.y.toFixed(3)}_${(p.z ?? 0).toFixed(3)}`));
  if (platSinVP.length) {
    avisos.push({
      tipo: 'advertencia',
      mensaje: `${platSinVP.length} plataforma(s) sin viga puente debajo`,
      detalle: 'Las plataformas Layher apoyan sobre vigas puente U. Sin ellas, la plataforma no tiene soporte adecuado.',
      piezaIds: platSinVP.map(p => p.id),
    });
  }

  // ─── 6. Nivel con plataforma sin barandilla ───
  // Agrupar plataformas por nivel Y
  const nivelesPiso = [...new Set(plataformas.map(p => p.y.toFixed(3)))];
  nivelesPiso.forEach(yKey => {
    const y = parseFloat(yKey);
    if (y < 1.0) return; // No requiere barandilla a nivel bajo
    const barEnNivel = barandillas.some(b => Math.abs(b.y - y - 1.0) < 0.1 || Math.abs(b.y - y - 0.5) < 0.1);
    if (!barEnNivel) {
      avisos.push({
        tipo: 'advertencia',
        mensaje: `Nivel Y=${y.toFixed(1)}m sin barandilla`,
        detalle: `Plataformas a ${y.toFixed(1)}m de altura sin barandilla perimetral. Obligatoria según normativa de seguridad en alturas > 1m.`,
      });
    }
  });

  // ─── 7. Nivel con plataforma sin rodapié ───
  nivelesPiso.forEach(yKey => {
    const y = parseFloat(yKey);
    if (y < 1.0) return;
    const rpEnNivel = rodapies.some(r => Math.abs(r.y - y) < 0.1);
    if (!rpEnNivel) {
      avisos.push({
        tipo: 'info',
        mensaje: `Nivel Y=${y.toFixed(1)}m sin rodapié`,
        detalle: 'El rodapié evita caída de herramientas. Recomendable en todo nivel de trabajo.',
      });
    }
  });

  // ─── 8. Verticales sueltas (sin horizontales conectadas) ───
  const vertSueltas = verticales.filter(v => {
    const tieneHoriz = horizontalesO.some(h => {
      const z = h.z ?? 0;
      const vz = v.z ?? 0;
      if (h.orientacion === 'z') {
        return Math.abs(h.x - v.x) < 0.01 && z <= vz && z + h.largo >= vz - 0.01;
      }
      return Math.abs(z - vz) < 0.01 && h.x <= v.x + 0.01 && h.x + h.largo >= v.x - 0.01;
    });
    return !tieneHoriz;
  });
  if (vertSueltas.length) {
    avisos.push({
      tipo: 'advertencia',
      mensaje: `${vertSueltas.length} vertical(es) sin horizontal conectada`,
      detalle: 'Verticales aisladas sin ninguna horizontal. Verificar que estén arriostradas lateralmente.',
      piezaIds: vertSueltas.map(v => v.id),
    });
  }

  // ─── 9. Resumen positivo si todo bien ───
  const errores = avisos.filter(a => a.tipo === 'error');
  if (errores.length === 0 && avisos.length <= 2) {
    avisos.push({
      tipo: 'info',
      mensaje: 'Estructura bien configurada',
      detalle: `${verticales.length} verticales, ${horizontalesO.length} horizontales, ${diagonales.length + diagonalesPlanta.length} diagonales. Verificar siempre con ingeniero.`,
    });
  }

  // Ordenar por severidad
  avisos.sort((a, b) => SEVERIDAD[a.tipo] - SEVERIDAD[b.tipo]);
  return avisos;
}

// ─── Componente de UI ────────────────────────────────────────
export default function ValidacionesEstructura({ piezas, filas, setPiezasSeleccionadas, visible, onCerrar }) {
  const [expandido, setExpandido] = useState(null);
  const avisos = useMemo(() => validar(piezas, filas), [piezas, filas]);

  if (!visible) return null;

  const errores = avisos.filter(a => a.tipo === 'error').length;
  const advertencias = avisos.filter(a => a.tipo === 'advertencia').length;

  return (
    <div className="absolute top-12 right-2 z-40 w-80 max-h-[70vh] bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-black text-white shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} />
          <span className="text-xs font-bold">Validaciones</span>
        </div>
        <div className="flex items-center gap-2">
          {errores > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{errores}</span>}
          {advertencias > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{advertencias}</span>}
          <button onClick={onCerrar} className="text-white/60 hover:text-white"><X size={14} /></button>
        </div>
      </div>
      <div className="overflow-y-auto p-2 space-y-1.5">
        {avisos.length === 0 ? (
          <div className="flex items-center gap-2 p-3 text-green-700 text-xs">
            <CheckCircle2 size={16} /> Sin piezas para validar
          </div>
        ) : avisos.map((a, i) => (
          <div key={i} className={`border rounded-md p-2 ${SEVERIDAD_BG[a.tipo]} cursor-pointer`}
            onClick={() => setExpandido(expandido === i ? null : i)}>
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">{SEVERIDAD_ICON[a.tipo]}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold ${SEVERIDAD_COLOR[a.tipo]}`}>{a.mensaje}</div>
                {expandido === i && (
                  <div className="mt-1.5">
                    <p className="text-[11px] text-gray-600 leading-relaxed">{a.detalle}</p>
                    {a.piezaIds && setPiezasSeleccionadas && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPiezasSeleccionadas(a.piezaIds); }}
                        className="mt-1.5 text-[10px] bg-white border border-gray-300 hover:bg-gray-100 px-2 py-0.5 rounded font-bold"
                      >
                        Seleccionar piezas ({a.piezaIds.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-gray-400">
                {expandido === i ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 px-3 py-1.5 text-[9px] text-gray-400 shrink-0">
        Verificación automática preliminar. No reemplaza análisis de ingeniero estructural.
      </div>
    </div>
  );
}
