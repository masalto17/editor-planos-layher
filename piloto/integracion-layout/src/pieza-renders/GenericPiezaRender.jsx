/**
 * Renderer genérico data-driven para piezas importadas y tipos futuros.
 *
 * Lee la definición visual de la pieza (`pieza._visual`) y la dibuja como SVG.
 * Cada elemento visual es un objeto con tipo: linea | rectangulo | circulo | polilinea.
 * Las coordenadas están en metros relativos al origen de la pieza (0,0).
 *
 * Valores especiales en propiedades numéricas:
 *   "largo"  → pieza.largo
 *   "alto"   → pieza.alto || pieza.dimensiones?.alto || 0
 *   "color"  → sc (color resuelto: normal, seleccionado o técnico)
 *
 * Este renderer NO reemplaza los renders JSX existentes (Vertical, HorizontalO, etc.)
 * que tienen efectos 3D y detalles finos. Es el fallback para piezas que traen su
 * visual como datos JSON (importadas desde el Editor de Piezas).
 */
export default function GenericPiezaRender({ pieza, worldToScreen, zoom, sc, op, cur, seleccionada, fantasma, onMouseDown }) {
  const visual = pieza._visual;
  if (!visual || !visual.length) return null;

  const largo = pieza.largo || 0;
  const alto = pieza.alto || pieza.dimensiones?.alto || 0;

  // Resolver valor: puede ser número, string con referencia, o expresión simple
  function resolveVal(v) {
    if (typeof v === 'number') return v;
    if (v === 'largo') return largo;
    if (v === 'alto') return alto;
    if (typeof v === 'string') {
      // Expresiones simples: "largo-0.05", "alto/2", "largo+0.1"
      const m = v.match(/^(largo|alto)\s*([+\-*/])\s*([0-9.]+)$/);
      if (m) {
        const base = m[1] === 'largo' ? largo : alto;
        const num = parseFloat(m[3]);
        switch (m[2]) {
          case '+': return base + num;
          case '-': return base - num;
          case '*': return base * num;
          case '/': return num !== 0 ? base / num : 0;
        }
      }
      const parsed = parseFloat(v);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  function resolveColor(v) {
    if (!v || v === 'color') return sc;
    return v;
  }

  // Escala de strokeWidth proporcional al zoom (misma fórmula que los renders nativos)
  function sw(v) {
    const base = typeof v === 'number' ? v : 2;
    return Math.max(1, zoom * 0.012 * base);
  }

  function resolvePoint(p) {
    if (Array.isArray(p)) return { x: resolveVal(p[0]), y: resolveVal(p[1]) };
    return { x: resolveVal(p.x), y: resolveVal(p.y) };
  }

  const elements = visual.map((el, i) => {
    const stroke = resolveColor(el.stroke);
    // fill: solo aplicar resolveColor si fue explícitamente definido en el JSON
    const fill = (el.fill != null && el.fill !== '') ? resolveColor(el.fill) : 'none';
    const strokeW = sw(el.strokeWidth);
    const dashArray = el.dash ? el.dash.map(d => Math.max(2, zoom * 0.015 * d)).join(' ') : undefined;

    if (el.tipo === 'linea') {
      const desde = resolvePoint(el.desde);
      const hasta = resolvePoint(el.hasta);
      const p1 = worldToScreen(pieza.x + desde.x, pieza.y + desde.y);
      const p2 = worldToScreen(pieza.x + hasta.x, pieza.y + hasta.y);
      return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={stroke} strokeWidth={strokeW} fill="none"
        strokeDasharray={dashArray} strokeLinecap="round" />;
    }

    if (el.tipo === 'rectangulo') {
      const ex = resolveVal(el.x);
      const ey = resolveVal(el.y);
      const ew = resolveVal(el.ancho);
      const eh = resolveVal(el.alto);
      const p1 = worldToScreen(pieza.x + ex, pieza.y + ey + eh);
      const p2 = worldToScreen(pieza.x + ex + ew, pieza.y + ey);
      const rx = Math.abs(p2.x - p1.x);
      const ry = Math.abs(p2.y - p1.y);
      return <rect key={i} x={Math.min(p1.x, p2.x)} y={Math.min(p1.y, p2.y)}
        width={rx} height={ry}
        stroke={stroke} strokeWidth={strokeW} fill={fill}
        strokeDasharray={dashArray} rx={Math.max(0.5, zoom * 0.003)} />;
    }

    if (el.tipo === 'circulo') {
      const cx = resolveVal(el.x);
      const cy = resolveVal(el.y);
      const r = resolveVal(el.radio);
      const pc = worldToScreen(pieza.x + cx, pieza.y + cy);
      const pr = Math.max(2, zoom * r);
      return <circle key={i} cx={pc.x} cy={pc.y} r={pr}
        stroke={stroke} strokeWidth={strokeW} fill={fill} />;
    }

    if (el.tipo === 'polilinea') {
      const puntos = (el.puntos || []).map(p => {
        const rp = resolvePoint(p);
        return worldToScreen(pieza.x + rp.x, pieza.y + rp.y);
      });
      const pts = puntos.map(p => `${p.x},${p.y}`).join(' ');
      return <polyline key={i} points={pts}
        stroke={stroke} strokeWidth={strokeW} fill={fill}
        strokeDasharray={dashArray} strokeLinecap="round" strokeLinejoin="round" />;
    }

    return null;
  });

  // Bounding box para selección glow
  const bounds = computeBounds(pieza, visual, resolveVal, worldToScreen);

  return (
    <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && bounds && (
        <rect x={bounds.x - 4} y={bounds.y - 4}
          width={bounds.w + 8} height={bounds.h + 8}
          fill="none" stroke="#E30613" strokeWidth={2} opacity={0.25}
          rx={3} />
      )}
      {elements}
    </g>
  );
}

function computeBounds(pieza, visual, resolveVal, worldToScreen) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const el of visual) {
    const points = [];
    if (el.tipo === 'linea') {
      const d = Array.isArray(el.desde) ? { x: resolveVal(el.desde[0]), y: resolveVal(el.desde[1]) } : { x: resolveVal(el.desde.x), y: resolveVal(el.desde.y) };
      const h = Array.isArray(el.hasta) ? { x: resolveVal(el.hasta[0]), y: resolveVal(el.hasta[1]) } : { x: resolveVal(el.hasta.x), y: resolveVal(el.hasta.y) };
      points.push(d, h);
    } else if (el.tipo === 'rectangulo') {
      const x = resolveVal(el.x), y = resolveVal(el.y), w = resolveVal(el.ancho), h = resolveVal(el.alto);
      points.push({ x, y }, { x: x + w, y: y + h });
    } else if (el.tipo === 'circulo') {
      const r = resolveVal(el.radio);
      points.push({ x: resolveVal(el.x) - r, y: resolveVal(el.y) - r }, { x: resolveVal(el.x) + r, y: resolveVal(el.y) + r });
    } else if (el.tipo === 'polilinea' && el.puntos) {
      for (const p of el.puntos) {
        const rp = Array.isArray(p) ? { x: resolveVal(p[0]), y: resolveVal(p[1]) } : { x: resolveVal(p.x), y: resolveVal(p.y) };
        points.push(rp);
      }
    }
    for (const p of points) {
      const sp = worldToScreen(pieza.x + p.x, pieza.y + p.y);
      if (sp.x < minX) minX = sp.x;
      if (sp.x > maxX) maxX = sp.x;
      if (sp.y < minY) minY = sp.y;
      if (sp.y > maxY) maxY = sp.y;
    }
  }

  if (minX === Infinity) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
