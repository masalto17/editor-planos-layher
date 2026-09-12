// Stringer — Caño estructural 40×80×2.50mm (perfil rectangular) entre viga puente y fenólico.
// En alzado: rectángulo rectangular (NO tubo cilíndrico, NO cuña AutoLock).
// Se apoya sobre la viga puente, no tiene cabezales cuña.
export default function Stringer({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, onMouseDown, modoTecnico }) {
  const { x, y, largo } = pieza;
  const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
  const w = pR.x - pL.x;

  // Perfil 40×80mm — en alzado se ve el lado de 80mm (alto) × largo
  const h = Math.max(4, zoom * 0.08);       // 80mm a escala
  const frameW = Math.max(0.5, zoom * 0.006); // grosor del marco (2.50mm espesor pared)

  const tecW = Math.max(0.8, zoom * 0.01);

  if (modoTecnico) {
    return (
      <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={pL.x - 3} y={pL.y - h - 3} width={w + 6} height={h + 6}
          fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
        {/* Rectángulo perfil (sección rectangular hueca) */}
        <rect x={pL.x} y={pL.y - h} width={w} height={h}
          fill="none" stroke={sc} strokeWidth={tecW} />
        {/* Línea interior (indica sección hueca) */}
        {zoom > 35 && <rect x={pL.x + frameW * 3} y={pL.y - h + frameW * 3}
          width={Math.max(0, w - frameW * 6)} height={Math.max(0, h - frameW * 6)}
          fill="none" stroke={sc} strokeWidth={tecW * 0.6} opacity="0.4" />}
        {/* Etiqueta */}
        {zoom > 40 && w > 30 && <text x={pL.x + w / 2} y={pL.y - h - 2}
          fontSize={Math.max(6, zoom * 0.05)} fill={sc} textAnchor="middle" fontFamily="monospace" opacity="0.6">
          STR {largo.toFixed(2)}m
        </text>}
      </g>
    );
  }

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {/* Selección glow */}
      {seleccionada && <rect x={pL.x - 3} y={pL.y - h - 3} width={w + 6} height={h + 6}
        fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}

      {/* Sombra */}
      <rect x={pL.x + 0.7} y={pL.y - h + 0.7} width={w} height={h}
        fill="#000" opacity="0.06" rx="0.5" />

      {/* Perfil rectangular — relleno sólido */}
      <rect x={pL.x} y={pL.y - h} width={w} height={h}
        fill={sc} stroke="#000" strokeWidth={Math.max(0.4, zoom * 0.005)} rx="0.5" opacity="0.85" />

      {/* Sección hueca interior (visible a zoom medio+) */}
      {zoom > 25 && <rect x={pL.x + frameW * 2.5} y={pL.y - h + frameW * 2.5}
        width={Math.max(0, w - frameW * 5)} height={Math.max(0, h - frameW * 5)}
        fill="none" stroke="#000" strokeWidth={Math.max(0.3, zoom * 0.003)} opacity="0.12" rx="0.3" />}

      {/* Highlight superior (reflejo metálico) */}
      <line x1={pL.x + 1} y1={pL.y - h + 1} x2={pR.x - 1} y2={pL.y - h + 1}
        stroke="#fff" strokeWidth={Math.max(0.4, zoom * 0.004)} opacity="0.25" />

      {/* Marcas de apoyo en extremos (donde descansa sobre VP) */}
      <line x1={pL.x} y1={pL.y} x2={pL.x + Math.min(3, zoom * 0.02)} y2={pL.y}
        stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.006)} opacity="0.4" />
      <line x1={pR.x} y1={pR.y} x2={pR.x - Math.min(3, zoom * 0.02)} y2={pR.y}
        stroke="#000" strokeWidth={Math.max(0.5, zoom * 0.006)} opacity="0.4" />

      {/* Etiqueta STR + largo */}
      {zoom > 40 && w > 30 && <text x={pL.x + w / 2} y={pL.y - h / 2 + 1}
        fontSize={Math.min(h * 0.7, Math.max(6, zoom * 0.05))} fill="#fff" textAnchor="middle"
        fontFamily="monospace" fontWeight="bold" opacity="0.5">STR</text>}
    </g>
  );
}
