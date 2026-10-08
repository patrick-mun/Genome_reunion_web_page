/* ============================================================
   assets/js/lib/hero-reveal.js
   Rôle : apparition échelonnée des éléments du hero au chargement.
   Pages concernées : accueil, participer.
   Accroches : [data-hero-reveal] (valeur = délai en millisecondes).
   ============================================================ */

const TRANSITION_CLEAR_DELAY_MS = 900;

/**
 * Fait apparaître chaque élément `[data-hero-reveal]` après son délai.
 * @param {{ inlineTransition: boolean }} options Pose la transition d'opacité
 *   depuis le JS quand le CSS de l'élément n'en définit pas.
 */
export function initHeroReveal({ inlineTransition }) {
  window.addEventListener('load', () => {
    document.querySelectorAll('[data-hero-reveal]').forEach((el) => {
      const delay = Number(el.dataset.heroReveal);
      setTimeout(() => {
        el.style.opacity = '1';
        if (inlineTransition) {
          el.style.transition = 'opacity .8s cubic-bezier(.16,1,.3,1)';
        }
        el.style.transform = 'translateY(0)';
        if (inlineTransition) {
          setTimeout(() => {
            el.style.transition = '';
          }, TRANSITION_CLEAR_DELAY_MS);
        }
      }, delay);
    });
  });
}
