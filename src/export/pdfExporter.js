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

// --- Corte transversal ---

/** Calcula piezas visibles en un corte a posición X. */
function calcularResumenCorte(piezas, posX) {
  const tol = 0.05;
  let verts = 0, horizX = 0, horizZ = 0, plats = 0, bases = 0, diags = 0, collarines = 0;
  piezas.forEach(p => {
    const z = p.z ?? 0;
    const matchX = Math.abs(p.x - posX) <= tol;
    const inRangeX = posX >= p.x - tol && posX <= p.x + (p.largo || 0) + tol;
    if (p.categoria === 'vertical' && matchX) verts++;
    else if (p.categoria === 'base' && p.tipoId !== 'CO' && matchX) bases++;
    else if (p.tipoId === 'CO' && matchX) collarines++;
    else if (p.categoria === 'plataforma' && inRangeX) plats++;
    else if (p.categoria === 'diagonal') diags++;
    else if (['horizontalO', 'vigaPuente', 'horizontalU', 'barandilla', 'rodapie'].includes(p.categoria)) {
      if (p.orientacion === 'z' && matchX) horizZ++;
      else if (inRangeX) horizX++;
    }
  });
  return { verts, horizX, horizZ, plats, bases, diags, collarines,
    total: verts + horizX + horizZ + plats + bases + diags + collarines };
}

