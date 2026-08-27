# Proyecto: Editor de Planos Layher — MásAlto Estructuras

## Qué es este proyecto
Editor visual interactivo de alzado frontal para estructuras temporales armadas con sistema Layher Allround. Permite a un técnico que conoce el armado real ir colocando piezas del catálogo oficial sobre un canvas SVG, con snap automático a rosetas y módulos estándar, generando un despiece en vivo.

**NO es un software CAD ni reemplaza el trabajo de un ingeniero estructural.** Es una herramienta de visualización preliminar para presupuestos y planificación.

## Quién lo usa
- **Huguito** — dueño de MásAlto Estructuras / MYD Estructuras SAS (San Juan, Argentina)
- El usuario del editor es un técnico que conoce el armado real Layher (no un administrativo)
- Trabaja en **Mac** (sin mouse, usa trackpad)

## Estado actual: V2.0 (en curso)
Proyecto Vite + React en la raíz. `src/LayherEditor.jsx` es el orquestador (ya no monolito) —
ver "Arquitectura objetivo" abajo, ya aplicada. V1.3 original queda de referencia en
`files/LayherEditor_Alzado_V1_3.jsx`.

Corré local:
```
npm install
npm run dev
```

### Funcionalidades implementadas
- Canvas SVG con coordenadas mundo/pantalla, zoom (pinch trackpad), pan (2 dedos, Space+drag, flechas, Alt+click)
- Catálogo completo de 9 categorías con datos reales del catálogo F4-2018-SP:
  - Verticales (2601.xxx): 0.50 a 4.00m
  - Horizontales O tubo (2607.xxx): 0.73 a 3.07m
  - Vigas Puente U (2624.xxx): 1.57 a 3.07m — perfil U para soportar plataformas
  - Horizontales U (2613.xxx): 0.45 a 1.09m
  - Plataformas (3812/3835.xxx): anchos 0.32m y 0.61m, largos 0.73 a 3.07m
  - Barandillas: mismas medidas que Horizontal O, se dibujan punteadas
  - Rodapiés (2640.xxx): 0.73 a 3.07m
  - Diagonales (2620.xxx): colocación en 2 clics, auto-selección de pieza más cercana
  - Bases: husillos regulables 0.60/0.80m + collarín
- Snap automático: Y a rosetas cada 0.50m, X a verticales existentes y módulos estándar
- Selección múltiple: click, Shift+click, rectángulo de selección
- Copy/Paste/Duplicar bloques enteros (Ctrl+C/V/D)
- Mover piezas y grupos con drag (snap durante arrastre)
- Undo/Redo ilimitado (Ctrl+Z/Y)
- Guardar/Cargar diseños con nombre (usa window.storage en artifact, migrar a localStorage o archivo)
- Despiece en vivo (panel derecho): cantidad, peso por pieza, peso total
- Z-order de dibujo por tipo de pieza
- Secciones colapsables en la paleta
- Aviso legal en canvas

### Representación visual de cada pieza
- **Vertical**: línea azul con puntos negros (rosetas) cada 0.50m
- **Horizontal O**: línea verde con cabezales cuña rectangulares en extremos
- **Viga Puente U**: línea ámbar gruesa con alas U visibles en extremos y centro + cabezales cuña
- **Horizontal U**: similar a Viga Puente pero más liviana
- **Plataforma**: rectángulo borravino relleno con textura de rejilla (solo visible en zoom alto)
- **Barandilla**: línea celeste punteada con cabezales cuña
- **Rodapié**: rectángulo bajo ámbar
- **Diagonal**: línea violeta con puntos en extremos (colocación 2 clics con preview)
- **Husillo**: línea marrón con placa base rectangular
- **Collarín**: rectángulo horizontal marrón oscuro con punto blanco central

## Backlog priorizado (V2.0+)

### Fase inmediata: V2.0
1. **Vista de planta sincronizada** — segunda vista que comparte el mismo modelo de datos ✅ arrancada
   (eje Z/profundidad agregado al modelo de pieza; toggle Alzado/Planta en Toolbar; snap y
   drag propios por vista, mismo `piezas`/historial/selección. Falta: pulir render en planta,
   grid de filas A-B-C, diagonales visibles en planta, selección compartida resaltada entre vistas)
2. **Export a PDF** con membrete corporativo MásAlto/MYD, cuadro de datos, sellos legales (stub en `src/export/pdfExporter.js`)

### Mejoras de catálogo pendientes
- **Vigas reticuladas / celosías** — para luces grandes de escenarios
- **Ménsulas** (2630/2631.xxx) — voladizos laterales
- **Horizontales U reforzadas T14** (2618.xxx) — para mayor capacidad de carga
- **Escaleras internas** de acceso
- **Diagonal en planta** (2622/2623.xxx)
- **Tacos de madera** bajo husillos (opción terreno blando)

