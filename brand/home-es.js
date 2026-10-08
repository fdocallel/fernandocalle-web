/* Expansión acotada del panel de portada. Sin JavaScript conserva el margen inicial. */
(() => {
  const feature = document.querySelector('[data-home-feature]');
  if (!feature) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  let expansionDistance = 1;
  let initialLeft = 0;
  let initialRight = 0;

  function measure() {
    feature.style.removeProperty('--home-left');
    feature.style.removeProperty('--home-right');
    const style = window.getComputedStyle(feature);
    initialLeft = parseFloat(style.marginLeft) || 0;
    initialRight = parseFloat(style.marginRight) || 0;
    const top = feature.getBoundingClientRect().top + window.scrollY;
    const header = document.querySelector('.barra');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    expansionDistance = Math.max(1, top - headerHeight);
    update();
  }

  function update() {
    pending = false;
    if (reducedMotion.matches) {
      feature.style.removeProperty('--home-left');
      feature.style.removeProperty('--home-right');
      feature.style.removeProperty('--home-radius');
      feature.style.removeProperty('--home-drift');
      return;
    }

    const progress = Math.min(1, Math.max(0, window.scrollY / expansionDistance));
    feature.style.setProperty('--home-left', `${(initialLeft * (1 - progress)).toFixed(2)}px`);
    feature.style.setProperty('--home-right', `${(initialRight * (1 - progress)).toFixed(2)}px`);
    feature.style.setProperty('--home-radius', `${(12 * (1 - progress)).toFixed(2)}px`);
    feature.style.setProperty('--home-drift', `${(22 * progress).toFixed(2)}px`);
  }

  function schedule() {
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  reducedMotion.addEventListener('change', schedule);
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
})();
