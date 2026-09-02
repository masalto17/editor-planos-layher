// ═══════════════════════════════════════════════════════════════════
// Editor de Piezas Importables — MásAlto Layout
// Vanilla JS + SVG. Zoom/pan trackpad, undo/redo, snap, colores.
// ═══════════════════════════════════════════════════════════════════

const state = {
  activeView: "alzado",
  activeTool: "select",
  selectedId: null,
  drawingStart: null,
  polyPoints: [],
  views: { alzado: [], planta: [] },
  connections: [],
  // Zoom/pan
  viewBox: { x: -0.5, y: -0.5, w: 4, h: 2 },
  isPanning: false,
  panStart: null,
  // Undo/Redo
  history: [],
  historyIdx: -1,
  // Drawing options
  strokeColor: "#4b5563",
  fillColor: "none",
  snapStep: 0.05,
};

// ─── DOM refs ─────────────────────────────────────────────────────
const els = {
  canvas: document.getElementById("drawingCanvas"),
  shapeLayer: document.getElementById("shapeLayer"),
  connectionLayer: document.getElementById("connectionLayer"),
  previewLayer: document.getElementById("previewLayer"),
  elementList: document.getElementById("elementList"),
  connectionList: document.getElementById("connectionList"),
  jsonOutput: document.getElementById("jsonOutput"),
  validationText: document.getElementById("validationText"),
  statusText: document.getElementById("statusText"),
  coordsText: document.getElementById("coordsText"),
};

const fields = {
  pieceName: document.getElementById("pieceName"),
  pieceId: document.getElementById("pieceId"),
  pieceCategory: document.getElementById("pieceCategory"),
  pieceLength: document.getElementById("pieceLength"),
  pieceHeight: document.getElementById("pieceHeight"),
  pieceDepth: document.getElementById("pieceDepth"),
  pieceWeight: document.getElementById("pieceWeight"),
  pieceReference: document.getElementById("pieceReference"),
  verificationState: document.getElementById("verificationState"),
  placementMode: document.getElementById("placementMode"),
  snapRosette: document.getElementById("snapRosette"),
  orientX: document.getElementById("orientX"),
  orientZ: document.getElementById("orientZ"),
  strokeColor: document.getElementById("strokeColor"),
  fillColor: document.getElementById("fillColor"),
  snapStep: document.getElementById("snapStep"),
};

