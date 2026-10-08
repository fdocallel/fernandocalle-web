#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera el espejo en inglés de la web personal (fernandocalle.es) dentro de /en/.

DATO ÚNICO: la estructura (HTML, CSS, animaciones) vive UNA vez, en la página
española. Lo único que vive dos veces es el texto, y la versión inglesa vive en
i18n/en/<pagina>.json. Los ficheros de /en/ son GENERADOS: no se editan a mano,
se borran y se vuelven a hacer.

Uso:
  ./i18n/gen-en.py            genera /en/ y falla si falta alguna traducción
  ./i18n/gen-en.py --extraer  vuelca las cadenas de cada página a i18n/en/<p>.json
                              (conserva lo ya traducido, añade las nuevas vacías)
"""
import json, os, re, sys, html as htmlmod

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(RAIZ, "i18n", "en")
SALIDA = os.path.join(RAIZ, "en")
DOMINIO = "https://fernandocalle.es"  # DOMINIO_PERSONAL
# Las páginas de producto se quedaron en ontosdigital.es (8-oct-2026): sus enlaces en inglés
# van a su espejo /en/ de allí.
ONTOS = "https://ontosdigital.es"

# Páginas del espejo. `indexable` decide si lleva hreflang y entra en el sitemap.
PAGINAS = [
    ("index.html", True),
    ("consultoria.html", False),  # redirección a / (web v5, 24-sep-2026), sin índice
    ("contacto.html", True),
    ("bim.html", True),
    ("aplicaciones.html", True),
    ("modelado-3d.html", True),
    ("servicios.html", False),   # redirección: la URL antigua de Aplicaciones (21-sep-2026), sin índice
    ("juego-2d.html", True),
    ("animacion-3d.html", True),
    ("visita-3d.html", True),
    ("escrito-plan-bim-ingenieria.html", True),
    ("blog.html", False),         # redirección a fernando-calle.html#escritos (web v5, 24-sep-2026), sin índice
    ("fernando-calle.html", True),
    ("gracias.html", False),
    ("privacidad.html", False),
    ("aviso-legal.html", False),
    ("404.html", False),
]
ESPEJO = {p for p, _ in PAGINAS}
INDEXABLES = {p for p, i in PAGINAS if i}

# ---------------------------------------------------------------- tokenizado
TOKEN = re.compile(
    r"(<!--.*?-->"
    r"|<script\b[^>]*>.*?</script>"
    r"|<style\b[^>]*>.*?</style>"
    r"|<textarea\b[^>]*>.*?</textarea>"
    r"|<[^>]+>)",
    re.S | re.I,
)
ATRIB = re.compile(r"""([:@a-zA-Z_][-:.\w]*)\s*=\s*("[^"]*"|'[^']*')""")
LETRA = re.compile(r"[A-Za-zÀ-ÿ]")

# Atributos cuyo valor es texto para humanos.
ATRIB_TEXTO = {"alt", "title", "aria-label", "placeholder", "data-etiqueta"}

# Marcado que va DENTRO de una frase: se traduce junto al texto que lo rodea, para
# no partir la frase en trozos que en inglés no se pueden recomponer.
EN_LINEA = {
    "a", "abbr", "b", "big", "br", "cite", "code", "del", "em", "i", "ins", "kbd",
    "mark", "q", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr",
}
CIERRE = re.compile(r"</\s*([\w:-]+)", re.I)
APERTURA = re.compile(r"<\s*([\w:-]+)", re.I)


def es_en_linea(tag):
    m = APERTURA.match(tag) or CIERRE.match(tag)
    return bool(m) and m.group(1).lower() in EN_LINEA


def rehaz_rutas(fragmento):
    """Reescribe href/src de las etiquetas en línea que van dentro de una frase."""
    def uno(m):
        nueva = ruta_en(m.group(2))
        return '%s="%s"' % (m.group(1), nueva)
    return re.sub(r'\b(href|src)="([^"]*)"', uno, fragmento)


def clave(t):
    """Clave canónica de un trozo de texto: espacios normalizados."""
    return " ".join(t.split())


def traducible(k):
    return bool(k) and bool(LETRA.search(k))


