/* ============================================================
   assets/js/lib/hero-reveal.js
   Rôle : apparition échelonnée des éléments du hero au chargement.
   Pages concernées : accueil, participer.
   Accroches : [data-hero-reveal] (valeur = délai en millisecondes).
   ============================================================ */

/**
 * Ajoute la classe `is-revealed` à chaque élément `[data-hero-reveal]` après
 * son délai ; le CSS de l'élément porte l'apparition (opacité et décalage).
 */
export function initHeroReveal() {
  window.addEventListener('load', () => {
    document.querySelectorAll('[data-hero-reveal]').forEach((el) => {
      const delay = Number(el.dataset.heroReveal);
      setTimeout(() => {
        el.classList.add('is-revealed');
      }, delay);
    });
  });
}