// ─── Utils ────────────────────────────────────────────────────────
function uid(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function round(value, step) { step = step || state.snapStep; return Math.round(value / step) * step; }
function fmt(value) { return Number(round(value, 0.01)).toFixed(2); }

function getPoint(evt) {
  const pt = els.canvas.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const svgPoint = pt.matrixTransform(els.canvas.getScreenCTM().inverse());
  return { x: round(svgPoint.x), y: round(-svgPoint.y) }; // Y flipped for natural coords
}

function getRawPoint(evt) {
  const pt = els.canvas.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(els.canvas.getScreenCTM().inverse());
}

// ─── Undo/Redo ────────────────────────────────────────────────────
function saveSnapshot() {
  const snap = JSON.stringify({ views: state.views, connections: state.connections });
  // Truncate redo history
  state.history = state.history.slice(0, state.historyIdx + 1);
  state.history.push(snap);
  if (state.history.length > 80) state.history.shift();
  state.historyIdx = state.history.length - 1;
  updateUndoButtons();
}

function undo() {
  if (state.historyIdx <= 0) return;
  state.historyIdx--;
  restoreSnapshot(state.history[state.historyIdx]);
}

function redo() {
  if (state.historyIdx >= state.history.length - 1) return;
  state.historyIdx++;
  restoreSnapshot(state.history[state.historyIdx]);
}

function restoreSnapshot(snap) {
  const data = JSON.parse(snap);
  state.views = data.views;
  state.connections = data.connections;
  state.selectedId = null;
  render();
  updateUndoButtons();
}

function updateUndoButtons() {
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  if (undoBtn) undoBtn.disabled = state.historyIdx <= 0;
  if (redoBtn) redoBtn.disabled = state.historyIdx >= state.history.length - 1;
}

// ─── ViewBox (zoom/pan) ───────────────────────────────────────────
function updateViewBox() {
  const vb = state.viewBox;
  els.canvas.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
}

function zoomAt(cx, cy, factor) {
  const vb = state.viewBox;
  const newW = vb.w * factor;
  const newH = vb.h * factor;
  // Keep point under cursor stationary
  vb.x = cx - (cx - vb.x) * factor;
  vb.y = cy - (cy - vb.y) * factor;
  vb.w = Math.max(0.2, Math.min(40, newW));
  vb.h = Math.max(0.1, Math.min(20, newH));
  updateViewBox();
}

function fitToContent() {
  const shapes = [...state.views.alzado, ...state.views.planta];
  if (!shapes.length && !state.connections.length) {
    state.viewBox = { x: -0.5, y: -0.5, w: 4, h: 2 };
    updateViewBox();
    return;
  }
  const bounds = getBounds(currentShapes());
  const pad = 0.3;
  const w = Math.max(1, bounds.maxX - bounds.minX + pad * 2);
  const h = Math.max(0.5, bounds.maxY - bounds.minY + pad * 2);
  state.viewBox = { x: bounds.minX - pad, y: -(bounds.maxY + pad), w, h };
  updateViewBox();
}

// ─── Tools ────────────────────────────────────────────────────────
function setTool(tool) {
  state.activeTool = tool;
  state.drawingStart = null;
  state.polyPoints = [];
  document.querySelectorAll("[data-tool]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tool === tool);
  });
  els.previewLayer.replaceChildren();
  const hints = {
    select: "Click elemento para seleccionar. Del para borrar.",
    linea: "Click origen, click destino.",
    rectangulo: "Click esquina, click esquina opuesta.",
    circulo: "Click centro, click borde (radio).",
    polilinea: "Click para agregar puntos. Doble click cierra.",
    connection: "Click para colocar punto de conexión.",
  };
  els.statusText.textContent = hints[tool] || "Selecciona herramienta.";
}

function setView(view) {
  state.activeView = view;
  state.selectedId = null;
  state.drawingStart = null;
  state.polyPoints = [];
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });
  render();
}

function currentShapes() { return state.views[state.activeView]; }

// ─── SVG helpers ──────────────────────────────────────────────────
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function renderShape(shape, selected = false) {
  const common = {
    "data-id": shape.id,
    class: `shape${selected ? " is-selected" : ""}`,
    stroke: shape.stroke || state.strokeColor,
    "stroke-width": shape.strokeWidth || 0.035,
    fill: shape.fill || "none",
  };
  if (shape.dash) common["stroke-dasharray"] = shape.dash.join(" ");

  if (shape.tipo === "linea") {
    return svgEl("line", { ...common, x1: shape.desde.x, y1: -shape.desde.y, x2: shape.hasta.x, y2: -shape.hasta.y });
  }
  if (shape.tipo === "rectangulo") {
    return svgEl("rect", { ...common, x: shape.x, y: -(shape.y + shape.alto), width: shape.ancho, height: shape.alto,
      fill: shape.fill || "rgba(75,85,99,0.12)" });
  }
  if (shape.tipo === "circulo") {
    return svgEl("circle", { ...common, cx: shape.x, cy: -shape.y, r: shape.radio, fill: shape.fill || "rgba(75,85,99,0.12)" });
  }
  if (shape.tipo === "polilinea") {
    return svgEl("polyline", { ...common, points: shape.puntos.map((p) => `${p.x},${-p.y}`).join(" ") });
  }
  return null;
}

// ─── Render ───────────────────────────────────────────────────────
function renderConnections() {
  els.connectionLayer.replaceChildren();
  state.connections.forEach((point) => {
    const y = state.activeView === "planta" ? point.posicion.z : point.posicion.y;
    const marker = svgEl("g", { class: "connection", "data-id": point.id });
    marker.append(
      svgEl("circle", { cx: point.posicion.x, cy: -y, r: 0.045, fill: "#ffffff", stroke: "#e30613", "stroke-width": 0.018 }),
      svgEl("line", { x1: point.posicion.x - 0.07, y1: -y, x2: point.posicion.x + 0.07, y2: -y, stroke: "#e30613", "stroke-width": 0.012 }),
      svgEl("line", { x1: point.posicion.x, y1: -y - 0.07, x2: point.posicion.x, y2: -y + 0.07, stroke: "#e30613", "stroke-width": 0.012 })
    );
    els.connectionLayer.append(marker);
  });
}

