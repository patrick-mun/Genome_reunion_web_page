/* ============================================================
   assets/js/lib/scroll-reveal.js
   Rôle : apparition des blocs au défilement.
   Pages concernées : accueil, participer.
   Accroches : .js-reveal.
   ============================================================ */

/**
 * Ajoute la classe `visible` à chaque `.js-reveal` quand il entre dans l'écran.
 */
export function initScrollReveal() {
  const revealEls = document.querySelectorAll('.js-reveal');

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
    return;
  }

  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  revealEls.forEach((el) => revealObs.observe(el));
}
