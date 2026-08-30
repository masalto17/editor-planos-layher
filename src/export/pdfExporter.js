/**
 * Export a PDF con membrete corporativo MásAlto/MYD, cuadro de datos,
 * tabla de despiece y sellos legales.
 *
 * Usa jsPDF para generar el documento y serializa el SVG del canvas
 * a imagen PNG mediante un <canvas> temporal.
 */
import { jsPDF } from 'jspdf';
import { DESPIECE_ORDER } from '../catalogo/constantes.js';

// --- Constantes de diseño ---
const ROJO = '#E30613';
const NEGRO = '#000000';
const GRIS = '#777777';
const MARGEN = 12; // mm
const A4_W = 297; // landscape
const A4_H = 210;

/**
 * Isotipo MásAlto (assets/masalto-isotipo.svg), rasterizado 256×256 con fondo
 * transparente, para el membrete del PDF. jsPDF necesita un dataURL raster —
 * no puede embeber SVG directamente vía doc.addImage().
 */
const LOGO_MASALTO_PNG = 'data:image/png;base64,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';

// --- Helpers ---

/** Serializa un nodo SVG a un data URL PNG de alta resolución. */
function svgToImage(svgElement, scale = 2) {
  return new Promise((resolve, reject) => {
    try {
      const clone = svgElement.cloneNode(true);
      // Forzar fondo blanco
      clone.style.backgroundColor = 'white';
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      // Asegurar dimensiones explícitas
      const rect = svgElement.getBoundingClientRect();
      clone.setAttribute('width', rect.width);
      clone.setAttribute('height', rect.height);
      const data = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al rasterizar SVG')); };
      img.src = url;
    } catch (err) { reject(err); }
  });
}

/** Calcula despiece agrupado igual que Despiece.jsx */
function calcularDespiece(piezas) {
  const ag = {};
  piezas.forEach(p => {
    if (!ag[p.tipoId]) ag[p.tipoId] = { nombre: p.nombre, categoria: p.categoria, peso: p.peso, ref: p.ref, cantidad: 0 };
    ag[p.tipoId].cantidad += 1;
  });
  const lista = Object.values(ag).sort((a, b) => (DESPIECE_ORDER[a.categoria] ?? 99) - (DESPIECE_ORDER[b.categoria] ?? 99));
  return { lista, pesoTotal: piezas.reduce((s, p) => s + p.peso, 0), cantidadTotal: piezas.length };
}

/** Dibuja el membrete (header) en la parte superior del PDF. */
function dibujarMembrete(doc, nombreDiseno, fecha) {
  // Isotipo MásAlto (reemplaza la banda roja + texto que hacía de logo)
  doc.addImage(LOGO_MASALTO_PNG, 'PNG', MARGEN, 2, 10, 10);

  // Título empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(NEGRO);
  doc.text('MÁSALTO ESTRUCTURAS', MARGEN + 12, 9);

  // Subtítulo
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRIS);
  doc.text('MYD Estructuras SAS · San Juan, Argentina', MARGEN + 95, 9);

  // Nombre del diseño a la derecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(NEGRO);
  doc.text(nombreDiseno || 'Sin título', A4_W - MARGEN, 9, { align: 'right' });

  // Línea debajo del membrete (acento rojo corporativo)
  doc.setDrawColor(ROJO);
  doc.setLineWidth(0.5);
  doc.line(MARGEN, 16, A4_W - MARGEN, 16);

  // Fecha
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRIS);
  doc.text(`Fecha: ${fecha}`, MARGEN, 20);
  doc.text('Editor de Planos Layher v2.0', A4_W - MARGEN, 20, { align: 'right' });
}