function render() {
  els.shapeLayer.replaceChildren();
  currentShapes().forEach((shape) => {
    const node = renderShape(shape, shape.id === state.selectedId);
    if (!node) return;
    node.addEventListener("click", (evt) => { evt.stopPropagation(); state.selectedId = shape.id; render(); });
    els.shapeLayer.append(node);
  });
  renderConnections();
  renderLists();
}

function renderLists() {
  els.elementList.replaceChildren();
  const shapes = currentShapes();
  if (!shapes.length) {
    els.elementList.append(emptyRow("Sin elementos en esta vista"));
  } else {
    shapes.forEach((shape, index) => {
      const row = document.createElement("div");
      row.className = `row${shape.id === state.selectedId ? " selected" : ""}`;
      const colorDot = shape.stroke && shape.stroke !== "none"
        ? `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${shape.stroke};margin-right:4px;vertical-align:middle;"></span>`
        : "";
      row.innerHTML = `<div>${colorDot}<strong>${index + 1}. ${shape.tipo}</strong><span>${shapeSummary(shape)}</span></div>`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.title = "Eliminar";
      remove.addEventListener("click", () => {
        state.views[state.activeView] = shapes.filter((item) => item.id !== shape.id);
        if (state.selectedId === shape.id) state.selectedId = null;
        saveSnapshot();
        render();
      });
      row.append(remove);
      row.addEventListener("click", () => { state.selectedId = shape.id; render(); });
      els.elementList.append(row);
    });
  }

  els.connectionList.replaceChildren();
  if (!state.connections.length) {
    els.connectionList.append(emptyRow("Sin puntos definidos"));
  } else {
    state.connections.forEach((point) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div><strong>${point.id}</strong><span>x ${fmt(point.posicion.x)} / y ${fmt(point.posicion.y)} / z ${fmt(point.posicion.z)} · ${point.tipo}</span></div>`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        state.connections = state.connections.filter((item) => item.id !== point.id);
        saveSnapshot();
        render();
      });
      row.append(remove);
      els.connectionList.append(row);
    });
  }
}

function emptyRow(text) {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `<div><strong>${text}</strong><span>Dibuja o carga un ejemplo.</span></div>`;
  return row;
}

function shapeSummary(shape) {
  if (shape.tipo === "linea") return `${fmt(shape.desde.x)},${fmt(shape.desde.y)} → ${fmt(shape.hasta.x)},${fmt(shape.hasta.y)}`;
  if (shape.tipo === "rectangulo") return `${fmt(shape.ancho)} × ${fmt(shape.alto)} m`;
  if (shape.tipo === "circulo") return `radio ${fmt(shape.radio)} m`;
  if (shape.tipo === "polilinea") return `${shape.puntos.length} puntos`;
  return "";
}

// ─── Drawing ──────────────────────────────────────────────────────
function addShapeFromDrag(start, end) {
  const base = { id: uid("shape"), stroke: state.strokeColor, strokeWidth: 0.035, fill: state.fillColor };

  if (state.activeTool === "linea") {
    currentShapes().push({ ...base, tipo: "linea", desde: start, hasta: end });
  }
  if (state.activeTool === "rectangulo") {
    currentShapes().push({ ...base, tipo: "rectangulo",
      x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
      ancho: round(Math.abs(end.x - start.x), 0.01), alto: round(Math.abs(end.y - start.y), 0.01),
      fill: state.fillColor === "none" ? "rgba(75,85,99,0.12)" : state.fillColor });
  }
  if (state.activeTool === "circulo") {
    currentShapes().push({ ...base, tipo: "circulo",
      x: start.x, y: start.y, radio: round(Math.hypot(end.x - start.x, end.y - start.y), 0.01),
      fill: state.fillColor === "none" ? "rgba(75,85,99,0.12)" : state.fillColor });
  }
  saveSnapshot();
}

function renderPreview(start, end) {
  els.previewLayer.replaceChildren();
  if (!start || !end) return;
  const temp = [];
  if (state.activeTool === "linea") temp.push({ tipo: "linea", desde: start, hasta: end });
  if (state.activeTool === "rectangulo") temp.push({ tipo: "rectangulo", x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), ancho: Math.abs(end.x - start.x), alto: Math.abs(end.y - start.y) });
  if (state.activeTool === "circulo") temp.push({ tipo: "circulo", x: start.x, y: start.y, radio: round(Math.hypot(end.x - start.x, end.y - start.y), 0.01) });
  temp.forEach((shape) => {
    const node = renderShape({ ...shape, id: "preview", stroke: "#e30613", strokeWidth: 0.025, fill: "rgba(227,6,19,0.08)" });
    if (node) els.previewLayer.append(node);
  });
}

function addConnection(point) {
  const y = state.activeView === "planta" ? 0 : point.y;
  const z = state.activeView === "planta" ? point.y : 0;
  const connType = document.getElementById("connectionType")?.value || "extremo";
  state.connections.push({ id: uid("conexion"), posicion: { x: point.x, y, z }, tipo: connType });
  saveSnapshot();
  render();
}

// ─── Bounds & Export ──────────────────────────────────────────────
function getBounds(shapes) {
  const xs = [], ys = [];
  shapes.forEach((shape) => {
    if (shape.tipo === "linea") { xs.push(shape.desde.x, shape.hasta.x); ys.push(shape.desde.y, shape.hasta.y); }
    if (shape.tipo === "rectangulo") { xs.push(shape.x, shape.x + shape.ancho); ys.push(shape.y, shape.y + shape.alto); }
    if (shape.tipo === "circulo") { xs.push(shape.x - shape.radio, shape.x + shape.radio); ys.push(shape.y - shape.radio, shape.y + shape.radio); }
    if (shape.tipo === "polilinea") shape.puntos.forEach((p) => { xs.push(p.x); ys.push(p.y); });
  });
  if (!xs.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX: round(Math.min(...xs), 0.01), minY: round(Math.min(...ys), 0.01), maxX: round(Math.max(...xs), 0.01), maxY: round(Math.max(...ys), 0.01) };
}

function cleanShape(shape) {
  const { id, ...rest } = shape;
  return rest;
}

function buildPieceJson() {
  const orientacionesPermitidas = [];
  if (fields.orientX.checked) orientacionesPermitidas.push("x");
  if (fields.orientZ.checked) orientacionesPermitidas.push("z");
  return {
    schemaVersion: "1.0",
    id: fields.pieceId.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "_"),
    nombre: fields.pieceName.value.trim(),
    categoria: fields.pieceCategory.value,
    origen: {
      tipo: fields.verificationState.value === "verificadaCatalogo" ? "catalogoFabricante" : "piezaPropia",
      referencia: fields.pieceReference.value.trim(),
      estadoVerificacion: fields.verificationState.value,
      notas: "Exportado desde el editor manual de piezas."
    },
    dimensiones: { largo: Number(fields.pieceLength.value), alto: Number(fields.pieceHeight.value), profundidad: Number(fields.pieceDepth.value) },
    despiece: { pesoKg: Number(fields.pieceWeight.value), unidad: "pieza" },
    colocacion: {
      modo: fields.placementMode.value,
      orientacionesPermitidas,
      snap: { requiereRoseta: fields.snapRosette.checked, pasoX: 0.01, pasoY: 0.5, pasoZ: 0.01 },
      puntosConexion: state.connections
    },
    vistas: {
      alzado: { bounds: getBounds(state.views.alzado), elementos: state.views.alzado.map(cleanShape) },
      planta: { bounds: getBounds(state.views.planta), elementos: state.views.planta.map(cleanShape) }
    },
    advertencias: [
      "Plano esquematico preliminar realizado unicamente con fines presupuestarios y comerciales.",
      "Debe ser verificado y aprobado por un ingeniero estructural matriculado antes de su construccion."
    ]
  };
}

function validatePiece(piece) {
  const errors = [];
  if (!piece.nombre || piece.nombre.length < 3) errors.push("falta nombre");
  if (!/^[A-Z0-9_-]{3,40}$/.test(piece.id)) errors.push("ID inválido");
  if (!piece.vistas.alzado.elementos.length) errors.push("falta dibujo de alzado");
  if (!piece.vistas.planta.elementos.length) errors.push("falta dibujo de planta");
  if (!piece.colocacion.puntosConexion.length) errors.push("falta punto de conexión");
  if (!piece.colocacion.orientacionesPermitidas.length) errors.push("falta orientación");
  if (Number.isNaN(piece.dimensiones.largo) || piece.dimensiones.largo <= 0) errors.push("largo inválido");
  if (Number.isNaN(piece.despiece.pesoKg) || piece.despiece.pesoKg < 0) errors.push("peso inválido");
  return errors;
}

function exportJson() {
  const piece = buildPieceJson();
  const errors = validatePiece(piece);
  const json = JSON.stringify(piece, null, 2);
  els.jsonOutput.value = json;
  els.validationText.textContent = errors.length
    ? `⚠ Revisar: ${errors.join(", ")}.`
    : "✓ JSON válido. Guardar como .masalto-pieza.json e importar en MasAlto Layout.";
  els.validationText.className = `validation ${errors.length ? "warn" : "ok"}`;
}

function saveAsFile() {
  const piece = buildPieceJson();
  const json = JSON.stringify(piece, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const name = `${piece.id || "pieza"}.masalto-pieza.json`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadFromFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,.masalto-pieza.json";
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        if (json.schemaVersion === "1.0" && json.vistas) {
          // Load piece data
          state.views.alzado = (json.vistas.alzado?.elementos || []).map(el => ({ id: uid("shape"), ...el }));
          state.views.planta = (json.vistas.planta?.elementos || []).map(el => ({ id: uid("shape"), ...el }));
          state.connections = json.colocacion?.puntosConexion || [];
          // Fill form fields
          if (json.nombre) fields.pieceName.value = json.nombre;
          if (json.id) fields.pieceId.value = json.id;
          if (json.categoria) fields.pieceCategory.value = json.categoria;
          if (json.dimensiones) {
            fields.pieceLength.value = json.dimensiones.largo || 0;
            fields.pieceHeight.value = json.dimensiones.alto || 0;
            fields.pieceDepth.value = json.dimensiones.profundidad || 0;
          }
          if (json.despiece) fields.pieceWeight.value = json.despiece.pesoKg || 0;
          if (json.origen?.referencia) fields.pieceReference.value = json.origen.referencia;
          if (json.origen?.estadoVerificacion) fields.verificationState.value = json.origen.estadoVerificacion;
          if (json.colocacion?.modo) fields.placementMode.value = json.colocacion.modo;
          saveSnapshot();
          render();
          fitToContent();
          els.statusText.textContent = `Cargado: ${json.nombre}`;
        } else {
          alert("Formato no reconocido. Debe ser un archivo .masalto-pieza.json con schemaVersion 1.0.");
        }
      } catch (e) {
        alert("Error leyendo archivo: " + e.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function loadExample() {
  state.views.alzado = [
    { id: uid("shape"), tipo: "linea", desde: { x: 0, y: 0 }, hasta: { x: 2.57, y: 0 }, stroke: "#4b5563", strokeWidth: 0.04, fill: "none" },
    { id: uid("shape"), tipo: "linea", desde: { x: 0, y: 0.5 }, hasta: { x: 2.57, y: 0.5 }, stroke: "#4b5563", strokeWidth: 0.04, fill: "none" },
    { id: uid("shape"), tipo: "linea", desde: { x: 0, y: 0 }, hasta: { x: 0, y: 0.5 }, stroke: "#4b5563", strokeWidth: 0.03, fill: "none" },
    { id: uid("shape"), tipo: "linea", desde: { x: 2.57, y: 0 }, hasta: { x: 2.57, y: 0.5 }, stroke: "#4b5563", strokeWidth: 0.03, fill: "none" },
    { id: uid("shape"), tipo: "polilinea", puntos: [{ x: 0, y: 0 }, { x: 0.64, y: 0.5 }, { x: 1.28, y: 0 }, { x: 1.93, y: 0.5 }, { x: 2.57, y: 0 }], stroke: "#4b5563", strokeWidth: 0.025, fill: "none" },
    { id: uid("shape"), tipo: "polilinea", puntos: [{ x: 0, y: 0.5 }, { x: 0.64, y: 0 }, { x: 1.28, y: 0.5 }, { x: 1.93, y: 0 }, { x: 2.57, y: 0.5 }], stroke: "#4b5563", strokeWidth: 0.025, fill: "none" }
  ];
  state.views.planta = [
    { id: uid("shape"), tipo: "linea", desde: { x: 0, y: 0 }, hasta: { x: 2.57, y: 0 }, stroke: "#4b5563", strokeWidth: 0.05, fill: "none" },
    { id: uid("shape"), tipo: "circulo", x: 0, y: 0, radio: 0.045, stroke: "#111111", strokeWidth: 0.01, fill: "#ffffff" },
    { id: uid("shape"), tipo: "circulo", x: 2.57, y: 0, radio: 0.045, stroke: "#111111", strokeWidth: 0.01, fill: "#ffffff" }
  ];
  state.connections = [
    { id: "extremo_izquierdo", posicion: { x: 0, y: 0, z: 0 }, tipo: "extremo" },
    { id: "extremo_derecho", posicion: { x: 2.57, y: 0, z: 0 }, tipo: "extremo" }
  ];
  fields.pieceName.value = "Celosía U 2.57m";
  fields.pieceId.value = "EXT_CEL_U_257";
  fields.pieceCategory.value = "celosia";
  fields.pieceReference.value = "2.656.257";
  fields.pieceWeight.value = "29.5";
  fields.pieceLength.value = "2.57";
  fields.pieceHeight.value = "0.50";
  saveSnapshot();
  render();
  fitToContent();
  exportJson();
}

function clearView() {
  state.views[state.activeView] = [];
  state.selectedId = null;
  saveSnapshot();
  render();
}

function deleteSelected() {
  if (!state.selectedId) return;
  state.views[state.activeView] = currentShapes().filter(s => s.id !== state.selectedId);
  state.selectedId = null;
  saveSnapshot();
  render();
}

// ─── Event binding ────────────────────────────────────────────────
document.querySelectorAll("[data-tool]").forEach((btn) => {
  btn.addEventListener("click", () => setTool(btn.dataset.tool));
});
document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.getElementById("exportJson").addEventListener("click", exportJson);
document.getElementById("saveFile")?.addEventListener("click", saveAsFile);
document.getElementById("loadFile")?.addEventListener("click", loadFromFile);
document.getElementById("loadExample").addEventListener("click", loadExample);
document.getElementById("clearView").addEventListener("click", clearView);
document.getElementById("addConnection").addEventListener("click", () => setTool("connection"));
document.getElementById("undoBtn")?.addEventListener("click", undo);
document.getElementById("redoBtn")?.addEventListener("click", redo);
document.getElementById("fitBtn")?.addEventListener("click", fitToContent);

// Color pickers
if (fields.strokeColor) fields.strokeColor.addEventListener("input", (e) => { state.strokeColor = e.target.value; });
if (fields.fillColor) fields.fillColor.addEventListener("change", (e) => { state.fillColor = e.target.value; });
if (fields.snapStep) fields.snapStep.addEventListener("change", (e) => { state.snapStep = parseFloat(e.target.value) || 0.05; });

// ─── Canvas events ────────────────────────────────────────────────
els.canvas.addEventListener("pointermove", (evt) => {
  if (state.isPanning && state.panStart) {
    const raw = getRawPoint(evt);
    const dx = raw.x - state.panStart.x;
    const dy = raw.y - state.panStart.y;
    state.viewBox.x -= dx;
    state.viewBox.y -= dy;
    updateViewBox();
    return;
  }
  const point = getPoint(evt);
  els.coordsText.textContent = `x ${fmt(point.x)} / ${state.activeView === "planta" ? "z" : "y"} ${fmt(point.y)}`;
  if (state.drawingStart) renderPreview(state.drawingStart, point);
});

els.canvas.addEventListener("pointerdown", (evt) => {
  // Middle button or Space+click = pan
  if (evt.button === 1 || (evt.button === 0 && evt.altKey)) {
    state.isPanning = true;
    state.panStart = getRawPoint(evt);
    els.canvas.setPointerCapture(evt.pointerId);
    evt.preventDefault();
    return;
  }
});

els.canvas.addEventListener("pointerup", (evt) => {
  if (state.isPanning) {
    state.isPanning = false;
    state.panStart = null;
    return;
  }
});

els.canvas.addEventListener("click", (evt) => {
  if (state.isPanning) return;
  const point = getPoint(evt);

  if (state.activeTool === "select") { state.selectedId = null; render(); return; }
  if (state.activeTool === "connection") { addConnection(point); return; }
  if (state.activeTool === "polilinea") {
    state.polyPoints.push(point);
    els.previewLayer.replaceChildren();
    if (state.polyPoints.length > 1) {
      const node = renderShape({ id: "preview", tipo: "polilinea", puntos: state.polyPoints, stroke: "#e30613", strokeWidth: 0.025, fill: "none" });
      if (node) els.previewLayer.append(node);
    }
    return;
  }
  if (!state.drawingStart) { state.drawingStart = point; return; }
  addShapeFromDrag(state.drawingStart, point);
  state.drawingStart = null;
  els.previewLayer.replaceChildren();
  render();
});

els.canvas.addEventListener("dblclick", () => {
  if (state.activeTool !== "polilinea" || state.polyPoints.length < 2) return;
  currentShapes().push({ id: uid("shape"), tipo: "polilinea", puntos: [...state.polyPoints], stroke: state.strokeColor, strokeWidth: 0.03, fill: "none" });
  state.polyPoints = [];
  els.previewLayer.replaceChildren();
  saveSnapshot();
  render();
});

// Zoom with wheel/pinch
els.canvas.addEventListener("wheel", (evt) => {
  evt.preventDefault();
  const raw = getRawPoint(evt);
  // Pinch-zoom (ctrlKey from trackpad) or scroll zoom
  const factor = evt.ctrlKey
    ? (1 + evt.deltaY * 0.01)
    : (evt.deltaY > 0 ? 1.08 : 0.93);
  zoomAt(raw.x, raw.y, Math.max(0.5, Math.min(2, factor)));
}, { passive: false });

// Keyboard shortcuts
document.addEventListener("keydown", (evt) => {
  if (evt.target.tagName === "INPUT" || evt.target.tagName === "TEXTAREA" || evt.target.tagName === "SELECT") return;
  if ((evt.metaKey || evt.ctrlKey) && evt.key === "z" && !evt.shiftKey) { evt.preventDefault(); undo(); }
  if ((evt.metaKey || evt.ctrlKey) && (evt.key === "y" || (evt.key === "z" && evt.shiftKey))) { evt.preventDefault(); redo(); }
  if (evt.key === "Delete" || evt.key === "Backspace") { evt.preventDefault(); deleteSelected(); }
  if (evt.key === "Escape") { setTool("select"); }
  if (evt.key === "v" || evt.key === "V") setTool("select");
  if (evt.key === "l" || evt.key === "L") setTool("linea");
  if (evt.key === "r" || evt.key === "R") setTool("rectangulo");
  if (evt.key === "c" || evt.key === "C" && !evt.metaKey) setTool("circulo");
  if (evt.key === "p" || evt.key === "P") setTool("polilinea");
  if (evt.key === "x" || evt.key === "X") setTool("connection");
});

// ─── Init ─────────────────────────────────────────────────────────
updateViewBox();
saveSnapshot();
render();

const params = new URLSearchParams(window.location.search);
if (params.get("example") === "1") loadExample();
if (params.get("export") === "1") exportJson();
