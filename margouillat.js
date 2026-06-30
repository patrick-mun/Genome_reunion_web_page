/* ════════════════════════════════════════════════════════════════
   MARGOUILLAT — animation sprite filaire
   Remplace l’ancienne animation SVG du margouillat.
   Principe : GIF transparent en 8 poses + déplacement par petits pas.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__GENOME_MARGOUILLAT_ACTIVE__) return;
  window.__GENOME_MARGOUILLAT_ACTIVE__ = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 900) return;

  const SPRITE_SRC = 'data:image/gif;base64,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';

  const CONFIG = {
    minDelay: 5000,
    maxDelay: 16000,
    minStepMs: 270,
    maxStepMs: 360,
    minWidth: 95,
    maxWidth: 150,
    opacity: 0.18,
    zIndex: 4,
    contentZIndex: 5
  };

  const hero = document.getElementById('hero');
  const sections = Array.from(document.querySelectorAll('section'))
    .filter(section => section.offsetHeight > 160)
    .filter(section => section.id !== 'hero')
    .filter(section => !hero || !hero.contains(section));

  if (!sections.length) return;

  document.querySelectorAll('.gecko-layer, .gecko, .gr-margouillat-layer').forEach(el => el.remove());

  const style = document.createElement('style');
  style.textContent = `
    .gr-margouillat-layer {
      position: fixed;
      inset: 0;
      z-index: ${CONFIG.zIndex};
      pointer-events: none;
      overflow: hidden;
      contain: layout paint style;
    }
    .gr-margouillat {
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 120px;
      height: auto;
      opacity: 0;
      visibility: hidden;
      transform-origin: 50% 50%;
      will-change: left, top, transform, opacity;
      transition: opacity 700ms ease;
      filter: drop-shadow(0 0 8px rgba(255,255,255,.08));
      mix-blend-mode: screen;
    }
    .gr-margouillat img {
      display: block;
      width: 100%;
      height: auto;
      user-select: none;
      -webkit-user-drag: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .gr-margouillat-layer { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  sections.forEach(section => {
    const sectionStyle = getComputedStyle(section);
    if (sectionStyle.position === 'static') section.style.position = 'relative';

    Array.from(section.children).forEach(child => {
      if (child.classList.contains('gr-margouillat-layer')) return;
      const childStyle = getComputedStyle(child);
      if (childStyle.position === 'static') child.style.position = 'relative';
      if (!child.style.zIndex) child.style.zIndex = String(CONFIG.contentZIndex);
    });
  });

  const layer = document.createElement('div');
  layer.className = 'gr-margouillat-layer';
  layer.setAttribute('aria-hidden', 'true');

  const walker = document.createElement('div');
  walker.className = 'gr-margouillat';

  const img = document.createElement('img');
  img.src = SPRITE_SRC;
  img.alt = '';
  img.draggable = false;

  walker.appendChild(img);
  layer.appendChild(walker);
  document.body.appendChild(layer);

  let timer = null;
  let stepTimer = null;
  let active = false;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function visibleSections() {
    return sections.filter(section => {
      const r = section.getBoundingClientRect();
      return r.bottom > 120 && r.top < window.innerHeight - 120 && r.width > 260 && r.height > 260;
    });
  }

  function schedule(delay) {
    window.clearTimeout(timer);
    timer = window.setTimeout(spawn, delay ?? rand(CONFIG.minDelay, CONFIG.maxDelay));
  }

  function hide() {
    active = false;
    window.clearInterval(stepTimer);
    walker.style.opacity = '0';
    window.setTimeout(() => {
      if (active) return;
      walker.style.visibility = 'hidden';
      walker.style.left = '-9999px';
      walker.style.top = '-9999px';
    }, 750);
  }

  function spawn() {
    if (document.hidden || active) {
      schedule(2500);
      return;
    }

    const candidates = visibleSections();
    if (!candidates.length) {
      schedule(3000);
      return;
    }

    const section = candidates[Math.floor(Math.random() * candidates.length)];
    const r = section.getBoundingClientRect();
    const width = Math.round(rand(CONFIG.minWidth, CONFIG.maxWidth));
    const height = width * 1.5;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const margin = width * 0.75;

    const startX = direction === 1 ? r.left - margin : r.right + margin;
    const endX = direction === 1 ? r.right + margin : r.left - margin;
    const baseY = rand(r.top + height * 0.55, r.bottom - height * 0.55);
    const drift = rand(-Math.min(90, r.height * 0.14), Math.min(90, r.height * 0.14));
    const dx = endX - startX;
    const distance = Math.abs(dx);
    const steps = Math.max(34, Math.min(76, Math.round(distance / rand(7, 10))));
    const stepMs = rand(CONFIG.minStepMs, CONFIG.maxStepMs);
    const angle = direction === 1 ? 90 : -90;

    active = true;
    walker.style.width = width + 'px';
    walker.style.visibility = 'visible';
    walker.style.opacity = '0';

    let i = 0;

    function place() {
      const p = i / steps;
      const x = startX + dx * p;
      const y = baseY + Math.sin(p * Math.PI) * drift;
      const wiggle = Math.sin(p * Math.PI * 8) * 2.2;

      walker.style.left = x.toFixed(1) + 'px';
      walker.style.top = y.toFixed(1) + 'px';
      walker.style.transform = 'translate(-50%, -50%) rotate(' + (angle + wiggle).toFixed(2) + 'deg)';

      if (i === 1) walker.style.opacity = String(CONFIG.opacity);
      if (i > steps - 6) walker.style.opacity = '0';

      i += 1;
      if (i > steps) {
        hide();
        schedule();
      }
    }

    place();
    stepTimer = window.setInterval(place, stepMs);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(timer);
      hide();
    } else {
      schedule(2000);
    }
  });

  window.addEventListener('pagehide', () => {
    window.clearTimeout(timer);
    window.clearInterval(stepTimer);
  });

  schedule(2500);
})();
