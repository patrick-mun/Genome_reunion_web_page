/* ── PROGRESS BAR ── */
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  document.getElementById('progress').style.width = (window.scrollY / max * 100) + '%';
});

/* ── NAV SCROLLED ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ── HERO REVEAL ── */
window.addEventListener('load', () => {
  const heroEls = [
    { id: 'hero-creole',  delay: 100 },
    { id: 'hero-title',   delay: 200 },
    { id: 'hero-body',    delay: 350 },
    { id: 'hero-actions', delay: 480 },
  ];
  heroEls.forEach(({ id, delay }) => {
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transition = 'opacity .8s cubic-bezier(.16,1,.3,1)';
      el.style.transform = 'translateY(0)';
      setTimeout(() => { el.style.transition = ''; }, 900);
    }, delay);
  });
});

/* ── SCROLL REVEAL ── */
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObs.observe(el));

/* ── STATS REVEAL + COUNTER ── */
const statItems = document.querySelectorAll('.stat-item');
const statObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      const counter = e.target.querySelector('.count');
      if (counter) {
        const target = parseInt(counter.dataset.target);
        const duration = 1200;
        const start = performance.now();
        const animate = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = Math.round(eased * target).toLocaleString('fr-FR');
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
      statObs.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
statItems.forEach((el, i) => {
  el.style.transitionDelay = (i * 0.08) + 's';
  statObs.observe(el);
});

/* ── LEGEND DOTS CSS ── */
document.querySelectorAll('.legend-dot').forEach(el => {
  const color = getComputedStyle(el).getPropertyValue('--c').trim();
  if (color) {
    const dot = document.createElement('span');
    dot.style.cssText = `width:8px;height:8px;border-radius:2px;background:${color};display:inline-block;flex-shrink:0;`;
    el.prepend(dot);
  }
});

/* ── PARALLAXE SOURIS — HERO ── */
(function() {
  const hero = document.getElementById('hero');
  const title = document.getElementById('hero-title');
  const creole = document.getElementById('hero-creole');
  const body = document.getElementById('hero-body');
  const actions = document.getElementById('hero-actions');

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let heroActive = false;

  const heroObs = new IntersectionObserver(([e]) => {
    heroActive = e.isIntersecting;
    if (!heroActive) {
      targetX = 0; targetY = 0;
    }
  }, { threshold: 0.1 });
  heroObs.observe(hero);

  hero.addEventListener('mousemove', (e) => {
    if (!heroActive) return;
    const rect = hero.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width  * 2 - 1;
    const ny = (e.clientY - rect.top)  / rect.height * 2 - 1;
    targetX = nx * 12;
    targetY = ny * 8;
  });

  hero.addEventListener('mouseleave', () => {
    targetX = 0; targetY = 0;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    currentX = lerp(currentX, targetX, 0.06);
    currentY = lerp(currentY, targetY, 0.06);

    if (title)   title.style.transform   = `translate(${currentX * 1}px, ${currentY * 1}px)`;
    if (creole)  creole.style.transform  = `translate(${currentX * .4}px, ${currentY * .4}px)`;
    if (body)    body.style.transform    = `translate(${currentX * .6}px, ${currentY * .6}px)`;
    if (actions) actions.style.transform = `translate(${currentX * .5}px, ${currentY * .5}px)`;

    requestAnimationFrame(tick);
  }
  tick();
})();

/* ── DONUT CHART — ANIMATION AU SCROLL ── */
(function() {
  const donutSvg = document.querySelector('.donut');
  if (!donutSvg) return;

  const circles = donutSvg.querySelectorAll('circle');
  const circumference = 2 * Math.PI * 38;

  const finalValues = Array.from(circles).map(c => ({
    dasharray: c.getAttribute('stroke-dasharray'),
    dashoffset: parseFloat(c.getAttribute('stroke-dashoffset') || 0)
  }));

  circles.forEach(c => {
    c.setAttribute('stroke-dasharray', `0 ${circumference}`);
    c.style.transition = 'none';
  });

  let animated = false;

  const donutObs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !animated) {
      animated = true;

      circles.forEach((c, i) => {
        const final = finalValues[i];
        setTimeout(() => {
          c.style.transition = `stroke-dasharray 0.7s cubic-bezier(.16,1,.3,1)`;
          c.setAttribute('stroke-dasharray', final.dasharray);
          c.setAttribute('stroke-dashoffset', final.dashoffset);
        }, i * 120);
      });

      donutObs.unobserve(donutSvg);
    }
  }, { threshold: 0.4 });

  donutObs.observe(donutSvg);
})();
