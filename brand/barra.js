/* ONTOS · barra compartida (web v5, 24-sep-2026). Tres cosas, sin dependencias:

   1 · El logo se contrae al hacer scroll: «ONTOS» se pliega y queda el símbolo; al volver
       arriba se despliega. Patrón de anthropic.com (spec data/_cache/web-estilo-anthropic-
       2026-09-24.md §4) sin Lottie: un centinela de 1 px al final del bloque de cabecera
       de la página y un IntersectionObserver. Cuando el centinela pasa por debajo de la
       barra, <html> lleva .is-condensado y el CSS (brand/tokens.css) pliega la palabra.
       El umbral se adapta solo a la altura de cada cabecera; no hay scrollY mágico.

   2 · Contacto en un <dialog>. El icono de la barra y los botones «Cuéntame tu caso» son
       enlaces normales a contacto.html (sin JS funcionan igual). Con JS, el primer clic trae
       contacto.html y copia SU formulario al diálogo: el formulario vive una sola vez
       (DATO ÚNICO) y el espejo inglés trae el suyo, ya traducido, porque el enlace apunta a
       /en/contacto.html. Si la carga falla, se sigue el enlace. Abrir el diálogo cuenta el
       evento GoatCounter «contacto-popup» (respeta skipgc, como el resto de contadores).

   3 · Dock móvil con contacto y compartir (28-sep-2026), descrito en su bloque.

   4 · Menú móvil (3-oct-2026), descrito en su bloque. */
