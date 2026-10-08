#!/usr/bin/env node
'use strict';
// Importación explícita de marca. El contenido editorial permanece en cada HTML.
// Solo exporta fuentes, vectores y tokens; ningún dato personal o documento privado.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const WEB=path.resolve(__dirname,'..');
// Firma de la web personal: el nombre en texto (tipografía corporativa del manual, brand/marca-es.css), sin logotipo.
const MARCA_NOMBRE='Fernando Calle';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const put=(p,b,check,changed)=>{if(fs.existsSync(p)&&fs.readFileSync(p).equals(Buffer.from(b)))return;changed.push(path.relative(WEB,p));if(!check){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}};
function artifacts(root){
  const {loadDesignSystem}=require(path.join(root,'scripts/lib/design-system-model'));
  const model=loadDesignSystem({ROOT:root});
  const read=p=>fs.readFileSync(path.join(root,p));
  const svgPath='docs/diseno/ontos/marca/manual/recursos/logo-n5.svg';
  const svg=read(svgPath).toString();
  const marks=require(path.join(root,'scripts/lib/manual-marca-geometria'))({ROOT:root,svg:()=>svg});
  const cfg=JSON.parse(read('data/marca-aplicaciones.json'));
  const tokens=Object.fromEntries(model.tokens.map(t=>[t.id,t]));
  const min=layout=>layout==='wordmark'?cfg.minimos.digital.wordmark_ancho_px:Math.ceil(marks.dimensions(layout).width/marks.model.D*cfg.minimos.digital.simbolo_diametro_px);
  const out={};
  const sources=[svgPath,'data/mensaje.json','data/manual-marca.json','data/marca-construccion.json','data/marca-wordmark-geometria.json','data/marca-aplicaciones.json','data/design-system.json','data/design-system-tokens.json'];
  const message=JSON.parse(read('data/mensaje.json'));
  const motion=message.fundamentos.movimiento;
  const subtitle=message.superficies.find(s=>s.id==='web.subtitulo')?.es;
  if(!subtitle)throw Error('Falta el subtítulo español de la portada en mensaje.json');
  const glyph=JSON.parse(read('data/marca-movimiento-geometria.json'));
  if(hash(read(model.familias.corporativa.archivo))!==glyph.font.sha256)throw Error('Arcilla: la geometría no corresponde a la fuente Jost');
  sources.push('scripts/lib/marca-movimiento.js','data/marca-movimiento-geometria.json','app/img/brand/logo-esqueleto.svg');
  out['brand/canon/movimiento.js']=read('scripts/lib/marca-movimiento.js');
  out['brand/canon/movimiento-data.js']='// GENERADO: geometría pública y configuración del movimiento Arcilla.\n'+
    'window.ontosBrandAssets='+JSON.stringify({'logo.svg':svg,'logo-esqueleto.svg':read('app/img/brand/logo-esqueleto.svg').toString()})+';\n'+
    'window.ontosGlyphGeometry='+JSON.stringify({O:glyph.O,glyphs:glyph.glyphs,wordmark:glyph.wordmark})+';\n'+
    'window.ontosMotionConfig='+JSON.stringify({duracion_ms:motion.duracion_ms,scroll:motion.scroll,destino:motion.destino,nav_selector:'.barra .marca',host_selector:'[data-arcilla-host]',compact_frame:true})+';\n';
  const fonts=[model.familias.corporativa.archivo,model.familias.editorial.archivo,model.familias.editorial.cursiva,'docs/diseno/ontos/marca/wordmark/fuentes/jost-OFL.txt','docs/diseno/ontos/marca/manual/assets/tipografia/newsreader-OFL.txt'];
  for(const source of fonts){sources.push(source);out['brand/canon/fonts/'+path.basename(source)]=read(source);}
  for(const layout of ['horizontal','vertical','wordmark','icon'])for(const tone of ['color','color-dark','positive','negative'])
    out[`brand/canon/${layout}-${tone}.svg`]='<!-- GENERADO por scripts/import-marca.cjs desde el manual ONTOS. -->\n'+marks.logo(layout,tone);
  const iconBody=svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/)[1].trim().replace(/(<circle\b[^>]*fill=)"#[0-9a-f]{6}"/i,'$1"'+tokens['brand-teja'].valor+'"');
  out['brand/canon/favicon.svg']=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>svg{color:${tokens['brand-granito'].valor}}@media(prefers-color-scheme:dark){svg{color:${tokens['brand-logo-on-dark'].valor}}}</style>${iconBody}</svg>\n`;
  // El atributo marca las páginas de esta entrega. El editor puede cambiar de
  // idioma sin perder su interfaz; los espejos EN heredan el mismo atributo.
  let css=model.css.replaceAll('[data-ontos-ds]','html[data-ontos-web]').replace(/url\("([^"]+)"\)/g,(_,url)=>`url("fonts/${path.posix.basename(url)}")`);
  css+='\n/* Alias de aplicación web. Propuestas y origen en tokens.json. */\nhtml[data-ontos-web]{\n';
  for(const token of model.tokens.filter(t=>t.id.startsWith('web-')&&t.valor!==undefined))css+=`--${token.id}:var(--ds-${token.id});\n`;
  for(const layout of ['horizontal','icon','wordmark'])css+=`--web-logo-${layout}-min:${min(layout)}px;\n`;
  // Origen visible de la primera o en el marco compacto de Arcilla (36 × 92
  // unidades de margen/alto, como el motor canónico), sin editar los contornos.
  const navWidth=tokens['web-logo-width'].valor,navHeight=tokens['web-logo-height'].valor;
  const frameWidth=36+glyph.wordmark.width,scale=Math.min(navWidth/frameWidth,navHeight/92);
  const leading=(navWidth-frameWidth*scale)/2+(18+glyph.glyphs.o.bounds.x)*scale;
  const fallbackLeading=navWidth*glyph.glyphs.o.bounds.x/glyph.wordmark.width;
  css+=`--web-logo-leading-space:${leading.toFixed(4)}px;\n--web-logo-fallback-offset:${(leading-fallbackLeading).toFixed(4)}px;\n`;
  css+='}\n';
  out['brand/canon/tokens.css']=css;
  out['brand/canon/tokens.json']=JSON.stringify({_doc:'GENERADO por scripts/import-marca.cjs. Selección pública de identidad, sin datos de producto.',version:1,tokens:model.tokens.map(t=>({id:t.id,tipo:t.tipo,valor:t.valor,unidad:t.unidad,movil:t.movil,estado:t.estado})),minimos:Object.fromEntries(['horizontal','vertical','wordmark','icon'].map(k=>[k,min(k)]))},null,2)+'\n';
  const home=fs.readFileSync(path.join(WEB,'index.html'),'utf8');
  // Imagen social: la de la web personal es propia (Fernando Calle, sin logotipo de ontos, 8-oct-2026) y la
  // genera brand/gen-og.py con estas fuentes y tokens; el canon de ontos ya no la exporta aquí.
  out['brand/canon/provenance.json']=JSON.stringify({_doc:'GENERADO por scripts/import-marca.cjs. Copias de entrega, no fuentes editables.',source:'ONTOS · manual de marca 1–3 y Design System',scope:'es-en',sources:Object.fromEntries(sources.map(p=>[p,hash(read(p))])),outputs:Object.fromEntries(Object.entries(out).map(([p,b])=>[p,hash(b)]))},null,2)+'\n';
  const pages=fs.readdirSync(WEB).filter(f=>f.endsWith('.html')).concat(['editor-pdf/index.html']);
  for(const file of pages){
    let html=fs.readFileSync(path.join(WEB,file),'utf8');
    if(!/<html\b[^>]*lang="es"/.test(html))throw Error('Página fuera de español: '+file);
    const rel=file==='404.html'?'/brand':path.posix.relative(path.posix.dirname(file),'brand')||'brand';
    const route=file==='editor-pdf/index.html'?'editor-pdf':path.basename(file,'.html');
    if(route==='index'){
      if(!/<p class="home-intro__subtitle">/.test(html))throw Error('Portada sin espacio para el subtítulo');
      html=html.replace(/(<p class="home-intro__subtitle">)[\s\S]*?(<\/p>)/,(_,a,b)=>a+esc(subtitle)+b);
    }
    html=html.replace(/<html\b([^>]*)>/,(_,attrs)=>'<html'+attrs.replace(/\sdata-ontos-web(?:="[^"]*")?/g,'').replace(/\sdata-web-page="[^"]*"/g,'')+` data-ontos-web data-web-page="${route}">`);
    // Web personal (8-oct-2026): la firma de la barra es el nombre en texto; sin Arcilla, que anima el logotipo de ontos.
    const motionScripts='';
    const links=`<!-- MARCA:estilos · generado desde el canon; diseño ES/EN -->\n<link rel="stylesheet" href="${rel}/canon/tokens.css">\n<link rel="stylesheet" href="${rel}/marca-es.css">${motionScripts}\n<!-- /MARCA:estilos -->`;
    if(html.includes('<!-- MARCA:estilos'))html=html.replace(/<!-- MARCA:estilos[\s\S]*?<!-- \/MARCA:estilos -->/,links);
    else html=html.replace('</head>',links+'\n</head>');
    html=html.replace(/(<link\b[^>]*rel="icon"[^>]*href=")[^"]*(")/g,'$1'+rel+'/canon/favicon.svg$2');
    html=html.replace(/(<meta\b[^>]*(?:property="og:image"|name="twitter:image")[^>]*content=")https:\/\/ontosdigital\.es\/brand\/og\.png("[^>]*>)/g,'$1https://ontosdigital.es/brand/canon/og.png$2');
    html=html.replace(/<a\b([^>]*class="marca"[^>]*)>[\s\S]*?<\/a>/g,(_,attrs)=>`<a${attrs}><span class="marca__nombre">${MARCA_NOMBRE}</span></a>`);
    // Restantes sellos/escenas: conservar atributos, identidad de DOM y animaciones.
    html=html.replace(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g,(all,attrs,body)=>{
      if(!/viewBox="0 0 100 100"/.test(attrs)||!/<circle\b[^>]*r="16\.5"/.test(body)||(body.match(/<path\b/g)||[]).length!==8)return all;
      return '<svg'+attrs+'>'+iconBody+'</svg>';
    });
    html=html.replace(/(<meta\s+name="theme-color"\s+content=")[^"]*("[^>]*>)/g,(_,a,b)=>a+tokens['web-page-surface'].valor+b);
    out[file]=html;
  }
  return out;
}
function run(root,{check=false}={}){const generated=artifacts(path.resolve(root)),changed=[];for(const [p,b]of Object.entries(generated))put(path.join(WEB,p),b,check,changed);if(check&&changed.length)throw Error('Marca desactualizada: '+changed.join(', '));return changed;}
if(require.main===module){try{const args=process.argv.slice(2),root=args.find(a=>!a.startsWith('--'));if(!root)throw Error('Uso: node scripts/import-marca.cjs /ruta/ONTOS [--check]');console.log('Marca web ES/EN:',run(root,{check:args.includes('--check')}).length,'cambios');}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={artifacts,run};
