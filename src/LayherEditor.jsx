import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CAT_KEYS } from './catalogo/piezas.js';
import { useDisenoState } from './modelo/estado.js';
import Toolbar from './ui/Toolbar.jsx';
import Paleta from './ui/Paleta.jsx';
import Despiece from './ui/Despiece.jsx';
import Alzado from './vistas/Alzado.jsx';
import Planta from './vistas/Planta.jsx';
import ModalGuardarCargar from './ui/ModalGuardarCargar.jsx';
import ModalExportPDF from './ui/ModalExportPDF.jsx';
import ModalConfirmar from './ui/ModalConfirmar.jsx';
import AyudaRapida from './ui/AyudaRapida.jsx';
import { exportarPDF } from './export/pdfExporter.js';

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
}

export default function LayherEditor() {
  const modelo = useDisenoState();
  const isMobile = useIsMobile();
  const [vista, setVista] = useState('alzado');
  const [mostrarGrilla, setMostrarGrilla] = useState(true);
  const [mostrarCotas, setMostrarCotas] = useState(false);
  const [modoTecnico, setModoTecnico] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalPDF, setModalPDF] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [confirmar, setConfirmar] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  // Mobile drawers
  const [paletaAbierta, setPaletaAbierta] = useState(false);
  const [despieceAbierto, setDespieceAbierto] = useState(false);

  const svgAlzadoRef = useRef(null);
  const svgPlantaRef = useRef(null);
  const setSvgAlzado = useCallback((el) => { svgAlzadoRef.current = el; }, []);
  const setSvgPlanta = useCallback((el) => { svgPlantaRef.current = el; }, []);

  const duplicarEnVista = () => modelo.duplicar(vista);
  const pegarEnVista = (punto) => modelo.pegar(punto, vista);
  const zoomEncuadrar = () => setFitTrigger(t => t + 1);
  const pesoTotal = useMemo(() => modelo.piezas.reduce((s, p) => s + p.peso, 0), [modelo.piezas]);
  const cantPiezas = modelo.piezas.length;

  // Auto-cerrar paleta al elegir pieza en móvil
  const setHerramientaMobile = useCallback((h) => {
    modelo.setHerramientaActiva(h);
    if (isMobile && h) setPaletaAbierta(false);
  }, [isMobile, modelo.setHerramientaActiva]);

  const handleBorrarTodo = () => {
    if (modelo.piezas.length === 0) return;
    setConfirmar({
      mensaje: '¿Borrar todo?',
      detalle: `Se eliminarán ${modelo.piezas.length} pieza(s) del diseño. Esta acción se puede deshacer con Ctrl+Z.`,
      onConfirmar: () => { modelo.borrarTodo(); setConfirmar(null); },
      label: 'Borrar todo',
    });
  };

  const handleEliminarFila = (id) => {
    if (modelo.filas.length <= 1) return;
    const info = modelo.infoFila(id);
    if (!info) return;
    if (info.cantPiezas > 0) {
      setConfirmar({
        mensaje: `¿Eliminar fila ${info.fila.nombre}?`,
        detalle: `Tiene ${info.cantPiezas} pieza(s) en Z=${info.fila.z}m. Se quita del listado pero las piezas quedan en ese Z.`,
        onConfirmar: () => { modelo.eliminarFila(id); setConfirmar(null); },
        label: 'Eliminar fila',
      });
    } else {
      modelo.eliminarFila(id);
    }
  };

  useEffect(() => {
    const h = modelo.herramientaActiva;
    if (!h) return;
    const sec = CAT_KEYS.find(ck => ck.cat === h.categoria);
    if (sec?.vistas && !sec.vistas.includes(vista)) modelo.setHerramientaActiva(null);
  }, [vista, modelo.herramientaActiva]);

  const handleExportPDF = async (datosProyecto) => {
    setExportando(true);
    try {
      await exportarPDF({
        nombreDiseno: datosProyecto.nombre || modelo.nombreDiseno,
        piezas: modelo.piezas,
        filas: modelo.filas,
        svgAlzado: svgAlzadoRef.current,
        svgPlanta: svgPlantaRef.current,
        datosProyecto,
      });
      setModalPDF(false);
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert('Error al exportar PDF: ' + err.message);
    }
    setExportando(false);
  };

  return (
    <div style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }} className="w-full h-screen flex flex-col bg-gray-100">
      <Toolbar
        vista={vista} setVista={setVista}
        nombreDiseno={modelo.nombreDiseno} mensajeGuardado={modelo.mensajeGuardado}
        guardar={() => setModal('guardar')} cargar={() => setModal('cargar')}
        exportarPDF={() => setModalPDF(true)} exportando={exportando}
        zoomEncuadrar={zoomEncuadrar}
        undo={modelo.undo} redo={modelo.redo}
        historialIdx={modelo.historialIdx} historialLen={modelo.historial.length}
        copiar={modelo.copiar} pegar={pegarEnVista} duplicar={duplicarEnVista}
        seleccionarTodo={modelo.seleccionarTodo}
        piezasSeleccionadas={modelo.piezasSeleccionadas} clipboard={modelo.clipboard}
        mostrarGrilla={mostrarGrilla} setMostrarGrilla={setMostrarGrilla}
        borrarTodo={handleBorrarTodo}
        herramientaActiva={modelo.herramientaActiva} diagonalOrigen={modelo.diagonalOrigen}
        diagonalPlantaOrigen={modelo.diagonalPlantaOrigen}
        filas={modelo.filas} filaActivaId={modelo.filaActivaId} setFilaActivaId={modelo.setFilaActivaId}
        agregarFila={modelo.agregarFila} eliminarFila={handleEliminarFila}
        renombrarFila={modelo.renombrarFila} moverFila={modelo.moverFila}
        alturaY={modelo.alturaY} setAlturaY={modelo.setAlturaY}
        orientacionActiva={modelo.orientacionActiva} toggleOrientacion={modelo.toggleOrientacion}
        mostrarCotas={mostrarCotas} setMostrarCotas={setMostrarCotas}
        modoTecnico={modoTecnico} setModoTecnico={setModoTecnico}
        pesoTotal={pesoTotal} cantPiezas={cantPiezas}
        onAyuda={() => setMostrarAyuda(true)}
        isMobile={isMobile}
        onTogglePaleta={() => setPaletaAbierta(p => !p)}
        onToggleDespiece={() => setDespieceAbierto(d => !d)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop: paleta fija. Mobile: drawer overlay */}
        {isMobile ? (
          <>
            {paletaAbierta && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setPaletaAbierta(false)} />}
            <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-200 overflow-hidden ${paletaAbierta ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex items-center justify-between px-3 py-2 bg-black text-white border-b border-red-600">
                <span className="text-sm font-bold">Catálogo</span>
                <button onClick={() => setPaletaAbierta(false)} className="text-white/70 hover:text-white text-lg px-2">✕</button>
              </div>
              <div className="overflow-y-auto overflow-x-hidden h-[calc(100%-44px)]">
                <Paleta herramientaActiva={modelo.herramientaActiva} setHerramientaActiva={setHerramientaMobile} vista={vista} piezas={modelo.piezas} embedded />
              </div>
            </div>
          </>
        ) : (
          <Paleta herramientaActiva={modelo.herramientaActiva} setHerramientaActiva={modelo.setHerramientaActiva} vista={vista} piezas={modelo.piezas} />
        )}

        {/* Canvas — siempre full flex-1 */}
        {vista === 'alzado'
          ? <Alzado modelo={modelo} mostrarGrilla={mostrarGrilla} mostrarCotas={mostrarCotas} modoTecnico={modoTecnico} svgRefCb={setSvgAlzado} fitTrigger={fitTrigger} />
          : <Planta modelo={modelo} mostrarGrilla={mostrarGrilla} mostrarCotas={mostrarCotas} modoTecnico={modoTecnico} svgRefCb={setSvgPlanta} fitTrigger={fitTrigger} />}

        {/* Desktop: despiece fijo. Mobile: drawer overlay */}
        {isMobile ? (
          <>
            {despieceAbierto && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDespieceAbierto(false)} />}
            <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-200 overflow-hidden ${despieceAbierto ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="flex items-center justify-between px-3 py-2 bg-black text-white border-b border-red-600">
                <span className="text-sm font-bold">Despiece</span>
                <button onClick={() => setDespieceAbierto(false)} className="text-white/70 hover:text-white text-lg px-2">✕</button>
              </div>
              <div className="overflow-y-auto overflow-x-hidden h-[calc(100%-44px)]">
                <Despiece
                  piezas={modelo.piezas} piezasSeleccionadas={modelo.piezasSeleccionadas}
                  setPiezasSeleccionadas={modelo.setPiezasSeleccionadas}
                  copiar={modelo.copiar} duplicar={duplicarEnVista} eliminarSeleccion={modelo.eliminarSeleccion}
                  isMobile
                />
              </div>
            </div>
          </>
        ) : (
          <Despiece
            piezas={modelo.piezas} piezasSeleccionadas={modelo.piezasSeleccionadas}
            setPiezasSeleccionadas={modelo.setPiezasSeleccionadas}
            copiar={modelo.copiar} duplicar={duplicarEnVista} eliminarSeleccion={modelo.eliminarSeleccion}
          />
        )}

        {/* Mobile FABs */}
        {isMobile && (
          <>
            {/* Pieza activa badge */}
            {modelo.herramientaActiva && (
              <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <span>✦ {modelo.herramientaActiva.nombre || modelo.herramientaActiva.id}</span>
                <button onClick={() => modelo.setHerramientaActiva(null)} className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">✕</button>
              </div>
            )}
            {/* Bottom bar with FABs */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-300 px-3 py-2 flex items-center justify-between safe-area-bottom">
              <button onClick={() => setPaletaAbierta(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-xs font-bold">
                📦 Piezas
              </button>
              <div className="flex items-center gap-1">
                <button onClick={modelo.undo} disabled={modelo.historialIdx === 0}
                  className="p-2 bg-gray-100 rounded-lg border border-gray-300 disabled:opacity-30 text-sm">↩</button>
                <button onClick={modelo.redo} disabled={modelo.historialIdx >= modelo.historial.length - 1}
                  className="p-2 bg-gray-100 rounded-lg border border-gray-300 disabled:opacity-30 text-sm">↪</button>
                <button onClick={modelo.eliminarSeleccion} disabled={modelo.piezasSeleccionadas.length === 0}
                  className="p-2 bg-gray-100 rounded-lg border border-gray-300 disabled:opacity-30 text-sm">🗑</button>
              </div>
              <button onClick={() => setDespieceAbierto(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-xs font-bold">
                📋 {cantPiezas > 0 ? `${cantPiezas} pzas` : 'Despiece'}
              </button>
            </div>
          </>
        )}
      </div>

      {modal && (
        <ModalGuardarCargar
          modo={modal}
          nombreActual={modelo.nombreDiseno}
          listarDisenos={modelo.listarDisenos}
          onGuardar={(n) => { modelo.guardar(n); setModal(null); }}
          onCargar={(n) => { modelo.cargar(n); setModal(null); setTimeout(zoomEncuadrar, 100); }}
          onEliminar={modelo.eliminarDiseno}
          onCerrar={() => setModal(null)}
        />
      )}

      {modalPDF && (
        <ModalExportPDF
          nombreActual={modelo.nombreDiseno}
          onExportar={handleExportPDF}
          onCerrar={() => setModalPDF(false)}
          exportando={exportando}
        />
      )}

      <AyudaRapida forzar={mostrarAyuda} onCerrar={() => setMostrarAyuda(false)} />

      {confirmar && (
        <ModalConfirmar
          mensaje={confirmar.mensaje}
          detalle={confirmar.detalle}
          onConfirmar={confirmar.onConfirmar}
          onCancelar={() => setConfirmar(null)}
          labelConfirmar={confirmar.label}
        />
      )}
    </div>
  );
}
