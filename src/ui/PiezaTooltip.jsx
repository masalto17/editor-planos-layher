// Tooltip enriquecido al hacer hover sobre una pieza — muestra nombre, ref, peso,
// dimensiones, posición y fila. Compartido entre Alzado y Planta.

const CAT_COLOR = {
  base: '#8B4513', collarin: '#5C3317', vertical: '#3b82f6',
  horizontalO: '#22c55e', vigaPuente: '#f59e0b', horizontalU: '#f59e0b',
  mensula: '#38bdf8', stringer: '#94a3b8', plataforma: '#e11d48',
  fenolico: '#b45309', barandilla: '#22d3ee', rodapie: '#f59e0b',
  diagonal: '#a78bfa', diagonalPlanta: '#a78bfa', escalera: '#818cf8',
  apoyaTecho: '#6b7280', celosia: '#64748b', cumbrera: '#a8a29e',
  techo: '#94a3b8', truss: '#6b7280', vigaIPN: '#6b7280', importada: '#9ca3af',
};

const CAT_NOMBRE = {
  base: 'Husillo', collarin: 'Collarín', vertical: 'Vertical',
  horizontalO: 'Horizontal O', vigaPuente: 'Viga Puente U', horizontalU: 'Horizontal U',
  mensula: 'Ménsula', stringer: 'Stringer', plataforma: 'Plataforma',
  fenolico: 'Fenólico', barandilla: 'Barandilla', rodapie: 'Rodapié',
  diagonal: 'Diagonal', diagonalPlanta: 'Diagonal Planta', escalera: 'Escalera',
  apoyaTecho: 'Apoyo Techo', celosia: 'Celosía', cumbrera: 'Cumbrera',
  techo: 'Techo', truss: 'Truss', vigaIPN: 'Viga IPN', importada: 'Importada',
};

export default function PiezaTooltip({ hoverPieza, svgRef, vista }) {
  if (!hoverPieza) return null;
  const p = hoverPieza.pieza;
  const rect = svgRef?.getBoundingClientRect();
  if (!rect) return null;

  // Posicionar tooltip — evitar que se salga del canvas
  let left = hoverPieza.screenX - rect.left + 14;
  let top = hoverPieza.screenY - rect.top - 12;
  if (left + 200 > rect.width) left = hoverPieza.screenX - rect.left - 200;
  if (top < 10) top = hoverPieza.screenY - rect.top + 20;

  const catColor = CAT_COLOR[p.categoria] || '#9ca3af';
  const catNombre = CAT_NOMBRE[p.categoria] || p.categoria;

  // Coordenadas según vista y tipo
  let posLines = [];
  if (vista === 'planta') {
    if (p.categoria === 'diagonalPlanta') {
      posLines.push(`De: (${p.x1.toFixed(2)}, Z${p.z1.toFixed(2)})`);
      posLines.push(`A: (${p.x2.toFixed(2)}, Z${p.z2.toFixed(2)})`);
      posLines.push(`Nivel Y: ${(p.y ?? 0).toFixed(2)}m`);
    } else {
      posLines.push(`X: ${p.x.toFixed(2)}m · Z: ${(p.z ?? 0).toFixed(2)}m`);
      posLines.push(`Nivel Y: ${(p.y ?? 0).toFixed(2)}m`);
    }
  } else {
    if (p.categoria === 'diagonal') {
      posLines.push(`De: (${p.x1.toFixed(2)}, ${p.y1.toFixed(2)})`);
      posLines.push(`A: (${p.x2.toFixed(2)}, ${p.y2.toFixed(2)})`);
      posLines.push(`Fila Z: ${(p.z ?? 0).toFixed(2)}m`);
    } else {
      posLines.push(`X: ${p.x.toFixed(2)}m · Y: ${p.y.toFixed(2)}m`);
      if ((p.z ?? 0) !== 0) posLines.push(`Fila Z: ${p.z.toFixed(2)}m`);
    }
  }

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{ left, top }}
    >
      <div className="bg-gray-900/95 text-white text-[10px] px-2.5 py-2 rounded-lg shadow-xl border border-white/10 max-w-60 backdrop-blur-sm">
        {/* Header: categoría + color */}
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: catColor }}
          />
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">{catNombre}</span>
        </div>
        {/* Nombre pieza */}
        <div className="font-bold text-[11px] leading-tight">{p.nombre}</div>
        {/* Ref + peso */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-mono text-gray-400 text-[9px]">{p.ref}</span>
          <span className="text-gray-500">·</span>
          <span className="font-mono text-yellow-300/80 font-semibold">{p.peso} kg</span>
        </div>
        {/* Dimensiones */}
        {p.largo && (
          <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-300">
            <span>📏</span>
            <span className="font-mono">{p.largo.toFixed(2)}m</span>
            {p.orientacion && (
              <>
                <span className="text-gray-600">·</span>
                <span>eje {p.orientacion.toUpperCase()}</span>
              </>
            )}
          </div>
        )}
        {/* Posición */}
        <div className="mt-1 pt-1 border-t border-white/10 space-y-0.5">
          {posLines.map((line, i) => (
            <div key={i} className="text-gray-400 font-mono text-[9px]">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
