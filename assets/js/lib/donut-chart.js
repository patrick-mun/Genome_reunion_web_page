/* ============================================================
   assets/js/lib/donut-chart.js
   Rôle : tracé progressif des arcs du graphique en anneau au défilement.
   Pages concernées : accueil.
   Accroches : .js-donut.
   ============================================================ */

const DONUT_RADIUS = 38;
const ARC_STAGGER_MS = 120;

/**
 * Anime les arcs du graphique de 0 à leur longueur finale à l'entrée dans l'écran.
 */
export function initDonutChart() {
  const donutSvg = document.querySelector('.js-donut');
  if (!donutSvg || !('IntersectionObserver' in window)) return;

  const circles = Array.from(donutSvg.children);
  if (!circles.length) return;

  const circumference = 2 * Math.PI * DONUT_RADIUS;

  const finalValues = Array.from(circles).map((c) => ({
    dasharray: c.getAttribute('stroke-dasharray'),
    dashoffset: parseFloat(c.getAttribute('stroke-dashoffset') || 0),
  }));

  circles.forEach((c) => {
    c.setAttribute('stroke-dasharray', `0 ${circumference}`);
    c.style.transition = 'none';
  });

  let animated = false;

  const donutObs = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || animated) return;
      animated = true;

      circles.forEach((c, i) => {
        const final = finalValues[i];
        setTimeout(() => {
          c.style.transition = 'stroke-dasharray 0.7s cubic-bezier(.16,1,.3,1)';
          c.setAttribute('stroke-dasharray', final.dasharray);
          c.setAttribute('stroke-dashoffset', final.dashoffset);
        }, i * ARC_STAGGER_MS);
      });

      donutObs.unobserve(donutSvg);
    },
    { threshold: 0.4 },
  );

  donutObs.observe(donutSvg);
}