# ---------------------------------------------------------------- rutas
def ruta_en(destino):
    """Reescribe un href/src de la página española a su equivalente dentro de /en/."""
    if not destino:
        return destino
    if destino.startswith(DOMINIO):
        return ruta_en(destino[len(DOMINIO):] or "/")
    if destino.startswith(ONTOS + "/") and not destino.startswith(ONTOS + "/en/"):
        resto = destino[len(ONTOS) + 1:]
        if resto == "" or resto.split("#")[0].split("?")[0].endswith(".html"):
            return ONTOS + "/en/" + resto
        return destino
    if destino.startswith(("#", "mailto:", "tel:", "http://", "https://", "//", "data:")):
        return destino
    # El editor PDF es una única aplicación bilingüe, fuera del espejo /en/.
    ruta, almohadilla, fragmento = destino.partition("#")
    ruta, interrogacion, consulta = ruta.partition("?")
    if ruta == "/editor-pdf/":
        parametros = [p for p in consulta.split("&") if p and not p.startswith("lang=")]
        parametros.append("lang=en")
        return ruta + "?" + "&".join(parametros) + (almohadilla + fragmento if almohadilla else "")
    if destino == "/":
        return "/en/"
    base, sep, ancla = destino.partition("#")
    base, query_sep, query = base.partition("?")
    ancla = query_sep + query + sep + ancla
    sep = ""
    if base in ("./", "."):
        return "/en/" + sep + ancla
    if base in ESPEJO:
        return "/en/" + base + sep + ancla
    if base.startswith("/"):
        hoja = base.lstrip("/")
        if hoja == "":
            return "/en/" + sep + ancla
        if hoja in ESPEJO:
            return "/en/" + hoja + sep + ancla
        return destino
    # activo compartido (brand/…): a ruta absoluta, que /en/ está un nivel abajo.
    # Si existe una versión inglesa propia con sufijo -en (brand/x-en.jpg junto a brand/x.jpg),
    # el espejo la usa (21-sep-2026: el póster de la demo del inicio lleva texto).
    raiz_activo, ext = os.path.splitext(base)
    if ext and os.path.exists(os.path.join(RAIZ, raiz_activo + "-en" + ext)):
        base = raiz_activo + "-en" + ext
    return "/" + base + sep + ancla


def url_es(pagina):
    return DOMINIO + ("/" if pagina == "index.html" else "/" + pagina)


def url_en(pagina):
    return DOMINIO + ("/en/" if pagina == "index.html" else "/en/" + pagina)


