// ============================================================
// CATÁLOGO FESTIVAL — fichas de definición v2
// Regla: un dato desconocido es null y se muestra «Sin dato». Nunca 0 ni un supuesto.
// Las dimensiones fijas cambian por variante; solo `parametrico: true` admite edición.
//
// Ejes locales de una pieza (anclada en el centro de su huella):
//   u = frente (dimensiones.ancho), v = altura (dimensiones.alto), w = fondo (dimensiones.profundidad).
// Con rot = 0°, u corre sobre +X y w sobre +Z. La rotación gira alrededor del eje Y.
// ============================================================

export const ESTADOS = {
  esquematico: { label: 'Esquemático', corto: 'ESQ', color: '#b45309' },
  pendienteReferencia: { label: 'Pendiente de referencia', corto: 'PEND', color: '#6b7280' },
  validado: { label: 'Validado por MasAlto', corto: 'OK', color: '#15803d' },
  archivado: { label: 'Archivado', corto: 'ARCH', color: '#9ca3af' },
};

export const CAPAS = [
  { id: 'estructura', label: 'Estructura', color: '#1e40af' },
  { id: 'publico', label: 'Público', color: '#E30613' },
  { id: 'tecnica', label: 'Técnica', color: '#7c3aed' },
  { id: 'energia', label: 'Energía', color: '#ca8a04' },
  { id: 'seguridad', label: 'Seguridad', color: '#dc2626' },
  { id: 'gastronomia', label: 'Gastronomía', color: '#ea580c' },
  { id: 'sponsors', label: 'Sponsors', color: '#db2777' },
  { id: 'backstage', label: 'Backstage', color: '#0f766e' },
  { id: 'logistica', label: 'Logística', color: '#475569' },
  { id: 'entorno', label: 'Entorno', color: '#65a30d' },
  { id: 'documentacion', label: 'Documentación', color: '#64748b' },
];

const HOY = '2026-09-29';

