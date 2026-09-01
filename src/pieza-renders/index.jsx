import Vertical from './Vertical.jsx';
import HorizontalO from './HorizontalO.jsx';
import VigaPuente from './VigaPuente.jsx';
import HorizontalU from './HorizontalU.jsx';
import Plataforma from './Plataforma.jsx';
import Rodapie from './Rodapie.jsx';
import DiagonalPieza, { PreviewDiagonal } from './Diagonal.jsx';
import Base from './Base.jsx';
import CelosiaTruss from './CelosiaTruss.jsx';
import Truss from './Truss.jsx';
import Cumbrera from './Cumbrera.jsx';
import TechoAguas from './TechoAguas.jsx';
import VigaIPN from './VigaIPN.jsx';
import { TIENE_ORIENTACION } from '../catalogo/constantes.js';

export { PreviewDiagonal };

// Render de una horizontal orientada en Z proyectada al Alzado. Se ve como una marca
// puntual (un rombo con el color de la pieza) — la extensión de la pieza se pierde
// porque es perpendicular al plano de la vista.
function HorizontalPerpendicular({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, fantasma, onMouseDown }) {
  const p = worldToScreen(pieza.x, pieza.y);
  const r = Math.max(4, zoom * 0.06);
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={p.x - r - 3} y={p.y - r - 3} width={(r + 3) * 2} height={(r + 3) * 2} fill="none" stroke="#E30613" strokeWidth="2" />}
      <rect x={p.x - r / 1.4} y={p.y - r / 1.4} width={r * 1.4} height={r * 1.4}
        fill={fantasma ? sc : sc} fillOpacity={fantasma ? 0.4 : 0.75} stroke={sc} strokeWidth="1"
        transform={`rotate(45 ${p.x} ${p.y})`} />
    </g>
  );
}

const RENDERERS = {
  vertical: Vertical,
  horizontalO: HorizontalO,
  barandilla: HorizontalO,
  vigaPuente: VigaPuente,
  horizontalU: HorizontalU,
  plataforma: Plataforma,
  rodapie: Rodapie,
  diagonal: DiagonalPieza,
  base: Base,
  collarin: Base,
  vigaIPN: VigaIPN,
  celosia: CelosiaTruss,
  truss: Truss,
  cumbrera: Cumbrera,
  techo: TechoAguas,
};

// Colores modo técnico: monocromo según categoría (grosor de línea diferencia)
const TECNICO_COLORS = {
  vertical: '#111', horizontalO: '#333', vigaPuente: '#222', horizontalU: '#333',
  plataforma: '#555', barandilla: '#444', rodapie: '#444', diagonal: '#333', base: '#222', collarin: '#222',
  vigaIPN: '#222', celosia: '#333', truss: '#333', cumbrera: '#444', techo: '#333',
};

// Dispatcher: renderiza una pieza en el Alzado (plano X-Y) según su categoría.
// Si es horizontal con orientacion='z', se dibuja como marca perpendicular al plano.
// Diagonales de planta se ven en Alzado como marca en su extremo activo (no implementado — se omiten).
export default function PiezaRender({ pieza, worldToScreen, zoom, seleccionada, fantasma, onMouseDown, cursorMover, modoTecnico, onMouseEnter, onMouseLeave }) {
  const op = fantasma ? 0.4 : 1;
  const sc = seleccionada ? '#E30613' : (modoTecnico ? (TECNICO_COLORS[pieza.categoria] || '#333') : pieza.color);
  const cur = fantasma ? 'none' : (cursorMover ? 'move' : 'pointer');
  if (TIENE_ORIENTACION(pieza.categoria) && pieza.orientacion === 'z') {
    return <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <HorizontalPerpendicular pieza={pieza} worldToScreen={worldToScreen} zoom={zoom} sc={sc} op={op} cur={cur}
        seleccionada={!!seleccionada} fantasma={!!fantasma} onMouseDown={onMouseDown} />
    </g>;
  }
  const Comp = RENDERERS[pieza.categoria];
  if (!Comp) return null;
  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Comp pieza={pieza} worldToScreen={worldToScreen} zoom={zoom} sc={sc} op={op} cur={cur}
        seleccionada={!!seleccionada} fantasma={!!fantasma} onMouseDown={onMouseDown} />
    </g>
  );
}
