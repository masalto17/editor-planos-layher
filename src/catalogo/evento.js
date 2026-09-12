// ============================================================
// CATÁLOGO EVENTO — Sonido, video e iluminación
// Elementos de evento (no Layher) que se cuelgan de la estructura:
// Line Array, Pantallas LED y Luces (moving heads, wash, barras).
// Pesos aprox. ≈ — usar como referencia comercial, no técnica.
// ============================================================

export const CATALOGO_EVENTO = {
  // ─── LINE ARRAY (clusters de sonido colgados de estructura/truss) ──
  lineArrays: [
    { id: 'LA_8',     nombre: 'Line Array 8 cajas',    largo: 0.60, peso: 320, ref: 'LA-8',    color: '#2563EB', cajas: 8,  tipoLA: 'top' },
    { id: 'LA_12',    nombre: 'Line Array 12 cajas',   largo: 0.60, peso: 480, ref: 'LA-12',   color: '#2563EB', cajas: 12, tipoLA: 'top' },
    { id: 'LA_SUB4',  nombre: 'Subs volados ×4',       largo: 1.20, peso: 280, ref: 'SUB-V4',  color: '#2563EB', cajas: 4,  tipoLA: 'subVolado' },
    { id: 'LA_SUB6',  nombre: 'Subs apilados ×6',      largo: 1.80, peso: 420, ref: 'SUB-A6',  color: '#2563EB', cajas: 6,  tipoLA: 'subApilado' },
    { id: 'LA_DELAY', nombre: 'Delay / Fill',          largo: 0.40, peso: 45,  ref: 'DLY-01',  color: '#2563EB', cajas: 1,  tipoLA: 'delay' },
  ],

  // ─── PANTALLAS LED ──────────────────────────────────────────
  pantallasLED: [
    { id: 'LED_3x2', nombre: 'Pantalla LED 3×2m',         largo: 3.00, alto: 2.00, peso: 210,  ref: 'LED-3x2', color: '#0891b2' },
    { id: 'LED_4x3', nombre: 'Pantalla LED 4×3m',         largo: 4.00, alto: 3.00, peso: 420,  ref: 'LED-4x3', color: '#0891b2' },
    { id: 'LED_6x3', nombre: 'Pantalla LED 6×3m',         largo: 6.00, alto: 3.00, peso: 630,  ref: 'LED-6x3', color: '#0891b2' },
    { id: 'LED_8x4', nombre: 'Pantalla LED 8×4m',         largo: 8.00, alto: 4.00, peso: 1120, ref: 'LED-8x4', color: '#0891b2' },
    { id: 'LED_2x1', nombre: 'Pantalla LED lateral 2×1m', largo: 2.00, alto: 1.00, peso: 70,   ref: 'LED-2x1', color: '#0891b2' },
  ],

  // ─── LUCES (fixtures colgados de truss) ─────────────────────
  luces: [
    { id: 'LUZ_MH',     nombre: 'Moving Head',   largo: 0.40, peso: 28, consumoW: 1200, ref: 'MH-01',   color: '#eab308', tipoLuz: 'movingHead' },
    { id: 'LUZ_WASH',   nombre: 'Wash LED',      largo: 0.35, peso: 18, consumoW: 600,  ref: 'WSH-01',  color: '#eab308', tipoLuz: 'wash' },
    { id: 'LUZ_SPOT',   nombre: 'Spot / Follow', largo: 0.50, peso: 35, consumoW: 1500, ref: 'SPT-01',  color: '#eab308', tipoLuz: 'spot' },
    { id: 'LUZ_BARRA',  nombre: 'Barra LED 1m',  largo: 1.00, peso: 8,  consumoW: 200,  ref: 'BAR-100', color: '#eab308', tipoLuz: 'barra' },
    { id: 'LUZ_STROBE', nombre: 'Strobe',        largo: 0.30, peso: 12, consumoW: 3000, ref: 'STR-01',  color: '#eab308', tipoLuz: 'strobe' },
    { id: 'LUZ_PAR',    nombre: 'PAR LED',       largo: 0.25, peso: 5,  consumoW: 200,  ref: 'PAR-01',  color: '#eab308', tipoLuz: 'par' },
  ],
};

// Mapeo de categorías → sección de paleta (mismo formato que CAT_KEYS en piezas.js)
export const CAT_KEYS_EVENTO = [
  { key: 'lineArrays',   cat: 'lineArray',   label: '🔊 Line Array / Sonido' },
  { key: 'pantallasLED', cat: 'pantallaLED', label: '📺 Pantallas LED' },
  { key: 'luces',        cat: 'luz',         label: '💡 Iluminación' },
];
