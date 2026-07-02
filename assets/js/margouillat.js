/* Margouillat des sections : gecko cartoon qui se promène au hasard en fond
   de page, sous les cartes et les textes. Le placement en profondeur repose
   sur styles.css : la couche .gecko-layer est à z-index 1 (au-dessus des
   fonds de section, statiques) et les contenus sont remontés à z-index 2.
   Le hero reste le territoire des paille-en-queue : le margouillat ne monte
   jamais au-dessus du bas du hero. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 760) return;

  const hero = document.getElementById('hero');
  if (!hero) return;

  const VBW = 90;
  const VBH = 150;
  const SCALE = 0.55;

  const SVGNS = 'http://www.w3.org/2000/svg';
  const GREEN = '#8CC152';
  const DARK = '#3E5A2B';
  const PAD = '#C8E6A0';

  /* Queue : chaîne de « bones » dont on calcule la ligne médiane par
     cinématique directe, puis on en déduit un contour qui s'effile
     régulièrement de la base vers la pointe. Une seule forme lisse,
     sans articulations visibles. */
  const TAIL_NB = 11;
  const TAIL_L = 6.0;
  const TAIL_BASE = { x: 45, y: 83.5 };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const rand = (min, max) => min + Math.random() * (max - min);

  document.querySelectorAll('.gecko-layer').forEach((oldLayer) => oldLayer.remove());

  const layer = document.createElement('div');
  layer.className = 'gecko-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  /* Gecko cartoon vu de dessus, tête vers le haut du viewBox.
     Les groupes data-* sont animés individuellement : 4 pattes (démarche en
     diagonale), queue (3 segments pour l'effilement) et tête. Le contour
     sombre des pattes et de la queue est simulé par un trait large sombre
     sous le trait vert. */
  function geckoSVG() {
    function leg(name, d, toes) {
      return '<g data-' + name + '>' +
        '<path d="' + d + '" fill="none" stroke="' + DARK + '" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="' + d + '" fill="none" stroke="' + GREEN + '" stroke-width="4.2" stroke-linecap="round"/>' +
        toes.map((t) =>
          '<circle cx="' + t[0] + '" cy="' + t[1] + '" r="2.3" fill="' + PAD + '" stroke="' + DARK + '" stroke-width="1.1"/>'
        ).join('') +
        '</g>';
    }

    return '<svg viewBox="0 0 90 150">' +
      '<g data-sway>' +
        /* la géométrie de la queue est injectée par JS et animée image par image */
        '<g data-tail>' +
          '<path data-tail-dark fill="' + DARK + '"/>' +
          '<path data-tail-green fill="' + GREEN + '"/>' +
        '</g>' +
        leg('leg-fl', 'M34,42 C25,39 19,33 15,26', [[11.5, 23], [14, 20.2], [17.6, 19.8]]) +
        leg('leg-fr', 'M56,42 C65,39 71,33 75,26', [[78.5, 23], [76, 20.2], [72.4, 19.8]]) +
        leg('leg-bl', 'M36,72 C25,72 18,77 13,85', [[9.4, 87.6], [12.3, 90.6], [16, 90.2]]) +
        leg('leg-br', 'M54,72 C65,72 72,77 77,85', [[80.6, 87.6], [77.7, 90.6], [74, 90.2]]) +
        '<path d="M45,26 C57,28 60,42 59,56 C58,72 53,82 45,86 C37,82 32,72 31,56 C30,42 33,28 45,26 Z"' +
          ' fill="' + GREEN + '" stroke="' + DARK + '" stroke-width="2.4"/>' +
        '<ellipse cx="41" cy="47" rx="2.6" ry="1.9" fill="' + DARK + '" opacity=".28"/>' +
        '<ellipse cx="51" cy="57" rx="2.4" ry="1.8" fill="' + DARK + '" opacity=".28"/>' +
        '<ellipse cx="43.5" cy="68" rx="2.2" ry="1.7" fill="' + DARK + '" opacity=".28"/>' +
        '<g data-head>' +
          '<path d="M45,4 C55,5 61,13 60,22 C59,31 53,35 45,36 C37,35 31,31 30,22 C29,13 35,5 45,4 Z"' +
            ' fill="' + GREEN + '" stroke="' + DARK + '" stroke-width="2.4"/>' +
          '<circle cx="34" cy="12" r="5" fill="#ffffff" stroke="' + DARK + '" stroke-width="1.6"/>' +
          '<circle cx="56" cy="12" r="5" fill="#ffffff" stroke="' + DARK + '" stroke-width="1.6"/>' +
          '<circle cx="34.6" cy="12.8" r="2.2" fill="#16242E"/>' +
          '<circle cx="55.4" cy="12.8" r="2.2" fill="#16242E"/>' +
          '<circle cx="41.5" cy="6.8" r=".8" fill="' + DARK + '" opacity=".55"/>' +
          '<circle cx="48.5" cy="6.8" r=".8" fill="' + DARK + '" opacity=".55"/>' +
          '<path d="M39,27 Q45,31 51,27" fill="none" stroke="' + DARK + '" stroke-width="1.7" stroke-linecap="round"/>' +
        '</g>' +
      '</g>' +
    '</svg>';
  }

  /* Construit le contour effilé de la queue pour un jeu d'angles donnés.
     angles[i] = flexion (radians) du bone i ; on avance de TAIL_L le long
     du cap courant, puis on épaissit de part et d'autre de la médiane avec
     une largeur qui décroît vers la pointe. */
  function tailOutline(angles, halfWidth, taperPow) {
    let x = TAIL_BASE.x;
    let y = TAIL_BASE.y;
    let heading = Math.PI / 2; /* vers le bas = arrière du margouillat */
    const spine = [{ x, y }];
    for (let i = 0; i < angles.length; i++) {
      heading += angles[i];
      x += Math.cos(heading) * TAIL_L;
      y += Math.sin(heading) * TAIL_L;
      spine.push({ x, y });
    }

    const n = spine.length;
    const left = [];
    const right = [];
    for (let i = 0; i < n; i++) {
      const a = spine[Math.max(0, i - 1)];
      const b = spine[Math.min(n - 1, i + 1)];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const w = halfWidth * Math.pow(1 - i / (n - 1), taperPow);
      left.push([spine[i].x - dy * w, spine[i].y + dx * w]);
      right.push([spine[i].x + dy * w, spine[i].y - dx * w]);
    }

    let d = 'M' + left[0][0].toFixed(2) + ',' + left[0][1].toFixed(2);
    for (let i = 1; i < n; i++) d += 'L' + left[i][0].toFixed(2) + ',' + left[i][1].toFixed(2);
    for (let i = n - 1; i >= 0; i--) d += 'L' + right[i][0].toFixed(2) + ',' + right[i][1].toFixed(2);
    return d + 'Z';
  }

  /* Zone de promenade en coordonnées document : toute la page sauf le hero
     (marge de 60 px sous sa limite). Recalculée à chaque nouveau déplacement
     pour suivre les changements de hauteur de page. */
  function bounds() {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.scrollHeight;
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    return {
      minX: 36,
      maxX: Math.max(140, width - 36),
      minY: heroBottom + 60,
      maxY: Math.max(heroBottom + 180, height - 56)
    };
  }

  const el = document.createElement('div');
  el.className = 'gecko';
  el.innerHTML = geckoSVG();
  layer.appendChild(el);

  const cw = VBW * SCALE;
  const ch = VBH * SCALE;
  const svg = el.querySelector('svg');
  svg.setAttribute('width', cw);
  svg.setAttribute('height', ch);

  const parts = {
    sway: el.querySelector('[data-sway]'),
    tailDark: el.querySelector('[data-tail-dark]'),
    tailGreen: el.querySelector('[data-tail-green]'),
    head: el.querySelector('[data-head]'),
    legFL: el.querySelector('[data-leg-fl]'),
    legFR: el.querySelector('[data-leg-fr]'),
    legBL: el.querySelector('[data-leg-bl]'),
    legBR: el.querySelector('[data-leg-br]')
  };

  const spawnBounds = bounds();
  const gecko = {
    pos: {
      x: rand(spawnBounds.minX, spawnBounds.maxX),
      /* apparition dans la zone haute pour être visible dès les premières sections */
      y: rand(spawnBounds.minY, Math.min(spawnBounds.maxY, spawnBounds.minY + window.innerHeight * 1.5))
    },
    prev: null,
    angle: rand(0, 360),
    state: 'pause',
    until: performance.now() + rand(700, 2200),
    targetAngle: 0,
    seg: null,
    phase: rand(0, Math.PI * 2),
    idleOff: rand(0, Math.PI * 2),
    run: 0
  };
  gecko.prev = { x: gecko.pos.x, y: gecko.pos.y };

  const pointer = { x: -1e5, y: -1e5, has: false };
  document.addEventListener('mousemove', (event) => {
    pointer.x = event.clientX + window.scrollX;
    pointer.y = event.clientY + window.scrollY;
    pointer.has = true;
  }, { passive: true });

  window.addEventListener('resize', () => {
    const b = bounds();
    gecko.pos.x = clamp(gecko.pos.x, b.minX, b.maxX);
    gecko.pos.y = clamp(gecko.pos.y, b.minY, b.maxY);
    gecko.prev = { x: gecko.pos.x, y: gecko.pos.y };
  });

  /* Choisit une destination : petits trajets fréquents, longues traversées
     occasionnelles, toujours dans la zone autorisée. */
  function pickTarget() {
    const b = bounds();
    const far = Math.random() < 0.18;
    const distance = far ? rand(420, 900) : rand(100, 340);
    const heading = rand(0, Math.PI * 2);
    const target = {
      x: clamp(gecko.pos.x + Math.cos(heading) * distance, b.minX, b.maxX),
      y: clamp(gecko.pos.y + Math.sin(heading) * distance, b.minY, b.maxY)
    };
    if (Math.hypot(target.x - gecko.pos.x, target.y - gecko.pos.y) < 50) {
      target.x = rand(b.minX, b.maxX);
      target.y = rand(b.minY, b.maxY);
    }
    return target;
  }

  /* Le margouillat pivote sur place avant de détaler, comme le vrai. */
  function beginTurnTo(target, speed) {
    gecko.state = 'turn';
    gecko.targetAngle = Math.atan2(target.y - gecko.pos.y, target.x - gecko.pos.x) * 180 / Math.PI + 90;
    gecko.seg = {
      from: { x: gecko.pos.x, y: gecko.pos.y },
      to: target,
      speed: speed || rand(230, 400)
    };
  }

  function beginDash(now) {
    const seg = gecko.seg;
    const dist = Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y);
    seg.dur = clamp(dist / seg.speed, 0.28, 4.5) * 1000;
    seg.t0 = now;
    gecko.state = 'dash';
  }

  function fleeFromPointer() {
    const b = bounds();
    const dx = gecko.pos.x - pointer.x;
    const dy = gecko.pos.y - pointer.y;
    const dist = Math.hypot(dx, dy) || 1;
    const target = {
      x: clamp(gecko.pos.x + (dx / dist) * rand(220, 360), b.minX, b.maxX),
      y: clamp(gecko.pos.y + (dy / dist) * rand(220, 360), b.minY, b.maxY)
    };
    if (Math.hypot(target.x - gecko.pos.x, target.y - gecko.pos.y) < 50) {
      target.x = rand(b.minX, b.maxX);
      target.y = rand(b.minY, b.maxY);
    }
    beginTurnTo(target, rand(430, 560));
  }

  const smoothstep = (t) => t * t * (3 - 2 * t);

  function update(now, dt) {
    if (gecko.state === 'pause') {
      if (pointer.has) {
        const dx = gecko.pos.x - pointer.x;
        const dy = gecko.pos.y - pointer.y;
        if (dx * dx + dy * dy < 110 * 110) fleeFromPointer();
      }
      if (gecko.state === 'pause' && now >= gecko.until) beginTurnTo(pickTarget());
    }

    if (gecko.state === 'turn') {
      const diff = ((gecko.targetAngle - gecko.angle + 540) % 360) - 180;
      const step = 460 * dt;
      if (Math.abs(diff) <= step || Math.abs(diff) < 4) {
        gecko.angle = gecko.targetAngle;
        beginDash(now);
      } else {
        gecko.angle += Math.sign(diff) * step;
      }
    }

    if (gecko.state === 'dash') {
      const t = clamp((now - gecko.seg.t0) / gecko.seg.dur, 0, 1);
      const eased = smoothstep(t);
      gecko.pos.x = gecko.seg.from.x + (gecko.seg.to.x - gecko.seg.from.x) * eased;
      gecko.pos.y = gecko.seg.from.y + (gecko.seg.to.y - gecko.seg.from.y) * eased;
      if (t >= 1) {
        gecko.state = 'pause';
        /* pause courte le plus souvent, longue « pose lézard » parfois */
        gecko.until = now + (Math.random() < 0.22 ? rand(4500, 9000) : rand(900, 3800));
        gecko.seg = null;
      }
    }

    const speed = Math.hypot(gecko.pos.x - gecko.prev.x, gecko.pos.y - gecko.prev.y) / dt;
    gecko.prev = { x: gecko.pos.x, y: gecko.pos.y };
    gecko.run += ((speed > 40 ? 1 : 0) - gecko.run) * clamp(dt * 6, 0, 1);

    /* La phase de pas est pilotée par la distance parcourue (un cycle de
       pattes tous les ~46 px) : les pattes s'arrêtent avec le corps. */
    gecko.phase += speed * dt * (Math.PI * 2 / 46);

    const swing = Math.sin(gecko.phase) * 24 * (0.25 + 0.75 * gecko.run);
    parts.legFL.setAttribute('transform', 'rotate(' + swing.toFixed(2) + ' 34 42)');
    parts.legFR.setAttribute('transform', 'rotate(' + (-swing).toFixed(2) + ' 56 42)');
    parts.legBL.setAttribute('transform', 'rotate(' + (-swing).toFixed(2) + ' 36 72)');
    parts.legBR.setAttribute('transform', 'rotate(' + swing.toFixed(2) + ' 54 72)');

    const bodySway = Math.sin(gecko.phase) * 3 * gecko.run;
    parts.sway.setAttribute('transform', 'rotate(' + bodySway.toFixed(2) + ' 45 56)');

    /* Onde qui se propage de la base vers la pointe : coup de fouet quand
       il court, léger balancement au repos. L'amplitude croît vers la pointe. */
    const tailAngles = new Array(TAIL_NB);
    for (let i = 0; i < TAIL_NB; i++) {
      const towardTip = 0.35 + 0.65 * (i / (TAIL_NB - 1));
      const runWave = Math.sin(gecko.phase * 0.55 - i * 0.5) * (0.05 + 0.15 * gecko.run) * towardTip;
      const idleWave = Math.sin(now * 0.0011 + gecko.idleOff - i * 0.42) * 0.05 * (1 - gecko.run) * towardTip;
      tailAngles[i] = runWave + idleWave;
    }
    parts.tailDark.setAttribute('d', tailOutline(tailAngles, 5.9, 0.72));
    parts.tailGreen.setAttribute('d', tailOutline(tailAngles, 4.6, 0.72));

    const headIdle = Math.sin(now * 0.0007 + gecko.idleOff * 2) * 9 * (1 - gecko.run);
    parts.head.setAttribute('transform', 'rotate(' + headIdle.toFixed(2) + ' 45 30)');

    el.style.transform =
      'translate(' + (gecko.pos.x - cw / 2).toFixed(2) + 'px,' +
                     (gecko.pos.y - ch / 2).toFixed(2) + 'px) ' +
      'rotate(' + gecko.angle.toFixed(2) + 'deg)';
  }

  let lastT = 0;
  function frame(now) {
    let dt = (now - lastT) / 1000;
    if (!lastT) dt = 0.016;
    dt = Math.min(dt, 0.05); /* cap pour éviter un saut de position si l'onglet était en arrière-plan */
    lastT = now;
    update(now, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
