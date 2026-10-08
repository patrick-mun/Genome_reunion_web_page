/* ============================================================
   assets/js/lib/motion-toggle.js
   Rôle : bouton « Mettre en pause les animations » (WCAG 2.2.2).
   Pages concernées : accueil, participer.
   Accroches : .js-motion-toggle.
   ============================================================ */

import { setMotionPaused } from './motion.js';

const LABEL_PAUSE = 'Mettre en pause les animations';
const LABEL_RESUME = 'Reprendre les animations';

/**
 * Branche le bouton qui suspend ou relance les animations décoratives.
 */
export function initMotionToggle() {
  const button = document.querySelector('.js-motion-toggle');
  if (!button) return;

  button.addEventListener('click', () => {
    const paused = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? LABEL_RESUME : LABEL_PAUSE;
    setMotionPaused(paused);
  });
}
