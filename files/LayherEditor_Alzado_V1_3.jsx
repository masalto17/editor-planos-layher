import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Save, FolderOpen, Trash2, ZoomIn, ZoomOut, Grid3x3, Undo2, Redo2, Info, X, MousePointer2, Slash, Copy, ClipboardPaste, CopyPlus, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';

// ============================================================
// CATÁLOGO REAL LAYHER ALLROUND — V1.3
// Pesos y medidas del catálogo F4-2018-SP
// ============================================================

const CATALOGO = {
  verticales: [
    { id: 'V050', nombre: 'Vertical 0.50m', largo: 0.50, peso: 2.0,  ref: '2601.050', color: '#1e40af' },
    { id: 'V100', nombre: 'Vertical 1.00m', largo: 1.00, peso: 3.9,  ref: '2601.100', color: '#1e40af' },
    { id: 'V150', nombre: 'Vertical 1.50m', largo: 1.50, peso: 5.8,  ref: '2601.150', color: '#1e40af' },
    { id: 'V200', nombre: 'Vertical 2.00m', largo: 2.00, peso: 7.7,  ref: '2601.200', color: '#1e40af' },
    { id: 'V300', nombre: 'Vertical 3.00m', largo: 3.00, peso: 11.6, ref: '2601.300', color: '#1e40af' },
    { id: 'V400', nombre: 'Vertical 4.00m', largo: 4.00, peso: 15.4, ref: '2601.400', color: '#1e40af' },
  ],
  horizontalesO: [
    { id: 'HO073', nombre: 'Horizontal O 0.73m', largo: 0.73, peso: 3.1,  ref: '2607.073', color: '#059669' },
    { id: 'HO109', nombre: 'Horizontal O 1.09m', largo: 1.09, peso: 4.3,  ref: '2607.109', color: '#059669' },
    { id: 'HO140', nombre: 'Horizontal O 1.40m', largo: 1.40, peso: 5.4,  ref: '2607.140', color: '#059669' },
    { id: 'HO157', nombre: 'Horizontal O 1.57m', largo: 1.57, peso: 5.9,  ref: '2607.157', color: '#059669' },
    { id: 'HO207', nombre: 'Horizontal O 2.07m', largo: 2.07, peso: 7.8,  ref: '2607.207', color: '#059669' },
    { id: 'HO257', nombre: 'Horizontal O 2.57m', largo: 2.57, peso: 9.7,  ref: '2607.257', color: '#059669' },
    { id: 'HO307', nombre: 'Horizontal O 3.07m', largo: 3.07, peso: 11.4, ref: '2607.307', color: '#059669' },
  ],
  vigasPuente: [
    { id: 'VP157', nombre: 'Viga Puente U 1.57m', largo: 1.57, peso: 9.4,  ref: '2624.157', color: '#b45309' },
    { id: 'VP207', nombre: 'Viga Puente U 2.07m', largo: 2.07, peso: 12.1, ref: '2624.207', color: '#b45309' },
    { id: 'VP257', nombre: 'Viga Puente U 2.57m', largo: 2.57, peso: 15.2, ref: '2624.257', color: '#b45309' },
    { id: 'VP307', nombre: 'Viga Puente U 3.07m', largo: 3.07, peso: 17.6, ref: '2624.307', color: '#b45309' },
  ],
  horizontalesU: [
    { id: 'HU045', nombre: 'Horizontal U 0.45m', largo: 0.45, peso: 2.1,  ref: '2613.045', color: '#92400e' },
    { id: 'HU073', nombre: 'Horizontal U 0.73m', largo: 0.73, peso: 3.1,  ref: '2613.073', color: '#92400e' },
    { id: 'HU109', nombre: 'Horizontal U 1.09m', largo: 1.09, peso: 4.4,  ref: '2613.108', color: '#92400e' },
  ],
  plataformas: [
    { id: 'PL032_073', nombre: 'Plataforma 0.32×0.73m',  largo: 0.73, anchoPlat: 0.32, peso: 4.8,  ref: '3812.073', color: '#7f1d1d' },
    { id: 'PL032_109', nombre: 'Plataforma 0.32×1.09m',  largo: 1.09, anchoPlat: 0.32, peso: 6.5,  ref: '3812.109', color: '#7f1d1d' },
    { id: 'PL032_157', nombre: 'Plataforma 0.32×1.57m',  largo: 1.57, anchoPlat: 0.32, peso: 8.7,  ref: '3812.157', color: '#7f1d1d' },
    { id: 'PL032_207', nombre: 'Plataforma 0.32×2.07m',  largo: 2.07, anchoPlat: 0.32, peso: 11.2, ref: '3812.207', color: '#7f1d1d' },
    { id: 'PL032_257', nombre: 'Plataforma 0.32×2.57m',  largo: 2.57, anchoPlat: 0.32, peso: 13.5, ref: '3812.257', color: '#7f1d1d' },
    { id: 'PL032_307', nombre: 'Plataforma 0.32×3.07m',  largo: 3.07, anchoPlat: 0.32, peso: 15.8, ref: '3812.307', color: '#7f1d1d' },
    { id: 'PL061_073', nombre: 'Plataforma 0.61×0.73m',  largo: 0.73, anchoPlat: 0.61, peso: 7.0,  ref: '3835.073', color: '#7f1d1d' },
    { id: 'PL061_109', nombre: 'Plataforma 0.61×1.09m',  largo: 1.09, anchoPlat: 0.61, peso: 9.8,  ref: '3835.109', color: '#7f1d1d' },
    { id: 'PL061_157', nombre: 'Plataforma 0.61×1.57m',  largo: 1.57, anchoPlat: 0.61, peso: 13.4, ref: '3835.157', color: '#7f1d1d' },
    { id: 'PL061_207', nombre: 'Plataforma 0.61×2.07m',  largo: 2.07, anchoPlat: 0.61, peso: 17.0, ref: '3835.207', color: '#7f1d1d' },
    { id: 'PL061_257', nombre: 'Plataforma 0.61×2.57m',  largo: 2.57, anchoPlat: 0.61, peso: 20.5, ref: '3835.257', color: '#7f1d1d' },
    { id: 'PL061_307', nombre: 'Plataforma 0.61×3.07m',  largo: 3.07, anchoPlat: 0.61, peso: 24.0, ref: '3835.307', color: '#7f1d1d' },
  ],
  barandillas: [
    { id: 'BA073', nombre: 'Barandilla O 0.73m', largo: 0.73, peso: 3.1,  ref: '2607.073', color: '#0369a1' },
    { id: 'BA109', nombre: 'Barandilla O 1.09m', largo: 1.09, peso: 4.3,  ref: '2607.109', color: '#0369a1' },
    { id: 'BA157', nombre: 'Barandilla O 1.57m', largo: 1.57, peso: 5.9,  ref: '2607.157', color: '#0369a1' },
    { id: 'BA207', nombre: 'Barandilla O 2.07m', largo: 2.07, peso: 7.8,  ref: '2607.207', color: '#0369a1' },
    { id: 'BA257', nombre: 'Barandilla O 2.57m', largo: 2.57, peso: 9.7,  ref: '2607.257', color: '#0369a1' },
    { id: 'BA307', nombre: 'Barandilla O 3.07m', largo: 3.07, peso: 11.4, ref: '2607.307', color: '#0369a1' },
  ],
  rodapies: [
    { id: 'RP073', nombre: 'Rodapié 0.73m', largo: 0.73, peso: 1.4,  ref: '2640.073', color: '#a16207' },
    { id: 'RP109', nombre: 'Rodapié 1.09m', largo: 1.09, peso: 2.0,  ref: '2640.109', color: '#a16207' },
    { id: 'RP157', nombre: 'Rodapié 1.57m', largo: 1.57, peso: 2.7,  ref: '2640.157', color: '#a16207' },
    { id: 'RP207', nombre: 'Rodapié 2.07m', largo: 2.07, peso: 3.5,  ref: '2640.207', color: '#a16207' },
    { id: 'RP257', nombre: 'Rodapié 2.57m', largo: 2.57, peso: 4.2,  ref: '2640.257', color: '#a16207' },
    { id: 'RP307', nombre: 'Rodapié 3.07m', largo: 3.07, peso: 5.0,  ref: '2640.307', color: '#a16207' },
  ],
  diagonales: [
    { id: 'D109x200', nombre: 'Diagonal 1.09×2.00m', ancho: 1.09, alto: 2.00, peso: 5.8, ref: '2620.109', color: '#7c3aed' },
    { id: 'D157x200', nombre: 'Diagonal 1.57×2.00m', ancho: 1.57, alto: 2.00, peso: 6.7, ref: '2620.157', color: '#7c3aed' },
    { id: 'D207x200', nombre: 'Diagonal 2.07×2.00m', ancho: 2.07, alto: 2.00, peso: 7.6, ref: '2620.207', color: '#7c3aed' },
    { id: 'D257x100', nombre: 'Diagonal 2.57×1.00m', ancho: 2.57, alto: 1.00, peso: 6.0, ref: '2620.256', color: '#7c3aed' },
    { id: 'D257x150', nombre: 'Diagonal 2.57×1.50m', ancho: 2.57, alto: 1.50, peso: 7.5, ref: '2620.255', color: '#7c3aed' },
    { id: 'D257x200', nombre: 'Diagonal 2.57×2.00m', ancho: 2.57, alto: 2.00, peso: 8.5, ref: '2620.257', color: '#7c3aed' },
    { id: 'D307x200', nombre: 'Diagonal 3.07×2.00m', ancho: 3.07, alto: 2.00, peso: 9.5, ref: '2620.307', color: '#7c3aed' },
  ],
  bases: [
    { id: 'HUS060', nombre: 'Husillo regulable 0.60m', largo: 0.60, peso: 4.5, ref: '4001.060', color: '#7c2d12' },
    { id: 'HUS080', nombre: 'Husillo regulable 0.80m', largo: 0.80, peso: 5.8, ref: '4001.080', color: '#7c2d12' },
    { id: 'CO',     nombre: 'Collarín',                largo: 0.02, peso: 1.3, ref: '2603.000', color: '#78350f' },
  ],
};

