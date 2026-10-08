#!/usr/bin/env python3
"""Rellena i18n/en/<pagina>.json con las traducciones que llegan por stdin, una
por línea y en el mismo orden que las claves. Uso: ./i18n/pon.py index.html < en.txt"""
import json, sys, os
p = sys.argv[1].replace(".html", ".json")
ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "en", p)
d = json.load(open(ruta, encoding="utf-8"))
claves = [k for k in d if not k.startswith("_")]
vals = [l.rstrip("\n") for l in sys.stdin if l.strip() != ""]
if len(vals) != len(claves):
    sys.exit("ERROR %s: %d claves, %d traducciones" % (p, len(claves), len(vals)))
for k, v in zip(claves, vals):
    d[k] = v
json.dump(d, open(ruta, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(ruta, "a", encoding="utf-8").write("\n")
print("%s · %d traducciones" % (p, len(vals)))
