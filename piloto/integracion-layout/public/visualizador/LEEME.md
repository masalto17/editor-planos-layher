# MasAlto Layout - visualizador 3D local

Propuesta independiente para abrir archivos `.masalto.json` generados por MasAlto Layout y explorarlos en una escena 3D con camara orbital, materiales metalicos, grilla de referencia, seleccion de piezas, foco y vistas de perspectiva, alzado, planta y lateral.

## Como verlo

Servidor local actual:

```text
http://127.0.0.1:5197/
```

Si el servidor no esta activo:

```bash
python3 -m http.server 5197 --bind 127.0.0.1 --directory /Users/hdb/.codex/visualizations/2026/09/06/01a074be-7749-71d3-9d93-c390c74e3337/visor-layout
```

## Alcance

- Usa posiciones, largos, orientacion, ancho de plataformas y peso declarados en el archivo guardado.
- Representa piezas conocidas del editor de planos: verticales, horizontales, plataformas, barandillas, rodapies, diagonales, bases, collarines, celosias y perfiles principales.
- Mejora visualmente verticales con rosetas 3D, horizontales con cabezales, plataformas con nervaduras y materiales metalicos diferenciados.
- Agrega una segunda capa visual para plataformas, vigas puente U, horizontales U, vigas IPN y celosias/truss, con perfiles y triangulaciones mas reconocibles.
- Las piezas importadas o categorias no conocidas aparecen marcadas como no representadas.
- La visualizacion no verifica cargas, uniones ni viabilidad constructiva.
- Mantiene el HTML puro, sin build local.
- Usa Three.js desde CDN. Para una integracion final conviene fijar la dependencia dentro del proyecto.
- Incluye modo de presentacion cliente: vistas base, vistas guardadas en el navegador, recorrido automatico, pantalla limpia y captura PNG de la vista actual.

## Sellos obligatorios

Plano esquematico preliminar realizado unicamente con fines presupuestarios y comerciales. No utilizar como guia de armado ni documentacion tecnica definitiva.

Debe ser verificado y aprobado por un ingeniero estructural matriculado antes de su construccion.
