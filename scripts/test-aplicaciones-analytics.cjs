// Offline integration: real GoatCounter script, all HTTP requests intercepted.
// Usage: node scripts/test-aplicaciones-analytics.cjs /tmp/count.js
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||path.resolve('../ONTOS/scripts/verify/node_modules/playwright'));
const ROOT=path.resolve(__dirname,'..'),script=fs.readFileSync(process.argv[2],'utf8');
const ids=['editor-pdf','juego-2d','animacion-3d','mundo-normal','segovia'];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const evidence=[];
 for(const language of ['','en/'])for(const route of ['aplicaciones.html','juego-2d.html','animacion-3d.html','visita-3d.html','visita-3d.html?mundo=segovia','visita-3d.html?mundo=unknown']){
  const context=await browser.newContext(),hits=[];let outbound=0;
  await context.route('**/*',async r=>{
   const url=new URL(r.request().url());
   if(url.hostname==='fernandocalle.goatcounter.com'){hits.push(Object.fromEntries(url.searchParams));await r.fulfill({status:204,body:''});return;}
   if(url.hostname==='gc.zgo.at'){await r.fulfill({body:script,contentType:'application/javascript'});return;}
   if(url.hostname==='fernandocalle.es'){
    const file=path.join(ROOT,decodeURIComponent(url.pathname));
    if(fs.existsSync(file)&&fs.statSync(file).isFile()){
     const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';await r.fulfill({body:fs.readFileSync(file),contentType:mime});return;
    }
   }
   outbound++;await r.abort();
  });
  const page=await context.newPage();await page.goto('https://fernandocalle.es/'+language+route);
  await page.waitForFunction(()=>typeof window.goatcounter?.count==='function');await page.waitForTimeout(100);
  const expected='/'+language+(route.startsWith('visita-3d')?'visita-3d.html?mundo='+(route.includes('=segovia')?'segovia':'normal'):route);
  assert.strictEqual(hits.filter(x=>x.e!=='true').length,1,route+' must emit exactly one pageview');
  assert.strictEqual(hits[0].p,expected);
  if(route==='aplicaciones.html'){
   await page.evaluate(()=>document.addEventListener('click',e=>{if(e.target.closest('a[data-goatcounter-click]'))e.preventDefault();},true));
   for(const id of ids)await page.locator(`[data-goatcounter-click="servicio-probar-${id}"]`).click();
   await page.waitForTimeout(100);const events=hits.filter(x=>x.e==='true');
   assert.deepStrictEqual(events.map(e=>e.p),ids.map(id=>'servicio-probar-'+id));assert(events.every(e=>e.ns==='true'));
   const href=await page.locator('[data-goatcounter-click="servicio-probar-segovia"]').getAttribute('href');assert(href.includes(language+'visita-3d.html?mundo=segovia'));
  }
  evidence.push({route:language+route,hits:hits.map(({p,e,ns})=>({path:p,event:e==='true',...(ns?{allClicks:ns==='true'}:{})}))});
  if(route==='aplicaciones.html'){
   hits.length=0;
   for(const suffix of ['?sinestadisticas=1','?sinestadisticas=1']){
    await page.goto('https://fernandocalle.es/'+language+'aplicaciones.html'+suffix);await page.waitForFunction(()=>typeof goatcounter.count==='function');
    assert.strictEqual(await page.evaluate(()=>localStorage.getItem('skipgc')),'t');
    assert.strictEqual(hits.length,0,'Opt-out activation must not count');
    if(process.env.QA_SCREENSHOT&&!language&&!fs.existsSync(process.env.QA_SCREENSHOT))await page.screenshot({path:process.env.QA_SCREENSHOT,fullPage:false});
   }
   for(const target of ['index.html','editor-pdf/index.html','en/visita-3d.html?mundo=segovia']){
    await page.goto('https://fernandocalle.es/'+target);await page.waitForFunction(()=>typeof goatcounter.count==='function');
    await page.evaluate(()=>goatcounter.count({path:'test-must-not-count',event:true}));await page.waitForTimeout(80);
    assert.strictEqual(hits.length,0,'Existing pageview/event must honour opt-out: '+target);
   }
   await page.goto('https://fernandocalle.es/'+language+'aplicaciones.html?sinestadisticas=0');await page.waitForFunction(()=>typeof goatcounter.count==='function');
   assert.strictEqual(await page.evaluate(()=>localStorage.getItem('skipgc')),null);assert.strictEqual(hits.length,0,'Reactivation itself must not count');
   await page.goto('https://fernandocalle.es/index.html');await page.waitForFunction(()=>typeof goatcounter.count==='function');await page.waitForTimeout(80);
   assert.strictEqual(hits.length,1,'Next pageview should count after explicit reactivation');
   evidence.push({language:language||'es',optOut:'PASS idempotent + legacy index/editor + new EN Segovia + manual events + explicit reactivation'});
  }
  await context.close();
 }
 await browser.close();console.log(JSON.stringify({ok:true,network:'All requests intercepted; zero live GoatCounter hits',evidence},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
