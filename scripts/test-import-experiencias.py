#!/usr/bin/env python3
"""Regression: changed source must fail before touching either public engine.
Usage: python3 scripts/test-import-experiencias.py /path/to/ONTOS
"""
from pathlib import Path
import shutil,subprocess,sys,tempfile
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as directory:
    temp=Path(directory);web=temp/'web';source=temp/'source/app/lib'
    for sub in ['scripts','experiencias','i18n/en']:(web/sub).mkdir(parents=True,exist_ok=True)
    source.mkdir(parents=True)
    shutil.copy(root/'scripts/import-experiencias.py',web/'scripts')
    shutil.copy(root/'i18n/en/experiencias-runtime.json',web/'i18n/en')
    for filename in ['ontos-vivo.js','ontos-tierra.js','ontos-alcazar.json']:
        shutil.copy(Path(sys.argv[1])/'app/lib'/filename,source)
    command=[sys.executable,str(web/'scripts/import-experiencias.py'),str(temp/'source')]
    subprocess.run(command,check=True)
    before={p.name:p.read_bytes() for p in (web/'experiencias').iterdir()}
    tierra=source/'ontos-tierra.js';original=tierra.read_text()
    for mutation in [original.replace(".get('mundo')!=='normal'",".get('mundo')==='other'",1),original+'\nfetch("private.json");\n']:
        tierra.write_text(mutation)
        result=subprocess.run(command,capture_output=True,text=True)
        assert result.returncode!=0,'Unsafe source was accepted'
        assert {p.name:p.read_bytes() for p in (web/'experiencias').iterdir()}==before,'Failure modified public files'
    tierra.write_text(original)
    mesh=source/'ontos-alcazar.json';asset=__import__('json').loads(mesh.read_text());asset['private']='must not publish';mesh.write_text(__import__('json').dumps(asset))
    assert subprocess.run(command,capture_output=True).returncode!=0,'Unexpected mesh fields accepted'
    assert {p.name:p.read_bytes() for p in (web/'experiencias').iterdir()}==before,'Mesh failure modified public files'
    print('PASS: valid import; missing marker and new fetch fail closed without modifying either engine.')
