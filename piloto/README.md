# Piloto integrado MasAlto Layout

Este branch contiene una copia transferible del piloto integrado publicado en Netlify como referencia para integrarlo al repo principal.

Deploy de referencia: https://masalto-layout-piloto.netlify.app/
Proyecto Netlify: masalto-layout-piloto
Deploy publicado: 6a9ed43480b393f77ad960f8

Contenido principal:

- `integracion-layout/src`: editor Layout con integracion al visualizador y catalogo de piezas importadas.
- `integracion-layout/public/inicio`: landing de acceso comun.
- `integracion-layout/public/piezas`: disenador de piezas nuevas standalone.
- `integracion-layout/public/visualizador`: visualizador 3D.
- `integracion-layout/public/compartido`: logica compartida para persistencia/importacion de piezas.
- `integracion-layout/piloto-netlify/sitio`: paquete estatico preparado para Netlify.
- `integracion-layout/piloto-netlify/ESTADO.md`: estado local del piloto y pendientes.

Excluido a proposito:

- `node_modules`
- `dist`
- fixtures y ejemplos reales de trabajo usados durante QA

Antes de mezclar con produccion conviene correr el QA guiado con casos reales: abrir/armar un plano, sumar una pieza nueva, pasar a Visualizador 3D, guardar/abrir y revisar en movil.
