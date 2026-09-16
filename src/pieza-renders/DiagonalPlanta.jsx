// DiagonalPlanta — diagonal en el plano horizontal (X-Z).
// En ALZADO no se ve (es perpendicular al plano de vista).
// En PLANTA se renderiza inline dentro de PiezaPlanta (src/vistas/Planta.jsx).
// Este componente se registra en el dispatcher de alzado para evitar warnings,
// pero retorna null.
export default function DiagonalPlanta() {
  return null;
}