// Mapeo de categorías para el catálogo plano
const CAT_KEYS = [
  { key: 'verticales',     cat: 'vertical',      label: 'Verticales' },
  { key: 'horizontalesO',  cat: 'horizontalO',   label: 'Horizontales O (tubo)' },
  { key: 'vigasPuente',    cat: 'vigaPuente',     label: 'Vigas Puente U' },
  { key: 'horizontalesU',  cat: 'horizontalU',    label: 'Horizontales U' },
  { key: 'plataformas',    cat: 'plataforma',     label: 'Plataformas' },
  { key: 'barandillas',    cat: 'barandilla',     label: 'Barandillas' },
  { key: 'rodapies',       cat: 'rodapie',        label: 'Rodapiés' },
  { key: 'diagonales',     cat: 'diagonal',       label: 'Diagonales' },
  { key: 'bases',          cat: 'base',           label: 'Bases / Husillos' },
];

const MODULOS_STANDARD = [0.73, 1.09, 1.40, 1.57, 2.07, 2.57, 3.07];
const ROSETA_STEP = 0.50;
const SNAP_TOLERANCIA = 0.15;
const SNAP_TOL_DIAGONAL = 0.30;
const DRAG_UMBRAL_PX = 4;

const uid = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const roundTo = (v, step) => Math.round(v / step) * step;

function elegirDiagonal(anchoObj, altoObj) {
  let mejor = CATALOGO.diagonales[0]; let mejorScore = Infinity;
  CATALOGO.diagonales.forEach(d => {
    const score = Math.abs(d.ancho - anchoObj) + Math.abs(d.alto - altoObj) * 1.2;
    if (score < mejorScore) { mejorScore = score; mejor = d; }
  });
  return mejor;
}

// Categorías que se comportan como horizontal (línea entre X y X+largo a una Y)
const ES_TIPO_HORIZONTAL = c => ['horizontalO','vigaPuente','horizontalU','plataforma','barandilla','rodapie'].includes(c);
const ES_TIPO_VERTICAL = c => ['vertical','base'].includes(c);

const piezaMinX = p => p.categoria === 'diagonal' ? Math.min(p.x1, p.x2) : p.x;
const piezaMinY = p => p.categoria === 'diagonal' ? Math.min(p.y1, p.y2) : p.y;
const piezaBounds = p => {
  if (p.categoria === 'diagonal') return { xMin: Math.min(p.x1, p.x2), xMax: Math.max(p.x1, p.x2), yMin: Math.min(p.y1, p.y2), yMax: Math.max(p.y1, p.y2) };
  if (ES_TIPO_VERTICAL(p.categoria)) return { xMin: p.x, xMax: p.x, yMin: p.y, yMax: p.y + p.largo };
  if (ES_TIPO_HORIZONTAL(p.categoria)) return { xMin: p.x, xMax: p.x + p.largo, yMin: p.y, yMax: p.y };
  return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
};
const desplazarPieza = (p, dx, dy) => {
  if (p.categoria === 'diagonal') return { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy };
  return { ...p, x: p.x + dx, y: p.y + dy };
};

