/* ============================================================
   assets/js/lib/stats-counter.js
   Rôle : apparition des chiffres clés et compteur animé.
   Pages concernées : accueil.
   Accroches : .js-stat-item (délai dans --reveal-delay), .js-count (cible dans data-target).
   ============================================================ */

const COUNT_DURATION_MS = 1200;
const STAT_STAGGER_S = 0.08;

/**
 * Anime un compteur de 0 à sa valeur cible, avec une sortie progressive.
 * @param {HTMLElement} counter Élément dont `data-target` porte la valeur finale.
 */
function animateCounter(counter) {
  const target = parseInt(counter.dataset.target, 10);
  if (!Number.isFinite(target)) return;

  const start = performance.now();
  const animate = (now) => {
    const progress = Math.min((now - start) / COUNT_DURATION_MS, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.round(eased * target).toLocaleString('fr-FR');
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

/**
 * Révèle les chiffres clés et lance leur compteur à l'entrée dans l'écran.
 */
export function initStatsCounter() {
  const statItems = document.querySelectorAll('.js-stat-item');

  if (!('IntersectionObserver' in window)) {
    statItems.forEach((el) => el.classList.add('visible'));
    return;
  }

  const statObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        const counter = e.target.querySelector('.js-count');
        if (counter) animateCounter(counter);
        statObs.unobserve(e.target);
      });
    },
    { threshold: 0.4 },
  );
  statItems.forEach((el, i) => {
    el.style.setProperty('--reveal-delay', `${i * STAT_STAGGER_S}s`);
    statObs.observe(el);
  });
}
