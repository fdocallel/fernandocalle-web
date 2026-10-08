// Eight persistent paths: four sectors cut from each real Jost 500 o.
// Pure geometry stays above boot(), so Node can render vector contact sheets.
const ontosMorphGeometry = (() => {
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const round = x => Math.round(x * 1000) / 1000;
  const topology = Object.freeze(Array.from({length: 8}, (_, i) => ({
    source: i < 4 ? 'right' : 'left',
    // Clockwise angles from twelve o'clock. Each O begins as four quarters.
    sourceStart: i < 4 ? -112.5 + i * 90 : 67.5 + (i - 4) * 90,
    // N5: 41° stones centred every 45°, leaving a 4° joint.
    targetStart: i * 45 - 20.5,
  })));
  function radial(values, angle) {
    if (!Array.isArray(values) || values.length < 32) throw Error('Contorno radial Jost inválido');
    const index = (((angle % 360) + 360) % 360) * values.length / 360;
    const a = Math.floor(index);
    return lerp(values[a], values[(a + 1) % values.length], index - a);
  }
  function point(cx, cy, angle, r) {
    const t = angle * Math.PI / 180;
    return [round(cx + Math.sin(t) * r), round(cy - Math.cos(t) * r)];
  }
  function piece(i, p, O, layout) {
    const spec = topology[i], first = layout[spec.source], end = layout.target;
    // Shape the halves while they still have room; then let them meet edge to edge.
    const travel = smooth(p / .94);
    const clay = smooth((p - .015) / .72);
    // Tiny source overlap covers antialias seams; the gap starts opening early.
    const joint = smooth(p / .11);
    const a0 = spec.sourceStart - .8 * (1 - joint);
    const a1 = spec.sourceStart + 90 + .8 * (1 - joint);
    const b0 = spec.targetStart, b1 = b0 + 41;
    // Destino N5: radio exterior 42 y núcleo interior 0,7·R (29,4 en el canon de 100).
    const R = end.r ?? 42;
    const cx = lerp(first.x, end.x, travel), cy = lerp(first.y, end.y, travel);
    function vertex(which, u) {
      const initialAngle = lerp(a0, a1, u);
      const finalAngle = lerp(b0, b1, u);
      const angle = lerp(initialAngle, finalAngle, clay);
      const r = lerp(radial(O[which], initialAngle), which === 'outer' ? R : R * .7, clay);
      return point(cx, cy, angle, r);
    }
    let d = '';
    for (let j = 0; j <= 32; j++) {
      const [x, y] = vertex('outer', j / 32);
      d += `${j ? ' L' : 'M'}${x},${y}`;
    }
    for (let j = 32; j >= 0; j--) {
      const [x, y] = vertex('inner', j / 32);
      d += ` L${x},${y}`;
    }
    return d + ' Z';
  }
  function paths(progress, _small, glyphGeometry, layout) {
    const O = glyphGeometry?.O;
    if (!O?.outer || !O?.inner) throw Error('Falta geometría real de la o Jost');
    if (!layout?.left || !layout?.right || !layout?.target) throw Error('Falta layout');
    return topology.map((_, i) => piece(i, clamp(progress), O, layout));
  }
  function localPaths(progress, small, glyphGeometry) {
    return paths(progress, small, glyphGeometry, {
      left: {x: -78, y: 0}, right: {x: 78, y: 0}, target: {x: 0, y: 0},
    });
  }
  // Destino del símbolo (fundamentos.movimiento.destino). Sin configuración: canon
  // validado el 26-sep (centro del nombre, R 42). ancla 'primera-o' centra sobre la
  // primera o; tamano 'glifo-o' fija el diámetro al lado menor de la caja de la o.
  function target(destino, {os, width, baselineY, glyph}) {
    const o = glyph.glyphs?.o?.bounds;
    const r = destino?.tamano === 'glifo-o' ? Math.min(o.width, o.height) / 2 : 42;
    if (destino?.ancla === 'primera-o') return {x: os[0].x, y: os[0].y, r};
    return {x: width / 2, y: baselineY + glyph.O.cy, r};
  }
  return {topology, paths, localPaths, target, clamp, smooth, lerp};
})();
globalThis.ontosMorphGeometry = ontosMorphGeometry;
if (typeof module !== 'undefined') module.exports = ontosMorphGeometry;

if (typeof document !== 'undefined') globalThis.ontosMotionReady = bootOntosMotion();

