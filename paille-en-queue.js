/* Paille-en-queue du hero : vol courbe + pose uniquement sur le titre principal. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 760) return;

  const hero = document.getElementById('hero');
  const title = document.getElementById('hero-title');
  if (!hero || !title) return;

  const NUM_BIRDS = 3;
  const VBW = 72;
  const VBH = 82;
  const FOOT_X = 36;
  const FOOT_Y = 47;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const rand = (min, max) => min + Math.random() * (max - min);

  const letters = [];

  function wrapLetters(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const ch of child.textContent) {
          if (ch.trim() === '') {
            frag.appendChild(document.createTextNode(ch));
          } else {
            const span = document.createElement('span');
            span.className = 'bird-letter';
            span.textContent = ch;
            frag.appendChild(span);
            letters.push(span);
          }
        }
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        wrapLetters(child);
      }
    });
  }

  if (!title.querySelector('.bird-letter')) {
    wrapLetters(title);
  } else {
    letters.push(...title.querySelectorAll(':scope .bird-letter'));
  }

  if (!letters.length) return;

  document.querySelectorAll('.bird-layer').forEach((oldLayer) => oldLayer.remove());

  const noShadowStyle = document.createElement('style');
  noShadowStyle.textContent = `
    .bird-layer .paille,
    .bird-layer .paille svg {
      filter: none !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }
    .bird-layer .paille-body,
    .bird-layer .paille-wings path {
      stroke: none !important;
    }
  `;
  document.head.appendChild(noShadowStyle);

  const layer = document.createElement('div');
  layer.className = 'bird-layer';
  layer.setAttribute('aria-hidden', 'true');
  hero.appendChild(layer);

  function birdSVG() {
    return '<svg viewBox="0 0 72 82">' +
      '<g class="paille-tail" data-tail>' +
        '<path d="M35.2,43 C34.6,55 33.6,68 32.6,80" />' +
        '<path d="M36.8,43 C37.4,55 38.4,68 39.4,80" />' +
      '</g>' +
      '<g class="paille-wings" data-wings>' +
        '<path style="stroke:none" d="M34,18 C25,12 10,16 2,35 C13,31 25,28 34,26 Z" />' +
        '<path style="stroke:none" d="M38,18 C47,12 62,16 70,35 C59,31 47,28 38,26 Z" />' +
      '</g>' +
      '<path class="paille-body" style="stroke:none" d="M36,4 C40,12 40.8,26 38.4,41 C37.4,48 34.6,48 33.6,41 C31.2,26 32,12 36,4 Z" />' +
      '<path d="M36,2 L41,8 L36.8,7 Z" fill="#E8654A" opacity=".95" />' +
      '<circle cx="37.6" cy="9.5" r=".9" fill="#0F3A56" opacity=".55" />' +
      '<path d="M33.8,45 L30.8,50 M38.2,45 L41.2,50" fill="none" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" opacity=".92" />' +
    '</svg>';
  }

  function heroRect() {
    return hero.getBoundingClientRect();
  }

  function titleRect() {
    return title.getBoundingClientRect();
  }

  function bezier(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    const a = mt * mt * mt;
    const b = 3 * mt * mt * t;
    const c = 3 * mt * t * t;
    const d = t * t * t;
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
    };
  }

  function sampleAlong(segment, t) {
    const distance = clamp(t, 0, 1) * segment.arc;
    let k = 1;
    while (k < segment.cum.length && segment.cum[k] < distance) k++;

    const previousDistance = segment.cum[k - 1];
    const nextDistance = segment.cum[k];
    const fraction = nextDistance > previousDistance ? (distance - previousDistance) / (nextDistance - previousDistance) : 0;
    const p0 = segment.pts[k - 1];
    const p1 = segment.pts[k];

    return {
      x: p0.x + (p1.x - p0.x) * fraction,
      y: p0.y + (p1.y - p0.y) * fraction
    };
  }

  function titleLettersOnly() {
    return Array.from(title.querySelectorAll(':scope .bird-letter'));
  }

  function stableLetters() {
    const h = heroRect();
    const t = titleRect();
    const measured = titleLettersOnly()
      .map((span) => ({ span, rect: span.getBoundingClientRect() }))
      .filter((item) => item.rect.width > 0 && item.rect.height > 0)
      .filter((item) => item.rect.left > h.left + 24 && item.rect.right < h.right - 24)
      .filter((item) => item.rect.top >= t.top - 4 && item.rect.bottom <= t.bottom + 4)
      .filter((item) => item.rect.top > h.top + 80 && item.rect.bottom < h.bottom - 80);

    if (!measured.length) return titleLettersOnly();

    const avgWidth = measured.reduce((sum, item) => sum + item.rect.width, 0) / measured.length;
    const pool = measured
      .filter((item) => item.rect.width >= avgWidth * 0.68)
      .filter((item) => !/^[ijIl1]$/.test(item.span.textContent))
      .map((item) => item.span);

    return pool.length >= 4 ? pool : measured.map((item) => item.span);
  }

  function chooseLetter(previous) {
    const pool = stableLetters();
    const candidates = previous ? pool.filter((span) => span !== previous) : pool;
    const usable = candidates.length ? candidates : pool;
    return usable[(Math.random() * usable.length) | 0];
  }

  function letterPerch(span, bird) {
    const r = span.getBoundingClientRect();
    const h = heroRect();

    const footOffsetX = bird ? bird.footX - bird.cw / 2 : 0;
    const footOffsetY = bird ? bird.footY - bird.ch / 2 : 7;

    const targetFootX = r.left + r.width * 0.5 - h.left;
    const targetFootY = r.top - h.top + 2;

    return {
      x: targetFootX - footOffsetX,
      y: targetFootY - footOffsetY
    };
  }

  function skyPoint() {
    const h = heroRect();
    const t = titleRect();
    return {
      x: rand(h.width * 0.10, h.width * 0.90),
      y: rand(Math.max(40, t.top - h.top - 120), Math.max(80, t.top - h.top - 40))
    };
  }

  function makeBird(index) {
    const el = document.createElement('div');
    el.className = 'paille';
    el.style.filter = 'none';
    el.innerHTML = birdSVG();
    layer.appendChild(el);

    const scale = rand(0.68, 0.96);
    const svg = el.querySelector('svg');
    const cw = VBW * scale;
    const ch = VBH * scale;
    svg.setAttribute('width', cw);
    svg.setAttribute('height', ch);
    el.style.opacity = (0.80 + scale * 0.20).toFixed(2);

    const h = heroRect();
    const t = titleRect();
    const fromLeft = Math.random() < 0.5;
    const start = {
      x: fromLeft ? -80 : (h.width || window.innerWidth) + 80,
      y: rand(Math.max(40, t.top - h.top - 70), Math.min(h.height * 0.52, t.bottom - h.top + 40))
    };

    return {
      el,
      wings: el.querySelector('[data-wings]'),
      tail: el.querySelector('[data-tail]'),
      cw,
      ch,
      footX: FOOT_X * scale,
      footY: FOOT_Y * scale,
      speed: rand(74, 104),
      perchProb: rand(0.42, 0.62),
      phaseOff: rand(0, Math.PI * 2),
      pos: { x: start.x, y: start.y },
      prev: { x: start.x, y: start.y },
      angle: fromLeft ? 90 : -90,
      phase: rand(0, Math.PI * 2),
      state: 'flying',
      seg: null,
      perchSpan: null,
      perchUntil: 0,
      endsOnPerch: false,
      pendingPerch: false,
      delay: index * 1100 + rand(0, 500),
      born: false,
      t0base: 0
    };
  }

  function startFlight(bird, endPoint, opts) {
    opts = opts || {};
    const start = { x: bird.pos.x, y: bird.pos.y };
    const dx = endPoint.x - start.x;
    const dy = endPoint.y - start.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;

    const currentHeading = (bird.angle - 90) * Math.PI / 180;
    const hx = Math.cos(currentHeading);
    const hy = Math.sin(currentHeading);
    const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    const turn = Math.abs(((targetAngle - bird.angle + 540) % 360) - 180) / 180;

    const sway = rand(-1, 1) * Math.min(dist * 0.30, 155);
    const out = clamp(dist * 0.38, 95, 300);
    const lift = opts.lift || 0;
    const wide = 1 + turn * 1.05;

    const p0 = start;
    const p1 = {
      x: start.x + hx * out * wide + px * sway * 0.30,
      y: start.y + hy * out * wide + py * sway * 0.30 + lift - turn * 86
    };
    const p2 = {
      x: endPoint.x - ux * out * 0.92 + px * sway * 0.58,
      y: endPoint.y - uy * out * 0.92 + py * sway * 0.58 + lift * 0.20 - turn * 50
    };
    const p3 = endPoint;

    const N = 42;
    const pts = [p0];
    const cum = [0];
    let previous = p0;
    for (let k = 1; k <= N; k++) {
      const point = bezier(p0, p1, p2, p3, k / N);
      pts.push(point);
      cum.push(cum[k - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
      previous = point;
    }

    bird.seg = {
      pts,
      cum,
      arc: cum[N],
      dur: clamp(cum[N] / bird.speed, 2.4, 22.0) * 1000 * (opts.durScale || 1),
      t0: performance.now()
    };
    bird.state = 'flying';
  }

  function planNext(bird) {
    if (Math.random() < bird.perchProb) {
      if (Math.random() < 0.45) {
        bird.endsOnPerch = false;
        bird.pendingPerch = true;
        startFlight(bird, skyPoint(), { lift: -rand(30, 90) });
      } else {
        bird.endsOnPerch = true;
        bird.perchSpan = chooseLetter(bird.perchSpan);
        startFlight(bird, letterPerch(bird.perchSpan, bird), { lift: -rand(20, 56) });
      }
    } else {
      bird.endsOnPerch = false;
      bird.pendingPerch = false;
      startFlight(bird, skyPoint(), { lift: -rand(0, 70) });
    }
  }

  function updateBird(bird, now, dt) {
    if (!bird.born) {
      if (now < bird.t0base + bird.delay) return;
      bird.born = true;
      bird.endsOnPerch = true;
      bird.perchSpan = chooseLetter();
      startFlight(bird, letterPerch(bird.perchSpan, bird), { durScale: 1.08 });
    }

    if (bird.state === 'flying' && bird.seg) {
      const t = (now - bird.seg.t0) / bird.seg.dur;
      if (t >= 1) {
        const end = bird.seg.pts[bird.seg.pts.length - 1];
        bird.pos = { x: end.x, y: end.y };
        if (bird.endsOnPerch && bird.perchSpan) {
          bird.state = 'perched';
          bird.perchUntil = now + rand(3500, 7600);
        } else if (bird.pendingPerch) {
          bird.pendingPerch = false;
          bird.endsOnPerch = true;
          bird.perchSpan = chooseLetter(bird.perchSpan);
          startFlight(bird, letterPerch(bird.perchSpan, bird), { lift: -rand(20, 50) });
        } else {
          planNext(bird);
        }
      } else {
        bird.pos = sampleAlong(bird.seg, t);
      }
    } else if (bird.state === 'perched' && bird.perchSpan) {
      const point = letterPerch(bird.perchSpan, bird);
      bird.pos = { x: point.x, y: point.y + Math.sin(now / 540 + bird.phaseOff) * 0.55 };
      if (now > bird.perchUntil) planNext(bird);
    }

    const vx = (bird.pos.x - bird.prev.x) / dt;
    const vy = (bird.pos.y - bird.prev.y) / dt;
    const speed = Math.hypot(vx, vy);
    bird.prev = { x: bird.pos.x, y: bird.pos.y };

    if (speed > 10) {
      const target = Math.atan2(vy, vx) * 180 / Math.PI + 90;
      const diff = ((target - bird.angle + 540) % 360) - 180;
      bird.angle += diff * clamp(dt * 3.25, 0, 1);
    } else if (bird.state === 'perched') {
      const diff = ((0 - bird.angle + 540) % 360) - 180;
      bird.angle += diff * clamp(dt * 2.8, 0, 1);
    }

    const perched = bird.state === 'perched';
    const flapHz = perched ? 0 : clamp(2.0 + (-vy) * 0.0045, 1.45, 3.35);
    bird.phase += dt * flapHz * Math.PI * 2;

    const wingSpan = perched ? 0.42 : 0.50 + 0.50 * (0.5 + 0.5 * Math.sin(bird.phase));
    bird.wings.setAttribute('transform', 'translate(36,0) scale(' + wingSpan.toFixed(3) + ',1) translate(-36,0)');

    const tailSway = (perched ? 0.9 : 4.8) * Math.sin(bird.phase * 0.5 + 0.6 + bird.phaseOff);
    bird.tail.setAttribute('transform', 'rotate(' + tailSway.toFixed(2) + ' 36 43)');

    const bob = perched ? 0 : Math.sin(bird.phase) * 0.8;
    bird.el.style.transform =
      'translate(' + (bird.pos.x - bird.cw / 2).toFixed(2) + 'px,' +
                     (bird.pos.y - bird.ch / 2 + bob).toFixed(2) + 'px) ' +
      'rotate(' + bird.angle.toFixed(2) + 'deg)';
  }

  const birds = [];
  for (let i = 0; i < NUM_BIRDS; i++) birds.push(makeBird(i));
  const t0base = performance.now();
  birds.forEach((bird) => { bird.t0base = t0base; });

  let lastT = 0;
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.02 }).observe(hero);
  }

  function frame(now) {
    if (!visible) {
      lastT = now;
      requestAnimationFrame(frame);
      return;
    }
    let dt = (now - lastT) / 1000;
    if (!lastT) dt = 0.016;
    dt = Math.min(dt, 0.05);
    lastT = now;
    birds.forEach((bird) => updateBird(bird, now, dt));
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
