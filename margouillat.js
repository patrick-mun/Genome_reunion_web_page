/* ════════════════════════════════════════════════════════════════
   MARGOUILLAT — le petit gecko des murs réunionnais
   Version sobre : longe la marge gauche, suit discrètement le scroll,
   se déplace par petits sprints puis se fige (et fait parfois une
   pompe). Adapte sa couleur au fond clair / sombre.
   N'apparaît PAS dans la dernière section (#participer) ni le footer.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  if (window.innerWidth < 900) return; // marge trop étroite sur petit écran

  // Sections autorisées (entre le hero et la dernière section)
  const ids = ['probleme', 'change', 'carrefour', 'methode', 'outils', 'equipe'];
  const allowed = ids.map((id) => document.getElementById(id)).filter(Boolean);
  const lastSection = document.getElementById('participer');
  if (!allowed.length || !lastSection) return;

  /* ── Couleur de fond (clair/sombre) de chaque section, calculée une fois ── */
  function luminance(rgb) {
    const m = rgb.match(/\d+/g);
    if (!m) return 255;
    return 0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2];
  }
  allowed.forEach((s) => {
    let bg = getComputedStyle(s).backgroundColor;
    if (!bg || bg === 'transparent' || bg.includes('rgba(0, 0, 0, 0)')) bg = 'rgb(251,250,247)';
    s._geckoDark = luminance(bg) < 128; // fond sombre → margouillat clair
  });

  const DARK_TONE  = '#2b2b2b';   // sur fond clair
  const LIGHT_TONE = '#CFE3EA';   // sur fond sombre

  /* ── Couche + silhouette SVG ── */
  const layer = document.createElement('div');
  layer.className = 'gecko-layer';
  layer.setAttribute('aria-hidden', 'true');

  const S = 0.48, VBW = 52, VBH = 116;
  const CW = VBW * S, CH = VBH * S;

  const el = document.createElement('div');
  el.className = 'gecko';
  el.style.width = CW + 'px';
  el.style.height = CH + 'px';
  el.innerHTML =
    '<svg width="' + CW + '" height="' + CH + '" viewBox="0 0 ' + VBW + ' ' + VBH + '">' +
      '<g fill="currentColor">' +
        // queue longue qui s'enroule (derrière)
        '<g data-tail>' +
          '<path d="M24,54 C22,66 20.5,80 23,92 C25,100 24,108 18.5,111 ' +
                  'C14,113.5 9.5,111 9,105.5 C8.7,102 11.5,101 12.5,103 ' +
                  'C13.7,104.5 15.5,104 15.5,101.5 C16,92 13.5,80 15,66 ' +
                  'C16,59 18.5,55 24,54 Z"/>' +
        '</g>' +
        // pattes arrière (coudées, doigts écartés)
        '<g data-hind>' +
          '<path d="M19,50 C14,52 9,54 6,57 C4,59 3,62 3.4,65 L5.4,64.6 ' +
                  'C5,62 6,59 8,57 C10.5,55 15,53 19,52 Z"/>' +
          '<path d="M33,50 C38,52 43,54 46,57 C48,59 49,62 48.6,65 L46.6,64.6 ' +
                  'C47,62 46,59 44,57 C41.5,55 37,53 33,52 Z"/>' +
          '<circle cx="2" cy="69" r="1.5"/><circle cx="1" cy="66" r="1.4"/><circle cx="3.4" cy="70.5" r="1.4"/><circle cx="5.2" cy="68" r="1.3"/>' +
          '<circle cx="50" cy="69" r="1.5"/><circle cx="51" cy="66" r="1.4"/><circle cx="48.6" cy="70.5" r="1.4"/><circle cx="46.8" cy="68" r="1.3"/>' +
        '</g>' +
        // pattes avant (coudées, doigts écartés)
        '<g data-front>' +
          '<path d="M20,27 C15,26 10,25 7,22 C5,20 4,17 4.2,14 L6.2,14.2 ' +
                  'C6,17 7,20 9,22 C11.5,24 16,25.5 20,25 Z"/>' +
          '<path d="M32,27 C37,26 42,25 45,22 C47,20 48,17 47.8,14 L45.8,14.2 ' +
                  'C46,17 45,20 43,22 C40.5,24 36,25.5 32,25 Z"/>' +
          '<circle cx="3" cy="10" r="1.5"/><circle cx="2" cy="13" r="1.4"/><circle cx="4.4" cy="9" r="1.4"/><circle cx="6" cy="11" r="1.3"/>' +
          '<circle cx="49" cy="10" r="1.5"/><circle cx="50" cy="13" r="1.4"/><circle cx="47.6" cy="9" r="1.4"/><circle cx="46" cy="11" r="1.3"/>' +
        '</g>' +
        // corps allongé + tête triangulaire (au-dessus)
        '<g data-body>' +
          '<path d="M26,7 C30.5,8 33,12 33,17 C33,20.5 31.5,22 30.5,24 ' +
                  'C35,29 36,35 34.5,41 C33.5,47 31,52 27.5,55 L24.5,55 ' +
                  'C21,52 18.5,47 17.5,41 C16,35 17,29 21.5,24 ' +
                  'C20.5,22 19,20.5 19,17 C19,12 21.5,8 26,7 Z"/>' +
        '</g>' +
      '</g>' +
    '</svg>';

  layer.appendChild(el);
  document.body.appendChild(layer);

  const tailG  = el.querySelector('[data-tail]');
  const frontG = el.querySelector('[data-front]');
  const hindG  = el.querySelector('[data-hind]');

  /* ── Helpers ── */
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const rand  = (a, b) => a + Math.random() * (b - a);

  function zoneTop()    { return allowed[0].offsetTop; }
  function zoneBottom() { return lastSection.offsetTop; }
  function gutterX()    { return 26 + rand(-5, 7); }

  function sectionDarkAt(y) {
    for (const s of allowed) {
      const top = s.offsetTop;
      if (y >= top && y < top + s.offsetHeight) return s._geckoDark;
    }
    return allowed[0]._geckoDark;
  }

  /* ── État ── */
  const PAD = 64;
  let x = 26;
  let y = zoneTop() + 60;
  let heading = 180;          // 0 = tête en haut, 180 = tête en bas
  let move = 0;               // 0..1, intensité de mouvement (lissée)
  let curDark = null;

  let state = 'frozen';       // 'frozen' | 'darting'
  let freezeUntil = performance.now() + 600;
  let dart = null;            // { x0,y0,x1,y1,t0,dur }
  let pushStart = -1, pushDur = 0;

  function startDart(tx, ty) {
    const dist = Math.hypot(tx - x, ty - y) || 1;
    dart = {
      x0: x, y0: y, x1: tx, y1: ty,
      t0: performance.now(),
      dur: clamp(dist / rand(700, 1080), 0.14, 0.5) * 1000,
    };
    heading = (ty - y) >= 0 ? 180 : 0; // tête dans le sens de la course
    state = 'darting';
  }

  function decide(now) {
    const top = zoneTop() + PAD;
    const bottom = zoneBottom() - PAD;
    const desired = clamp(window.scrollY + window.innerHeight * 0.58, top, bottom);
    const dy = desired - y;

    if (Math.abs(dy) > 70) {
      // rattrape la zone de lecture par bonds
      const step = clamp(dy, -240, 240);
      startDart(gutterX(), clamp(y + step, top, bottom));
    } else if (Math.random() < 0.32) {
      // petite pompe territoriale
      pushStart = now; pushDur = 660;
      freezeUntil = now + rand(900, 1900);
    } else if (Math.random() < 0.4) {
      // micro-déplacement de guettage
      startDart(gutterX(), clamp(y + rand(-42, 42), top, bottom));
    } else {
      freezeUntil = now + rand(800, 2400);
    }
  }

  /* ── Boucle ── */
  let lastT = 0;
  function frame(now) {
    let dt = (now - lastT) / 1000;
    if (!lastT) dt = 0.016;
    dt = Math.min(dt, 0.05);
    lastT = now;

    if (state === 'darting' && dart) {
      const t = (now - dart.t0) / dart.dur;
      if (t >= 1) {
        x = dart.x1; y = dart.y1;
        const reached = Math.abs(y - clamp(window.scrollY + window.innerHeight * 0.58,
          zoneTop() + PAD, zoneBottom() - PAD)) < 70;
        freezeUntil = now + (reached ? rand(700, 2200) : rand(120, 340));
        state = 'frozen';
      } else {
        const e = 1 - Math.pow(1 - t, 3); // démarre vif, s'arrête net
        x = dart.x0 + (dart.x1 - dart.x0) * e;
        y = dart.y0 + (dart.y1 - dart.y0) * e;
      }
    } else if (now > freezeUntil) {
      decide(now);
    }

    // intensité de mouvement lissée
    const moving = state === 'darting' ? 1 : 0;
    move += (moving - move) * clamp(dt * 8, 0, 1);

    // couleur selon le fond
    const dark = sectionDarkAt(y);
    if (dark !== curDark) {
      curDark = dark;
      el.style.color = dark ? LIGHT_TONE : DARK_TONE;
    }

    // dandinement + pattes + queue
    const wiggle = move * 4 * Math.sin(now / 52);
    const legA = move * 6 * Math.sin(now / 60);
    frontG.setAttribute('transform', 'rotate(' + legA.toFixed(2) + ' 26 26)');
    hindG.setAttribute('transform', 'rotate(' + (-legA).toFixed(2) + ' 26 50)');
    const tailSway = (2 + move * 5) * Math.sin(now / 190);
    tailG.setAttribute('transform', 'rotate(' + tailSway.toFixed(2) + ' 26 54)');

    // pompe (scale pulsé)
    let scale = 1;
    if (now < pushStart + pushDur) {
      const p = (now - pushStart) / pushDur;
      scale = 1 + 0.12 * Math.sin(p * Math.PI * 3) * (1 - p);
    }

    // rendu (saute le DOM si hors écran)
    const vy = y - window.scrollY;
    if (vy > -CH - 80 && vy < window.innerHeight + 80) {
      el.style.left = (x - CW / 2).toFixed(2) + 'px';
      el.style.top  = (y - CH / 2).toFixed(2) + 'px';
      el.style.transform = 'rotate(' + (heading + wiggle).toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      el.style.visibility = 'visible';
    } else {
      el.style.visibility = 'hidden';
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
