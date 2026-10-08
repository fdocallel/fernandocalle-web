#!/usr/bin/env python3
"""Refresh reviewed public engines. Explicit import only; never run automatically on deploy.
Usage: python3 scripts/import-experiencias.py /path/to/ONTOS
Inspect the diff and run public interaction checks before committing.
"""
from pathlib import Path
import hashlib,json,re,sys
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1])/"app/lib"
records={}
outputs={}
def once(text,old,new):
    assert text.count(old)==1, "Unexpected source marker: "+old
    return text.replace(old,new)
translations=json.loads((root/"i18n/en/experiencias-runtime.json").read_text())
for src,dst in [("ontos-vivo.js","juego-2d.js"),("ontos-tierra.js","mundo-3d.js")]:
    raw=(source/src).read_bytes(); s=raw.decode()
    if src=="ontos-tierra.js":
        s=once(s,".get('mundo')!=='normal'", ".get('mundo')==='segovia'")
        s=once(s,"fetch('lib/ontos-alcazar.json'", "fetch('/experiencias/ontos-alcazar.json'")
        s=once(s,"document.title='ONTOS · Mundo ('+(segoviaWorld?'Segovia':'normal')+')';", "document.title=(segoviaWorld?'Segovia en 3D · Fernando Calle':'Visita 3D · Fernando Calle');")
        s=once(s,"label.textContent='ONTOS vivo · Mundo ('+(segoviaWorld?'Segovia':'normal')+')';", "label.textContent=(segoviaWorld?'ontos vivo · Mundo Segovia':'ontos vivo · un mundo para explorar');")
        s=once(s,'// docs/estudios/2026-09-10-catedral-segovia-geometria.md. Local x=south, z=west.','// Procedural cathedral. Local x=south, z=west.')
        # Public brand name is written «ontos» in lowercase (3-oct-2026); console tags stay as they are.
        for phrase in ['Seguir a ONTOS','ONTOS se ha detenido.','No se ha podido dibujar ONTOS. Recarga la página para volver a intentarlo.','Segovia en miniatura: acueducto, catedral y Alcázar sobre su peñón. Arrastra para contemplarlos; Centrar vuelve a ONTOS.']:
            s=s.replace("'"+phrase+"'","'"+phrase.replace('ONTOS','ontos')+"'")
    s=s.replace("La figura está en reposo.","No se ha podido mostrar la figura.").replace("El jardín está en reposo.","No se ha podido mostrar el jardín.")
    # Source comment only describes local public snapshot; no private repo pointers.
    s=re.sub(r"^/\*.*?\*/", "/* ONTOS public procedural experience. See provenance.json. */",s,count=1,flags=re.S)
    network_checked=s.replace("fetch('/experiencias/ontos-alcazar.json',{signal:controller.signal})", "ALLOWED_ASSET")
    assert not re.search(r"fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|docs/|data/",network_checked), "Unexpected dependency; review import before publishing"
    s=s.replace("'use strict';", "'use strict';\nconst T=window.ONTOS_DEMO_TRANSLATE|| (text=>text);",1)
    for phrase in sorted(translations,key=len,reverse=True):
        literal="'"+phrase.replace("'","\\'")+"'"
        s=s.replace(literal,"T("+literal+")")
    s=s.replace("`Destellos ${", "`${T('Destellos')} ${")
    outputs[dst]=s
    records[dst]={"source":"ONTOS/app/lib/"+src,"source_sha256":hashlib.sha256(raw).hexdigest(),"public_sha256":hashlib.sha256(s.encode()).hexdigest()}
raw=(source/'ontos-alcazar.json').read_bytes()
asset=json.loads(raw)
allowed={'_doc','version','title','attribution','source','original','sourceDate','sourceSha256','license','licenseUrl','changes','sourceTriangles','bounds','vertices','faces','materials','boundary'}
assert set(asset)==allowed, 'Unexpected mesh fields; review public projection'
assert asset['license']=='CC BY-SA 4.0' and asset['licenseUrl']=='https://creativecommons.org/licenses/by-sa/4.0/', 'Invalid mesh license'
assert asset['source']=='https://commons.wikimedia.org/wiki/File:Alc%C3%A1zar_de_Segovia.stl', 'Unexpected mesh source'
assert asset['attribution'] and asset['changes'] and len(raw)<1000000, 'Invalid mesh provenance or budget'
asset['_doc']='GENERATED public Alcázar mesh snapshot; import-experiencias.py. Adaptation CC BY-SA 4.0.'
outputs['ontos-alcazar.json']=json.dumps(asset,ensure_ascii=False,separators=(',',':'))+'\n'
records['ontos-alcazar.json']={'source':'ONTOS/app/lib/ontos-alcazar.json','source_sha256':hashlib.sha256(raw).hexdigest(),'public_sha256':hashlib.sha256(outputs['ontos-alcazar.json'].encode()).hexdigest()}
for dst,s in outputs.items():
    (root/"experiencias"/dst).write_text(s)
(root/"experiencias/provenance.json").write_text(json.dumps({"_doc":"Reviewed snapshots. Regenerate only with scripts/import-experiencias.py; Segovia mesh is allowlisted and loaded only for mundo=segovia; mesh adaptation CC BY-SA 4.0.","engines":records},ensure_ascii=False,indent=2)+"\n")
