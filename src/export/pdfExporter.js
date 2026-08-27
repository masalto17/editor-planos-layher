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
  // Banda roja superior
  doc.setFillColor(ROJO);
  doc.rect(0, 0, A4_W, 14, 'F');

  // Título empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('MÁSALTO ESTRUCTURAS', MARGEN, 10);

  // Subtítulo
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('MYD Estructuras SAS · San Juan, Argentina', MARGEN + 85, 10);

  // Nombre del diseño a la derecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(nombreDiseno || 'Sin título', A4_W - MARGEN, 10, { align: 'right' });

  // Línea debajo del membrete
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