### Mejoras visuales (más adelante)
- Modo "plano técnico" para exportar: líneas simples estilo CAD, sin colores
- Diseño más realista de cada pieza (rosetas con 8 perforaciones, efecto metálico galvanizado)
- Grid alfabético de filas (A, B, C...) en planta
- Cotas automáticas entre elementos
- Cuadro de datos técnicos
- Formato hoja A2, escala 1:100
- Vistas por fila (cortes transversales)

### Referencia de estilo máximo a alcanzar
Un plano profesional del Ing. Martín Balastegui (Mat 7840) con:
- Plantas a nivel 0.00m y +2.32m con grid de filas A-G
- Vista de frente general
- Vistas por fila (B, C, D, E, F, G)
- Lateral izquierdo y corte
- Análisis de cargas (CIRSOC 301-2005, Cap A.4.2)
- Acción del viento (CIRSOC 102 Año 2005)
- Membretado con verificación de ingeniero

## Identidad visual
- **Rojo corporativo**: #E30613
- **Negro**: #000000
- **Gris**: #777777
- **Tipografía**: Nunito Sans
- Logos MásAlto y MYD disponibles como base64 (pedir a Huguito si se necesitan)

## Datos técnicos clave del sistema Layher
- Módulo estándar: 2.57m
- Ménsulas/extremos: 1.09m
- Voladizo sonido: 1.57m
- Rosetas cada 0.50m en verticales (8 perforaciones: 4 rectas + 4 angulares)
- Diámetro tubo vertical: 48.3mm, espesor pared 3.20mm
- Unión: cuña sobre roseta (AutoLock)
- Alturas de piso estándar: 0.50, 0.80, 1.00, 1.50, 1.80, 2.00m
- Carga máxima por vertical a compresión: 4.000 kg (según catálogo fabricante)
- Viga Puente U 2.57m: Q=5.12 kN/m (522 kg/m repartida), P=5.25 kN (535 kg concentrada al centro)
- Sobrecarga admisible pisos: 150 kg/m²
- Peso propio del piso: 19.50 kg/m²
- Torres PA: siempre laterales, 1.57×2.57m o 2.57×2.57m voladizo
- Transporte: <3t flete común, 3-10t chasis, >10t semi

## Documentación de referencia (en /docs)
- F4-2018-SP-Catalogo-SISTEMA-ALLROUND.pdf — catálogo completo de piezas
- Instrucciones_Montaje_Allround_-_Nuevas_ESP.pdf — instrucciones de montaje
- Catalogo_General_de_Bolsillo-2.pdf — catálogo de bolsillo
- Plano_y_cálculos_estructura.pdf — planos y cálculos de referencia
- Layher_-_NotebookLM.PDF — guía técnica compilada

## Sellos legales obligatorios
Todo plano debe incluir:
1. "Plano esquemático preliminar realizado únicamente con fines presupuestarios y comerciales. No utilizar como guía de armado ni documentación técnica definitiva."
2. "Debe ser verificado y aprobado por un ingeniero estructural matriculado antes de su construcción."

## Arquitectura objetivo (para V2.0+)
```
src/
  LayherEditor.jsx          ← componente principal (orquesta vistas)
  catalogo/
    piezas.js               ← catálogo completo de piezas Layher
    constantes.js            ← módulos estándar, snap, rosetas
  modelo/
    estado.js               ← estado del diseño (piezas, historial, selección)
    operaciones.js           ← colocar, mover, copiar, eliminar, snap
  vistas/
    Alzado.jsx              ← vista de alzado frontal (actual)
    Planta.jsx              ← vista de planta (V2.0)
    Compartidos.jsx         ← grilla, suelo, indicadores snap
  ui/
    Paleta.jsx              ← panel izquierdo con catálogo
    Despiece.jsx            ← panel derecho con tabla de materiales
    Toolbar.jsx             ← barra de herramientas superior
  export/
    pdfExporter.js          ← generador de PDF con membrete
  pieza-renders/
    Vertical.jsx
    HorizontalO.jsx
    VigaPuente.jsx
    Plataforma.jsx
    ...etc
docs/
  ← PDFs de referencia del catálogo Layher
```

## Cómo comunicarse
- Siempre en español
- El usuario conoce el sistema Layher a nivel experto (armado real)
- Priorizar viabilidad constructiva real sobre estética
- No inventar piezas que no existan en el catálogo
- Usar terminología de obra argentina: viga puente, parante, horizontal, ménsula, husillo, collarín
