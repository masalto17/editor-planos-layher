# Roadmap del editor manual de piezas

## Objetivo

Crear una app separada para dibujar piezas nuevas y exportarlas como archivos
importables por el editor de planos.

No debe reemplazar el catalogo base ni modificar el modelo actual hasta que el formato
este validado con piezas reales.

## MVP recomendado

1. Lienzo vectorial en metros
   - grilla configurable;
   - herramientas de linea, rectangulo, circulo y polilinea;
   - unidades visibles en metros;
   - zoom y pan pensados para trackpad.

2. Datos tecnicos de pieza
   - nombre;
   - categoria;
   - referencia;
   - largo, alto, profundidad;
   - peso;
   - origen y estado de verificacion.

3. Puntos funcionales
   - puntos de conexion;
   - puntos de snap;
   - tipo de punto: roseta, extremo, apoyo, centro o libre.

4. Dos vistas obligatorias
   - alzado;
   - planta.

5. Exportacion
   - archivo `.json`;
   - validacion contra `pieza.schema.json`;
   - advertencias legales incluidas.

## Integracion futura con el editor actual

La integracion deberia hacerse en una fase posterior con un importador aislado:

1. leer uno o mas archivos JSON externos;
2. validar contra el esquema;
3. convertir cada pieza a una entrada de catalogo externo;
4. usar un renderer generico para las vistas vectoriales;
5. mostrar estas piezas en una seccion separada llamada "Piezas importadas".

## Riesgos a resolver antes de integrar

- Si una pieza tiene dibujo pero no puntos de conexion, no sirve para armado tecnico.
- Si una pieza tiene peso dudoso, debe quedar marcada como pendiente de verificacion.
- Si solo se dibuja alzado, planta queda incompleta y el modelo 3D se rompe.
- Si se mezclan piezas manuales con catalogo base, despues es dificil auditar despiece.

## Criterio de aceptacion del formato

Antes de programar el importador real, conviene probar el formato con al menos:

- una celosia;
- una mensula;
- un taco de madera;
- una escalera;
- una pieza propia de obra.

Cada prueba debe poder abrirse, verse en alzado/planta y producir una linea de
despiece clara.
