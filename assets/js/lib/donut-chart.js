/* ============================================================
   assets/js/lib/donut-chart.js
   Rôle : arcs du graphique en anneau, calculés à partir des pourcentages de la légende
   (source unique) puis tracés progressivement au défilement.
   Pages concernées : accueil.
   Accroches : .js-donut (les cercles, dans l'ordre de la légende), .js-legend-pct (parts).
   Les arcs passent par --arc-length, --arc-gap et --arc-offset ; la transition est portée
   par la classe is-drawn.
   ============================================================ */

import { computeDonutArcs, parseShare } from './donut-geometry.js';
import { prefersReducedMotion } from './motion.js';

const ARC_STAGGER_MS = 120;

function setArcLength(circle, length) {
  circle.style.setProperty('--arc-length', length.toFixed(2));
}

/**
 * Lit les parts de la légende et pose sur chaque cercle son décalage et son pas de pointillé.
 * @param {SVGElement} donutSvg Anneau.
 * @returns {{circles: SVGCircleElement[], lengths: number[]}|null} Cercles et longueurs finales
 *   des arcs, ou null si la légende et l'anneau ne correspondent pas.
 */
function layoutArcs(donutSvg) {
  const circles = Array.from(donutSvg.children).filter((el) => el.tagName === 'circle');
  const shares = Array.from(document.querySelectorAll('.js-legend-pct'), (el) =>
    parseShare(el.textContent),
  );
  if (!circles.length || circles.length !== shares.length || shares.some(Number.isNaN)) {
    return null;
  }

  const radius = Number(circles[0].getAttribute('r'));
  const { circumference, arcs } = computeDonutArcs(shares, radius);
  circles.forEach((circle, i) => {
    circle.style.setProperty('--arc-gap', circumference.toFixed(2));
    circle.style.setProperty('--arc-offset', arcs[i].offset.toFixed(2));
  });
  return { circles, lengths: arcs.map((arc) => arc.length) };
}

/**
 * Trace l'anneau : tout de suite en mouvement réduit, sinon arc par arc quand il
 * entre dans l'écran.
 */
export function initDonutChart() {
  const donutSvg = document.querySelector('.js-donut');
  if (!donutSvg) return;

  const layout = layoutArcs(donutSvg);
  if (!layout) return;
  const { circles, lengths } = layout;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    circles.forEach((circle, i) => setArcLength(circle, lengths[i]));
    return;
  }

  const donutObs = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      donutSvg.classList.add('is-drawn');
      circles.forEach((circle, i) => {
        setTimeout(() => setArcLength(circle, lengths[i]), i * ARC_STAGGER_MS);
      });
      donutObs.disconnect();
    },
    { threshold: 0.4 },
  );

  donutObs.observe(donutSvg);
}
