/* ════════════════════════════════════════════════════════════════
   PAILLE-EN-QUEUE — oiseau emblématique de La Réunion
   Vol naturel au-dessus du hero, se pose sur les lettres du titre.
   SVG + requestAnimationFrame, sans dépendance.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  if (window.innerWidth < 760) return; // titre trop petit sur mobile

  const hero  = document.getElementById('hero');
  const title = document.getElementById('hero-title');
  if (!hero || !title) return;

  /* ── 1. Encapsuler chaque lettre du titre dans un <span> mesurable ── */
  const letters = [];
  function wrapLetters(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        const frag = document.createDocumentFragment();
        for (const ch of text) {
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

  /* ── 2. Construire la couche + l'oiseau SVG (vue de dessus) ── */
  const SCALE = 0.9;
  const VBW = 40, VBH = 64;

  const layer = document.createElement('div');
  layer.className = 'bird-layer';
  layer.setAttribute('aria-hidden', 'true');

  layer.innerHTML =
    '<div class="paille">' +
      '<svg width="' + (VBW * SCALE) + '" height="' + (VBH * SCALE) + '" viewBox="0 0 ' + VBW + ' ' + VBH + '">' +
        // Banderoles de queue (la signature du paille-en-queue)
        '<g class="paille-tail" data-tail>' +
          '<path d="M19.2,33 C18.4,44 18,54 17.4,62" />' +
          '<path d="M20.8,33 C21.6,44 22,54 22.6,62" />' +
        '</g>' +
        // Ailes (scaleX = battement vu de dessus)
        '<g class="paille-wings" data-wings>' +
          '<path d="M16.5,19 C11,18 5,21 2.5,27 C7,25 12,25 17,24 Z" />' +
          '<path d="M23.5,19 C29,18 35,21 37.5,27 C33,25 28,25 23,24 Z" />' +
        '</g>' +
        // Corps en goutte, nez vers le haut
        '<path class="paille-body" d="M20,5 C23,9 24,15 23.5,22 C23,29 21.5,33 20,34 ' +
          'C18.5,33 17,29 16.5,22 C16,15 17,9 20,5 Z" />' +
      '</svg>' +
    '</div>';

  hero.appendChild(layer);

  const bird     = layer.querySelector('.paille');
  const wingsGrp = layer.querySelector('[data-wings]');
  const tailGrp  = layer.querySelector('[data-tail]');
  const CW = VBW * SCALE, CH = VBH * SCALE;

  /* ── 3. Helpers géométrie ── */
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp  = (a, b, t) => a + (b - a) * t;
  const rand  = (a, b) => a + Math.random() * (b - a);

  function bezier(p0, p1, p2, p3, t) {
    const mt = 1 - t, a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    };
  }

  function heroRect() { return hero.getBoundingClientRect(); }

  // Point « perchoir » d'une lettre, en coordonnées locales au hero
  function letterPerch(span) {
    const r = span.getBoundingClientRect();
    const h = heroRect();
    return {
      x: r.left + r.width / 2 - h.left,
      y: r.top - h.top - 7, // se pose juste au-dessus de la lettre
    };
  }

  // Point aléatoire dans le ciel du hero (partie haute)
  function skyPoint() {
    const h = heroRect();
    return {
      x: rand(h.width * 0.12, h.width * 0.88),
      y: rand(h.height * 0.12, h.height * 0.52),
    };
  }

  /* ── 4. État ── */
  const SPEED = 230; // px/s de référence
  let pos   = { x: -60, y: rand(40, 120) }; // entre par le bord gauche
  let prev  = { x: pos.x, y: pos.y };
  let angle = 90;     // degrés ; base SVG = nez vers le haut
  let phase = 0;      // phase de battement d'ailes
  let lastT = 0;

  let state = 'flying';         // 'flying' | 'perched'
  let seg = null;               // segment de vol courant
  let perchSpan = null;
  let perchUntil = 0;
  let afterFlightPerch = true;  // ce vol se termine-t-il par un perchage ?
  let visible = true;

  function startFlight(endPoint, opts) {
    opts = opts || {};
    const start = { x: pos.x, y: pos.y };
    const dx = endPoint.x - start.x, dy = endPoint.y - start.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist, uy = dy / dist;
    const px = -uy, py = ux; // perpendiculaire
    const sway = rand(-1, 1) * Math.min(dist * 0.45, 170);
    const out  = dist * 0.35;
    const lift = opts.lift || 0; // remontée au décollage
    seg = {
      p0: start,
      p1: { x: start.x + ux * out + px * sway, y: start.y + uy * out + py * sway + lift },
      p2: { x: endPoint.x - ux * out + px * sway, y: endPoint.y - uy * out + py * sway },
      p3: endPoint,
      dur: clamp(dist / SPEED, 0.7, 2.6) * 1000 * (opts.durScale || 1),
      t0: performance.now(),
    };
    state = 'flying';
  }

  function planNext() {
    // Après un perchage : souvent une boucle dans le ciel, puis une autre lettre
    if (Math.random() < 0.6) {
      afterFlightPerch = false;
      startFlight(skyPoint(), { lift: -rand(50, 120), durScale: 0.9 });
    } else {
      afterFlightPerch = true;
      perchSpan = letters[(Math.random() * letters.length) | 0];
      startFlight(letterPerch(perchSpan), { lift: -rand(30, 80) });
    }
  }

  // Premier vol : entrée vers une lettre
  perchSpan = letters[(Math.random() * letters.length) | 0];
  afterFlightPerch = true;
  startFlight(letterPerch(perchSpan), { durScale: 1.1 });

  /* ── 5. Boucle d'animation ── */
  function frame(now) {
    if (!visible) { lastT = now; requestAnimationFrame(frame); return; }
    let dt = (now - lastT) / 1000;
    if (!lastT) dt = 0.016;
    dt = Math.min(dt, 0.05);
    lastT = now;

    if (state === 'flying' && seg) {
      let t = (now - seg.t0) / seg.dur;
      if (t >= 1) {
        t = 1;
        pos = { x: seg.p3.x, y: seg.p3.y };
        if (afterFlightPerch && perchSpan) {
          state = 'perched';
          perchUntil = now + rand(2200, 5200);
        } else {
          // boucle ciel terminée → viser une lettre
          afterFlightPerch = true;
          perchSpan = letters[(Math.random() * letters.length) | 0];
          startFlight(letterPerch(perchSpan), { lift: -rand(30, 70) });
        }
      } else {
        const te = t * t * (3 - 2 * t); // smoothstep : accel/décel douce
        pos = bezier(seg.p0, seg.p1, seg.p2, seg.p3, te);
      }
    } else if (state === 'perched' && perchSpan) {
      const p = letterPerch(perchSpan); // suit la lettre (parallaxe)
      const bob = Math.sin(now / 460) * 1.4;
      pos = { x: p.x, y: p.y + bob };
      if (now > perchUntil) planNext();
    }

    /* Vitesse réelle → cap + cadence de battement */
    const vx = (pos.x - prev.x) / dt;
    const vy = (pos.y - prev.y) / dt;
    const speed = Math.hypot(vx, vy);
    prev = { x: pos.x, y: pos.y };

    if (speed > 14) {
      let target = Math.atan2(vy, vx) * 180 / Math.PI + 90; // base nez en haut
      let diff = ((target - angle + 540) % 360) - 180;
      angle += diff * clamp(dt * 7, 0, 1);
    } else if (state === 'perched') {
      // au repos : se redresse doucement (nez vers le haut)
      let diff = ((0 - angle + 540) % 360) - 180;
      angle += diff * clamp(dt * 2.5, 0, 1);
    }

    /* Battement d'ailes : plus rapide en montée, plié au perchoir */
    const perched = state === 'perched';
    const flapHz = perched ? 0 : clamp(7 + (-vy) * 0.012, 5, 13);
    phase += dt * flapHz * Math.PI * 2;

    let spanX;
    if (perched) {
      spanX = 0.58; // ailes repliées
    } else {
      spanX = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(phase)); // 0.5 → 1.0
    }
    wingsGrp.setAttribute('transform',
      'translate(20,0) scale(' + spanX.toFixed(3) + ',1) translate(-20,0)');

    /* Ondulation de la queue */
    const tailSway = (perched ? 1.5 : 6) * Math.sin(phase * 0.5 + 0.6);
    tailGrp.setAttribute('transform', 'rotate(' + tailSway.toFixed(2) + ' 20 33)');

    /* Léger rebond vertical au rythme des ailes */
    const bobFly = perched ? 0 : Math.sin(phase) * 1.1;

    bird.style.transform =
      'translate(' + (pos.x - CW / 2).toFixed(2) + 'px,' +
                     (pos.y - CH / 2 + bobFly).toFixed(2) + 'px) ' +
      'rotate(' + angle.toFixed(2) + 'deg)';

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ── 6. Pause hors-écran (économie CPU) ── */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 })
      .observe(hero);
  }
})();
