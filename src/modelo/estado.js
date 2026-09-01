import { useState, useRef, useCallback, useEffect } from 'react';
import { elegirDiagonal, elegirDiagonalPlanta } from '../catalogo/piezas.js';
import {
  MODULOS_STANDARD, ROSETA_STEP, SNAP_TOLERANCIA, SNAP_TOL_DIAGONAL,
  ES_TIPO_VERTICAL, ES_TIPO_HORIZONTAL, TIENE_ORIENTACION,
} from '../catalogo/constantes.js';
import { uid, roundTo, piezaMinX, piezaMinY, piezaMinZ, desplazarPieza, cruzaFilaZ } from './operaciones.js';

/**
 * Estado central del diseño — compartido por TODAS las vistas (Alzado, Planta, ...).
 * Cada pieza vive en un espacio 3D lógico: x (horizontal, común a ambas vistas),
 * y (altura, eje vertical del Alzado), z (profundidad/fila, eje vertical de la Planta).
 * V1.3 no tenía eje Z: todo se creaba en z=0, así que el Alzado existente sigue
 * funcionando igual mientras no se agreguen filas nuevas.
 */
export function useDisenoState() {
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

  const stateRef = useRef({});
  stateRef.current = { piezas, piezasSeleccionadas, clipboard, historialIdx, historial, filaZ, alturaY, orientacionActiva, filas, filaActivaId };

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
    setHistorial(h => { const nh = h.slice(0, stateRef.current.historialIdx + 1); nh.push(np); return nh; });
    setHistorialIdx(i => i + 1);
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
  // El clipboard guarda piezas normalizadas al origen 3D — al pegar se aplica offset
  // según la vista activa (Alzado suma en X+Y, Planta suma en X+Z). Esto arregla el
  // bug de V2.0 inicial: duplicar en Planta movía la copia en altura en vez de en fila.
  const copiar = useCallback(() => {
    const { piezas: pz, piezasSeleccionadas: sel } = stateRef.current;
    const s = pz.filter(p => sel.includes(p.id)); if (s.length === 0) return;
    const minX = Math.min(...s.map(piezaMinX));
    const minY = Math.min(...s.map(piezaMinY));
    const minZ = Math.min(...s.map(piezaMinZ));
    setClipboard(s.map(p => desplazarPieza(p, -minX, -minY, -minZ)));
  }, []);
  const pegar = useCallback((puntoBase, vista = 'alzado') => {
    const { clipboard: cl, piezas: pz } = stateRef.current; if (cl.length === 0) return;
    const bx = roundTo(puntoBase?.x ?? 0, ROSETA_STEP);
    const by = vista === 'alzado' ? Math.max(0, roundTo(puntoBase?.y ?? 0, ROSETA_STEP)) : 0;
    const bz = vista === 'planta' ? roundTo(puntoBase?.z ?? 0, ROSETA_STEP) : 0;
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
    // Techo compuesto: copiar metadata para despiece y render
    if (h.componentes) n.componentes = h.componentes;
    if (h.modulosAncho) n.modulosAncho = h.modulosAncho;
    if (h.celosiasPorLado) n.celosiasPorLado = h.celosiasPorLado;
    if (h.altoSuperior) n.altoSuperior = h.altoSuperior;

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
    if (h.componentes) n.componentes = h.componentes;
    if (h.modulosAncho) n.modulosAncho = h.modulosAncho;
    if (h.celosiasPorLado) n.celosiasPorLado = h.celosiasPorLado;
    if (h.altoSuperior) n.altoSuperior = h.altoSuperior;

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

  const borrarTodo = useCallback(() => {
    if (stateRef.current.piezas.length === 0) return;
    commit([]); setPiezasSeleccionadas([]);
  }, [commit]);

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

  // ---------- Persistencia ----------
  const listarDisenos = useCallback(() => {
    const claves = Object.keys(localStorage).filter(k => k.startsWith('layher:disenos:'));
    return claves.map(k => {
      try {
        const d = JSON.parse(localStorage.getItem(k));
        const fecha = d.fecha ? new Date(d.fecha) : null;
        return {
          nombre: d.nombre || k.replace('layher:disenos:', ''),
          fecha,
          fechaCorta: fecha ? fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—',
          cantPiezas: Array.isArray(d.piezas) ? d.piezas.length : 0,
        };
      } catch { return null; }
    }).filter(Boolean).sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
  }, []);
  const guardar = useCallback((nombre) => {
    try {
      const payload = { nombre, piezas: stateRef.current.piezas, filas: stateRef.current.filas, fecha: new Date().toISOString() };
      localStorage.setItem(`layher:disenos:${nombre}`, JSON.stringify(payload));
      setNombreDiseno(nombre); setMensajeGuardado(`✓ ${nombre}`); setTimeout(() => setMensajeGuardado(''), 2500);
    } catch { setMensajeGuardado('✗ Error'); setTimeout(() => setMensajeGuardado(''), 2500); }
  }, []);
  const cargar = useCallback((nombre) => {
    try {
      const raw = localStorage.getItem(`layher:disenos:${nombre}`);
      if (!raw) { setMensajeGuardado('✗ No encontrado'); setTimeout(() => setMensajeGuardado(''), 2500); return; }
      const d = JSON.parse(raw);
      const piezasNorm = d.piezas.map(p => ({ z: 0, ...p }));
      commit(piezasNorm); setNombreDiseno(d.nombre);
      if (Array.isArray(d.filas) && d.filas.length) {
        setFilas(d.filas); setFilaActivaId(d.filas[0].id);
      } else {
        const zs = [...new Set(piezasNorm.map(p => p.z ?? 0))].sort((a, b) => a - b);
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const derivadas = zs.length
          ? zs.map((z, i) => ({ id: letras[i] || `F${i}`, nombre: letras[i] || `F${i}`, z }))
          : [{ id: 'A', nombre: 'A', z: 0 }];
        setFilas(derivadas); setFilaActivaId(derivadas[0].id);
      }
      setMensajeGuardado(`✓ ${d.nombre}`); setTimeout(() => setMensajeGuardado(''), 2500);
    } catch { setMensajeGuardado('✗ Error'); setTimeout(() => setMensajeGuardado(''), 2500); }
  }, [commit]);
  const eliminarDiseno = useCallback((nombre) => {
    localStorage.removeItem(`layher:disenos:${nombre}`);
  }, []);

  // ---------- Guardar/Cargar como archivo (.json) ----------
  const guardarComoArchivo = useCallback(async (nombre) => {
    const payload = {
      nombre: nombre || stateRef.current.nombreDiseno || 'Diseño sin título',
      piezas: stateRef.current.piezas,
      filas: stateRef.current.filas,
      fecha: new Date().toISOString(),
      version: '2.0',
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
        const piezasNorm = d.piezas.map(p => ({ z: 0, ...p }));
        commit(piezasNorm);
        setNombreDiseno(d.nombre || 'Importado');
        if (Array.isArray(d.filas) && d.filas.length) {
          setFilas(d.filas); setFilaActivaId(d.filas[0].id);
        } else {
          const zs = [...new Set(piezasNorm.map(p => p.z ?? 0))].sort((a, b) => a - b);
          const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const derivadas = zs.length
            ? zs.map((z, i) => ({ id: letras[i] || `F${i}`, nombre: letras[i] || `F${i}`, z }))
            : [{ id: 'A', nombre: 'A', z: 0 }];
          setFilas(derivadas); setFilaActivaId(derivadas[0].id);
        }
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
        const piezasNorm = d.piezas.map(p => ({ z: 0, ...p }));
        commit(piezasNorm);
        setNombreDiseno(d.nombre || 'Importado');
        if (Array.isArray(d.filas) && d.filas.length) {
          setFilas(d.filas); setFilaActivaId(d.filas[0].id);
        } else {
          const zs = [...new Set(piezasNorm.map(p => p.z ?? 0))].sort((a, b) => a - b);
          const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const derivadas = zs.length
            ? zs.map((z, i) => ({ id: letras[i] || `F${i}`, nombre: letras[i] || `F${i}`, z }))
            : [{ id: 'A', nombre: 'A', z: 0 }];
          setFilas(derivadas); setFilaActivaId(derivadas[0].id);
        }
        setMensajeGuardado(`✓ ${d.nombre || 'Archivo cargado'}`);
        setTimeout(() => setMensajeGuardado(''), 2500);
      } catch { setMensajeGuardado('✗ Archivo inválido'); setTimeout(() => setMensajeGuardado(''), 2500); }
    };
    input.click();
  }, [commit]);

  // ---------- Atajos de teclado (comunes a ambas vistas) ----------
  useEffect(() => {
    const kd = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); eliminarSeleccion(); }
      else if (e.key === 'Escape') { setPiezasSeleccionadas([]); setHerramientaActivaRaw(null); setDiagonalOrigen(null); setDiagonalPlantaOrigen(null); }
      else if (!ctrl && e.key.toLowerCase() === 'r') { e.preventDefault(); toggleOrientacion(); }
      else if (ctrl && e.key.toLowerCase() === 'c') { e.preventDefault(); copiar(); }
      else if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicar(); }
      else if (ctrl && e.key.toLowerCase() === 'a') { e.preventDefault(); seleccionarTodo(); }
      else if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((ctrl && e.key.toLowerCase() === 'y') || (ctrl && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [copiar, duplicar, eliminarSeleccion, seleccionarTodo, undo, redo, toggleOrientacion]);

  return {
    piezas, historial, historialIdx, herramientaActiva, setHerramientaActiva,
    piezasSeleccionadas, setPiezasSeleccionadas, diagonalOrigen, setDiagonalOrigen,
    diagonalPlantaOrigen, setDiagonalPlantaOrigen,
    clipboard, filaZ, filas, filaActivaId, filaActiva, setFilaActivaId,
    agregarFila, eliminarFila, infoFila, renombrarFila, moverFila,
    alturaY, setAlturaY,
    orientacionActiva, setOrientacionActiva, toggleOrientacion,
    nombreDiseno, mensajeGuardado,
    commit, undo, redo, copiar, pegar, duplicar, eliminarSeleccion, seleccionarTodo,
    colocarPiezaAlzado, colocarDiagonalAlzado, colocarPiezaPlanta, colocarDiagonalPlanta, borrarTodo,
    calcularSnapAlzado, calcularSnapPlanta, moverPiezas, moverPiezasZ, commitPiezasActuales,
    guardar, cargar, listarDisenos, eliminarDiseno,
    guardarComoArchivo, cargarDesdeArchivo,
  };
}
