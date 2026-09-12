// ============================================================
// CATÁLOGO EVENTO — Sonido, video e iluminación
// Elementos de evento (no Layher) que se cuelgan de la estructura.
// Dimensiones y pesos aproximados de equipos reales de primera línea.
// No reemplazan el plan técnico del proveedor de AV.
// ============================================================

export const CATALOGO_EVENTO = {
  // ─── LINE ARRAY ─────────────────────────────────────────────
  // Cada entrada es un cluster completo (bumper frame + N cajas).
  // `largo` = ancho del cluster (≈ ancho de una caja, siempre ~1.09m para tops).
  // `altoCaja` = alto de cada caja individual (mundo real, metros).
  // Peso = bumper (~50 kg) + N × peso por caja.
  // Refs inspiradas en JBL VTX / d&b J-Series / L-Acoustics K2.
  lineArrays: [
    { id: 'LA_6',      nombre: 'Line Array 6 cajas',       largo: 1.09, altoCaja: 0.35, peso: 218,  ref: 'LA-T6',    color: '#1d4ed8', cajas: 6,  tipoLA: 'top' },
    { id: 'LA_8',      nombre: 'Line Array 8 cajas',       largo: 1.09, altoCaja: 0.35, peso: 274,  ref: 'LA-T8',    color: '#1d4ed8', cajas: 8,  tipoLA: 'top' },
    { id: 'LA_12',     nombre: 'Line Array 12 cajas',      largo: 1.09, altoCaja: 0.35, peso: 386,  ref: 'LA-T12',   color: '#1d4ed8', cajas: 12, tipoLA: 'top' },
    { id: 'LA_16',     nombre: 'Line Array 16 cajas',      largo: 1.09, altoCaja: 0.35, peso: 498,  ref: 'LA-T16',   color: '#1d4ed8', cajas: 16, tipoLA: 'top' },
    { id: 'LA_SUB3V',  nombre: 'Subs volados ×3',          largo: 0.70, altoCaja: 0.55, peso: 255,  ref: 'SUB-V3',   color: '#1e40af', cajas: 3,  tipoLA: 'subVolado' },
    { id: 'LA_SUB4V',  nombre: 'Subs volados ×4',          largo: 0.70, altoCaja: 0.55, peso: 330,  ref: 'SUB-V4',   color: '#1e40af', cajas: 4,  tipoLA: 'subVolado' },
    { id: 'LA_SUB6V',  nombre: 'Subs volados ×6',          largo: 0.70, altoCaja: 0.55, peso: 480,  ref: 'SUB-V6',   color: '#1e40af', cajas: 6,  tipoLA: 'subVolado' },
    { id: 'LA_SUB4A',  nombre: 'Subs apilados ×4 (piso)',  largo: 0.70, altoCaja: 0.55, peso: 280,  ref: 'SUB-A4',   color: '#1e40af', cajas: 4,  tipoLA: 'subApilado' },
    { id: 'LA_DELAY',  nombre: 'Delay / Fill 1 caja',      largo: 0.80, altoCaja: 0.30, peso: 35,   ref: 'DLY-01',   color: '#3b82f6', cajas: 1,  tipoLA: 'delay' },
    { id: 'LA_DELAY3', nombre: 'Delay / Fill 3 cajas',     largo: 0.80, altoCaja: 0.30, peso: 95,   ref: 'DLY-03',   color: '#3b82f6', cajas: 3,  tipoLA: 'delay' },
    { id: 'LA_FRONT',  nombre: 'Front Fill 1 caja (borde)',largo: 0.60, altoCaja: 0.22, peso: 18,   ref: 'FF-01',    color: '#60a5fa', cajas: 1,  tipoLA: 'delay' },
  ],

  // ─── PANTALLAS LED ──────────────────────────────────────────
  // `largo` = ancho, `alto` = altura del panel. Peso ≈ 35 kg/m² (P3.9 outdoor).
  pantallasLED: [
    { id: 'LED_2x1',  nombre: 'Pantalla LED 2×1m (lateral)',  largo: 2.00, alto: 1.00, peso: 70,   ref: 'LED-2x1',  color: '#0891b2' },
    { id: 'LED_3x2',  nombre: 'Pantalla LED 3×2m',            largo: 3.00, alto: 2.00, peso: 210,  ref: 'LED-3x2',  color: '#0891b2' },
    { id: 'LED_4x2',  nombre: 'Pantalla LED 4×2m',            largo: 4.00, alto: 2.00, peso: 280,  ref: 'LED-4x2',  color: '#0891b2' },
    { id: 'LED_4x3',  nombre: 'Pantalla LED 4×3m',            largo: 4.00, alto: 3.00, peso: 420,  ref: 'LED-4x3',  color: '#0891b2' },
    { id: 'LED_6x3',  nombre: 'Pantalla LED 6×3m',            largo: 6.00, alto: 3.00, peso: 630,  ref: 'LED-6x3',  color: '#0891b2' },
    { id: 'LED_6x4',  nombre: 'Pantalla LED 6×4m',            largo: 6.00, alto: 4.00, peso: 840,  ref: 'LED-6x4',  color: '#0891b2' },
    { id: 'LED_8x4',  nombre: 'Pantalla LED 8×4m',            largo: 8.00, alto: 4.00, peso: 1120, ref: 'LED-8x4',  color: '#0891b2' },
    { id: 'LED_10x5', nombre: 'Pantalla LED 10×5m (central)', largo: 10.00,alto: 5.00, peso: 1750, ref: 'LED-10x5', color: '#0891b2' },
  ],

  // ─── ILUMINACIÓN ────────────────────────────────────────────
  // Fixtures colgados de truss. `largo` = ancho de ocupación en la estructura.
  // consumoW = potencia eléctrica por unidad.
  luces: [
    // Moving heads
    { id: 'LUZ_BEAM',     nombre: 'Beam (tipo Sharpy)',       largo: 0.35, peso: 8,   consumoW: 350,  ref: 'BEAM-01',   color: '#eab308', tipoLuz: 'beam' },
    { id: 'LUZ_MH',       nombre: 'Moving Head Spot',        largo: 0.45, peso: 28,  consumoW: 1200, ref: 'MH-SPT',    color: '#eab308', tipoLuz: 'movingHead' },
    { id: 'LUZ_MH_WASH',  nombre: 'Moving Head Wash',        largo: 0.40, peso: 22,  consumoW: 800,  ref: 'MH-WSH',    color: '#eab308', tipoLuz: 'wash' },
    { id: 'LUZ_MH_HYBRID',nombre: 'Moving Head Híbrido',     largo: 0.45, peso: 30,  consumoW: 1400, ref: 'MH-HYB',    color: '#eab308', tipoLuz: 'movingHead' },

    // Fixtures estáticos
    { id: 'LUZ_PAR',      nombre: 'PAR LED RGBW',            largo: 0.28, peso: 5,   consumoW: 200,  ref: 'PAR-01',    color: '#facc15', tipoLuz: 'par' },
    { id: 'LUZ_FRESNEL',  nombre: 'Fresnel LED',             largo: 0.30, peso: 10,  consumoW: 300,  ref: 'FRES-01',   color: '#facc15', tipoLuz: 'fresnel' },
    { id: 'LUZ_PROFILE',  nombre: 'Profile / Elipsoidal',    largo: 0.45, peso: 12,  consumoW: 750,  ref: 'PROF-01',   color: '#facc15', tipoLuz: 'profile' },
    { id: 'LUZ_FOLLOW',   nombre: 'Follow Spot',             largo: 0.80, peso: 32,  consumoW: 2500, ref: 'FOLLOW-01', color: '#f59e0b', tipoLuz: 'followSpot' },

    // Efectos
    { id: 'LUZ_STROBE',   nombre: 'Strobe (tipo Atomic)',    largo: 0.35, peso: 12,  consumoW: 3000, ref: 'STRB-01',   color: '#fbbf24', tipoLuz: 'strobe' },
    { id: 'LUZ_BLINDER2', nombre: 'Blinder 2 celdas',        largo: 0.35, peso: 8,   consumoW: 1300, ref: 'BLND-2',    color: '#fbbf24', tipoLuz: 'blinder' },
    { id: 'LUZ_BLINDER4', nombre: 'Blinder 4 celdas',        largo: 0.65, peso: 15,  consumoW: 2600, ref: 'BLND-4',    color: '#fbbf24', tipoLuz: 'blinder' },
    { id: 'LUZ_LASER',    nombre: 'Láser multicolor RGB',    largo: 0.40, peso: 12,  consumoW: 800,  ref: 'LASER-01',  color: '#22c55e', tipoLuz: 'laser' },

    // Barras
    { id: 'LUZ_BARRA1',   nombre: 'Barra LED Pixel 1m',     largo: 1.00, peso: 6,   consumoW: 150,  ref: 'BAR-100',   color: '#eab308', tipoLuz: 'barra' },
    { id: 'LUZ_BARRA2',   nombre: 'Barra LED Pixel 2m',     largo: 2.00, peso: 12,  consumoW: 300,  ref: 'BAR-200',   color: '#eab308', tipoLuz: 'barra' },

    // Complementos
    { id: 'LUZ_HAZER',    nombre: 'Máquina de Haze',         largo: 0.50, peso: 20,  consumoW: 1500, ref: 'HAZE-01',   color: '#94a3b8', tipoLuz: 'hazer' },
  ],
};

// Mapeo de categorías → sección de paleta
export const CAT_KEYS_EVENTO = [
  { key: 'lineArrays',   cat: 'lineArray',   label: '🔊 Line Array / Sonido' },
  { key: 'pantallasLED', cat: 'pantallaLED', label: '📺 Pantallas LED' },
  { key: 'luces',        cat: 'luz',         label: '💡 Iluminación' },
];
