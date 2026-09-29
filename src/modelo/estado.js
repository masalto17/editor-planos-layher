import { datosImportados } from './datosImportados.js';
import { useState, useRef, useCallback, useEffect } from 'react';
import { elegirDiagonal, elegirDiagonalPlanta } from '../catalogo/piezas.js';
import {
  MODULOS_STANDARD, ROSETA_STEP, SNAP_TOLERANCIA, SNAP_TOL_DIAGONAL,
  ES_TIPO_VERTICAL, ES_TIPO_HORIZONTAL, TIENE_ORIENTACION,
} from '../catalogo/constantes.js';
import { idbGet, idbSet, idbDel, idbKeys } from './storage.js';
import { uid, roundTo, piezaMinX, piezaMinY, piezaMinZ, desplazarPieza, cruzaFilaZ } from './operaciones.js';
import { CAPAS, USOS_AREA, USOS_RECORRIDO, definicionPorId } from '../catalogo/festival.js';
import {
  VERSION_DISENO, esFestival, crearInstanciaFestival, crearArea, crearRecorrido, valladoPorRecorrido,
  normalizarCapas, migrarDiseno, normRot,
} from './entidades.js';

const CAPA_IDS = CAPAS.map(c => c.id);

/**
 * Estado central del diseño — compartido por TODAS las vistas (Alzado, Planta, ...).
 * Cada pieza vive en un espacio 3D lógico: x (horizontal, común a ambas vistas),
 * y (altura, eje vertical del Alzado), z (profundidad/fila, eje vertical de la Planta).
 * V1.3 no tenía eje Z: todo se creaba en z=0, así que el Alzado existente sigue
 * funcionando igual mientras no se agreguen filas nuevas.
 */
