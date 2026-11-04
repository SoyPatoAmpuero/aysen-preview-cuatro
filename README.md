# Aysén Patagonia Tour — proyecto completo del sitio web

Maqueta web estática actualizada el 3 de noviembre de 2026. Incluye español, inglés internacional y portugués brasileño; escritorio y móvil; globo interactivo con rotación automática, líneas cartográficas verde oscuro que se desplazan con el scroll y recorrido nocturno con resplandor.

Esta carpeta contiene **todo el sitio**, no un bloque aislado: navegación, portada, historia de la agencia, programas, red comercial con globo interactivo, proceso “Cómo trabajamos”, formulario comercial, acceso para viajeros y pie de página. El código HTML, CSS y JavaScript es editable; no se necesita otro proyecto base para publicarlo.

## Subir a GitHub

1. Crea o abre el repositorio de destino.
2. Sube el **contenido** de esta carpeta a la raíz del repositorio: `index.html`, `assets/` y los archivos de configuración incluidos. No subas una carpeta `GITHUB` dentro de otra carpeta ni el ZIP sin descomprimir.
3. Confirma los cambios.
4. Si deseas que el sitio tenga una dirección pública, activa GitHub Pages para la rama de entrega y su carpeta raíz.

No necesita instalación, compilación, Node.js, claves ni una base de datos. Las rutas son relativas y permiten publicar también en un repositorio con subcarpeta de GitHub Pages.

## Idiomas

- `index.html`: español.
- `en.html`: inglés internacional (`en`), con ortografía estadounidense consistente.
- `pt.html`: portugués brasileño (`pt-BR`).

El selector ES / EN / PT funciona en escritorio y móvil. Cada versión es HTML completo, con su idioma, título, descripción y enlaces `hreflang`; el contenido editorial ya está traducido antes de ejecutar JavaScript. Se conserva la sección del enlace al cambiar de idioma. Los logos y nombres de marca usan los mismos archivos originales en las tres versiones.

La referencia editorial es `LOCALIZACION-B2B.md`. Las adaptaciones se mantienen en `assets/translations.js`; el español y el diseño común se editan en `index.html`. Después de editar cualquiera de ellos, ejecutar desde esta carpeta:

```sh
node scripts/build-locales.mjs
```

Este paso solo es necesario para actualizar los archivos de entrega; el sitio publicado no necesita Node.js. El generador detecta textos editoriales nuevos sin traducción para evitar dejar frases españolas mezcladas en las otras versiones. No editar directamente `en.html` o `pt.html`, porque se regeneran desde la fuente común.

`assets/i18n.js` localiza validación, mensajes y utilidades; `assets/i18n.css` adapta el selector y el ajuste del contenido. El globo localiza países, regiones, descripciones de demostración y anuncios accesibles, conservando los nombres de las agencias. Los datos comerciales futuros pueden proporcionar `translations['en']` y `translations['pt-BR']` en cada mercado (`country`, `region`) y agencia (`city`, `description`); los nombres y logos no se traducen.

Se aplicaron los ajustes de `AJUSTES IDIOMA/REVISION-IDIOMAS-AYSEN-PATAGONIA-TOUR.md`: titulares de historia, enfoque B2B en portugués, metadescripciones, red de agencias, CTA de itinerarios, paso 04 y terminología del pie y el globo. El inglés se identifica como `en` en todas las páginas y el selector se anuncia como “English”. Los elementos con `data-i18n` permiten adaptar una frase completa aunque en español contenga saltos de línea de diseño.

La implementación usa la guía terminológica B2B; sigue pendiente una revisión editorial humana nativa antes de considerar los textos aprobados para publicación.

## Vista previa local

Abre `index.html` en un navegador, con conexión a Internet para cargar las fuentes y fotografías externas. También puede servirse esta carpeta con cualquier servidor de archivos estáticos.

## Contenido de la entrega

- `index.html`: página principal con sus estilos y comportamiento general.
- `en.html` y `pt.html`: versiones localizadas completas.
- `assets/translations.js`, `assets/i18n.js`, `assets/i18n.css`: textos localizados, mensajes y ajustes de idiomas.
- `scripts/build-locales.mjs`: regeneración de las variantes desde el español y el diccionario editorial.
- `assets/network-globe.css`: diseño y adaptación del bloque del globo.
- `assets/network-globe.js`: exploración de países y fichas de agencias.
- `assets/network-dots.js`: representación del globo mediante puntos.
- `assets/network-data.js`: mercados y agencias editables.
- `assets/network-graticule.svg`: textura cartográfica estática de respaldo.
- `assets/network-graticule.js`: desplazamiento suave de las líneas al hacer scroll, también en pantallas táctiles, y ondulación local al pasar el mouse.
- `assets/world-countries.js`: geometrías de países.
- `assets/vendor/`: dependencias cartográficas locales y sus licencias.
- Imágenes y logos locales usados por la página.

## Estado funcional

Esta entrega está lista para subir y mostrar como maqueta en GitHub Pages. Conserva estos pendientes de contenido y operación:

- **El formulario no envía datos ni correos.** Valida los campos y muestra una confirmación de demostración. Se debe conectar un servicio de recepción antes de utilizarlo para recibir consultas reales; GitHub Pages por sí solo no recibe formularios.
- El globo utiliza agencias ficticias de demostración (`demoMode: true`). Reemplaza los datos por agencias autorizadas en `assets/network-data.js` antes de presentar la red como información comercial real.
- Los botones “Explorar” de programas están deshabilitados hasta incorporar sus páginas de destino.
- El pie mantiene los datos de contacto por incorporar y el aviso de sitio en desarrollo.
- Algunas fotografías son provisionales. Las fotografías remotas usan Unsplash; las fuentes se cargan desde Google Fonts. Se conservan las referencias actuales del proyecto.

## Comprobaciones de esta entrega

Se revisan los recursos locales, las rutas internas, la navegación, los controles del globo y el formulario en escritorio y móvil. Los campos conservan etiquetas accesibles, autocompletado y validación nativa; las etiquetas no se duplican con ejemplos dentro de los campos.

Para las variantes se comprobaron los tres idiomas en Chrome con anchos de 1440, 390 y 320 px: selector, navegación móvil, fichas del globo, avisos, formulario, validación y conservación del ancla al cambiar de idioma. La prueba móvil corresponde a tamaños emulados, no a dispositivos físicos.

El globo gira lentamente (una vuelta aproximada cada 90 segundos). La pausa de exploración se activa únicamente al posar el mouse dentro del círculo del planeta; al retirarlo, la rotación continúa sin demora. Seleccionar países, enfocar con el teclado o usar los controles no añade pausas. El arrastre y las transiciones a un país controlan directamente la orientación mientras duran, sin espera posterior. La animación se limita a 30 actualizaciones por segundo y se detiene cuando el bloque no está visible o la pestaña está oculta.

Las líneas cartográficas, ahora en verde oscuro, se desplazan suavemente con el scroll en escritorio y móvil; conservan la respuesta local al mouse en equipos con puntero. Con `prefers-reduced-motion`, las líneas usan el respaldo estático y el globo no gira automáticamente. El recorrido nocturno se muestra completo con movimiento reducido.

Las licencias de D3 se conservan en `assets/vendor/`. No se incluye una licencia general que conceda derechos sobre la marca o las fotografías.
