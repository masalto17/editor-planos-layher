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
    id: 'VALL-AA-100-NEG', version: 2, schema: '2.0',
    nombre: 'Vallado antiavalancha 1,00 m · negro',
    aliases: ['freestanding', 'antiavalancha', 'crash barrier', 'barrera de escenario', 'vallado frente', 'masalto'],
    familia: 'valladoAntiavalancha', tipoEntidad: 'pieza', capa: 'publico',
    marca: 'MasAlto', modelo: 'Propio', variante: '1,00 m', acabado: 'negro',
    estado: 'validado',
    dimensiones: { ancho: 1.00, alto: 1.30, profundidad: 1.20 },
    procedencia: {
      ancho: `Confirmado por MasAlto (${HOY})`,
      alto: `1,30 m confirmado por MasAlto según croquis (${HOY}); reemplaza el 1,25 inicial`,
      profundidad: `Confirmado por MasAlto con fotos reales y croquis (${HOY})`,
      conexion: `Unión con tornillo, módulos pegados: paso real 1,00 m, confirmado por MasAlto (${HOY})`,
      estado: `Validado por MasAlto (${HOY})`,
    },
    peso: null,
    detalle: {
      panel: 'Chapa perforada negra con logo MasAlto',
      placa: 'Placa de piso lisa del lado público',
      estructura: 'Dos tornapuntas interiores y escalón del lado seguridad',
    },
    conexion: { tipo: 'Tornillo (módulos pegados)', paso: 1.00 },
    referencias: [
      { tipo: 'visualizacionIA', descripcion: 'Frente, lateral y perspectiva generados por IA.', fecha: HOY },
      { tipo: 'foto', descripcion: 'Fotos reales MasAlto: panel de chapa perforada negra con logo, placa de piso lisa del lado público, dos tornapuntas interiores y escalón del lado seguridad; módulos en línea continua.', fecha: HOY },
      { tipo: 'croquis', descripcion: 'Croquis «Valla Freestanding» 100 × 120 × 130 con vista lateral: panel a 1/3 del fondo desde el lado seguridad.', fecha: HOY },
    ],
    pendientes: ['Cota de la placa de piso y del escalón', 'Esquineros', 'Peso'],
    // Proporciones de dibujo medidas sobre fotos y croquis (no son cotas): ver predio.mjs.
    esquema: { panel: 0.66, escalon: 0.39, tornapunta: 0.97, tornapuntaU: 0.2 },
    geometria: 'antiavalancha', color: '#1f2937',
  },
  {
    // No es de MasAlto: modelo de aluminio que MasAlto suele utilizar en eventos.
    id: 'VALL-AA-100-PLA', version: 2, schema: '2.0',
    nombre: 'Vallado antiavalancha 1,00 m · aluminio (de uso habitual)',
    aliases: ['freestanding', 'antiavalancha', 'crash barrier', 'barrera de escenario', 'vallado frente', 'aluminio', 'plateado'],
    familia: 'valladoAntiavalancha', tipoEntidad: 'pieza', capa: 'publico',
    marca: null, modelo: null, variante: '1,00 m', acabado: 'aluminio',
    estado: 'esquematico',
    dimensiones: { ancho: 1.00, alto: 1.30, profundidad: 1.20 },
    procedencia: {
      ancho: `Medidas de la familia confirmadas por MasAlto (${HOY})`,
      alto: `Medidas de la familia confirmadas por MasAlto (${HOY}); falta confirmarlas para este modelo`,
      profundidad: `Medidas de la familia confirmadas por MasAlto (${HOY}); falta confirmarlas para este modelo`,
    },
    peso: null,
    detalle: {
      panel: 'Chapa de aluminio perforada',
      placa: 'Placa de piso con rampa en el borde del lado público',
    },
    conexion: { tipo: null, paso: null },
    referencias: [
      { tipo: 'fotoProducto', descripcion: 'Foto de producto: chapa perforada de aluminio, placa de piso con rampa. Modelo que MasAlto suele utilizar; el propio de MasAlto es el negro.', fecha: HOY },
    ],
    pendientes: ['Proveedor y modelo', 'Confirmar medidas de este modelo', 'Unión entre módulos', 'Peso'],
    esquema: { panel: 0.66, escalon: 0.39, tornapunta: 0.97, tornapuntaU: 0.2, rampa: 0.08 },
    geometria: 'antiavalancha', color: '#9ca3af',
  },
  {
    id: 'REJA-300', version: 2, schema: '2.0',
    nombre: 'Valla tipo reja 3,00 m',
    aliases: ['reja', 'valla peatonal', 'vallado perimetral', 'modelo pesado', 'galvanizada'],
    familia: 'rejaModular', tipoEntidad: 'pieza', capa: 'publico',
    marca: null, modelo: null, variante: '3,00 × 1,20 m · pesada', acabado: 'galvanizado',
    estado: 'esquematico',
    dimensiones: { ancho: 3.00, alto: 1.20, profundidad: 0.60 },
    procedencia: {
      ancho: 'Confirmado por MasAlto', alto: 'Confirmado por MasAlto',
      profundidad: `Profundidad de la base, ficha de referencia informada por MasAlto (${HOY})`,
      peso: `Aproximado según ficha de referencia (${HOY})`,
    },
    peso: 24.0,
    detalle: {
      marco: 'Tubo de acero galvanizado Ø 38 mm, espesor 1,5 mm',
      relleno: 'Barras verticales Ø 16 mm, separación 100–110 mm',
      base: 'Tubos soldados, profundidad 0,60 m',
      acabado: 'Galvanizado en caliente (ISO 1461)',
    },
    conexion: { tipo: 'Acople de seguridad macho-hembra / pasador', paso: null },
    referencias: [{ tipo: 'fichaReferencia', descripcion: 'Ficha «Valla reja 3,00 × 1,20 m · modelo pesado / alta resistencia» con fotos de referencia.', fecha: HOY }],
    pendientes: ['Confirmar que la ficha corresponde al modelo de MasAlto', 'Paso real entre módulos con el acople', 'Peso real (la ficha dice aproximado)'],
    // Proporciones de dibujo según la ficha (no son cotas).
    esquema: { pasoBarrotes: 0.105, base: 'tubos' },
    geometria: 'reja', color: '#94a3b8',
  },
  {
    id: 'REJA-250', version: 2, schema: '2.0',
    nombre: 'Valla tipo reja 2,50 m',
    aliases: ['reja', 'valla peatonal', 'vallado perimetral', 'municipal', 'apilable'],
    familia: 'rejaModular', tipoEntidad: 'pieza', capa: 'publico',
    marca: null, modelo: null, variante: '2,50 × 1,25 m · municipal apilable', acabado: 'pintura en polvo',
    estado: 'esquematico',
    dimensiones: { ancho: 2.50, alto: 1.25, profundidad: 0.60 },
    procedencia: {
      ancho: 'Confirmado por MasAlto', alto: `Confirmado por MasAlto (${HOY})`,
      profundidad: `Profundidad de la base, ficha de referencia informada por MasAlto (${HOY})`,
      peso: `Aproximado según ficha de referencia (${HOY})`,
    },
    peso: 16.5,
    detalle: {
      marco: 'Tubo de acero galvanizado Ø 38 mm',
      relleno: 'Barras verticales Ø 16 mm, separación aprox. 110 mm',
      base: 'Tubo Ø 38 mm con patas inclinadas, profundidad 0,60 m',
      acabado: 'Pintura en polvo poliéster (amarillo u otros colores)',
    },
    conexion: { tipo: 'Gancho simple', paso: null },
    referencias: [
      { tipo: 'fichaReferencia', descripcion: 'Ficha «Valla reja 2,50 × 1,25 m · tipo municipal apilable» con fotos de referencia.', fecha: HOY },
      { tipo: 'fichaDescartada', descripcion: 'Ficha «Ecobar 18» (alto 1,09 m) no coincide con el alto confirmado; no se usa.', fecha: HOY },
    ],
    pendientes: ['Confirmar que la ficha corresponde al modelo de MasAlto', 'Paso real entre módulos con el gancho', 'Color de la pintura', 'Peso real (la ficha dice aproximado)'],
    esquema: { pasoBarrotes: 0.11, base: 'patas' },
    geometria: 'reja', color: '#eab308',
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
    // Aberturas: portón y puerta de emergencia. Paramétricas porque no hay modelo comercial
    // cargado; luz libre y alto son parámetros del proyecto, no datos de un producto.
    id: 'PORTON-GEN', version: 1, schema: '2.0',
    nombre: 'Portón de ingreso / egreso',
    aliases: ['portón', 'porton', 'ingreso', 'egreso', 'acceso', 'puerta', 'tranquera'],
    familia: 'porton', tipoEntidad: 'pieza', capa: 'publico',
    marca: null, modelo: null, variante: 'Paramétrico', acabado: null,
    estado: 'esquematico',
    parametrico: true,
    dimensiones: { ancho: 4.00, alto: 2.00, profundidad: null },
    rangos: { ancho: [0.80, 12], alto: [1.00, 4.00] },
    opciones: [
      { clave: 'hojas', label: 'Hojas', valores: [[1, '1 hoja'], [2, '2 hojas']], defecto: 2 },
      { clave: 'abre', label: 'Abre hacia', valores: [['fondo', 'Fondo (w+)'], ['frente', 'Frente (w−)']], defecto: 'fondo' },
    ],
    procedencia: { ancho: 'Parámetro editable: luz libre', alto: 'Parámetro editable' },
    peso: null,
    referencias: [],
    pendientes: ['Modelo real (hojas, postes, bases)', 'Peso'],
    geometria: 'abertura', color: '#0f766e',
  },
  {
    id: 'PUERTA-EMER', version: 1, schema: '2.0',
    nombre: 'Puerta de emergencia',
    aliases: ['emergencia', 'salida', 'evacuación', 'puerta', 'salida de emergencia'],
    familia: 'puertaEmergencia', tipoEntidad: 'pieza', capa: 'seguridad',
    marca: null, modelo: null, variante: 'Paramétrica', acabado: null,
    estado: 'esquematico',
    parametrico: true,
    dimensiones: { ancho: 2.00, alto: 2.00, profundidad: null },
    rangos: { ancho: [0.80, 12], alto: [1.00, 4.00] },
    opciones: [
      { clave: 'hojas', label: 'Hojas', valores: [[1, '1 hoja'], [2, '2 hojas']], defecto: 2 },
      { clave: 'abre', label: 'Abre hacia', valores: [['fondo', 'Fondo (w+)'], ['frente', 'Frente (w−)']], defecto: 'fondo' },
    ],
    procedencia: { ancho: 'Parámetro editable: luz libre; el ancho exigido sale del cálculo de evacuación', alto: 'Parámetro editable' },
    peso: null,
    salidaEmergencia: true,
    referencias: [],
    pendientes: ['Luz libre según cálculo de evacuación (Fase 4)', 'Modelo real', 'Peso'],
    geometria: 'abertura', color: '#16a34a',
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
  { id: 'cargaGeneradores', label: 'Sector de carga de generadores', capa: 'energia', color: '#eab308' },
  { id: 'combustible', label: 'Área de combustible', capa: 'energia', color: '#b91c1c' },
  { id: 'predio', label: 'Límite de predio', capa: 'entorno', color: '#65a30d' },
  { id: 'generica', label: 'Área genérica', capa: 'documentacion', color: '#94a3b8' },
];

