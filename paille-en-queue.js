/* Paille-en-queue du hero : vol décoratif continu, sans pose sur les lettres. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 760) return;

  const hero = document.getElementById('hero');
  if (!hero) return;

  const NUM_BIRDS = 3;
  const VBW = 72;
  const VBH = 82;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const rand = (min, max) => min + Math.random() * (max - min);

  document.querySelectorAll('.bird-layer').forEach((oldLayer) => oldLayer.remove());

  const birdStyle = document.createElement('style');
  birdStyle.textContent = `
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
  document.head.appendChild(birdStyle);

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
    '</svg>';
  }

  function heroRect() {
    return hero.getBoundingClientRect();
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

  function skyPoint() {
    const h = heroRect();
    return {
      x: rand(h.width * 0.06, h.width * 0.94),
      y: rand(h.height * 0.08, h.height * 0.72)
    };
  }

  function offscreenPoint(side) {
    const h = heroRect();
    const margin = 120;
    if (side === 'left') {
      return { x: -margin, y: rand(h.height * 0.10, h.height * 0.70) };
    }
    if (side === 'right') {
      return { x: h.width + margin, y: rand(h.height * 0.10, h.height * 0.70) };
    }
    if (side === 'top') {
      return { x: rand(h.width * 0.10, h.width * 0.90), y: -margin };
    }
    return { x: rand(h.width * 0.10, h.width * 0.90), y: h.height + margin };
  }

  function randomOffscreenPoint() {
    const sides = ['left', 'right', 'top'];
    return offscreenPoint(sides[(Math.random() * sides.length) | 0]);
  }

  function makeBird(index) {
    const el = document.createElement('div');
    el.className = 'paille';
    el.style.filter = 'none';
    el.style.opacity = '0';
    el.innerHTML = birdSVG();
    layer.appendChild(el);

    const scale = rand(0.68, 0.96);
    const svg = el.querySelector('svg');
    const cw = VBW * scale;
    const ch = VBH * scale;
    svg.setAttribute('width', cw);
    svg.setAttribute('height', ch);
    const finalOpacity = (0.78 + scale * 0.22).toFixed(2);

    const start = offscreenPoint(index % 2 === 0 ? 'left' : 'right');
    const startAngle = start.x < 0 ? 90 : -90;

    el.style.transform =
      'translate(' + (start.x - cw / 2).toFixed(2) + 'px,' +
                     (start.y - ch / 2).toFixed(2) + 'px) ' +
      'rotate(' + startAngle.toFixed(2) + 'deg)';

    return {
      el,
      wings: el.querySelector('[data-wings]'),
      tail: el.querySelector('[data-tail]'),
      cw,
      ch,
      finalOpacity,
      speed: rand(86, 128),
      phase: rand(0, Math.PI * 2),
      phaseOff: rand(0, Math.PI * 2),
      pos: { x: start.x, y: start.y },
      prev: { x: start.x, y: start.y },
      angle: startAngle,
      seg: null,
      delay: index * 850 + rand(0, 500),
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

    const sway = rand(-1, 1) * Math.min(dist * 0.32, 190);
    const out = clamp(dist * 0.40, 110, 360);
    const lift = opts.lift || rand(-90, 60);
    const wide = 1 + turn * 1.10;

    const p0 = start;
    const p1 = {
      x: start.x + hx * out * wide + px * sway * 0.35,
      y: start.y + hy * out * wide + py * sway * 0.35 + lift - turn * 90
    };
    const p2 = {
      x: endPoint.x - ux * out * 0.92 + px * sway * 0.58,
      y: endPoint.y - uy * out * 0.92 + py * sway * 0.58 + lift * 0.20 - turn * 55
    };
    const p3 = endPoint;

    const N = 46;
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
      dur: clamp(cum[N] / bird.speed, 2.1, 18.0) * 1000 * (opts.durScale || 1),
      t0: performance.now()
    };
  }

  function planNext(bird) {
    const target = Math.random() < 0.22 ? randomOffscreenPoint() : skyPoint();
    startFlight(bird, target, { lift: rand(-115, 70), durScale: rand(0.92, 1.18) });
  }

  function resetFromOffscreen(bird) {
    const start = randomOffscreenPoint();
    bird.pos = { x: start.x, y: start.y };
    bird.prev = { x: start.x, y: start.y };
    bird.angle = start.x < 0 ? 90 : -90;
    startFlight(bird, skyPoint(), { lift: rand(-110, 40), durScale: 1.05 });
  }

  function updateBird(bird, now, dt) {
    if (!bird.born) {
      if (now < bird.t0base + bird.delay) return;
      bird.born = true;
      bird.el.style.opacity = bird.finalOpacity;
      resetFromOffscreen(bird);
    }

    if (bird.seg) {
      const t = (now - bird.seg.t0) / bird.seg.dur;
      if (t >= 1) {
        const end = bird.seg.pts[bird.seg.pts.length - 1];
        bird.pos = { x: end.x, y: end.y };
        bird.prev = { x: end.x, y: end.y };
        planNext(bird);
      } else {
        bird.pos = sampleAlong(bird.seg, t);
      }
    }

    const vx = (bird.pos.x - bird.prev.x) / dt;
    const vy = (bird.pos.y - bird.prev.y) / dt;
    const speed = Math.hypot(vx, vy);
    bird.prev = { x: bird.pos.x, y: bird.pos.y };

    if (speed > 8) {
      const target = Math.atan2(vy, vx) * 180 / Math.PI + 90;
      const diff = ((target - bird.angle + 540) % 360) - 180;
      bird.angle += diff * clamp(dt * 3.10, 0, 1);
    }

    const flapHz = clamp(2.0 + Math.min(speed, 180) * 0.004, 1.6, 3.6);
    bird.phase += dt * flapHz * Math.PI * 2;

    const wingSpan = 0.50 + 0.50 * (0.5 + 0.5 * Math.sin(bird.phase));
    bird.wings.setAttribute('transform', 'translate(36,0) scale(' + wingSpan.toFixed(3) + ',1) translate(-36,0)');

    const tailSway = 4.8 * Math.sin(bird.phase * 0.5 + 0.6 + bird.phaseOff);
    bird.tail.setAttribute('transform', 'rotate(' + tailSway.toFixed(2) + ' 36 43)');

    const bob = Math.sin(bird.phase) * 0.8;
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
