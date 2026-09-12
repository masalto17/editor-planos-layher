import { useMemo } from 'react';
import { ES_TIPO_HORIZONTAL } from '../catalogo/constantes.js';

/**
 * Vista de Corte Transversal — plano Y (altura) vs Z (profundidad/fila).
 * Muestra una sección a una posición X dada, con todas las filas visibles.
 *
 * Lo que se ve en un corte:
 *  - Verticales que pasan por ese X → línea vertical con rosetas + sección circular
 *  - Horizontales en eje X que cruzan ese X → círculo (perpendiculares al corte)
 *  - Horizontales en eje Z que están en ese X → línea horizontal (corren en profundidad)
 *  - Plataformas en ese X → rectángulo achurado (ancho = largo en Z si orientación z, o anchoPlat)
 *  - Diagonales que cruzan ese X → rombo/punto
 *  - Bases/husillos → bajo el suelo con placa
 *  - Collarines → rectángulo en base del vertical
 */
export default function VistaCorte({ piezas, filas, posX, zoom: zoomProp, modoTecnico, dimW, dimH }) {
  const W = dimW || 500;
  const H = dimH || 420;

  const { piezasCorte, zMin, zMax, yMin, yMax } = useMemo(() => {
    const tol = 0.05;
    const resultado = [];

    piezas.forEach(p => {
      const z = p.z ?? 0;

      // Verticales
      if (p.categoria === 'vertical') {
        if (Math.abs(p.x - posX) <= tol) {
          resultado.push({ tipo: 'vertical', z, yBase: p.y, yTop: p.y + p.largo, pieza: p });
        }
      }
      // Bases (husillos)
      else if (p.categoria === 'base') {
        if (Math.abs(p.x - posX) <= tol) {
          resultado.push({ tipo: 'base', z, y: p.y, largo: p.largo, pieza: p });
        }
      }
      // Collarines
      else if (p.categoria === 'collarin') {
        if (Math.abs(p.x - posX) <= tol) {
          resultado.push({ tipo: 'collarin', z, y: p.y, pieza: p });
        }
      }
      // Diagonales
      else if (p.categoria === 'diagonal') {
        const x1 = p.x, x2 = p.x2 ?? p.x;
        if ((posX >= Math.min(x1, x2) - tol) && (posX <= Math.max(x1, x2) + tol)) {
          const t = x2 !== x1 ? (posX - x1) / (x2 - x1) : 0;
          const y1 = p.y, y2 = p.y2 ?? p.y;
          const yInterp = y1 + t * (y2 - y1);
          resultado.push({ tipo: 'diagonal', z, y: yInterp, pieza: p });
        }
      }
      // Horizontales y similares
      else if (ES_TIPO_HORIZONTAL(p.categoria)) {
        if (p.orientacion === 'z') {
          if (Math.abs(p.x - posX) <= tol) {
            resultado.push({ tipo: 'horizontalZ', z0: z, z1: z + p.largo, y: p.y, pieza: p });
          }
        } else {
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

    // Bounds
    const zs = [], ys = [0];
    resultado.forEach(r => {
      if (r.z !== undefined) zs.push(r.z);
      if (r.z0 !== undefined) { zs.push(r.z0); zs.push(r.z1); }
      if (r.yBase !== undefined) { ys.push(r.yBase); ys.push(r.yTop); }
      if (r.y !== undefined) ys.push(r.y);
      if (r.tipo === 'base') ys.push(r.y - r.largo);
    });
    filas.forEach(f => zs.push(f.z));

    return {
      piezasCorte: resultado,
      zMin: zs.length ? Math.min(...zs) : 0,
      zMax: zs.length ? Math.max(...zs) : 2.57,
      yMin: Math.min(...ys, -0.3),
      yMax: Math.max(...ys, 2),
    };
  }, [piezas, filas, posX]);

  // ─── Transformación mundo → pantalla ───
  const padZ = 0.8;
  const padYBot = 0.6;
  const padYTop = 0.4;
  const rangoZ = Math.max(zMax - zMin + padZ * 2, 1.5);
  const rangoY = Math.max(yMax - yMin + padYBot + padYTop, 2);

  const headerH = 0;
  const legendH = 32; // espacio para leyenda inferior
  const cotaMargenIzq = 55;
  const cotaMargenBot = 35;
  const areaW = W - cotaMargenIzq - 20;
  const areaH = H - headerH - cotaMargenBot - legendH - 10;

  const escala = Math.min(areaW / rangoZ, areaH / rangoY) * 0.92;
  const oZ = zMin - padZ;
  const oY = yMin - padYBot;

  const drawW = rangoZ * escala;
  const drawH = rangoY * escala;
  const offX = cotaMargenIzq + (areaW - drawW) / 2;
  const offY = (areaH - drawH) / 2;

  const toS = (z, y) => ({
    x: offX + (z - oZ) * escala,
    y: headerH + offY + drawH - (y - oY) * escala,
  });

  const m2px = m => m * escala;
  const tubeR = Math.max(3, m2px(0.024));
  const rosetaR = Math.max(2, tubeR * 0.6);
  const fontSize = Math.max(9, Math.min(12, escala * 0.1));

  // ─── Colores ───
  const col = modoTecnico ? {
    vert: '#222', horizO: '#444', horizZ: '#444', plat: '#333', vp: '#333',
    bar: '#555', base: '#333', coll: '#444', diag: '#444', suelo: '#000',
    cota: '#333', grid: '#ddd', fila: '#666', roseta: '#000', rod: '#444',
  } : {
    vert: '#1e40af', horizO: '#059669', horizZ: '#059669', plat: '#7f1d1d',
    vp: '#b45309', bar: '#0891b2', base: '#78350f', coll: '#451a03',
    diag: '#7c3aed', suelo: '#374151', cota: '#4f46e5', grid: '#f0f0f0',
    fila: '#E30613', roseta: '#111', rod: '#92400e',
  };

  const sueloY = toS(0, 0).y;

  // ─── Conteo para leyenda ───
  const counts = useMemo(() => {
    const c = { vertical: 0, horizontalX: 0, horizontalZ: 0, plataforma: 0, diagonal: 0, base: 0, collarin: 0 };
    piezasCorte.forEach(r => {
      if (r.tipo === 'vertical') c.vertical++;
      else if (r.tipo === 'horizontalX') c.horizontalX++;
      else if (r.tipo === 'horizontalZ') c.horizontalZ++;
      else if (r.tipo === 'plataforma') c.plataforma++;
      else if (r.tipo === 'diagonal') c.diagonal++;
      else if (r.tipo === 'base') c.base++;
      else if (r.tipo === 'collarin') c.collarin++;
    });
    return c;
  }, [piezasCorte]);

  return (
    <svg width={W} height={H} style={{ borderRadius: 4 }} className="bg-white">
      <defs>
        {/* Achurado de suelo */}
        <pattern id="hatch-suelo" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={col.suelo} strokeWidth="0.5" opacity="0.3" />
        </pattern>
        {/* Achurado plataforma */}
        <pattern id="hatch-plat" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={col.plat} strokeWidth="0.4" opacity="0.4" />
        </pattern>
        {/* Flechas cotas */}
        <marker id="corte-arrow-up" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
          <path d="M0,6 L3,0 L6,6" fill="none" stroke={col.cota} strokeWidth="1" />
        </marker>
        <marker id="corte-arrow-down" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
          <path d="M0,0 L3,6 L6,0" fill="none" stroke={col.cota} strokeWidth="1" />
        </marker>
        {/* Gradiente para fondo del corte (sutil) */}
        <linearGradient id="corte-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>

      {/* Fondo sutil */}
      <rect x="0" y="0" width={W} height={H} fill="url(#corte-bg)" rx="4" />

      {/* ─── Grilla de fondo ─── */}
      {(() => {
        const lines = [];
        const step = escala > 50 ? 0.5 : 1;
        for (let z = Math.floor(oZ / step) * step; z <= zMax + padZ; z += step) {
          const p1 = toS(z, yMin - padYBot);
          const p2 = toS(z, yMax + padYTop);
          lines.push(<line key={`gz${z}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={col.grid} strokeWidth="0.5" />);
        }
        for (let y = Math.floor(oY / step) * step; y <= yMax + padYTop; y += step) {
          const p1 = toS(zMin - padZ, y);
          const p2 = toS(zMax + padZ, y);
          const isGround = Math.abs(y) < 0.001;
          if (!isGround) lines.push(<line key={`gy${y}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={col.grid} strokeWidth={y % 1 === 0 ? "0.8" : "0.5"} />);
        }
        return <g>{lines}</g>;
      })()}

      {/* ─── Suelo: línea gruesa + achurado debajo ─── */}
      {(() => {
        const p1 = toS(zMin - padZ, 0);
        const p2 = toS(zMax + padZ, 0);
        const pBot = toS(zMin - padZ, yMin - padYBot);
        return (
          <g>
            <rect x={p1.x} y={p1.y} width={p2.x - p1.x} height={pBot.y - p1.y}
              fill="url(#hatch-suelo)" />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={col.suelo} strokeWidth="2.5" />
            {/* Etiqueta nivel ±0.00 */}
            <text x={p1.x - 4} y={p1.y + 3} textAnchor="end"
              fontSize={fontSize - 1} fontFamily="monospace" fill={col.suelo} fontWeight="bold">
              ±0.00
            </text>
          </g>
        );
      })()}

      {/* ─── Ejes de filas (líneas verticales punteadas + círculo con letra) ─── */}
      {filas.map(f => {
        const pTop = toS(f.z, yMax + padYTop * 0.5);
        const pBot = toS(f.z, -0.15);
        const pLabel = toS(f.z, -0.35);
        return (
          <g key={`fila-${f.id}`}>
            <line x1={pTop.x} y1={pTop.y} x2={pBot.x} y2={pBot.y}
              stroke={col.fila} strokeWidth="0.8" strokeDasharray="6 3" opacity="0.4" />
            {/* Círculo con letra de fila */}
            <circle cx={pLabel.x} cy={pLabel.y} r={fontSize * 0.85}
              fill="white" stroke={col.fila} strokeWidth="1.5" />
            <text x={pLabel.x} y={pLabel.y + fontSize * 0.35} textAnchor="middle"
              fontSize={fontSize} fontWeight="bold" fontFamily="monospace" fill={col.fila}>
              {f.nombre}
            </text>
          </g>
        );
      })}

      {/* ─── Bases (husillos) — mejoradas ─── */}
      {piezasCorte.filter(r => r.tipo === 'base').map((r, i) => {
        const pTop = toS(r.z, r.y);
        const pBot = toS(r.z, r.y - r.largo);
        const placaW = m2px(0.15);
        const placaH = Math.max(3, m2px(0.02));
        const tubeW = Math.max(2, m2px(0.015));
        return (
          <g key={`base-${i}`}>
            {/* Sombra husillo */}
            {!modoTecnico && <line x1={pBot.x + 0.5} y1={pBot.y} x2={pTop.x + 0.5} y2={pTop.y}
              stroke="#000" strokeWidth={tubeW} opacity="0.06" />}
            {/* Rosca del husillo */}
            <line x1={pBot.x} y1={pBot.y} x2={pTop.x} y2={pTop.y}
              stroke={col.base} strokeWidth={tubeW} strokeDasharray="2 2" />
            {/* Brillo husillo */}
            {!modoTecnico && <line x1={pBot.x - tubeW * 0.3} y1={pBot.y} x2={pTop.x - tubeW * 0.3} y2={pTop.y}
              stroke="#fff" strokeWidth={tubeW * 0.25} opacity="0.25" />}
            {/* Placa base (mejorada) */}
            {!modoTecnico && <rect x={pBot.x - placaW + 0.5} y={pBot.y + 0.5} width={placaW * 2} height={placaH}
              fill="#000" opacity="0.06" rx="0.5" />}
            <rect x={pBot.x - placaW} y={pBot.y} width={placaW * 2} height={placaH}
              fill={modoTecnico ? 'none' : col.base} stroke={col.base} strokeWidth="0.8" rx="0.5" />
            {!modoTecnico && <line x1={pBot.x - placaW + 2} y1={pBot.y + 0.5}
              x2={pBot.x + placaW - 2} y2={pBot.y + 0.5}
              stroke="#fff" strokeWidth="0.5" opacity="0.25" />}
            {/* Tuerca regulable (hexágono simplificado) */}
            <polygon points={`${pTop.x},${pTop.y - 4} ${pTop.x + 4},${pTop.y - 1.5} ${pTop.x + 4},${pTop.y + 1.5} ${pTop.x},${pTop.y + 4} ${pTop.x - 4},${pTop.y + 1.5} ${pTop.x - 4},${pTop.y - 1.5}`}
              fill={modoTecnico ? 'none' : col.base} stroke={modoTecnico ? col.base : '#333'} strokeWidth="0.8" />
            {!modoTecnico && <circle cx={pTop.x - 1} cy={pTop.y - 1} r={1} fill="#fff" opacity="0.3" />}
          </g>
        );
      })}

      {/* ─── Collarines (mejorados) ─── */}
      {piezasCorte.filter(r => r.tipo === 'collarin').map((r, i) => {
        const p = toS(r.z, r.y);
        const w = m2px(0.06);
        const h = Math.max(3, m2px(0.02));
        return (
          <g key={`coll-${i}`}>
            {!modoTecnico && <rect x={p.x - w + 0.5} y={p.y - h / 2 + 0.5} width={w * 2} height={h}
              fill="#000" opacity="0.06" rx="1" />}
            <rect x={p.x - w} y={p.y - h / 2} width={w * 2} height={h}
              fill={modoTecnico ? 'none' : col.coll} stroke={modoTecnico ? col.coll : '#fff'} strokeWidth="0.5" rx="1" />
            {!modoTecnico && <line x1={p.x - w + 1} y1={p.y - h / 2 + 0.5}
              x2={p.x + w - 1} y2={p.y - h / 2 + 0.5}
              stroke="#fff" strokeWidth="0.4" opacity="0.3" />}
            {/* Tornillo indicador */}
            {!modoTecnico && <circle cx={p.x + w + 2} cy={p.y} r={1.2}
              fill="#555" stroke="#333" strokeWidth="0.4" />}
          </g>
        );
      })}

      {/* ─── Plataformas (rectángulo achurado, mejoradas) ─── */}
      {piezasCorte.filter(r => r.tipo === 'plataforma').map((r, i) => {
        const p = toS(r.z, r.y);
        const anchoScreen = Math.max(m2px(r.ancho), 6);
        const altoScreen = Math.max(4, m2px(0.05));
        return (
          <g key={`plat-${i}`}>
            {/* Sombra */}
            {!modoTecnico && <rect x={p.x - anchoScreen / 2 + 0.5} y={p.y - altoScreen + 0.5}
              width={anchoScreen} height={altoScreen}
              fill="#000" opacity="0.05" rx="0.5" />}
            {/* Cuerpo */}
            <rect x={p.x - anchoScreen / 2} y={p.y - altoScreen}
              width={anchoScreen} height={altoScreen}
              fill={modoTecnico ? 'none' : col.plat} opacity={modoTecnico ? 1 : 0.2}
              stroke={col.plat} strokeWidth="1" rx="0.5" />
            {/* Achurado */}
            <rect x={p.x - anchoScreen / 2} y={p.y - altoScreen}
              width={anchoScreen} height={altoScreen}
              fill="url(#hatch-plat)" stroke="none" />
            {/* Highlight superior */}
            {!modoTecnico && <line x1={p.x - anchoScreen / 2 + 1} y1={p.y - altoScreen + 0.5}
              x2={p.x + anchoScreen / 2 - 1} y2={p.y - altoScreen + 0.5}
              stroke="#fff" strokeWidth="0.5" opacity="0.3" />}
            {/* Etiqueta */}
            {anchoScreen > 20 && (
              <text x={p.x} y={p.y - altoScreen - 3} textAnchor="middle"
                fontSize={fontSize - 2} fill={col.plat} fontFamily="monospace" opacity="0.7">
                {r.ancho.toFixed(2)}m
              </text>
            )}
          </g>
        );
      })}

      {/* ─── Horizontales en Z (líneas que corren en profundidad) ─── */}
      {piezasCorte.filter(r => r.tipo === 'horizontalZ').map((r, i) => {
        const p1 = toS(r.z0, r.y);
        const p2 = toS(r.z1, r.y);
        const cat = r.pieza.categoria;
        const isVP = cat === 'vigaPuente';
        const isBar = cat === 'barandilla';
        const isRod = cat === 'rodapie';
        const sw = isVP ? 3 : isBar ? 1.2 : isRod ? 2 : 1.8;
        const dash = isBar ? '4 2' : 'none';
        const c = isVP ? col.vp : isBar ? col.bar : isRod ? col.rod : col.horizZ;

        return (
          <g key={`hz-${i}`}>
            {/* Sombra */}
            {!modoTecnico && <line x1={p1.x} y1={p1.y + 0.5} x2={p2.x} y2={p2.y + 0.5}
              stroke="#000" strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" opacity="0.04" />}
            {/* Línea principal */}
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={c} strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" />
            {/* Highlight */}
            {!modoTecnico && <line x1={p1.x} y1={p1.y - sw * 0.2} x2={p2.x} y2={p2.y - sw * 0.2}
              stroke="#fff" strokeWidth={sw * 0.2} strokeDasharray={dash} strokeLinecap="round" opacity="0.3" />}
            {/* Cabezales cuña en extremos */}
            {!isRod && <>
              <rect x={p1.x - 2.5} y={p1.y - 3.5} width={5} height={7}
                fill={modoTecnico ? 'none' : c} stroke={modoTecnico ? c : '#333'} strokeWidth="0.5" rx="0.5" />
              <rect x={p2.x - 2.5} y={p2.y - 3.5} width={5} height={7}
                fill={modoTecnico ? 'none' : c} stroke={modoTecnico ? c : '#333'} strokeWidth="0.5" rx="0.5" />
            </>}
            {/* Perfil U para vigas puente */}
            {isVP && <>
              <path d={`M${p1.x - 3.5},${p1.y - 5} L${p1.x - 3.5},${p1.y + 5} L${p1.x + 3.5},${p1.y + 5} L${p1.x + 3.5},${p1.y - 5}`}
                fill="none" stroke={c} strokeWidth="1.5" />
              <path d={`M${p2.x - 3.5},${p2.y - 5} L${p2.x - 3.5},${p2.y + 5} L${p2.x + 3.5},${p2.y + 5} L${p2.x + 3.5},${p2.y - 5}`}
                fill="none" stroke={c} strokeWidth="1.5" />
            </>}
          </g>
        );
      })}

      {/* ─── Horizontales en X (perpendiculares al corte → sección circular) ─── */}
      {piezasCorte.filter(r => r.tipo === 'horizontalX').map((r, i) => {
        const p = toS(r.z, r.y);
        const cat = r.pieza.categoria;
        const isVP = cat === 'vigaPuente';
        const isBar = cat === 'barandilla';
        const isRod = cat === 'rodapie';
        const c = isVP ? col.vp : isBar ? col.bar : isRod ? col.rod : col.horizO;

        if (isVP) {
          // Perfil U cortado
          const uw = Math.max(6, m2px(0.05));
          const uh = Math.max(8, m2px(0.07));
          const thick = Math.max(1.5, m2px(0.01));
          return (
            <g key={`hx-${i}`}>
              {!modoTecnico && <rect x={p.x - uw / 2 + 0.5} y={p.y - uh / 2 + 0.5}
                width={uw} height={uh} fill="#000" opacity="0.04" />}
              {/* Perfil U real: fondo + paredes */}
              <rect x={p.x - uw / 2} y={p.y - uh / 2} width={uw} height={uh}
                fill={modoTecnico ? 'none' : c} fillOpacity="0.15" stroke={c} strokeWidth={thick} />
              {/* Pared izquierda */}
              <line x1={p.x - uw / 2} y1={p.y - uh / 2} x2={p.x - uw / 2} y2={p.y + uh / 2}
                stroke={c} strokeWidth={thick + 0.5} />
              {/* Pared derecha */}
              <line x1={p.x + uw / 2} y1={p.y - uh / 2} x2={p.x + uw / 2} y2={p.y + uh / 2}
                stroke={c} strokeWidth={thick + 0.5} />
              {/* Cruz de corte */}
              <line x1={p.x - 2} y1={p.y - 2} x2={p.x + 2} y2={p.y + 2} stroke={c} strokeWidth="0.6" opacity="0.5" />
              <line x1={p.x + 2} y1={p.y - 2} x2={p.x - 2} y2={p.y + 2} stroke={c} strokeWidth="0.6" opacity="0.5" />
            </g>
          );
        }

        if (isRod) {
          const rw = Math.max(4, m2px(0.03));
          const rh = Math.max(6, m2px(0.15));
          return (
            <g key={`hx-${i}`}>
              {!modoTecnico && <rect x={p.x - rw / 2 + 0.3} y={p.y - rh + 0.3}
                width={rw} height={rh} fill="#000" opacity="0.04" />}
              <rect x={p.x - rw / 2} y={p.y - rh} width={rw} height={rh}
                fill={modoTecnico ? 'none' : col.rod} fillOpacity="0.3" stroke={col.rod} strokeWidth="1" />
            </g>
          );
        }

        // Tubo circular cortado (mejorado)
        const rad = isBar ? tubeR * 0.8 : tubeR;
        return (
          <g key={`hx-${i}`}>
            {/* Sombra */}
            {!modoTecnico && <circle cx={p.x + 0.3} cy={p.y + 0.3} r={rad}
              fill="#000" opacity="0.06" />}
            <circle cx={p.x} cy={p.y} r={rad}
              fill="white" stroke={c} strokeWidth="1.5" />
            {/* Brillo */}
            {!modoTecnico && <ellipse cx={p.x - rad * 0.2} cy={p.y - rad * 0.2}
              rx={rad * 0.3} ry={rad * 0.25} fill="#fff" opacity="0.4" />}
            {/* Cruz de corte interior */}
            <line x1={p.x - rad * 0.5} y1={p.y - rad * 0.5}
              x2={p.x + rad * 0.5} y2={p.y + rad * 0.5} stroke={c} strokeWidth="0.6" />
            <line x1={p.x + rad * 0.5} y1={p.y - rad * 0.5}
              x2={p.x - rad * 0.5} y2={p.y + rad * 0.5} stroke={c} strokeWidth="0.6" />
          </g>
        );
      })}

      {/* ─── Verticales con rosetas (mejoradas) ─── */}
      {piezasCorte.filter(r => r.tipo === 'vertical').map((r, i) => {
        const pBase = toS(r.z, r.yBase);
        const pTop = toS(r.z, r.yTop);
        const rosetas = [];
        for (let y = r.yBase; y <= r.yTop + 0.001; y += 0.50) {
          rosetas.push(y);
        }
        const vTubeW = Math.max(3, m2px(0.02));
        return (
          <g key={`vert-${i}`}>
            {/* Sombra */}
            {!modoTecnico && <line x1={pBase.x + 0.5} y1={pBase.y} x2={pTop.x + 0.5} y2={pTop.y}
              stroke="#000" strokeWidth={vTubeW} opacity="0.05" />}
            {/* Tubo vertical */}
            <line x1={pBase.x} y1={pBase.y} x2={pTop.x} y2={pTop.y}
              stroke={col.vert} strokeWidth={vTubeW} strokeLinecap="round" />
            {/* Highlight */}
            {!modoTecnico && <line x1={pBase.x - vTubeW * 0.25} y1={pBase.y}
              x2={pTop.x - vTubeW * 0.25} y2={pTop.y}
              stroke="#fff" strokeWidth={vTubeW * 0.2} strokeLinecap="round" opacity="0.3" />}
            {/* Rosetas (mejoradas) */}
            {rosetas.map((ry, j) => {
              const pr = toS(r.z, ry);
              return (
                <g key={`ros-${j}`}>
                  {/* Sombra disco */}
                  {!modoTecnico && <circle cx={pr.x + 0.3} cy={pr.y + 0.3} r={rosetaR + 1.5}
                    fill="#000" opacity="0.06" />}
                  {/* Disco roseta */}
                  <circle cx={pr.x} cy={pr.y} r={rosetaR + 1.5}
                    fill={modoTecnico ? 'none' : '#e4e4e7'}
                    stroke={col.roseta} strokeWidth={modoTecnico ? "0.8" : "1.2"} />
                  {/* Brillo especular */}
                  {!modoTecnico && <ellipse cx={pr.x - rosetaR * 0.2} cy={pr.y - rosetaR * 0.15}
                    rx={rosetaR * 0.4} ry={rosetaR * 0.3} fill="#fff" opacity="0.35" />}
                  {/* Perforaciones cardinales (4 puntos) */}
                  {rosetaR > 3 && <>
                    <circle cx={pr.x} cy={pr.y - rosetaR * 0.6} r={0.8} fill={col.roseta} opacity="0.6" />
                    <circle cx={pr.x} cy={pr.y + rosetaR * 0.6} r={0.8} fill={col.roseta} opacity="0.6" />
                    <circle cx={pr.x - rosetaR * 0.6} cy={pr.y} r={0.8} fill={col.roseta} opacity="0.6" />
                    <circle cx={pr.x + rosetaR * 0.6} cy={pr.y} r={0.8} fill={col.roseta} opacity="0.6" />
                  </>}
                  {/* Punto central */}
                  <circle cx={pr.x} cy={pr.y} r={Math.max(0.8, rosetaR * 0.2)}
                    fill={col.roseta} />
                </g>
              );
            })}
            {/* Sección circular superior */}
            <circle cx={pTop.x} cy={pTop.y} r={tubeR}
              fill={modoTecnico ? 'none' : col.vert} stroke={modoTecnico ? col.vert : 'white'} strokeWidth="1" />
            {!modoTecnico && <ellipse cx={pTop.x - tubeR * 0.2} cy={pTop.y - tubeR * 0.2}
              rx={tubeR * 0.25} ry={tubeR * 0.2} fill="#fff" opacity="0.4" />}
          </g>
        );
      })}

      {/* ─── Diagonales (rombo mejorado) ─── */}
      {piezasCorte.filter(r => r.tipo === 'diagonal').map((r, i) => {
        const p = toS(r.z, r.y);
        const s = Math.max(4, tubeR);
        return (
          <g key={`diag-${i}`}>
            {!modoTecnico && <polygon
              points={`${p.x},${p.y - s - 0.3} ${p.x + s + 0.3},${p.y} ${p.x},${p.y + s + 0.3} ${p.x - s - 0.3},${p.y}`}
              fill="#000" opacity="0.05" />}
            <polygon points={`${p.x},${p.y - s} ${p.x + s},${p.y} ${p.x},${p.y + s} ${p.x - s},${p.y}`}
              fill={modoTecnico ? 'none' : col.diag} fillOpacity={modoTecnico ? 1 : 0.3}
              stroke={col.diag} strokeWidth="1.2" />
            {!modoTecnico && <line x1={p.x} y1={p.y - s * 0.5} x2={p.x} y2={p.y + s * 0.5}
              stroke="#fff" strokeWidth="0.4" opacity="0.3" />}
            <text x={p.x + s + 3} y={p.y + 3} fontSize={fontSize - 2}
              fill={col.diag} fontFamily="monospace" opacity="0.7">↗</text>
          </g>
        );
      })}

      {/* ─── Cotas Y (izquierda) — mejoradas con líneas extensión ─── */}
      {(() => {
        const ySet = new Set([0]);
        piezasCorte.forEach(r => {
          if (r.tipo === 'vertical') { ySet.add(r.yBase); ySet.add(r.yTop); }
          if (r.tipo === 'plataforma' || r.tipo === 'horizontalX' || r.tipo === 'horizontalZ') ySet.add(r.y);
        });
        const ys = [...ySet].filter(y => y >= 0).sort((a, b) => a - b);
        if (ys.length < 2) return null;

        const xLine = cotaMargenIzq - 22;
        const xExt = cotaMargenIzq - 8; // línea de extensión

        return (
          <g>
            {/* Línea vertical de cotas */}
            <line x1={xLine} y1={toS(0, ys[0]).y} x2={xLine} y2={toS(0, ys[ys.length - 1]).y}
              stroke={col.cota} strokeWidth="0.8" />
            {ys.map((y, i) => {
              const py = toS(0, y).y;
              const drawAreaLeft = offX;
              return (
                <g key={`cy-${i}`}>
                  {/* Línea de extensión (de pieza a cota) */}
                  <line x1={xExt} y1={py} x2={drawAreaLeft - 2} y2={py}
                    stroke={col.cota} strokeWidth="0.3" strokeDasharray="2 2" opacity="0.3" />
                  {/* Tick en línea de cota */}
                  <line x1={xLine - 4} y1={py} x2={xLine + 4} y2={py}
                    stroke={col.cota} strokeWidth="0.8" />
                  {/* Triángulo de flecha */}
                  <polygon points={`${xLine - 3},${py} ${xLine},${py - 3} ${xLine + 3},${py}`}
                    fill={col.cota} opacity="0.4" />
                  {/* Etiqueta */}
                  <text x={xLine - 6} y={py + 3} textAnchor="end"
                    fontSize={fontSize - 1} fontFamily="monospace" fill={col.cota} fontWeight="bold">
                    {y.toFixed(2)}
                  </text>
                </g>
              );
            })}
            {/* Distancias entre niveles */}
            {ys.slice(0, -1).map((y, i) => {
              const y2 = ys[i + 1];
              if (y2 - y < 0.1) return null;
              const py1 = toS(0, y).y;
              const py2 = toS(0, y2).y;
              const midY = (py1 + py2) / 2;
              const dist = (y2 - y).toFixed(2);
              return (
                <g key={`cd-${i}`}>
                  {/* Fondo para legibilidad */}
                  <rect x={xLine - 24} y={midY - fontSize / 2} width={22} height={fontSize + 2}
                    fill="white" opacity="0.7" rx="1" />
                  <text x={xLine - 6} y={midY + 3} textAnchor="end"
                    fontSize={fontSize - 2} fontFamily="monospace" fill={col.cota} opacity="0.7">
                    ↕{dist}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ─── Cotas Z (abajo, entre filas) — mejoradas ─── */}
      {(() => {
        if (filas.length < 2) return null;
        const sorted = [...filas].sort((a, b) => a.z - b.z);
        const yLine = H - cotaMargenBot - legendH + 12;
        return sorted.slice(0, -1).map((f, i) => {
          const f2 = sorted[i + 1];
          const p1 = toS(f.z, 0);
          const p2 = toS(f2.z, 0);
          const dist = (f2.z - f.z).toFixed(2) + 'm';
          const midX = (p1.x + p2.x) / 2;
          return (
            <g key={`cotaz-${i}`}>
              {/* Línea de cota con flechas */}
              <line x1={p1.x} y1={yLine} x2={p2.x} y2={yLine}
                stroke={col.cota} strokeWidth="0.8" />
              {/* Flechas triangulares */}
              <polygon points={`${p1.x},${yLine} ${p1.x + 4},${yLine - 2.5} ${p1.x + 4},${yLine + 2.5}`}
                fill={col.cota} />
              <polygon points={`${p2.x},${yLine} ${p2.x - 4},${yLine - 2.5} ${p2.x - 4},${yLine + 2.5}`}
                fill={col.cota} />
              {/* Ticks verticales */}
              <line x1={p1.x} y1={yLine - 5} x2={p1.x} y2={yLine + 5}
                stroke={col.cota} strokeWidth="0.5" />
              <line x1={p2.x} y1={yLine - 5} x2={p2.x} y2={yLine + 5}
                stroke={col.cota} strokeWidth="0.5" />
              {/* Fondo etiqueta */}
              <rect x={midX - 18} y={yLine + 3} width={36} height={fontSize + 4}
                fill="white" rx="2" />
              <text x={midX} y={yLine + fontSize + 4} textAnchor="middle"
                fontSize={fontSize} fontFamily="monospace" fill={col.cota} fontWeight="bold">
                {dist}
              </text>
            </g>
          );
        });
      })()}

      {/* ─── Leyenda inferior ─── */}
      {(() => {
        const items = [
          { color: col.vert, label: 'Vert', count: counts.vertical, shape: 'line' },
          { color: col.horizO, label: 'H∥', count: counts.horizontalX, shape: 'circle' },
          { color: col.horizZ, label: 'H⊥', count: counts.horizontalZ, shape: 'line' },
          { color: col.plat, label: 'Plat', count: counts.plataforma, shape: 'rect' },
          { color: col.diag, label: 'Diag', count: counts.diagonal, shape: 'diamond' },
          { color: col.base, label: 'Base', count: counts.base, shape: 'line' },
        ].filter(it => it.count > 0);

        const legendY = H - legendH + 4;
        const itemW = Math.min(75, (W - 20) / Math.max(items.length, 1));
        const startX = (W - items.length * itemW) / 2;

        return (
          <g>
            {/* Línea separadora */}
            <line x1={12} y1={legendY - 4} x2={W - 12} y2={legendY - 4}
              stroke="#e2e8f0" strokeWidth="0.5" />
            {items.map((it, idx) => {
              const ix = startX + idx * itemW;
              const sy = legendY + 8;
              return (
                <g key={`leg-${idx}`}>
                  {/* Símbolo */}
                  {it.shape === 'line' && (
                    <line x1={ix} y1={sy} x2={ix + 12} y2={sy}
                      stroke={it.color} strokeWidth="2.5" strokeLinecap="round" />
                  )}
                  {it.shape === 'circle' && (
                    <circle cx={ix + 6} cy={sy} r={4}
                      fill="white" stroke={it.color} strokeWidth="1.5" />
                  )}
                  {it.shape === 'rect' && (
                    <rect x={ix} y={sy - 3} width={12} height={6}
                      fill={it.color} opacity="0.3" stroke={it.color} strokeWidth="0.8" />
                  )}
                  {it.shape === 'diamond' && (
                    <polygon points={`${ix + 6},${sy - 4} ${ix + 10},${sy} ${ix + 6},${sy + 4} ${ix + 2},${sy}`}
                      fill={it.color} fillOpacity="0.3" stroke={it.color} strokeWidth="0.8" />
                  )}
                  {/* Etiqueta */}
                  <text x={ix + 16} y={sy + 3.5} fontSize={fontSize - 2}
                    fontFamily="monospace" fill="#64748b">
                    {it.label}×{it.count}
                  </text>
                </g>
              );
            })}
            {/* Info posición X */}
            <text x={W - 8} y={legendY + 11} textAnchor="end"
              fontSize="8" fill="#94a3b8" fontFamily="monospace">
              X={posX.toFixed(2)}m · {piezasCorte.length} elem
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
