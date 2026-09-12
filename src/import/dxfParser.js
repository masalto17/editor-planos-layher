/**
 * Parser DXF simplificado para importar planos de SketchUp, AutoCAD, etc.
 *
 * Lee el formato ASCII DXF y extrae entidades geométricas (LINE, LWPOLYLINE,
 * CIRCLE, INSERT) que luego se pueden mapear a piezas Layher.
 *
 * NO es un parser completo DXF — cubre las entidades más comunes que exportan
 * SketchUp, AutoCAD LT y similares para planos 2D de andamios.
 *
 * Referencia: https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf_reference_enu.pdf
 */

// ─── Tokenizador: lee pares de código/valor del DXF ─────────────────
function tokenizar(texto) {
  const lineas = texto.split(/\r?\n/);
  const pares = [];
  for (let i = 0; i < lineas.length - 1; i += 2) {
    const codigo = parseInt(lineas[i].trim(), 10);
    const valor = lineas[i + 1]?.trim() ?? '';
    if (!isNaN(codigo)) pares.push({ codigo, valor });
  }
  return pares;
}

// ─── Extraer entidades de la sección ENTITIES ────────────────────────
function extraerEntidades(pares) {
  const entidades = [];
  let enEntities = false;
  let entidadActual = null;

  for (let i = 0; i < pares.length; i++) {
    const { codigo, valor } = pares[i];

    // Detectar inicio de sección ENTITIES
    if (codigo === 2 && valor === 'ENTITIES') { enEntities = true; continue; }
    if (codigo === 0 && valor === 'ENDSEC' && enEntities) {
      if (entidadActual) entidades.push(entidadActual);
      break;
    }
    if (!enEntities) continue;

    // Nueva entidad
    if (codigo === 0) {
      if (entidadActual) entidades.push(entidadActual);
      entidadActual = { tipo: valor, props: {}, vertices: [] };
      continue;
    }

    if (!entidadActual) continue;

    // Propiedades comunes
    switch (codigo) {
      case 8: entidadActual.props.layer = valor; break;
      case 62: entidadActual.props.colorIndex = parseInt(valor, 10); break;
      // Punto 1
      case 10: entidadActual.props.x1 = parseFloat(valor); break;
      case 20: entidadActual.props.y1 = parseFloat(valor); break;
      case 30: entidadActual.props.z1 = parseFloat(valor); break;
      // Punto 2
      case 11: entidadActual.props.x2 = parseFloat(valor); break;
      case 21: entidadActual.props.y2 = parseFloat(valor); break;
      case 31: entidadActual.props.z2 = parseFloat(valor); break;
      // Radio / Diámetro
      case 40: entidadActual.props.radio = parseFloat(valor); break;
      case 41: entidadActual.props.escalaX = parseFloat(valor); break;
      case 42: entidadActual.props.escalaY = parseFloat(valor); break;
      // Ángulos
      case 50: entidadActual.props.angInicio = parseFloat(valor); break;
      case 51: entidadActual.props.angFin = parseFloat(valor); break;
      // Bloque
      case 2: entidadActual.props.nombreBloque = valor; break;
      // Rotación
      case 43: entidadActual.props.rotacion = parseFloat(valor); break;
      default: break;
    }

    // Vértices de LWPOLYLINE
    if (entidadActual.tipo === 'LWPOLYLINE') {
      if (codigo === 10) {
        entidadActual.vertices.push({ x: parseFloat(valor) });
      } else if (codigo === 20 && entidadActual.vertices.length > 0) {
        entidadActual.vertices[entidadActual.vertices.length - 1].y = parseFloat(valor);
      }
    }
  }

  return entidades;
}

// ─── Extraer bloques (BLOCKS section) ────────────────────────────────
function extraerBloques(pares) {
  const bloques = {};
  let enBlocks = false;
  let bloqueActual = null;
  let entidadActual = null;

  for (let i = 0; i < pares.length; i++) {
    const { codigo, valor } = pares[i];
    if (codigo === 2 && valor === 'BLOCKS') { enBlocks = true; continue; }
    if (codigo === 0 && valor === 'ENDSEC' && enBlocks) break;
    if (!enBlocks) continue;

    if (codigo === 0 && valor === 'BLOCK') {
      bloqueActual = { nombre: '', entidades: [] };
      entidadActual = null;
      continue;
    }
    if (codigo === 0 && valor === 'ENDBLK') {
      if (bloqueActual?.nombre) bloques[bloqueActual.nombre] = bloqueActual;
      bloqueActual = null;
      continue;
    }
    if (!bloqueActual) continue;

    if (codigo === 2 && !bloqueActual.nombre) {
      bloqueActual.nombre = valor;
      continue;
    }

    // Entidades dentro del bloque
    if (codigo === 0) {
      if (entidadActual) bloqueActual.entidades.push(entidadActual);
      entidadActual = { tipo: valor, props: {} };
      continue;
    }
    if (entidadActual) {
      switch (codigo) {
        case 10: entidadActual.props.x1 = parseFloat(valor); break;
        case 20: entidadActual.props.y1 = parseFloat(valor); break;
        case 11: entidadActual.props.x2 = parseFloat(valor); break;
        case 21: entidadActual.props.y2 = parseFloat(valor); break;
        case 40: entidadActual.props.radio = parseFloat(valor); break;
        case 8: entidadActual.props.layer = valor; break;
      }
    }
  }
  return bloques;
}

