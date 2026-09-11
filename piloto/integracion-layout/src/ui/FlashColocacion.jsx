import { useState, useEffect, useCallback } from 'react';

/**
 * Flash visual al colocar una pieza — anillo verde que se expande y desvanece.
 * Uso: <FlashColocacion piezas={piezas} worldToScreen={worldToScreen} />
 * Detecta automáticamente cuando se agrega una pieza nueva.
 */
export default function FlashColocacion({ piezas, worldToScreen, useZ = false }) {
  const [flashes, setFlashes] = useState([]);
  const [prevCount, setPrevCount] = useState(piezas.length);

  useEffect(() => {
    const diff = piezas.length - prevCount;
    // Solo flash al colocar 1-3 piezas (no al cargar diseño completo ni pegar masivo)
    if (diff > 0 && diff <= 3) {
      const nueva = piezas[piezas.length - 1];
      if (nueva) {
        const isDiag = nueva.categoria === 'diagonal' || nueva.categoria === 'diagonalPlanta';
        const x = isDiag ? (nueva.x1 ?? 0) : (nueva.x ?? 0);
        const y = nueva.y ?? 0;
        const z = nueva.categoria === 'diagonalPlanta' ? (nueva.z1 ?? 0) : (nueva.z ?? 0);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          const id = Date.now();
          setFlashes(prev => [...prev, { id, x, y, z }]);
          setTimeout(() => setFlashes(prev => prev.filter(f => f.id !== id)), 600);
        }
      }
    }
    setPrevCount(piezas.length);
  }, [piezas.length]);

  if (!flashes.length) return null;

  return (
    <g pointerEvents="none">
      {flashes.map(f => {
        const p = worldToScreen(f.x, useZ ? f.z : f.y);
        if (!p || isNaN(p.x) || isNaN(p.y)) return null;
        return (
          <g key={f.id}>
            <circle cx={p.x} cy={p.y} r="3" fill="#22c55e" opacity="0.9">
              <animate attributeName="r" from="3" to="25" dur="0.5s" fill="freeze" />
              <animate attributeName="opacity" from="0.9" to="0" dur="0.5s" fill="freeze" />
            </circle>
            <circle cx={p.x} cy={p.y} r="2" fill="#22c55e" opacity="0.7">
              <animate attributeName="r" from="2" to="15" dur="0.35s" fill="freeze" />
              <animate attributeName="opacity" from="0.7" to="0" dur="0.35s" fill="freeze" />
            </circle>
          </g>
        );
      })}
    </g>
  );
}
