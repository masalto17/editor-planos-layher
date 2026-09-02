# Editor de piezas importables

Este paquete define una linea paralela para crear piezas manuales sin tocar el editor
principal de planos. La salida esperada del futuro editor manual es un archivo JSON
validable e importable.

La pieza importable no es solamente un dibujo. Debe contener geometria, puntos de
conexion y datos tecnicos minimos para que el editor de planos pueda:

- mostrarla en alzado y planta;
- calcular bounds de seleccion;
- engancharla a rosetas, verticales o nodos definidos;
- incluirla en el despiece por nombre, referencia, cantidad y peso;
- distinguir piezas oficiales de piezas propias o no verificadas.

## Archivos

- `pieza.schema.json`: contrato tecnico del archivo importable.
- `ejemplos/celosia-u-257.json`: ejemplo de una celosia U de 2.57 m.
- `roadmap-editor-manual.md`: alcance recomendado para construir la app de dibujo.

## Decision de arquitectura

La app actual debe mantenerse como editor de planos. El editor de piezas debe ser una
herramienta separada que exporte archivos `.json`.

Cuando el formato este aceptado, la integracion futura deberia limitarse a un
importador que lea estas piezas y las agregue como catalogo externo, sin mezclar datos
manuales con el catalogo base.

## Estado

Documento de diseno inicial. No esta conectado al editor principal.
