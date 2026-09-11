# Integración local Layout → Visualizador

Copia aislada del editor y del prototipo 3D. No publicada. Inicio: `npm run dev -- --host 127.0.0.1 --port 5200 --strictPort`.

Abrir http://127.0.0.1:5200/ y pulsar **Ver en 3D**. Se transfiere el estado completo del momento de apertura a una pestaña nueva. El editor conserva su estado e historial. Para actualizar el 3D después de editar, volver a pulsar el botón. **Volver a Layout** cierra la pestaña del visor.

El traslado usa almacenamiento de sesión de la nueva pestaña, en el mismo origen. La URL lleva solo un identificador aleatorio y no sirve como enlace para compartir el proyecto. Recargar la pestaña conserva la copia. El guardado y apertura de archivos siguen disponibles. Si el navegador bloquea ventanas o falta espacio, se informa el problema.

## Validación realizada el 6 de septiembre de 2026

- Compilación correcta; aviso de tamaño de paquete superior a 500 kB.
- Pruebas existentes del visor correctas.
- Navegador: plantilla Escenario básico, 45/45 piezas y 399,3 kg; recarga conserva el diseño; botón de regreso cierra el visor y el editor mantiene el escenario.
- Prueba de datos: ejemplo real de 223 piezas, transferencia exacta de piezas y filas sin mutación, peso 2.612,9 kg.
- Pieza especial de prueba conservada en datos y peso, marcada no representada. Formato inválido rechazado.
- El navegador integrado registró errores internos de Electron en la recarga; el contenido del visor siguió disponible. No se atribuyen esos errores al código de la app.

## Límites

Las piezas importadas y categorías aún no soportadas no se dibujan; el visor informa la cobertura. El primer hito conecta herramientas, no amplía geometrías. No se volvió a validar la exportación PDF completa en esta entrega; su implementación no se modificó. Falta validar recorrido con archivo real cargado desde la interfaz, navegación móvil y otros navegadores antes de publicación.

La copia usa un enlace al node_modules existente para evitar instalar dependencias. Para distribución se necesita preparar dependencias propias y retirar ese enlace. Three.js sigue fijado a 0.169.0 desde CDN. Esta copia no constituye la configuración definitiva de alojamiento.

## Segunda entrega: conservación de piezas importadas

La conversión de piezas ahora guarda su definición de origen completa en `_definicion`, y la colocación en alzado y planta la copia en cada pieza. Así se conservan profundidad, vistas, conexiones, origen y advertencias sin cambiar el dibujo ni las reglas de colocación actuales. Las piezas antiguas que ya perdieron esos datos no se completan con suposiciones; requieren recuperar su archivo original.

Pruebas reproducibles: `node --test tests/integracion.test.mjs` (6 correctas). Los ejemplos se guardaron en `tests/fixtures`, fuera de la carpeta pública.

| Archivo real | Elementos conservados | Representados | Peso conservado |
| --- | ---: | ---: | ---: |
| 1285 mts con techo pantalla cc | 200 | 156 | 4.768,3 kg |
| Escenario 1285 | 857 | 717 | 19.245,5 kg |

Las pruebas incluyen dos piezas reales creadas por el usuario: módulo LED P4 y bin de 1000 litros. Se verifica conservación completa, independencia de la definición respecto de otras copias y compatibilidad con diseños anteriores. No se afirma que las piezas importadas ya se representen en 3D.

Compilación correcta después de los cambios. La prueba de apertura de archivos mediante el selector del navegador integrado agotó el tiempo de espera; no se considera validada. La revisión móvil alcanzó la interfaz de 390 × 844, pero el recorrido completo sigue pendiente. Se agregó nombre accesible y estado abierto/cerrado al menú móvil.

## Tercera entrega: representación esquemática de piezas especiales

Esta entrega reemplaza la limitación anterior de no dibujar ninguna pieza importada:

- Las piezas que conservan `_visual` ahora muestran sus líneas, rectángulos, círculos y polilíneas en su ubicación y eje guardados. No se infiere profundidad para archivos antiguos.
- Con `_definicion.dimensiones` completa se agrega una envolvente de alambre desde el origen local hasta las dimensiones declaradas. Es una referencia dimensional, no un modelo de fabricación ni una extrusión de la pieza.
- El contador explica cuántas piezas son esquemáticas; la lista las identifica con “(esquema)”. La geometría del dibujo colocado tiene prioridad sobre la definición de origen. No se cambian pesos ni datos del archivo.
- Un dibujo importado inválido queda señalado sin producir geometría parcial ni impedir representar las demás piezas. Se limitan elementos y segmentos.

Cobertura actual: 190/200 visibles en el primer archivo (34 esquemáticas) y 853/857 en el segundo (136 esquemáticas). En el primero siguen sin representación 5 placas de fenólico, 2 ménsulas, 2 apoya techos y 1 techo; en el segundo, 4 techos.

