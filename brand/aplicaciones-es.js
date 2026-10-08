/* Aplicaciones (3-oct-2026): entrada escalonada por familia y un diálogo para vídeo, ventana y clip.
   Sin JavaScript todo funciona: el índice son anclas, cada tarjeta es un enlace (el vídeo, al .mp4;
   la ventana, a su página) y cada miniatura de clip, un enlace a la página del clip.
   Modo de cada acción: data-modo del enlace, desde el canon (catalogo_piezas[id].accion.modo). */
(() => {
  'use strict';

  /* Entrada: las piezas de cada familia suben una tras otra la primera vez que se ven.
     Una sola vez; con movimiento reducido o sin IntersectionObserver, quietas. */
  const baldas = [...document.querySelectorAll('#trabajos .balda')];
  if (baldas.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const balda = entry.target;
        observer.unobserve(balda);
        balda.classList.add('balda--entra');
        void balda.offsetWidth;
        balda.classList.remove('balda--espera');
        // Terminada la entrada, el gesto al pasar responde sin el retraso escalonado.
        setTimeout(() => balda.classList.remove('balda--entra'), 900);
      }
    }, { threshold: .2 });
    for (const balda of baldas) {
      // Ya en pantalla al cargar (ancla o recarga): sin entrada.
      if (balda.getBoundingClientRect().top < innerHeight * .9) continue;
      balda.classList.add('balda--espera');
      observer.observe(balda);
    }
  }

  /* Diálogo. El href del propio enlace manda (en /en/ ya apunta a la versión inglesa):
     - video: <video> con controles; data-poster es relativo al vídeo; data-proporcion, ancho/alto.
     - ventana: la página en un <iframe>.
     - clip: la página del clip en un <iframe>, con ?autoplay=1. */
  const dialog = document.querySelector('dialog.dlg');
  const links = [...document.querySelectorAll('a[data-modo="video"], a[data-modo="ventana"], a[data-modo="clip"]')];
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return;

  const screen = dialog.querySelector('.dlg__pantalla');
  const title = dialog.querySelector('.dlg__titulo');
  const close = dialog.querySelector('.dlg__cerrar');
  let opener = null;

  function nameOf(link) {
    const article = link.closest('article');
    return (link.querySelector('.clip__titulo') || article?.querySelector('h3') || link).textContent.trim();
  }

  function open(link) {
    const mode = link.dataset.modo;
    const name = nameOf(link);
    const url = new URL(link.href, location.href);
    let media;
    if (mode === 'video') {
      media = document.createElement('video');
      media.controls = true;
      media.playsInline = true;
      media.preload = 'none';
      if (link.dataset.poster) media.poster = new URL(link.dataset.poster, url).href;
      media.src = url.href;
    } else {
      if (mode === 'clip') url.searchParams.set('autoplay', '1');
      media = document.createElement('iframe');
      media.setAttribute('allow', 'fullscreen');
      // Ventana con ancla (armario.html#demo): solo esa parte, sin la barra ni el resto de la página.
      // Solo si es del mismo origen; si no, se ve la página entera en su ancla.
      if (mode === 'ventana' && url.hash) {
        const frame = media;
        frame.addEventListener('load', () => {
          try {
            const doc = frame.contentDocument;
            const target = doc?.getElementById(decodeURIComponent(url.hash.slice(1)));
            if (!target) return;
            const style = doc.createElement('style');
            style.textContent = 'header.barra,.skip-link,footer,main>*:not(#' + CSS.escape(target.id) + '){display:none!important}'
              + 'main{padding-block:1.5rem!important}#' + CSS.escape(target.id) + '{border-top:0!important;padding-top:0!important;margin-top:0!important}';
            doc.head.append(style);
            frame.contentWindow.scrollTo(0, 0);
            // La ventana, a la altura del probador (sin pasar de la pantalla).
            const max = getComputedStyle(screen).height;
            const ajusta = () => {
              const alto = Math.ceil(doc.querySelector('main')?.getBoundingClientRect().bottom || 0);
              if (alto > 0) screen.style.height = 'min(' + alto + 'px, ' + max + ')';
            };
            ajusta();
            setTimeout(ajusta, 600);
          } catch { /* otro origen */ }
        });
      }
      media.src = url.href;
    }
    media.title = name;
    screen.style.removeProperty('height');
    screen.replaceChildren(media);
    dialog.className = 'dlg dlg--' + mode;
    dialog.style.setProperty('--ar', link.dataset.proporcion || '16 / 9');
    dialog.setAttribute('aria-label', name);
    title.textContent = name;
    opener = link;
    dialog.showModal();
    close.focus();
    if (mode === 'video') media.play().catch(() => {});
  }

  for (const link of links) {
    link.addEventListener('click', event => {
      // Con modificador (nueva pestaña, etc.) o clic no principal: el navegador decide.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link);
    });
  }

  close.addEventListener('click', () => dialog.close());
  // Clic fuera: el fondo (::backdrop) cuenta como clic en el propio <dialog>.
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    // Parar y vaciar: el vídeo vuelve al principio y el iframe se descarga.
    const media = screen.firstElementChild;
    if (media instanceof HTMLVideoElement) {
      media.pause();
      media.currentTime = 0;
      media.removeAttribute('src');
      media.load();
    }
    screen.replaceChildren();
    screen.style.removeProperty('height');
    if (opener) opener.focus({ preventScroll: true });
    opener = null;
  });
})();
