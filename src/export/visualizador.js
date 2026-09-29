import { idbSet } from '../modelo/storage.js';

export function serializarDiseno(modelo) {
  if (!Array.isArray(modelo.piezas)) throw Error('El diseño no contiene una lista de piezas.');
  const text = JSON.stringify({
    nombre: modelo.nombreDiseno || 'Diseño sin título',
    piezas: modelo.piezas,
    filas: modelo.filas,
    fecha: new Date().toISOString(),
    version: '2.0',
    app: 'MasAlto Layout',
  });
  if (new Blob([text]).size > 15 * 1024 * 1024) throw Error('El diseño supera los 15 MB admitidos por el visualizador.');
  return text;
}

export async function abrirVisualizador(modelo, base = '/') {
  const data = JSON.parse(serializarDiseno(modelo));
  const id = crypto.randomUUID();
  const url = new URL(`${base}visualizador/index.html`, location.origin);
  url.hash = new URLSearchParams({ proyecto: id }).toString();
  // Abrir la pestaña de forma síncrona (antes del await) para no ser bloqueada por el navegador.
  const tab = window.open('about:blank', '_blank');
  if (!tab) throw Error('El navegador bloqueó la nueva pestaña. Permití las ventanas emergentes para abrir el visualizador.');
  try {
    await idbSet(`visor:${id}`, data);
    tab.opener = null;
    tab.location.replace(url.href);
  } catch {
    tab.close();
    throw Error('No se pudo transferir el diseño. Podés guardarlo como archivo y abrirlo desde el visualizador.');
  }
}
