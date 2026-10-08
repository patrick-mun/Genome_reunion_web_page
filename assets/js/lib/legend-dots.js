/* ============================================================
   assets/js/lib/legend-dots.js
   Rôle : ajoute la pastille colorée devant chaque entrée de légende.
   Pages concernées : accueil.
   Accroches : .js-legend-dot, .js-legend-dot-marker.
   ============================================================ */

/**
 * Insère un repère devant chaque légende ; sa couleur vient de la variable CSS `--c` de l'entrée.
 */
export function initLegendDots() {
  document.querySelectorAll('.js-legend-dot').forEach((el) => {
    if (el.querySelector('.js-legend-dot-marker')) return;

    const dot = document.createElement('span');
    dot.className = 'legend-dot-marker js-legend-dot-marker';
    el.prepend(dot);
  });
}
