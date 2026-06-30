/* ════════════════════════════════════════════════════════════════
   MARGOUILLAT — marche synchronisée par sprite-sheet
   Remplace l’ancien SVG et le GIF autonome.
   Principe : 8 poses PNG transparentes contrôlées par JS.
   Chaque pose correspond à un micro-déplacement, pour éviter l’effet glisse.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__GENOME_MARGOUILLAT_ACTIVE__) return;
  window.__GENOME_MARGOUILLAT_ACTIVE__ = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 900) return;

  const CONFIG = {
    spriteUrl: 'assets/margouillat_walk_sprite_160.png?v=3',
    frameCount: 8,
    frameRatio: 1.5,
    minDelay: 5500,
    maxDelay: 17000,
    frameDurations: [320, 260, 260, 300, 340, 260, 260, 360],
    minWidth: 115,
    maxWidth: 175,
    minStepPx: 9,
    maxStepPx: 14,
    opacity: 0.24,
    zIndex: 4,
    contentZIndex: 5,
    fadeMs: 700
  };

  const hero = document.getElementById('hero');
  const sections = Array.from(document.querySelectorAll('section'))
    .filter(section => section.offsetHeight > 180)
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
      width: 140px;
      aspect-ratio: 2 / 3;
      opacity: 0;
      visibility: hidden;
      transform-origin: 50% 50%;
      will-change: left, top, transform, opacity;
      transition: opacity ${CONFIG.fadeMs}ms ease;
      filter: drop-shadow(0 0 8px rgba(255,255,255,.10));
      mix-blend-mode: screen;
    }

    .gr-margouillat-sprite {
      width: 100%;
      height: 100%;
      background-image: url('${CONFIG.spriteUrl}');
      background-repeat: no-repeat;
      background-position: 0 0;
      background-size: 800% 100%;
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

  const sprite = document.createElement('div');
  sprite.className = 'gr-margouillat-sprite';

  walker.appendChild(sprite);
  layer.appendChild(walker);
  document.body.appendChild(layer);

  let timer = null;
  let frameTimer = null;
  let active = false;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function visibleSections() {
    return sections.filter(section => {
      const r = section.getBoundingClientRect();
      return r.bottom > 120 && r.top < window.innerHeight - 120 && r.width > 260 && r.height > 280;
    });
  }

  function schedule(delay) {
    window.clearTimeout(timer);
    timer = window.setTimeout(spawn, delay ?? rand(CONFIG.minDelay, CONFIG.maxDelay));
  }

  function setFrame(frame, width, height) {
    sprite.style.backgroundSize = `${width * CONFIG.frameCount}px ${height}px`;
    sprite.style.backgroundPosition = `${-frame * width}px 0px`;
  }

  function hide() {
    active = false;
    window.clearTimeout(frameTimer);
    walker.style.opacity = '0';
    window.setTimeout(() => {
      if (active) return;
      walker.style.visibility = 'hidden';
      walker.style.left = '-9999px';
      walker.style.top = '-9999px';
    }, CONFIG.fadeMs + 80);
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
    const height = Math.round(width * CONFIG.frameRatio);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const margin = width * 0.95;

    const startX = direction === 1 ? r.left - margin : r.right + margin;
    const endX = direction === 1 ? r.right + margin : r.left - margin;
    const totalDistance = Math.abs(endX - startX);
    const stepPx = rand(CONFIG.minStepPx, CONFIG.maxStepPx);
    const steps = Math.max(38, Math.min(88, Math.round(totalDistance / stepPx)));

    const baseY = rand(r.top + height * 0.62, r.bottom - height * 0.62);
    const drift = rand(-Math.min(80, r.height * 0.12), Math.min(80, r.height * 0.12));
    const rotationBase = direction === 1 ? 90 : -90;
    const dx = endX - startX;

    active = true;
    walker.style.width = width + 'px';
    walker.style.visibility = 'visible';
    walker.style.opacity = '0';

    let step = 0;
    let frame = 0;

    function place() {
      const p = step / steps;
      const x = startX + dx * p;
      const y = baseY + Math.sin(p * Math.PI) * drift;
      const bodyWiggle = Math.sin(frame / CONFIG.frameCount * Math.PI * 2) * 1.6;

      setFrame(frame, width, height);
      walker.style.left = x.toFixed(1) + 'px';
      walker.style.top = y.toFixed(1) + 'px';
      walker.style.transform = `translate(-50%, -50%) rotate(${(rotationBase + bodyWiggle).toFixed(2)}deg)`;

      if (step === 1) walker.style.opacity = String(CONFIG.opacity);
      if (step > steps - 8) walker.style.opacity = '0';

      step += 1;
      frame = (frame + 1) % CONFIG.frameCount;

      if (step > steps) {
        hide();
        schedule();
        return;
      }

      frameTimer = window.setTimeout(place, CONFIG.frameDurations[frame] || 300);
    }

    place();
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
    window.clearTimeout(frameTimer);
  });

  schedule(2200);
})();
