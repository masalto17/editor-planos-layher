import { ROSETA_STEP } from '../catalogo/constantes.js';

export default function Vertical({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, fantasma, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pB = worldToScreen(x, y), pT = worldToScreen(x, y + largo);
  const g = Math.max(2, zoom * 0.048);
  const rs = [];
  for (let dy = 0; dy <= largo + 0.001; dy += ROSETA_STEP) {
    const pr = worldToScreen(x, y + dy);
    rs.push(<circle key={dy} cx={pr.x} cy={pr.y} r={Math.max(1.5, zoom * 0.035)} fill={fantasma ? '#94a3b8' : '#000'} opacity={op} />);
  }
  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />{rs}
    </g>
  );
}
