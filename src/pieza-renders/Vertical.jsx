import { ROSETA_STEP } from '../catalogo/constantes.js';

// Vertical (parante) — tubo Ø48.3mm con rosetas cada 0.50m.
// Efecto galvanizado: gradiente metálico con reflejos, sombra proyectada.
// Rosetas detalladas con 8 perforaciones (4 cardinales + 4 angulares a 45°),
// disco interior, borde grueso y brillo especular.
export default function Vertical({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, fantasma, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pB = worldToScreen(x, y), pT = worldToScreen(x, y + largo);

  const tubeW = Math.max(3, zoom * 0.05);       // ancho tubo
  const hlOff = tubeW * 0.22;                    // offset highlight
  const capH = Math.max(1.5, zoom * 0.015);      // tapa extremo

  // ID único para gradientes (evita colisiones entre múltiples piezas)
  const gid = `vg-${pieza.id}`;

  // --- Rosetas ---
  const rosetas = [];
  const rR = Math.max(3.5, zoom * 0.055);          // radio disco roseta (más grande)
  const showHoles = zoom > 30;                       // agujeros antes (era 35)
  const showDetail = zoom > 50;                      // anillo interior + tornillos
  const holeR = rR * 0.12;
  const holeD = rR * 0.60;                           // distancia agujero al centro
  const innerRingR = rR * 0.35;                      // anillo interior (hub)

  for (let dy = 0; dy <= largo + 0.001; dy += ROSETA_STEP) {
    const pr = worldToScreen(x, y + dy);
    const els = [
      // Sombra del disco
      <circle key="sh" cx={pr.x + 0.5} cy={pr.y + 0.5} r={rR + 0.5}
        fill="#000" opacity="0.08" />,
      // Disco exterior — borde grueso metálico
      <circle key="d" cx={pr.x} cy={pr.y} r={rR}
        fill={fantasma ? '#e2e8f0' : '#c4c4cc'}
        stroke={fantasma ? '#94a3b8' : '#3f3f46'}
        strokeWidth={Math.max(0.7, zoom * 0.008)} />,
      // Gradiente radial — brillo metálico en disco
      <circle key="grad" cx={pr.x} cy={pr.y} r={rR * 0.85}
        fill="none"
        stroke="#fff" strokeWidth={rR * 0.15}
        opacity="0.12" />,
      // Highlight especular (esquina superior izquierda)
      <ellipse key="hl" cx={pr.x - rR * 0.22} cy={pr.y - rR * 0.18} rx={rR * 0.3} ry={rR * 0.22}
        fill="#fff" opacity="0.35" />,
    ];

    if (showHoles) {
      const hc = fantasma ? '#94a3b8' : '#1a1a2e';
      // 4 cardinales — perforaciones rectas (rectangulares para roseta real)
      const rectHW = holeR * 1.4; // medio-ancho rectángulo
      const rectHH = holeR * 0.7;
      els.push(<rect key="h0" x={pr.x - rectHW} y={pr.y - holeD - rectHH} width={rectHW * 2} height={rectHH * 2} rx={holeR * 0.3} fill={hc} opacity="0.85" />);
      els.push(<rect key="h1" x={pr.x - rectHW} y={pr.y + holeD - rectHH} width={rectHW * 2} height={rectHH * 2} rx={holeR * 0.3} fill={hc} opacity="0.85" />);
      els.push(<rect key="h2" x={pr.x - holeD - rectHH} y={pr.y - rectHW} width={rectHH * 2} height={rectHW * 2} rx={holeR * 0.3} fill={hc} opacity="0.85" />);
      els.push(<rect key="h3" x={pr.x + holeD - rectHH} y={pr.y - rectHW} width={rectHH * 2} height={rectHW * 2} rx={holeR * 0.3} fill={hc} opacity="0.85" />);
      // 4 diagonales (45°) — perforaciones angulares (ovaladas)
      const d45 = holeD * 0.707;
      els.push(<circle key="h4" cx={pr.x - d45} cy={pr.y - d45} r={holeR} fill={hc} opacity="0.8" />);
      els.push(<circle key="h5" cx={pr.x + d45} cy={pr.y - d45} r={holeR} fill={hc} opacity="0.8" />);
      els.push(<circle key="h6" cx={pr.x - d45} cy={pr.y + d45} r={holeR} fill={hc} opacity="0.8" />);
      els.push(<circle key="h7" cx={pr.x + d45} cy={pr.y + d45} r={holeR} fill={hc} opacity="0.8" />);
    }

    // Detalle fino: anillo central (hub del tubo vertical que asoma)
    if (showDetail) {
      els.push(
        <circle key="hub" cx={pr.x} cy={pr.y} r={innerRingR}
          fill="none" stroke={fantasma ? '#94a3b8' : '#52525b'}
          strokeWidth={Math.max(0.4, zoom * 0.004)} />
      );
      // Punto central
      els.push(
        <circle key="center" cx={pr.x} cy={pr.y} r={Math.max(0.6, zoom * 0.005)}
          fill={fantasma ? '#94a3b8' : '#27272a'} />
      );
    }

    rosetas.push(<g key={dy}>{els}</g>);
  }

  const tecW = Math.max(1.5, zoom * 0.02); // stroke fino modo técnico

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Gradiente galvanizado para tubo */}
      {!modoTecnico && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
            <stop offset="25%" stopColor="#fff" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="75%" stopColor="#000" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      )}

      {/* Selección glow */}
      {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke="#E30613" strokeWidth={(modoTecnico ? tecW : tubeW) + 8} opacity="0.2" strokeLinecap="round" />}

      {!modoTecnico && <>
        {/* Sombra proyectada derecha */}
        <line x1={pT.x + hlOff * 1.3} y1={pT.y} x2={pB.x + hlOff * 1.3} y2={pB.y}
          stroke="#000" strokeWidth={tubeW * 1.05} strokeLinecap="round" opacity="0.06" />
      </>}

      {/* Tubo principal */}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
        stroke={sc} strokeWidth={modoTecnico ? tecW : tubeW} strokeLinecap={modoTecnico ? 'butt' : 'round'} />

      {/* Overlay galvanizado (gradiente metálico encima del tubo) */}
      {!modoTecnico && (
        <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y}
          stroke={`url(#${gid})`} strokeWidth={tubeW} strokeLinecap="round" />
      )}

      {!modoTecnico && <>
        {/* Highlight izquierdo (brillo cilindro principal) */}
        <line x1={pT.x - hlOff} y1={pT.y} x2={pB.x - hlOff} y2={pB.y}
          stroke="#fff" strokeWidth={tubeW * 0.22} strokeLinecap="round" opacity="0.4" />
        {/* Segundo highlight fino (edge light derecho) */}
        <line x1={pT.x + hlOff * 0.6} y1={pT.y} x2={pB.x + hlOff * 0.6} y2={pB.y}
          stroke="#fff" strokeWidth={tubeW * 0.08} strokeLinecap="round" opacity="0.15" />
      </>}

      {/* Tapas extremos */}
      <line x1={pT.x - (modoTecnico ? tecW * 2 : tubeW / 2)} y1={pT.y} x2={pT.x + (modoTecnico ? tecW * 2 : tubeW / 2)} y2={pT.y}
        stroke={sc} strokeWidth={modoTecnico ? tecW : capH} />
      <line x1={pB.x - (modoTecnico ? tecW * 2 : tubeW / 2)} y1={pB.y} x2={pB.x + (modoTecnico ? tecW * 2 : tubeW / 2)} y2={pB.y}
        stroke={sc} strokeWidth={modoTecnico ? tecW : capH} />

      {/* Rosetas — en modo técnico: puntos simples sin disco decorativo */}
      {modoTecnico ? rosetas.map((_, i) => {
        const dy = i * ROSETA_STEP;
        if (dy > largo + 0.001) return null;
        const pr = worldToScreen(x, y + dy);
        return <circle key={i} cx={pr.x} cy={pr.y} r={Math.max(2, zoom * 0.025)} fill={sc} />;
      }) : rosetas}

      {/* Etiqueta largo (zoom medio+) — al costado del tubo */}
      {zoom > 40 && Math.abs(pT.y - pB.y) > 30 && (
        <text x={pB.x + tubeW + 3} y={(pB.y + pT.y) / 2}
          fontSize={Math.max(6, zoom * 0.05)} fill={sc} textAnchor="start"
          fontFamily="monospace" opacity="0.35" writingMode="vertical-rl"
          transform={`rotate(180 ${pB.x + tubeW + 3} ${(pB.y + pT.y) / 2})`}>{largo.toFixed(2)}m</text>
      )}
    </g>
  );
}
