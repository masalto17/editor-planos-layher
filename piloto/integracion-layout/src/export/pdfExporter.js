/**
 * Export PDF con membrete corporativo MásAlto/MYD/Layout.
 * Formato A3 apaisado (420×297mm) — layout aprobado en mockup v3.
 *
 * Marcas:
 *   Header-izq: másalto estructuras (marca madre, dominante) + MasAlto Layout (separador)
 *   Header-der: MYD Estructuras S.A.S. (razón social) + datos
 *   Footer-der: "Creado con MasAlto Layout v2.0"
 */
import { jsPDF } from 'jspdf';
import { DESPIECE_ORDER } from '../catalogo/constantes.js';

// --- Constantes de diseño ---
const ROJO = '#E30613';
const NEGRO = '#000000';
const GRIS = '#777777';
const GRIS_CLARO = '#E0E0E0';
const M = 12; // margen mm
const W = 420; // A3 landscape width
const H = 297; // A3 landscape height
const HEADER_H = 22; // altura header mm
const FOOTER_H = 18; // altura footer mm
const PANEL_W = 80; // ancho panel derecho mm

// --- Helpers ---

/** Carga una imagen desde URL y devuelve data URL. */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`No se pudo cargar: ${url}`));
    img.src = url;
  });
}

/** Rasteriza un SVG element a PNG data URL. */
function rasterizeSVGElement(svgEl, scale = 2) {
  return new Promise((resolve, reject) => {
    try {
      const clone = svgEl.cloneNode(true);
      clone.style.backgroundColor = 'white';
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const rect = svgEl.getBoundingClientRect();
      clone.setAttribute('width', rect.width);
      clone.setAttribute('height', rect.height);
      const data = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = rect.width * scale;
        c.height = rect.height * scale;
        const ctx = c.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error rasterizando SVG')); };
      img.src = url;
    } catch (err) { reject(err); }
  });
}

/** Carga todos los logos de branding. */
async function cargarLogos() {
  const base = import.meta.env.BASE_URL || '/';
  const results = {};
  try {
    const [masalto, myd, layout] = await Promise.all([
      loadImage(`${base}branding/masalto-estructuras.png`),
      loadImage(`${base}branding/myd-estructuras.jpg`),
      loadImage(`${base}branding/masalto-logo-horizontal.svg`).catch(() => null),
    ]);
    results.masalto = masalto;
    results.myd = myd;
    results.layout = layout;
  } catch (err) {
    console.warn('Error cargando logos:', err);
  }
  return results;
}

/** Calcula despiece agrupado. */
function calcularDespiece(piezas) {
  const ag = {};
  piezas.forEach(p => {
    if (p.categoria === 'techo' && Array.isArray(p.componentes)) {
      p.componentes.forEach(c => {
        if (!ag[c.tipoId]) ag[c.tipoId] = { nombre: c.nombre, categoria: c.tipoId.startsWith('CEL') ? 'celosia' : 'cumbrera', peso: c.peso, ref: c.ref, cantidad: 0 };
        ag[c.tipoId].cantidad += c.cantidad;
      });
      return;
    }
    if (!ag[p.tipoId]) ag[p.tipoId] = { nombre: p.nombre, categoria: p.categoria, peso: p.peso, ref: p.ref, cantidad: 0 };
    ag[p.tipoId].cantidad += 1;
  });
  const lista = Object.values(ag).sort((a, b) => (DESPIECE_ORDER[a.categoria] ?? 99) - (DESPIECE_ORDER[b.categoria] ?? 99));
  return { lista, pesoTotal: piezas.reduce((s, p) => s + p.peso, 0), cantidadTotal: piezas.length };
}

// --- Dibujo ---

