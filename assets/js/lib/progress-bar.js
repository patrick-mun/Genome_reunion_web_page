/* ============================================================
   assets/js/lib/progress-bar.js
   Rôle : barre de progression de lecture en haut de page.
   Pages concernées : accueil, participer.
   Accroches : .js-progress.
   ============================================================ */

/**
 * Pose la largeur de la barre selon le défilement de la page.
 */
export function initProgressBar() {
  const progressEl = document.querySelector('.js-progress');
  if (!progressEl) return;

  window.addEventListener(
    'scroll',
    () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressEl.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
    },
    { passive: true },
  );
}
