// Barra de estado inferior — muestra zoom, coordenadas, pieza seleccionada, peso total
import { Crosshair, Layers, Weight, ZoomIn } from 'lucide-react';

export default function StatusBar({ zoom, mousePos, vista, piezasSeleccionadas, piezas, pesoTotal, cantPiezas, herramientaActiva }) {
  const selCount = piezasSeleccionadas.length;
  const selPieza = selCount === 1 ? piezas?.find(p => p.id === piezasSeleccionadas[0]) : null;

  // Peso seleccionado
  const pesoSel = selCount > 0 && piezas
    ? piezas.filter(p => piezasSeleccionadas.includes(p.id)).reduce((s, p) => s + (p.peso || 0), 0)
    : 0;

  return (
    <div className="bg-gray-50 border-t border-gray-300 px-3 py-0.5 flex items-center gap-3 text-[10px] text-gray-500 font-mono select-none">
      {/* Zoom */}
      <div className="flex items-center gap-1" title="Nivel de zoom">
        <ZoomIn size={10} className="text-gray-400" />
        <span>{Math.round(zoom)}px/m</span>
        <span className="text-gray-300">·</span>
        <span>{zoom >= 100 ? '1:' + Math.round(100 / zoom * 100) / 100 : Math.round(zoom / 100 * 100) / 100 + ':1'}</span>
      </div>

      <div className="w-px h-3 bg-gray-300" />

      {/* Coordenadas */}
      {mousePos && (
        <div className="flex items-center gap-1" title="Coordenadas del cursor">
          <Crosshair size={10} className="text-gray-400" />
          {vista === 'alzado' ? (
            <span>X:{mousePos.x?.toFixed(2)} Y:{mousePos.y?.toFixed(2)}</span>
          ) : (
            <span>X:{mousePos.x?.toFixed(2)} Z:{mousePos.z?.toFixed(2)}</span>
          )}
          {mousePos.snapRoseta && <span className="text-purple-500 font-bold">⊙ roseta</span>}
          {mousePos.snapModulo > 0 && <span className="text-green-600 font-bold">✓ mód</span>}
        </div>
      )}

      <div className="w-px h-3 bg-gray-300" />

      {/* Pieza activa (herramienta) */}
      {herramientaActiva && (
        <>
          <div className="flex items-center gap-1 text-red-600">
            <span>✎</span>
            <span className="font-semibold">{herramientaActiva.nombre || herramientaActiva.categoria}</span>
            {herramientaActiva.largo && <span>({herramientaActiva.largo.toFixed(2)}m)</span>}
          </div>
          <div className="w-px h-3 bg-gray-300" />
        </>
      )}

      {/* Selección */}
      {selCount > 0 && (
        <>
          <div className="flex items-center gap-1 text-blue-600">
            <Layers size={10} />
            {selCount === 1 && selPieza ? (
              <span>{selPieza.nombre || selPieza.categoria} · {selPieza.peso}kg</span>
            ) : (
              <span>{selCount} sel · {pesoSel.toFixed(1)}kg</span>
            )}
          </div>
          <div className="w-px h-3 bg-gray-300" />
        </>
      )}

      {/* Totales */}
      <div className="flex items-center gap-1 ml-auto">
        <Weight size={10} className="text-gray-400" />
        <span>{cantPiezas} piezas</span>
        <span className="text-gray-300">·</span>
        <span className="font-semibold">{pesoTotal.toFixed(0)} kg</span>
        {pesoTotal >= 1000 && <span className="text-gray-400">({(pesoTotal / 1000).toFixed(2)}t)</span>}
      </div>
    </div>
  );
}
