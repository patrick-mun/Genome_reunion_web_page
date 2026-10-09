/* ============================================================
   assets/js/lib/hero-parallax.js
   Rôle : léger décalage des textes du hero qui suit la souris.
   Pages concernées : accueil.
   Accroches : .js-hero, [data-parallax-depth] (coefficient ; décalage dans --parallax-x et --parallax-y).
   ============================================================ */

import { isMotionPaused, prefersReducedMotion } from './motion.js';

const MAX_OFFSET_X_PX = 12;
const MAX_OFFSET_Y_PX = 8;
const EASING = 0.06;

const interpolate = (a, b, t) => a + (b - a) * t;

/**
 * Déplace chaque `[data-parallax-depth]` du hero vers la position de la souris.
 */
export function initHeroParallax() {
  const hero = document.querySelector('.js-hero');
  if (!hero || !('IntersectionObserver' in window) || prefersReducedMotion()) return;

  const layers = Array.from(hero.querySelectorAll('[data-parallax-depth]')).map((el) => ({
    el,
    depth: Number(el.dataset.parallaxDepth),
  }));

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isHeroActive = false;

  const heroObs = new IntersectionObserver(
    ([e]) => {
      isHeroActive = e.isIntersecting;
      if (!isHeroActive) {
        targetX = 0;
        targetY = 0;
      }
    },
    { threshold: 0.1 },
  );
  heroObs.observe(hero);

  hero.addEventListener('mousemove', (e) => {
    if (!isHeroActive) return;
    const rect = hero.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetX = nx * MAX_OFFSET_X_PX;
    targetY = ny * MAX_OFFSET_Y_PX;
  });

  hero.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });

  function tick() {
    if (isMotionPaused()) {
      requestAnimationFrame(tick);
      return;
    }
    currentX = interpolate(currentX, targetX, EASING);
    currentY = interpolate(currentY, targetY, EASING);

    layers.forEach(({ el, depth }) => {
      el.style.setProperty('--parallax-x', `${currentX * depth}px`);
      el.style.setProperty('--parallax-y', `${currentY * depth}px`);
    });

    requestAnimationFrame(tick);
  }
  tick();
}
