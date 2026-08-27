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

export default function LayherEditor() {
  const modelo = useDisenoState();
  const [vista, setVista] = useState('alzado');
  const [mostrarGrilla, setMostrarGrilla] = useState(true);
  const [mostrarCotas, setMostrarCotas] = useState(false);
  const [modoTecnico, setModoTecnico] = useState(false);
  const [modal, setModal] = useState(null); // null | 'guardar' | 'cargar'
  const [modalPDF, setModalPDF] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [confirmar, setConfirmar] = useState(null); // { mensaje, detalle, onConfirmar, label }
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const svgAlzadoRef = useRef(null);
  const svgPlantaRef = useRef(null);
  const setSvgAlzado = useCallback((el) => { svgAlzadoRef.current = el; }, []);
  const setSvgPlanta = useCallback((el) => { svgPlantaRef.current = el; }, []);

  const duplicarEnVista = () => modelo.duplicar(vista);
  const pegarEnVista = (punto) => modelo.pegar(punto, vista);
  const zoomEncuadrar = () => setFitTrigger(t => t + 1);
  const pesoTotal = useMemo(() => modelo.piezas.reduce((s, p) => s + p.peso, 0), [modelo.piezas]);
  const cantPiezas = modelo.piezas.length;

  // Borrar todo con confirmación modal
  const handleBorrarTodo = () => {
    if (modelo.piezas.length === 0) return;
    setConfirmar({
      mensaje: '¿Borrar todo?',
      detalle: `Se eliminarán ${modelo.piezas.length} pieza(s) del diseño. Esta acción se puede deshacer con Ctrl+Z.`,
      onConfirmar: () => { modelo.borrarTodo(); setConfirmar(null); },
      label: 'Borrar todo',
    });
  };

  // Eliminar fila con confirmación modal si tiene piezas
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
      />

      <div className="flex-1 flex overflow-hidden">
        <Paleta herramientaActiva={modelo.herramientaActiva} setHerramientaActiva={modelo.setHerramientaActiva} vista={vista} piezas={modelo.piezas} />

        {vista === 'alzado'
          ? <Alzado modelo={modelo} mostrarGrilla={mostrarGrilla} mostrarCotas={mostrarCotas} modoTecnico={modoTecnico} svgRefCb={setSvgAlzado} fitTrigger={fitTrigger} />
          : <Planta modelo={modelo} mostrarGrilla={mostrarGrilla} mostrarCotas={mostrarCotas} modoTecnico={modoTecnico} svgRefCb={setSvgPlanta} fitTrigger={fitTrigger} />}

        <Despiece
          piezas={modelo.piezas} piezasSeleccionadas={modelo.piezasSeleccionadas}
          setPiezasSeleccionadas={modelo.setPiezasSeleccionadas}
          copiar={modelo.copiar} duplicar={duplicarEnVista} eliminarSeleccion={modelo.eliminarSeleccion}
        />
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
