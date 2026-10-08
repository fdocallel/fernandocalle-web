# ONTOS — color de marca

Definido 21-jul-2026 (análisis en sesión; contrastes WCAG medidos, no estimados).

> **Paleta validada · 25-sep-2026.** Fernando, en revisión con Laura, aprueba colores corporativos y desarrollo, variantes funcionales, gama cálida, degradado y dirección. Fuente única vigente: `ONTOS/data/mensaje.json#fundamentos.color`; aprobación literal: `ONTOS/raw/marca/2026-09-25-paleta-validada-hogar-opacidades.md`. Capítulo de color cerrado: justificaciones individuales y conjunta, escala de arena y aplicación editorial al 20 % validadas (fuente: `ONTOS/raw/marca/2026-09-25-cierre-color-fernando-laura.md`). Manual vigente en `ONTOS/docs/ontos/manual-marca.html#color`. Reglas de uso retiradas por ahora del manual. Esta decisión **supersede** las restricciones históricas incompatibles sobre segundos colores y degradados. Lo que sigue es el inventario y criterio de implementación anterior, conservado como antecedente; los SVG y tokens de producción no se modifican por este apunte.

## El color: TEJA `#d4713b`

**Por qué este y no azul.** El sector AEC en España viste de azul corporativo (ingenierías clásicas)
y el mundo IA de morados/degradados; ambos son ruido. El terracota viene del relato de la marca:
arcilla y teja castellana, el atardecer sobre el granito del Acueducto. Desde el 23-ago-2026 la
teja es el **núcleo** de la marca N5 «conectado» (antes, la clave del arco V4): el centro que
ordena las 8 áreas, como la portada del sistema.
Cálido (humano, artesanal) sobre neutros minerales (riguroso, estructural): exactamente lo que vende
ONTOS — tecnología dirigida por una persona. Riesgo asumido: vecindad con el clay de Anthropic
(#CC785C), más rosado y desaturado que el nuestro; en nuestro mercado (consultoría AEC ES) no compite
y la asociación no perjudica.

## Paleta

| Token | Hex | Rol |
|---|---|---|
| **teja** | `#d4713b` | EL color de marca: el núcleo del logo, CTAs y acentos **sobre fondo oscuro** (5,7:1 ✓ texto) |
| **teja-quemada** | `#b0532a` | la teja para **texto/enlaces sobre fondo claro** (4,8-5,1:1 ✓ AA; la teja base ahí solo como gráfico ≥3:1) |
| **teja-clara** | `#e8956a` | realces finos sobre oscuro (8,2:1, AAA) |
| **tinta** | `#1c1a17` | texto sobre claro; negro cálido, nunca #000 |
| **granito** | `#6b6257` | secundario sobre claro (5,6-6,0:1 ✓) — la piedra del arco |
| **granito-claro** | `#a39a8c` | secundario sobre oscuro (6,6-6,9:1 ✓) |
| **hueso** | `#faf8f5` | fondo claro (papel/cal) |
| **noche** | `#0f0e0c` · panel `#171512` | fondo oscuro (el de la web) |

## Reglas de uso

1. **La teja es el núcleo: una sola pieza, el centro.** Proporción ~60/30/10 — neutros dominan
   (noche/hueso + granito), la teja aparece poco y por eso manda. Si un diseño tiene mucha teja,
   está mal.
2. Par accesible obligatorio: teja sobre oscuro · teja-quemada sobre claro. Nunca teja base como
   texto normal sobre claro.
3. El logo no cambia de teja: núcleo `#d4713b` fijo; la piedra (dovelas y radios) hereda (`currentColor` → tinta en
   claro, granito en oscuro).
4. Sin degradados, sin segundos colores de fantasía. Estados (ok/aviso/error) se definirán cuando
   haya producto que los necesite — no antes.

## Verificación

Matriz de contraste (umbral: 3:1 gráfico/texto grande · 4,5:1 texto AA):
`teja` → blanco 3,37 · hueso 3,18 · noche 5,72 · panel 5,40
`teja-quemada` → blanco 5,10 · hueso 4,81 · noche 3,78
`granito` → hueso 5,64 · `granito-claro` → noche 6,94 · `tinta` → hueso 16,4

Tokens listos para CSS en `tokens.css`.

## Tipografía (22-jul-2026 · wordmark redefinido 1-sep-2026)

- **WORDMARK «ONTOS»: Fraunces SemiBold (600), tracking corto (~0.02em)** — en TODOS los soportes
  (barra web, cierres de vídeo, banners, OG). Decisión de Fernando 1-sep-2026 sobre draft con 4
  candidatas en contexto real (`ONTOS/data/_cache/estilo-wordmark/`): la serif artesanal rima con
  teja y piedra y ya está autoalojada; mata la dispersión que causaba Avenir (fuente de Apple, no
  autoalojable — la web la aproximaba con la sans del sistema y los vídeos derivaron por su cuenta).
  El **punto teja «ONTOS.»** va en piezas de cierre/display; en la barra de navegación, sin punto.
  Para los generadores PIL: `fraunces-600.ttf` (estático, en esta carpeta).
- **Acompañamiento del wordmark** (lema, dominio) en sans; en los generadores locales puede seguir
  siendo Avenir Next Medium/Demi (no se sirve como fuente, solo pinta PNG).
- (Histórico 22-jul, superseded para el wordmark: Avenir Next Demi tracking ~0.2em, «la O geométrica
  rima con el anillo». Sigue valiendo para texto secundario de piezas generadas.)
- **Web** (remodelado v2, 19-ago-2026): titulares en **Fraunces** variable (400-700), autoalojada
  en `brand/fraunces.woff2` (67 KB, subset latin, `font-display: swap`) — carácter artesanal que
  rima con teja/piedra, sin conectar con servidores de terceros. Cuerpo sigue en system stack
  (ui-sans-serif). Tokens y familias en `tokens.css` (fuente única; claro por defecto desde v2).
- Alineación: los bloques de texto comparten borde óptico izquierdo (descontar side bearing).
