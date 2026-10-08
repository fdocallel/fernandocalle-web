#!/usr/bin/env python3
"""Imagen social (og:image / twitter:image) de la web personal, 1200x630, ES y EN.

Fernando Calle + una línea de la consultoría + dominio. Sin logotipo de ontos (8-oct-2026).
Manual de marca de ontos: Jost corporativa (brand/canon/fonts) y colores de brand/canon/tokens.json,
ambos generados por scripts/import-marca.cjs. Heredero de brand/gen-og.py de ontosdigital-web
(render a 4x y reducción LANCZOS), sin Avenir ni Fraunces.

DATO ÚNICO: la línea es el rótulo de la portada (index.html, .home-feature .kicker) y su traducción
en i18n/en/index.json; el dominio sale de CNAME. Si falta algo, falla: nunca una imagen con texto viejo.

Uso: python3 brand/gen-og.py        → brand/og.png y brand/og-en.png
"""
import json, re, sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WEB = Path(__file__).resolve().parents[1]
W, H, S = 1200, 630, 4

tokens = {t["id"]: t["valor"] for t in json.loads((WEB / "brand/canon/tokens.json").read_text())["tokens"]}
def rgb(token):
    v = tokens[token].lstrip("#")
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))

FONDO = rgb("web-home-surface")      # verde profundo del panel de portada
TINTA = rgb("web-dark-ink")          # hueso sobre oscuro
SECUNDARIO = rgb("web-dark-muted")   # arena sobre oscuro
ACENTO = rgb("brand-teja")
JOST = WEB / "brand/canon/fonts/jost.ttf"

dominio = (WEB / "CNAME").read_text().strip()
m = re.search(r'<p class="kicker">([^<]+)</p>', (WEB / "index.html").read_text())
if not m or not dominio:
    sys.exit("gen-og: falta el rótulo de portada (index.html .kicker) o el dominio (CNAME)")
linea_es = m.group(1).strip()
linea_en = json.loads((WEB / "i18n/en/index.json").read_text()).get(linea_es)
if not linea_en:
    sys.exit(f"gen-og: falta la traducción de «{linea_es}» en i18n/en/index.json")


def jost(size, weight):
    f = ImageFont.truetype(str(JOST), size * S)
    f.set_variation_by_axes([weight])
    return f


def tarjeta(linea, salida):
    img = Image.new("RGB", (W * S, H * S), FONDO)
    # luz cálida muy sutil arriba a la izquierda, como el degradado del panel de portada
    luz = Image.radial_gradient("L").resize((1800 * S, 1800 * S)).point(lambda v: int((255 - v) * 0.10))
    img.paste(Image.new("RGB", luz.size, rgb("web-dark-panel")), (int(-500 * S), int(-900 * S)), luz)
    d = ImageDraw.Draw(img)
    x = 96 * S  # margen izquierdo: composición alineada a la izquierda, como la apertura de la web

    nombre = jost(112, 500)
    d.text((x, 232 * S), "Fernando Calle", font=nombre, fill=TINTA, anchor="ls")
    # filete teja: el único acento
    d.rectangle([x, 280 * S, x + 72 * S, 286 * S], fill=ACENTO)
    d.text((x, 372 * S), linea, font=jost(48, 400), fill=TINTA, anchor="ls")
    d.text((x, 530 * S), dominio, font=jost(30, 600), fill=SECUNDARIO, anchor="ls")

    img.resize((W, H), Image.LANCZOS).save(salida, optimize=True)
    print("ok", salida.relative_to(WEB))


tarjeta(linea_es, WEB / "brand/og.png")
tarjeta(linea_en, WEB / "brand/og-en.png")