// Orden de dibujo (Z-order): primero lo de fondo, último lo de frente
const Z_ORDER = { base: 0, vertical: 1, diagonal: 2, horizontalO: 3, vigaPuente: 4, horizontalU: 5, plataforma: 6, rodapie: 7, barandilla: 8 };
const DESPIECE_ORDER = { vertical: 0, horizontalO: 1, vigaPuente: 2, horizontalU: 3, plataforma: 4, barandilla: 5, rodapie: 6, diagonal: 7, base: 8 };

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function LayherEditor() {
  const [piezas, setPiezas] = useState([]);
  const [historial, setHistorial] = useState([[]]);
  const [historialIdx, setHistorialIdx] = useState(0);
  const [herramientaActiva, setHerramientaActiva] = useState(null);
  const [piezasSeleccionadas, setPiezasSeleccionadas] = useState([]);
  const [diagonalOrigen, setDiagonalOrigen] = useState(null);
  const [arrastrando, setArrastrando] = useState(null);
  const [seleccionRect, setSeleccionRect] = useState(null);
  const [seleccionInicio, setSeleccionInicio] = useState(null);
  const [clipboard, setClipboard] = useState([]);
  const [zoom, setZoom] = useState(60);
  const [pan, setPan] = useState({ x: 1, y: 0.5 });
  const [mostrarGrilla, setMostrarGrilla] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseEnCanvas, setMouseEnCanvas] = useState(false);
  const [panneando, setPanneando] = useState(false);
  const [panInicio, setPanInicio] = useState(null);
  const [nombreDiseno, setNombreDiseno] = useState('Diseño sin título');
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const svgRef = useRef(null);
  const [dimCanvas, setDimCanvas] = useState({ w: 1000, h: 600 });
  const spaceHeld = useRef(false);
  const stateRef = useRef({});
  stateRef.current = { piezas, piezasSeleccionadas, clipboard, mousePos, historialIdx, historial };

  useEffect(() => {
    const act = () => { if (svgRef.current) { const r = svgRef.current.getBoundingClientRect(); setDimCanvas({ w: r.width, h: r.height }); } };
    act(); window.addEventListener('resize', act); return () => window.removeEventListener('resize', act);
  }, []);
  useEffect(() => { setDiagonalOrigen(null); }, [herramientaActiva]);

  // Coordenadas
  const worldToScreen = useCallback((wx, wy) => ({ x: (wx - pan.x) * zoom, y: dimCanvas.h - (wy - pan.y) * zoom }), [pan, zoom, dimCanvas]);
  const screenToWorld = useCallback((sx, sy) => ({ x: sx / zoom + pan.x, y: (dimCanvas.h - sy) / zoom + pan.y }), [pan, zoom, dimCanvas]);

  // Snap
  const calcularSnap = useCallback((wx, wy, herramienta, excluirIds = []) => {
    const puntosRoseta = [];
    piezas.forEach(p => {
      if (ES_TIPO_VERTICAL(p.categoria) && !excluirIds.includes(p.id)) {
        for (let dy = 0; dy <= p.largo + 0.001; dy += ROSETA_STEP) puntosRoseta.push({ x: p.x, y: p.y + dy });
      }
    });
    if (herramienta?.categoria === 'diagonal') {
      let mejorDist = SNAP_TOL_DIAGONAL, mejor = { x: wx, y: wy, hit: false };
      puntosRoseta.forEach(pt => { const d = Math.hypot(pt.x - wx, pt.y - wy); if (d < mejorDist) { mejorDist = d; mejor = { x: pt.x, y: pt.y, hit: true }; } });
      return { x: mejor.x, y: mejor.y, snapX: mejor.hit, snapY: mejor.hit, snapRoseta: mejor.hit };
    }
    let snapY = wy, didSnapY = false;
    const ySnap = roundTo(wy, ROSETA_STEP);
    if (Math.abs(wy - ySnap) < SNAP_TOLERANCIA) { snapY = Math.max(0, ySnap); didSnapY = true; }
    const posX = [...new Set(piezas.filter(p => ES_TIPO_VERTICAL(p.categoria) && !excluirIds.includes(p.id)).map(v => v.x))];
    let mejorDist = SNAP_TOLERANCIA, mejorX = wx, didSnapX = false;
    posX.forEach(px => { const d = Math.abs(wx - px); if (d < mejorDist) { mejorDist = d; mejorX = px; didSnapX = true; } });
    posX.forEach(px => { MODULOS_STANDARD.forEach(mod => { [px + mod, px - mod].forEach(c => { const d = Math.abs(wx - c); if (d < mejorDist) { mejorDist = d; mejorX = c; didSnapX = true; } }); }); });
    let snapX = posX.length === 0 ? roundTo(wx, 0.10) : didSnapX ? mejorX : wx;
    return { x: snapX, y: snapY, snapX: didSnapX, snapY: didSnapY };
  }, [piezas]);

  // Historial
  const commit = useCallback((np) => {
    const nh = historial.slice(0, historialIdx + 1); nh.push(np);
    setHistorial(nh); setHistorialIdx(nh.length - 1); setPiezas(np);
  }, [historial, historialIdx]);
  const undo = useCallback(() => { setHistorialIdx(i => { if (i <= 0) return i; setPiezas(historial[i - 1]); setPiezasSeleccionadas([]); return i - 1; }); }, [historial]);
  const redo = useCallback(() => { setHistorialIdx(i => { if (i >= historial.length - 1) return i; setPiezas(historial[i + 1]); setPiezasSeleccionadas([]); return i + 1; }); }, [historial]);

  // Clipboard
  const copiar = useCallback(() => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current;
    const s = pz.filter(p => sel.includes(p.id)); if (s.length === 0) return;
    const minX = Math.min(...s.map(piezaMinX)), minY = Math.min(...s.map(piezaMinY));
    setClipboard(s.map(p => desplazarPieza(p, -minX, -minY)));
  }, []);
  const pegar = useCallback(() => {
    const { clipboard: cl, piezas: pz, mousePos: mp } = stateRef.current; if (cl.length === 0) return;
    const bx = roundTo(mp.x, ROSETA_STEP), by = Math.max(0, roundTo(mp.y, ROSETA_STEP));
    const n = cl.map(p => ({ ...desplazarPieza(p, bx, by), id: uid() }));
    commit([...pz, ...n]); setPiezasSeleccionadas(n.map(p => p.id));
  }, [commit]);
  const duplicar = useCallback(() => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current;
    const s = pz.filter(p => sel.includes(p.id)); if (s.length === 0) return;
    const n = s.map(p => ({ ...desplazarPieza(p, 0.5, 0.5), id: uid() }));
    commit([...pz, ...n]); setPiezasSeleccionadas(n.map(p => p.id));
  }, [commit]);
  const eliminarSeleccion = useCallback(() => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current; if (sel.length === 0) return;
    commit(pz.filter(p => !sel.includes(p.id))); setPiezasSeleccionadas([]);
  }, [commit]);
  const seleccionarTodo = useCallback(() => { setPiezasSeleccionadas(stateRef.current.piezas.map(p => p.id)); }, []);

  // Keyboard
  useEffect(() => {
    const PAN_STEP = 0.5;
    const kd = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === ' ' && !ctrl) { e.preventDefault(); spaceHeld.current = true; return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setPan(p => ({ ...p, x: p.x - PAN_STEP })); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); setPan(p => ({ ...p, x: p.x + PAN_STEP })); return; }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setPan(p => ({ ...p, y: p.y + PAN_STEP })); return; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); setPan(p => ({ ...p, y: p.y - PAN_STEP })); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); eliminarSeleccion(); }
      else if (e.key === 'Escape') { setPiezasSeleccionadas([]); setHerramientaActiva(null); setDiagonalOrigen(null); }
      else if (ctrl && e.key.toLowerCase() === 'c') { e.preventDefault(); copiar(); }
      else if (ctrl && e.key.toLowerCase() === 'v') { e.preventDefault(); pegar(); }
      else if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicar(); }
      else if (ctrl && e.key.toLowerCase() === 'a') { e.preventDefault(); seleccionarTodo(); }
      else if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((ctrl && e.key.toLowerCase() === 'y') || (ctrl && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); }
    };
    const ku = (e) => { if (e.key === ' ') spaceHeld.current = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [copiar, pegar, duplicar, eliminarSeleccion, seleccionarTodo, undo, redo]);

  // Mouse events
  const onMouseMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (panneando && panInicio) {
      setPan({ x: panInicio.panX - (sx - panInicio.sx) / zoom, y: panInicio.panY + (sy - panInicio.sy) / zoom }); return;
    }
    if (arrastrando) {
      const distPx = Math.hypot(sx - arrastrando.mouseIniPx.x, sy - arrastrando.mouseIniPx.y);
      if (distPx < DRAG_UMBRAL_PX && !arrastrando.moved) return;
      const w = screenToWorld(sx, sy);
      const posI = arrastrando.snapshotPosiciones[arrastrando.piezaAnclaId];
      const posIX = arrastrando.categoriaAncla === 'diagonal' ? posI.x1 : posI.x;
      const posIY = arrastrando.categoriaAncla === 'diagonal' ? posI.y1 : posI.y;
      const snapped = calcularSnap(w.x - arrastrando.offsetX, w.y - arrastrando.offsetY, null, arrastrando.idsAMover);
      const dX = snapped.x - posIX, dY = snapped.y - posIY;
      setPiezas(prev => prev.map(p => {
        if (!arrastrando.idsAMover.includes(p.id)) return p;
        const snap = arrastrando.snapshotPosiciones[p.id];
        if (p.categoria === 'diagonal') return { ...p, x1: snap.x1 + dX, y1: snap.y1 + dY, x2: snap.x2 + dX, y2: snap.y2 + dY };
        return { ...p, x: snap.x + dX, y: snap.y + dY };
      }));
      setArrastrando(a => ({ ...a, moved: true })); return;
    }
    if (seleccionInicio) {
      if (Math.hypot(sx - seleccionInicio.sx, sy - seleccionInicio.sy) > 3) {
        const w = screenToWorld(sx, sy);
        setSeleccionRect({ x1: seleccionInicio.wx, y1: seleccionInicio.wy, x2: w.x, y2: w.y });
      }
    }
    const world = screenToWorld(sx, sy);
    setMousePos(calcularSnap(world.x, world.y, herramientaActiva));
  };
  const onMouseEnter = () => setMouseEnCanvas(true);
  const onMouseLeave = () => { setMouseEnCanvas(false); setPanneando(false); if (arrastrando?.moved) commit(piezas); setArrastrando(null); setSeleccionInicio(null); setSeleccionRect(null); };

  const onMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && (e.altKey || spaceHeld.current))) {
      e.preventDefault(); const rect = svgRef.current.getBoundingClientRect();
      setPanneando(true); setPanInicio({ sx: e.clientX - rect.left, sy: e.clientY - rect.top, panX: pan.x, panY: pan.y }); return;
    }
    if (e.button !== 0) return;
    if (herramientaActiva) {
      if (herramientaActiva.categoria === 'diagonal') {
        if (!diagonalOrigen) setDiagonalOrigen({ x: mousePos.x, y: mousePos.y });
        else { colocarDiagonal(diagonalOrigen, { x: mousePos.x, y: mousePos.y }); setDiagonalOrigen(null); }
      } else colocarPieza(herramientaActiva, mousePos.x, mousePos.y);
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const w = screenToWorld(sx, sy);
    setSeleccionInicio({ sx, sy, wx: w.x, wy: w.y, shift: e.shiftKey });
  };

  const onMouseUp = () => {
    setPanneando(false);
    if (arrastrando) { if (arrastrando.moved) commit(piezas); setArrastrando(null); }
    if (seleccionInicio) {
      if (seleccionRect) {
        const xMin = Math.min(seleccionRect.x1, seleccionRect.x2), xMax = Math.max(seleccionRect.x1, seleccionRect.x2);
        const yMin = Math.min(seleccionRect.y1, seleccionRect.y2), yMax = Math.max(seleccionRect.y1, seleccionRect.y2);
        const ns = piezas.filter(p => { const b = piezaBounds(p); return !(b.xMax < xMin || b.xMin > xMax || b.yMax < yMin || b.yMin > yMax); }).map(p => p.id);
        setPiezasSeleccionadas(seleccionInicio.shift ? prev => [...new Set([...prev, ...ns])] : ns);
      } else if (!seleccionInicio.shift) setPiezasSeleccionadas([]);
      setSeleccionInicio(null); setSeleccionRect(null);
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (e.ctrlKey || e.metaKey) {
      const wa = screenToWorld(sx, sy); const f = e.deltaY < 0 ? 1.08 : 0.93;
      const nz = Math.max(15, Math.min(220, zoom * f)); setZoom(nz);
      setPan({ x: wa.x - sx / nz, y: wa.y - (dimCanvas.h - sy) / nz }); return;
    }
    if (Math.abs(e.deltaX) > 0 || !e.shiftKey) {
      setPan(p => ({ x: p.x + e.deltaX / zoom, y: p.y - e.deltaY / zoom }));
    } else {
      const wa = screenToWorld(sx, sy); const nz = Math.max(15, Math.min(220, zoom * (e.deltaY < 0 ? 1.15 : 0.87)));
      setZoom(nz); setPan({ x: wa.x - sx / nz, y: wa.y - (dimCanvas.h - sy) / nz });
    }
  };

  // Colocación
  const colocarPieza = (h, x, y) => {
    const n = { id: uid(), tipoId: h.id, nombre: h.nombre, categoria: h.categoria, largo: h.largo, peso: h.peso, ref: h.ref, color: h.color, x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(3)) };
    if (h.anchoPlat) n.anchoPlat = h.anchoPlat;
    commit([...piezas, n]); setPiezasSeleccionadas([n.id]);
  };
  const colocarDiagonal = (o, d) => {
    const dx = d.x - o.x, dy = d.y - o.y; if (Math.hypot(dx, dy) < 0.3) return;
    const cat = elegirDiagonal(Math.abs(dx), Math.abs(dy));
    const n = { id: uid(), tipoId: cat.id, nombre: cat.nombre, categoria: 'diagonal', ancho: cat.ancho, alto: cat.alto, peso: cat.peso, ref: cat.ref, color: cat.color, x1: o.x, y1: o.y, x2: d.x, y2: d.y };
    commit([...piezas, n]); setPiezasSeleccionadas([n.id]);
  };

  const onMouseDownPieza = (e, pieza) => {
    e.stopPropagation(); if (herramientaActiva) return;
    const yaSel = piezasSeleccionadas.includes(pieza.id);
    if (e.shiftKey) { setPiezasSeleccionadas(yaSel ? prev => prev.filter(id => id !== pieza.id) : prev => [...prev, pieza.id]); return; }
    let ids = yaSel ? piezasSeleccionadas : [pieza.id];
    if (!yaSel) setPiezasSeleccionadas([pieza.id]);
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top, w = screenToWorld(sx, sy);
    const snap = {};
    ids.forEach(id => { const p = piezas.find(x => x.id === id); if (!p) return; snap[id] = p.categoria === 'diagonal' ? { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 } : { x: p.x, y: p.y }; });
    const offX = w.x - (pieza.categoria === 'diagonal' ? pieza.x1 : pieza.x);
    const offY = w.y - (pieza.categoria === 'diagonal' ? pieza.y1 : pieza.y);
    setArrastrando({ idsAMover: ids, piezaAnclaId: pieza.id, categoriaAncla: pieza.categoria, offsetX: offX, offsetY: offY, snapshotPosiciones: snap, moved: false, mouseIniPx: { x: sx, y: sy } });
  };

  const borrarTodo = () => { if (piezas.length === 0) return; if (confirm('¿Borrar todo?')) { commit([]); setPiezasSeleccionadas([]); } };

  // Persistencia
  const guardar = async () => {
    try { const n = prompt('Nombre:', nombreDiseno); if (!n) return;
      await window.storage.set(`disenos:${n}`, JSON.stringify({ nombre: n, piezas, fecha: new Date().toISOString() }));
      setNombreDiseno(n); setMensajeGuardado(`✓ ${n}`); setTimeout(() => setMensajeGuardado(''), 2500);
    } catch { setMensajeGuardado('✗ Error'); setTimeout(() => setMensajeGuardado(''), 2500); }
  };
  const cargar = async () => {
    try { const l = await window.storage.list('disenos:');
      if (!l?.keys?.length) { alert('No hay diseños.'); return; }
      const ns = l.keys.map(k => k.replace('disenos:', '')); const e = prompt(`Diseños:\n${ns.join('\n')}\n\nNombre:`);
      if (!e) return; const r = await window.storage.get(`disenos:${e}`); if (!r) { alert('No encontrado.'); return; }
      const d = JSON.parse(r.value); commit(d.piezas); setNombreDiseno(d.nombre);
      setMensajeGuardado(`✓ ${d.nombre}`); setTimeout(() => setMensajeGuardado(''), 2500);
    } catch { setMensajeGuardado('✗ Error'); setTimeout(() => setMensajeGuardado(''), 2500); }
  };

  // Despiece
  const despiece = useMemo(() => {
    const ag = {};
    piezas.forEach(p => { if (!ag[p.tipoId]) ag[p.tipoId] = { nombre: p.nombre, categoria: p.categoria, peso: p.peso, ref: p.ref, cantidad: 0 }; ag[p.tipoId].cantidad += 1; });
    const lista = Object.values(ag).sort((a, b) => (DESPIECE_ORDER[a.categoria] ?? 99) - (DESPIECE_ORDER[b.categoria] ?? 99));
    return { lista, pesoTotal: piezas.reduce((s, p) => s + p.peso, 0), cantidadTotal: piezas.length };
  }, [piezas]);

  const worldVisible = useMemo(() => {
    const tl = screenToWorld(0, 0), br = screenToWorld(dimCanvas.w, dimCanvas.h);
    return { xMin: Math.min(br.x, tl.x), xMax: Math.max(br.x, tl.x), yMin: Math.min(br.y, tl.y), yMax: Math.max(br.y, tl.y) };
  }, [pan, zoom, dimCanvas, screenToWorld]);

  // Piezas ordenadas por Z para dibujo
  const piezasOrdenadas = useMemo(() => [...piezas].sort((a, b) => (Z_ORDER[a.categoria] ?? 5) - (Z_ORDER[b.categoria] ?? 5)), [piezas]);

  const piezaUnica = piezasSeleccionadas.length === 1 ? piezas.find(p => p.id === piezasSeleccionadas[0]) : null;

  // ============================================================
  return (
    <div style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }} className="w-full h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between border-b-2 border-red-600">
        <div className="flex items-center gap-3">
          <div className="text-red-600 font-black text-xl tracking-tight">MÁSALTO</div>
          <div className="text-gray-400 text-xs">/</div>
          <div className="font-semibold text-sm">Editor de Alzado Layher</div>
          <div className="text-gray-500 text-xs">v1.3</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span>{nombreDiseno}</span>
          {mensajeGuardado && <span className={mensajeGuardado.startsWith('✓') ? 'text-green-400' : 'text-red-400'}>{mensajeGuardado}</span>}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white border-b border-gray-300 px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
        <button onClick={guardar} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><Save size={13} /> Guardar</button>
        <button onClick={cargar} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><FolderOpen size={13} /> Cargar</button>
        <div className="w-px h-5 bg-gray-300 mx-0.5"></div>
        <button onClick={undo} disabled={historialIdx === 0} title="Ctrl+Z" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><Undo2 size={13} /></button>
        <button onClick={redo} disabled={historialIdx >= historial.length - 1} title="Ctrl+Y" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><Redo2 size={13} /></button>
        <div className="w-px h-5 bg-gray-300 mx-0.5"></div>
        <button onClick={copiar} disabled={piezasSeleccionadas.length === 0} title="Ctrl+C" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><Copy size={13} /></button>
        <button onClick={() => pegar()} disabled={clipboard.length === 0} title="Ctrl+V" className="flex items-center gap-0.5 p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40">
          <ClipboardPaste size={13} />{clipboard.length > 0 && <span className="text-[9px] text-gray-500">{clipboard.length}</span>}
        </button>
        <button onClick={duplicar} disabled={piezasSeleccionadas.length === 0} title="Ctrl+D" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-40"><CopyPlus size={13} /></button>
        <button onClick={seleccionarTodo} title="Ctrl+A" className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><CheckSquare size={13} /></button>
        <div className="w-px h-5 bg-gray-300 mx-0.5"></div>
        <button onClick={() => setZoom(z => Math.min(220, z * 1.2))} className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><ZoomIn size={13} /></button>
        <button onClick={() => setZoom(z => Math.max(15, z * 0.83))} className="p-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"><ZoomOut size={13} /></button>
        <span className="text-[10px] text-gray-600 w-12">{zoom.toFixed(0)}px/m</span>
        <button onClick={() => setMostrarGrilla(g => !g)} className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${mostrarGrilla ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-100 border-gray-300'}`}><Grid3x3 size={13} /></button>
        <div className="w-px h-5 bg-gray-300 mx-0.5"></div>
        <button onClick={borrarTodo} className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-300"><Trash2 size={13} /></button>
        <div className="flex-1"></div>
        <div className="text-[10px] text-gray-500 flex items-center gap-1"><Info size={11} />
          {herramientaActiva?.categoria === 'diagonal'
            ? (diagonalOrigen ? 'Click segunda roseta · ESC cancela' : 'Click roseta de origen')
            : piezasSeleccionadas.length > 1 ? `${piezasSeleccionadas.length} piezas · arrastrá para mover grupo`
            : '2 dedos / Space+arrastrar / flechas = mover plano'}
        </div>
      </div>

      {/* CUERPO */}
      <div className="flex-1 flex overflow-hidden">
        {/* PALETA */}
        <div className="w-52 bg-white border-r border-gray-300 overflow-y-auto">
          <div className="p-2">
            <button onClick={() => setHerramientaActiva(null)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 mb-2 text-xs rounded border ${!herramientaActiva ? 'bg-red-600 text-white border-red-700' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}>
              <MousePointer2 size={13} /> Seleccionar / mover
            </button>
            {CAT_KEYS.map(ck => (
              <SeccionPaleta key={ck.key} titulo={ck.label}
                piezas={CATALOGO[ck.key].map(p => ({ ...p, categoria: ck.cat }))}
                activa={herramientaActiva} onSelect={setHerramientaActiva} />
            ))}
          </div>
        </div>

        {/* CANVAS */}
        <div className="flex-1 bg-gray-50 relative overflow-hidden">
          <svg ref={svgRef} className="w-full h-full select-none" tabIndex={0}
            onMouseMove={onMouseMove} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
            onMouseDown={onMouseDown} onMouseUp={onMouseUp} onWheel={onWheel}
            style={{ cursor: panneando ? 'grabbing' : arrastrando ? 'grabbing' : herramientaActiva ? 'crosshair' : 'default' }}>
            {mostrarGrilla && <Grilla worldVisible={worldVisible} worldToScreen={worldToScreen} zoom={zoom} />}
            <LineaSuelo worldVisible={worldVisible} worldToScreen={worldToScreen} />
            {piezasOrdenadas.map(p => (
              <PiezaRender key={p.id} pieza={p} worldToScreen={worldToScreen} zoom={zoom}
                seleccionada={piezasSeleccionadas.includes(p.id)}
                onMouseDown={(e) => onMouseDownPieza(e, p)} cursorMover={!herramientaActiva && !arrastrando} />
            ))}
            {mouseEnCanvas && herramientaActiva && !panneando && !arrastrando && herramientaActiva.categoria !== 'diagonal' && (
              <PiezaRender pieza={{ ...herramientaActiva, x: mousePos.x, y: mousePos.y, id: 'ghost' }}
                worldToScreen={worldToScreen} zoom={zoom} fantasma />
            )}
            {mouseEnCanvas && herramientaActiva?.categoria === 'diagonal' && diagonalOrigen && (
              <PreviewDiagonal origen={diagonalOrigen} destino={mousePos} worldToScreen={worldToScreen} />
            )}
            {herramientaActiva?.categoria === 'diagonal' && diagonalOrigen && (() => {
              const p = worldToScreen(diagonalOrigen.x, diagonalOrigen.y);
              return <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#7c3aed" strokeWidth="2" />;
            })()}
            {seleccionRect && (() => {
              const p1 = worldToScreen(seleccionRect.x1, seleccionRect.y1), p2 = worldToScreen(seleccionRect.x2, seleccionRect.y2);
              return <rect x={Math.min(p1.x,p2.x)} y={Math.min(p1.y,p2.y)} width={Math.abs(p2.x-p1.x)} height={Math.abs(p2.y-p1.y)}
                fill="#3b82f6" fillOpacity="0.08" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 3" />;
            })()}
            {mouseEnCanvas && herramientaActiva && (mousePos.snapX || mousePos.snapY) && (
              <IndicadoresSnap mousePos={mousePos} worldToScreen={worldToScreen} dimCanvas={dimCanvas} />
            )}
          </svg>
          {mouseEnCanvas && (
            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded font-mono">
              X:{mousePos.x.toFixed(2)}m Y:{mousePos.y.toFixed(2)}m
              {mousePos.snapRoseta && <span className="text-purple-300 ml-1">◆roseta</span>}
              {!mousePos.snapRoseta && mousePos.snapX && <span className="text-red-400 ml-1">◆X</span>}
              {!mousePos.snapRoseta && mousePos.snapY && <span className="text-red-400 ml-1">◆Y</span>}
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-white/95 border border-gray-300 text-[9px] text-gray-500 px-2 py-0.5 rounded">
            Esquemático preliminar · No usar como guía de armado
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="w-64 bg-white border-l border-gray-300 overflow-y-auto flex flex-col text-xs">
          {piezasSeleccionadas.length > 1 && (
            <div className="p-2 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wide text-blue-700 font-bold">{piezasSeleccionadas.length} piezas</span>
                <button onClick={() => setPiezasSeleccionadas([])} className="text-gray-400 hover:text-gray-700"><X size={12} /></button>
              </div>
              <div className="text-gray-600 mb-1.5">Peso: <span className="font-mono font-bold">{piezas.filter(p => piezasSeleccionadas.includes(p.id)).reduce((s,p)=>s+p.peso,0).toFixed(1)} kg</span></div>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={copiar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><Copy size={10} />Copiar</button>
                <button onClick={duplicar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><CopyPlus size={10} />Duplicar</button>
                <button onClick={eliminarSeleccion} className="flex items-center justify-center gap-0.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px]"><Trash2 size={10} />Borrar</button>
              </div>
            </div>
          )}
          {piezaUnica && (
            <div className="p-2 border-b border-gray-200 bg-red-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wide text-red-700 font-bold">Seleccionada</span>
                <button onClick={() => setPiezasSeleccionadas([])} className="text-gray-400 hover:text-gray-700"><X size={12} /></button>
              </div>
              <div className="font-semibold text-black">{piezaUnica.nombre}</div>
              <div className="text-gray-600 mt-0.5">Ref: {piezaUnica.ref} · {piezaUnica.peso} kg</div>
              <div className="text-gray-500 font-mono text-[10px]">
                {piezaUnica.categoria === 'diagonal'
                  ? `(${piezaUnica.x1.toFixed(2)},${piezaUnica.y1.toFixed(2)})→(${piezaUnica.x2.toFixed(2)},${piezaUnica.y2.toFixed(2)})`
                  : `X:${piezaUnica.x.toFixed(2)} Y:${piezaUnica.y.toFixed(2)}`}
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1.5">
                <button onClick={duplicar} className="flex items-center justify-center gap-0.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px]"><CopyPlus size={10} />Duplicar</button>
                <button onClick={eliminarSeleccion} className="flex items-center justify-center gap-0.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px]"><Trash2 size={10} />Borrar</button>
              </div>
            </div>
          )}
          <div className="p-2 flex-1">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1.5">Despiece total</div>
            {despiece.lista.length === 0
              ? <div className="text-gray-400 italic text-[10px]">Elegí una pieza y hacé click en el canvas.</div>
              : <>
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-gray-300 text-gray-500"><th className="text-left py-0.5 font-semibold">Pieza</th><th className="text-right py-0.5 font-semibold">Cant</th><th className="text-right py-0.5 font-semibold">kg</th></tr></thead>
                  <tbody>{despiece.lista.map((it, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-0.5"><div className="font-semibold text-gray-800 leading-tight">{it.nombre}</div><div className="text-[9px] text-gray-400">{it.ref}</div></td>
                      <td className="text-right py-0.5 font-mono">{it.cantidad}</td>
                      <td className="text-right py-0.5 font-mono text-gray-600">{(it.cantidad * it.peso).toFixed(1)}</td>
                    </tr>
                  ))}</tbody>
                </table>
                <div className="mt-2 pt-1.5 border-t-2 border-black flex justify-between text-sm">
                  <span className="font-bold">TOTAL</span>
                  <span className="font-mono font-bold">{despiece.pesoTotal.toFixed(1)} kg</span>
                </div>
                <div className="text-[9px] text-gray-500 text-right">{despiece.cantidadTotal} piezas</div>
              </>}
          </div>
          <div className="border-t border-gray-200 p-2 bg-gray-50">
            <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Atajos</div>
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-0 text-[9px] text-gray-600">
              <span>Ctrl+C/V/D</span><span className="text-gray-400">Copiar/Pegar/Duplicar</span>
              <span>Ctrl+A</span><span className="text-gray-400">Seleccionar todo</span>
              <span>Ctrl+Z/Y</span><span className="text-gray-400">Deshacer/Rehacer</span>
              <span>Del</span><span className="text-gray-400">Eliminar</span>
              <span>Esc</span><span className="text-gray-400">Deseleccionar</span>
              <span>2 dedos / Space</span><span className="text-gray-400">Mover plano</span>
              <span>Flechas</span><span className="text-gray-400">Mover plano</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENTES
// ============================================================

function SeccionPaleta({ titulo, piezas, activa, onSelect }) {
  const [abierta, setAbierta] = useState(true);
  const tieneActiva = piezas.some(p => activa?.id === p.id);
  return (
    <div className="mb-2">
      <button onClick={() => setAbierta(!abierta)}
        className={`w-full flex items-center gap-1 px-1 py-1 text-[10px] uppercase tracking-wider font-bold rounded hover:bg-gray-100 ${tieneActiva ? 'text-red-700' : 'text-gray-500'}`}>
        {abierta ? <ChevronDown size={10} /> : <ChevronRight size={10} />} {titulo}
      </button>
      {abierta && (
        <div className="space-y-0.5 mt-0.5">
          {piezas.map(p => (
            <button key={p.id} onClick={() => onSelect(p)}
              className={`w-full flex items-center justify-between px-2 py-1 text-[11px] rounded border transition ${
                activa?.id === p.id ? 'bg-red-600 text-white border-red-700' : 'bg-white border-gray-200 hover:border-gray-400 text-gray-800'}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: activa?.id === p.id ? 'white' : p.color }} />
                <span className="font-semibold">
                  {p.categoria === 'diagonal' ? `${p.ancho.toFixed(2)}×${p.alto.toFixed(2)}` :
                   p.anchoPlat ? `${p.anchoPlat.toFixed(2)}×${p.largo.toFixed(2)}` :
                   `${p.largo.toFixed(2)}m`}
                </span>
              </div>
              <span className={`text-[9px] ${activa?.id === p.id ? 'text-red-100' : 'text-gray-400'}`}>{p.peso}kg</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Grilla({ worldVisible, worldToScreen, zoom }) {
  const ls = []; const step = zoom < 30 ? 1 : zoom < 80 ? 0.5 : 0.25;
  for (let x = Math.floor(worldVisible.xMin / step) * step; x <= Math.ceil(worldVisible.xMax / step) * step; x += step) {
    const p1 = worldToScreen(x, worldVisible.yMax), p2 = worldToScreen(x, worldVisible.yMin);
    const ent = Math.abs(x - Math.round(x)) < 0.01;
    ls.push(<line key={`v${x.toFixed(3)}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ent ? '#c0c4cc' : '#e8eaed'} strokeWidth={ent ? 0.7 : 0.3} />);
    if (ent && zoom > 25) ls.push(<text key={`vt${x.toFixed(3)}`} x={p1.x + 2} y={12} fontSize="9" fill="#94a3b8" fontFamily="monospace">{x.toFixed(0)}</text>);
  }
  for (let y = Math.floor(worldVisible.yMin / step) * step; y <= Math.ceil(worldVisible.yMax / step) * step; y += step) {
    const p1 = worldToScreen(worldVisible.xMin, y), p2 = worldToScreen(worldVisible.xMax, y);
    const ent = Math.abs(y - Math.round(y)) < 0.01;
    ls.push(<line key={`h${y.toFixed(3)}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ent ? '#c0c4cc' : '#e8eaed'} strokeWidth={ent ? 0.7 : 0.3} />);
    if (ent && y >= 0 && zoom > 25) ls.push(<text key={`ht${y.toFixed(3)}`} x={4} y={p1.y - 2} fontSize="9" fill="#94a3b8" fontFamily="monospace">{y.toFixed(0)}</text>);
  }
  return <g>{ls}</g>;
}

function LineaSuelo({ worldVisible, worldToScreen }) {
  const p1 = worldToScreen(worldVisible.xMin, 0), p2 = worldToScreen(worldVisible.xMax, 0);
  return <g>
    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeWidth="1.5" />
    {Array.from({ length: 60 }).map((_, i) => {
      const xW = worldVisible.xMin + (i * (worldVisible.xMax - worldVisible.xMin) / 60);
      const pa = worldToScreen(xW, 0);
      return <line key={i} x1={pa.x} y1={pa.y} x2={pa.x + 6} y2={pa.y + 6} stroke="#000" strokeWidth="0.5" opacity="0.5" />;
    })}
  </g>;
}

function PiezaRender({ pieza, worldToScreen, zoom, seleccionada, fantasma, onMouseDown, cursorMover }) {
  const op = fantasma ? 0.4 : 1;
  const { categoria, color } = pieza;
  const sc = seleccionada ? '#E30613' : color;
  const cur = fantasma ? 'none' : (cursorMover ? 'move' : 'pointer');

  // VERTICAL
  if (categoria === 'vertical') {
    const { x, y, largo } = pieza;
    const pB = worldToScreen(x, y), pT = worldToScreen(x, y + largo);
    const g = Math.max(2, zoom * 0.048);
    const rs = [];
    for (let dy = 0; dy <= largo + 0.001; dy += ROSETA_STEP) { const pr = worldToScreen(x, y + dy); rs.push(<circle key={dy} cx={pr.x} cy={pr.y} r={Math.max(1.5, zoom * 0.035)} fill={fantasma ? '#94a3b8' : '#000'} opacity={op} />); }
    return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />{rs}
    </g>;
  }

  // HORIZONTAL O (tubo redondo)
  if (categoria === 'horizontalO' || categoria === 'barandilla') {
    const { x, y, largo } = pieza;
    const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
    const g = Math.max(2, zoom * 0.045);
    const isDashed = categoria === 'barandilla';
    return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke={sc} strokeWidth={g} strokeLinecap="round" strokeDasharray={isDashed ? '8 4' : 'none'} />
      <rect x={pL.x - 3} y={pL.y - 4} width="6" height="8" fill={sc} />
      <rect x={pR.x - 3} y={pR.y - 4} width="6" height="8" fill={sc} />
    </g>;
  }

  // VIGA PUENTE U
  if (categoria === 'vigaPuente') {
    const { x, y, largo } = pieza;
    const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
    const g = Math.max(3, zoom * 0.065);
    const alaH = Math.max(3, zoom * 0.04);
    return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke="#E30613" strokeWidth={g + 8} opacity="0.25" strokeLinecap="round" />}
      {/* Perfil U: alma horizontal + dos alas arriba */}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />
      <line x1={pL.x} y1={pL.y} x2={pL.x} y2={pL.y - alaH} stroke={sc} strokeWidth={g * 0.6} />
      <line x1={pR.x} y1={pR.y} x2={pR.x} y2={pR.y - alaH} stroke={sc} strokeWidth={g * 0.6} />
      {/* Indicador U en el centro */}
      <line x1={(pL.x+pR.x)/2 - 4} y1={pL.y} x2={(pL.x+pR.x)/2 - 4} y2={pL.y - alaH * 0.7} stroke={sc} strokeWidth={g * 0.4} />
      <line x1={(pL.x+pR.x)/2 + 4} y1={pR.y} x2={(pL.x+pR.x)/2 + 4} y2={pR.y - alaH * 0.7} stroke={sc} strokeWidth={g * 0.4} />
      {/* Cabezales cuña */}
      <rect x={pL.x - 4} y={pL.y - 5} width="8" height="10" fill={sc} rx="1" />
      <rect x={pR.x - 4} y={pR.y - 5} width="8" height="10" fill={sc} rx="1" />
    </g>;
  }

  // HORIZONTAL U
  if (categoria === 'horizontalU') {
    const { x, y, largo } = pieza;
    const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
    const g = Math.max(2.5, zoom * 0.055);
    const alaH = Math.max(2, zoom * 0.03);
    return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" />}
      <line x1={pL.x} y1={pL.y} x2={pR.x} y2={pR.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />
      <line x1={pL.x} y1={pL.y} x2={pL.x} y2={pL.y - alaH} stroke={sc} strokeWidth={g * 0.5} />
      <line x1={pR.x} y1={pR.y} x2={pR.x} y2={pR.y - alaH} stroke={sc} strokeWidth={g * 0.5} />
      <rect x={pL.x - 3} y={pL.y - 4} width="6" height="8" fill={sc} />
      <rect x={pR.x - 3} y={pR.y - 4} width="6" height="8" fill={sc} />
    </g>;
  }

  // PLATAFORMA
  if (categoria === 'plataforma') {
    const { x, y, largo } = pieza;
    const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
    const h = Math.max(5, zoom * 0.06); // espesor visual de la plataforma
    return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={pL.x} y={pL.y - h - 3} width={pR.x - pL.x} height={h + 6} fill="none" stroke="#E30613" strokeWidth="2" rx="1" />}
      <rect x={pL.x} y={pL.y - h} width={pR.x - pL.x} height={h} fill={sc} rx="1" stroke={seleccionada ? '#E30613' : '#4a1010'} strokeWidth="0.5" />
      {/* Textura: líneas horizontales finas simulando la rejilla */}
      {zoom > 35 && Array.from({ length: Math.max(1, Math.floor((pR.x - pL.x) / 12)) }).map((_, i) => (
        <line key={i} x1={pL.x + 6 + i * 12} y1={pL.y - h + 1} x2={pL.x + 6 + i * 12} y2={pL.y - 1} stroke="#4a1010" strokeWidth="0.3" opacity="0.5" />
      ))}
    </g>;
  }

  // RODAPIÉ
  if (categoria === 'rodapie') {
    const { x, y, largo } = pieza;
    const pL = worldToScreen(x, y), pR = worldToScreen(x + largo, y);
    const h = Math.max(3, zoom * 0.035);
    return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <rect x={pL.x} y={pL.y - h - 2} width={pR.x - pL.x} height={h + 4} fill="none" stroke="#E30613" strokeWidth="2" />}
      <rect x={pL.x} y={pL.y - h} width={pR.x - pL.x} height={h} fill={sc} stroke={sc} strokeWidth="0.5" rx="0.5" />
    </g>;
  }

  // DIAGONAL
  if (categoria === 'diagonal') {
    const { x1, y1, x2, y2 } = pieza;
    const pA = worldToScreen(x1, y1), pB = worldToScreen(x2, y2);
    const g = Math.max(1.5, zoom * 0.035);
    return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
      <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />
      <circle cx={pA.x} cy={pA.y} r={Math.max(2, zoom * 0.03)} fill={sc} />
      <circle cx={pB.x} cy={pB.y} r={Math.max(2, zoom * 0.03)} fill={sc} />
    </g>;
  }

  // BASE (husillo / collarín)
  if (categoria === 'base') {
    const { x, y, largo, tipoId } = pieza;
    if (tipoId === 'CO') {
      const p = worldToScreen(x, y);
      const ancho = Math.max(10, zoom * 0.16), alto = Math.max(4, zoom * 0.05);
      return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
        {seleccionada && <rect x={p.x - ancho/2 - 3} y={p.y - alto/2 - 3} width={ancho + 6} height={alto + 6} fill="none" stroke="#E30613" strokeWidth="2" />}
        <rect x={p.x - ancho/2} y={p.y - alto/2} width={ancho} height={alto} fill={sc} rx="1" />
        <circle cx={p.x} cy={p.y} r={Math.max(1, zoom * 0.02)} fill="#fff" />
      </g>;
    }
    const pB = worldToScreen(x, y), pT = worldToScreen(x, y + largo);
    const g = Math.max(3, zoom * 0.06);
    return <g opacity={op} onMouseDown={onMouseDown} style={{ cursor: cur }}>
      {seleccionada && <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y} stroke="#E30613" strokeWidth={g + 6} opacity="0.25" strokeLinecap="round" />}
      <line x1={pT.x} y1={pT.y} x2={pB.x} y2={pB.y} stroke={sc} strokeWidth={g} strokeLinecap="round" />
      <rect x={pB.x - 12} y={pB.y - 2} width="24" height="4" fill={sc} />
    </g>;
  }
  return null;
}

function PreviewDiagonal({ origen, destino, worldToScreen }) {
  const pA = worldToScreen(origen.x, origen.y), pB = worldToScreen(destino.x, destino.y);
  const cat = elegirDiagonal(Math.abs(destino.x - origen.x), Math.abs(destino.y - origen.y));
  const mid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
  return <g>
    <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 4" opacity="0.75" />
    <rect x={mid.x - 50} y={mid.y - 18} width="100" height="14" fill="#7c3aed" rx="2" />
    <text x={mid.x} y={mid.y - 8} fontSize="9" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="bold">→ {cat.nombre.replace('Diagonal ', 'D ')}</text>
  </g>;
}

function IndicadoresSnap({ mousePos, worldToScreen, dimCanvas }) {
  const p = worldToScreen(mousePos.x, mousePos.y);
  const c = mousePos.snapRoseta ? '#7c3aed' : '#E30613';
  return <g pointerEvents="none">
    {mousePos.snapY && !mousePos.snapRoseta && <line x1={0} y1={p.y} x2={dimCanvas.w} y2={p.y} stroke={c} strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />}
    {mousePos.snapX && !mousePos.snapRoseta && <line x1={p.x} y1={0} x2={p.x} y2={dimCanvas.h} stroke={c} strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />}
    <circle cx={p.x} cy={p.y} r={mousePos.snapRoseta ? 7 : 5} fill="none" stroke={c} strokeWidth={mousePos.snapRoseta ? 2 : 1.5} />
  </g>;
}
