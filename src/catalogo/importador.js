/**
 * Importador de piezas externas (.masalto-pieza.json).
 *
 * Lee archivos que cumplen pieza.schema.json y los convierte en entradas
 * compatibles con el catálogo interno + datos de render genérico (_visual).
 *
 * Las piezas importadas se guardan en localStorage bajo un namespace separado
 * para no mezclar con el catálogo base Layher.
 */

const STORAGE_KEY = 'layher:piezas-importadas';

// ─── Validación mínima (no requiere ajv/jsonschema) ───────────────
export function validarPiezaImportada(json) {
  const errores = [];
  if (!json || typeof json !== 'object') return ['JSON inválido'];
  if (json.schemaVersion !== '1.0') errores.push('schemaVersion debe ser "1.0"');
  if (!json.id || !/^[A-Z0-9_-]{3,40}$/.test(json.id)) errores.push('ID inválido (3-40 chars, A-Z0-9_-)');
  if (!json.nombre || json.nombre.length < 3) errores.push('Nombre muy corto (mín 3 chars)');
  if (!json.categoria) errores.push('Falta categoría');
  if (!json.dimensiones?.largo || json.dimensiones.largo <= 0) errores.push('Largo inválido');
  if (json.despiece?.pesoKg == null || json.despiece.pesoKg < 0) errores.push('Peso inválido');
  if (!json.vistas?.alzado?.elementos?.length) errores.push('Falta dibujo de alzado');
  if (!json.colocacion) errores.push('Falta sección colocación');
  return errores;
}

// ─── Convertir JSON importado → entrada de catálogo interno ───────
export function convertirAPiezaCatalogo(json) {
  const cat = json.categoria === 'piezaManual' ? 'importada' : json.categoria;

  return {
    id: json.id,
    nombre: json.nombre,
    largo: json.dimensiones.largo,
    alto: json.dimensiones.alto || 0,
    peso: json.despiece.pesoKg,
    ref: json.origen?.referencia || 'SIN-REF',
    color: extraerColorPrincipal(json.vistas?.alzado?.elementos) || '#6b7280',
    // Datos extra para el renderer genérico
    _importada: true,
    _categoriaOriginal: json.categoria,
    _verificacion: json.origen?.estadoVerificacion || 'pendienteVerificacion',
    _visual: json.vistas?.alzado?.elementos || [],
    _visualPlanta: json.vistas?.planta?.elementos || [],
    _colocacion: json.colocacion,
    _advertencias: json.advertencias || [],
  };
}

function extraerColorPrincipal(elementos) {
  if (!elementos?.length) return null;
  for (const el of elementos) {
    if (el.stroke && el.stroke !== 'none' && el.stroke !== 'color') return el.stroke;
    if (el.fill && el.fill !== 'none' && el.fill !== 'color') return el.fill;
  }
  return null;
}

// ─── Persistencia en localStorage ─────────────────────────────────
export function guardarPiezaImportada(piezaCatalogo) {
  const todas = cargarPiezasImportadas();
  const idx = todas.findIndex(p => p.id === piezaCatalogo.id);
  if (idx >= 0) todas[idx] = piezaCatalogo;
  else todas.push(piezaCatalogo);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todas));
  } catch { /* localStorage lleno o no disponible */ }
  return todas;
}

export function cargarPiezasImportadas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function eliminarPiezaImportada(id) {
  const todas = cargarPiezasImportadas().filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todas));
  } catch { /* ignore */ }
  return todas;
}

// ─── Leer archivo del disco (File API) ────────────────────────────
export async function leerArchivoPieza(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        const errores = validarPiezaImportada(json);
        if (errores.length) {
          reject(new Error(`Errores en ${file.name}: ${errores.join(', ')}`));
          return;
        }
        resolve({ json, catalogoEntry: convertirAPiezaCatalogo(json) });
      } catch (e) {
        reject(new Error(`No se pudo leer ${file.name}: ${e.message}`));
      }
    };
    reader.onerror = () => reject(new Error(`Error leyendo ${file.name}`));
    reader.readAsText(file);
  });
}