# ---------------------------------------------------------------- traducción
class Diccionario:
    def __init__(self, pagina):
        self.pagina = pagina
        self.ruta = os.path.join(I18N, pagina.replace(".html", ".json"))
        self.mapa = {}
        if os.path.exists(self.ruta):
            with open(self.ruta, encoding="utf-8") as f:
                datos = json.load(f)
            self.mapa = {k: v for k, v in datos.items() if not k.startswith("_")}
        self.vistas = []          # orden de aparición, para --extraer
        self.faltan = []

    def __call__(self, k):
        if k not in self.vistas:
            self.vistas.append(k)
        v = self.mapa.get(k)
        if v:
            return v
        if k not in self.faltan:
            self.faltan.append(k)
        return k

    def volcar(self):
        datos = {
            "_doc": "Traducción al inglés de %s. La estructura vive en la página española; "
                    "aquí solo el texto. Genera con ./i18n/gen-en.py" % self.pagina,
        }
        for k in self.vistas:
            datos[k] = self.mapa.get(k, "")
        with open(self.ruta, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
            f.write("\n")


# ---------------------------------------------------------------- etiquetas
def traduce_etiqueta(tag, tr, pagina, indexable):
    """Devuelve la etiqueta reescrita para la versión inglesa."""
    nombre = re.match(r"</?\s*([\w:-]+)", tag)
    nombre = nombre.group(1).lower() if nombre else ""
    atrs = {m.group(1).lower(): m.group(2)[1:-1] for m in ATRIB.finditer(tag)}

    def pon(attr, valor):
        nonlocal tag
        patron = re.compile(r"(\b%s\s*=\s*)(\"[^\"]*\"|'[^']*')" % re.escape(attr), re.I)
        tag = patron.sub(lambda m: m.group(1) + '"' + valor.replace('"', "&quot;") + '"', tag, count=1)

    if nombre == "html" and atrs.get("lang", "").startswith("es"):
        pon("lang", "en")
        return tag

    # rutas
    for attr in ("href", "src", "action"):
        if attr in atrs and nombre != "form":
            nueva = ruta_en(atrs[attr])
            if nueva != atrs[attr]:
                pon(attr, nueva)

    # srcset: lista de candidatos "url [descriptor]" separados por coma; cada url se
    # reescribe como un src (21-sep-2026: el póster de la demo del inicio daba 404 en /en/)
    if "srcset" in atrs:
        candidatos = []
        for c in atrs["srcset"].split(","):
            trozos = c.strip().split(None, 1)
            if not trozos:
                continue
            trozos[0] = ruta_en(trozos[0])
            candidatos.append(" ".join(trozos))
        nueva = ", ".join(candidatos)
        if nueva != atrs["srcset"]:
            pon("srcset", nueva)

    if nombre == "link" and atrs.get("rel", "").lower() == "canonical":
        # una redirección declara como canónico su DESTINO (consultoria.html → /): el espejo
        # apunta al destino inglés, no a sí mismo (web v5, 24-sep-2026)
        propio = atrs.get("href", "") in ("", url_es(pagina))
        pon("href", url_en(pagina) if propio else DOMINIO + ruta_en(atrs["href"]))

    if nombre == "meta":
        clave_meta = (atrs.get("name") or atrs.get("property") or "").lower()
        if clave_meta in ("description", "og:title", "og:description", "twitter:title", "twitter:description"):
            pon("content", tr(clave(atrs.get("content", ""))))
        elif clave_meta == "og:url":
            pon("content", url_en(pagina))
        elif clave_meta in ("og:image", "twitter:image") and atrs.get("content") == DOMINIO + "/brand/canon/og.png":
            pon("content", DOMINIO + "/brand/canon/og-en.png")
        # redirecciones (servicios.html → aplicaciones.html): el destino del refresh también va a /en/
        if atrs.get("http-equiv", "").lower() == "refresh":
            m_url = re.match(r"(\s*\d+\s*;\s*url=)(.+)$", atrs.get("content", ""), re.I)
            if m_url:
                pon("content", m_url.group(1) + ruta_en(m_url.group(2).strip()))
        elif clave_meta == "og:locale":
            pon("content", "en_GB")

    if nombre == "input":
        n = atrs.get("name", "")
        if n == "_next" and atrs.get("value"):
            # El destino de vuelta de un formulario se traduce con ruta_en(), que ya sabe
            # mandar cualquier pagina del espejo a /en/. Pero ruta_en() devuelve tal cual lo
            # que no conoce, y eso aqui significa dejar al visitante ingles en la version
            # espanola sin que nadie se entere: si el destino no acaba dentro de /en/, se
            # para el generador y se dice cual es (26-ago-2026).
            destino = ruta_en(atrs["value"])
            if not destino.startswith("/en/"):
                sys.exit("gen-en: %s · _next apunta a %s, que no esta en el espejo ingles. "
                         "Anade esa pagina a PAGINAS o corrige el destino."
                         % (pagina, atrs["value"]))
            pon("value", DOMINIO + destino)
        elif n == "_subject" and atrs.get("value"):
            pon("value", tr(clave(atrs["value"])))
        elif atrs.get("value") and atrs.get("type") in ("submit", "button"):
            pon("value", tr(clave(atrs["value"])))

    for attr in ATRIB_TEXTO:
        if atrs.get(attr) and traducible(clave(atrs[attr])):
            pon(attr, tr(clave(atrs[attr])))

    return tag


def traduce_json_ld(bloque, tr, pagina):
    """Traduce los campos de texto del JSON-LD y apunta las URLs a /en/."""
    def campo(m):
        llave, valor = m.group(1), m.group(2)
        if llave in ("description", "headline", "name", "jobTitle", "alternateName",
                     "articleSection", "addressCountry", "areaServed", "award"):
            k = clave(json.loads('"%s"' % valor))
            nuevo = tr(k)
            return '"%s": %s' % (llave, json.dumps(nuevo, ensure_ascii=False))
        if llave == "inLanguage":
            return '"inLanguage": "en"' if valor.startswith("es") else m.group(0)
        if llave in ("image", "url") and valor == DOMINIO + "/brand/canon/og.png":
            return '"%s": "%s/brand/canon/og-en.png"' % (llave, DOMINIO)
        if llave in ("url", "@id", "mainEntityOfPage") and valor.startswith(DOMINIO):
            resto = valor[len(DOMINIO):]
            nueva = ruta_en(resto or "/")
            if nueva != resto:
                return '"%s": "%s%s"' % (llave, DOMINIO, nueva)
        return m.group(0)

    bloque = re.sub(r'"([\w@]+)":\s*"([^"]*)"', campo, bloque)
    def temas(m):
        valores = json.loads(m.group(1))
        return '"knowsAbout": ' + json.dumps([tr(clave(v)) for v in valores], ensure_ascii=False)
    return re.sub(r'"knowsAbout":\s*(\[[^\]]*\])', temas, bloque)


def reescribe_src_script(bloque):
    """Reescribe el src de la etiqueta <script> de apertura (activo local relativo,
    p. ej. brand/barra.js), igual que traduce_etiqueta hace con el resto de etiquetas.
    Sin esto, un <script src="brand/x.js"> entero se trata como un bloque y su ruta
    nunca pasa por ruta_en(): en /en/ queda relativa y apunta a /en/brand/x.js (404;
    detectado el 24-sep-2026 con brand/barra.js)."""
    def apertura(m):
        tag = m.group(0)
        atrs = {mm.group(1).lower(): mm.group(2)[1:-1] for mm in ATRIB.finditer(tag)}
        if "src" in atrs:
            nueva = ruta_en(atrs["src"])
            if nueva != atrs["src"]:
                patron = re.compile(r"(\bsrc\s*=\s*)(\"[^\"]*\"|'[^']*')", re.I)
                tag = patron.sub(lambda mm: mm.group(1) + '"' + nueva.replace('"', "&quot;") + '"', tag, count=1)
        return tag
    return re.sub(r"^<script\b[^>]*>", apertura, bloque, count=1)


def traduce_script(bloque, tr):
    """Sustituye literales de cadena que estén en el diccionario (rótulos de las demos)."""
    bloque = reescribe_src_script(bloque)

    def literal(m):
        comilla, cuerpo = m.group(1), m.group(2)
        k = clave(cuerpo)
        if traducible(k) and (k in tr.mapa or k == "copiado ✓"):
            return comilla + tr(k).replace(comilla, "\\" + comilla) + comilla
        return m.group(0)

    return re.sub(r"(['\"])((?:[^'\"\\\n]|\\.)*?)\1", literal, bloque)


BLOQUE_ALT = "<!-- i18n:alt -->"
BLOQUE_ALT_FIN = "<!-- /i18n:alt -->"
ALT = re.compile(re.escape(BLOQUE_ALT) + ".*?" + re.escape(BLOQUE_ALT_FIN), re.S)


def bloque_alternate(pagina):
    return (
        BLOQUE_ALT
        + '\n<link rel="alternate" hreflang="es" href="%s">' % url_es(pagina)
        + '\n<link rel="alternate" hreflang="en" href="%s">' % url_en(pagina)
        + '\n<link rel="alternate" hreflang="x-default" href="%s">' % url_es(pagina)
        + "\n" + BLOQUE_ALT_FIN
    )


def pon_alternate(doc, pagina):
    bloque = bloque_alternate(pagina)
    if ALT.search(doc):
        return ALT.sub(lambda _: bloque, doc, count=1)
    canon = re.search(r'<link rel="canonical"[^>]*>', doc)
    if canon:
        return doc[: canon.end()] + "\n" + bloque + doc[canon.end():]
    return doc.replace("</head>", bloque + "\n</head>", 1)


# el enlace de idioma vive en la página española marcado con data-i18n-alt
CONMUTADOR = re.compile(r"<a\b[^>]*\bdata-i18n-alt\b[^>]*>.*?</a>", re.S | re.I)


def conmutador_en(m, pagina):
    """En la versión inglesa el enlace apunta al español y se llama ES."""
    tag = m.group(0)
    tag = re.sub(r'(\bhref\s*=\s*)"[^"]*"', lambda x: x.group(1) + '"%s"' % ("/" if pagina == "index.html" else "/" + pagina), tag, count=1)
    tag = re.sub(r'(\bhreflang\s*=\s*)"[^"]*"', lambda x: x.group(1) + '"es"', tag, count=1)
    tag = re.sub(r'(\blang\s*=\s*)"[^"]*"', lambda x: x.group(1) + '"es"', tag, count=1)
    tag = re.sub(r'(\baria-label\s*=\s*)"[^"]*"', lambda x: x.group(1) + '"Ver esta página en español"', tag, count=1)
    return re.sub(r">([^<>]*)</a>$", ">ES</a>", tag)


# ---------------------------------------------------------------- motor
def genera(pagina, indexable, extraer):
    origen = os.path.join(RAIZ, pagina)
    with open(origen, encoding="utf-8") as f:
        doc = f.read()

    tr = Diccionario(pagina)

    # 1 · la página española declara sus alternativas (idempotente)
    if indexable:
        nuevo_es = pon_alternate(doc, pagina)
        if nuevo_es != doc:
            with open(origen, "w", encoding="utf-8") as f:
                f.write(nuevo_es)
            doc = nuevo_es

    # 2 · el conmutador de idioma tiene que existir donde haya barra de navegación
    tiene_barra = '<header class="barra"' in doc
    if tiene_barra and not CONMUTADOR.search(doc):
        print("  ! %s tiene barra pero no enlace data-i18n-alt" % pagina, file=sys.stderr)

    # 3 · recorrer el documento agrupando cada frase con su marcado en línea
    partes = [p for p in TOKEN.split(doc) if p != ""]
    # TOKEN.split alterna texto/marcado, pero al filtrar vacíos se pierde la paridad:
    # se vuelve a marcar cada trozo con lo que es.
    tipos = []
    for p in TOKEN.split(doc):
        if p == "":
            continue
        tipos.append(("marcado" if TOKEN.fullmatch(p) else "texto", p))

    salida = []
    i = 0
    while i < len(tipos):
        tipo, parte = tipos[i]
        if tipo == "marcado" and "data-i18n-alt" in parte:
            # el conmutador de idioma no se traduce: se reescribe entero al final
            salida.append(parte)
            i += 1
            while i < len(tipos):
                salida.append(tipos[i][1])
                i += 1
                if tipos[i - 1][1].lower().startswith("</a"):
                    break
            continue
        abre_en_linea = tipo == "marcado" and es_en_linea(parte) and not parte.startswith("</")
        if tipo == "marcado" and not abre_en_linea:
            bajo = parte.lower()
            if bajo.startswith("<!--") or bajo.startswith("<style"):
                salida.append(parte)
            elif bajo.startswith("<textarea"):
                # el contenido se copia tal cual; la etiqueta de apertura (placeholder, aria-label) se traduce
                fin = parte.index(">") + 1
                salida.append(traduce_etiqueta(parte[:fin], tr, pagina, indexable) + parte[fin:])
            elif bajo.startswith("<script"):
                if "application/ld+json" in bajo:
                    salida.append(traduce_json_ld(parte, tr, pagina))
                else:
                    salida.append(traduce_script(parte, tr))
            else:
                salida.append(traduce_etiqueta(parte, tr, pagina, indexable))
            i += 1
            continue

        # arranca una frase: se traga texto y marcado en línea hasta el siguiente bloque
        j, prof, corte = i, 0, i
        texto_arriba = False
        while j < len(tipos):
            t, p = tipos[j]
            if t == "texto":
                # basta con que haya texto propio fuera del marcado en línea: así una
                # cifra con su unidad ("<span data-cifra>0</span> €") viaja entera y el
                # inglés puede reordenarla a "€<span…>"
                if prof == 0 and clave(p):
                    texto_arriba = True
                j += 1
                corte = j
                continue
            if not es_en_linea(p) or p.lower().startswith("<script") or p.lower().startswith("<!--"):
                break
            if p.startswith("</"):
                if prof == 0:
                    break          # cierra un elemento abierto antes: aquí acaba la frase
                prof -= 1
            elif not p.rstrip().endswith("/>") and not APERTURA.match(p).group(1).lower() in ("br", "wbr"):
                prof += 1
            j += 1
            if prof == 0:
                corte = j

        trozo = "".join(p for _, p in tipos[i:corte])
        k = clave(trozo)
        if texto_arriba and prof == 0 and corte > i + 1 and traducible(k):
            izq = trozo[: len(trozo) - len(trozo.lstrip())]
            der = trozo[len(trozo.rstrip()):]
            salida.append(izq + rehaz_rutas(tr(k)) + der)
            i = corte
            continue

        # frase suelta sin marcado (o marcado que no se puede agrupar): trozo a trozo
        if tipo == "marcado":
            salida.append(traduce_etiqueta(parte, tr, pagina, indexable))
            i += 1
            continue
        k = clave(parte)
        # una cifra suelta no pide traducción, pero si el diccionario la trae (formato de
        # moneda, separador de millar) manda el diccionario
        if traducible(k) or (k and tr.mapa.get(k)):
            izq = parte[: len(parte) - len(parte.lstrip())]
            der = parte[len(parte.rstrip()):]
            salida.append(izq + tr(k) + der)
        else:
            salida.append(parte)
        i += 1

    doc_en = "".join(salida)
    doc_en = CONMUTADOR.sub(lambda m: conmutador_en(m, pagina), doc_en, count=1)
    if indexable:
        doc_en = pon_alternate(doc_en, pagina)
    doc_en = doc_en.replace(
        "<head>",
        "<head>\n<!-- GENERADO por i18n/gen-en.py desde ../%s · no editar a mano -->" % pagina,
        1,
    )

    if extraer:
        tr.volcar()
        return []

    os.makedirs(SALIDA, exist_ok=True)
    with open(os.path.join(SALIDA, pagina), "w", encoding="utf-8") as f:
        f.write(doc_en)
    return tr.faltan


def main():
    extraer = "--extraer" in sys.argv
    os.makedirs(I18N, exist_ok=True)
    faltan_total = 0
    for pagina, indexable in PAGINAS:
        if not os.path.exists(os.path.join(RAIZ, pagina)):
            print("  ! falta %s" % pagina, file=sys.stderr)
            continue
        faltan = genera(pagina, indexable, extraer)
        if faltan:
            faltan_total += len(faltan)
            print("\n%s · %d sin traducir:" % (pagina, len(faltan)), file=sys.stderr)
            for k in faltan:
                print("    %s" % k[:110], file=sys.stderr)
    if extraer:
        print("cadenas volcadas a i18n/en/")
        return 0
    if faltan_total:
        print("\n%d cadenas sin traducir · /en/ NO está completo" % faltan_total, file=sys.stderr)
        return 1
    print("/en/ generado · %d páginas" % len(PAGINAS))
    return 0


# Dynamic experience copy is shared by both language wrappers.
_runtime_path = os.path.join(I18N, "experiencias-runtime.json")
if "--extraer" not in sys.argv and os.path.exists(_runtime_path):
    with open(_runtime_path, encoding="utf-8") as _f:
        _runtime = json.load(_f)
    if not all(_runtime.values()):
        raise SystemExit("Missing experience runtime translation")
    with open(os.path.join(RAIZ, "experiencias", "i18n.js"), "w", encoding="utf-8") as _f:
        _f.write("/* GENERATED from i18n/en/experiencias-runtime.json */\n(()=>{const en=" + json.dumps(_runtime, ensure_ascii=False) + ";window.ONTOS_DEMO_TRANSLATE=text=>document.documentElement.lang==='en'?(en[text]||text):text;})();\n")

if __name__ == "__main__":
    sys.exit(main())