export const DEFINICIONES_FESTIVAL = [
  {
    id: 'VALL-AA-100-NEG', version: 1, schema: '2.0',
    nombre: 'Vallado antiavalancha 1,00 m · negro',
    aliases: ['freestanding', 'antiavalancha', 'crash barrier', 'barrera de escenario', 'vallado frente'],
    familia: 'valladoAntiavalancha', tipoEntidad: 'pieza', capa: 'publico',
    marca: null, modelo: null, variante: '1,00 m', acabado: 'negro',
    estado: 'esquematico',
    dimensiones: { ancho: 1.00, alto: 1.25, profundidad: 1.20 },
    procedencia: { ancho: `Confirmado por MasAlto (${HOY})`, alto: `Confirmado por MasAlto (${HOY})`, profundidad: `Referencia visual IA con medidas generales confirmadas (${HOY})` },
    peso: null,
    conexion: { tipo: null, paso: null },
    referencias: [{ tipo: 'visualizacionIA', descripcion: 'Frente, lateral y perspectiva generados por IA. Placa de piso del lado público y escalón del lado seguridad.', fecha: HOY }],
    pendientes: ['Fotos reales de frente, lateral y perspectiva', 'Largo de la placa de piso', 'Altura del escalón', 'Unión entre módulos', 'Esquineros', 'Peso por acabado'],
    geometria: 'antiavalancha', color: '#1f2937',
  },
  {
    id: 'VALL-AA-100-PLA', version: 1, schema: '2.0',
    nombre: 'Vallado antiavalancha 1,00 m · plateado',
    aliases: ['freestanding', 'antiavalancha', 'crash barrier', 'barrera de escenario', 'vallado frente', 'galvanizado'],
    familia: 'valladoAntiavalancha', tipoEntidad: 'pieza', capa: 'publico',
    marca: null, modelo: null, variante: '1,00 m', acabado: 'plateado',
    estado: 'esquematico',
    dimensiones: { ancho: 1.00, alto: 1.25, profundidad: 1.20 },
    procedencia: { ancho: `Confirmado por MasAlto (${HOY})`, alto: `Confirmado por MasAlto (${HOY})`, profundidad: `Referencia visual IA con medidas generales confirmadas (${HOY})` },
    peso: null,
    conexion: { tipo: null, paso: null },
    referencias: [{ tipo: 'visualizacionIA', descripcion: 'Variante plateada de la misma referencia IA.', fecha: HOY }],
    pendientes: ['Fotos reales', 'Material del acabado plateado', 'Peso'],
    geometria: 'antiavalancha', color: '#9ca3af',
  },
  {
    id: 'REJA-300', version: 1, schema: '2.0',
    nombre: 'Valla tipo reja 3,00 m',
    aliases: ['reja', 'valla peatonal', 'vallado perimetral'],
    familia: 'rejaModular', tipoEntidad: 'pieza', capa: 'publico',
    marca: null, modelo: null, variante: '3,00 × 1,20 m', acabado: null,
    estado: 'esquematico',
    dimensiones: { ancho: 3.00, alto: 1.20, profundidad: null },
    procedencia: { ancho: 'Confirmado por MasAlto', alto: 'Confirmado por MasAlto' },
    peso: null,
    conexion: { tipo: null, paso: null },
    referencias: [],
    pendientes: ['Foto o ficha', 'Profundidad y forma de bases', 'Marco y relleno', 'Uniones', 'Acabado', 'Peso'],
    geometria: 'reja', color: '#475569',
  },
  {
    id: 'REJA-250', version: 1, schema: '2.0',
    nombre: 'Valla tipo reja 2,50 m',
    aliases: ['reja', 'valla peatonal', 'vallado perimetral'],
    familia: 'rejaModular', tipoEntidad: 'pieza', capa: 'publico',
    marca: null, modelo: null, variante: '2,50 × 1,25 m', acabado: null,
    estado: 'esquematico',
    dimensiones: { ancho: 2.50, alto: 1.25, profundidad: null },
    procedencia: { ancho: 'Confirmado por MasAlto', alto: `Confirmado por MasAlto (${HOY})` },
    peso: null,
    conexion: { tipo: null, paso: null },
    referencias: [{ tipo: 'fichaDescartada', descripcion: 'Ficha «Ecobar 18» (alto 1,09 m) no coincide con el alto confirmado; no se usa.', fecha: HOY }],
    pendientes: ['Foto o ficha del modelo real', 'Profundidad y forma de bases', 'Uniones', 'Peso'],
    geometria: 'reja', color: '#64748b',
  },
  {
    // Mismo id que la ficha pendiente de la Fase 1: las instancias ya colocadas conservan su copia
    // (sin medidas); las nuevas toman estos datos. Frente (u) = lado largo, donde está el tablero.
    id: 'GEN-HIM-200', version: 2, schema: '2.0',
    nombre: 'Generador Himoinsa 200 kVA · insonorizado',
    aliases: ['generador', 'grupo electrógeno', 'GE', 'himoinsa', 'insonorizado', 'soundproof', 'cabina'],
    familia: 'generador', tipoEntidad: 'pieza', capa: 'energia',
    marca: 'Himoinsa', modelo: null, variante: '200 kVA · insonorizado', acabado: null,
    estado: 'validado',
    dimensiones: { ancho: 3.30, alto: 1.965, profundidad: 1.20 },
    procedencia: {
      marca: 'Informada por MasAlto',
      ancho: `Largo 3.300 mm, ficha Himoinsa 200 kVA insonorizado, informada por MasAlto (${HOY})`,
      alto: `1.965 mm, ficha Himoinsa, informada por MasAlto (${HOY})`,
      profundidad: `Ancho 1.200 mm, ficha Himoinsa, informada por MasAlto (${HOY})`,
      estado: 'Validado por MasAlto (29/09/2026)',
      peso: `Con líquidos; la ficha informada cita «aprox. 2.300 kg / 2.318 kg» (${HOY})`,
    },
    peso: 2318,
    electrico: { kVA: 200, kW: null, regimen: null, combustible: null, depositoL: 450 },
    referencias: [
      { tipo: 'fichaFabricante', descripcion: 'Himoinsa · generator set 200 kVA soundproof', url: 'https://www.himoinsa.com/eng/electric-generators/29690/generator-set--200kva--soundproof.html', fecha: HOY },
      { tipo: 'foto', descripcion: 'Foto de frente: cabina roja con tablero a la izquierda, bancada negra y dos apoyos.', fecha: HOY },
    ],
    pendientes: ['Código de modelo exacto', 'kW y régimen (PRP / ESP)', 'Posición de escape y ventilación'],
    geometria: 'generador', carroceria: 'insonorizado', color: '#c8161d',
  },
  {
    id: 'GEN-HIM-200-ABI', version: 1, schema: '2.0',
    nombre: 'Generador Himoinsa 200 kVA · abierto (skid)',
    aliases: ['generador', 'grupo electrógeno', 'GE', 'himoinsa', 'abierto', 'skid', 'bancada'],
    familia: 'generador', tipoEntidad: 'pieza', capa: 'energia',
    marca: 'Himoinsa', modelo: null, variante: '200 kVA · abierto sobre bancada', acabado: null,
    estado: 'validado',
    dimensiones: { ancho: 2.90, alto: 1.634, profundidad: 0.90 },
    procedencia: {
      marca: 'Informada por MasAlto',
      ancho: `Largo 2.900 mm, versión abierta, informada por MasAlto (${HOY})`,
      alto: `1.634 mm, versión abierta, informada por MasAlto (${HOY})`,
      profundidad: `Ancho 900 mm, versión abierta, informada por MasAlto (${HOY})`,
      estado: 'Validado por MasAlto (29/09/2026)',
      peso: `En seco, aprox.; varía según el tanque de la bancada (${HOY})`,
    },
    peso: 1558,
    electrico: { kVA: 200, kW: null, regimen: null, combustible: null, depositoL: null },
    referencias: [],
    pendientes: ['Código de modelo exacto', 'Peso con líquidos y tanque instalado', 'kW y régimen (PRP / ESP)', 'Capacidad del tanque'],
    geometria: 'generador', carroceria: 'abierto', color: '#c8161d',
  },
  {
    id: 'TARIMA-GEN', version: 1, schema: '2.0',
    nombre: 'Tarima genérica',
    aliases: ['tarima', 'deck', 'praticable', 'escenario modular'],
    familia: 'tarima', tipoEntidad: 'pieza', capa: 'estructura',
    marca: null, modelo: null, variante: 'Paramétrica', acabado: null,
    estado: 'esquematico',
    parametrico: true,
    dimensiones: { ancho: 2.00, alto: 0.40, profundidad: 1.00 },
    rangos: { ancho: [0.50, 20], alto: [0.10, 2.50], profundidad: [0.50, 20] },
    procedencia: { ancho: 'Parámetro editable', alto: 'Parámetro editable', profundidad: 'Parámetro editable' },
    peso: null,
    referencias: [{ tipo: 'decision', descripcion: 'Sistema de tarimas genérico, sin modelo comercial asociado.', fecha: HOY }],
    pendientes: ['Sin modelo comercial: no computa patas ni peso'],
    geometria: 'tarima', color: '#78350f',
  },
];

