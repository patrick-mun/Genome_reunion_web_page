/* Margouillat — marche synchronisée par sprite-sheet.
   Correction : dimensions explicites du cadre de frame pour éviter le margouillat coupé. */
(function () {
  'use strict';

  if (window.__GENOME_MARGOUILLAT_ACTIVE__) return;
  window.__GENOME_MARGOUILLAT_ACTIVE__ = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 900) return;

  const cfg = {
    url: 'assets/margouillat_walk_sprite_160.png?v=5',
    frames: 8,
    ratio: 1.5,
    minDelay: 5500,
    maxDelay: 17000,
    frameMs: [320, 260, 260, 300, 340, 260, 260, 360],
    minW: 125,
    maxW: 185,
    minStep: 9,
    maxStep: 14,
    opacity: 0.26,
    zLayer: 4,
    zContent: 5,
    fade: 700
  };

  const hero = document.getElementById('hero');
  const sections = Array.from(document.querySelectorAll('section'))
    .filter(s => s.offsetHeight > 180)
    .filter(s => s.id !== 'hero')
    .filter(s => !hero || !hero.contains(s));

  if (!sections.length) return;

  document.querySelectorAll('.gecko-layer, .gecko, .gr-margouillat-layer').forEach(e => e.remove());

  const style = document.createElement('style');
  style.textContent =
    '.gr-margouillat-layer{position:fixed;inset:0;z-index:' + cfg.zLayer + ';pointer-events:none;overflow:hidden;contain:layout paint style}' +
    '.gr-margouillat{position:absolute;left:-9999px;top:-9999px;width:150px;height:225px;overflow:hidden;opacity:0;visibility:hidden;transform-origin:50% 50%;will-change:left,top,transform,opacity;transition:opacity ' + cfg.fade + 'ms ease;filter:drop-shadow(0 0 8px rgba(255,255,255,.12));mix-blend-mode:screen}' +
    '.gr-margouillat-sprite{position:absolute;inset:0;width:100%;height:100%;background-image:url("' + cfg.url + '");background-repeat:no-repeat;background-position:0 0;background-size:800% 100%}' +
    '@media (prefers-reduced-motion:reduce){.gr-margouillat-layer{display:none!important}}';
  document.head.appendChild(style);

  sections.forEach(section => {
    if (getComputedStyle(section).position === 'static') section.style.position = 'relative';
    Array.from(section.children).forEach(child => {
      if (child.classList.contains('gr-margouillat-layer')) return;
      if (getComputedStyle(child).position === 'static') child.style.position = 'relative';
      if (!child.style.zIndex) child.style.zIndex = String(cfg.zContent);
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
    timer = window.setTimeout(spawn, delay || rand(cfg.minDelay, cfg.maxDelay));
  }

  function setFrame(frame, w, h) {
    sprite.style.backgroundSize = (w * cfg.frames) + 'px ' + h + 'px';
    sprite.style.backgroundPosition = (-frame * w) + 'px 0px';
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
    }, cfg.fade + 80);
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

    const r = candidates[Math.floor(Math.random() * candidates.length)].getBoundingClientRect();
    const w = Math.round(rand(cfg.minW, cfg.maxW));
    const h = Math.round(w * cfg.ratio);
    const dir = Math.random() > 0.5 ? 1 : -1;
    const margin = w * 1.05;
    const startX = dir === 1 ? r.left - margin : r.right + margin;
    const endX = dir === 1 ? r.right + margin : r.left - margin;
    const dx = endX - startX;
    const steps = Math.max(38, Math.min(88, Math.round(Math.abs(dx) / rand(cfg.minStep, cfg.maxStep))));
    const baseY = rand(r.top + h * 0.65, r.bottom - h * 0.65);
    const drift = rand(-Math.min(80, r.height * 0.12), Math.min(80, r.height * 0.12));
    const baseRot = dir === 1 ? 90 : -90;

    active = true;
    walker.style.width = w + 'px';
    walker.style.height = h + 'px';
    walker.style.visibility = 'visible';
    walker.style.opacity = '0';

    let step = 0;
    let frame = 0;

    function place() {
      const p = step / steps;
      const x = startX + dx * p;
      const y = baseY + Math.sin(p * Math.PI) * drift;
      const wiggle = Math.sin(frame / cfg.frames * Math.PI * 2) * 1.6;

      setFrame(frame, w, h);
      walker.style.left = x.toFixed(1) + 'px';
      walker.style.top = y.toFixed(1) + 'px';
      walker.style.transform = 'translate(-50%, -50%) rotate(' + (baseRot + wiggle).toFixed(2) + 'deg)';

      if (step === 1) walker.style.opacity = String(cfg.opacity);
      if (step > steps - 8) walker.style.opacity = '0';

      step += 1;
      frame = (frame + 1) % cfg.frames;

      if (step > steps) {
        hide();
        schedule();
        return;
      }
      frameTimer = window.setTimeout(place, cfg.frameMs[frame] || 300);
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
