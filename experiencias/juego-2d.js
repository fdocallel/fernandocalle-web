/* ONTOS public procedural experience. See provenance.json. */
(() => {
'use strict';
const T=window.ONTOS_DEMO_TRANSLATE|| (text=>text);
let session=null;

function boot(opts){
  if(session) session.stop();
  opts=opts||{};
  const canvas=opts.canvas||document.getElementById('world');
  if(!canvas) return null;
  const ctx=canvas.getContext('2d');
  const $=id=>document.getElementById(id),TAU=Math.PI*2,GROUND=440,WORLD=2700;
  const css=getComputedStyle(document.documentElement),color=n=>css.getPropertyValue(n).trim();
  const C={bg:color('--bg'),paper:color('--surface'),ink:color('--text'),muted:color('--muted'),line:color('--border'),gold:color('--oro'),bronze:color('--accent'),clay:color('--teja'),soft:color('--soft'),leaf:color('--area-vida-ink')||color('--accent')};
  const tv=!!opts.tv;
  let zoom=tv?1.45:1,width,height,scale,camera=0,cameraY=0,last=0,time=0,paused=false,wave=0,win=false,particles=[],p,seed,stars,frames=0,raf=0,running=true;
  const held=new Set(),touch=new Map();
  const platforms=[{x:660,y:360,w:160},{x:955,y:290,w:160},{x:1280,y:355,w:175},{x:1850,y:345,w:150}];
  const starPositions=[[360,390],[700,315],[1005,245],[1335,310],[1580,385],[1885,300],[2130,385],[2415,375]];
  const text=(id,v)=>{const n=$(id);if(n)n.textContent=v;};
  const attr=(id,k,v)=>{const n=$(id);if(n)n.setAttribute(k,v);};
  function say(msg){const n=$('message');if(n&&n.textContent!==msg)n.textContent=msg;}
  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;scale=height/540*zoom*(width<640&&!tv?1.16:1);const dpr=Math.min(devicePixelRatio||1,tv?1:2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  const ro=new ResizeObserver(resize);ro.observe(canvas);
  function clearInput(){held.clear();touch.clear();document.querySelectorAll('[data-hold]').forEach(b=>b.setAttribute('aria-pressed','false'));}
  function reset(){p={x:190,y:GROUND-44,vx:0,vy:0,ground:true,angle:0,fold:0,dir:1,carrying:false};seed={x:490,y:GROUND-15,vy:0};stars=starPositions.map(([x,y])=>({x,y,got:false}));particles=[];wave=0;win=false;time=0;camera=0;cameraY=0;clearInput();setPause(false);say(tv?'← → pasear · ↑ saltar · OK coger · verde saludar':T('Prueba a moverte. Me hago rueda yo solo.'));text('score',T('Destellos 0 / 8'));}
  function setPause(value){paused=value;clearInput();const ov=$('overlay');if(ov)ov.hidden=!value;text('pause',value?T('Continuar'):T('Pausa'));attr('pause','aria-pressed',String(value));}
  function burst(x,y,n=14){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*190,vy:-Math.random()*200,life:.6+Math.random()*.5});}
  function act(action){if(paused)return;if(action==='jump'&&p.ground){p.vy=-545;p.ground=false;burst(p.x,p.y+42,7);say(T('¡Arriba! También sé saltar mientras ruedo.'));}
  if(action==='wave'){wave=2.2;say(T('¡Hola! Sí, te estoy mirando.'));}
  if(action==='grab'){
  if(p.carrying){p.carrying=false;seed.x=Math.max(15,Math.min(WORLD-15,p.x+p.dir*54));seed.y=p.y-15;seed.vy=0;
  if(Math.abs(p.x-2490)<120&&p.ground){seed.x=2490;seed.y=GROUND-65;win=true;burst(seed.x,seed.y,45);say(T('Una semilla, un jardín. Ya hemos hecho algo juntos.'));}else say(T('La dejo aquí. Puedes volver a cogerla.'));}
  else if(!win&&Math.hypot(p.x-seed.x,p.y-seed.y)<100){p.carrying=true;say(T('¡La tengo! Llévame al pedestal del final, hacia la derecha.'));}
  else say(win?T('La semilla ya está en casa. Sigamos jugando.'):T('Acércate a la semilla dorada para cogerla con E.'));}}
  const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ShiftLeft:'boost',ShiftRight:'boost'};
  const actions={Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyE:'grab',KeyH:'wave',Enter:'grab'};
  function onKeyDown(e){if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(e.target.closest('button,a')&&(e.code==='Space'||e.code==='Enter'))return;if(keys[e.code]||actions[e.code]||e.code==='KeyP'){e.preventDefault();if(e.code==='KeyP'){if(!e.repeat)setPause(!paused);return;}if(paused)return;if(keys[e.code])held.add(e.code);else if(!e.repeat)act(actions[e.code]);}}
  function onKeyUp(e){held.delete(e.code);}
  function onBlur(){if(!tv)setPause(true);}
  function onVis(){if(document.hidden)setPause(true);}
  window.addEventListener('keydown',onKeyDown);
  window.addEventListener('keyup',onKeyUp);
  window.addEventListener('blur',onBlur);
  document.addEventListener('visibilitychange',onVis);
  const zoomBtn=$('zoom'),pauseBtn=$('pause'),resetBtn=$('reset');
  if(zoomBtn)zoomBtn.onclick=()=>{zoom=zoom===1||zoom===1.45?(tv?1:1.75):(tv?1.45:1);resize();camera=Math.max(0,Math.min(WORLD-width/scale,p.x-width/scale*.38));zoomBtn.setAttribute('aria-pressed',String(zoom>1.2));zoomBtn.textContent=zoom>1.2?T('Ver el jardín'):T('Ver de cerca');};
  if(pauseBtn)pauseBtn.onclick=()=>setPause(!paused);
  if(resetBtn)resetBtn.onclick=reset;
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));
  document.querySelectorAll('[data-hold]').forEach(b=>{b.addEventListener('pointerdown',e=>{if(paused)return;e.preventDefault();b.setPointerCapture(e.pointerId);touch.set(e.pointerId,b.dataset.hold);b.setAttribute('aria-pressed','true');});const release=e=>{touch.delete(e.pointerId);b.setAttribute('aria-pressed','false');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);b.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!paused){held.add('button-'+b.dataset.hold);b.setAttribute('aria-pressed','true');}}});b.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){held.delete('button-'+b.dataset.hold);b.setAttribute('aria-pressed','false');}});b.addEventListener('blur',()=>held.delete('button-'+b.dataset.hold));});
  function down(action){return [...held].some(k=>keys[k]===action||k==='button-'+action)||[...touch.values()].includes(action);}
  function step(dt){time+=dt;wave=Math.max(0,wave-dt);const axis=Number(down('right'))-Number(down('left')),speed=down('boost')?470:255;
  p.vx+=(axis*speed-p.vx)*Math.min(1,dt*(axis?5:8));if(axis)p.dir=axis;
  const prev=p.y+44;p.x=Math.max(44,Math.min(WORLD-44,p.x+p.vx*dt));p.vy+=1330*dt;p.y+=p.vy*dt;p.ground=false;
  let floor=GROUND;for(const b of platforms)if(p.x+26>b.x&&p.x-26<b.x+b.w&&prev<=b.y+2&&p.y+44>=b.y&&p.vy>=0)floor=Math.min(floor,b.y);
  if(p.y+44>=floor&&p.vy>=0){p.y=floor-44;p.vy=0;p.ground=true;}
  p.fold+=((Math.abs(p.vx)>30&&!p.carrying?1:0)-p.fold)*Math.min(1,dt*9);p.angle+=p.vx*dt/40*p.fold;
  if(p.carrying){seed.x=p.x+p.dir*45;seed.y=p.y-9;}else if(!win){seed.vy+=1000*dt;seed.y+=seed.vy*dt;if(seed.y>=GROUND-15){seed.y=GROUND-15;seed.vy=0;}}
  for(const s of stars)if(!s.got&&Math.hypot(p.x-s.x,p.y-s.y)<56){s.got=true;burst(s.x,s.y);const n=stars.filter(s=>s.got).length;text('score',`${T('Destellos')} ${n} / 8`);say(n===8?T('Ocho destellos. ¡No se nos escapa uno!'):T('Un destello más. Me gusta este mundo.'));}
  for(const f of particles){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=440*dt;f.life-=dt;}particles=particles.filter(f=>f.life>0);
  const visible=width/scale,target=Math.max(0,Math.min(WORLD-visible,p.x-visible*.38));camera+=(target-camera)*Math.min(1,dt*5);
  text('state',wave?T('● Saludando'):p.carrying?T('● Manos ocupadas'):!p.ground?T('● En el aire'):Math.abs(p.vx)>40?(down('boost')?T('● Rueda · turbo'):T('● Rodando')):T('● Curioseando'));}
  function circle(x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
  function line(x,y,x2,y2,w,color){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
  function label(msg,x,y,size=12,col=C.muted,keepVisible=false){ctx.fillStyle=col;ctx.font=`${Math.max(size,12/scale)}px ${css.getPropertyValue('--font')}`;ctx.textAlign='center';if(keepVisible){const half=ctx.measureText(msg).width/2+12/scale;x=Math.max(camera+half,Math.min(camera+width/scale-half,x));}ctx.fillText(msg,x,y);}
  function arch(x,y,w,h){
    const cy=y-h+w/2,thick=14;
    for(const side of [0,1]){const xx=x+w*side;ctx.fillStyle=C.line;ctx.fillRect(xx-thick,cy,thick*2,y-cy);ctx.fillStyle=C.paper;ctx.fillRect(xx-thick,cy,5,y-cy);for(let yy=cy+22;yy<y;yy+=32)line(xx-thick,yy,xx+thick,yy,1,C.muted);ctx.fillStyle=C.soft;ctx.fillRect(xx-20,y-12,40,12);ctx.fillRect(xx-20,cy-8,40,12);}
    for(let i=0;i<11;i++){const a=Math.PI+i*Math.PI/11+.009,b=Math.PI+(i+1)*Math.PI/11-.009;ctx.beginPath();ctx.arc(x+w/2,cy,w/2+thick,a,b);ctx.arc(x+w/2,cy,w/2-thick,b,a,true);ctx.closePath();ctx.fillStyle=i===5?C.soft:C.line;ctx.fill();ctx.strokeStyle=C.paper;ctx.lineWidth=1.5;ctx.stroke();}
  }
  function olive(x,y,s=1){ctx.save();const opacity=ctx.globalAlpha;ctx.translate(x,y);ctx.scale(s,s);line(0,0,5,-68,7,C.bronze);line(3,-39,-22,-72,4,C.bronze);line(4,-48,29,-82,4,C.bronze);for(const [xx,yy,rx,ry] of [[-23,-78,30,16],[25,-88,36,20],[0,-101,31,19]]){ctx.fillStyle=C.leaf;ctx.beginPath();ctx.ellipse(xx,yy,rx,ry,-.16,0,TAU);ctx.fill();ctx.globalAlpha=opacity*.3;ctx.fillStyle=C.gold;ctx.beginPath();ctx.ellipse(xx-5,yy-5,rx*.7,ry*.55,-.16,0,TAU);ctx.fill();ctx.globalAlpha=opacity;}ctx.restore();}
  function gardenTuft(x,y,flower=false){ctx.save();ctx.translate(x,y);for(let i=-1;i<=1;i++){const sway=Math.sin(time*1.2+x)*2;line(0,0,i*7+sway,-9-Math.abs(i)*5,1.5,C.leaf);if(flower&&i!==0){circle(i*7+sway,-14,3,C.paper);circle(i*7+sway,-14,1.2,C.gold);}}ctx.restore();}
  function drawCharacter(){
    const ext=1-p.fold, moving=Math.min(1,Math.abs(p.vx)/255);
    const bob=p.ground?Math.sin(time*3)*1.1*ext:0;
    ctx.save();ctx.translate(p.x,p.y+bob);
    for(const side of [-1,1]){
      const stride=p.carrying?Math.sin(time*12+side*1.5)*5*moving:0;
      const kneeX=side*(17+5*ext), kneeY=24+8*ext;
      const ankleX=side*(19+6*ext)+stride,ankleY=28+10*ext;
      line(side*17,23,kneeX,kneeY,7,C.bronze);
      circle(kneeX,kneeY,4,C.gold);circle(kneeX-1,kneeY-1,1.3,C.paper);
      line(kneeX,kneeY,ankleX,ankleY,5,C.bronze);
      ctx.save();ctx.translate(ankleX,ankleY);ctx.scale(side*(.2+.8*ext),.25+.75*ext);
      ctx.beginPath();ctx.moveTo(-6,-5);ctx.quadraticCurveTo(2,-8,6,-3);
      ctx.quadraticCurveTo(16,-2,16,3);ctx.quadraticCurveTo(15,6,10,6);
      ctx.lineTo(-7,6);ctx.quadraticCurveTo(-10,1,-6,-5);ctx.closePath();
      ctx.fillStyle=C.clay;ctx.fill();ctx.strokeStyle=C.bronze;ctx.lineWidth=1;ctx.stroke();
      line(-7,5,13,5,2,C.ink);line(1,-2,5,-1,1,C.paper);ctx.restore();
    }
    for(const side of [-1,1]){
      const waving=wave>0&&side===1, carrying=p.carrying&&side===p.dir;
      let hx=side*(27+29*ext),hy=7+10*ext;
      if(waving){hx=side*(51+Math.sin(time*13)*5);hy=-30;}
      if(carrying){hx=side*45;hy=0;}
      const elbowX=side*(29+13*ext),elbowY=waving?-3:14*ext;
      line(side*29,3,elbowX,elbowY,7,C.bronze);
      circle(elbowX,elbowY,4,C.gold);circle(elbowX-1,elbowY-1,1.2,C.paper);
      line(elbowX,elbowY,hx,hy,5,C.bronze);
      ctx.save();ctx.translate(hx,hy);ctx.rotate(waving?Math.sin(time*13)*.22:side*.18);
      ctx.scale(waving||carrying?1:.2+.8*ext,waving||carrying?1:.2+.8*ext);
      const hand=C.paper;
      ctx.fillStyle=hand;ctx.strokeStyle=C.bronze;ctx.lineWidth=1.3;
      ctx.beginPath();ctx.moveTo(-6,-2);ctx.quadraticCurveTo(-8,6,-3,8);
      ctx.quadraticCurveTo(5,11,7,3);ctx.lineTo(7,-3);ctx.closePath();ctx.fill();ctx.stroke();
      for(let i=0;i<4;i++){
        const x=-5+i*3.5,tip=carrying?-5:-10-(i===1||i===2?3:0);
        line(x,-1,x+(i-1.5)*.7,tip,3.6,C.bronze);
        line(x,-1,x+(i-1.5)*.7,tip,2,hand);
      }
      line(-5,3,-11,-2,4.5,C.bronze);line(-5,3,-11,-2,2.8,hand);
      line(-3,8,4,8,3,C.bronze);line(-2,3,3,4,.8,C.line);ctx.restore();
    }
    ctx.save();ctx.rotate(p.angle);
    for(let i=0;i<8;i++){
      const a=i*TAU/8+.045,b=a+TAU/8-.09;
      const lx=-25*Math.cos(p.angle)-35*Math.sin(p.angle),ly=25*Math.sin(p.angle)-35*Math.cos(p.angle);
      const material=ctx.createLinearGradient(lx,ly,-lx,-ly);
      material.addColorStop(0,C.paper);material.addColorStop(.28,C.gold);material.addColorStop(.68,C.bronze);material.addColorStop(1,C.bronze);
      ctx.beginPath();ctx.arc(0,1.8,40,a,b);ctx.arc(0,1.8,27,b,a,true);ctx.closePath();ctx.fillStyle=C.bronze;ctx.fill();
      ctx.beginPath();ctx.arc(0,0,39,a,b);ctx.arc(0,0,28,b,a,true);ctx.closePath();
      ctx.fillStyle=material;ctx.fill();ctx.strokeStyle=C.bronze;ctx.lineWidth=.8;ctx.stroke();
      const rimLight=(Math.cos((a+b)/2+p.angle+.9)+1)/2;
      ctx.globalAlpha=.22+.5*rimLight;ctx.beginPath();ctx.arc(0,0,37.3,a+.025,b-.025);ctx.strokeStyle=C.paper;ctx.lineWidth=1.2;ctx.stroke();ctx.globalAlpha=1;
      ctx.beginPath();ctx.arc(0,0,29.5,a+.03,b-.03);ctx.strokeStyle=C.bronze;ctx.lineWidth=1.8;ctx.stroke();
      for(const edge of [a+.01,b-.01])line(Math.cos(edge)*30,Math.sin(edge)*30,Math.cos(edge)*37,Math.sin(edge)*37,.7,C.gold);
      const mid=(a+b)/2,phase=(time*.7+i/8)%1,r=17+phase*13;
      line(Math.cos(mid)*16,Math.sin(mid)*16,Math.cos(mid)*29,Math.sin(mid)*29,2,C.bronze);
      circle(Math.cos(mid)*r,Math.sin(mid)*r,1.7,C.gold);
      circle(Math.cos(mid)*29,Math.sin(mid)*29,2.1,C.bronze);circle(Math.cos(mid)*29,Math.sin(mid)*29,.9,C.paper);
    }
    ctx.restore();
    const pulse=1+Math.sin(time*(moving?6:3))*.035;
    ctx.save();ctx.scale(pulse,pulse);
    ctx.globalAlpha=.15;circle(0,0,22,C.gold);ctx.globalAlpha=1;
    circle(0,1,20,C.bronze);circle(0,0,18.5,C.gold);
    const core=ctx.createRadialGradient(-6,-7,1,0,0,18);
    core.addColorStop(0,C.gold);core.addColorStop(.48,C.clay);core.addColorStop(1,C.bronze);
    circle(0,0,17,core);
    ctx.strokeStyle=C.soft;ctx.lineWidth=1.1;ctx.lineCap='round';
    for(const side of [-1,1]){
      ctx.beginPath();ctx.moveTo(side*2,-10);ctx.bezierCurveTo(side*11,-13,side*13,-3,side*8,0);
      ctx.bezierCurveTo(side*15,5,side*8,12,side*2,10);ctx.stroke();
      line(side*3,-4,side*8,-5,1,C.gold);line(side*3,5,side*8,3,1,C.gold);
      circle(side*8,-5,1.5,C.paper);circle(side*8,3,1.3,C.paper);
    }
    line(0,-8,0,8,1,C.gold);line(-4,-2,4,2,1.2,C.paper);line(-4,3,4,-3,1.2,C.paper);
    ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(-7,-10,5,2,-.6,0,TAU);ctx.fillStyle=C.paper;ctx.fill();ctx.restore();
    const blink=Math.sin(time*1.3)>.994,look=p.dir*(moving?2.5:1.2)+Math.sin(time*.65)*.35;
    for(const x of [-10,10]){
      line(x,-21,x,-28,3,C.bronze);
      ctx.fillStyle=C.bronze;ctx.beginPath();ctx.ellipse(x,-29,9,10,0,0,TAU);ctx.fill();
      ctx.fillStyle=C.paper;ctx.beginPath();ctx.ellipse(x,-30,7,blink?1:8,0,0,TAU);ctx.fill();
      if(!blink){circle(x+look,-29,3.8,C.ink);circle(x+look+1,-31,1.3,C.paper);}
      line(x-5,-41+(wave?1:0),x+4,-42,1.7,C.bronze);
    }
    ctx.strokeStyle=C.bronze;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,18,6,.15,Math.PI-.15);ctx.stroke();
    ctx.restore();
  }
  function draw(){if(!width)return;ctx.clearRect(0,0,width,height);
  const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,C.paper);sky.addColorStop(1,C.bg);ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  const safeTop=(p.y-72+height/scale-540)*scale,wanted=Math.max(0,(84-safeTop)/scale);cameraY=Math.max(wanted,cameraY*.9);
  ctx.save();ctx.scale(scale,scale);ctx.translate(0,height/scale-540+cameraY);
  const visible=width/scale;
  ctx.save();ctx.translate(-camera*.12,0);const sun=ctx.createRadialGradient(540,130,8,540,130,150);sun.addColorStop(0,C.soft);sun.addColorStop(1,C.bg);circle(540,130,150,sun);circle(540,130,29,C.paper);ctx.globalAlpha=.35;
  for(let i=-1;i<9;i++){ctx.fillStyle=i%2?C.soft:C.line;ctx.beginPath();ctx.moveTo(i*420-100,GROUND);ctx.bezierCurveTo(i*420+30,280-i%3*20,i*420+190,265+i%2*40,i*420+390,GROUND);ctx.fill();}ctx.restore();
  ctx.save();ctx.translate(-camera*.48,0);ctx.globalAlpha=.64;arch(430,GROUND,165,235);arch(1390,GROUND,215,305);arch(2230,GROUND,130,215);ctx.globalAlpha=.24;for(const [x,s] of [[-60,1.25],[290,1.4],[805,.9],[1190,1.2],[1740,1.5],[2290,1.1],[2850,1.3]])olive(x,GROUND,s);ctx.restore();
  ctx.translate(-camera,0);ctx.fillStyle=C.paper;ctx.fillRect(camera,GROUND,visible,140);
  const earth=ctx.createLinearGradient(0,GROUND,0,GROUND+140);earth.addColorStop(0,C.soft);earth.addColorStop(1,C.bg);ctx.fillStyle=earth;ctx.fillRect(camera,GROUND+9,visible,135);line(camera,GROUND,camera+visible,GROUND,2,C.bronze);line(camera,GROUND+4,camera+visible,GROUND+4,2,C.paper);
  for(let x=20;x<WORLD;x+=67){ctx.globalAlpha=.6;line(x,GROUND+12,x+Math.sin(x)*7,GROUND+24,1,C.line);ctx.beginPath();ctx.ellipse(x+18,GROUND+39+(x%3)*6,7,2,0,0,TAU);ctx.fillStyle=C.line;ctx.fill();ctx.globalAlpha=1;if(x%4===0)gardenTuft(x,GROUND,x%3===0);}
  for(const [x,sc] of [[75,.32],[605,.28],[1510,.33],[2020,.26],[2640,.36]]){ctx.globalAlpha=.8;olive(x,GROUND,sc);ctx.globalAlpha=1;gardenTuft(x+27,GROUND,true);gardenTuft(x-17,GROUND);}
  for(const b of platforms){ctx.globalAlpha=.09;ctx.fillStyle=C.bronze;ctx.fillRect(b.x+14,GROUND+5,b.w-18,5);ctx.globalAlpha=1;ctx.fillStyle=C.line;ctx.fillRect(b.x,b.y,b.w,15);ctx.fillStyle=C.soft;ctx.fillRect(b.x+8,b.y+15,b.w-16,7);line(b.x,b.y,b.x+b.w,b.y,3,C.bronze);line(b.x+2,b.y+3,b.x+b.w-2,b.y+3,2,C.paper);for(let x=b.x+35;x<b.x+b.w;x+=38)line(x,b.y+4,x-3,b.y+13,1,C.muted);gardenTuft(b.x+b.w-18,b.y,false);}
  label(T('I · DESPERTAR'),200,GROUND+72);label(T('II · COGER EL MUNDO'),960,GROUND+72);label(T('III · ECHAR RAÍCES'),2400,GROUND+72);
  ctx.fillStyle=C.line;ctx.fillRect(2462,GROUND-42,56,42);ctx.fillStyle=C.bronze;ctx.fillRect(2453,GROUND-48,74,9);label(win?T('EN CASA'):(tv?'DEJA AQUÍ LA SEMILLA · OK':T('DEJA AQUÍ LA SEMILLA · E')),2490,GROUND-108,12,C.bronze);
  if(win){line(2490,GROUND-65,2490,GROUND-130,4,C.leaf);for(let i=0;i<4;i++){const y=GROUND-85-i*12;ctx.fillStyle=C.leaf;ctx.beginPath();ctx.ellipse(2490+(i%2?12:-12),y,17,7,i%2?-.6:.6,0,TAU);ctx.fill();}}
  for(const s of stars)if(!s.got){const y=s.y+Math.sin(time*2.5+s.x)*5;ctx.save();ctx.translate(s.x,y);ctx.rotate(Math.PI/4+time*.35);ctx.fillStyle=C.gold;ctx.fillRect(-7,-7,14,14);ctx.restore();circle(s.x,y,3,C.paper);}
  ctx.save();const shadowY=p.ground?p.y+45:GROUND+4;ctx.fillStyle=C.bronze;for(let i=3;i>0;i--){ctx.globalAlpha=.035;ctx.beginPath();ctx.ellipse(p.x,shadowY,(23+i*5)*Math.max(.4,1-(shadowY-p.y)/500),2+i*1.5,0,0,TAU);ctx.fill();}
  if(p.ground&&Math.abs(p.vx)>45)for(let i=0;i<5;i++){ctx.globalAlpha=.13*(1-i/5);ctx.fillStyle=C.gold;ctx.beginPath();ctx.ellipse(p.x-p.dir*(32+i*11),p.y+40-i*1.1,7+i*1.5,2+i*.3,0,0,TAU);ctx.fill();}ctx.restore();
  drawCharacter();
  if(!win||p.carrying){const material=ctx.createRadialGradient(seed.x-5,seed.y-6,1,seed.x,seed.y,15);material.addColorStop(0,C.paper);material.addColorStop(.28,C.gold);material.addColorStop(1,C.bronze);circle(seed.x,seed.y,14,material);line(seed.x,seed.y-12,seed.x+5,seed.y-22,2,C.leaf);ctx.fillStyle=C.leaf;ctx.beginPath();ctx.ellipse(seed.x+8,seed.y-20,6,3,-.6,0,TAU);ctx.fill();if(!p.carrying&&Math.abs(p.x-seed.x)<160)label(tv?'OK · COGER':T('E · COGER'),seed.x,seed.y-40,12,C.bronze,true);}
  for(const f of particles){ctx.globalAlpha=Math.max(0,Math.min(1,f.life));circle(f.x,f.y,3,C.gold);}ctx.globalAlpha=1;
  if(wave)label(T('¡Hola!'),p.x,p.y-66,18,C.bronze);
  ctx.restore();}
  function frame(now){if(!running)return;const dt=Math.min((now-last)/1000||0,.033);last=now;if(!paused)step(dt);draw();frames++;raf=requestAnimationFrame(frame);}
  function stop(){running=false;if(raf)cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',onBlur);document.removeEventListener('visibilitychange',onVis);if(session===api)session=null;}
  function snapshot(){return JSON.parse(JSON.stringify({paused,win,frames,player:p,stars:stars.filter(s=>s.got).length,tv}));}
  const api={stop,snapshot,act,reset,pause:setPause};
  session=api;
  reset();resize();raf=requestAnimationFrame(frame);
  return api;
}

window.ONTOS_VIVO={boot,stop(){if(session)session.stop();},snapshot(){return session?session.snapshot():null}};
})();
