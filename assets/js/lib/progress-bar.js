/* ============================================================
   assets/js/lib/progress-bar.js
   Rôle : barre de progression de lecture en haut de page.
   Pages concernées : accueil, participer.
   Accroches : .js-progress (la largeur passe par la variable --progress).
   ============================================================ */

/**
 * Pose l'avancement du défilement dans la variable `--progress` de la barre.
 */
export function initProgressBar() {
  const progressEl = document.querySelector('.js-progress');
  if (!progressEl) return;

  window.addEventListener(
    'scroll',
    () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      progressEl.style.setProperty('--progress', `${ratio * 100}%`);
    },
    { passive: true },
  );
}
