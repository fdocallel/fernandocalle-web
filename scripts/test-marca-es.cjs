#!/usr/bin/env node
'use strict';
// Conservación del encargo: contenido/rutas ES, recursos EN, y activos desde el canon.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const WEB=path.resolve(__dirname,'..');
const ONTOS=process.env.ONTOS_BRAND_ROOT||path.resolve(WEB,'../ONTOS');
const subtitle=JSON.parse(fs.readFileSync(path.join(ONTOS,'data/mensaje.json'),'utf8')).superficies.find(s=>s.id==='web.subtitulo')?.es;
assert(subtitle,'Subtítulo de portada declarado en su fuente');
const bilingual=process.argv.includes('--bilingue');
const BASE='a7bc996e35f64e7ef74e5d811c74755af6895312';
const revision=require('./fixtures/revision-prepublicacion.json');
// Separación (Fernando, 8-oct-2026; ONTOS docs/estudios/2026-10-08-separar-web-personal-y-ontos.md): esta es la
// web personal, clonada de ontosdigital.es. Lo de producto se quedó allí; sus enlaces van a ONTOS_URL.
const DOMINIO='https://fernandocalle.es'; // DOMINIO_PERSONAL
const ONTOS_URL='https://ontosdigital.es';
const PODADAS=['producto','caso-organizacion','caso-finanzas','caso-salud','caso-sistema','organizacion-60s','salud-60s','finanzas-70s','caso-90s','armario','entrar','solicitud'].map(p=>p+'.html');
// Un destino de la base, en la web separada: páginas podadas → ontosdigital.es; el resto del dominio → el propio.
function separa(href){
 if(!href)return href;
 const rel=href.startsWith(ONTOS_URL)?href.slice(ONTOS_URL.length):href;
 const hoja=rel.replace(/^\//,'').split(/[?#]/)[0];
 if(PODADAS.includes(hoja)&&(rel!==href||!/^[a-z]+:/.test(href)))return ONTOS_URL+'/'+rel.replace(/^\//,'');
 return rel!==href?DOMINIO+rel:href;
}
const retitula=t=>t.replace(/ · ontos$/,' · Fernando Calle').replace(/ \| ontos$/,' | Fernando Calle').replace(/^ontos · ingeniería/,'Fernando Calle · ingeniería')
 // Puente a ontos, 8-oct-2026 (Fernando): las demos firman como el resto de páginas, «<página> · Fernando Calle».
 .replace(/^ontos(?: vivo)? · (.+)$/,'$1 · Fernando Calle');
assert.equal(retitula('ontos vivo · Patio de juegos'),'Patio de juegos · Fernando Calle','Separación: título de demo con la firma personal');
assert.equal(separa('armario.html'),ONTOS_URL+'/armario.html','Separación: página podada a ontosdigital.es');
assert.equal(separa(ONTOS_URL+'/bim.html'),DOMINIO+'/bim.html','Separación: página propia al dominio personal');
assert.equal(separa('mailto:hola@ontosdigital.es'),'mailto:hola@ontosdigital.es','Separación: el correo no cambia');
const git=(...args)=>execFileSync('git',args,{cwd:WEB,encoding:'utf8',maxBuffer:20*1024*1024});
const pages=fs.readdirSync(WEB).filter(f=>f.endsWith('.html')).concat(['editor-pdf/index.html']);
const changed=git('diff',BASE,'--name-only').trim().split('\n');
const protectedFile=f=>(!bilingual&&(f.startsWith('en/')||f.startsWith('i18n/en/')))||f.startsWith('experiencias/')||f==='brand/tokens.css'||f==='brand/barra.js'||f==='brand/favicon.svg'||f==='brand/logo.svg';
// Recursos compartidos: desde la publicación de la v5 (28-sep-2026, main 477ca94) la base es lo
// publicado, no la rama previa. Fernando autoriza el 28-sep-2026 tocar barra.js y tokens.css para
// el dock móvil y la auditoría móvil; cambios posteriores se comparan con lo publicado.
const PUBLICADA='477ca9424fddeaae71de45dcc508175e22bacca5';
// 3-oct-2026: Fernando pide «ontos» en minúscula también en los textos de los juegos y mundos 3D;
// solo cambian cadenas visibles del motor publicado y su huella (provenance.json).
const permitidos=new Set(['brand/barra.js','brand/tokens.css','experiencias/mundo-3d.js','experiencias/i18n.js','experiencias/provenance.json']);
const cambiadosDesdePublicada=new Set(git('diff',PUBLICADA,'--name-only').trim().split('\n'));
assert.deepEqual(changed.filter(protectedFile).filter(f=>!(permitidos.has(f)&&cambiadosDesdePublicada.has(f)&&!git('diff',BASE,PUBLICADA,'--name-only').split('\n').includes(f))),[],'EN y sus recursos conservan su versión');
const sitemap=fs.readFileSync(path.join(WEB,'sitemap.xml'),'utf8'),oldSitemap=git('show',BASE+':sitemap.xml');
const englishBlocks=xml=>(xml.match(/  <url>[\s\S]*?<\/url>\n/g)||[]).filter(block=>block.includes('<loc>'+DOMINIO+'/en/')||block.includes('<loc>'+ONTOS_URL+'/en/'));
if(!bilingual)assert.deepEqual(englishBlocks(sitemap),englishBlocks(oldSitemap),'Sitemap: las entradas inglesas no cambian');
const urls=xml=>[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort();
if(!bilingual)assert.deepEqual(urls(sitemap),urls(oldSitemap),'Sitemap: las mismas rutas, solo se actualizan fechas ES');
else {
 const spanish=urls(sitemap).filter(url=>!url.includes('/en/'));
 // Producto oculto (Fernando, 28-sep-2026): noindex, sin enlaces y fuera del sitemap.
 const ocultas=['https://ontosdigital.es/producto.html'];
 assert.deepEqual(spanish,urls(oldSitemap).filter(url=>!url.includes('/en/')&&!ocultas.includes(url)).map(separa).filter(url=>url.startsWith(DOMINIO)).sort(),'Sitemap: conservar todas las rutas ES que se quedan en la web personal');
 assert.deepEqual(urls(sitemap).filter(url=>url.includes('/en/')),spanish.filter(url=>!url.endsWith('/editor-pdf/')).map(url=>url.replace(DOMINIO+'/',DOMINIO+'/en/')).sort(),'Sitemap: espejo EN de todas las páginas indexables salvo editor bilingüe');
 for(const file of pages.filter(file=>file!=='editor-pdf/index.html')){
  const english=fs.readFileSync(path.join(WEB,'en',file),'utf8');
  assert(/<html[^>]*lang="en"/.test(english),file+': idioma inglés');
  assert(english.includes('data-ontos-web'),file+': marca inglesa');
  assert(english.includes('/canon/tokens.css')&&english.includes('/marca-es.css'),file+': recursos compartidos de marca');
 }
 const englishHome=fs.readFileSync(path.join(WEB,'en/index.html'),'utf8');
 const englishSubtitle=JSON.parse(fs.readFileSync(path.join(ONTOS,'data/mensaje.json'),'utf8')).superficies.find(s=>s.id==='web.subtitulo')?.en;
 assert(englishSubtitle&&englishHome.includes(englishSubtitle),'Subtítulo inglés canónico');
}
for(const file of pages){const html=fs.readFileSync(path.join(WEB,file),'utf8');assert(html.includes('data-ontos-web'),file+' activa marca');assert(html.includes('/canon/tokens.css'),file+' carga tokens');assert(html.includes('/marca-es.css'),file+' carga CSS común');assert(!/<circle[^>]+r="16\.5"/.test(html),file+' no conserva símbolo anterior');}
require('./import-marca.cjs').run(ONTOS,{check:true});
// Mozilla GHSA-wgrm-67xf-hhpq: toda apertura de PDF desactiva la evaluación.
function checkPdfSecurity(html){
 const calls=[...html.matchAll(/pdfjsLib\.getDocument\s*\(\s*(\{[^}]*\})\s*\)/g)];
 assert(calls.length>0,'El editor debe tener aperturas de PDF verificables');
 assert.equal(calls.length,(html.match(/pdfjsLib\.getDocument\s*\(/g)||[]).length,'Revisar nueva forma de abrir PDF');
 for(const call of calls)assert(/\bisEvalSupported\s*:\s*false\b/.test(call[1]),'PDF.js: isEvalSupported debe ser false');
}
const editorHtml=fs.readFileSync(path.join(WEB,'editor-pdf/index.html'),'utf8');
checkPdfSecurity(editorHtml);
assert.throws(()=>checkPdfSecurity(editorHtml.replace(/isEvalSupported\s*:\s*false/g,'isEvalSupported: true')),/isEvalSupported/,'Caso rojo: la configuración vulnerable debe bloquear el guard');
// Familias de la portada = canon de la oferta (título, texto y orden), 3-oct-2026.
const lineas=JSON.parse(fs.readFileSync(path.join(ONTOS,'data/ontos-empresa.json'),'utf8')).lineas.items;
const webDescription=JSON.parse(fs.readFileSync(path.join(ONTOS,'data/mensaje.json'),'utf8')).superficies.find(s=>s.id==='web.description')?.es;
assert(webDescription,'Descripción de portada declarada en su fuente');
function checkFamilias(html){
 const zona=html.slice(html.indexOf('<section id="familias">'),html.indexOf('</section>',html.indexOf('<section id="familias">')));
 const texto=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
 const titulos=[...zona.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map(m=>texto(m[1]));
 const parrafos=[...zona.matchAll(/<div class="familia__texto"><p>([\s\S]*?)<\/p>/g)].map(m=>texto(m[1]));
 assert.deepEqual(titulos,lineas.map(l=>l.nombre),'Familias: títulos y orden del canon');
 assert.deepEqual(parrafos,lineas.map(l=>l.texto_web),'Familias: textos del canon');
}
// «Así empieza un encargo» = canon del proceso (título, bajada y pasos), 3-oct-2026.
// Fuente: ONTOS/raw/marca/2026-10-03-encargo-cuatro-pasos-fernando.md.
const proceso=JSON.parse(fs.readFileSync(path.join(ONTOS,'data/ontos-empresa.json'),'utf8')).lineas.comun;
function checkEncargo(html){
 const i=html.indexOf('<section id="encargo"'),zona=html.slice(i,html.indexOf('</section>',i));
 const texto=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
 assert.equal(texto((zona.match(/<h2>([\s\S]*?)<\/h2>/)||[])[1]||''),proceso.proceso_titulo,'Encargo: título del canon');
 assert.equal(texto((zona.match(/<p class="bajada">([\s\S]*?)<\/p>/)||[])[1]||''),proceso.proceso_bajada,'Encargo: bajada del canon');
 const pasos=[...zona.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map(m=>[texto(m[1]),texto(m[2])]);
 assert.deepEqual(pasos,proceso.proceso.map(p=>[p.nombre,p.texto]),'Encargo: pasos del canon');
}
// «Hecho y funcionando» = una tarjeta por familia del canon, antes del encargo (3-oct-2026).
// Fuente: ONTOS/raw/marca/2026-10-03-web-hecho-y-funcionando-fernando.md.
function checkTrabajos(html){
 // 8-oct-2026 (Fernando, 3.ª tanda): «Ejemplo real, lo incluiría en las propias cajas de la sección de 4 familias».
 // Cada tarjeta de familia lleva al final su ejemplo (enlace propio, la tarjeta no es enlace); sin sección #trabajos.
 const i=html.indexOf('<section id="familias">'),zona=html.slice(i,html.indexOf('</section>',i));
 const texto=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
 assert(!html.includes('id="trabajos"')&&!html.includes('href="#trabajos"'),'Ejemplos: sin sección ni ancla #trabajos (van dentro de las familias)');
 const arts=[...zona.matchAll(/<article class="familia">([\s\S]*?)<\/article>/g)].map(m=>m[1]);
 assert.equal(arts.length,lineas.length,'Ejemplos: una tarjeta por familia');
 const ejemplos=arts.map(a=>{
  const m=a.match(/<a class="familia__ejemplo" href="([^"]*)"( rel="noopener" target="_blank")?>\s*<span class="etiqueta">([\s\S]*?)<\/span>\s*<img src="([^"]*)" alt="([^"]*)"[^>]*>\s*<h4>([\s\S]*?)<\/h4>\s*<\/a>\s*$/);
  return [texto((a.match(/<h3>([\s\S]*?)<\/h3>/)||[])[1]||''),...(m?[m[1],!!m[2],texto(m[3]),m[4],m[5],texto(m[6])]:['sin ejemplo al final'])];
 });
 assert.deepEqual(ejemplos,lineas.map(l=>[l.nombre,separa(l.portada_trabajo.href),!!l.portada_trabajo.externo,'Ejemplo real',l.portada_trabajo.imagen,l.portada_trabajo.alt,l.portada_trabajo.titulo]),'Ejemplos: el de cada familia al final de su tarjeta, 1:1 con el canon (destino directo; externa en pestaña nueva)');
 assert(!/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/.test(zona),'Ejemplos: sin enlaces anidados');
}
// Aplicaciones por baldas = canon (3-oct-2026; ONTOS/raw/marca/2026-10-03-web-aplicaciones-fernando.md):
// una balda por familia en su orden, sus piezas en orden, tipo y título de cada pieza, «Producto» solo
// donde lo es, cabecera de la página desde mensaje.json y los cuatro clips de «Próximamente».
const piezas=proceso.catalogo_piezas;
// Puente a ontos (Fernando, 8-oct-2026): las piezas de páginas podadas (Armario) vuelven a su balda; su acción
// apunta a ontosdigital.es (separa). Todas las familias del canon, en su orden.
const baldasPersonales=lineas;
const superficie=id=>JSON.parse(fs.readFileSync(path.join(ONTOS,'data/mensaje.json'),'utf8')).superficies.find(s=>s.id===id);
function checkCatalogo(html){
 const texto=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
 const hero=html.slice(html.indexOf('<div class="hero">'),html.indexOf('<section id="trabajos"'));
 assert.equal(texto((hero.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)||[])[1]||''),superficie('web.aplicaciones_titulo').es,'Aplicaciones: titular de mensaje.json');
 assert.equal(texto((hero.match(/<p class="intro"[^>]*>([\s\S]*?)<\/p>/)||[])[1]||''),superficie('web.aplicaciones_bajada').es,'Aplicaciones: entradilla de mensaje.json');
 const baldas=[...html.matchAll(/<section class="balda[^"]*" id="balda-([^"]+)" data-familia="([^"]+)"[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>/g)];
 assert.deepEqual(baldas.map(m=>[m[1],m[2],texto(m[3])]),baldasPersonales.map(l=>[l.id,l.id,l.nombre]),'Catálogo: baldas = familias del canon, en su orden');
 baldas.forEach((m,i)=>{
  const ids=[...m[4].matchAll(/<article class="servicio[^"]*" id="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(ids,baldasPersonales[i].catalogo_web,'Catálogo: piezas de la balda '+baldasPersonales[i].id+' en el orden del canon');
  for(const id of ids){
   const art=m[4].slice(m[4].indexOf('id="'+id+'"'),m[4].indexOf('</article>',m[4].indexOf('id="'+id+'"')));
   const c=piezas[id],x=c.accion;
   assert.equal(texto((art.match(/<span class="etiqueta">([\s\S]*?)<\/span>/)||[])[1]||''),c.tipo,'Catálogo: tipo de '+id);
   assert.equal(texto((art.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)||[])[1]||''),c.titulo,'Catálogo: título de '+id);
   assert.equal(art.includes('pill-producto'),!!c.producto,'Catálogo: «Producto» solo donde lo es ('+id+')');
   assert.equal(texto((art.match(/<p class="dato">([\s\S]*?)<\/p>/)||[])[1]||''),c.dato||'','Catálogo: dato de '+id);
   const acc=art.match(/<a class="servicio__accion" href="([^"]*)"([^>]*)>[\s\S]*?<span class="servicio__rotulo">([\s\S]*?)<\/span>/);
   assert(acc,'Catálogo: '+id+' con su acción');
   assert.deepEqual([acc[1],texto(acc[3]),/data-modo="([^"]*)"/.exec(acc[2])?.[1],/data-goatcounter-click="([^"]*)"/.exec(acc[2])?.[1],/target="_blank"/.test(acc[2])],
    [separa(x.src||x.href),x.rotulo,x.modo,x.evento,x.modo==='externo'],'Catálogo: acción de '+id+' (destino, rótulo, modo, analítica)');
   if(x.extra)assert(art.includes('href="'+x.extra.href+'" data-goatcounter-click="'+x.extra.evento+'"')&&art.includes('>'+x.extra.rotulo+'</a>'),'Catálogo: acción extra de '+id);
  }
 });
 const cat=html.slice(html.indexOf('<section id="trabajos"'),html.indexOf('<section id="producto"'));
 assert(!/pill-consultoria|pill-familia|data-categoria/.test(cat),'Catálogo: sin pastillas de consultoría ni filtros');
 assert(!html.includes('id="proximamente"'),'Separación: «Próximamente» sale de la web personal');
 const prod=html.slice(html.indexOf('<section id="producto">'),html.indexOf('</section>',html.indexOf('<section id="producto">')));
 assert(html.indexOf('<section id="producto">')>0&&prod.includes('href="'+ONTOS_URL+'/"'),'Separación: el producto es un enlace a ontosdigital.es');
 assert(!PODADAS.some(p=>new RegExp('href="/?'+p).test(html)),'Separación: ningún enlace relativo a páginas de ontos');
}
const appsHtml=fs.readFileSync(path.join(WEB,'aplicaciones.html'),'utf8');
checkCatalogo(appsHtml);
assert.throws(()=>checkCatalogo(appsHtml.replace('id="balda-herramientas" data-familia="herramientas"','id="balda-herramientas" data-familia="contexto-ia"')),/baldas/,'Caso rojo: una balda fuera del canon debe bloquear');
assert.throws(()=>checkCatalogo(appsHtml.replace('href="'+ONTOS_URL+'/armario.html"','href="armario.html"')),/Separación|acción/,'Caso rojo: Armario con enlace relativo (página podada) debe bloquear');
assert.throws(()=>checkCatalogo(appsHtml.replace('href="'+ONTOS_URL+'/">Conocer','href="producto.html">Conocer')),/Separación/,'Caso rojo: un enlace relativo al producto debe bloquear');
// «Qué es ONTOS» = mensaje.json web.que_es (3-oct-2026; ONTOS/raw/marca/2026-10-03-web-que-es-ontos-a-fernando.md).
const queEs=JSON.parse(fs.readFileSync(path.join(ONTOS,'data/mensaje.json'),'utf8')).superficies.find(s=>s.id==='web.que_es');
// 8-oct-2026 (Fernando): la sección «Qué es ontos» sale de la portada; su texto vive dentro de la caja de
// «Próximamente», con el imagotipo del canon y el enlace a ontosdigital.es. 2.ª tanda: la sección va justo tras
// «Así empieza un encargo» y antes de «Hablamos»; «Próximamente.» y su bajada son el primer texto de la caja.
function checkQueEs(html){
 assert(!html.includes('id="que-es"')&&!html.includes('href="#que-es"'),'Qué es ONTOS: sin sección ni ancla #que-es en la portada');
 const i=html.indexOf('<section id="proximamente"'),zona=html.slice(i,html.indexOf('</section>',i));
 const enc=html.indexOf('<section id="encargo"');
 assert(enc>0&&html.indexOf('</section>',enc)<i&&!/<section/.test(html.slice(html.indexOf('</section>',enc),i))&&i<html.indexOf('<section class="cierre" id="contacto">'),'Próximamente: justo tras «Así empieza un encargo» y antes de «Hablamos»');
 // 3.ª tanda: «Próximamente.» es lo primero de la caja; debajo, texto (bajada + qué es) y el imagotipo en segunda columna.
 assert(/<div class="ontos-caja">\s*<h2 class="ontos-caja__titulo">Próximamente\.<\/h2>\s*<div class="ontos-caja__cuerpo">\s*<div class="ontos-caja__texto">\s*<p class="ontos-caja__bajada">El primer gemelo digital[\s\S]*?<p class="ontos-caja__que-es">[\s\S]*?<\/div>\s*<picture class="ontos-caja__logo">[\s\S]*?<\/picture>\s*<\/div>/.test(zona)&&!/<h2>Próximamente/.test(zona),'Próximamente: título primero; texto y, en segunda columna, el imagotipo');
 const p=(zona.match(/<p class="ontos-caja__que-es">([\s\S]*?)<\/p>/)||[])[1]||'';
 assert.equal(p.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim(),queEs.es,'Qué es ONTOS: texto de mensaje.json web.que_es');
 assert(/<img src="\/brand\/canon\/horizontal-color\.svg" alt="ontos"/.test(zona)&&zona.includes('srcset="/brand/canon/vertical-color.svg"'),'Próximamente: imagotipo del canon (horizontal; vertical en móvil)');
 assert(zona.includes('id="ontos-personal"')&&zona.includes('id="ontos-empresarial"')&&zona.includes('href="'+ONTOS_URL+'/"'),'Próximamente: dos ediciones y enlace a ontosdigital.es');
 const cta=JSON.parse(fs.readFileSync(path.join(ONTOS,'data/mensaje.json'),'utf8')).superficies.find(s=>s.id==='web.cta_trabajos');
 assert(html.includes('<a class="cta cta--secundaria" href="#familias">'+cta.es+'</a>'),'Panel: segundo botón de mensaje.json web.cta_trabajos hacia #familias (los ejemplos están en sus familias)');
}
checkQueEs(fs.readFileSync(path.join(WEB,'index.html'),'utf8'));
assert.throws(()=>checkQueEs(fs.readFileSync(path.join(WEB,'index.html'),'utf8').replace('Lo comprueba una máquina','Lo revisa una máquina')),/que_es/,'Caso rojo: un «Qué es» fuera del mensaje debe bloquear');
assert.throws(()=>checkQueEs(fs.readFileSync(path.join(WEB,'index.html'),'utf8').replace('<section id="familias">','<section class="intro" id="que-es"><h2>Qué es</h2></section>\n<section id="familias">')),/#que-es/,'Caso rojo: la sección «Qué es» de vuelta en la portada debe bloquear');
assert.throws(()=>checkQueEs(fs.readFileSync(path.join(WEB,'index.html'),'utf8').replace('src="/brand/canon/horizontal-color.svg"','src="/brand/logo.svg"')),/imagotipo/,'Caso rojo: un logotipo que no es el del canon debe bloquear');
{
 const home=fs.readFileSync(path.join(WEB,'index.html'),'utf8'),pic=(home.match(/\n\s*<picture class="ontos-caja__logo">[\s\S]*?<\/picture>/)||[])[0];
 assert.throws(()=>checkQueEs(home.replace(pic,'').replace('<div class="ontos-caja">','<div class="ontos-caja">'+pic)),/título primero/,'Caso rojo: el imagotipo antes del título (fuera de la segunda columna) debe bloquear');
}
{
 const home=fs.readFileSync(path.join(WEB,'index.html'),'utf8'),a=home.indexOf('<section id="proximamente"'),z=home.indexOf('</section>',a)+'</section>'.length,prox=home.slice(a,z),sin=home.slice(0,a)+home.slice(z);
 assert.throws(()=>checkQueEs(sin.replace('<footer>',prox+'\n\n<footer>')),/Próximamente: justo/,'Caso rojo: Próximamente fuera de su sitio (tras «Hablamos») debe bloquear');
}
// Barra sin «ontos» (8-oct-2026, Fernando): el puente a ontos queda en la portada y en Aplicaciones, no en el menú.
function checkBarraSinOntos(html,f){
 for(const h of html.match(/<header class="barra">[\s\S]*?<\/header>/g)||[])
  assert(!/item--ontos|>\s*ontos\s*<\/a>|href="https:\/\/ontosdigital\.es/.test(h),'Barra: sin enlace a ontos en el menú ('+f+')');
}
for(const f of [...fs.readdirSync(WEB).filter(x=>x.endsWith('.html')),...fs.readdirSync(path.join(WEB,'en')).filter(x=>x.endsWith('.html')).map(x=>'en/'+x),'editor-pdf/index.html'])
 checkBarraSinOntos(fs.readFileSync(path.join(WEB,f),'utf8'),f);
assert.throws(()=>checkBarraSinOntos(fs.readFileSync(path.join(WEB,'index.html'),'utf8').replace('<a class="item icono-contacto"','<a class="item item--ontos" href="https://ontosdigital.es/">ontos</a>\n    <a class="item icono-contacto"'),'index.html'),/sin enlace a ontos/,'Caso rojo: «ontos» de vuelta en el menú debe bloquear');
// Armario mínimo (3-oct-2026): la página es el probador y nada más.
function checkArmario(html){
 const main=html.slice(html.indexOf('<main'),html.indexOf('</main>'));
 assert.deepEqual([...main.matchAll(/<section[^>]*id="([^"]*)"/g)].map(m=>m[1]),['demo'],'Armario: solo el probador');
 assert(/<section id="demo">\s*<h1>Pruébalo: coloca estas 10 prendas<\/h1>/.test(main),'Armario: el probador es el título de la página');
 assert.deepEqual([...main.matchAll(/data-(colocar|orden)="([a-z]+)"/g)].map(m=>m[1]+':'+m[2]),['colocar:baldas','colocar:linea','orden:color','orden:tipo','orden:mezcla'],'Armario: colocar (baldas o línea) y ordenar (color, tipo o mezclar)');
}
// armario.html se quedó en ontosdigital.es con la separación (8-oct-2026): su comprobación vive allí.
// «Sobre mí» (3-oct-2026): proyectos con cargo, premio y publicación comprobables, escritos y cierre como la portada.
function checkSobreMi(html){
 const texto=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
 const main=html.slice(html.indexOf('<main'),html.indexOf('</main>'));
 assert.equal(texto((main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)||[])[1]||''),'Fernando Calle','Sobre mí: nombre');
 assert(texto(main).includes('Hoy tengo dos frentes que se alimentan entre sí. Construyo ontos, el sistema que pone en orden mi propia vida, y llevo ese mismo método a personas y empresas, de su contexto para la IA a una web o un mundo en 3D.'),'Sobre mí: segundo párrafo elegido por Fernando (opción A)');
 assert.deepEqual([...main.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(m=>texto(m[1])).slice(0,5),['Sydney Metro West','Malabar','Northern Water','Red Sea Governorates Urban Development Plan','NEOM'],'Sobre mí: los cinco proyectos (sin HS2, con Malabar, 3-oct)');
 for(const t of ['BIM Manager del paquete de los 41 cross passages. Automaticé su modelado y la carga de metadatos','Gestioné la entrega de 67 modelos con un flujo que automaticé por completo, apoyado en IA','GIS y plan de ejecución BIM de los túneles de The Line.','Premio de innovación (I+D) de TYPSA, 2024, y publicación en la 19th Australasian Tunnelling Conference (ATC 2025)'])
  assert(texto(main).includes(t),'Sobre mí: «'+t.slice(0,40)+'…»');
 for(const h of ['https://search.informit.org/doi/abs/10.3316/informit.T2026010800016790478291249','escrito-plan-bim-ingenieria.html','bim.html','https://www.linkedin.com/in/fercalle-ontos'])assert(main.includes('href="'+h+'"'),'Sobre mí: enlace '+h);
 assert(/<section class="cierre" id="contacto">[\s\S]*?Cuéntame qué os come horas\.[\s\S]*?<a class="cta" href="contacto.html" data-contacto>Cuéntame tu caso<\/a>/.test(main),'Sobre mí: cierre como la portada');
 assert(!/ONTOS en vivo/.test(main),'Sobre mí: sin «ver ONTOS en vivo»');
 assert(/<a class="credencial__enlace" href="https:\/\/search\.informit\.org\//.test(main),'Sobre mí: premio y publicación llevan a la ficha');
}
checkSobreMi(fs.readFileSync(path.join(WEB,'fernando-calle.html'),'utf8'));
assert.throws(()=>checkSobreMi(fs.readFileSync(path.join(WEB,'fernando-calle.html'),'utf8').replace('GIS y plan de ejecución BIM','Automatización')),/Sobre mí/,'Caso rojo: un hecho alterado en Sobre mí debe bloquear');
// Nombre en minúscula (3-oct-2026): ningún «ONTOS» visible en ES/EN (fuera de código, estilos y comentarios).
function ontosVisibles(html){
 const limpio=html.replace(/<!--[\s\S]*?-->|<style\b[\s\S]*?<\/style>/g,'').replace(/<script(?![^>]*ld\+json)\b[^>]*>[\s\S]*?<\/script>/g,'');
 return (limpio.match(/\bONTOS\b(?!_)/g)||[]).length;
}
for(const f of [...pages,...pages.filter(f=>f!=='editor-pdf/index.html').map(f=>'en/'+f)])assert.equal(ontosVisibles(fs.readFileSync(path.join(WEB,f),'utf8')),0,f+': el nombre se escribe «ontos»');
assert.equal(ontosVisibles('<p>Hola ONTOS</p>'),1,'Caso rojo: «ONTOS» visible debe contarse');
const homeHtml=fs.readFileSync(path.join(WEB,'index.html'),'utf8');
checkTrabajos(fs.readFileSync(path.join(WEB,'index.html'),'utf8'));
{
 const home=fs.readFileSync(path.join(WEB,'index.html'),'utf8'),e=[...home.matchAll(/<a class="familia__ejemplo"[\s\S]*?<\/a>/g)].map(m=>m[0]);
 assert.throws(()=>checkTrabajos(home.replace(e[0],'@@').replace(e[1],e[0]).replace('@@',e[1])),/1:1/,'Caso rojo: dos ejemplos cambiados de familia deben bloquear');
 assert.throws(()=>checkTrabajos(home.replace(e[2],'').replace('<p class="mas">','<section id="trabajos">'+e[2]+'</section>\n  <p class="mas">')),/trabajos|1:1/,'Caso rojo: un ejemplo fuera de su familia debe bloquear');
 assert.throws(()=>checkTrabajos(home.replace('<span class="etiqueta">Ejemplo real</span>','<span class="etiqueta">Otra</span>')),/1:1/,'Caso rojo: un ejemplo sin su rótulo debe bloquear');
}
checkEncargo(fs.readFileSync(path.join(WEB,'index.html'),'utf8'));
assert.throws(()=>checkEncargo(fs.readFileSync(path.join(WEB,'index.html'),'utf8').replace('<h3>'+proceso.proceso[1].nombre+'</h3>','<h3>Otro paso</h3>')),/pasos/,'Caso rojo: un paso fuera del canon debe bloquear');
checkFamilias(homeHtml);
assert.throws(()=>checkFamilias(homeHtml.replace('<h3>'+lineas[0].nombre+'</h3>','<h3>Otra familia</h3>')),/títulos/,'Caso rojo: una familia fuera del canon debe bloquear');
function signature({html,baseline=false,file,subtitle,revision,description,sep}){
 const d=new DOMParser().parseFromString(html,'text/html');
 const clean=s=>s.replace(/\s+/g,' ').trim();
 if(!baseline&&d.querySelector('header.barra')){
  if(d.querySelectorAll('main').length!==1||!d.querySelector('main#contenido[tabindex="-1"]')||d.querySelector('.skip-link')?.getAttribute('href')!=='#contenido')throw Error(file+': falta main y salto de teclado operativo');
 }
 // Cambio explícito de Fernando (27-sep): Consultoría es inicio y sale del menú.
 // Solo se descuenta ese enlace de la base; se conserva todo el contenido restante.
 const homeLinks=[...d.querySelectorAll('header.barra nav a.item')].filter(e=>clean(e.textContent)==='Consultoría');
 if(baseline){for(const e of homeLinks){if(e.getAttribute('href')!=='/')throw Error('Destino de Consultoría inesperado');e.remove();}}
 else if(homeLinks.length)throw Error('Consultoría sigue en la cabecera');
 // Segunda petición explícita: lema antes del panel y resto de la apertura dentro.
 // Transformar solo la base permite seguir detectando pérdidas en el resto de la home.
 if(baseline&&file==='index.html'){
  const hero=d.querySelector('body > .hero'),lema=hero?.querySelector('.lema');
  if(!hero||!lema)throw Error('Falta la apertura de referencia');
  const intro=d.createElement('div'),inner=d.createElement('div');
  intro.append(lema);hero.before(intro);
  const aside=d.createElement('p');aside.textContent=subtitle;intro.append('\n',aside);
  inner.append(...hero.childNodes);hero.append(inner);
 }
 // Tercera petición explícita (Fernando, 28-sep-2026): la home sin «Quién» y con los trabajos
 // más cortos (sin su párrafo). Solo esos fragmentos salen de la base.
 if(baseline&&file==='index.html'){
  d.querySelector('section#quien')?.remove();
  for(const p of d.querySelectorAll('#trabajos .trabajo .texto > p'))p.remove();
 }
 // Cuarta petición (Fernando, 28-sep-2026): «El sistema completo» y «Leer el caso» son de ONTOS
 // personal, no de empresarial. Se mueven en la base; lo demás sigue congelado.
 if(baseline&&file==='aplicaciones.html'){
  const emp=d.querySelector('#ontos-empresarial ul.videos'),per=d.querySelector('#ontos-personal ul.videos');
  if(!emp||!per)throw Error('Próximamente: faltan las listas de referencia');
  per.append(...emp.childNodes);emp.remove();
 }
 // Quinta petición (Fernando, 28-sep-2026): producto oculto. Se quitan en la base solo sus enlaces
 // de entrada (Aplicaciones y Sobre mí); producto.html añade noindex y conserva su contenido.
 if(baseline&&file==='aplicaciones.html')d.querySelector('.proximo-pie')?.remove();
 if(baseline&&file==='fernando-calle.html')for(const a of d.querySelectorAll('a[href="producto.html"]'))a.replaceWith(...a.childNodes);
 // La auditoría autoriza cambios editoriales concretos; se congelan por fragmento.
 if(baseline){
  if(file==='servicios.html'){const canonical=d.createElement('link');canonical.rel='canonical';canonical.href='https://ontosdigital.es/aplicaciones.html';d.head.append(canonical);}
  if(file==='404.html')for(const a of d.querySelectorAll('a[href]'))if(['bim.html','contacto.html','aviso-legal.html','privacidad.html'].includes(a.getAttribute('href')))a.setAttribute('href','/'+a.getAttribute('href'));
  if(d.querySelector('#stage'))d.querySelector('#stage').setAttribute('role','main');
  for(const op of revision.pages[file]||[]){
   let node=d.querySelectorAll(op.selector)[op.index||0];
   if(op.previous)node=node?.previousElementSibling;
   if(!node)throw Error(file+': no existe el fragmento de revisión '+op.selector);
   if(op.remove)node.remove();else node.outerHTML=op.html;
  }
  if(revision.descriptions[file]){const m=d.createElement('meta');m.name='description';m.content=revision.descriptions[file];d.head.append(m);}
 }
 // Encargo explícito de Fernando, 2-oct-2026: retirar la entrada y rediseñar familias,
 // recorrido y catálogo. Solo estas zonas permiten cambiar envoltorios; sus textos,
 // títulos, destinos, medios y orden siguen comprobándose contra la referencia.
 // Fuente: ONTOS/raw/marca/2026-10-02-web-home-familias-encargo-aplicaciones-fernando.md.
 if(baseline&&file==='index.html')d.querySelector('section#encargos')?.remove();
 for(const e of d.querySelectorAll('[data-catalog-controls], [data-familias-controls]'))e.remove();
 // 3-oct-2026 (Fernando): el nombre va en minúscula también en rótulos en versalitas; su envoltorio
 // es tipografía, no estructura. El texto se sigue comparando.
 for(const e of d.querySelectorAll('span.nombre-marca'))e.replaceWith(...e.childNodes);
 const visualZones=file==='index.html'?'#familias, #encargo':file==='aplicaciones.html'?'.catalogo, .proximo':null;
 if(visualZones){
  for(const zone of d.querySelectorAll(visualZones)){
   // Carril horizontal pedido por Fernando el 2-oct: semántica del viewport y h2 con id.
   if(file==='index.html'&&zone.id==='familias')zone.querySelector('h2')?.removeAttribute('id');
   // Forma canónica para esta comparación: mantiene todos los nodos con contenido,
   // su semántica y sus ids; descuenta exclusivamente contenedores de composición.
   for(const e of [...zone.querySelectorAll('div,details,summary,article.familia,svg,span[aria-hidden],li.flecha')].reverse()){
    if(e.matches('svg,span[aria-hidden],li.flecha'))e.remove();
    else e.replaceWith(...e.childNodes);
   }
  }
 }
 // Aplicaciones por baldas, 3-oct-2026: el catálogo se reduce en ambos lados a sus piezas por id, en orden
 // fijo y sin cabecera ni título (checkCatalogo los compara con el canon); se conservan y comparan sus textos,
 // enlaces e imágenes. Titular, entradilla y clips de «Próximamente» también se comprueban en checkCatalogo.
 // «Sobre mí» rehecho, 3-oct-2026 (ONTOS/raw/marca/2026-10-03-web-sobre-mi-fernando.md): textos y estructura nuevos
 // por decisión de Fernando; el contenido principal y la descripción salen de esta comparación y checkSobreMi
 // comprueba hechos, enlaces y cierre.
 if(file==='fernando-calle.html'){
  for(const m of d.querySelectorAll('meta[name=description]'))m.remove();
  const main=d.querySelector('main');if(main)main.remove();
  else for(const e of [...d.body.children])if(!e.matches('header.barra, footer, script, template, dialog, .skip-link'))e.remove();
 }
 // Nombre en minúscula, 3-oct-2026 (Fernando: «cambiar ONTOS por ontos, en general»; mensaje.json
 // identidad_verbal.nombre): en la base, el nombre de marca visible pasa a «ontos» en textos y atributos.
 if(baseline){
  const w=d.createTreeWalker(d.documentElement,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode()))if(!n.parentElement?.closest('script:not([type="application/ld+json"]),style'))n.nodeValue=n.nodeValue.replace(/\bONTOS\b(?!_)/g,'ontos');
  for(const e of d.querySelectorAll('[content],[alt],[aria-label],[title],[value]'))for(const at of ['content','alt','aria-label','title','value'])if(e.hasAttribute(at))e.setAttribute(at,e.getAttribute(at).replace(/\bONTOS\b(?!_)/g,'ontos'));
  d.title=d.title.replace(/\bONTOS\b(?!_)/g,'ontos');
 }
 // Separación, 8-oct-2026 (Fernando): web personal. En la base cambian solo marca y dominio: títulos, destinos
 // (páginas podadas a ontosdigital.es, el resto al dominio propio), pie sin «ontos» (el enlace «ontos» de la barra sale el 8-oct-2026, 2.ª tanda: checkBarraSinOntos).
 if(baseline){
  // page.evaluate no ve el ámbito de Node: separa y retitula llegan como texto y se rehacen aquí.
  const {DOMINIO,ONTOS_URL}=sep,separa=new Function('PODADAS','ONTOS_URL','DOMINIO','return '+sep.separa)(sep.PODADAS,ONTOS_URL,DOMINIO),retitula=new Function('return '+sep.retitula)();
  d.title=retitula(d.title);
  for(const a of d.querySelectorAll('a[href], link[rel=canonical]'))a.setAttribute('href',separa(a.getAttribute('href')));
  const w=d.createTreeWalker(d.body,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode()))n.nodeValue=n.nodeValue.replace('© 2026 ontos · Fernando Calle ·','© 2026 Fernando Calle ·').replace('← ontosdigital.es','← '+DOMINIO.replace('https://','')).replace('ontos · ontosdigital.es','Fernando Calle · '+DOMINIO.replace('https://',''));
 }
 // Puente a ontos, 8-oct-2026 (Fernando): fuera de la web personal las solicitudes de acceso a ontos (privacidad)
 // y la opción «Usar ontos (producto)» del formulario. Solo esos fragmentos salen de la base.
 if(baseline&&file==='privacidad.html')for(const li of d.querySelectorAll('li'))if(li.querySelector('strong')?.textContent.startsWith('Solicitudes de acceso a'))li.remove();
 if(baseline&&file==='contacto.html')d.querySelector('select[name=interes] option[value=producto]')?.remove();
 if(file==='aplicaciones.html')for(const e of d.querySelectorAll('section#proximamente, section#producto'))e.remove();
 // Armario mínimo, 3-oct-2026 (Fernando: «que sea solo probar el armario. Nada más»): de la página solo queda
 // el probador (#demo), cuyo título pasa a ser el h1. Se compara solo el probador, sin su título ni la nota final.
 if(file==='armario.html'){
  const main=d.querySelector('main');const demo=d.querySelector('section#demo');
  if(main&&demo){demo.querySelector('h1,h2')?.remove();demo.querySelector('#nota-demo')?.remove();main.replaceChildren(demo);}
  // Controles separados (3-oct): colocar (baldas/línea) y ordenar (color/tipo/mezclar); se comprueban en checkArmario.
  for(const e of d.querySelectorAll('#demo .modos, #demo .controles'))e.remove();
 }
 // Aplicaciones por baldas con tarjetas mínimas, 3-oct-2026 (ONTOS/raw/marca/2026-10-03-web-aplicaciones-ajustes-fernando.md):
 // Fernando retira las explicaciones de cada pieza; catálogo, cabecera y clips salen de la comparación con la base
 // y checkCatalogo los comprueba contra el canon (piezas, acciones, analítica y clips).
 if(file==='aplicaciones.html'){
  for(const e of d.querySelectorAll('section#trabajos, .hero h1, .hero .intro, #proximamente ul.videos, .proximo-clips, dialog.dlg, dialog.dlg-clip'))e.remove();
 }
 // Encargo explícito de Fernando, 3-oct-2026: cuatro familias desde el canon de la oferta
 // (ONTOS/data/ontos-empresa.json#lineas v2) y descripción desde mensaje.json web.description.
 // #familias sale de esta comparación y se comprueba contra el canon en checkFamilias.
 // Fuente: ONTOS/raw/marca/2026-10-03-oferta-cuatro-familias-fernando.md.
 if(file==='index.html'){
  d.querySelector('section#familias')?.remove();
  d.querySelector('section#encargo')?.remove(); // 3-oct: cuatro pasos desde el canon (checkEncargo)
  d.querySelector('section#trabajos')?.remove(); // 3-oct: «Hecho y funcionando» desde el canon; 8-oct: dentro de #familias (checkTrabajos)
  d.querySelector('section#que-es')?.remove(); // 8-oct: «Qué es ONTOS» sale de la portada; su texto (mensaje.json web.que_es) va en Próximamente (checkQueEs)
  d.querySelector('section#proximamente')?.remove(); // 8-oct: Próximamente al final de la portada (checkQueEs)
  d.querySelector('.home-feature .cta--secundaria')?.remove(); // 3-oct: «Ver lo hecho» desde mensaje.json web.cta_trabajos (checkQueEs)
  if(baseline&&description){for(const m of d.querySelectorAll('meta[name=description]'))m.remove();const m=d.createElement('meta');m.name='description';m.content=description.replace(/ · ontos\.$/,'.');d.head.append(m);} // 8-oct-2026: sin «· ontos» (web personal)
 }
 // Los landmarks y el salto de teclado no alteran el contenido del encargo.
 for(const e of d.querySelectorAll('.skip-link'))e.remove();
 for(const e of d.querySelectorAll('main.web-main, nav[aria-label="Volver al inicio"]'))e.replaceWith(...e.childNodes);
 for(const e of d.querySelectorAll('main#contenido'))e.removeAttribute('id');
 for(const e of d.querySelectorAll('#toolbar, #status'))e.removeAttribute('role');
 for(const e of d.querySelectorAll('script,style,svg,template,noscript'))e.remove();
 for(const e of d.querySelectorAll('a.marca'))e.textContent='ONTOS';
 return {title:d.title,description:d.querySelector('meta[name=description]')?.content||'',canonical:d.querySelector('link[rel=canonical]')?.getAttribute('href')||'',
 text:clean(d.body.textContent),headings:[...d.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(e=>[e.tagName,clean(e.textContent)]),
 links:[...d.querySelectorAll('a[href]')].map(e=>[e.getAttribute('href'),clean(e.textContent)]),
 structure:[...d.body.querySelectorAll('*')].map(e=>[e.tagName,e.id,e.getAttribute('role')||'']),
 forms:[...d.querySelectorAll('form,input,textarea,select,button')].map(e=>[e.tagName,e.getAttribute('action'),e.getAttribute('method'),e.getAttribute('name'),e.getAttribute('type'),e.hasAttribute('required')]),
 media:[...d.querySelectorAll('video,source,iframe,img:not(.marca-light):not(.marca-dark)')].map(e=>[e.tagName,e.getAttribute('src'),e.getAttribute('poster'),e.getAttribute('alt')])};
}
(async()=>{
 const {webkit}=require(process.env.PLAYWRIGHT_MODULE||path.join(ONTOS,'scripts/verify/node_modules/playwright'));
 const browser=await webkit.launch();
 try{
  const page=await browser.newPage();
  for(const file of pages){const before=await page.evaluate(signature,{html:git('show',BASE+':'+file),baseline:true,file,subtitle,revision,description:webDescription,sep:{DOMINIO,ONTOS_URL,PODADAS,separa:separa.toString(),retitula:retitula.toString()}});const after=await page.evaluate(signature,{html:fs.readFileSync(path.join(WEB,file),'utf8'),file});assert.deepEqual(after,before,file+': contenido conservado con correcciones explícitas de la auditoría');}
  console.log(`PASS marca ES: ${pages.length} páginas conservan contenido con menú y apertura autorizados; ${bilingual?'espejo EN completo':'EN intacto'}; recursos compartidos protegidos y canon reproducible.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
