/* ============================================================
   assets/js/lib/bird-svg.js
   Rôle : balisage SVG d'un paille-en-queue (chaîne constante, sans DOM, sans couleur) et
   transformations de ses ailes et de sa queue.
   Pages concernées : accueil.
   Accroches : [data-wing-left], [data-wing-right] et [data-tail], retrouvés par paille-en-queue.js.
   Les couleurs viennent des classes paille-* de pages/home/paille-en-queue.css.
   ============================================================ */

/* Points de pivot dans le repère du dessin (viewBox 72 × 82, tête vers le haut) : chaque aile
   pivote à son épaule, les brins de la queue à leur base. */
export const BIRD_PIVOTS = {
  leftShoulder: { x: 34, y: 22 },
  rightShoulder: { x: 38, y: 22 },
  tail: { x: 36, y: 43 },
};

/**
 * Balisage SVG d'un oiseau vu du dessous. Chaque aile et la queue portent un attribut
 * `data-*` pour être animées séparément.
 * @returns {string} Élément `<svg>` sérialisé.
 */
export function buildBirdSvg() {
  return [
    '<svg viewBox="0 0 72 82">',
    '<g class="paille-tail" data-tail>',
    '<path d="M35.2,43 C34.6,55 33.6,68 32.6,80" />',
    '<path d="M36.8,43 C37.4,55 38.4,68 39.4,80" />',
    '</g>',
    '<g class="paille-wings">',
    '<path data-wing-left d="M34,18 C25,12 10,16 2,35 C13,31 25,28 34,26 Z" />',
    '<path data-wing-right d="M38,18 C47,12 62,16 70,35 C59,31 47,28 38,26 Z" />',
    '</g>',
    '<path class="paille-body" d="M36,4 C40,12 40.8,26 38.4,41 C37.4,48 34.6,48 33.6,41 C31.2,26 32,12 36,4 Z" />',
    '<path class="paille-beak" d="M36,2 L41,8 L36.8,7 Z" />',
    '<circle class="paille-eye" cx="37.6" cy="9.5" r=".9" />',
    '</svg>',
  ].join('');
}

/**
 * Transformation SVG d'une aile : balayage autour de l'épaule, puis raccourcissement apparent.
 * @param {'left'|'right'} side Aile concernée.
 * @param {{span: number, sweep: number}} pose Envergure apparente (1 : aile entière) et
 *   balayage vers l'avant, en degrés.
 * @returns {string} Valeur de l'attribut `transform`.
 */
export function formatWingTransform(side, pose) {
  const { x, y } = side === 'left' ? BIRD_PIVOTS.leftShoulder : BIRD_PIVOTS.rightShoulder;
  // Vers l'avant, l'aile gauche tourne dans le sens horaire, l'aile droite dans l'autre sens.
  const rotation = side === 'left' ? pose.sweep : -pose.sweep;
  return `translate(${x},${y}) rotate(${rotation.toFixed(2)}) scale(${pose.span.toFixed(3)},1) translate(${-x},${-y})`;
}

/**
 * Transformation SVG de la queue.
 * @param {number} angleDeg Rotation des brins, en degrés.
 * @returns {string} Valeur de l'attribut `transform`.
 */
export function formatTailTransform(angleDeg) {
  const { x, y } = BIRD_PIVOTS.tail;
  return `rotate(${angleDeg.toFixed(2)} ${x} ${y})`;
}
