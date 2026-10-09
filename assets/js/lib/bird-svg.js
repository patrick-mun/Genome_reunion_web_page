/* ============================================================
   assets/js/lib/bird-svg.js
   Rôle : dessin SVG d'un paille-en-queue (chaîne constante, sans DOM, sans couleur), ses
   dimensions, ses points de pivot et les transformations de ses ailes et de sa queue.
   Pages concernées : accueil.
   Accroches : [data-wing-left], [data-wing-right] et [data-tail], retrouvés par paille-en-queue.js.
   Les couleurs viennent des classes paille-* de pages/home/paille-en-queue.css.
   ============================================================ */

/* ── DESSIN ──
   Paille-en-queue à brins blancs vu du dessous, tête vers le haut, axe du corps en x = 50.
   Silhouette fidèle (envergure ≈ 2,1 fois le corps, ailes pointues coudées au poignet) et signes
   de l'espèce : barre noire en chevron et bout noir de chaque aile, masque noir, bec jaune orangé,
   deux longs brins. Les marques restent dans la silhouette ; un liseré blanc garde la pointe des
   ailes visible sur le ciel sombre. Chaque forme n'est écrite que pour le côté gauche.
*/

export const BIRD_VIEWBOX = { width: 100, height: 100 };
const AXIS_X = 50;

const BODY =
  'M50,7.6 C53.1,7.6 55,10 55,13.2 C55,15.4 54.4,16.9 54.6,18.4 C55.6,21.4 55.6,26.6 54.6,31 C53.6,35.6 52.8,39.6 52.4,43 L47.6,43 C47.2,39.6 46.4,35.6 45.4,31 C44.4,26.6 44.4,21.4 45.4,18.4 C45.6,16.9 45,15.4 45,13.2 C45,10 46.9,7.6 50,7.6 Z';
const BEAK = 'M50,1.6 C51,3.8 51.8,6.4 52,8.8 C50.7,9.4 49.3,9.4 48,8.8 C48.2,6.4 49,3.8 50,1.6 Z';
const TAIL_WEDGE = 'M47.2,41 C48,44.6 49,47.6 50,50 C51,47.6 52,44.6 52.8,41 Z';
const LEFT_SHAPES = {
  mask: 'M46.9,9.2 C45.7,10.9 45.2,13.2 45.5,16 C46,14.2 46.7,12.9 48,12.1 C47.6,11.2 47.2,10.2 46.9,9.2 Z',
  wing: 'M45.6,19.5 C40,17.8 32,16.8 25,17.6 C18,18.6 10,22.4 3,28.6 C9,29 15.5,29.8 21,31 C29,32.8 38,33.2 45.4,30 Z',
  wingBar: 'M41.2,30 Q35.4,23.6 27.4,18.8 Q32.4,25.8 41.2,30 Z',
  wingTip:
    'M3,28.6 C6.4,25.6 10.2,22.8 14.6,20.6 C14.8,22.6 14,24.6 12.6,26.4 C10,27.4 6.6,28.2 3,28.6 Z',
  streamer:
    'M48.2,44 C47.4,62 45.8,80 42.6,98 C43.2,98.3 43.6,98.3 43.9,98 C47.2,80 49.3,62 50.1,44 Z',
};

/* Points de pivot : chaque aile tourne à son épaule, les brins de la queue à leur base. */
export const BIRD_PIVOTS = {
  leftShoulder: { x: 45.5, y: 25 },
  rightShoulder: { x: 54.5, y: 25 },
  tail: { x: 50, y: 44 },
};

/**
 * Symétrique d'un tracé SVG par rapport à une verticale (coordonnées absolues « x,y »).
 * @param {string} path Tracé du côté gauche.
 * @param {number} axisX Abscisse de l'axe de symétrie.
 * @returns {string} Tracé du côté droit.
 */
export function mirrorPath(path, axisX) {
  return path.replace(
    /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
    (_, x, y) => `${Number((2 * axisX - Number(x)).toFixed(2))},${y}`,
  );
}

const side = (shape, isRight) => (isRight ? mirrorPath(shape, AXIS_X) : shape);

function buildWing(isRight) {
  const wing = side(LEFT_SHAPES.wing, isRight);
  return [
    `<g data-wing-${isRight ? 'right' : 'left'}>`,
    `<path class="paille-plumage" d="${wing}" />`,
    `<path class="paille-mark" d="${side(LEFT_SHAPES.wingBar, isRight)}" />`,
    `<path class="paille-mark" d="${side(LEFT_SHAPES.wingTip, isRight)}" />`,
    `<path class="paille-outline" d="${wing}" />`,
    '</g>',
  ].join('');
}

/**
 * Balisage SVG d'un oiseau. Chaque aile et la queue sont des groupes `data-*` animés séparément.
 * @returns {string} Élément `<svg>` sérialisé.
 */
export function buildBirdSvg() {
  return [
    `<svg viewBox="0 0 ${BIRD_VIEWBOX.width} ${BIRD_VIEWBOX.height}">`,
    '<g data-tail>',
    `<path class="paille-plumage" d="${LEFT_SHAPES.streamer}" />`,
    `<path class="paille-plumage" d="${side(LEFT_SHAPES.streamer, true)}" />`,
    `<path class="paille-plumage" d="${TAIL_WEDGE}" />`,
    '</g>',
    buildWing(false),
    buildWing(true),
    `<path class="paille-plumage" d="${BODY}" />`,
    `<path class="paille-mark" d="${LEFT_SHAPES.mask}" />`,
    `<path class="paille-mark" d="${side(LEFT_SHAPES.mask, true)}" />`,
    `<path class="paille-beak" d="${BEAK}" />`,
    '</svg>',
  ].join('');
}

/* ── TRANSFORMATIONS ── */

/**
 * Transformation SVG d'une aile : balayage autour de l'épaule, puis raccourcissement apparent.
 * @param {'left'|'right'} wingSide Aile concernée.
 * @param {{span: number, sweep: number}} pose Envergure apparente (1 : aile entière) et
 *   balayage vers l'avant, en degrés.
 * @returns {string} Valeur de l'attribut `transform`.
 */
export function formatWingTransform(wingSide, pose) {
  const { x, y } = wingSide === 'left' ? BIRD_PIVOTS.leftShoulder : BIRD_PIVOTS.rightShoulder;
  // Vers l'avant, l'aile gauche tourne dans le sens horaire, l'aile droite dans l'autre sens.
  const rotation = wingSide === 'left' ? pose.sweep : -pose.sweep;
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