/** Dibuja la tabla de despiece. */
function dibujarDespiece(doc, despiece, startY) {
  const x0 = A4_W - MARGEN - 75; // ancho tabla 75mm, alineada a la derecha
  const colW = 75;
  let y = startY;

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(NEGRO);
  doc.text('DESPIECE DE MATERIALES', x0, y);
  y += 4;

  // Encabezados
  doc.setFillColor(240, 240, 240);
  doc.rect(x0, y - 3, colW, 5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(GRIS);
  doc.text('Pieza', x0 + 1, y);
  doc.text('Ref.', x0 + 38, y);
  doc.text('Cant', x0 + 55, y, { align: 'right' });
  doc.text('kg', x0 + colW - 1, y, { align: 'right' });
  y += 5;

  // Filas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(NEGRO);
  despiece.lista.forEach((it) => {
    if (y > A4_H - 30) return; // overflow protection
    doc.setDrawColor(230, 230, 230);
    doc.line(x0, y + 1, x0 + colW, y + 1);
    doc.text(it.nombre, x0 + 1, y);
    doc.setTextColor(GRIS);
    doc.text(it.ref || '', x0 + 38, y);
    doc.setTextColor(NEGRO);
    doc.text(String(it.cantidad), x0 + 55, y, { align: 'right' });
    doc.text((it.cantidad * it.peso).toFixed(1), x0 + colW - 1, y, { align: 'right' });
    y += 4;
  });

  // Total
  y += 1;
  doc.setDrawColor(NEGRO);
  doc.setLineWidth(0.4);
  doc.line(x0, y - 2, x0 + colW, y - 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL', x0 + 1, y + 1);
  doc.text(`${despiece.pesoTotal.toFixed(1)} kg`, x0 + colW - 1, y + 1, { align: 'right' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRIS);
  doc.text(`${despiece.cantidadTotal} piezas`, x0 + colW - 1, y + 5, { align: 'right' });

  return y + 8;
}

/** Dibuja los sellos legales obligatorios en el pie de página. */
function dibujarSellosLegales(doc) {
  const y = A4_H - 12;
  doc.setDrawColor(ROJO);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, y - 3, A4_W - MARGEN, y - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(ROJO);
  doc.text(
    'Plano esquemático preliminar realizado únicamente con fines presupuestarios y comerciales. No utilizar como guía de armado ni documentación técnica definitiva.',
    MARGEN, y
  );
  doc.text(
    'Debe ser verificado y aprobado por un ingeniero estructural matriculado antes de su construcción.',
    MARGEN, y + 3
  );

  // Marca de agua sutil
  doc.setFontSize(5);
  doc.setTextColor(180, 180, 180);
  doc.text('Generado con Editor de Planos Layher v2.0 — MásAlto Estructuras', A4_W / 2, A4_H - 3, { align: 'center' });
}

/** Dibuja cuadro de datos técnicos */
function dibujarCuadroDatos(doc, datos, startY) {
  const x0 = A4_W - MARGEN - 75;
  let y = startY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(NEGRO);
  doc.text('DATOS DEL PROYECTO', x0, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  const campos = [
    ['Proyecto', datos.nombre || 'Sin título'],
    ['Cliente', datos.cliente || '—'],
    ['Ubicación', datos.ubicacion || '—'],
    ['Fecha', datos.fecha],
    ['Filas (profundidad)', datos.filas || '—'],
    ['Sistema', 'Layher Allround'],
  ];

  campos.forEach(([label, valor]) => {
    doc.setTextColor(GRIS);
    doc.text(label + ':', x0 + 1, y);
    doc.setTextColor(NEGRO);
    doc.text(valor, x0 + 28, y);
    y += 3.5;
  });

  return y + 2;
}

// ============================================================
// API pública
// ============================================================

/**
 * Genera y descarga un PDF con el plano actual.
 *
 * @param {Object} opciones
 * @param {string} opciones.nombreDiseno
 * @param {Array} opciones.piezas
 * @param {Array} opciones.filas
 * @param {SVGElement} opciones.svgAlzado — nodo SVG del canvas de alzado
 * @param {SVGElement} [opciones.svgPlanta] — nodo SVG del canvas de planta (opcional)
 * @param {Object} [opciones.datosProyecto] — { cliente, ubicacion }
 */
export async function exportarPDF({ nombreDiseno, piezas, filas, svgAlzado, svgPlanta, datosProyecto = {} }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Membrete
  dibujarMembrete(doc, nombreDiseno, fecha);

  // Vista Alzado (imagen)
  const imgAreaW = A4_W - MARGEN * 2 - 80; // dejo espacio para despiece a la derecha
  const imgAreaH = A4_H - 55; // descontando header y footer
  let imgY = 24;

  if (svgAlzado) {
    try {
      const imgData = await svgToImage(svgAlzado, 2);
      const svgRect = svgAlzado.getBoundingClientRect();
      const aspect = svgRect.width / svgRect.height;
      let imgW = imgAreaW;
      let imgH = imgW / aspect;
      if (imgH > imgAreaH) { imgH = imgAreaH; imgW = imgH * aspect; }
      doc.addImage(imgData, 'PNG', MARGEN, imgY, imgW, imgH);

      // Título de la vista
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(GRIS);
      doc.text('VISTA DE ALZADO FRONTAL', MARGEN, imgY - 1);
    } catch (err) {
      console.warn('No se pudo rasterizar el alzado:', err);
      doc.setFontSize(8);
      doc.setTextColor(GRIS);
      doc.text('(Vista de alzado no disponible)', MARGEN + 20, imgY + 30);
    }
  }

  // Panel derecho: datos + despiece
  const filasStr = filas.map(f => `${f.nombre} (Z=${f.z.toFixed(2)}m)`).join(', ');
  let panelY = dibujarCuadroDatos(doc, {
    nombre: nombreDiseno,
    cliente: datosProyecto.cliente,
    ubicacion: datosProyecto.ubicacion,
    fecha,
    filas: filasStr,
  }, 24);

  const despiece = calcularDespiece(piezas);
  dibujarDespiece(doc, despiece, panelY);

  // Sellos legales
  dibujarSellosLegales(doc);

  // --- Página 2: Planta (si hay SVG disponible) ---
  if (svgPlanta) {
    doc.addPage('a4', 'landscape');
    dibujarMembrete(doc, nombreDiseno, fecha);

    try {
      const imgData = await svgToImage(svgPlanta, 2);
      const svgRect = svgPlanta.getBoundingClientRect();
      const aspect = svgRect.width / svgRect.height;
      const fullW = A4_W - MARGEN * 2;
      const fullH = A4_H - 45;
      let imgW = fullW;
      let imgH = imgW / aspect;
      if (imgH > fullH) { imgH = fullH; imgW = imgH * aspect; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(GRIS);
      doc.text('VISTA DE PLANTA', MARGEN, 23);
      doc.addImage(imgData, 'PNG', MARGEN, 24, imgW, imgH);
    } catch (err) {
      console.warn('No se pudo rasterizar la planta:', err);
    }

    dibujarSellosLegales(doc);
  }

  // Descargar
  const filename = (nombreDiseno || 'plano').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '') + '.pdf';
  doc.save(filename);
  return filename;
}
