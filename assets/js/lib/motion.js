/* ============================================================
   assets/js/lib/motion.js
   Rôle : état du mouvement décoratif (préférence système et pause manuelle).
   Pages concernées : toutes.
   Accroches : classe d'état is-motion-paused posée sur <html>.
   ============================================================ */

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let isPaused = false;

/**
 * Indique si la personne a demandé de réduire les animations dans son système.
 * @returns {boolean} Vrai si `prefers-reduced-motion: reduce` est actif.
 */
export function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

/**
 * Indique si les animations ont été mises en pause avec le bouton de la page.
 * @returns {boolean} Vrai si la pause est active.
 */
export function isMotionPaused() {
  return isPaused;
}

/**
 * Met en pause ou relance les animations décoratives. Le CSS suspend les
 * animations par la classe `is-motion-paused` ; les boucles JS lisent `isMotionPaused`.
 * @param {boolean} value Vrai pour mettre en pause.
 */
export function setMotionPaused(value) {
  isPaused = value;
  document.documentElement.classList.toggle('is-motion-paused', isPaused);
}
