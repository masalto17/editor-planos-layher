# Piloto integrado MásAlto Layout

Integración de las cuatro herramientas en un flujo unificado,
traído desde el piloto publicado en Netlify (`masalto-layout-piloto`).

## Estructura integrada al repo

```
src/
  export/visualizador.js       ← Puente Layout → Visualizador 3D
  catalogo/importador.js       ← Reexporta desde compartido
  modelo/datosImportados.js    ← Conserva definición de piezas importadas
  ui/Toolbar.jsx               ← Botón "Ver en 3D" + "Inicio"
  ui/Paleta.jsx                ← Acceso "Crear pieza"
  LayherEditor.jsx             ← Orquestador (import visualizador)

public/
  inicio/                      ← Landing de acceso común
  visualizador/                ← Visualizador 3D (Three.js 0.169.0 desde CDN)
  piezas/                      ← Diseñador de piezas nuevas
  compartido/importador.js     ← Lógica compartida de importación

tests/
  catalogo.test.mjs            ← Tests de catálogo
  imported.test.mjs            ← Tests de piezas importadas (8 tests)
  integracion.test.mjs         ← Tests de integración completa (6 tests)
  roof.test.mjs                ← Tests de techo (5 tests)
  fixtures/                    ← Archivos de prueba reales
```

## Origen

Código original desarrollado fuera del repo en:
`/Users/hdb/.codex/visualizations/2026/09/06/.../integracion-layout`

Publicado como piloto en: https://masalto-layout-piloto.netlify.app/

Branch de referencia original: `piloto-netlify-raw` (commit `c30cbe1`)

## Estado

- [x] Archivos del piloto sincronizados al repo
- [x] Build correcto (Vite)
- [x] 19/19 tests pasando
- [ ] QA con caso simple
- [ ] QA con piezas especiales
- [ ] QA con techo/ménsulas
- [ ] Decisión de ruta final (layout.masalto.com.ar, /layout, etc.)

## Integraciones activas

| Flujo | Mecanismo |
|-------|-----------|
| Layout → Visualizador 3D | `sessionStorage` en pestaña nueva, botón "Ver en 3D" |
| Diseñador → Catálogo Layout | `localStorage` compartido, mismo origen |
| Landing → Herramientas | Rutas relativas entre `/inicio/`, `/`, `/piezas/`, `/visualizador/` |

## Notas

- Three.js se carga desde CDN (`cdn.jsdelivr.net/npm/three@0.169.0`), no como dependencia npm
- Piezas importadas se persisten en `localStorage` (mismo navegador/origen, sin sync entre dispositivos)
- No se modificó `www.masalto.com.ar` ni se tocó producción