async function bootOntosMotion() {
  const navButton = document.querySelector(window.ontosMotionConfig?.nav_selector || '.nav-brand');
  const heroButton = document.querySelector('.hero-brand');
  if (!navButton) return;
  const navIsLink = navButton.tagName.toLowerCase() === 'a';
  const NS = 'http://www.w3.org/2000/svg';
  const {clamp, smooth, lerp, paths, target: destinoDe} = ontosMorphGeometry;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = window.ontosMotionConfig?.duracion_ms || 1200;
  const scrollRange = window.ontosMotionConfig?.scroll || {inicio_px: 80, fin_px: 600};
  const slider = document.querySelector('#progress');
  const output = document.querySelector('#percent');
  const toggle = document.querySelector('#toggle');
  async function loadLogo(name) {
    let markup = window.ontosBrandAssets?.[name];
    if (!markup) {
      const response = await fetch('/app/img/brand/' + name);
      if (!response.ok) throw Error('No se pudo cargar ' + name);
      markup = await response.text();
    }
    const source = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
    if (source.tagName.toLowerCase() !== 'svg' || source.querySelectorAll('path').length !== 8)
      throw Error('El símbolo ' + name + ' no tiene ocho dovelas');
    return source;
  }
  async function loadGlyph() {
    if (window.ontosGlyphGeometry) return window.ontosGlyphGeometry;
    const response = await fetch('/data/marca-movimiento-geometria.json');
    if (!response.ok) throw Error('No se pudo cargar contorno Jost');
    return response.json();
  }
  const [logo, skeleton, glyph] = await Promise.all([
    loadLogo('logo.svg'), loadLogo('logo-esqueleto.svg'), loadGlyph(),
  ]);
  function el(name, attrs = {}) {
    const n = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, value);
    return n;
  }
  function create(button, source) {
    const svg = el('svg', {'aria-hidden': 'true'});
    const host = window.ontosMotionConfig?.host_selector && button.querySelector(window.ontosMotionConfig.host_selector);
    if (host) host.replaceChildren(svg);
    else button.append(svg);
    const positions = glyph.wordmark?.positions;
    if (glyph.wordmark?.text !== 'ontos.' || !Array.isArray(positions) || positions.length !== 6)
      throw Error('Falta espaciado aprobado de ontos.');
    const letters = [], os = [];
    for (const [i, char] of [...'ontos'].entries()) {
      const form = glyph.glyphs[char];
      const x = 18 + positions[i];
      if (char === 'o') {
        os.push({x: x + glyph.O.cx, y: 120 + glyph.O.cy});
      } else {
        const letter = el('path', {
          d: form.path, fill: 'currentColor', transform: `translate(${x} 120)`,
        });
        svg.append(letter);
        letters.push(letter);
      }
    }
    const point = glyph.glyphs['.'].bounds;
    const dotX = 18 + positions[5] + point.x + point.width / 2;
    const dotY = 120 + point.y + point.height / 2;
    const dotRadius = (point.width + point.height) / 4;
    const width = 18 + glyph.wordmark.width + 18;
    const target = destinoDe(window.ontosMotionConfig?.destino, {os, width, baselineY: 120, glyph});
    const scale = target.r / 42;
    const layout = {left: os[0], right: os[1], target};
    // La cabecera recorta solo el margen vacío del escenario; conserva geometría y recorrido.
    const placement = window.ontosMotionConfig?.wordmark_placement;
    // Las demos del manual reciben el eje del canon; el arte y su destino no se desplazan.
    const frameX = placement?.x ?? 0, frameWidth = placement?.width ?? width;
    svg.setAttribute('viewBox', window.ontosMotionConfig?.compact_frame
      ? `${frameX} ${target.y - 46} ${frameWidth} 92` : `${frameX} 0 ${frameWidth} 170`);
    if(placement)svg.setAttribute('data-wordmark-axis',placement.axis);
    const pieces = Array.from({length: 8}, () => {
      const path = el('path', {fill: 'currentColor'});
      svg.append(path);
      return path;
    });
    const spokes = [...source.querySelectorAll('line')].map(line => {
      const copy = line.cloneNode(true);
      copy.setAttribute('transform', `translate(${target.x} ${target.y}) scale(${scale}) translate(-50 -50)`);
      svg.append(copy);
      return copy;
    });
    const dot = el('circle', {r: dotRadius, fill: '#d4713b'});
    svg.append(dot);
    return {render(p) {
      // Destino: el isotipo N5 del manual con radios a cualquier tamaño, también en cabeceras (Fernando, 8-oct-2026).
      // Se retira el modo compacto (esqueleto sin radios y núcleo 16,5 por debajo de 96 px); esa figura queda para el favicon.
      const d = paths(p, false, glyph, layout);
      pieces.forEach((path, i) => path.setAttribute('d', d[i]));
      const fade = 1 - smooth(p / .37);
      letters.forEach(letter => { letter.style.opacity = fade; });
      const move = smooth(p / .88);
      dot.setAttribute('cx', lerp(dotX, target.x, move));
      dot.setAttribute('cy', lerp(dotY, target.y, move));
      dot.setAttribute('r', lerp(dotRadius, 14 * scale, smooth((p - .25) / .72)));
      spokes.forEach((line, i) => {
        line.style.opacity = smooth((p - .53 - i * .015) / .28);
      });
      button.dataset.progress = p.toFixed(3);
    }};
  }
  function controller(brand, onRender = () => {}) {
    let p = 0, target = 0, frame = 0, last = 0;
    function set(v) {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      p = target = clamp(v); brand.render(p); onRender(p);
    }
    function tick(t) {
      const dt = last ? Math.min(t - last, 40) : 16; last = t;
      p += Math.sign(target - p) * Math.min(dt / duration, Math.abs(target - p));
      brand.render(p); onRender(p);
      if (p !== target) frame = requestAnimationFrame(tick);
      else {frame = 0; last = 0;}
    }
    function go(v) {
      target = clamp(v);
      if (reduced.matches) set(target);
      else if (!frame) {last = 0; frame = requestAnimationFrame(tick);}
    }
    return {set, go, refresh() {brand.render(p);}, get progress() {return p;}, get target() {return target;}};
  }
  const demo = heroButton ? controller(create(heroButton, logo), p => {
    slider.value = Math.round(p * 1000);
    output.value = Math.round(p * 100) + ' %';
    toggle.firstChild.textContent = p > .5 ? 'Volver al nombre ' : 'Ver transformación ';
    toggle.setAttribute('aria-pressed', String(p > .5));
    heroButton.setAttribute('aria-pressed', String(p > .5));
  }) : null;
  const nav = controller(create(navButton, logo));
  let hover = false, focus = false, manual = null;
  function navTarget() {
    if (manual !== null) return manual ? 0 : 1;
    if (hover || focus) return 0;
    const progress = clamp((scrollY - scrollRange.inicio_px) / (scrollRange.fin_px - scrollRange.inicio_px));
    return reduced.matches ? (progress >= .5 ? 1 : 0) : progress;
  }
  function navState() {
    const target = navTarget();
    nav.go(target);
    if (!navIsLink) {
      navButton.setAttribute('aria-pressed', target > 0 && target < 1 ? 'mixed' : String(target === 0));
      navButton.setAttribute('aria-label', target > .5 ? 'Mostrar nombre ONTOS' : 'Recoger ONTOS en símbolo');
    }
  }
  window.addEventListener('scroll', () => {
    manual = null; navState();
  }, {passive: true});
  navButton.addEventListener('pointerenter', e => {
    if (e.pointerType === 'mouse') {hover = true; navState();}
  });
  navButton.addEventListener('pointerleave', e => {
    if (e.pointerType === 'mouse') {hover = false; manual = null; navState();}
  });
  navButton.addEventListener('focus', () => {focus = navButton.matches(':focus-visible'); navState();});
  navButton.addEventListener('blur', () => {focus = false; manual = null; navState();});
  if (!navIsLink) navButton.addEventListener('click', () => {manual = nav.target > .5; navState();});
  function toggleDemo() {demo.go(demo.target > .5 ? 0 : 1);}
  if (demo) {
    heroButton.addEventListener('click', toggleDemo);
    toggle.addEventListener('click', toggleDemo);
    slider.addEventListener('input', () => demo.set(+slider.value / 1000));
  }
  window.addEventListener('resize', () => {demo?.refresh(); nav.refresh();});
  reduced.addEventListener('change', () => {
    if (reduced.matches && demo) demo.set(demo.target);
    navState();
  });
  window.motionDemo = demo;
  window.motionNav = nav;
  demo?.set(0); nav.set(navTarget()); navState();
}
