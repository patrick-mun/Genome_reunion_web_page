/* ============================================================
   assets/js/lib/legend-dots.js
   Rôle : ajoute la pastille colorée devant chaque entrée de légende.
   Pages concernées : accueil.
   Accroches : .js-legend-dot, .js-legend-dot-marker.
   ============================================================ */

/**
 * Insère un repère de couleur (variable CSS `--c`) devant chaque légende.
 */
export function initLegendDots() {
  document.querySelectorAll('.js-legend-dot').forEach((el) => {
    if (el.querySelector('.js-legend-dot-marker')) return;

    const color = getComputedStyle(el).getPropertyValue('--c').trim();
    if (!color) return;

    const dot = document.createElement('span');
    dot.className = 'legend-dot-marker js-legend-dot-marker';
    dot.style.cssText = `width:8px;height:8px;border-radius:2px;background:${color};display:inline-block;flex-shrink:0;`;
    el.prepend(dot);
  });
}
