import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ES_TIPO_VERTICAL, ES_TIPO_HORIZONTAL } from '../catalogo/constantes.js';

/**
 * Vista de Corte Transversal — plano Y (altura) vs Z (profundidad/fila).
 * Muestra una sección a una posición X dada, con todas las filas visibles.
 *
 * Lo que se ve en un corte:
 *  - Verticales que pasan por ese X → círculo (sección del tubo Ø48.3mm)
 *  - Horizontales en eje X que cruzan ese X → círculo (perpendiculares al corte)
 *  - Horizontales en eje Z que están en ese X → línea horizontal (corren en profundidad)
 *  - Plataformas en ese X → rectángulo (ancho = largo en Z si orientación z, o anchoPlat)
 *  - Diagonales que cruzan ese X → rombo/punto
 */
export default function VistaCorte({ piezas, filas, posX, zoom: zoomProp, modoTecnico, dimW, dimH }) {
  const W = dimW || 400;
  const H = dimH || 500;
  const zoom = zoomProp || 80;

  // Encontrar rango Y y Z para centrar
  const { piezasCorte, zMin, zMax, yMin, yMax } = useMemo(() => {
    const tol = 0.05; // tolerancia 5cm para "pasar por X"
    const resultado = [];

    piezas.forEach(p => {
      if (p.categoria === 'diagonal' || p.categoria === 'diagonalPlanta') return; // skip diags por ahora

      const z = p.z ?? 0;

      if (ES_TIPO_VERTICAL(p.categoria)) {
        // Vertical en posX ± tol
        if (Math.abs(p.x - posX) <= tol) {
          resultado.push({ tipo: 'vertical', z, yBase: p.y, yTop: p.y + p.largo, pieza: p });
        }
      } else if (ES_TIPO_HORIZONTAL(p.categoria)) {
        if (p.orientacion === 'z') {
          // Horizontal en Z: está en X=p.x, corre en Z desde p.z hasta p.z+largo
          if (Math.abs(p.x - posX) <= tol) {
            resultado.push({ tipo: 'horizontalZ', z0: z, z1: z + p.largo, y: p.y, pieza: p });
          }
        } else {
          // Horizontal en X: corre de p.x a p.x+largo, pasa por posX si posX está en rango
          if (posX >= p.x - tol && posX <= p.x + p.largo + tol) {
            if (p.categoria === 'plataforma') {
              resultado.push({ tipo: 'plataforma', z, y: p.y, ancho: p.anchoPlat || 0.32, pieza: p });
            } else {
              resultado.push({ tipo: 'horizontalX', z, y: p.y, pieza: p });
            }
          }
        }
      }
    });

    // Calcular bounds
    const zs = [], ys = [0];
    resultado.forEach(r => {
      if (r.z !== undefined) zs.push(r.z);
      if (r.z0 !== undefined) { zs.push(r.z0); zs.push(r.z1); }
      if (r.yBase !== undefined) { ys.push(r.yBase); ys.push(r.yTop); }
      if (r.y !== undefined) ys.push(r.y);
    });
    // Incluir todas las filas en el rango Z
    filas.forEach(f => zs.push(f.z));

    return {
      piezasCorte: resultado,
      zMin: zs.length ? Math.min(...zs) : 0,
      zMax: zs.length ? Math.max(...zs) : 2.57,
      yMin: Math.min(...ys),
      yMax: Math.max(...ys, 2),
    };
  }, [piezas, filas, posX]);

  // Transformación mundo → pantalla: Z horizontal, Y vertical (invertido)
  const padM = 1.5; // margen en metros
  const rangoZ = Math.max(zMax - zMin + padM * 2, 3);
  const rangoY = Math.max(yMax - yMin + padM * 2, 3);
  const escala = Math.min(W / rangoZ, H / rangoY) * 0.85;
  const oZ = zMin - padM;
  const oY = yMin - padM * 0.5;

  const toS = (z, y) => ({
    x: (z - oZ) * escala + (W - rangoZ * escala) / 2,
    y: H - (y - oY) * escala - (H - rangoY * escala) / 2,
  });

  const tubeR = Math.max(2, escala * 0.024); // radio visual del tubo (48.3mm ≈ 0.024m radio)
  const fontSize = Math.max(8, Math.min(11, escala * 0.08));

  const colorVert = modoTecnico ? '#333' : '#1e40af';
  const colorHorizO = modoTecnico ? '#555' : '#059669';
  const colorPlat = modoTecnico ? '#444' : '#7f1d1d';
  const colorHorizZ = modoTecnico ? '#555' : '#059669';

  return (
    <svg width={W} height={H} style={{ background: '#fafafa', borderRadius: 4 }}>
      {/* Título */}
      <text x={W / 2} y={16} textAnchor="middle" fontSize="12" fontWeight="bold"
        fontFamily="monospace" fill="#333">
        Corte en X = {posX.toFixed(2)}m
      </text>

      {/* Grilla de fondo */}
      {(() => {
        const lines = [];
        const step = escala > 60 ? 0.5 : 1;
        for (let z = Math.floor((zMin - padM) / step) * step; z <= zMax + padM; z += step) {
          const p1 = toS(z, yMin - padM);
          const p2 = toS(z, yMax + padM);
          lines.push(<line key={`gz${z}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e8eaed" strokeWidth="0.3" />);
        }
        for (let y = Math.floor((yMin - padM) / step) * step; y <= yMax + padM; y += step) {
          const p1 = toS(zMin - padM, y);
          const p2 = toS(zMax + padM, y);
          lines.push(<line key={`gy${y}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e8eaed" strokeWidth="0.3" />);
        }
        return <g>{lines}</g>;
      })()}

      {/* Línea de suelo */}
      {(() => {
        const p1 = toS(zMin - padM, 0);
        const p2 = toS(zMax + padM, 0);
        return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeWidth="1.5" />;
      })()}

      {/* Etiquetas de filas */}
      {filas.map(f => {
        const p = toS(f.z, -0.3);
        return (
          <g key={f.id}>
            <line x1={p.x} y1={toS(f.z, yMin - 0.2).y} x2={p.x} y2={toS(f.z, yMax + 0.5).y}
              stroke="#E30613" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
            <text x={p.x} y={p.y} textAnchor="middle" fontSize={fontSize + 1} fontWeight="bold"
              fontFamily="monospace" fill="#E30613">{f.nombre}</text>
          </g>
        );
      })}

      {/* Plataformas (rectángulos) */}
      {piezasCorte.filter(r => r.tipo === 'plataforma').map((r, i) => {
        const p = toS(r.z, r.y);
        const anchoScreen = r.ancho * escala;
        const altoScreen = Math.max(2, escala * 0.03); // grosor visual ~3cm
        return (
          <rect key={`plat-${i}`} x={p.x - anchoScreen / 2} y={p.y - altoScreen}
            width={anchoScreen} height={altoScreen}
            fill={colorPlat} opacity="0.6" stroke={colorPlat} strokeWidth="0.5" />
        );
      })}

      {/* Horizontales en Z (líneas que corren en profundidad) */}
      {piezasCorte.filter(r => r.tipo === 'horizontalZ').map((r, i) => {
        const p1 = toS(r.z0, r.y);
        const p2 = toS(r.z1, r.y);
        const cat = r.pieza.categoria;
        const sw = cat === 'vigaPuente' ? 2.5 : cat === 'barandilla' ? 1 : 1.5;
        const dash = cat === 'barandilla' ? '3 2' : 'none';
        const c = cat === 'vigaPuente' ? (modoTecnico ? '#444' : '#b45309') : colorHorizZ;
        return (
          <line key={`hz-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={c} strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" />
        );
      })}

      {/* Horizontales en X (perpendiculares al corte → punto/círculo) */}
      {piezasCorte.filter(r => r.tipo === 'horizontalX').map((r, i) => {
        const p = toS(r.z, r.y);
        const cat = r.pieza.categoria;
        const c = cat === 'vigaPuente' ? (modoTecnico ? '#444' : '#b45309')
          : cat === 'barandilla' ? (modoTecnico ? '#555' : '#0891b2')
          : colorHorizO;
        const rad = cat === 'vigaPuente' ? tubeR * 1.3 : tubeR;
        return (
          <circle key={`hx-${i}`} cx={p.x} cy={p.y} r={rad}
            fill={c} stroke="#fff" strokeWidth="0.5" opacity="0.8" />
        );
      })}

      {/* Verticales (sección del tubo) */}
      {piezasCorte.filter(r => r.tipo === 'vertical').map((r, i) => {
        const pBase = toS(r.z, r.yBase);
        const pTop = toS(r.z, r.yTop);
        return (
          <g key={`vert-${i}`}>
            {/* Línea del vertical (opcional: muestra la altura) */}
            <line x1={pBase.x} y1={pBase.y} x2={pTop.x} y2={pTop.y}
              stroke={colorVert} strokeWidth="2" strokeLinecap="round" />
            {/* Círculo de sección en base y top */}
            <circle cx={pBase.x} cy={pBase.y} r={tubeR * 1.5}
              fill={colorVert} stroke="#fff" strokeWidth="1" />
            <circle cx={pTop.x} cy={pTop.y} r={tubeR * 1.5}
              fill={colorVert} stroke="#fff" strokeWidth="1" />
          </g>
        );
      })}

      {/* Cotas Y a la izquierda */}
      {(() => {
        const ys = [0, ...new Set(piezasCorte.filter(r => r.tipo === 'vertical').flatMap(r => [r.yBase, r.yTop]))];
        const unique = [...new Set(ys.map(y => parseFloat(y.toFixed(3))))].sort((a, b) => a - b);
        if (unique.length < 2) return null;
        const xLine = toS(zMin - padM + 0.2, 0).x;
        return unique.slice(0, -1).map((y, i) => {
          const y2 = unique[i + 1];
          const p1 = toS(zMin - padM, y);
          const p2s = toS(zMin - padM, y2);
          const dist = (y2 - y).toFixed(2) + 'm';
          const midY = (p1.y + p2s.y) / 2;
          return (
            <g key={`cota-${i}`} opacity="0.7">
              <line x1={xLine} y1={p1.y} x2={xLine} y2={p2s.y} stroke="#6366f1" strokeWidth="0.8" />
              <line x1={xLine - 3} y1={p1.y} x2={xLine + 3} y2={p1.y} stroke="#6366f1" strokeWidth="0.8" />
              <line x1={xLine - 3} y1={p2s.y} x2={xLine + 3} y2={p2s.y} stroke="#6366f1" strokeWidth="0.8" />
              <text x={xLine - 4} y={midY + 3} textAnchor="end" fontSize={fontSize - 1}
                fontFamily="monospace" fill="#6366f1">{dist}</text>
            </g>
          );
        });
      })()}

      {/* Cotas Z en el suelo */}
      {(() => {
        if (filas.length < 2) return null;
        const sortedFilas = [...filas].sort((a, b) => a.z - b.z);
        const yLine = toS(0, -0.6).y;
        return sortedFilas.slice(0, -1).map((f, i) => {
          const f2 = sortedFilas[i + 1];
          const p1 = toS(f.z, 0);
          const p2 = toS(f2.z, 0);
          const dist = (f2.z - f.z).toFixed(2) + 'm';
          const midX = (p1.x + p2.x) / 2;
          return (
            <g key={`cotaz-${i}`} opacity="0.7">
              <line x1={p1.x} y1={yLine} x2={p2.x} y2={yLine} stroke="#6366f1" strokeWidth="0.8" />
              <line x1={p1.x} y1={yLine - 3} x2={p1.x} y2={yLine + 3} stroke="#6366f1" strokeWidth="0.8" />
              <line x1={p2.x} y1={yLine - 3} x2={p2.x} y2={yLine + 3} stroke="#6366f1" strokeWidth="0.8" />
              <text x={midX} y={yLine + fontSize + 2} textAnchor="middle" fontSize={fontSize - 1}
                fontFamily="monospace" fill="#6366f1">{dist}</text>
            </g>
          );
        });
      })()}

      {/* Leyenda */}
      <text x={8} y={H - 8} fontSize="9" fill="#999" fontFamily="monospace">
        Vista Y-Z · {piezasCorte.length} elementos
      </text>
    </svg>
  );
}