/** Header con 3 marcas: másalto estructuras + Layout (izq), nombre proyecto (centro), MYD (der). */
function dibujarHeader(doc, datos, logos) {
  const y0 = M;

  // Logo másalto estructuras (marca madre, dominante)
  if (logos.masalto) {
    // Original ~1200×700, mostrar ~18mm alto
    const logoH = 18;
    const logoW = logoH * (1200 / 700);
    doc.addImage(logos.masalto, 'PNG', M, y0 - 2, logoW, logoH);

    // Logo Layout al lado con separador
    const sepX = M + logoW + 3;
    doc.setDrawColor(GRIS_CLARO);
    doc.setLineWidth(0.3);
    doc.line(sepX, y0 + 2, sepX, y0 + 14);

    if (logos.layout) {
      // SVG 700×220 — mostrar ~8mm alto
      const lH = 8;
      const lW = lH * (700 / 220);
      doc.addImage(logos.layout, 'PNG', sepX + 2, y0 + 4, lW, lH);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(GRIS);
      doc.text('MasAlto Layout', sepX + 2, y0 + 10);
    }
  } else {
    // Fallback texto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(NEGRO);
    doc.text('másalto', M, y0 + 10);
    doc.setFontSize(8);
    doc.setTextColor(ROJO);
    doc.text('estructuras', M, y0 + 15);
  }

  // Centro: nombre proyecto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(NEGRO);
  doc.text(datos.nombre || 'Sin título', W / 2, y0 + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(GRIS);
  const sub = [datos.ubicacion, datos.resumen].filter(Boolean).join(' · ');
  if (sub) doc.text(sub, W / 2, y0 + 12, { align: 'center' });

  // Derecha: MYD logo + datos
  if (logos.myd) {
    const mH = 12;
    const mW = mH * (2000 / 1000);
    doc.addImage(logos.myd, 'JPEG', W - M - mW - 45, y0, mW, mH);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(GRIS);
  const derX = W - M;
  doc.text('MYD Estructuras S.A.S.', derX, y0 + 3, { align: 'right' });
  doc.text(`CUIT ${datos.cuit || '30-71XXXXXX-X'}`, derX, y0 + 6.5, { align: 'right' });
  doc.text(`${datos.fecha} · Rev. ${datos.revision || '01'}`, derX, y0 + 10, { align: 'right' });
  doc.text(`Plano Nº ${datos.planoNum || 'MA-XXXX-XXX'}`, derX, y0 + 13.5, { align: 'right' });

  // Línea roja bajo header
  const lineY = y0 + HEADER_H - 2;
  doc.setDrawColor(ROJO);
  doc.setLineWidth(0.6);
  doc.line(M, lineY, W - M, lineY);

  return lineY + 2;
}

/** Cuadro de datos técnicos del proyecto. */
function dibujarCuadroDatos(doc, datos, x0, y0) {
  const w = PANEL_W;
  let y = y0;

  // Header negro
  doc.setFillColor(17, 17, 17);
  doc.rect(x0, y, w, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('DATOS DEL PROYECTO', x0 + 2, y + 3.5);
  y += 6;

  const campos = [
    ['Proyecto', datos.nombre || 'Sin título'],
    ['Cliente', datos.cliente || '—'],
    ['Ubicación', datos.ubicacion || '—'],
    ['Fecha', datos.fecha],
    ['Escala', datos.escala || '1:100'],
    ['Plano Nº', datos.planoNum || '—'],
    ['Sistema', 'Layher Allround'],
    ['Filas', datos.filasStr || '—'],
    ['Verificado', 'Firma ing. estructural'],
  ];

  campos.forEach(([label, valor], i) => {
    // Fondo alterno
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(x0, y - 2.5, w, 4, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(GRIS);
    doc.text(label, x0 + 1.5, y);
    doc.setTextColor(NEGRO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    // Truncar valores largos
    const maxW = w - 25;
    let txt = valor;
    while (doc.getTextWidth(txt) > maxW && txt.length > 3) txt = txt.slice(0, -1);
    if (txt !== valor) txt += '…';
    doc.text(txt, x0 + 22, y);
    // Línea separadora
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.15);
    doc.line(x0, y + 1.2, x0 + w, y + 1.2);
    y += 4;
  });

  // Borde del cuadro
  doc.setDrawColor(NEGRO);
  doc.setLineWidth(0.4);
  doc.rect(x0, y0, w, y - y0 + 0.5);

  return y + 2;
}

/** Tabla de despiece de materiales. */
function dibujarDespiece(doc, despiece, x0, y0, maxH) {
  const w = PANEL_W;
  let y = y0;

  // Header negro
  doc.setFillColor(17, 17, 17);
  doc.rect(x0, y, w, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('DESPIECE DE MATERIALES', x0 + 2, y + 3.5);
  y += 6;

  // Encabezados columnas
  doc.setFillColor(240, 240, 240);
  doc.rect(x0, y - 2.5, w, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(GRIS);
  doc.text('PIEZA', x0 + 1.5, y);
  doc.text('REF.', x0 + 38, y);
  doc.text('CANT', x0 + 58, y, { align: 'right' });
  doc.text('KG', x0 + w - 1.5, y, { align: 'right' });
  y += 4;

  // Filas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  const bottomLimit = y0 + maxH - 14;

  despiece.lista.forEach((it) => {
    if (y > bottomLimit) return;
    doc.setDrawColor(238, 238, 238);
    doc.setLineWidth(0.1);
    doc.line(x0, y + 1, x0 + w, y + 1);
    doc.setTextColor(NEGRO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text(it.nombre, x0 + 1.5, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(GRIS);
    doc.setFontSize(5);
    doc.text(it.ref || '', x0 + 38, y);
    doc.setTextColor(NEGRO);
    doc.setFontSize(5.5);
    doc.text(String(it.cantidad), x0 + 58, y, { align: 'right' });
    doc.text((it.cantidad * it.peso).toFixed(1), x0 + w - 1.5, y, { align: 'right' });
    y += 3.5;
  });

  // Total
  y += 1;
  doc.setDrawColor(NEGRO);
  doc.setLineWidth(0.4);
  doc.line(x0, y - 1, x0 + w, y - 1);
  doc.setFillColor(245, 245, 245);
  doc.rect(x0, y - 1, w, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(NEGRO);
  doc.text('TOTAL', x0 + 1.5, y + 2.5);
  doc.setFontSize(10);
  doc.setTextColor(ROJO);
  doc.text(`${despiece.pesoTotal.toFixed(1)} kg`, x0 + w - 1.5, y + 3, { align: 'right' });
  doc.setFontSize(5.5);
  doc.setTextColor(GRIS);
  doc.text(`${despiece.cantidadTotal} piezas`, x0 + w - 1.5, y + 5.5, { align: 'right' });

  // Borde del cuadro
  doc.setDrawColor(NEGRO);
  doc.setLineWidth(0.4);
  doc.rect(x0, y0, w, y - y0 + 6);

  return y + 8;
}

/** Footer: sellos legales (izq) + escala (centro) + "Creado con Layout" (der). */
function dibujarFooter(doc, datos, logos, pagina, totalPaginas) {
  const y0 = H - FOOTER_H;

  // Línea roja
  doc.setDrawColor(ROJO);
  doc.setLineWidth(0.4);
  doc.line(M, y0, W - M, y0);

  // Sellos legales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(ROJO);

  const sello1 = '① Plano esquemático preliminar realizado únicamente con fines presupuestarios y comerciales. No utilizar como guía de armado ni documentación técnica definitiva.';
  const sello2 = '② Debe ser verificado y aprobado por un ingeniero estructural matriculado antes de su construcción.';
  doc.text(sello1, M, y0 + 4, { maxWidth: W - M * 2 - 90 });
  doc.text(sello2, M, y0 + 8, { maxWidth: W - M * 2 - 90 });

  // Centro: escala + formato
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(GRIS);
  doc.text(`Escala ${datos.escala || '1:100'} · Formato A3`, W / 2, y0 + 14, { align: 'center' });

  // Derecha: "Creado con MasAlto Layout v2.0" + logo
  const footerRight = W - M;
  if (logos.layout) {
    const lH = 7;
    const lW = lH * (700 / 220);
    doc.addImage(logos.layout, 'PNG', footerRight - lW - 18, y0 + 3, lW, lH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Creado con', footerRight - lW - 20, y0 + 7.5, { align: 'right' });
    doc.text('v2.0', footerRight - 1, y0 + 7.5, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text('Creado con MasAlto Layout v2.0', footerRight, y0 + 7, { align: 'right' });
  }

  // Paginación
  doc.setFontSize(6);
  doc.text(`Pág. ${pagina} / ${totalPaginas}`, footerRight, y0 + 14, { align: 'right' });
}

// ============================================================
// API pública
// ============================================================

/**
 * Genera y descarga un PDF A3 apaisado con el plano actual.
 *
 * @param {Object} opciones
 * @param {string} opciones.nombreDiseno
 * @param {Array} opciones.piezas
 * @param {Array} opciones.filas
 * @param {SVGElement} opciones.svgAlzado
 * @param {SVGElement} [opciones.svgPlanta]
 * @param {Object} [opciones.datosProyecto] — { cliente, ubicacion, planoNum, revision, cuit }
 */
export async function exportarPDF({ nombreDiseno, piezas, filas, svgAlzado, svgPlanta, datosProyecto = {} }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const totalPaginas = svgPlanta ? 2 : 1;

  // Cargar logos
  const logos = await cargarLogos();

  // Datos compartidos
  const filasStr = filas.map(f => `${f.nombre} (Z=${f.z.toFixed(2)}m)`).join(', ');
  const datos = {
    nombre: nombreDiseno || datosProyecto.nombre || 'Sin título',
    cliente: datosProyecto.cliente || '',
    ubicacion: datosProyecto.ubicacion || '',
    fecha,
    filasStr,
    planoNum: datosProyecto.planoNum || '',
    revision: datosProyecto.revision || '01',
    cuit: datosProyecto.cuit || '',
    escala: datosProyecto.escala || '1:100',
    resumen: datosProyecto.resumen || '',
  };

  // === PÁGINA 1: Alzado + Despiece ===
  const contentTop = dibujarHeader(doc, datos, logos);
  const contentBottom = H - FOOTER_H - 2;

  // Panel derecho: datos + despiece
  const panelX = W - M - PANEL_W;
  let panelY = dibujarCuadroDatos(doc, datos, panelX, contentTop + 1);
  const despiece = calcularDespiece(piezas);
  const despieceMaxH = contentBottom - panelY;
  dibujarDespiece(doc, despiece, panelX, panelY, despieceMaxH);

  // Vista alzado (imagen ocupa todo el espacio izquierdo)
  const imgAreaW = panelX - M - 4;
  const imgAreaH = contentBottom - contentTop - 2;

  if (svgAlzado) {
    try {
      const imgData = await rasterizeSVGElement(svgAlzado, 2);
      const svgRect = svgAlzado.getBoundingClientRect();
      const aspect = svgRect.width / svgRect.height;
      let imgW = imgAreaW;
      let imgH = imgW / aspect;
      if (imgH > imgAreaH) { imgH = imgAreaH; imgW = imgH * aspect; }
      // Centrar vertical
      const imgY = contentTop + 1 + (imgAreaH - imgH) / 2;
      doc.addImage(imgData, 'PNG', M, imgY, imgW, imgH);

      // Título vista
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(GRIS);
      doc.text('VISTA DE ALZADO FRONTAL', M, contentTop + 4);
    } catch (err) {
      console.warn('Error rasterizando alzado:', err);
      doc.setFontSize(8);
      doc.setTextColor(GRIS);
      doc.text('(Vista de alzado no disponible)', M + 30, contentTop + 40);
    }
  }

  dibujarFooter(doc, datos, logos, 1, totalPaginas);

  // === PÁGINA 2: Planta (si hay SVG) ===
  if (svgPlanta) {
    doc.addPage('a3', 'landscape');
    const ct2 = dibujarHeader(doc, datos, logos);

    try {
      const imgData = await rasterizeSVGElement(svgPlanta, 2);
      const svgRect = svgPlanta.getBoundingClientRect();
      const aspect = svgRect.width / svgRect.height;
      const fullW = W - M * 2;
      const fullH = contentBottom - ct2 - 2;
      let imgW = fullW;
      let imgH = imgW / aspect;
      if (imgH > fullH) { imgH = fullH; imgW = imgH * aspect; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(GRIS);
      doc.text('VISTA DE PLANTA', M, ct2 + 4);
      const imgY = ct2 + 6;
      doc.addImage(imgData, 'PNG', M, imgY, imgW, imgH);
    } catch (err) {
      console.warn('Error rasterizando planta:', err);
    }

    dibujarFooter(doc, datos, logos, 2, totalPaginas);
  }

  // Descargar
  const filename = (nombreDiseno || 'plano').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '') + '.pdf';
  doc.save(filename);
  return filename;
}