/** Resumen de piezas del corte en panel derecho del PDF. */
function dibujarResumenCorte(doc, resumen, x0, y0, maxH) {
  const w = PANEL_W;
  let y = y0;

  // Header negro
  doc.setFillColor(17, 17, 17);
  doc.rect(x0, y, w, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('RESUMEN DEL CORTE', x0 + 2, y + 3.5);
  y += 6;

  const items = [
    ['Verticales', resumen.verts],
    ['Horizontales ∥ corte', resumen.horizZ],
    ['Horizontales ⊥ corte', resumen.horizX],
    ['Plataformas', resumen.plats],
    ['Bases/Husillos', resumen.bases],
    ['Collarines', resumen.collarines],
    ['Diagonales', resumen.diags],
  ].filter(([, v]) => v > 0);

  items.forEach(([label, valor], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(x0, y - 2.5, w, 4, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(GRIS);
    doc.text(label, x0 + 1.5, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NEGRO);
    doc.text(String(valor), x0 + w - 2, y, { align: 'right' });
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.15);
    doc.line(x0, y + 1.2, x0 + w, y + 1.2);
    y += 4;
  });

  // Total
  y += 1;
  doc.setDrawColor(NEGRO);
  doc.setLineWidth(0.4);
  doc.line(x0, y - 1, x0 + w, y - 1);
  doc.setFillColor(245, 245, 245);
  doc.rect(x0, y - 1, w, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(NEGRO);
  doc.text('TOTAL', x0 + 1.5, y + 2);
  doc.setTextColor(ROJO);
  doc.text(`${resumen.total} piezas`, x0 + w - 2, y + 2, { align: 'right' });

  // Borde
  doc.setDrawColor(NEGRO);
  doc.setLineWidth(0.4);
  doc.rect(x0, y0, w, y - y0 + 5);

  // Leyenda
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(GRIS);
  doc.text('LEYENDA', x0 + 1.5, y);
  y += 4;

  const syms = [
    ['●', 'Vertical (sección circular)'],
    ['○', 'Horizontal ⊥ corte'],
    ['—', 'Horizontal ∥ corte'],
    ['▨', 'Plataforma'],
    ['▬', 'Base / husillo'],
  ];
  syms.forEach(([sym, desc]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(NEGRO);
    doc.text(sym, x0 + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(GRIS);
    doc.text(desc, x0 + 7, y);
    y += 3.5;
  });

  return y;
}

/** Dibuja vista de corte transversal directamente en el PDF. */
function dibujarCorteEnPDF(doc, piezas, filas, posX, x0, y0, areaW, areaH) {
  const tol = 0.05;

  // Recopilar datos del corte
  const verts = [], horizX = [], horizZ = [], plats = [], basesPieza = [];
  piezas.forEach(p => {
    const z = p.z ?? 0;
    const matchX = Math.abs(p.x - posX) <= tol;
    const inRangeX = posX >= p.x - tol && posX <= p.x + (p.largo || 0) + tol;

    if (p.categoria === 'vertical' && matchX) {
      verts.push({ z, yBase: p.y, yTop: p.y + (p.largo || 0) });
    } else if (p.categoria === 'base' && matchX) {
      basesPieza.push({ z, y: p.y, largo: p.largo || 0, tipoId: p.tipoId });
    } else if (p.categoria === 'plataforma' && inRangeX) {
      plats.push({ z, y: p.y, largo: p.largo || 0, anchoPlat: p.anchoPlat || 0.32 });
    } else if (['horizontalO', 'vigaPuente', 'horizontalU', 'barandilla', 'rodapie'].includes(p.categoria)) {
      if (p.orientacion === 'z' && matchX) {
        horizZ.push({ z, y: p.y, largo: p.largo || 0, cat: p.categoria });
      } else if (inRangeX) {
        horizX.push({ z, y: p.y, cat: p.categoria });
      }
    }
  });

  // Calcular rangos
  const allZ = [], allY = [];
  verts.forEach(v => { allZ.push(v.z); allY.push(v.yBase, v.yTop); });
  horizX.forEach(h => { allZ.push(h.z); allY.push(h.y); });
  horizZ.forEach(h => { allZ.push(h.z, h.z + h.largo); allY.push(h.y); });
  plats.forEach(p => { allZ.push(p.z); allY.push(p.y); });
  basesPieza.forEach(b => { allZ.push(b.z); allY.push(b.y, b.y + b.largo); });
  filas.forEach(f => allZ.push(f.z));

  if (allZ.length === 0 || allY.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(GRIS);
    doc.text('No hay piezas visibles en esta posición de corte.', x0 + areaW / 2, y0 + areaH / 2, { align: 'center' });
    return;
  }

  const zMin = Math.min(...allZ) - 0.5;
  const zMax = Math.max(...allZ) + 0.5;
  const yMin = Math.min(...allY) - 0.5;
  const yMax = Math.max(...allY) + 0.5;

  const padX = 20, padY = 15;
  const drawW = areaW - padX * 2;
  const drawH = areaH - padY * 2;

  // Escala: Z → horizontal, Y → vertical (Y invertido en PDF)
  const scaleZ = drawW / Math.max(0.1, zMax - zMin);
  const scaleY = drawH / Math.max(0.1, yMax - yMin);
  const scale = Math.min(scaleZ, scaleY);

  const toX = (z) => x0 + padX + (z - zMin) * scale;
  const toY = (y) => y0 + padY + drawH - (y - yMin) * scale; // invertir Y

  // Fondo suave
  doc.setFillColor(250, 250, 252);
  doc.rect(x0, y0, areaW, areaH, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.rect(x0, y0, areaW, areaH);

  // Línea de suelo (Y=0)
  const sueloY = toY(0);
  if (sueloY >= y0 && sueloY <= y0 + areaH) {
    doc.setDrawColor(139, 115, 85);
    doc.setLineWidth(0.5);
    doc.line(x0, sueloY, x0 + areaW, sueloY);
    doc.setFontSize(5);
    doc.setTextColor(139, 115, 85);
    doc.text('±0.00', x0 + 2, sueloY - 1);
  }

  // Ejes de filas
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.15);
  filas.forEach(f => {
    const fx = toX(f.z);
    doc.line(fx, y0, fx, y0 + areaH);
    // Círculo con nombre de fila
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.circle(fx, y0 + areaH + 5, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(NEGRO);
    doc.text(f.nombre, fx, y0 + areaH + 6.5, { align: 'center' });
  });

  // Dibujar bases/husillos
  basesPieza.forEach(b => {
    const bx = toX(b.z);
    if (b.tipoId === 'CO') {
      // Collarín
      const cw = 3, ch = 1.2;
      doc.setFillColor(139, 90, 43);
      doc.rect(bx - cw / 2, toY(b.y) - ch / 2, cw, ch, 'F');
    } else {
      // Husillo
      const by1 = toY(b.y);
      const by2 = toY(b.y + b.largo);
      doc.setDrawColor(139, 90, 43);
      doc.setLineWidth(0.6);
      doc.line(bx, by1, bx, by2);
      // Placa base
      const pw = 4;
      doc.setFillColor(139, 90, 43);
      doc.rect(bx - pw / 2, by1 - 0.5, pw, 1, 'F');
    }
  });

  // Dibujar verticales
  verts.forEach(v => {
    const vx = toX(v.z);
    const vy1 = toY(v.yBase);
    const vy2 = toY(v.yTop);
    doc.setDrawColor(44, 82, 130);
    doc.setLineWidth(0.8);
    doc.line(vx, vy1, vx, vy2);
    // Sección circular (marca)
    doc.setFillColor(44, 82, 130);
    doc.circle(vx, (vy1 + vy2) / 2, 1.2, 'F');
  });

  // Dibujar horizontales paralelas al corte (Z)
  horizZ.forEach(h => {
    const hx1 = toX(h.z);
    const hx2 = toX(h.z + h.largo);
    const hy = toY(h.y);
    const c = h.cat === 'vigaPuente' ? [180, 130, 30] : h.cat === 'barandilla' ? [100, 180, 220] : [50, 150, 70];
    doc.setDrawColor(...c);
    doc.setLineWidth(h.cat === 'vigaPuente' ? 1 : 0.6);
    if (h.cat === 'barandilla') {
      doc.setLineDashPattern([1.5, 1], 0);
    }
    doc.line(hx1, hy, hx2, hy);
    doc.setLineDashPattern([], 0);
  });

  // Dibujar horizontales perpendiculares al corte (X)
  horizX.forEach(h => {
    const hx = toX(h.z);
    const hy = toY(h.y);
    const r = h.cat === 'vigaPuente' ? 1.5 : 1;
    const c = h.cat === 'vigaPuente' ? [180, 130, 30] : h.cat === 'barandilla' ? [100, 180, 220] : [50, 150, 70];
    doc.setDrawColor(...c);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.circle(hx, hy, r, 'FD');
  });

  // Dibujar plataformas
  plats.forEach(p => {
    const px = toX(p.z);
    const py = toY(p.y);
    const pw = Math.max(2, p.anchoPlat * scale);
    const ph = 1.2;
    doc.setFillColor(128, 0, 32);
    doc.setDrawColor(100, 0, 25);
    doc.setLineWidth(0.2);
    doc.rect(px, py - ph, pw, ph, 'FD');
    // Marca de achurado
    for (let lx = px + 1; lx < px + pw; lx += 1.5) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(lx, py - ph, lx, py);
    }
  });

  // Cotas de altura (izquierda)
  const alturas = [0, ...new Set(verts.map(v => v.yTop))].sort((a, b) => a - b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  alturas.forEach(alt => {
    const ay = toY(alt);
    if (ay >= y0 && ay <= y0 + areaH) {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.1);
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(x0 + 1, ay, x0 + padX - 2, ay);
      doc.setLineDashPattern([], 0);
      doc.setTextColor(GRIS);
      doc.text(`${alt.toFixed(2)}m`, x0 + 1, ay - 1);
    }
  });
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
  const incluyeCorte = datosProyecto.incluirCorte && datosProyecto.corteX != null;
  const totalPaginas = 1 + (svgPlanta ? 1 : 0) + (incluyeCorte ? 1 : 0);

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

  let paginaActual = 1;
  dibujarFooter(doc, datos, logos, paginaActual, totalPaginas);

  // === PÁGINA 2: Planta (si hay SVG) ===
  if (svgPlanta) {
    paginaActual++;
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

    dibujarFooter(doc, datos, logos, paginaActual, totalPaginas);
  }

  // === PÁGINA CORTE TRANSVERSAL (si se pidió) ===
  if (incluyeCorte) {
    paginaActual++;
    doc.addPage('a3', 'landscape');
    const ctC = dibujarHeader(doc, datos, logos);
    const corteBottom = H - FOOTER_H - 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(GRIS);
    doc.text(`VISTA DE CORTE TRANSVERSAL — X = ${datosProyecto.corteX.toFixed(2)}m`, M, ctC + 4);

    // Dibujar corte transversal directamente con jsPDF
    dibujarCorteEnPDF(doc, piezas, filas, datosProyecto.corteX, M, ctC + 8, W - M * 2 - PANEL_W - 4, corteBottom - ctC - 10);

    // Panel derecho: resumen de corte
    const corteResumen = calcularResumenCorte(piezas, datosProyecto.corteX);
    dibujarResumenCorte(doc, corteResumen, W - M - PANEL_W, ctC + 1, corteBottom - ctC - 3);

    dibujarFooter(doc, datos, logos, paginaActual, totalPaginas);
  }

  // Descargar
  const filename = (nombreDiseno || 'plano').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '') + '.pdf';
  doc.save(filename);
  return filename;
}