// ─── Clasificar entidad como posible pieza Layher ────────────────────
// Heurística basada en dimensiones, orientación y layer names
function clasificarGeometria(ent) {
  if (ent.tipo === 'LINE') {
    const dx = (ent.props.x2 ?? 0) - (ent.props.x1 ?? 0);
    const dy = (ent.props.y2 ?? 0) - (ent.props.y1 ?? 0);
    const largo = Math.sqrt(dx * dx + dy * dy);
    const angulo = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;

    return {
      tipo: 'linea',
      x1: ent.props.x1 ?? 0,
      y1: ent.props.y1 ?? 0,
      x2: ent.props.x2 ?? 0,
      y2: ent.props.y2 ?? 0,
      largo,
      angulo,
      layer: ent.props.layer || '',
      esVertical: angulo > 75, // >75° respecto horizontal
      esHorizontal: angulo < 15, // <15°
      esDiagonal: angulo >= 15 && angulo <= 75,
    };
  }

  if (ent.tipo === 'CIRCLE') {
    return {
      tipo: 'circulo',
      cx: ent.props.x1 ?? 0,
      cy: ent.props.y1 ?? 0,
      radio: ent.props.radio ?? 0,
      layer: ent.props.layer || '',
    };
  }

  if (ent.tipo === 'LWPOLYLINE' && ent.vertices.length >= 2) {
    // Calcular bounding box
    const xs = ent.vertices.map(v => v.x);
    const ys = ent.vertices.map(v => v.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    return {
      tipo: 'polilinea',
      vertices: ent.vertices,
      xMin, xMax, yMin, yMax,
      ancho: xMax - xMin,
      alto: yMax - yMin,
      layer: ent.props.layer || '',
      esCerrada: Math.abs(xs[0] - xs[xs.length - 1]) < 0.01 && Math.abs(ys[0] - ys[ys.length - 1]) < 0.01,
    };
  }

  if (ent.tipo === 'INSERT') {
    return {
      tipo: 'bloque',
      nombre: ent.props.nombreBloque || '',
      x: ent.props.x1 ?? 0,
      y: ent.props.y1 ?? 0,
      escalaX: ent.props.escalaX ?? 1,
      escalaY: ent.props.escalaY ?? 1,
      layer: ent.props.layer || '',
    };
  }

  return null;
}

// ─── Mapear geometría a piezas Layher candidatas ─────────────────────
import { MODULOS_STANDARD, ROSETA_STEP } from '../catalogo/constantes.js';

const LARGOS_VERTICALES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
const LARGOS_HORIZONTALES = [...MODULOS_STANDARD]; // 0.73 a 3.07

function matchLayher(geo) {
  const sugerencias = [];

  if (geo.tipo === 'linea') {
    if (geo.esVertical) {
      // Buscar el vertical más cercano
      const mejor = LARGOS_VERTICALES.reduce((best, l) =>
        Math.abs(l - geo.largo) < Math.abs(best - geo.largo) ? l : best
      , LARGOS_VERTICALES[0]);
      if (Math.abs(mejor - geo.largo) < 0.15) {
        sugerencias.push({
          categoria: 'vertical',
          largo: mejor,
          x: Math.min(geo.x1, geo.x2),
          y: Math.min(geo.y1, geo.y2),
          confianza: 1 - Math.abs(mejor - geo.largo) / 0.15,
        });
      }
    }
    if (geo.esHorizontal) {
      const mejor = LARGOS_HORIZONTALES.reduce((best, l) =>
        Math.abs(l - geo.largo) < Math.abs(best - geo.largo) ? l : best
      , LARGOS_HORIZONTALES[0]);
      if (Math.abs(mejor - geo.largo) < 0.15) {
        sugerencias.push({
          categoria: 'horizontalO',
          largo: mejor,
          x: Math.min(geo.x1, geo.x2),
          y: geo.y1,
          confianza: 1 - Math.abs(mejor - geo.largo) / 0.15,
        });
      }
    }
    if (geo.esDiagonal) {
      sugerencias.push({
        categoria: 'diagonal',
        x1: geo.x1, y1: geo.y1,
        x2: geo.x2, y2: geo.y2,
        largo: geo.largo,
        confianza: 0.6, // diagonales siempre con menor confianza
      });
    }
  }

  if (geo.tipo === 'polilinea' && geo.esCerrada) {
    // Rectángulos cerrados pueden ser plataformas
    if (geo.alto < 0.15 && geo.ancho > 0.5) {
      const mejor = LARGOS_HORIZONTALES.reduce((best, l) =>
        Math.abs(l - geo.ancho) < Math.abs(best - geo.ancho) ? l : best
      , LARGOS_HORIZONTALES[0]);
      if (Math.abs(mejor - geo.ancho) < 0.15) {
        sugerencias.push({
          categoria: 'plataforma',
          largo: mejor,
          x: geo.xMin,
          y: geo.yMax,
          confianza: 0.5,
        });
      }
    }
  }

  if (geo.tipo === 'circulo') {
    // Círculos pequeños pueden ser rosetas
    if (geo.radio < 0.1 && geo.radio > 0.01) {
      sugerencias.push({
        tipo: 'roseta',
        cx: geo.cx,
        cy: geo.cy,
        confianza: 0.7,
      });
    }
  }

  return sugerencias;
}

// ─── API pública ─────────────────────────────────────────────────────

/**
 * Parsea un archivo DXF y retorna geometría clasificada + sugerencias Layher.
 * @param {string} textoContenido — contenido del archivo DXF como texto
 * @returns {{ entidades, geometrias, sugerencias, capas, bounds, stats }}
 */
export function parsearDXF(textoContenido) {
  const pares = tokenizar(textoContenido);
  const entidades = extraerEntidades(pares);
  const bloques = extraerBloques(pares);

  // Clasificar geometría
  const geometrias = entidades.map(clasificarGeometria).filter(Boolean);

  // Capas únicas
  const capas = [...new Set(geometrias.map(g => g.layer).filter(Boolean))];

  // Bounding box global
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  geometrias.forEach(g => {
    if (g.tipo === 'linea') {
      xMin = Math.min(xMin, g.x1, g.x2); xMax = Math.max(xMax, g.x1, g.x2);
      yMin = Math.min(yMin, g.y1, g.y2); yMax = Math.max(yMax, g.y1, g.y2);
    } else if (g.tipo === 'circulo') {
      xMin = Math.min(xMin, g.cx - g.radio); xMax = Math.max(xMax, g.cx + g.radio);
      yMin = Math.min(yMin, g.cy - g.radio); yMax = Math.max(yMax, g.cy + g.radio);
    } else if (g.tipo === 'polilinea') {
      xMin = Math.min(xMin, g.xMin); xMax = Math.max(xMax, g.xMax);
      yMin = Math.min(yMin, g.yMin); yMax = Math.max(yMax, g.yMax);
    }
  });

  // Generar sugerencias Layher para cada geometría
  const sugerencias = geometrias.flatMap(matchLayher);

  // Estadísticas
  const stats = {
    totalEntidades: entidades.length,
    lineas: geometrias.filter(g => g.tipo === 'linea').length,
    verticales: geometrias.filter(g => g.tipo === 'linea' && g.esVertical).length,
    horizontales: geometrias.filter(g => g.tipo === 'linea' && g.esHorizontal).length,
    diagonales: geometrias.filter(g => g.tipo === 'linea' && g.esDiagonal).length,
    circulos: geometrias.filter(g => g.tipo === 'circulo').length,
    polilineas: geometrias.filter(g => g.tipo === 'polilinea').length,
    bloques: Object.keys(bloques).length,
    capas: capas.length,
    sugerenciasLayher: sugerencias.length,
  };

  return {
    entidades,
    geometrias,
    sugerencias,
    capas,
    bloques,
    bounds: { xMin, xMax, yMin, yMax },
    stats,
  };
}

/**
 * Lee un archivo DXF del disco (File API del browser).
 */
export function leerArchivoDXF(file) {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.dxf')) {
      reject(new Error('El archivo debe ser .dxf'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const resultado = parsearDXF(reader.result);
        resolve(resultado);
      } catch (e) {
        reject(new Error(`Error parseando DXF: ${e.message}`));
      }
    };
    reader.onerror = () => reject(new Error(`Error leyendo ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Convierte sugerencias Layher en piezas listas para colocar en el editor.
 * Opcionalmente aplica un offset de posición y escala.
 */
export function sugerenciasAPiezas(sugerencias, opciones = {}) {
  const { offsetX = 0, offsetY = 0, escala = 1, confianzaMinima = 0.5 } = opciones;

  return sugerencias
    .filter(s => s.confianza >= confianzaMinima && s.categoria) // solo con categoría y confianza suficiente
    .map((s, i) => ({
      categoria: s.categoria,
      largo: s.largo,
      x: (s.x ?? s.x1 ?? 0) * escala + offsetX,
      y: (s.y ?? s.y1 ?? 0) * escala + offsetY,
      ...(s.x2 != null ? { x2: s.x2 * escala + offsetX, y2: s.y2 * escala + offsetY } : {}),
      orientacion: 'x',
      confianza: s.confianza,
      _importadaDXF: true,
      _indice: i,
    }));
}
