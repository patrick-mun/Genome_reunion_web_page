/* ============================================================
   assets/js/lib/bird-svg.js
   Rôle : balisage SVG d'un paille-en-queue (chaîne constante, sans DOM, sans couleur).
   Pages concernées : accueil.
   Accroches : [data-wings] et [data-tail], retrouvés par paille-en-queue.js. Les couleurs
   viennent des classes paille-* de pages/home/paille-en-queue.css.
   ============================================================ */

/**
 * Balisage SVG d'un oiseau vu de dessus. Les ailes et la queue portent des
 * attributs `data-*` pour être animées séparément.
 * @returns {string} Élément `<svg>` sérialisé.
 */
export function birdSVG() {
  return [
    '<svg viewBox="0 0 72 82">',
    '<g class="paille-tail" data-tail>',
    '<path d="M35.2,43 C34.6,55 33.6,68 32.6,80" />',
    '<path d="M36.8,43 C37.4,55 38.4,68 39.4,80" />',
    '</g>',
    '<g class="paille-wings" data-wings>',
    '<path d="M34,18 C25,12 10,16 2,35 C13,31 25,28 34,26 Z" />',
    '<path d="M38,18 C47,12 62,16 70,35 C59,31 47,28 38,26 Z" />',
    '</g>',
    '<path class="paille-body" d="M36,4 C40,12 40.8,26 38.4,41 C37.4,48 34.6,48 33.6,41 C31.2,26 32,12 36,4 Z" />',
    '<path class="paille-beak" d="M36,2 L41,8 L36.8,7 Z" />',
    '<circle class="paille-eye" cx="37.6" cy="9.5" r=".9" />',
    '</svg>',
  ].join('');
}
