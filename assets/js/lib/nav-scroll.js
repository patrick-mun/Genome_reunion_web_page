/* ============================================================
   assets/js/lib/nav-scroll.js
   Rôle : fond opaque de la barre de navigation une fois la page défilée.
   Pages concernées : accueil, participer.
   Accroches : .js-nav.
   ============================================================ */

const SCROLLED_THRESHOLD_PX = 60;

/**
 * Bascule la classe `is-scrolled` de la navigation selon le défilement.
 */
export function initNavScroll() {
  const nav = document.querySelector('.js-nav');
  if (!nav) return;

  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle('is-scrolled', window.scrollY > SCROLLED_THRESHOLD_PX);
    },
    { passive: true },
  );
}
