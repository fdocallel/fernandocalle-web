# fernandocalle.es

Web personal de Fernando Calle: la consultoría (portada), Aplicaciones, Sobre mí, escritos, BIM y las demos.
HTML vanilla, sin build. Deploy previsto: GitHub Pages (`fdocallel/fernandocalle-web`, push a main; `CNAME` = fernandocalle.es).

## De dónde viene (8-oct-2026)

Nace como **clon con el historial completo de `ontosdigital-web`** (la web pública de ontos), por la separación
decidida por Fernando el 8-oct-2026: la consultoría es personal y ontos es el producto. Plan y reparto página a
página: ONTOS `docs/estudios/2026-10-08-separar-web-personal-y-ontos.md`.

- Se quedan en ontosdigital.es (y aquí se podaron): `producto.html`, los casos, los clips, `armario.html`,
  `entrar.html`, `solicitud.html` y `producto/`. Los enlaces a ellas apuntan a `https://ontosdigital.es/<ruta>`
  (en /en/, a su espejo `/en/` de allí).
- La barra firma con el **logotipo provisional** de la consultoría (8-oct-2026): símbolo de ontos (`brand/canon/icon-color.svg`,
  decorativo, `alt=""`) + «Fernando Calle» en Jost, un solo enlace a `/`. Lo escribe `import-marca.cjs` (que además retira
  cualquier `item--ontos`: «ontos» ya no está en el menú; el puente queda en la portada y en Aplicaciones). Medidas en
  `brand/marca-es.css`, excepción 3.1.6.3 del manual: diámetro 1,48 em (27,2 px a 18,4 px; ≈ 1,9 × letras altas),
  centro a 0,35 em sobre la línea de base (mitad de las mayúsculas), separación 0,349 × diámetro y borde izquierdo en
  `--web-content-left`. Barra móvil de 60 px también a 320 (huecos de 8/4 px bajo 24/22rem).
- Portada (8-oct-2026): «Qué es ontos» sale como sección; su texto (mensaje.json `web.que_es`) va en la caja de
  «Próximamente» (tras «Así empieza un encargo», antes de «Hablamos»): imagotipo del canon (96 px de símbolo), «Próximamente.»
  y su bajada como primer texto, qué es ontos y las dos ediciones. Familias y casos comparten rejilla (4 · 2 × 2 · carriles
  sincronizados en móvil, con los controles bajo los casos); los casos van pegados a sus familias, sin titular (queda como
  `aria-label`), y el caso n es el «Ejemplo real» de la familia n (lo vigila `test-marca-es.cjs`).
- `brand/` es una copia; la canónica sigue en `ontosdigital-web` (la leen los scripts de ONTOS). El canon de marca
  se importa igual (`scripts/import-marca.cjs`).
- Dominio en: `CNAME`, `robots.txt`, `gen-sitemap.sh` (`DOMINIO`), `i18n/gen-en.py` (`DOMINIO`),
  `scripts/test-marca-es.cjs` (`DOMINIO`) y los HTML (canonical, og, JSON-LD, `_next`).
- Puente a ontos (8-oct-2026): Aplicaciones recupera la balda 01 «Tu contexto para la IA» con Armario, que abre
  `https://ontosdigital.es/armario.html` (evento `servicio-probar-armario`) y enlaza «Conocer ontos»; la familia 01 de la
  portada enlaza a ontosdigital.es. Fuera de aquí: las solicitudes de acceso (privacidad) y la opción «Usar ontos» del formulario.
- Imagen social propia (8-oct-2026): `python3 brand/gen-og.py` → `brand/og.png` y `brand/og-en.png` (nombre, rótulo
  de la portada y dominio; Jost y tokens de `brand/canon/`, sin logotipo). `import-marca.cjs` ya no exporta `canon/og*.png`.
- Pendiente: sitio GoatCounter `fernandocalle` (los contadores ya apuntan a él), Pages y DNS, Search Console.
  Correo: `hola@ontosdigital.es`.

