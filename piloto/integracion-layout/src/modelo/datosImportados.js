// Keep the source definition with each placed piece without changing its current render or snap.
export function datosImportados(herramienta) {
  const datos = {};
  if (herramienta._visual) datos._visual = structuredClone(herramienta._visual);
  if (herramienta._importada) datos._importada = true;
  if (herramienta._verificacion) datos._verificacion = herramienta._verificacion;
  if (herramienta._definicion) datos._definicion = structuredClone(herramienta._definicion);
  return datos;
}