Pruebas: `node --test tests/imported.test.mjs tests/integracion.test.mjs` (12 correctas), pruebas existentes del visor correctas, sintaxis y compilación correctas. Se verifican ejes X/Z, coordenadas, límites, conservación de datos, dibujos antiguos, envolventes y errores parciales. La revisión gráfica mediante navegador automatizado continúa bloqueada por falta de respuesta de esa herramienta; no se declara completada.

Vista directa local: http://127.0.0.1:5200/visualizador/index.html?ejemplo=especiales . El botón “Ejemplo con piezas especiales” carga una copia del archivo de 200 piezas. Está en la carpeta pública de esta prueba local; revisar expresamente su inclusión antes de cualquier publicación.

## Cuarta entrega: techo, ménsula, apoya techo y fenólico

Cobertura de los casos de prueba: 200/200 y 857/857 elementos representados. Incluyen 34 y 136 esquemas importados, respectivamente; no significa detalle de fabricación completo.

El techo reproduce las líneas de TechoAguas.jsx: pendiente de 11°, celosías de 2.57 m, altura de celosía de 0.50 m, cumbrera y voladizos. No añade cubiertas ni conexiones entre filas. Ménsula con apoyo inferior a 0.50 m, apoya techo vertical según largo guardado, fenólico con ancho guardado y espesor de referencia de 18 mm. Pesos y componentes conservados.

Validación: 12 pruebas de integración/importadas, 5 nuevas pruebas geométricas y pruebas existentes del visor correctas. Compilación correcta. Revisión visual en navegador completada para el caso de 200 piezas: carga, contador, peso y cambio a alzado con techo visible. El servidor local se reinició en puerto 5200. Siguen pendientes selector de archivos, recorrido móvil completo y evaluación constructiva por el usuario.

## Quinta entrega: Diseñador → catálogo de Layout

Acceso “Crear pieza” desde la paleta, diseñador local en /piezas/index.html. “Agregar a Layout” valida los campos y abre una vista previa con nombre, ID, medidas y peso. Confirmar agrega al catálogo separado; si existe el ID se anuncia actualización. Los planos ya colocados conservan sus copias. La paleta escucha cambios de almacenamiento y se actualiza sin recargar. Guardar archivo sigue disponible.

La persistencia se comparte desde public/compartido/importador.js; src/catalogo/importador.js reexporta esa implementación. Errores de cuota de almacenamiento se informan. Integración limitada al mismo navegador y origen; no sincroniza cuentas ni dispositivos.

Verificado en navegador: ejemplo del diseñador con ID de prueba EXT_PRUEBA_CONEXION, revisión, agregado, aparición en Layout, aviso de duplicado y actualización de nombre en la pestaña abierta sin recargar. El registro de prueba quedó en el catálogo local. 17 pruebas previas y compilación correctas; 2 pruebas nuevas de persistencia correctas. El recorrido con LED/bin mantiene cobertura de datos por pruebas existentes, no se repitió su colocación manual en esta entrega.

Marca primaria: MasAlto Layout. Nuevo acceso usa texto, sin activos gráficos nuevos ni modificaciones de logos. Se retiró la M dibujada como marca en el diseñador copiado.


## Sexta entrega: Inicio y navegación común

Landing copiada desde layout-propuesta a public/inicio, preservando estética, assets y explorador conceptual. Acceso local: http://127.0.0.1:5200/inicio/index.html. Usar index.html explícito porque Vite no resuelve automáticamente el índice de carpetas public.

Los tres accesos apuntan al mismo origen mediante rutas relativas: Layout ../, piezas ../piezas/index.html y visualizador ../visualizador/index.html. Inicio desde Toolbar (escritorio y menú móvil), piezas y visor abre otra pestaña con noopener, conservando la herramienta actual. No transfiere automáticamente el plano desde Inicio; usar Ver en 3D desde Layout.

Validación: build correcto (persiste aviso de bundle grande), 19 pruebas existentes aprobadas. Navegador confirmó landing, diálogo con destino correcto y visor con Inicio y ejemplo 223/223. La apertura automática de pestaña por enlace no pudo confirmarse en el navegador integrado; destino abierto directamente sí funciona. Validación móvil completa y prueba en navegador externo pendientes.

No se publicó ni se modificó el proyecto original en esta entrega. Preparar publicación después de verificar el flujo completo con un proyecto de trabajo y revisar los ejemplos públicos.


## Preparación del piloto — 2026-09-07
Guía de tres pasos en Inicio, ayuda de persistencia por navegador/origen, ficha descargable para reportar problemas sin envío automático y meta noindex. Noindex no es control de acceso. Marca primaria MasAlto Layout; se conserva sin modificación public/inicio/assets/masalto-layout-horizontal-oscuro.png, aportado en la propuesta anterior.
Build y 19 pruebas aprobadas; revisión visual de la nueva guía pendiente. Cuenta Vercel consultada: Hobby. Password Protection nativo requiere Enterprise o Pro con Advanced Deployment Protection. No se creó proyecto, no se publicó ni se contrató plan. Falta resolver alojamiento con acceso protegido, revisar ejemplos públicos y completar recorrido manual antes de habilitar cercanos.