Todo lo que sigue es la historia heredada de ontosdigital-web; donde dice ontosdigital.es, la regla vale aquí con
el dominio propio.

## Estructura v5 (24-sep-2026, rama web-v5-consultoria)

Decisión: `ONTOS/docs/estudios/2026-09-24-web-consultoria-primero.md`. Estilo: referente anthropic.com (spec del crítico, 24-sep).

- `/` — la **consultoría** es la portada: gancho, entrada, Qué es ONTOS, familias de la oferta (canon: ONTOS data/ontos-empresa.json#lineas), así empieza un encargo, tres trabajos, quién, contacto.
- `aplicaciones.html` — galería + bloque «Próximamente» (ONTOS personal · ONTOS empresarial) con enlaces a `producto.html` y a los vídeos.
- `fernando-calle.html` — «Sobre mí»: bio + `#escritos` (antes `blog.html`).
- `consultoria.html` → `/` y `blog.html` → `fernando-calle.html#escritos`: redirecciones (meta refresh + JS, canonical al destino, noindex), fuera del sitemap.
- `producto.html`, casos, demos, `contacto.html`, `solicitud.html`, `entrar.html`: se quedan; producto fuera de la barra.
- Barra española en todas las páginas con `<header class="barra">`: ONTOS (= inicio) · Aplicaciones · Sobre mí · icono de contacto · EN. Consultoría se retira del menú el 27-sep; continúa siendo la portada. En móvil (≤34rem) dos filas: marca, icono e idioma arriba; Aplicaciones y Sobre mí debajo. La versión inglesa comparte la misma cabecera y cambia el conmutador a ES.
- `brand/barra.js`: (1) el wordmark se pliega al símbolo al pasar la cabecera de la página (centinela + IntersectionObserver, `html.is-condensado`); (2) el icono de contacto y los enlaces con `data-contacto` abren un `<dialog>` con el formulario de `contacto.html`, que se trae por fetch (el formulario vive una vez; en /en/ trae el inglés). Sin JS son enlaces a `contacto.html`. Abrir el diálogo cuenta el evento GoatCounter `contacto-popup`.
- `brand/barra.js` (3), 28-sep-2026: **dock móvil** (≤34rem) con «Cuéntame tu caso» (abre el mismo diálogo) y Compartir (Web Share, evento GoatCounter `compartir`; sin soporte no aparece). Solo en páginas indexables con barra y fuera de contacto; aparece con el logo plegado y se retira si hay a la vista otro CTA de contacto, un formulario o el pie. Auditoría y verificación: `ONTOS/data/_cache/web-movil-2026-09-28/`.
- `.nojekyll` en la raíz: GitHub Pages sirve `producto/README.md` tal cual, sin renderizarlo.

El espejo inglés se actualiza a la v5 el 28-sep-2026 por orden de Fernando. La estructura y la marca se comparten; los textos se traducen desde sus diccionarios. Los commits utilizan el hook bilingüe y el contrato de conservación.

## Español e inglés

El sitio está en dos idiomas y cumple DATO ÚNICO: **la estructura vive una sola vez**.
La página española es la fuente (HTML, CSS, animaciones); lo único duplicado es el texto,
y su versión inglesa vive en `i18n/en/<pagina>.json`.

- `/*.html` — **fuente**. Se edita a mano.
- `/en/*.html` — **GENERADO**. No se edita nunca: se borra y se vuelve a generar.
- `i18n/en/*.json` — las traducciones, una clave por frase (la frase española normalizada).
- `i18n/gen-en.py` — el generador. Traduce el texto, reescribe rutas a `/en/`, pone
  `lang="en"`, canonical propio, `hreflang` en las dos versiones y localiza el JSON-LD.
- `i18n/pon.py` — utilidad: rellena un JSON con las traducciones leídas de stdin, en orden.

### Flujo

```sh
./i18n/gen-en.py --extraer   # vuelca a i18n/en/*.json las frases nuevas (vacías)
#                              … se traducen a mano …
./i18n/gen-en.py             # genera /en/ · FALLA si queda algo sin traducir
```

El hook de pre-commit (`hooks/pre-commit`, instalar con
`git config core.hooksPath hooks`) hace las dos cosas y el sitemap en el flujo bilingüe.
El modo `ONTOS_WEB_SCOPE=es` queda como referencia de la fase española anterior; esta entrega usa el flujo bilingüe normal.

### Reglas

- Si tocas texto español, la clave cambia: `--extraer` la saca vacía y `gen-en.py` no
  deja generar hasta traducirla. Esa es la red de seguridad contra un espejo a medias.
- Página nueva → añadirla a `PAGINAS` en `gen-en.py` (con si es indexable o no) y meterle
  el conmutador de idioma en la barra: `<a class="item idioma" data-i18n-alt href="/en/…">EN</a>`.
- Los legales llevan nota de traducción de cortesía: **prevalece el texto español**.


## Demos interactivas de Aplicaciones (antes «Servicios»; URL `aplicaciones.html` desde el 21-sep-2026, `servicios.html` redirige)

`juego-2d.html`, `animacion-3d.html` y `visita-3d.html` son páginas públicas independientes, con teclado, controles táctiles y regreso a Aplicaciones. La visita abre el mundo normal por defecto; `?mundo=segovia` muestra Segovia. Sus espejos ingleses se generan con el flujo anterior.

Los motores y la malla de `experiencias/` son **copias de entrega generadas**, no fuentes para editar. `experiencias/provenance.json` registra la procedencia y las huellas SHA256 de entrada y salida. La actualización es explícita:

```sh
python3 scripts/import-experiencias.py /ruta/al/repositorio/ONTOS
./i18n/gen-en.py
```

El importador admite solo los dos motores procedurales y la malla del Alcázar con campos y licencia validados antes de escribir. Solo Segovia solicita esa malla; el mundo normal y la figurita no la descargan. No copia la navegación, los datos ni los servicios de la consola privada. Si cambia la estructura de las fuentes, el importador falla para que se revise la transformación.

`i18n/en/experiencias-runtime.json` contiene los mensajes dinámicos traducidos; el generador produce `experiencias/i18n.js`. Al añadir mensajes al motor, actualizar ese diccionario, volver a importar y regenerar. Los HTML españoles y `experiencias/demo.css` definen la presentación pública.

Antes de publicar una actualización de motores, revisar el diff y comprobar las tres demos con teclado y controles táctiles: movimiento, saludo, zoom, pausa/reinicio, errores WebGL, vuelta a Aplicaciones y versión inglesa. La importación nunca se ejecuta automáticamente desde el despliegue público.

## Medición de Aplicaciones · 11-sep-2026

Aplicaciones (`aplicaciones.html`, hasta el 21-sep `servicios.html`) y las demos usan la cuenta GoatCounter existente. Las visitas mantienen sus rutas ES/EN; la visita 3D distingue `?mundo=normal` y `?mundo=segovia` aunque ambas compartan canonical de SEO.

Los enlaces de las tarjetas de Aplicaciones emiten `servicio-probar-editor-pdf`, `servicio-probar-juego-2d`, `servicio-probar-animacion-3d`, `servicio-probar-mundo-normal`, `servicio-probar-segovia` y, desde el 21-sep-2026, `servicio-probar-modelado-3d`, `servicio-probar-armario` (21-sep-2026, tarjeta 07; la página armario.html emite además `armario-play` y `armario-contacto`) (página `modelado-3d.html`: vídeo de la casa de contenedores reconstruida desde un vuelo de dron; el play emite `modelado-3d-play`) y `servicio-probar-web-jmcasado` (enlace externo a josemariacasado.com, la web galería del encargo nº1). Los ids son estables entre idiomas. Son **clics de intención**, no usuarios únicos ni prueba de que se haya usado una función. `data-goatcounter-no-session="1"` conserva clics repetidos; no calcular una conversión de personas dividiendo estos clics por visitas. No hay tracking retrospectivo anterior al despliegue. Los referidos ayudan a relacionar tráfico con LinkedIn, pero no identifican por sí solos un post concreto ni demuestran causalidad.

Para excluir las visitas propias en cada navegador/perfil, abrir una vez [Aplicaciones sin estadísticas](https://ontosdigital.es/aplicaciones.html?sinestadisticas=1). Es idempotente y muestra confirmación. La preferencia nativa `skipgc=t` se conserva en ese navegador y afecta también al Editor PDF y al resto del sitio, cuyos contadores existentes la respetan. No depende de una IP fija. [Reactivar explícitamente](https://ontosdigital.es/aplicaciones.html?sinestadisticas=0) elimina la preferencia; la siguiente página vuelve a contar. Las visitas de configuración no cuentan. Borrar almacenamiento, usar incógnito o cambiar navegador/perfil requiere excluir de nuevo.

La integración sigue la documentación oficial de [eventos](https://www.goatcounter.com/help/events), [API JavaScript](https://www.goatcounter.com/help/js) y [exclusión de visitas propias](https://www.goatcounter.com/help/skip-dev), comprobada el 11-sep-2026. No añade proveedores ni identificadores propios de visitantes.

Prueba sin contaminar analítica: descargar `https://gc.zgo.at/count.js` a un fichero temporal y ejecutar `node scripts/test-aplicaciones-analytics.cjs /tmp/count.js` desde este repo. Utiliza Chrome headless y Playwright de ONTOS (o `PLAYWRIGHT_MODULE`); intercepta **todas** las peticiones y simula el host público localmente. Comprueba ES/EN, rutas y cinco eventos, exclusión persistente/idempotente, páginas anteriores y reactivación.

Control Web puede confirmar la exclusión **en el navegador que pulsa el botón**, sin guardar una confirmación ficticia en el origen local. Abre una ventana por gesto del usuario con `aplicaciones.html?sinestadisticas=1&ontos_request=<nonce>` (nonce aleatorio de 16–128 caracteres alfanuméricos, `_` o `-`). Conserva la referencia a esa ventana y envía `{type:'ontos-analytics-status-request', nonce}` a `https://ontosdigital.es`. La página pública responde únicamente a su `opener`, con `{type:'ontos-analytics-status', nonce, disabled}`; lee `skipgc` en ese momento (`null` si no puede acceder al almacenamiento) y usa como `targetOrigin` el origen HTTP(S) exacto del mensaje recibido. No acepta navegación ni comandos desde mensajes.

La consola debe validar **origin, source y nonce**, mostrar estado desconocido hasta la respuesta y aplicar timeout si el navegador bloquea la ventana o separa el opener. La confirmación vive solo en memoria: no certifica otros dispositivos/perfiles ni sustituye la lectura real. `node scripts/test-analytics-popup.cjs` comprueba origen cruzado, mensajes falsificados, lectura actualizada y almacenamiento inaccesible con red interceptada. Cabeceras públicas comprobadas el 11-sep: sin `Cross-Origin-Opener-Policy` que corte el opener; si eso cambia, el timeout debe conservar «no confirmado».


## Aplicación de marca · ES/EN · 27-sep-2026

La v5 conserva contenido, estructura, rutas y medios. La marca española usa el manual de ONTOS: Jost corporativa, Newsreader editorial, firma vectorial Jost/N5, paleta y roles de interfaz. El diseño específico vive en `brand/marca-es.css`; `brand/canon/` contiene copias de entrega generadas y su procedencia. La imagen social conserva el titular de la portada y el dominio. Los patrones web nuevos siguen en revisión en el Design System §5.4.

```sh
node scripts/import-marca.cjs /ruta/al/repositorio/ONTOS
node scripts/import-marca.cjs /ruta/al/repositorio/ONTOS --check
node scripts/test-marca-es.cjs --bilingue
```

El importador necesita Node y el Playwright/WebKit ya instalado en ONTOS para rasterizar localmente la imagen social. La web servida sigue siendo HTML/CSS/JS estático, sin compilación en producción. Se exporta únicamente la selección pública de marca, nunca los JSON privados completos. Los logotipos no se redibujan ni se componen con texto HTML.

La orden de publicación del 27-sep amplía el alcance a **español e inglés**. El generador conserva el atributo `data-ontos-web` y ambos idiomas consumen la misma capa de marca y composición de home. El hook normal regenera EN y sitemap, valida conservación ES y comprueba la cobertura del espejo. Los apartados de pruebas que siguen son el historial de la composición; el estado vigente se resume al final.

Instalación del hook: `git config core.hooksPath hooks`. Git utiliza así el archivo de la rama activa incluso en un worktree. El antiguo enlace simbólico desde `.git/hooks` resolvía el hook de main y podía saltarse el modo español. Verificar el hook instalado con `git hook run pre-commit` antes de guardar la entrega bilingüe.

### Cabecera Arcilla y fondo verde · 27-sep-2026

La corrección de Fernando aplica verde corporativo en ambos modos de color y sustituye la firma grande por Arcilla compacto (150 × 50 px reservados). El importador incluye el motor canónico y solo su geometría/configuración pública en `brand/canon/movimiento*.js`; el enlace sigue volviendo al inicio. Se transforma con scroll 80–600 px, recupera el nombre al dar foco o posar el cursor y respeta movimiento reducido. Sin JavaScript permanece el wordmark SVG. Tamaños y color se consumen desde tokens; los detalles de aplicación se documentan en Design System 5.4.

### Prueba de verde profundo en portada · 27-sep-2026

Por petición de Fernando se prueba `#183D33` solo como fondo de la home española (Consultoría), incluida su cabecera. El valor provisional vive en `brand/marca-es.css`, limitado a `data-web-page="index"`; las páginas interiores y los paneles conservan sus colores. No se incorpora al manual ni se modifica la paleta aprobada hasta valorar la prueba.

Se retira «Consultoría» de las 17 cabeceras españolas que lo incluían. El logotipo sigue enlazando a `/` y `consultoria.html` conserva su redirección. La prueba de conservación admite exclusivamente esta retirada del menú; sigue comparando el resto del contenido y protegiendo inglés y los recursos compartidos. Vista previa: http://mac-mini:8795/. Publicación pendiente de la valoración de esta prueba.

### Dirección vigente: fondo claro y bloque expansivo · 27-sep-2026

La nueva petición sustituye el fondo verde general de las entregas anteriores. Las páginas corporativas españolas y el resto de la home usan la base editorial del manual: arena al 20 % sobre hueso (`--web-page-surface`, alias de `--ds-surface-page`), paneles hueso y tinta verde. El importador adapta firmas y color del navegador a esa base. Las escenas de cine mantienen su dirección de arte; inglés conserva su versión.

La frase introductoria abre la home, alineada a la izquierda y con tamaño medio. Debajo, el bloque verde oscuro reúne el rótulo, el titular y Cuéntame tu caso. Empieza con márgenes y alcanza el ancho completo al hacer scroll, con textura y degradado sutiles. Se inspira en la composición y expansión medidas en anthropic.com el 27-sep-2026, sin importar sus activos ni scripts.

`brand/home-es.css` compone esta pieza y contiene el color local en prueba; `brand/home-es.js` vincula la expansión y el parallax al desplazamiento, sin capturar la rueda. Sin JavaScript y con movimiento reducido se conserva una tarjeta estática legible. El enlace de contacto mantiene su formulario. La prueba de conservación contempla únicamente el menú retirado y la nueva disposición de la apertura; el resto del contenido sigue protegido. Continúa en vista previa.

### Alineación común y subtítulo de portada · 27-sep-2026

El marco exterior de las páginas corporativas sigue dos guías: la primera «o» visible de la marca inicial y el borde exterior del botón de idioma. Los márgenes se comparten con la introducción y el rectángulo verde de la home; las columnas de lectura y los formularios pueden ser más estrechos dentro de ese marco. El importador deriva la posición de la «o» de la geometría canónica y corrige la posición del SVG estático sin cambiar sus contornos.

La introducción aumenta 2 px y usa peso 700. A su derecha aparece un subtítulo nuevo, menor y en peso 300, gobernado por `mensaje.json` (`web.subtitulo`) y exportado por `import-marca.cjs`. En móvil se apilan. El rectángulo tiene más textura y degradado, con rótulo, titular y acción centrados. La expansión reduce cada margen desde su posición inicial hasta el ancho completo. Estos ajustes permanecen en [vista previa](http://mac-mini:8795/).

### Auditoría previa a publicación · 27-sep-2026

Se revisan las 30 páginas españolas y el editor bilingüe. Se corrigen lectura demasiado ancha, regiones principales/salto de teclado, controles de PDF y cine, 404 en rutas anidadas, metadatos de demos/editor, fechas ES del sitemap, reglas de rastreo y precisiones operativas de BIM/privacidad. Las imágenes inferiores cargan al acercarse y Arcilla solo se exporta a páginas con cabecera. Las demos y el editor explican su dependencia de JavaScript cuando está desactivado.

El atributo `data-ontos-web` delimita la marca, para que el editor mantenga su diseño al alternar ES/EN. El espejo inglés no lleva ese atributo y conserva sus archivos. `scripts/fixtures/revision-prepublicacion.json` recoge únicamente los fragmentos editoriales corregidos: permite que el contrato siga detectando pérdidas de contenido fuera de esta revisión.

El editor desactiva `isEvalSupported` en cada llamada a PDF.js, siguiendo la [mitigación de Mozilla para CVE-2024-4367](https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq). El guard existente comprueba esa configuración y su caso rojo; no se ha migrado la biblioteca. La prueba funcional con PDF sintético verifica selección, giro, inserción, eliminación, orden por teclado y exportación.

Revisión visual WebKit, navegación Chromium/WebKit, axe inicial de 27 destinos sin redirecciones y editor con PDF cargado; contrato de contenido, importación reproducible y handshake de analítica pasan. Las solicitudes de formulario se interceptan para las pruebas: su resultado no certifica recepción real de correo. Informe y fuentes en el expediente privado de ONTOS, `docs/diseno/ontos/web/marca/AUDITORIA-FINAL.md`. La publicación sigue pendiente.


### Publicación bilingüe v5 · 28-sep-2026

Fernando autoriza la versión inglesa, la publicación y el cierre. Se generan 29 espejos EN desde la fuente ES; el editor PDF sigue siendo una sola app bilingüe, enlazada con `?lang=en`. Se localizan metadatos, JSON-LD, accesibilidad, navegación y redirecciones. Las tarjetas sociales de ambos idiomas se generan desde sus textos canónicos. El verde profundo del panel de home se registra como `web-home-surface` con alcance exclusivamente web; el resto conserva el fondo claro.

Flujo vigente: importar el canon, regenerar EN y sitemap, ejecutar `node scripts/test-marca-es.cjs --bilingue`, revisar escritorio/móvil y desplegar `main`. El contrato conserva las 30 fuentes ES, sus correcciones auditadas, la cobertura EN y los recursos compartidos. `servicios.html` añade canonical a Aplicaciones; los redirects no entran en el sitemap. Las fechas de páginas o traducciones modificadas se actualizan antes del commit.

La prueba real de recepción del formulario continúa pendiente de autorización específica; las pruebas funcionales interceptan las solicitudes externas.

## Canon de ONTOS en las comprobaciones (3-oct-2026)

El hook no lee el canon (marca, mensaje, oferta, elementos) del árbol de trabajo de ONTOS, sino de su **último commit**. `scripts/ontos-canon.sh` mantiene una copia desacoplada en `~/Dev/.ontos-canon-web`, la sitúa en el HEAD de ONTOS en cada commit (menos de 1 s) y exporta `ONTOS_BRAND_ROOT`. Lo que otra sesión tenga a medio editar en ONTOS ya no rompe el hook ni se cuela en `brand/canon/`. Consecuencia: **commitear primero en ONTOS** el canon que la web va a consumir. Para forzar otra raíz, exportar `ONTOS_BRAND_ROOT` antes del commit. Si no puede situar la copia, el hook falla cerrado.
