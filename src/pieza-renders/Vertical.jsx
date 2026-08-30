import { ROSETA_STEP } from '../catalogo/constantes.js';

// Vertical (parante) — tubo Ø48.3mm con rosetas cada 0.50m.
// Efecto 3D: sombra + highlight cilíndrico. Rosetas como discos con 8 perforaciones (zoom alto).
export default function Vertical({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, fantasma, onMouseDown }) {
  const { x, y, largo } = pieza;
  const pB = worldToScreen(x, y), pT = worldToScreen(x, y + largo);

  const tubeW = Math.max(3, zoom * 0.05);       // ancho tubo
  const hlOff = tubeW * 0.22;                    // offset highlight
  const capH = Math.max(1.5, zoom * 0.015);      // tapa extremo

  // --- Rosetas ---
  const rosetas = [];
  const rR = Math.max(3, zoom * 0.05);           // radio disco roseta
  const showHoles = zoom > 35;                    // agujeros solo con zoom
  const holeR = rR * 0.11;
  const holeD = rR * 0.58;                        // distancia agujero al centro

  for (let dy = 0; dy <= largo + 0.001; dy += ROSETA_STEP) {
    const pr = worldToScreen(x, y + dy);
    const els = [
      // Disco
      <circle key="d" cx={pr.x} cy={pr.y} r={rR}
        fill={fantasma ? '#e2e8f0' : '#d4d4d8'}
        stroke={fantasma ? '#94a3b8' : '#52525b'}
        strokeWidth={Math.max(0.5, zoom * 0.006)} />,
      // Highlight disco
      <ellipse key="hl" cx={pr.x - rR * 0.2} cy={pr.y - rR * 0.15} rx={rR * 0.35} ry={rR * 0.25}
        fill="#fff" opacity="0.3" />,
    ];
    if (showHoles) {
      const hc = fantasma ? '#94a3b8' : '#27272a';
      // 4 cardinales
      els.push(<circle key="h0" cx={pr.x} cy={pr.y - holeD} r={holeR} fill={hc} />);
      els.push(<circle key="h1" cx={pr.x} cy={pr.y + holeD} r={holeR} fill={hc} />);
      els.push(<circle key="h2" cx={pr.x - holeD} cy={pr.y} r={holeR} fill={hc} />);
      els.push(<circle key="h3" cx={pr.x + holeD} cy={pr.y} r={holeR} fill={hc} />);
      // 4 diagonales (45°)
      const d45 = holeD * 0.707;
      els.push(<circle key="h4" cx={pr.x - d45} cy={pr.y - d45} r={holeR} fill={hc} />);
      els.push(<circle key="h5" cx={pr.x + d45} cy={pr.y - d45} r={holeR} fill={hc} />);
      els.push(<circle key="h6" cx={pr.x - d45} cy={pr.y + d45} r={holeR} fill={hc} />);
      els.push(<circle key="h7" cx={pr.x + d45} cy={pr.y + d45} r={holeR} fill={hc} />);
    }
    rosetas.push(<g key={dy}>{els}</g>);
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke="#E30613" strokeWidth={tubeW + 8} opacity="0.2" strokeLinecap="round" />}
      {/* Sombra derecha */}
      <line x1={pT.x + hlOff} y1={pT.y} x2={pB.x + hlOff} y2={pB.y}
        stroke="#000" strokeWidth={tubeW} strokeLinecap="round" opacity="0.07" />
      {/* Tubo principal */}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke={sc} strokeWidth={tubeW} strokeLinecap="round" />
      {/* Highlight izquierdo (brillo cilindro) */}
      <line x1={pT.x - hlOff} y1={pT.y} x2={pB.x - hlOff} y2={pB.y}
        stroke="#fff" strokeWidth={tubeW * 0.28} strokeLinecap="round" opacity="0.35" />
      {/* Tapas extremos */}
      <line x1={pT.x - tubeW / 2} y1={pT.y} x2={pT.x + tubeW / 2} y2={pT.y}
        stroke={sc} strokeWidth={capH} />
      <line x1={pB.x - tubeW / 2} y1={pB.y} x2={pB.x + tubeW / 2} y2={pB.y}
        stroke={sc} strokeWidth={capH} />
      {/* Rosetas */}
      {rosetas}
    </g>
  );
}
