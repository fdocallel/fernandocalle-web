#!/bin/sh
# Regenera sitemap.xml con el lastmod real de cada página (fecha del último commit que la tocó).
# Incluye el espejo inglés de /en/, que se genera con ./i18n/gen-en.py.
# Uso: ./gen-sitemap.sh [--es] · --es conserva literalmente las entradas inglesas.
set -e
cd "$(dirname "$0")"
# DOMINIO_PERSONAL (también en i18n/gen-en.py, scripts/test-marca-es.cjs, CNAME, robots.txt y los HTML)
DOMINIO="https://fernandocalle.es"
PAGINAS="index.html contacto.html aplicaciones.html modelado-3d.html juego-2d.html animacion-3d.html visita-3d.html bim.html escrito-plan-bim-ingenieria.html fernando-calle.html editor-pdf/index.html"
if [ "${1:-}" = "--es" ]; then
  DOMINIO="$DOMINIO" python3 - "$PAGINAS" <<'PY'
from pathlib import Path
from datetime import date
import os, re, subprocess, sys
DOM = os.environ['DOMINIO']
source = Path('sitemap.xml').read_text()
blocks = re.findall(r'  <url>.*?</url>\n', source, re.S)
english = {re.search(r'<loc>(.*?)</loc>', b)[1]: b for b in blocks if '<loc>' + DOM + '/en/' in b}
if not english:
    raise SystemExit('Sitemap ES: faltan las entradas inglesas que deben conservarse')
out = ['<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n']
for file in sys.argv[1].split():
    page = Path(file)
    if not page.exists() or '<meta name="robots" content="noindex"' in page.read_text():
        continue
    changed = subprocess.check_output(['git', 'status', '--porcelain', '--', file], text=True).strip()
    last = subprocess.check_output(['git', 'log', '-1', '--format=%cs', '--', file], text=True).strip()
    stamp = date.today().isoformat() if changed or not last else last
    route = '' if file == 'index.html' else 'editor-pdf/' if file == 'editor-pdf/index.html' else file
    loc = DOM + '/' + route
    out.append(f'  <url>\n    <loc>{loc}</loc>\n    <lastmod>{stamp}</lastmod>\n  </url>\n')
    translated = DOM + '/en/' + route
    if translated in english:
        out.append(english.pop(translated))
if english:
    raise SystemExit('Sitemap ES: hay entradas inglesas fuera del inventario; revisar antes de regenerar')
out.append('</urlset>\n')
Path('sitemap.xml').write_text(''.join(out))
print('Sitemap: fechas ES actualizadas; entradas EN conservadas')
PY
  exit 0
fi
[ "$#" -eq 0 ] || { echo 'Uso: gen-sitemap.sh [--es]' >&2; exit 1; }
fecha_de() {
  if [ -n "$(git status --porcelain -- "$1")" ]; then date +%F; return; fi
  f=$(git log -1 --format=%cs -- "$1" 2>/dev/null)
  [ -n "$f" ] || f=$(date +%F)
  echo "$f"
}
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  for f in $PAGINAS; do
    [ -f "$f" ] || continue
    grep -q '<meta name="robots" content="noindex"' "$f" && continue
    fecha=$(fecha_de "$f")
    case "$f" in
      index.html) loc="$DOMINIO/" ;;
      editor-pdf/index.html) loc="$DOMINIO/editor-pdf/" ;;  # app bilingüe en sí misma, sin espejo /en/
      *) loc="$DOMINIO/$f" ;;
    esac
    printf '  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n  </url>\n' "$loc" "$fecha"
    # espejo inglés: cambia cuando cambia la página española o su traducción
    en="en/$f"
    [ -f "$en" ] || continue
    fecha_tr=$(fecha_de "i18n/en/$(echo "$f" | sed 's/\.html$/.json/')")
    [ "$fecha_tr" \> "$fecha" ] && fecha="$fecha_tr"
    if [ "$f" = "index.html" ]; then loc="$DOMINIO/en/"; else loc="$DOMINIO/en/$f"; fi
    printf '  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n  </url>\n' "$loc" "$fecha"
  done
  echo '</urlset>'
} > sitemap.xml
echo "sitemap.xml regenerado ($(grep -c '<loc>' sitemap.xml) URLs)"