export const USOS_RECORRIDO = [
  { id: 'circulacion', label: 'Circulación', capa: 'publico', color: '#2563eb' },
  { id: 'evacuacion', label: 'Evacuación', capa: 'seguridad', color: '#16a34a' },
  { id: 'acceso', label: 'Carril de acceso', capa: 'publico', color: '#1d4ed8', sentido: 'ida' },
  { id: 'pmr', label: 'Acceso PMR', capa: 'publico', color: '#0891b2', sentido: 'ida' },
  { id: 'vehicular', label: 'Vehicular', capa: 'logistica', color: '#475569' },
  { id: 'energia', label: 'Distribución eléctrica', capa: 'energia', color: '#ca8a04' },
  { id: 'bandeja', label: 'Bandeja portacables', capa: 'energia', color: '#a16207', conCota: true },
];

// Herramientas de trazado (no son piezas de catálogo): se colocan con varios clics.
export const HERRAMIENTAS_TRAZO = [
  { id: 'TRAZO-AREA', nombre: 'Área (polígono)', categoria: 'area', tipoEntidad: 'area', uso: 'generica', aliases: ['sector', 'zona', 'polígono', 'superficie', 'VIP', 'campo'] },
  { id: 'TRAZO-RECORRIDO', nombre: 'Recorrido', categoria: 'recorrido', tipoEntidad: 'recorrido', uso: 'circulacion', aliases: ['circulación', 'evacuación', 'corredor', 'carril'] },
  { id: 'TRAZO-VALLADO', nombre: 'Vallado por recorrido', categoria: 'valladoRecorrido', tipoEntidad: 'herramienta', defId: 'REJA-300', aliases: ['vallado', 'reja', 'perímetro', 'antiavalancha'] },
];

export const definicionPorId = id => DEFINICIONES_FESTIVAL.find(d => d.id === id) ?? null;
export const VALLAS = DEFINICIONES_FESTIVAL.filter(d => d.familia === 'valladoAntiavalancha' || d.familia === 'rejaModular');
