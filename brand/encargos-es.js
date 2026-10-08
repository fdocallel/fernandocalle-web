/* Las familias en un carril nativo: flechas, teclado y gesto táctil.
   Sin JavaScript permanece desplazable; sin temporizadores de reproducción.
   Movimiento (propuesta 3-oct): cada figura se traza al entrar en pantalla y
   repite su gesto con cursor o foco; las flechas escalonan la llegada.
   Con movimiento reducido, figuras completas y carril sin animación. */
(() => {
  const track = document.querySelector('[data-familias]');
  const controls = document.querySelector('[data-familias-controls]');
  if (!track || !controls) return;
  const cards = [...track.children];
  const prev = controls.querySelector('[data-familias-prev]');
  const next = controls.querySelector('[data-familias-next]');
  const state = controls.querySelector('.familias__estado');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(.4, 0, .2, 1)';
  let frame = 0;

  // Controles bajo el carril, centrados: flecha, un círculo por familia (lleno si se ve), flecha.
  // Sin JavaScript siguen ocultos en la cabecera; el estado textual queda para lectores de pantalla.
  track.after(controls);
  controls.classList.add('familias__controles--pie');
  track.classList.add('familias--pie');
  const dots = document.createElement('span');
  dots.className = 'familias__puntos';
  dots.setAttribute('aria-hidden', 'true');
  const dot = cards.map(() => dots.appendChild(document.createElement('span')));
  controls.insertBefore(dots, next);

  // Posiciones por maquetación, no por rectángulos: el escalonado y el gesto no las alteran.
  const start = card => card.offsetLeft - cards[0].offsetLeft;
  const maximum = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const first = () => cards.reduce((best, card, index) => Math.abs(start(card) - track.scrollLeft) < Math.abs(start(cards[best]) - track.scrollLeft) ? index : best, 0);
  const visibleAt = left => cards.filter(card => start(card) >= left - 2 && start(card) + card.offsetWidth <= left + track.clientWidth + 2);
  function update() {
    frame = 0;
    const visible = visibleAt(track.scrollLeft).map(card => cards.indexOf(card));
    const from = visible[0] ?? first();
    const to = visible.at(-1) ?? from;
    state.textContent = `${String(from + 1).padStart(2, '0')}–${String(to + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= maximum() - 2;
    dot.forEach((d, index) => d.classList.toggle('es-visible', index >= from && index <= to));
    // Si todas caben (escritorio), sobran flechas y círculos.
    controls.hidden = maximum() <= 2;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function go(left, direction = 0) {
    const target = Math.max(0, Math.min(maximum(), left));
    if (!reduced.matches && direction) {
      const arriving = visibleAt(target);
      if (direction < 0) arriving.reverse();
      arriving.forEach((card, index) => card.animate(
        [{transform: `translateX(${direction * 24}px)`}, {transform: 'none'}],
        {duration: 520, delay: index * 60, easing: EASE, fill: 'backwards'}));
    }
    track.scrollTo({left: target, behavior: reduced.matches ? 'instant' : 'smooth'});
  }
  function move(direction) {
    const index = Math.max(0, Math.min(cards.length - 1, first() + direction));
    if (index !== first()) go(start(cards[index]), direction);
  }
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', schedule, {passive: true});
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') go(0, track.scrollLeft > 2 ? -1 : 0);
    else if (event.key === 'End') go(maximum(), track.scrollLeft < maximum() - 2 ? 1 : 0);
    else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  window.addEventListener('resize', schedule, {passive: true});
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(schedule).observe(track);
  document.fonts?.ready.then(schedule);
  update();

  // Figuras: el orden de los trazos en el SVG es el orden del gesto (en Automatización, el ✓ cierra el trazo).
  if (reduced.matches || typeof IntersectionObserver === 'undefined' || !Element.prototype.animate) return;
  const shapes = svg => [...svg.querySelectorAll('rect, path, ellipse, circle')].map(el => ({el, length: Math.ceil(el.getTotalLength()) + 1}));
  function draw(svg, total, wait = 0) {
    const list = shapes(svg);
    const duration = total / 2;
    const step = list.length > 1 ? (total - duration) / (list.length - 1) : 0;
    return Promise.all(list.map(({el, length}, index) => {
      el.style.strokeDasharray = length;
      const animation = el.animate([{strokeDashoffset: length}, {strokeDashoffset: 0}], {duration, delay: wait + index * step, easing: EASE, fill: 'backwards'});
      el.style.strokeDashoffset = '';
      return animation.finished.catch(() => {});
    })).then(() => list.forEach(({el}) => { if (!el.getAnimations().length) el.style.strokeDasharray = ''; }));
  }
  function hide(svg) {
    shapes(svg).forEach(({el, length}) => { el.style.strokeDasharray = length; el.style.strokeDashoffset = length; });
  }

  // Experiencias: las órbitas se inclinan y vuelven; cada satélite da una vuelta completa a la suya.
  const numbers = value => (value || '').match(/-?[\d.]+/g)?.map(Number) || [];
  function orbit(svg, duration) {
    const ellipses = [...svg.querySelectorAll('ellipse')].map(el => {
      const [angle, cx, cy] = numbers(el.getAttribute('transform'));
      return {el, angle, cx, cy, rx: +el.getAttribute('rx'), ry: +el.getAttribute('ry'), original: el.getAttribute('transform')};
    });
    const local = (e, x, y, angle) => {
      const r = -angle * Math.PI / 180, dx = x - e.cx, dy = y - e.cy;
      return [(dx * Math.cos(r) - dy * Math.sin(r)) / e.rx, (dx * Math.sin(r) + dy * Math.cos(r)) / e.ry];
    };
    const satellites = [...svg.querySelectorAll('circle')].filter(c => +c.getAttribute('r') < 16).map(el => {
      const x = +el.getAttribute('cx'), y = +el.getAttribute('cy');
      const fit = ellipses.map(e => { const [u, v] = local(e, x, y, e.angle); return {e, k: Math.hypot(u, v), theta: Math.atan2(v, u)}; })
        .sort((a, b) => Math.abs(a.k - 1) - Math.abs(b.k - 1))[0];
      return {el, x, y, ...fit};
    });
    if (!ellipses.length || !satellites.length) return Promise.resolve();
    return new Promise(resolve => {
      const begin = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - begin) / duration);
        const eased = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const tilt = 8 * Math.sin(Math.PI * eased);
        ellipses.forEach(e => e.el.setAttribute('transform', `rotate(${e.angle + tilt} ${e.cx} ${e.cy})`));
        satellites.forEach(s => {
          const theta = s.theta + 2 * Math.PI * eased, r = (s.e.angle + tilt) * Math.PI / 180;
          const u = s.k * s.e.rx * Math.cos(theta), v = s.k * s.e.ry * Math.sin(theta);
          s.el.setAttribute('cx', (s.e.cx + u * Math.cos(r) - v * Math.sin(r)).toFixed(2));
          s.el.setAttribute('cy', (s.e.cy + u * Math.sin(r) + v * Math.cos(r)).toFixed(2));
        });
        if (t < 1) return requestAnimationFrame(tick);
        ellipses.forEach(e => e.el.setAttribute('transform', e.original));
        satellites.forEach(s => { s.el.setAttribute('cx', s.x); s.el.setAttribute('cy', s.y); });
        resolve();
      }
      requestAnimationFrame(tick);
    });
  }

  // Encargo: al entrar, cada nodo traza su pictograma y la línea avanza hacia el siguiente.
  // Una sola vez; sin JavaScript o con movimiento reducido, recorrido completo y estático.
  const pasos = document.querySelector('[data-pasos]');
  const nodos = pasos ? [...pasos.querySelectorAll('.paso__figura')] : [];
  if (nodos.length) {
    const PASO = 420;
    nodos.forEach((svg, index) => { hide(svg); svg.closest('.paso').style.setProperty('--retraso', `${index * PASO + 520}ms`); });
    pasos.classList.add('pasos--espera');
    const vigia = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      vigia.disconnect();
      pasos.classList.remove('pasos--espera');
      nodos.forEach((svg, index) => draw(svg, 1100, index * PASO));
    }, {threshold: .2});
    vigia.observe(pasos);
    // Al pasar por un paso, el recorrido vuelve a empezar desde él: su pictograma y los que tiene por delante.
    const items = nodos.map(svg => svg.closest('.paso'));
    let ultimo = {desde: -1, hasta: 0};
    function recorrer(desde) {
      if (pasos.classList.contains('pasos--espera')) return;
      if (ultimo.desde === desde && performance.now() < ultimo.hasta) return;
      ultimo = {desde, hasta: performance.now() + (items.length - desde) * PASO + 1100};
      items.slice(desde).forEach((item, k) => {
        const svg = nodos[desde + k];
        shapes(svg).forEach(({el}) => el.getAnimations().forEach(a => a.cancel()));
        item.style.setProperty('--retraso', `${k * PASO + 520}ms`);
        item.classList.add('paso--espera');
      });
      void pasos.offsetWidth;
      items.slice(desde).forEach((item, k) => {
        item.classList.remove('paso--espera');
        draw(nodos[desde + k], 1100, k * PASO);
      });
    }
    items.forEach((item, index) => item.addEventListener('pointerenter', () => recorrer(index)));
  }

  const figures = new Map(cards.map(card => [card, card.querySelector('.familia__figura')]).filter(([, svg]) => svg));
  const shown = new Set();
  const busy = new Set();
  async function play(card, entrance) {
    const svg = figures.get(card);
    if (busy.has(card) || (!entrance && !shown.has(card))) return;
    busy.add(card);
    const orbital = svg.querySelector('ellipse');
    if (entrance) { await draw(svg, 1400); shown.add(card); if (orbital) await orbit(svg, 2200); }
    else if (orbital) await orbit(svg, 1800);
    else await draw(svg, 1000);
    busy.delete(card);
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    play(entry.target, true);
  }), {threshold: .5});
  figures.forEach((svg, card) => {
    hide(svg);
    observer.observe(card);
    card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') play(card, false); });
    card.addEventListener('focusin', () => play(card, false));
  });
})();

/* «Hecho y funcionando»: las cuatro tarjetas entran escalonadas la primera vez que se ven.
   Una sola vez y sin bucles; sin JavaScript o con movimiento reducido quedan visibles y quietas. */
(() => {
  const grid = document.querySelector('#trabajos .trabajos');
  if (!grid || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const top = grid.getBoundingClientRect().top;
  if (top < innerHeight * .9) return; // ya en pantalla al cargar (ancla o recarga): sin entrada
  grid.classList.add('trabajos--espera');
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    observer.disconnect();
    grid.classList.add('trabajos--entra');
    void grid.offsetWidth;
    grid.classList.remove('trabajos--espera');
    // Terminada la entrada, el gesto al pasar responde sin el retraso escalonado.
    setTimeout(() => grid.classList.remove('trabajos--entra'), 900);
  }, {threshold: .25});
  observer.observe(grid);
})();
