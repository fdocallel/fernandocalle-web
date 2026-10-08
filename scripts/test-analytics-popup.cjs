// Real cross-origin popup handshake, with all network intercepted and no analytics hits.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||path.resolve('../ONTOS/scripts/verify/node_modules/playwright'));
const ROOT=path.resolve(__dirname,'..'),nonce='0123456789abcdef0123456789abcdef',messages=[];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext();
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='control.example')return route.fulfill({contentType:'text/html',body:`<button id="open">Open</button><script>window.received=[];window.addEventListener('message',e=>{received.push({origin:e.origin,fromPopup:e.source===window.popup,data:e.data})});document.querySelector('#open').onclick=()=>{window.popup=window.open('https://fernandocalle.es/aplicaciones.html?sinestadisticas=1&ontos_request=${nonce}','test-popup')};</script>`});
  if(url.hostname==='fernandocalle.es'){
   const file=path.join(ROOT,url.pathname);if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({body:fs.readFileSync(file),contentType:{'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)]||'application/octet-stream'});
  }
  return route.abort();
 });
 const page=await context.newPage();await page.goto('https://control.example/');
 const popupEvent=page.waitForEvent('popup');await page.locator('#open').click();const popup=await popupEvent;
 await popup.waitForFunction(()=>localStorage.getItem('skipgc')==='t');
 assert.strictEqual(await popup.evaluate(()=>location.search),'','Transient request/config parameters removed');
 const send=async(type,n)=>page.evaluate(({type,nonce})=>popup.postMessage({type,nonce},'https://fernandocalle.es'),{type,nonce:n});
 await send('ontos-analytics-status-request','incorrect-nonce');await send('not-a-status-request',nonce);
 // Same-window forged message has the correct origin and nonce but is not from the opener.
 await popup.evaluate(nonce=>window.postMessage({type:'ontos-analytics-status-request',nonce},location.origin),nonce);
 await page.waitForTimeout(120);assert.deepStrictEqual(await page.evaluate(()=>received),[],'Forged requests must get no acknowledgement');
 await send('ontos-analytics-status-request',nonce);await page.waitForFunction(()=>received.length===1);
 const first=await page.evaluate(()=>received[0]);assert.strictEqual(first.origin,'https://fernandocalle.es');assert(first.fromPopup);assert.deepStrictEqual(first.data,{type:'ontos-analytics-status',nonce,disabled:true});
 // Never return a stale local success flag: read actual public-origin state each time.
 await popup.evaluate(()=>localStorage.removeItem('skipgc'));await send('ontos-analytics-status-request',nonce);await page.waitForFunction(()=>received.length===2);assert.strictEqual(await page.evaluate(()=>received[1].data.disabled),false);
 await popup.evaluate(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('storage denied')}}));await send('ontos-analytics-status-request',nonce);await page.waitForFunction(()=>received.length===3);assert.strictEqual(await page.evaluate(()=>received[2].data.disabled),null);
 console.log('PASS popup: actual persisted preference, exact origin/source/nonce, forged requests ignored, live read changes, unavailable storage=null. No live analytics or user browser touched.');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
