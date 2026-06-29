/* ════════════════════════════════════════════════════════════════
   PAILLE-EN-QUEUE — nuée d'oiseaux emblématiques de La Réunion
   Vol naturel sur TOUTE la page (couche fixe), se posent parfois
   sur les lettres du titre quand celui-ci est à l'écran.
   SVG + requestAnimationFrame, sans dépendance.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  if (window.innerWidth < 760) return; // titre trop petit / perf sur mobile

  const title = document.getElementById('hero-title');
  if (!title) return;

  const NUM_BIRDS = 5;

  /* ── 1. Encapsuler chaque lettre du titre dans un <span> mesurable ── */
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
        wrapLetters(child); // descend dans <em>
      }
    });
  }
  wrapLetters(title);

  /* ── 2. Couche fixe plein écran ── */
  const layer = document.createElement('div');
  layer.className = 'bird-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  /* ── 3. Géométrie SVG : corps mince + longues ailes effilées ── */
  const VBW = 60, VBH = 66;
  const BODY = 'M30,4 C31,10 31.2,18 30.9,26 C30.6,32 30.2,36 30,38 ' +
               'C29.8,36 29.4,32 29.1,26 C28.8,18 29,10 30,4 Z';
  // Aile gauche : longue, en flèche, pointe vers le bas-extérieur
  const WING_L = 'M28.5,16 C21,13.5 11,16.5 3,28 C2.4,29 3,30.2 4.2,30 ' +
                 'C13,27 21.5,24 28,21.5 Z';
  const WING_R = 'M31.5,16 C39,13.5 49,16.5 57,28 C57.6,29 57,30.2 55.8,30 ' +
                 'C47,27 38.5,24 32,21.5 Z';

  function birdSVG() {
    return '<svg viewBox="0 0 ' + VBW + ' ' + VBH + '">' +
        '<g class="paille-tail" data-tail>' +
          '<path d="M29.4,37 C28.8,46 28.4,55 28,64" />' +
          '<path d="M30.6,37 C31.2,46 31.6,55 32,64" />' +
        '</g>' +
        '<g class="paille-wings" data-wings>' +
          '<path d="' + WING_L + '" />' +
          '<path d="' + WING_R + '" />' +
        '</g>' +
        '<path class="paille-body" d="' + BODY + '" />' +
      '</svg>';
  }

  /* ── 4. Helpers ── */
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const rand  = (a, b) => a + Math.random() * (b - a);

  function bezier(p0, p1, p2, p3, t) {
    const mt = 1 - t, a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    };
  }

  function vw() { return window.innerWidth; }
  function vh() { return window.innerHeight; }

  // Lettre visible à l'écran ? (couche fixe → coords viewport directes)
  function letterVisible(span) {
    const r = span.getBoundingClientRect();
    return r.width > 0 &&
           r.top < vh() * 0.92 && r.bottom > vh() * 0.06 &&
           r.left < vw() * 0.96 && r.right > vw() * 0.04;
  }
  function letterPerch(span) {
    const r = span.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top - 8 };
  }
  function visibleLetters() {
    return letters.filter(letterVisible);
  }

  // Point libre n'importe où dans la fenêtre
  function skyPoint() {
    return { x: rand(vw() * 0.06, vw() * 0.94), y: rand(vh() * 0.08, vh() * 0.82) };
  }

  /* ── 5. Un oiseau ── */
  function makeBird(i) {
    const el = document.createElement('div');
    el.className = 'paille';
    el.innerHTML = birdSVG();
    layer.appendChild(el);

    const scale = rand(0.55, 1.0);
    el.style.width  = (VBW * scale) + 'px';
    el.style.height = (VBH * scale) + 'px';
    el.style.opacity = (0.72 + scale * 0.28).toFixed(2); // petits = plus lointains
    const svg = el.querySelector('svg');
    svg.setAttribute('width',  VBW * scale);
    svg.setAttribute('height', VBH * scale);

    // Entrée depuis un bord aléatoire
    const edge = (Math.random() * 4) | 0;
    let start;
    if (edge === 0)      start = { x: -70, y: rand(0, vh() * 0.7) };
    else if (edge === 1) start = { x: vw() + 70, y: rand(0, vh() * 0.7) };
    else if (edge === 2) start = { x: rand(0, vw()), y: -70 };
    else                 start = { x: rand(0, vw()), y: vh() + 70 };

    return {
      el,
      wings: el.querySelector('[data-wings]'),
      tail:  el.querySelector('[data-tail]'),
      cw: VBW * scale, ch: VBH * scale,
      speed: rand(170, 270),
      perchProb: rand(0.35, 0.6),
      perchDur: [rand(2000, 3500), rand(3500, 6000)],
      phaseOff: rand(0, 6.28),
      pos: { x: start.x, y: start.y },
      prev: { x: start.x, y: start.y },
      angle: 90,
      phase: rand(0, 6.28),
      state: 'flying',
      seg: null,
      perchSpan: null,
      perchUntil: 0,
      endsOnPerch: false,
      delay: i * 420 + rand(0, 300), // décalage d'apparition
      born: false,
    };
  }

  function startFlight(b, endPoint, opts) {
    opts = opts || {};
    const s = { x: b.pos.x, y: b.pos.y };
    const dx = endPoint.x - s.x, dy = endPoint.y - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist, uy = dy / dist;
    const px = -uy, py = ux;
    const sway = rand(-1, 1) * Math.min(dist * 0.5, 220);
    const out = dist * 0.35;
    const lift = opts.lift || 0;
    b.seg = {
      p0: s,
      p1: { x: s.x + ux * out + px * sway, y: s.y + uy * out + py * sway + lift },
      p2: { x: endPoint.x - ux * out + px * sway, y: endPoint.y - uy * out + py * sway },
      p3: endPoint,
      dur: clamp(dist / b.speed, 0.7, 3.0) * 1000 * (opts.durScale || 1),
      t0: performance.now(),
    };
    b.state = 'flying';
  }

  function planNext(b) {
    const vis = visibleLetters();
    if (vis.length && Math.random() < b.perchProb) {
      // viser une lettre visible : petite boucle puis perchage
      if (Math.random() < 0.5) {
        b.endsOnPerch = false;
        b.pendingPerch = true;
        startFlight(b, skyPoint(), { lift: -rand(40, 120), durScale: 0.9 });
      } else {
        b.endsOnPerch = true;
        b.perchSpan = vis[(Math.random() * vis.length) | 0];
        startFlight(b, letterPerch(b.perchSpan), { lift: -rand(30, 80) });
      }
    } else {
      b.endsOnPerch = false;
      b.pendingPerch = false;
      startFlight(b, skyPoint(), { lift: -rand(0, 90) });
    }
  }

  /* ── 6. Mise à jour d'un oiseau ── */
  function updateBird(b, now, dt) {
    if (!b.born) {
      if (now < b.t0base + b.delay) { return; }
      b.born = true;
      // premier vol
      if (visibleLetters().length && Math.random() < b.perchProb) {
        b.endsOnPerch = true;
        b.perchSpan = visibleLetters()[(Math.random() * visibleLetters().length) | 0];
        startFlight(b, letterPerch(b.perchSpan), { durScale: 1.1 });
      } else {
        b.endsOnPerch = false;
        startFlight(b, skyPoint(), { durScale: 1.1 });
      }
    }

    if (b.state === 'flying' && b.seg) {
      let t = (now - b.seg.t0) / b.seg.dur;
      if (t >= 1) {
        b.pos = { x: b.seg.p3.x, y: b.seg.p3.y };
        if (b.endsOnPerch && b.perchSpan && letterVisible(b.perchSpan)) {
          b.state = 'perched';
          b.perchUntil = now + rand(b.perchDur[0], b.perchDur[1]);
        } else if (b.pendingPerch && visibleLetters().length) {
          b.endsOnPerch = true;
          b.pendingPerch = false;
          b.perchSpan = visibleLetters()[(Math.random() * visibleLetters().length) | 0];
          startFlight(b, letterPerch(b.perchSpan), { lift: -rand(30, 70) });
        } else {
          planNext(b);
        }
      } else {
        const te = t * t * (3 - 2 * t);
        b.pos = bezier(b.seg.p0, b.seg.p1, b.seg.p2, b.seg.p3, te);
      }
    } else if (b.state === 'perched' && b.perchSpan) {
      if (!letterVisible(b.perchSpan)) {        // la lettre a quitté l'écran
        planNext(b);
      } else {
        const p = letterPerch(b.perchSpan);     // suit la lettre (scroll/parallaxe)
        b.pos = { x: p.x, y: p.y + Math.sin(now / 460 + b.phaseOff) * 1.3 };
        if (now > b.perchUntil) planNext(b);
      }
    }

    /* cap + cadence d'ailes d'après le mouvement réel */
    const vx = (b.pos.x - b.prev.x) / dt;
    const vy = (b.pos.y - b.prev.y) / dt;
    const speed = Math.hypot(vx, vy);
    b.prev = { x: b.pos.x, y: b.pos.y };

    if (speed > 14) {
      const target = Math.atan2(vy, vx) * 180 / Math.PI + 90;
      let diff = ((target - b.angle + 540) % 360) - 180;
      b.angle += diff * clamp(dt * 7, 0, 1);
    } else if (b.state === 'perched') {
      let diff = ((0 - b.angle + 540) % 360) - 180;
      b.angle += diff * clamp(dt * 2.5, 0, 1);
    }

    const perched = b.state === 'perched';
    const flapHz = perched ? 0 : clamp(6.5 + (-vy) * 0.012, 4.5, 12);
    b.phase += dt * flapHz * Math.PI * 2;

    const spanX = perched ? 0.4 : 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(b.phase));
    b.wings.setAttribute('transform',
      'translate(30,0) scale(' + spanX.toFixed(3) + ',1) translate(-30,0)');

    const tailSway = (perched ? 1.4 : 6.5) * Math.sin(b.phase * 0.5 + 0.6 + b.phaseOff);
    b.tail.setAttribute('transform', 'rotate(' + tailSway.toFixed(2) + ' 30 37)');

    const bobFly = perched ? 0 : Math.sin(b.phase) * 1.1;
    b.el.style.transform =
      'translate(' + (b.pos.x - b.cw / 2).toFixed(2) + 'px,' +
                     (b.pos.y - b.ch / 2 + bobFly).toFixed(2) + 'px) ' +
      'rotate(' + b.angle.toFixed(2) + 'deg)';
  }

  /* ── 7. Boucle globale ── */
  const birds = [];
  for (let i = 0; i < NUM_BIRDS; i++) birds.push(makeBird(i));

  let lastT = 0;
  const t0base = performance.now();
  birds.forEach((b) => { b.t0base = t0base; });

  function frame(now) {
    let dt = (now - lastT) / 1000;
    if (!lastT) dt = 0.016;
    dt = Math.min(dt, 0.05);
    lastT = now;
    for (const b of birds) updateBird(b, now, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
