#!/usr/bin/env node
'use strict';
// Catálogo de elementos (ONTOS data/web-elementos.json, manual de marca 4.3): cada id
// nombra una pieza real. Falla si un selector deja de existir en su página (ES y su
// espejo EN) o si el script que la crea (`js`) ya no nombra su clase.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const WEB=path.resolve(__dirname,'..');
const ONTOS=process.env.ONTOS_BRAND_ROOT||path.resolve(WEB,'../ONTOS');
const catalogo=JSON.parse(fs.readFileSync(path.join(ONTOS,'data/web-elementos.json'),'utf8'));
// Web personal (8-oct-2026): el catálogo es el de ontosdigital.es con las diferencias declaradas en el fixture.
const personal=require('./fixtures/elementos-web-personal.json');
for(const el of catalogo.elementos)Object.assign(el,personal.cambian[el.id]||{});
for(const id of Object.keys(personal.cambian))if(!catalogo.elementos.some(e=>e.id===id))throw Error('elementos-web-personal: el id '+id+' ya no existe en el catálogo de ONTOS');
const {webkit}=require(process.env.PLAYWRIGHT_MODULE||path.join(ONTOS,'scripts/verify/node_modules/playwright'));
const {textoDe,TODAS}=require(path.join(ONTOS,'scripts/capturas-web-elementos.js'));

function paginas(el){
  const base=el.pagina==='todas'?TODAS:el.pagina.split(' · ');
  return base.flatMap(f=>fs.existsSync(path.join(WEB,'en',f))?[f,'en/'+f]:[f]);
}

async function comprobar(page,elementos){
  const fallos=[],ids=new Set();
  for(const el of elementos){
    if(ids.has(el.id))fallos.push(`${el.id}: id repetido`);
    ids.add(el.id);
    if(!el.selector){fallos.push(`${el.id}: sin selector`);continue;}
    if(el.js){
      const clase=el.selector.replace(/^\./,'');
      const src=fs.readFileSync(path.join(WEB,el.js),'utf8');
      if(!src.includes(clase))fallos.push(`${el.id}: ${el.js} ya no crea «${clase}»`);
      continue;
    }
    // Lo que dice: la tabla del manual (columna «Dice») tiene que coincidir con la página ES.
    if(el.con_texto){
      const t=await textoDe(page,WEB,el);
      if(t!==el.texto)fallos.push(`${el.id}: la página dice «${t}» y la tabla «${el.texto}» → en ONTOS: node scripts/capturas-web-elementos.js --textos`);
    }
    for(const f of paginas(el)){
      const html=fs.readFileSync(path.join(WEB,f),'utf8');
      const hay=await page.evaluate(({html,sel})=>!!new DOMParser().parseFromString(html,'text/html').querySelector(sel),{html,sel:el.selector});
      if(!hay)fallos.push(`${el.id}: «${el.selector}» no existe en ${f}`);
    }
  }
  return fallos;
}

(async()=>{
  const browser=await webkit.launch();
  try{
    const page=await browser.newPage();
    const fallos=await comprobar(page,catalogo.elementos);
    assert.deepEqual(fallos,[],'Catálogo de elementos web desalineado con la web');
    // Caso rojo sembrado: un selector inexistente y un id repetido deben fallar.
    const rojo=await comprobar(page,[
      {id:'rojo.a',pagina:'index.html',selector:'.no-existe-jamas'},
      {id:'rojo.a',pagina:'index.html',selector:'header.barra'},
      {id:'rojo.b',pagina:'index.html',selector:'.home-feature h1',con_texto:true,texto:'Otro titular'}
    ]);
    assert(rojo.some(f=>f.includes('.no-existe-jamas'))&&rojo.some(f=>f.includes('id repetido'))&&rojo.some(f=>f.startsWith('rojo.b: la página dice')),'Caso rojo: el guardián debe detectar selector roto, id repetido y texto distinto');
    console.log(`PASS elementos web: ${catalogo.elementos.length} ids con selector vivo en su página (ES/EN) y textos iguales a la tabla; caso rojo detectado.`);
  }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