(() => {
  const d = document, raiz = d.documentElement;
  const barra = d.querySelector('header.barra');
  if (!barra) return;
  const en = raiz.lang === 'en';

  /* ---------- 1 · morph del logo ---------- */
  if ('IntersectionObserver' in window) {
    let centinela = d.getElementById('nav-sentinel');
    if (!centinela) {
      const ancla = d.querySelector('.hero, .cabecera') || d.querySelector('main h1, h1');
      centinela = d.createElement('div');
      centinela.id = 'nav-sentinel';
      centinela.className = 'nav-sentinel';
      centinela.setAttribute('aria-hidden', 'true');
      (ancla || barra).after(centinela);
    }
    const alto = () => Math.round(barra.getBoundingClientRect().height) || 64;
    /* La decisión se toma con la posición REAL del centinela, no con la entrada del observador:
       en WebKit la primera entrada llega a veces calculada antes de que la maqueta se asiente y
       dejaba el logo plegado arriba del todo (medido 24-sep-2026, 1 de cada 3 cargas). El
       observador avisa de los cruces; scroll y load re-comprueban (una vez por frame). */
    const decide = () => raiz.classList.toggle('is-condensado', centinela.getBoundingClientRect().top < alto());
    let pendiente = false;
    const pronto = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(() => { pendiente = false; decide(); }); } };
    new IntersectionObserver(pronto, { rootMargin: `-${alto()}px 0px 0px 0px`, threshold: 0 }).observe(centinela);
    addEventListener('scroll', pronto, { passive: true });
    addEventListener('load', pronto);
    addEventListener('resize', pronto);
  }

  /* ---------- 3 · dock móvil (28-sep-2026) ----------
     En móvil la llamada a la acción se queda arriba o al final. El dock es una fila fija
     abajo con «Cuéntame tu caso» (abre el mismo diálogo: se crea antes de recoger los
     disparadores) y «Compartir» (Web Share; sin soporte, no aparece). Solo en páginas
     indexables con barra, nunca en contacto. Aparece con el logo plegado y se retira
     mientras hay a la vista otra llamada a contacto, un formulario o el pie: nunca dos
     botones iguales en pantalla. El CSS (brand/tokens.css) lo limita a ≤ 34rem. */
  const iconoContacto = barra.querySelector('a.icono-contacto[data-contacto]');
  const indexable = !/noindex/i.test(d.querySelector('meta[name="robots"]')?.content || '');
  if (iconoContacto && indexable && !d.querySelector('#formulario form')) {
    const dock = d.createElement('div');
    dock.className = 'dock-movil';
    const cta = d.createElement('a');
    cta.className = 'cta dock-cta';
    cta.href = iconoContacto.href;
    cta.dataset.contacto = '';
    cta.textContent = en ? 'Tell me about your case' : 'Cuéntame tu caso';
    dock.append(cta);
    if (navigator.share) {
      const comp = d.createElement('button');
      comp.type = 'button';
      comp.className = 'dock-compartir';
      comp.setAttribute('aria-label', en ? 'Share this page' : 'Compartir esta página');
      comp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>';
      comp.addEventListener('click', () => {
        const canon = d.querySelector('link[rel="canonical"]')?.href || location.href;
        navigator.share({ title: d.title, url: canon }).then(() => {
          try { window.goatcounter?.count?.({ path: 'compartir', title: 'Compartir (dock móvil)', event: true }); } catch (e) {}
        }, () => {});
      });
      dock.append(comp);
    }
    d.body.append(dock);
    const tapan = new Set();
    const pinta = () => raiz.classList.toggle('dock-activo', raiz.classList.contains('is-condensado') && !tapan.size);
    if ('IntersectionObserver' in window) {
      const vigia = new IntersectionObserver(es => {
        es.forEach(e => e.isIntersecting ? tapan.add(e.target) : tapan.delete(e.target));
        pinta();
      });
      d.querySelectorAll('main a[data-contacto], a.cta[data-contacto], form, footer')
        .forEach(el => { if (!dock.contains(el) && !barra.contains(el)) vigia.observe(el); });
      new MutationObserver(pinta).observe(raiz, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ---------- 4 · menú móvil (3-oct-2026) ----------
     Fernando: la cabecera móvil ocupaba mucho y las secciones son «más para clicar que para
     mostrar». En ≤ 34rem queda una fila (marca, contacto, idioma y este botón); Aplicaciones y
     Sobre mí se despliegan debajo al pulsarlo. Sin JS, la barra de dos filas de siempre.
     Se cierra con Escape, al tocar fuera y al elegir un enlace. El CSS vive en brand/marca-es.css. */
  const nav = barra.querySelector('nav');
  const secciones = nav ? [...nav.querySelectorAll('a.item:not(.idioma):not(.icono-contacto)')] : [];
  if (secciones.length) {
    const boton = d.createElement('button');
    boton.type = 'button';
    boton.className = 'barra-menu';
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', en ? 'Menu' : 'Menú');
    boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    nav.append(boton);
    raiz.classList.add('barra-menu-js');
    const pon = abierto => {
      barra.classList.toggle('menu-abierto', abierto);
      boton.setAttribute('aria-expanded', String(abierto));
    };
    boton.addEventListener('click', () => pon(!barra.classList.contains('menu-abierto')));
    secciones.forEach(a => a.addEventListener('click', () => pon(false)));
    d.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && barra.classList.contains('menu-abierto')) { pon(false); boton.focus(); }
    });
    d.addEventListener('click', ev => { if (!barra.contains(ev.target)) pon(false); });
  }

  /* ---------- 2 · contacto en diálogo ---------- */
  const disparadores = [...d.querySelectorAll('a[data-contacto]')];
  if (!disparadores.length || !('HTMLDialogElement' in window)) return;

  // En la propia página de contacto no hay diálogo: el icono lleva al primer campo.
  const formPropio = d.querySelector('#formulario form');
  if (formPropio) {
    disparadores.forEach(a => a.addEventListener('click', ev => {
      ev.preventDefault();
      const f = formPropio.querySelector('#f-nombre');
      formPropio.scrollIntoView({ block: 'start' });
      if (f) f.focus({ preventScroll: true });
    }));
    return;
  }

  let dlg = null, cargando = null, origen = null;

  const contar = () => {
    try {
      if (window.goatcounter && typeof goatcounter.count === 'function')
        goatcounter.count({ path: 'contacto-popup', title: 'Contacto (pop-up)', event: true });
    } catch (e) { /* la analítica nunca rompe el formulario */ }
  };

  const construir = (html) => {
    const fuente = new DOMParser().parseFromString(html, 'text/html');
    const form = fuente.querySelector('#formulario form');
    if (!form) throw new Error('contacto.html sin #formulario form');
    const titulo = fuente.querySelector('.hero h1');
    const lema = fuente.querySelector('.hero .lema');
    const alt = fuente.querySelector('.alt-mail');

    const caja = d.createElement('dialog');
    caja.id = 'dlg-contacto';
    caja.className = 'dlg-contacto';
    caja.setAttribute('aria-labelledby', 'dlg-contacto-titulo');
    const cuerpo = d.createElement('div');
    cuerpo.className = 'dlg-cuerpo';

    const cerrar = d.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'dlg-cerrar';
    cerrar.setAttribute('aria-label', en ? 'Close' : 'Cerrar');
    cerrar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    cerrar.addEventListener('click', () => caja.close());

    const h = d.createElement('h2');
    h.id = 'dlg-contacto-titulo';
    h.textContent = titulo ? titulo.textContent.trim() : (en ? 'Contact' : 'Contacto');
    cuerpo.append(cerrar, h);
    if (lema) { const p = d.createElement('p'); p.className = 'dlg-lema'; p.textContent = lema.textContent.replace(/\s+/g, ' ').trim(); cuerpo.append(p); }
    cuerpo.append(d.importNode(form, true));
    if (alt) cuerpo.append(d.importNode(alt, true));
    caja.append(cuerpo);

    // copiar la dirección (mismo comportamiento que contacto.html)
    caja.querySelectorAll('[data-copiar]').forEach(b => b.addEventListener('click', () => {
      const hecho = () => { const t = b.textContent; b.textContent = en ? 'copied ✓' : 'copiado ✓'; setTimeout(() => { b.textContent = t; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copiar).then(hecho, () => {});
    }));
    // clic en el fondo (fuera de la caja) cierra; Esc lo cierra el navegador
    caja.addEventListener('click', ev => { if (ev.target === caja) caja.close(); });
    // al cerrar, el foco vuelve a quien abrió
    caja.addEventListener('close', () => { if (origen && origen.isConnected) origen.focus(); });
    d.body.append(caja);
    disparadores.forEach(a => a.setAttribute('aria-controls', 'dlg-contacto'));
    return caja;
  };

  const preparar = (href) => {
    if (dlg) return Promise.resolve(dlg);
    if (!cargando) {
      cargando = fetch(href, { credentials: 'same-origin' })
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(t => (dlg = construir(t)))
        .catch(e => { cargando = null; throw e; });
    }
    return cargando;
  };

  const abrir = (a) => {
    origen = a;
    preparar(a.href).then(caja => {
      if (caja.open) return;
      caja.showModal();
      const primero = caja.querySelector('#f-nombre') ||
        caja.querySelector('input:not([type=hidden]):not([name=_honey]), select, textarea');
      if (primero) primero.focus();
      contar();
    }).catch(() => { location.href = a.href; });
  };

  disparadores.forEach(a => {
    a.setAttribute('aria-haspopup', 'dialog');
    a.addEventListener('click', ev => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button > 0) return; // abrir en pestaña nueva: el enlace de siempre
      ev.preventDefault();
      abrir(a);
    });
    // precarga al acercarse: el diálogo abre sin espera
    const pre = () => preparar(a.href).catch(() => {});
    a.addEventListener('pointerenter', pre, { once: true });
    a.addEventListener('focus', pre, { once: true });
    a.addEventListener('touchstart', pre, { once: true, passive: true });
  });
})();
