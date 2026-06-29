/* ════════════════════════════════════════════════════════════════
   MARGOUILLAT — petit gecko des murs réunionnais
   Version multi-pages : suit discrètement la lecture, mémorise sa
   position relative d'une page à l'autre et marche avec un cycle de
   pattes alternées inspiré d'une planche de marche en 6 temps.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__GENOME_MARGOUILLAT_ACTIVE__) return;
  window.__GENOME_MARGOUILLAT_ACTIVE__ = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 900) return;

  const sections = Array.from(document.querySelectorAll('section'))
    .filter((section) => section.offsetHeight > 120)
    .filter((section) => section.id !== 'hero');

  const footer = document.querySelector('footer');
  if (!sections.length) return;

  const DARK_TONE = '#2b2b2b';
  const LIGHT_TONE = '#CFE3EA';
  const SPOT_DARK = '#E79B38';
  const SPOT_LIGHT = '#F4B85C';
  const STORAGE_KEY = 'genome-reunion-margouillat';

  const S = 0.56;
  const VBW = 74;
  const VBH = 126;
  const CW = VBW * S;
  const CH = VBH * S;
  const PAD = 72;

  function luminance(rgb) {
    const m = rgb.match(/\d+/g);
    if (!m) return 255;
    return 0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2];
  }

  sections.forEach((section) => {
    let bg = getComputedStyle(section).backgroundColor;
    if (!bg || bg === 'transparent' || bg.includes('rgba(0, 0, 0, 0)')) bg = 'rgb(251,250,247)';
    section._geckoDark = luminance(bg) < 128;
  });

  function zoneTop() {
    return sections[0].offsetTop + PAD;
  }

  function zoneBottom() {
    const footerTop = footer ? footer.offsetTop : document.documentElement.scrollHeight;
    return Math.max(zoneTop() + 200, footerTop - PAD);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function sectionDarkAt(pageY) {
    for (const section of sections) {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (pageY >= top && pageY < bottom) return section._geckoDark;
    }
    return sections[0]._geckoDark;
  }

  function saveState() {
    const top = zoneTop();
    const bottom = zoneBottom();
    const progress = bottom > top ? clamp((y - top) / (bottom - top), 0, 1) : 0;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        progress,
        heading,
        xBias: (x - gutterBase()) / 24,
        ts: Date.now()
      }));
    } catch (_) {}
  }

  function loadState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || Date.now() - saved.ts > 1000 * 60 * 20) return null;
      return saved;
    } catch (_) {
      return null;
    }
  }

  window.addEventListener('pagehide', saveState);
  window.addEventListener('beforeunload', saveState);

  const layer = document.createElement('div');
  layer.className = 'gecko-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:35',
    'pointer-events:none',
    'overflow:visible'
  ].join(';');

  const el = document.createElement('div');
  el.className = 'gecko';
  el.style.cssText = [
    'position:absolute',
    'width:' + CW + 'px',
    'height:' + CH + 'px',
    'left:0',
    'top:0',
    'opacity:0',
    'visibility:hidden',
    'transform-origin:50% 50%',
    'will-change:transform,left,top,opacity,color'
  ].join(';');

  el.innerHTML =
    '<svg width="' + CW + '" height="' + CH + '" viewBox="0 0 ' + VBW + ' ' + VBH + '">' +
      '<g data-tail fill="currentColor" opacity=".92">' +
        '<path d="M36,63 C30,75 29,91 35,103 C40,113 35,123 24,124 C17,125 11,121 11,114 C11,109 15,106 18,108 C15,115 19,119 25,117 C31,115 31,108 27,101 C20,88 23,72 34,60 Z"/>' +
      '</g>' +
      '<g data-legs fill="currentColor">' +
        '<g data-leg="fl">' +
          '<path d="M29,33 C21,31 14,27 10,20 C8,17 8,13 10,10 L13,12 C12,15 12,18 15,21 C19,25 25,27 31,29 Z"/>' +
          '<circle cx="7" cy="7" r="2"/><circle cx="11" cy="6" r="1.8"/><circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="11" r="1.6"/>' +
        '</g>' +
        '<g data-leg="fr">' +
          '<path d="M45,33 C53,31 60,27 64,20 C66,17 66,13 64,10 L61,12 C62,15 62,18 59,21 C55,25 49,27 43,29 Z"/>' +
          '<circle cx="67" cy="7" r="2"/><circle cx="63" cy="6" r="1.8"/><circle cx="68" cy="12" r="1.8"/><circle cx="62" cy="11" r="1.6"/>' +
        '</g>' +
        '<g data-leg="hl">' +
          '<path d="M31,58 C22,60 14,65 10,72 C8,76 9,80 12,82 L14,79 C12,77 12,74 15,71 C19,67 25,64 33,62 Z"/>' +
          '<circle cx="8" cy="85" r="2"/><circle cx="12" cy="87" r="1.8"/><circle cx="5" cy="82" r="1.7"/><circle cx="15" cy="83" r="1.6"/>' +
        '</g>' +
        '<g data-leg="hr">' +
          '<path d="M43,58 C52,60 60,65 64,72 C66,76 65,80 62,82 L60,79 C62,77 62,74 59,71 C55,67 49,64 41,62 Z"/>' +
          '<circle cx="66" cy="85" r="2"/><circle cx="62" cy="87" r="1.8"/><circle cx="69" cy="82" r="1.7"/><circle cx="59" cy="83" r="1.6"/>' +
        '</g>' +
      '</g>' +
      '<g data-body fill="currentColor">' +
        '<path d="M37,7 C43,8 47,14 47,22 C47,27 44,31 42,34 C48,42 49,52 45,62 C42,70 39,75 37,77 C35,75 32,70 29,62 C25,52 26,42 32,34 C30,31 27,27 27,22 C27,14 31,8 37,7 Z"/>' +
        '<path d="M37,4 C42,5 47,9 49,15 C46,13 42,12 37,12 C32,12 28,13 25,15 C27,9 32,5 37,4 Z" opacity=".75"/>' +
      '</g>' +
      '<g data-spots fill="' + SPOT_DARK + '" opacity=".75">' +
        '<circle cx="31" cy="24" r="1.4"/><circle cx="43" cy="24" r="1.4"/>' +
        '<circle cx="32" cy="42" r="1.3"/><circle cx="42" cy="45" r="1.3"/>' +
        '<circle cx="35" cy="55" r="1.2"/><circle cx="40" cy="62" r="1.1"/>' +
        '<circle cx="33" cy="75" r="1.1"/><circle cx="39" cy="88" r="1.1"/>' +
      '</g>' +
      '<g data-eyes>' +
        '<ellipse cx="31" cy="17" rx="3.2" ry="4.3" fill="#F4B85C"/>' +
        '<ellipse cx="43" cy="17" rx="3.2" ry="4.3" fill="#F4B85C"/>' +
        '<ellipse cx="31" cy="17" rx="1.2" ry="3" fill="#111"/>' +
        '<ellipse cx="43" cy="17" rx="1.2" ry="3" fill="#111"/>' +
        '<circle cx="30" cy="15" r=".8" fill="#fff"/><circle cx="42" cy="15" r=".8" fill="#fff"/>' +
      '</g>' +
      '<path d="M34,26 C36,27 38,27 40,26" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1" stroke-linecap="round"/>' +
    '</svg>';

  layer.appendChild(el);
  document.body.appendChild(layer);

  const svg = el.querySelector('svg');
  const body = el.querySelector('[data-body]');
  const tail = el.querySelector('[data-tail]');
  const legs = {
    fl: el.querySelector('[data-leg="fl"]'),
    fr: el.querySelector('[data-leg="fr"]'),
    hl: el.querySelector('[data-leg="hl"]'),
    hr: el.querySelector('[data-leg="hr"]')
  };

  function gutterBase() {
    return 32;
  }

  const saved = loadState();
  const top0 = zoneTop();
  const bottom0 = zoneBottom();
  let x = gutterBase() + (saved ? clamp(saved.xBias || 0, -1, 1) * 16 : 0);
  let y = saved ? top0 + clamp(saved.progress || 0, 0, 1) * (bottom0 - top0) : top0 + 60;
  let heading = Number.isFinite(saved?.heading) ? saved.heading : 180;
  let curDark = null;
  let state = 'frozen';
  let freezeUntil = performance.now() + 550;
  let walk = 0;
  let gait = 0;
  let sprint = null;
  let pushStart = -1;
  let pushDur = 0;

  function startSprint(tx, ty) {
    const dist = Math.hypot(tx - x, ty - y) || 1;
    sprint = {
      x0: x,
      y0: y,
      x1: tx,
      y1: ty,
      t0: performance.now(),
      dur: clamp(dist / rand(360, 560), 0.34, 1.12) * 1000
    };
    heading = ty >= y ? 180 : 0;
    state = 'walking';
  }

  function decide(now) {
    const top = zoneTop();
    const bottom = zoneBottom();
    const desired = clamp(window.scrollY + window.innerHeight * 0.56, top, bottom);
    const dy = desired - y;

    if (Math.abs(dy) > 52) {
      const step = clamp(dy, -230, 230);
      startSprint(gutterBase() + rand(-10, 14), clamp(y + step, top, bottom));
      return;
    }

    if (Math.random() < 0.28) {
      pushStart = now;
      pushDur = 760;
      freezeUntil = now + rand(980, 2100);
      return;
    }

    if (Math.random() < 0.46) {
      startSprint(gutterBase() + rand(-12, 16), clamp(y + rand(-58, 58), top, bottom));
      return;
    }

    freezeUntil = now + rand(900, 2500);
  }

  function applyGait(now, dt, moving) {
    walk += (moving - walk) * clamp(dt * 7, 0, 1);
    gait += dt * (moving ? 8.2 : 1.1);

    const a = Math.sin(gait) * 10 * walk;
    const b = Math.sin(gait + Math.PI) * 10 * walk;
    const lift = Math.abs(Math.sin(gait)) * 2.4 * walk;
    const liftB = Math.abs(Math.sin(gait + Math.PI)) * 2.4 * walk;

    legs.fl.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 29 33) translate(0 ' + (-lift).toFixed(2) + ')');
    legs.hr.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 43 58) translate(0 ' + (-lift).toFixed(2) + ')');
    legs.fr.setAttribute('transform', 'rotate(' + b.toFixed(2) + ' 45 33) translate(0 ' + (-liftB).toFixed(2) + ')');
    legs.hl.setAttribute('transform', 'rotate(' + b.toFixed(2) + ' 31 58) translate(0 ' + (-liftB).toFixed(2) + ')');

    const tailSway = (3 + walk * 8) * Math.sin(gait * 0.56 + 0.6);
    tail.setAttribute('transform', 'rotate(' + tailSway.toFixed(2) + ' 36 63)');

    const bodyLean = walk * 2.1 * Math.sin(gait * 0.5);
    body.setAttribute('transform', 'rotate(' + bodyLean.toFixed(2) + ' 37 43)');
  }

  function frame(now) {
    let dt = (now - lastT) / 1000;
    if (!lastT) dt = 0.016;
    dt = Math.min(dt, 0.05);
    lastT = now;

    if (state === 'walking' && sprint) {
      const t = (now - sprint.t0) / sprint.dur;
      if (t >= 1) {
        x = sprint.x1;
        y = sprint.y1;
        state = 'frozen';
        sprint = null;
        freezeUntil = now + rand(580, 1800);
      } else {
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        x = sprint.x0 + (sprint.x1 - sprint.x0) * e;
        y = sprint.y0 + (sprint.y1 - sprint.y0) * e;
      }
    } else if (now > freezeUntil) {
      decide(now);
    }

    const dark = sectionDarkAt(y);
    if (dark !== curDark) {
      curDark = dark;
      el.style.color = dark ? LIGHT_TONE : DARK_TONE;
      svg.style.setProperty('--spot', dark ? SPOT_LIGHT : SPOT_DARK);
    }

    const moving = state === 'walking' ? 1 : 0;
    applyGait(now, dt, moving);

    let scale = 1;
    if (now < pushStart + pushDur) {
      const p = clamp((now - pushStart) / pushDur, 0, 1);
      scale = 1 + 0.13 * Math.sin(p * Math.PI * 4) * (1 - p);
    }

    const viewY = y - window.scrollY;
    if (viewY > -CH - 100 && viewY < window.innerHeight + 100) {
      el.style.visibility = 'visible';
      el.style.opacity = '1';
      el.style.left = (x - CW / 2).toFixed(2) + 'px';
      el.style.top = (viewY - CH / 2).toFixed(2) + 'px';
      const wiggle = walk * 2.4 * Math.sin(gait * 0.85);
      el.style.transform = 'rotate(' + (heading + wiggle).toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
    } else {
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
    }

    requestAnimationFrame(frame);
  }

  let lastT = 0;
  requestAnimationFrame(frame);
})();