export function useDisenoState() {
  const MAX_HISTORIAL = 100;
  const [piezas, setPiezas] = useState([]);
  const [historial, setHistorial] = useState([[]]);
  const [historialIdx, setHistorialIdx] = useState(0);
  const [herramientaActiva, setHerramientaActivaRaw] = useState(null);
  const [piezasSeleccionadas, setPiezasSeleccionadas] = useState([]);
  const [diagonalOrigen, setDiagonalOrigen] = useState(null);
  const [clipboard, setClipboard] = useState([]);
  // Sistema de filas nombradas (A, B, C, …). Cada fila tiene un `z` numérico. Al colocar
  // piezas en el Alzado se usa el z de la fila activa. Las piezas siguen guardando `z`
  // numérico crudo (no id de fila), así que borrar una fila no huerfaniza a nadie —
  // las piezas quedan en ese z aunque ya no aparezca en el dropdown.
  const [filas, setFilas] = useState([{ id: 'A', nombre: 'A', z: 0 }]);
  const [filaActivaId, setFilaActivaId] = useState('A');
  const filaActiva = filas.find(f => f.id === filaActivaId) ?? filas[0];
  const filaZ = filaActiva.z;
  const [alturaY, setAlturaY] = useState(0);    // altura activa (usada al colocar piezas desde la Planta)
  const [orientacionActiva, setOrientacionActiva] = useState('x'); // 'x' | 'z' para horizontales; tecla R alterna
  const [diagonalPlantaOrigen, setDiagonalPlantaOrigen] = useState(null); // primer clic de diagonal en Planta
  const [nombreDiseno, setNombreDiseno] = useState('Diseño sin título');
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const [clipboardOrigY, setClipboardOrigY] = useState(0);
  const [clipboardOrigZ, setClipboardOrigZ] = useState(0);
  const [capas, setCapas] = useState(() => normalizarCapas(null, CAPA_IDS));
  const [rotacionActiva, setRotacionActiva] = useState(0); // grados, para piezas de festival

  const stateRef = useRef({});
  stateRef.current = { piezas, piezasSeleccionadas, clipboard, clipboardOrigY, clipboardOrigZ, historialIdx, historial, filaZ, alturaY, orientacionActiva, filas, filaActivaId, capas, rotacionActiva, herramientaActiva, nombreDiseno };

  const setHerramientaActiva = useCallback((h) => { setHerramientaActivaRaw(h); setDiagonalOrigen(null); setDiagonalPlantaOrigen(null); }, []);
  const toggleOrientacion = useCallback(() => { setOrientacionActiva(o => (o === 'x' ? 'z' : 'x')); }, []);

  // ---------- CRUD de filas ----------
  // Siguiente letra disponible: A, B, C, ..., Z, AA, AB... (rara vez se pasa de Z).
  const proximaLetra = useCallback((usadas) => {
    const set = new Set(usadas);
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const c of letras) if (!set.has(c)) return c;
    for (const a of letras) for (const b of letras) { const s = a + b; if (!set.has(s)) return s; }
    return `F${Date.now().toString(36)}`;
  }, []);
  const agregarFila = useCallback(() => {
    setFilas(prev => {
      const usadas = prev.map(f => f.id);
      const id = proximaLetra(usadas);
      const zBase = prev.length ? Math.max(...prev.map(f => f.z)) + 2.57 : 0;
      return [...prev, { id, nombre: id, z: parseFloat(zBase.toFixed(3)) }];
    });
  }, [proximaLetra]);
  const agregarFilaConDatos = useCallback((f) => {
    setFilas(prev => {
      if (prev.find(p => p.id === f.id)) return prev;
      return [...prev, { id: f.id, nombre: f.nombre, z: parseFloat((f.z ?? 0).toFixed(3)) }];
    });
  }, []);
  // Info sobre la fila (para confirmación externa). No borra.
  // Función plana (no useCallback) — lee de stateRef, no necesita memoizar.
  const infoFila = (id) => {
    const fila = stateRef.current.filas.find(f => f.id === id);
    if (!fila) return null;
    const piezasEnFila = stateRef.current.piezas.filter(p => (p.z ?? 0) === fila.z);
    return { fila, cantPiezas: piezasEnFila.length };
  };
  const eliminarFila = useCallback((id) => {
    setFilas(prev => {
      if (prev.length <= 1) return prev;
      const filtradas = prev.filter(f => f.id !== id);
      if (id === stateRef.current.filaActivaId) setFilaActivaId(filtradas[0].id);
      return filtradas;
    });
  }, []);
  const renombrarFila = useCallback((id, nuevoNombre) => {
    setFilas(prev => prev.map(f => f.id === id ? { ...f, nombre: nuevoNombre } : f));
  }, []);
  const moverFila = useCallback((id, nuevoZ) => {
    setFilas(prev => prev.map(f => f.id === id ? { ...f, z: parseFloat(nuevoZ.toFixed(3)) } : f));
  }, []);

  // ---------- Historial ----------
  const commit = useCallback((np) => {
    const prevIdx = stateRef.current.historialIdx;
    const nh = stateRef.current.historial.slice(0, prevIdx + 1);
    nh.push(np);
    let newIdx = prevIdx + 1;
    if (nh.length > MAX_HISTORIAL) {
      const excess = nh.length - MAX_HISTORIAL;
      nh.splice(0, excess);
      newIdx -= excess;
    }
    setHistorial(nh);
    setHistorialIdx(newIdx);
    setPiezas(np);
  }, []);
  const undo = useCallback(() => {
    const { historial: h, historialIdx: i } = stateRef.current;
    if (i <= 0) return;
    setPiezas(h[i - 1]); setHistorialIdx(i - 1); setPiezasSeleccionadas([]);
  }, []);
  const redo = useCallback(() => {
    const { historial: h, historialIdx: i } = stateRef.current;
    if (i >= h.length - 1) return;
    setPiezas(h[i + 1]); setHistorialIdx(i + 1); setPiezasSeleccionadas([]);
  }, []);

  // ---------- Clipboard ----------
  // El clipboard guarda piezas normalizadas al origen 3D + las posiciones originales
  // (clipboardOrigY/Z) para poder pegar sin perder altura/profundidad cuando se pega
  // desde toolbar (sin posición de mouse).
  const copiar = useCallback(() => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current;
    const s = pz.filter(p => sel.includes(p.id)); if (s.length === 0) return;
    const minX = Math.min(...s.map(piezaMinX));
    const minY = Math.min(...s.map(piezaMinY));
    const minZ = Math.min(...s.map(piezaMinZ));
    setClipboardOrigY(minY);
    setClipboardOrigZ(minZ);
    setClipboard(s.map(p => desplazarPieza(p, -minX, -minY, -minZ)));
  }, []);
  const pegar = useCallback((puntoBase, vista = 'alzado') => {
    const { clipboard: cl, piezas: pz, clipboardOrigY: origY, clipboardOrigZ: origZ } = stateRef.current;
    if (cl.length === 0) return;
    // Si no hay puntoBase (ej: botón toolbar), usar posición original de las piezas copiadas
    const hasPunto = puntoBase && (puntoBase.x != null || puntoBase.y != null || puntoBase.z != null);
    const bx = roundTo(hasPunto ? (puntoBase.x ?? 0) : 0, ROSETA_STEP);
    const by = vista === 'alzado' ? Math.max(0, roundTo(hasPunto ? (puntoBase.y ?? 0) : origY, ROSETA_STEP)) : origY;
    const bz = vista === 'planta' ? roundTo(hasPunto ? (puntoBase.z ?? 0) : origZ, ROSETA_STEP) : origZ;
    const n = cl.map(p => ({ ...desplazarPieza(p, bx, by, bz), id: uid() }));
    commit([...pz, ...n]); setPiezasSeleccionadas(n.map(p => p.id));
  }, [commit]);
  const duplicar = useCallback((vista = 'alzado') => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current;
    const s = pz.filter(p => sel.includes(p.id)); if (s.length === 0) return;
    // Desplaza medio metro en el eje secundario visible de cada vista (Y en Alzado, Z en Planta).
    const dy = vista === 'alzado' ? 0.5 : 0;
    const dz = vista === 'planta' ? 0.5 : 0;
    const n = s.map(p => ({ ...desplazarPieza(p, 0.5, dy, dz), id: uid() }));
    commit([...pz, ...n]); setPiezasSeleccionadas(n.map(p => p.id));
  }, [commit]);
  const eliminarSeleccion = useCallback(() => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current; if (sel.length === 0) return;
    commit(pz.filter(p => !sel.includes(p.id))); setPiezasSeleccionadas([]);
  }, [commit]);
  const seleccionarTodo = useCallback(() => { setPiezasSeleccionadas(stateRef.current.piezas.map(p => p.id)); }, []);

  // ---------- Colocación ----------
  // Desde el Alzado: click da (x, y); la profundidad la fija filaZ activa. Las horizontales
  // toman `orientacionActiva` — en Alzado casi siempre es 'x'; con 'z' se plantan piezas
  // que corren en profundidad y se ven como un punto en el alzado.
  const colocarPiezaAlzado = useCallback((h, x, y) => {
    const { piezas: pz, filaZ: z, orientacionActiva: ori } = stateRef.current;
    const n = { id: uid(), tipoId: h.id, nombre: h.nombre, categoria: h.categoria, largo: h.largo, peso: h.peso, ref: h.ref, color: h.color, x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(3)), z };
    if (h.anchoPlat) n.anchoPlat = h.anchoPlat;
    if (h.desnivel) n.desnivel = h.desnivel;
    if (h.anchoEscalera) n.anchoEscalera = h.anchoEscalera;
    // Techo compuesto: copiar metadata para despiece y render
    if (h.componentes) n.componentes = h.componentes;
    if (h.modulosAncho) n.modulosAncho = h.modulosAncho;
    if (h.celosiasPorLado) n.celosiasPorLado = h.celosiasPorLado;
    if (h.altoSuperior) n.altoSuperior = h.altoSuperior;
    // Evento: campos específicos de sonido/video/luces
    if (h.altoCaja) n.altoCaja = h.altoCaja;
    if (h.cajas) n.cajas = h.cajas;
    if (h.tipoLA) n.tipoLA = h.tipoLA;
    if (h.alto) n.alto = h.alto;
    if (h.tipoLuz) n.tipoLuz = h.tipoLuz;
    if (h.consumoW) n.consumoW = h.consumoW;
    if (h.estado) n.estado = h.estado;
    // Pieza importada: copiar datos de render genérico
    Object.assign(n, datosImportados(h));

    if (TIENE_ORIENTACION(h.categoria)) n.orientacion = ori;
    commit([...pz, n]); setPiezasSeleccionadas([n.id]);
  }, [commit]);
  const colocarDiagonalAlzado = useCallback((o, d) => {
    const dx = d.x - o.x, dy = d.y - o.y; if (Math.hypot(dx, dy) < 0.3) return;
    const { piezas: pz, filaZ: z } = stateRef.current;
    const cat = elegirDiagonal(Math.abs(dx), Math.abs(dy));
    const n = { id: uid(), tipoId: cat.id, nombre: cat.nombre, categoria: 'diagonal', ancho: cat.ancho, alto: cat.alto, peso: cat.peso, ref: cat.ref, color: cat.color, x1: o.x, y1: o.y, x2: d.x, y2: d.y, z };
    commit([...pz, n]); setPiezasSeleccionadas([n.id]);
  }, [commit]);

  // Desde la Planta: click da (x, z); la altura la fija alturaY. Las horizontales usan
  // orientacionActiva — 'x' = corre a lo ancho, 'z' = corre en profundidad. Diagonales
  // de alzado no se pueden colocar acá; las de planta sí (colocarDiagonalPlanta).
  const colocarPiezaPlanta = useCallback((h, x, z) => {
    if (h.categoria === 'diagonal') return;
    if (h.categoria === 'diagonalPlanta') return; // 2 clics — usa colocarDiagonalPlanta
    const { piezas: pz, alturaY: y, orientacionActiva: ori } = stateRef.current;
    const n = { id: uid(), tipoId: h.id, nombre: h.nombre, categoria: h.categoria, largo: h.largo, peso: h.peso, ref: h.ref, color: h.color, x: parseFloat(x.toFixed(3)), y, z: parseFloat(z.toFixed(3)) };
    if (h.anchoPlat) n.anchoPlat = h.anchoPlat;
    if (h.desnivel) n.desnivel = h.desnivel;
    if (h.anchoEscalera) n.anchoEscalera = h.anchoEscalera;
    if (h.componentes) n.componentes = h.componentes;
    if (h.modulosAncho) n.modulosAncho = h.modulosAncho;
    if (h.celosiasPorLado) n.celosiasPorLado = h.celosiasPorLado;
    if (h.altoSuperior) n.altoSuperior = h.altoSuperior;
    // Evento: campos específicos de sonido/video/luces
    if (h.altoCaja) n.altoCaja = h.altoCaja;
    if (h.cajas) n.cajas = h.cajas;
    if (h.tipoLA) n.tipoLA = h.tipoLA;
    if (h.alto) n.alto = h.alto;
    if (h.tipoLuz) n.tipoLuz = h.tipoLuz;
    if (h.consumoW) n.consumoW = h.consumoW;
    if (h.estado) n.estado = h.estado;
    // Pieza importada: copiar datos de render genérico
    Object.assign(n, datosImportados(h));

    if (TIENE_ORIENTACION(h.categoria)) n.orientacion = ori;
    commit([...pz, n]); setPiezasSeleccionadas([n.id]);
  }, [commit]);
  const colocarDiagonalPlanta = useCallback((o, d) => {
    const dx = d.x - o.x, dz = d.z - o.z; if (Math.hypot(dx, dz) < 0.3) return;
    const { piezas: pz, alturaY: y } = stateRef.current;
    const cat = elegirDiagonalPlanta(dx, dz);
    const n = { id: uid(), tipoId: cat.id, nombre: cat.nombre, categoria: 'diagonalPlanta', largo: cat.largo, peso: cat.peso, ref: cat.ref, color: cat.color, x1: o.x, z1: o.z, x2: d.x, z2: d.z, y };
    commit([...pz, n]); setPiezasSeleccionadas([n.id]);
  }, [commit]);

  // ---------- Entidades de predio ----------
  // Desde el Alzado la pieza apoya en la cota del clic y queda en la fila activa;
  // desde la Planta apoya en el terreno (y = 0). La cota se edita luego en Propiedades.
  const colocarFestival = useCallback((def, x, y, z) => {
    const { piezas: pz, rotacionActiva: rot } = stateRef.current;
    const n = crearInstanciaFestival(def, { x, y, z, rot }, uid());
    commit([...pz, n]); setPiezasSeleccionadas([n.id]);
  }, [commit]);
  const colocarArea = useCallback((puntos, usoId = 'generica') => {
    const uso = USOS_AREA.find(u => u.id === usoId) ?? USOS_AREA[USOS_AREA.length - 1];
    const n = crearArea(puntos, uso, uid());
    commit([...stateRef.current.piezas, n]); setPiezasSeleccionadas([n.id]);
  }, [commit]);
  const colocarRecorrido = useCallback((puntos, usoId = 'circulacion') => {
    const uso = USOS_RECORRIDO.find(u => u.id === usoId) ?? USOS_RECORRIDO[0];
    const n = crearRecorrido(puntos, uso, uid());
    commit([...stateRef.current.piezas, n]); setPiezasSeleccionadas([n.id]);
  }, [commit]);
  // Devuelve el informe (módulos, largo nominal, remanentes) para mostrarlo al usuario.
  const colocarValladoRecorrido = useCallback((puntos, defId) => {
    const def = definicionPorId(defId);
    const r = valladoPorRecorrido(puntos, def);
    const nuevas = r.modulos.map(m => crearInstanciaFestival(def, { x: m.x, y: 0, z: m.z, rot: m.rot }, uid()));
    if (nuevas.length) { commit([...stateRef.current.piezas, ...nuevas]); setPiezasSeleccionadas(nuevas.map(p => p.id)); }
    return { ...r, nombre: def.nombre };
  }, [commit]);
  // Edición de instancia (Propiedades). `cambios` es un objeto o una función (pieza) => objeto.
  const actualizarPiezas = useCallback((ids, cambios) => {
    const pz = stateRef.current.piezas;
    commit(pz.map(p => ids.includes(p.id) ? { ...p, ...(typeof cambios === 'function' ? cambios(p) : cambios) } : p));
  }, [commit]);
  const rotarSeleccion = useCallback((delta) => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current;
    if (!pz.some(p => sel.includes(p.id) && esFestival(p))) return false;
    commit(pz.map(p => (sel.includes(p.id) && esFestival(p)) ? { ...p, rot: normRot((p.rot ?? 0) + delta) } : p));
    return true;
  }, [commit]);
  const toggleCapa = useCallback((id, clave) => {
    setCapas(prev => ({ ...prev, [id]: { ...prev[id], [clave]: !prev[id]?.[clave] } }));
  }, []);

  const borrarTodo = useCallback(() => {
    if (stateRef.current.piezas.length === 0) return;
    commit([]); setPiezasSeleccionadas([]);
  }, [commit]);

  const nuevoDiseno = useCallback(() => {
    setPiezas([]);
    setHistorial([[]]);
    setHistorialIdx(0);
    setPiezasSeleccionadas([]);
    setClipboard([]);
    setHerramientaActivaRaw(null);
    setDiagonalOrigen(null);
    setDiagonalPlantaOrigen(null);
    setFilas([{ id: 'A', nombre: 'A', z: 0 }]);
    setFilaActivaId('A');
    setAlturaY(0);
    setOrientacionActiva('x');
    setRotacionActiva(0);
    setCapas(normalizarCapas(null, CAPA_IDS));
    setNombreDiseno('Diseño sin título');
    setMensajeGuardado('');
    idbDel('autosave').catch(() => {});
    try { localStorage.removeItem('layher:autosave'); } catch { /* ignorar */ }
  }, []);

  // ---------- Snap: Alzado (plano X-Y, dentro de la fila Z activa) ----------
  const calcularSnapAlzado = useCallback((wx, wy, herramienta, excluirIds = []) => {
    const { piezas, filaZ: z } = stateRef.current;
    const enFila = piezas.filter(p => cruzaFilaZ(p, z));
    const puntosRoseta = [];
    enFila.forEach(p => {
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
    const posX = [...new Set(enFila.filter(p => ES_TIPO_VERTICAL(p.categoria) && !excluirIds.includes(p.id)).map(v => v.x))];
    let mejorDist = SNAP_TOLERANCIA, mejorX = wx, didSnapX = false, snapDesdeX = null, snapModulo = null;
    posX.forEach(px => { const d = Math.abs(wx - px); if (d < mejorDist) { mejorDist = d; mejorX = px; didSnapX = true; snapDesdeX = px; snapModulo = 0; } });
    posX.forEach(px => { MODULOS_STANDARD.forEach(mod => { [px + mod, px - mod].forEach(c => { const d = Math.abs(wx - c); if (d < mejorDist) { mejorDist = d; mejorX = c; didSnapX = true; snapDesdeX = px; snapModulo = mod; } }); }); });
    const snapX = posX.length === 0 ? roundTo(wx, 0.10) : didSnapX ? mejorX : wx;
    // Distancia al vertical más cercano (para mostrar guías)
    let verticalCercanoX = null, distanciaVertical = null;
    if (posX.length > 0) {
      let minD = Infinity;
      posX.forEach(px => { const d = Math.abs(snapX - px); if (d < minD && d > 0.01) { minD = d; verticalCercanoX = px; } });
      if (verticalCercanoX !== null) distanciaVertical = Math.abs(snapX - verticalCercanoX);
    }
    return { x: snapX, y: snapY, snapX: didSnapX, snapY: didSnapY, snapDesdeX, snapModulo, verticalCercanoX, distanciaVertical, posVertX: posX };
  }, []);

  // ---------- Snap: Planta (plano X-Z, todas las filas) ----------
  const calcularSnapPlanta = useCallback((wx, wz, excluirIds = []) => {
    const { piezas, filas } = stateRef.current;
    const posX = [...new Set(piezas.filter(p => ES_TIPO_VERTICAL(p.categoria) && !excluirIds.includes(p.id)).map(v => v.x))];
    // Z snapea a: Z de filas definidas + Z de piezas existentes.
    const posZ = [...new Set([...filas.map(f => f.z), ...piezas.filter(p => !excluirIds.includes(p.id)).map(v => v.z ?? 0)])];
    let mejorDistX = SNAP_TOLERANCIA, mejorX = wx, didSnapX = false, snapDesdeX = null, snapModuloX = null;
    posX.forEach(px => { const d = Math.abs(wx - px); if (d < mejorDistX) { mejorDistX = d; mejorX = px; didSnapX = true; snapDesdeX = px; snapModuloX = 0; } });
    posX.forEach(px => { MODULOS_STANDARD.forEach(mod => { [px + mod, px - mod].forEach(c => { const d = Math.abs(wx - c); if (d < mejorDistX) { mejorDistX = d; mejorX = c; didSnapX = true; snapDesdeX = px; snapModuloX = mod; } }); }); });
    let mejorDistZ = SNAP_TOLERANCIA, mejorZ = wz, didSnapZ = false, snapDesdeZ = null, snapModuloZ = null;
    posZ.forEach(pz => { const d = Math.abs(wz - pz); if (d < mejorDistZ) { mejorDistZ = d; mejorZ = pz; didSnapZ = true; snapDesdeZ = pz; snapModuloZ = 0; } });
    posZ.forEach(pz => { MODULOS_STANDARD.forEach(mod => { [pz + mod, pz - mod].forEach(c => { const d = Math.abs(wz - c); if (d < mejorDistZ) { mejorDistZ = d; mejorZ = c; didSnapZ = true; snapDesdeZ = pz; snapModuloZ = mod; } }); }); });
    const snapX = posX.length === 0 ? roundTo(wx, 0.10) : didSnapX ? mejorX : wx;
    const snapZ = posZ.length === 0 ? roundTo(wz, 0.10) : didSnapZ ? mejorZ : wz;
    // Distancias a verticales más cercanos
    let verticalCercanoX = null, distanciaX = null;
    if (posX.length > 0) { let minD = Infinity; posX.forEach(px => { const d = Math.abs(snapX - px); if (d < minD && d > 0.01) { minD = d; verticalCercanoX = px; } }); if (verticalCercanoX !== null) distanciaX = minD; }
    let verticalCercanoZ = null, distanciaZ = null;
    if (posZ.length > 0) { let minD = Infinity; posZ.forEach(pz => { const d = Math.abs(snapZ - pz); if (d < minD && d > 0.01) { minD = d; verticalCercanoZ = pz; } }); if (verticalCercanoZ !== null) distanciaZ = minD; }
    return { x: snapX, z: snapZ, snapX: didSnapX, snapZ: didSnapZ, snapDesdeX, snapModuloX, snapDesdeZ, snapModuloZ, verticalCercanoX, distanciaX, verticalCercanoZ, distanciaZ, posVertX: posX };
  }, []);

  // ---------- Mover piezas (drag, común a ambas vistas) ----------
  const moverPiezas = useCallback((idsAMover, snapshot, dX, dY) => {
    setPiezas(prev => prev.map(p => {
      if (!idsAMover.includes(p.id)) return p;
      const s = snapshot[p.id];
      if (p.categoria === 'diagonal') return { ...p, x1: s.x1 + dX, y1: s.y1 + dY, x2: s.x2 + dX, y2: s.y2 + dY };
      return { ...p, x: s.x + dX, y: s.y + dY };
    }));
  }, []);
  const moverPiezasZ = useCallback((idsAMover, snapshot, dX, dZ) => {
    setPiezas(prev => prev.map(p => {
      if (!idsAMover.includes(p.id)) return p;
      const s = snapshot[p.id];
      if (p.categoria === 'diagonal') return { ...p, x1: s.x1 + dX, x2: s.x2 + dX, z: s.z + dZ };
      if (p.categoria === 'diagonalPlanta') return { ...p, x1: s.x1 + dX, x2: s.x2 + dX, z1: s.z1 + dZ, z2: s.z2 + dZ };
      return { ...p, x: s.x + dX, z: s.z + dZ };
    }));
  }, []);
  const commitPiezasActuales = useCallback(() => { commit(stateRef.current.piezas); }, [commit]);

  // ---------- Flip ménsulas y escaleras (voltear dirección) ----------
  const FLIP_CATS = new Set(['mensula', 'escalera']);
  const flipMensulas = useCallback(() => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current;
    const volteables = pz.filter(p => sel.includes(p.id) && FLIP_CATS.has(p.categoria));
    if (volteables.length === 0) return;
    commit(pz.map(p => (sel.includes(p.id) && FLIP_CATS.has(p.categoria)) ? { ...p, flip: !p.flip } : p));
  }, [commit]);

  // ---------- Persistencia ----------
  const listarDisenos = useCallback(async () => {
    const list = [];
    const resumen = (d, nombre) => {
      const fecha = d.fecha ? new Date(d.fecha) : null;
      return {
        nombre: d.nombre || nombre,
        fecha,
        fechaCorta: fecha ? fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—',
        cantPiezas: Array.isArray(d.piezas) ? d.piezas.length : 0,
      };
    };
    try {
      const keys = await idbKeys();
      for (const k of keys) {
        if (typeof k === 'string' && k.startsWith('diseno:')) {
          const d = await idbGet(k);
          if (d) list.push(resumen(d, k.slice(7)));
        }
      }
    } catch { /* ignorar */ }
    // Diseños viejos en localStorage que aún no están en IDB
    try {
      const lsKeys = Object.keys(localStorage).filter(k => k.startsWith('layher:disenos:'));
      for (const k of lsKeys) {
        const nombre = k.replace('layher:disenos:', '');
        if (!list.find(l => l.nombre === nombre)) {
          try { list.push(resumen(JSON.parse(localStorage.getItem(k)), nombre)); } catch { /* ignorar */ }
        }
      }
    } catch { /* ignorar */ }
    return list.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
  }, []);
  const guardar = useCallback(async (nombre) => {
    const { piezas: pz, filas: fl, capas: cp } = stateRef.current;
    const payload = { nombre, piezas: pz, filas: fl, capas: cp, fecha: new Date().toISOString(), version: VERSION_DISENO };
    try {
      await idbSet(`diseno:${nombre}`, payload);
      setNombreDiseno(nombre);
      setMensajeGuardado(`✓ ${nombre}`);
      // Respaldo en localStorage (solo diseños chicos)
      try {
        const json = JSON.stringify(payload);
        if (json.length < 4_000_000) localStorage.setItem(`layher:disenos:${nombre}`, json);
      } catch { /* ignorar */ }
    } catch {
      setMensajeGuardado('✗ Error al guardar');
    }
    setTimeout(() => setMensajeGuardado(''), 2500);
  }, []);
  // Aplica un diseño leído (IDB, localStorage o archivo). Proyectos anteriores a 2.1
  // pasan por migrarDiseno, que no reescribe ninguna propiedad existente.
  const aplicarDiseno = useCallback((doc, nombreFallback) => {
    const d = migrarDiseno(doc);
    commit(d.piezas);
    setNombreDiseno(d.nombre || nombreFallback);
    setCapas(normalizarCapas(d.capas, CAPA_IDS));
    if (Array.isArray(d.filas) && d.filas.length) {
      setFilas(d.filas); setFilaActivaId(d.filas[0].id);
    } else {
      const zs = [...new Set(d.piezas.map(p => p.z ?? 0))].sort((a, b) => a - b);
      const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const derivadas = zs.length
        ? zs.map((z, i) => ({ id: letras[i] || `F${i}`, nombre: letras[i] || `F${i}`, z }))
        : [{ id: 'A', nombre: 'A', z: 0 }];
      setFilas(derivadas); setFilaActivaId(derivadas[0].id);
    }
    return d;
  }, [commit]);

  const cargar = useCallback(async (nombre) => {
    try {
      let d = await idbGet(`diseno:${nombre}`);
      if (!d) {
        const raw = localStorage.getItem(`layher:disenos:${nombre}`);
        if (raw) d = JSON.parse(raw);
      }
      if (!d || !Array.isArray(d.piezas)) { setMensajeGuardado('✗ No encontrado'); setTimeout(() => setMensajeGuardado(''), 2500); return; }
      aplicarDiseno(d, nombre);
      setMensajeGuardado(`✓ ${d.nombre || nombre}`);
    } catch {
      setMensajeGuardado('✗ Error al cargar');
    }
    setTimeout(() => setMensajeGuardado(''), 2500);
  }, [aplicarDiseno]);
  const eliminarDiseno = useCallback(async (nombre) => {
    try { await idbDel(`diseno:${nombre}`); } catch { /* ignorar */ }
    try { localStorage.removeItem(`layher:disenos:${nombre}`); } catch { /* ignorar */ }
  }, []);

  // ---------- Guardar/Cargar como archivo (.json) ----------
  const guardarComoArchivo = useCallback(async (nombre) => {
    const payload = {
      nombre: nombre || stateRef.current.nombreDiseno || 'Diseño sin título',
      piezas: stateRef.current.piezas,
      filas: stateRef.current.filas,
      capas: stateRef.current.capas,
      fecha: new Date().toISOString(),
      version: VERSION_DISENO,
      app: 'MasAlto Layout',
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const fileName = `${payload.nombre.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '')}.masalto.json`;

    // Intentar File System Access API (Chrome/Edge)
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            { description: 'MasAlto Layout', accept: { 'application/json': ['.masalto.json', '.json'] } },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setNombreDiseno(payload.nombre);
        setMensajeGuardado(`✓ Archivo guardado`);
        setTimeout(() => setMensajeGuardado(''), 2500);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // usuario canceló
        // Fallback abajo
      }
    }
    // Fallback: descarga directa
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
    setNombreDiseno(payload.nombre);
    setMensajeGuardado(`✓ Archivo descargado`);
    setTimeout(() => setMensajeGuardado(''), 2500);
  }, []);

  const cargarDesdeArchivo = useCallback(async () => {
    // Intentar File System Access API
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [
            { description: 'MasAlto Layout', accept: { 'application/json': ['.masalto.json', '.json'] } },
          ],
          multiple: false,
        });
        const file = await handle.getFile();
        const text = await file.text();
        const d = JSON.parse(text);
        aplicarDiseno(d, 'Importado');
        setMensajeGuardado(`✓ ${d.nombre || 'Archivo cargado'}`);
        setTimeout(() => setMensajeGuardado(''), 2500);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback: input file
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,.masalto.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const d = JSON.parse(text);
        aplicarDiseno(d, 'Importado');
        setMensajeGuardado(`✓ ${d.nombre || 'Archivo cargado'}`);
        setTimeout(() => setMensajeGuardado(''), 2500);
      } catch { setMensajeGuardado('✗ Archivo inválido'); setTimeout(() => setMensajeGuardado(''), 2500); }
    };
    input.click();
  }, [aplicarDiseno]);

  // ---------- Autoguardado (localStorage, cada 30s) ----------
  useEffect(() => {
    // Restaurar al montar: IndexedDB primero, localStorage como respaldo
    (async () => {
      try {
        let d = await idbGet('autosave');
        if (!d) {
          const raw = localStorage.getItem('layher:autosave');
          if (raw) d = JSON.parse(raw);
        }
        if (d && Array.isArray(d.piezas) && d.piezas.length > 0) {
          aplicarDiseno(d, 'Diseño sin título');
          setMensajeGuardado('✓ Restaurado'); setTimeout(() => setMensajeGuardado(''), 2500);
        }
      } catch { /* ignorar */ }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => {
      const { piezas: pz, filas: fl, capas: cp } = stateRef.current;
      if (pz.length === 0) return;
      const data = {
        piezas: pz, filas: fl, capas: cp, nombre: stateRef.current.nombreDiseno || 'Diseño sin título',
        fecha: new Date().toISOString(), version: VERSION_DISENO,
      };
      idbSet('autosave', data).catch(() => {});
      // Respaldo en localStorage (solo diseños chicos)
      try {
        const json = JSON.stringify(data);
        if (json.length < 4_000_000) localStorage.setItem('layher:autosave', json);
      } catch { /* ignorar */ }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // ---------- Atajos de teclado (comunes a ambas vistas) ----------
  useEffect(() => {
    const kd = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        // Con una herramienta de trazo, ⌫ borra el último punto (lo maneja la Planta), no la selección.
        if (!['area', 'recorrido', 'valladoRecorrido'].includes(stateRef.current.herramientaActiva?.categoria)) eliminarSeleccion();
      }
      else if (e.key === 'Escape') { setPiezasSeleccionadas([]); setHerramientaActivaRaw(null); setDiagonalOrigen(null); setDiagonalPlantaOrigen(null); }
      else if (!ctrl && e.key.toLowerCase() === 'r') {
        // Festival: R gira 90° (Shift+R: 15°) la pieza a colocar o la selección. Layher: alterna X/Z.
        e.preventDefault();
        const delta = e.shiftKey ? 15 : 90;
        if (esFestival(stateRef.current.herramientaActiva)) setRotacionActiva(r => normRot(r + delta));
        else if (!rotarSeleccion(delta)) toggleOrientacion();
      }
      else if (ctrl && e.key.toLowerCase() === 'c') { e.preventDefault(); copiar(); }
      else if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicar(); }
      else if (ctrl && e.key.toLowerCase() === 'a') { e.preventDefault(); seleccionarTodo(); }
      else if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((ctrl && e.key.toLowerCase() === 'y') || (ctrl && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [copiar, duplicar, eliminarSeleccion, seleccionarTodo, undo, redo, toggleOrientacion, rotarSeleccion]);

  return {
    piezas, historial, historialIdx, herramientaActiva, setHerramientaActiva,
    piezasSeleccionadas, setPiezasSeleccionadas, diagonalOrigen, setDiagonalOrigen,
    diagonalPlantaOrigen, setDiagonalPlantaOrigen,
    clipboard, filaZ, filas, filaActivaId, filaActiva, setFilaActivaId,
    agregarFila, agregarFilaConDatos, eliminarFila, infoFila, renombrarFila, moverFila,
    alturaY, setAlturaY,
    orientacionActiva, setOrientacionActiva, toggleOrientacion,
    nombreDiseno, setNombreDiseno, mensajeGuardado,
    commit, undo, redo, copiar, pegar, duplicar, eliminarSeleccion, seleccionarTodo, flipMensulas,
    colocarPiezaAlzado, colocarDiagonalAlzado, colocarPiezaPlanta, colocarDiagonalPlanta, borrarTodo, nuevoDiseno,
    calcularSnapAlzado, calcularSnapPlanta, moverPiezas, moverPiezasZ, commitPiezasActuales,
    guardar, cargar, listarDisenos, eliminarDiseno,
    guardarComoArchivo, cargarDesdeArchivo,
    capas, toggleCapa, rotacionActiva, setRotacionActiva,
    colocarFestival, colocarArea, colocarRecorrido, colocarValladoRecorrido, actualizarPiezas, rotarSeleccion,
  };
}
