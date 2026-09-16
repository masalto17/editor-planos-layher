# Piloto integrado MasAlto Layout

Snapshot transferible de la integracion de las cuatro herramientas en un flujo unificado, traido desde el piloto publicado en Netlify (`masalto-layout-piloto`).

## Ubicacion

```
piloto/integracion-layout/
```

Este PR no mezcla todavia el piloto con la app principal de la raiz. La carpeta `piloto/integracion-layout/` conserva la fuente y el paquete estatico de referencia para que la integracion pueda revisarse y migrarse de forma controlada.

## Contenido principal

```
piloto/integracion-layout/src/
  export/visualizador.js       <- Puente Layout -> Visualizador 3D
  catalogo/importador.js       <- Reexporta desde compartido
  modelo/datosImportados.js    <- Conserva definicion de piezas importadas
  ui/Toolbar.jsx               <- Boton "Ver en 3D" + "Inicio"
  ui/Paleta.jsx                <- Acceso "Crear pieza"
  LayherEditor.jsx             <- Orquestador

piloto/integracion-layout/public/
  inicio/                      <- Landing de acceso comun
  visualizador/                <- Visualizador 3D (Three.js 0.169.0 desde CDN)
  piezas/                      <- Disenador de piezas nuevas
  compartido/importador.js     <- Logica compartida de importacion

piloto/integracion-layout/piloto-netlify/
  sitio/                       <- Paquete estatico publicado
  ESTADO.md                    <- Estado del piloto Netlify
  masalto-layout-piloto.zip    <- ZIP publicado como referencia
```

## Origen y publicacion

Código original desarrollado fuera del repo en:
`/Users/hdb/.codex/visualizations/2026/09/06/.../integracion-layout`

Publicado como piloto en: https://masalto-layout-piloto.netlify.app/

Branch de referencia original: `piloto-netlify-raw` (commit `c30cbe1`)

## Estado

- [x] Archivos del piloto sincronizados al repo
- [x] Produccion intacta: no se modifico la app raiz ni `www.masalto.com.ar`
- [x] Fixtures reales sensibles excluidos del branch
- [x] Build del snapshot en este PR: `npm run build`
- [x] Tests no sensibles del snapshot: 13/13 (`catalogo`, `imported`, `roof`)
- [ ] Tests de integracion completa con fixtures privados disponibles
- [ ] QA con caso simple
- [ ] QA con piezas especiales
- [ ] QA con techo/mensulas
- [ ] Decision de ruta final (layout.masalto.com.ar, /layout, etc.)

## Integraciones activas

| Flujo | Mecanismo |
|-------|-----------|
| Layout -> Visualizador 3D | `sessionStorage` en pestana nueva, boton "Ver en 3D" |
| Disenador -> Catalogo Layout | `localStorage` compartido, mismo origen |
| Landing -> Herramientas | Rutas relativas entre `/inicio/`, `/`, `/piezas/`, `/visualizador/` |

## Notas

- Three.js se carga desde CDN (`cdn.jsdelivr.net/npm/three@0.169.0`), no como dependencia npm
- Piezas importadas se persisten en `localStorage` (mismo navegador/origen, sin sync entre dispositivos)
- Algunos tests del snapshot referencian fixtures reales que no se subieron a GitHub por decision de resguardo. Para repetir exactamente la validacion historica hay que correrlos con esos fixtures locales.
- No se modifico `www.masalto.com.ar` ni se toco produccion
