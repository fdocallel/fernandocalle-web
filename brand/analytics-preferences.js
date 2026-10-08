/* Explicit browser preference, using GoatCounter's existing skipgc flag.
 * https://www.goatcounter.com/help/skip-dev (verified 2026-09-11).
 * Load before count.js. The setting applies to every page on this origin. */
(()=>{
 const url=new URL(location.href),value=url.searchParams.get('sinestadisticas'),nonce=url.searchParams.get('ontos_request');
 if(value!=='1'&&value!=='0')return;
 // Changing the preference itself must not add a pageview or bind click events.
 window.goatcounter=Object.assign(window.goatcounter||{},{no_onload:true});
 const en=document.documentElement.lang==='en';let saved=true;
 try{if(value==='1')localStorage.setItem('skipgc','t');else localStorage.removeItem('skipgc');}catch(error){saved=false;}
 url.searchParams.delete('sinestadisticas');url.searchParams.delete('ontos_request');history.replaceState(null,'',url.pathname+url.search+url.hash);
 // A Control Web popup may ask for the current public-origin preference.
 // Return only its own nonce and a freshly read boolean; never accept commands or URLs.
 if(nonce&&/^[A-Za-z0-9_-]{16,128}$/.test(nonce)&&window.opener){
  window.addEventListener('message',event=>{
   if(event.source!==window.opener||!event.data||event.data.type!=='ontos-analytics-status-request'||event.data.nonce!==nonce)return;
   try{const origin=new URL(event.origin);if(!['http:','https:'].includes(origin.protocol)||origin.origin!==event.origin)return;}catch(error){return;}
   let disabled=null;try{disabled=localStorage.getItem('skipgc')==='t';}catch(error){}
   event.source.postMessage({type:'ontos-analytics-status',nonce,disabled},event.origin);
  });
 }
 const notice=document.createElement('aside');notice.setAttribute('role','status');
 notice.style.cssText='position:fixed;bottom:20px;left:20px;right:20px;z-index:99999;padding:18px 22px;background:#f7f3ec;color:#352d24;border:1px solid #a66736;font:16px/1.5 system-ui;box-shadow:0 3px 18px #0002;display:flex;gap:18px;align-items:center;justify-content:space-between';
 const message=document.createElement('span');message.textContent=!saved
  ?(en?'Your browser could not save this preference. This settings pageview was not counted.':'El navegador no pudo guardar esta preferencia. Esta visita de configuración no se ha contado.')
  :value==='1'
   ?(en?'Your visits and clicks are excluded from statistics in this browser.':'Tus visitas y clics quedan excluidos de las estadísticas en este navegador.')
   :(en?'Statistics are enabled again in this browser, from the next page you open.':'Las estadísticas vuelven a estar activas en este navegador desde la siguiente página que abras.');
 const close=document.createElement('button');close.type='button';close.textContent=en?'Close':'Cerrar';close.style.cssText='padding:10px 16px;cursor:pointer';close.addEventListener('click',()=>notice.remove());notice.append(message,close);document.body.append(notice);
})();
