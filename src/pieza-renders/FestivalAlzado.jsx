import { ESTADOS } from '../catalogo/festival.js';
import { dimsDe, boundsAlzadoEntidad } from '../modelo/entidades.js';

// Proyección frontal de una pieza de festival. Solo se dibujan medidas confirmadas:
// sin alto o ancho se muestra un símbolo sin escala; nunca un volumen supuesto.
export default function FestivalAlzado({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const def = pieza._def ?? {};
  const d = dimsDe(pieza);
  const provisional = def.estado !== 'validado';
  const estado = ESTADOS[def.estado];
  const base = worldToScreen(pieza.x, pieza.y ?? 0);

  if (d.ancho == null || d.alto == null) {
    const w = 34, h = 24;
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        <rect x={base.x - w / 2} y={base.y - h} width={w} height={h} fill={sc} fillOpacity="0.12" stroke={sc}
          strokeWidth={seleccionada ? 2.5 : 1.5} strokeDasharray="4 3" />
        <text x={base.x} y={base.y - h / 2 + 1} fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold" fill={sc}>
          {def.familia === 'generador' ? 'GE' : '?'}
        </text>
        {def.electrico?.kVA != null && <text x={base.x} y={base.y - 3} fontSize="7" textAnchor="middle" fontFamily="monospace" fill={sc}>{def.electrico.kVA} kVA</text>}
        <text x={base.x} y={base.y - h - 4} fontSize="8" textAnchor="middle" fontFamily="monospace" fill={estado?.color ?? '#666'}>sin dimensiones · sin escala</text>
      </g>
    );
  }

  const b = boundsAlzadoEntidad(pieza);
  const a = worldToScreen(b.xMin, b.yMax), c = worldToScreen(b.xMax, b.yMin);
  const x = a.x, y = a.y, w = c.x - a.x, h = c.y - a.y;
  const sw = Math.max(1, zoom * 0.018);
  const dash = provisional ? `${Math.max(4, sw * 3)} ${Math.max(2, sw * 1.5)}` : 'none';
  const esTarima = def.familia === 'tarima';
  const rot = ((pieza.rot ?? 0) % 180 + 180) % 180;
  const deCanto = Math.abs(rot - 90) < 1;
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill="none" stroke="#E30613" strokeWidth="2" />}
      <rect x={x} y={y} width={w} height={h} fill={sc} fillOpacity={esTarima ? 0.3 : modoTecnico ? 0.03 : 0.08}
        stroke={sc} strokeWidth={sw} strokeDasharray={dash} />
      {zoom > 30 && w > 30 && (
        <text x={x + w / 2} y={y - 4} fontSize={Math.max(7, Math.min(11, zoom * 0.1))} textAnchor="middle" fontFamily="monospace" fill={sc}>
          {esTarima ? `Tarima h ${d.alto.toLocaleString('es-AR')} m` : def.variante}
          {deCanto && !esTarima ? ' · de canto' : ''}
        </text>
      )}
      {zoom > 45 && provisional && h > 16 && (
        <text x={x + w / 2} y={y + h / 2 + 3} fontSize="8" textAnchor="middle" fontFamily="monospace" fill={estado?.color ?? '#b45309'}>
          {estado?.label ?? 'Esquemático'}
        </text>
      )}
    </g>
  );
}