export const USOS_AREA = [
  { id: 'campo', label: 'Campo general', capa: 'publico', color: '#3b82f6' },
  { id: 'vip', label: 'VIP', capa: 'publico', color: '#a855f7' },
  { id: 'corralito', label: 'Sector preferencial', capa: 'publico', color: '#ec4899' },
  { id: 'backstage', label: 'Backstage', capa: 'backstage', color: '#14b8a6' },
  { id: 'gastronomia', label: 'Gastronomía', capa: 'gastronomia', color: '#f97316' },
  { id: 'estacionamiento', label: 'Estacionamiento', capa: 'logistica', color: '#64748b' },
  { id: 'deposito', label: 'Depósito', capa: 'logistica', color: '#78716c' },
  { id: 'exclusion', label: 'Zona de exclusión', capa: 'seguridad', color: '#dc2626' },
  { id: 'predio', label: 'Límite de predio', capa: 'entorno', color: '#65a30d' },
  { id: 'generica', label: 'Área genérica', capa: 'documentacion', color: '#94a3b8' },
];

export const USOS_RECORRIDO = [
  { id: 'circulacion', label: 'Circulación', capa: 'publico', color: '#2563eb' },
  { id: 'evacuacion', label: 'Evacuación', capa: 'seguridad', color: '#16a34a' },
  { id: 'pmr', label: 'Acceso PMR', capa: 'publico', color: '#0891b2' },
  { id: 'vehicular', label: 'Vehicular', capa: 'logistica', color: '#475569' },
  { id: 'energia', label: 'Distribución eléctrica', capa: 'energia', color: '#ca8a04' },
];

// Herramientas de trazado (no son piezas de catálogo): se colocan con varios clics.
export const HERRAMIENTAS_TRAZO = [
  { id: 'TRAZO-AREA', nombre: 'Área (polígono)', categoria: 'area', tipoEntidad: 'area', uso: 'generica', aliases: ['sector', 'zona', 'polígono', 'superficie', 'VIP', 'campo'] },
  { id: 'TRAZO-RECORRIDO', nombre: 'Recorrido', categoria: 'recorrido', tipoEntidad: 'recorrido', uso: 'circulacion', aliases: ['circulación', 'evacuación', 'corredor', 'carril'] },
  { id: 'TRAZO-VALLADO', nombre: 'Vallado por recorrido', categoria: 'valladoRecorrido', tipoEntidad: 'herramienta', defId: 'REJA-300', aliases: ['vallado', 'reja', 'perímetro', 'antiavalancha'] },
];

export const definicionPorId = id => DEFINICIONES_FESTIVAL.find(d => d.id === id) ?? null;
export const VALLAS = DEFINICIONES_FESTIVAL.filter(d => d.familia === 'valladoAntiavalancha' || d.familia === 'rejaModular');
