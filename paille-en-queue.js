/* ════════════════════════════════════════════════════════════════
   PAILLE-EN-QUEUE — oiseaux emblématiques de La Réunion
   Trois oiseaux planent dans le hero et se posent parfois sur les
   lettres du titre. SVG + requestAnimationFrame, sans dépendance.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  if (window.innerWidth < 760) return; // titre trop petit / perf sur mobile

  const hero  = document.getElementById('hero');
  const title = document.getElementById('hero-title');
  if (!hero || !title) return;

  const NUM_BIRDS = 3;

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
  if (!letters.length) return;

  /* ── 2. Couche confinée au hero ── */
  const layer = document.createElement('div');
  layer.className = 'bird-layer';
  layer.setAttribute('aria-hidden', 'true');
  hero.appendChild(layer);

  /* ── 3. Géométrie SVG : corps mince + longues ailes effilées ── */
  const VBW = 60, VBH = 66;
  const BODY = 'M30,4 C31,10 31.2,18 30.9,26 C30.6,32 30.2,36 30,38 ' +
               'C29.8,36 29.4,32 29.1,26 C28.8,18 29,10 30,4 Z';
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

  // Position à vitesse constante le long d'une trajectoire échantillonnée
  function sampleAlong(seg, t) {
    const d = clamp(t, 0, 1) * seg.arc;
    const cum = seg.cum;
    let k = 1;
    while (k < cum.length && cum[k] < d) k++;
    const a = cum[k - 1], c = cum[k];
    const f = c - a > 0 ? (d - a) / (c - a) : 0;
    const pa = seg.pts[k - 1], pb = seg.pts[k];
    return { x: pa.x + (pb.x - pa.x) * f, y: pa.y + (pb.y - pa.y) * f };
  }

  function heroRect() { return hero.getBoundingClientRect(); }

  function stableLetters() {
    const measured = letters.map((span) => ({ span, rect: span.getBoundingClientRect() }))
      .filter((item) => item.rect.width > 0 && item.rect.height > 0);
    if (!measured.length) return letters;

    const avgWidth = measured.reduce((sum, item) => sum + item.rect.width, 0) / measured.length;
    const pool = measured
      .filter((item) => item.rect.width >= avgWidth * 0.58)
      .filter((item) => !/^[ilI1]$/.test(item.span.textContent))
      .map((item) => item.span);

    return pool.length >= 4 ? pool : letters;
  }

  function chooseLetter(previous) {
    const pool = stableLetters();
    const candidates = previous
      ? pool.filter((span) => span !== previous)
      : pool;
    const usable = candidates.length ? candidates : pool;
    return usable[(Math.random() * usable.length) | 0];
  }

  // Perchoir d'une lettre, en coordonnées locales au hero.
  // Le point correspond au centre visuel de l'oiseau, placé au-dessus du haut de la lettre.
  function letterPerch(span, bird) {
    const r = span.getBoundingClientRect();
    const h = heroRect();
    const lift = bird ? bird.ch * 0.42 : 24;
    const safeX = r.left + r.width * 0.5 - h.left;
    const safeY = r.top - h.top - lift;
    return { x: safeX, y: safeY };
  }

  // Point libre dans le ciel du hero (partie haute)
  function skyPoint() {
    const h = heroRect();
    return { x: rand(h.width * 0.1, h.width * 0.9), y: rand(h.height * 0.1, h.height * 0.52) };
  }

  /* ── 5. Un oiseau ── */
  function makeBird(i) {
    const el = document.createElement('div');
    el.className = 'paille';
    el.innerHTML = birdSVG();
    layer.appendChild(el);

    const scale = rand(0.72, 1.0);
    const svg = el.querySelector('svg');
    svg.setAttribute('width',  VBW * scale);
    svg.setAttribute('height', VBH * scale);
    el.style.opacity = (0.82 + scale * 0.18).toFixed(2);

    const h = heroRect();
    const fromLeft = Math.random() < 0.5;
    const start = {
      x: fromLeft ? -70 : (h.width || window.innerWidth) + 70,
      y: rand(40, (h.height || window.innerHeight) * 0.55),
    };

    return {
      el,
      wings: el.querySelector('[data-wings]'),
      tail:  el.querySelector('[data-tail]'),
      cw: VBW * scale, ch: VBH * scale,
      speed: rand(72, 106),          // px/s — vol planant (vitesse constante)
      perchProb: rand(0.4, 0.6),
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
      pendingPerch: false,
      delay: i * 1100 + rand(0, 500),
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

    const currentHeading = (b.angle - 90) * Math.PI / 180;
    const hx = Math.cos(currentHeading), hy = Math.sin(currentHeading);
    const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    const turn = Math.abs(((targetAngle - b.angle + 540) % 360) - 180) / 180;

    const sway = rand(-1, 1) * Math.min(dist * 0.28, 150);
    const out = clamp(dist * 0.36, 90, 280);
    const lift = opts.lift || 0;
    const wide = 1 + turn * 0.85;

    const p0 = s;
    const p1 = {
      x: s.x + hx * out * wide + px * sway * 0.35,
      y: s.y + hy * out * wide + py * sway * 0.35 + lift - turn * 70
    };
    const p2 = {
      x: endPoint.x - ux * out * 0.95 + px * sway * 0.55,
      y: endPoint.y - uy * out * 0.95 + py * sway * 0.55 + lift * 0.25 - turn * 45
    };
    const p3 = endPoint;

    // Échantillonnage en polyligne + longueurs cumulées :
    // on parcourra la courbe à VITESSE CONSTANTE (reparamétrage par longueur d'arc),
    // ce qui supprime les accélérations parasites au milieu des trajectoires.
    const N = 36;
    const pts = [p0];
    const cum = [0];
    let prevP = p0;
    for (let k = 1; k <= N; k++) {
      const q = bezier(p0, p1, p2, p3, k / N);
      pts.push(q);
      cum.push(cum[k - 1] + Math.hypot(q.x - prevP.x, q.y - prevP.y));
      prevP = q;
    }
    const arc = cum[N];

    b.seg = {
      pts, cum, arc,
      dur: clamp(arc / b.speed, 2.2, 22.0) * 1000 * (opts.durScale || 1),
      t0: performance.now(),
    };
    b.state = 'flying';
  }

  function planNext(b) {
    if (Math.random() < b.perchProb) {
      if (Math.random() < 0.5) {
        // boucle dans le ciel puis perchage
        b.endsOnPerch = false;
        b.pendingPerch = true;
        startFlight(b, skyPoint(), { lift: -rand(30, 90), durScale: 1.0 });
      } else {
        b.endsOnPerch = true;
        b.perchSpan = chooseLetter(b.perchSpan);
        startFlight(b, letterPerch(b.perchSpan, b), { lift: -rand(20, 60) });
      }
    } else {
      b.endsOnPerch = false;
      b.pendingPerch = false;
      startFlight(b, skyPoint(), { lift: -rand(0, 70) });
    }
  }

  /* ── 6. Mise à jour d'un oiseau ── */
  function updateBird(b, now, dt) {
    if (!b.born) {
      if (now < b.t0base + b.delay) return;
      b.born = true;
      if (Math.random() < b.perchProb) {
        b.endsOnPerch = true;
        b.perchSpan = chooseLetter();
        startFlight(b, letterPerch(b.perchSpan, b), { durScale: 1.1 });
      } else {
        b.endsOnPerch = false;
        startFlight(b, skyPoint(), { durScale: 1.1 });
      }
    }

    if (b.state === 'flying' && b.seg) {
      const t = (now - b.seg.t0) / b.seg.dur;
      if (t >= 1) {
        const end = b.seg.pts[b.seg.pts.length - 1];
        b.pos = { x: end.x, y: end.y };
        if (b.endsOnPerch && b.perchSpan) {
          b.state = 'perched';
          b.perchUntil = now + rand(3500, 7500);
        } else if (b.pendingPerch) {
          b.endsOnPerch = true;
          b.pendingPerch = false;
          b.perchSpan = chooseLetter(b.perchSpan);
          startFlight(b, letterPerch(b.perchSpan, b), { lift: -rand(20, 50) });
        } else {
          planNext(b);
        }
      } else {
        b.pos = sampleAlong(b.seg, t); // vitesse constante
      }
    } else if (b.state === 'perched' && b.perchSpan) {
      const p = letterPerch(b.perchSpan, b); // suit la lettre (parallaxe)
      b.pos = { x: p.x, y: p.y + Math.sin(now / 520 + b.phaseOff) * 1.1 };
      if (now > b.perchUntil) planNext(b);
    }

    /* cap + cadence d'ailes d'après le mouvement réel */
    const vx = (b.pos.x - b.prev.x) / dt;
    const vy = (b.pos.y - b.prev.y) / dt;
    const speed = Math.hypot(vx, vy);
    b.prev = { x: b.pos.x, y: b.pos.y };

    if (speed > 10) {
      const target = Math.atan2(vy, vx) * 180 / Math.PI + 90;
      let diff = ((target - b.angle + 540) % 360) - 180;
      b.angle += diff * clamp(dt * 3.6, 0, 1); // virages plus amples et moins mécaniques
    } else if (b.state === 'perched') {
      let diff = ((0 - b.angle + 540) % 360) - 180;
      b.angle += diff * clamp(dt * 2.2, 0, 1);
    }

    const perched = b.state === 'perched';
    // battement lent et planant (≈ 2,4–4 Hz, plus vif en montée)
    const flapHz = perched ? 0 : clamp(2.2 + (-vy) * 0.005, 1.6, 3.6);
    b.phase += dt * flapHz * Math.PI * 2;

    const spanX = perched ? 0.4 : 0.46 + 0.54 * (0.5 + 0.5 * Math.sin(b.phase));
    b.wings.setAttribute('transform',
      'translate(30,0) scale(' + spanX.toFixed(3) + ',1) translate(-30,0)');

    const tailSway = (perched ? 1.3 : 5) * Math.sin(b.phase * 0.5 + 0.6 + b.phaseOff);
    b.tail.setAttribute('transform', 'rotate(' + tailSway.toFixed(2) + ' 30 37)');

    const bobFly = perched ? 0 : Math.sin(b.phase) * 0.9;
    b.el.style.transform =
      'translate(' + (b.pos.x - b.cw / 2).toFixed(2) + 'px,' +
                     (b.pos.y - b.ch / 2 + bobFly).toFixed(2) + 'px) ' +
      'rotate(' + b.angle.toFixed(2) + 'deg)';
  }

  /* ── 7. Boucle globale (en pause hors-écran) ── */
  const birds = [];
  for (let i = 0; i < NUM_BIRDS; i++) birds.push(makeBird(i));
  const t0base = performance.now();
  birds.forEach((b) => { b.t0base = t0base; });

  let lastT = 0;
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.02 })
      .observe(hero);
  }

  function frame(now) {
    if (!visible) { lastT = now; requestAnimationFrame(frame); return; }
    let dt = (now - lastT) / 1000;
    if (!lastT) dt = 0.016;
    dt = Math.min(dt, 0.05);
    lastT = now;
    for (const b of birds) updateBird(b, now, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
