/* ============================================================
   assets/js/lib/legend-dots.js
   Rôle : ajoute la pastille colorée devant chaque entrée de légende.
   Pages concernées : accueil.
   Accroches : .js-ancestry-legend-dot, .js-ancestry-legend-marker.
   ============================================================ */

/**
 * Insère un repère devant chaque légende ; sa couleur vient de la variable CSS `--c` de l'entrée.
 */
export function initLegendDots() {
  document.querySelectorAll('.js-ancestry-legend-dot').forEach((el) => {
    if (el.querySelector('.js-ancestry-legend-marker')) return;

    const dot = document.createElement('span');
    dot.className = 'ancestry-legend-marker js-ancestry-legend-marker';
    el.prepend(dot);
  });
}
