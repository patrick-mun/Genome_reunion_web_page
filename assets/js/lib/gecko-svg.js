/* ============================================================
   assets/js/lib/gecko-svg.js
   Rôle : balisage SVG du margouillat (chaîne constante, sans DOM, sans couleur).
   Pages concernées : accueil.
   Accroches : [data-sway], [data-tail-dark], [data-tail-green], [data-head] et
   [data-leg-fl|fr|bl|br], retrouvés par margouillat.js. Les couleurs et les traits
   viennent des classes gecko-* de pages/home/margouillat.css.
   ============================================================ */

/* Le contour sombre des pattes est simulé par un trait large sombre sous le trait vert. */
function buildLeg(name, d, toes) {
  const toeMarkup = toes
    .map(([cx, cy]) => `<circle class="gecko-toe" cx="${cx}" cy="${cy}" r="2.3"/>`)
    .join('');
  return (
    `<g data-${name}>` +
    `<path class="gecko-limb-edge" d="${d}"/>` +
    `<path class="gecko-limb" d="${d}"/>` +
    `${toeMarkup}</g>`
  );
}

/**
 * Les quatre pattes, chacune de trois doigts.
 * @returns {string} Quatre groupes SVG sérialisés.
 */
function buildLegs() {
  return (
    buildLeg('leg-fl', 'M34,42 C25,39 19,33 15,26', [
      [11.5, 23],
      [14, 20.2],
      [17.6, 19.8],
    ]) +
    buildLeg('leg-fr', 'M56,42 C65,39 71,33 75,26', [
      [78.5, 23],
      [76, 20.2],
      [72.4, 19.8],
    ]) +
    buildLeg('leg-bl', 'M36,72 C25,72 18,77 13,85', [
      [9.4, 87.6],
      [12.3, 90.6],
      [16, 90.2],
    ]) +
    buildLeg('leg-br', 'M54,72 C65,72 72,77 77,85', [
      [80.6, 87.6],
      [77.7, 90.6],
      [74, 90.2],
    ])
  );
}

function buildBody() {
  const spot = (cx, cy, rx, ry) =>
    `<ellipse class="gecko-spot" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  return (
    '<path class="gecko-skin" d="M45,26 C57,28 60,42 59,56 C58,72 53,82 45,86 C37,82 32,72 31,56 C30,42 33,28 45,26 Z"/>' +
    spot(41, 47, 2.6, 1.9) +
    spot(51, 57, 2.4, 1.8) +
    spot(43.5, 68, 2.2, 1.7)
  );
}

/**
 * La tête : crâne, yeux, narines et bouche.
 * @returns {string} Groupe SVG sérialisé, animé par `[data-head]`.
 */
function buildHead() {
  const eye = (cx) => `<circle class="gecko-eye" cx="${cx}" cy="12" r="5"/>`;
  const pupil = (cx) => `<circle class="gecko-pupil" cx="${cx}" cy="12.8" r="2.2"/>`;
  const nostril = (cx) => `<circle class="gecko-nostril" cx="${cx}" cy="6.8" r=".8"/>`;
  return (
    '<g data-head>' +
    '<path class="gecko-skin" d="M45,4 C55,5 61,13 60,22 C59,31 53,35 45,36 C37,35 31,31 30,22 C29,13 35,5 45,4 Z"/>' +
    eye(34) +
    eye(56) +
    pupil(34.6) +
    pupil(55.4) +
    nostril(41.5) +
    nostril(48.5) +
    '<path class="gecko-mouth" d="M39,27 Q45,31 51,27"/>' +
    '</g>'
  );
}

/**
 * Balisage SVG du margouillat vu de dessus, tête vers le haut du viewBox. Les
 * groupes `data-*` sont animés individuellement : 4 pattes (démarche en
 * diagonale), queue (dont la géométrie est injectée par le JS) et tête.
 * @returns {string} Élément `<svg>` sérialisé.
 */
export function buildGeckoSvg() {
  return (
    '<svg viewBox="0 0 90 150">' +
    '<g data-sway>' +
    '<g data-tail>' +
    '<path class="gecko-tail-edge" data-tail-dark/>' +
    '<path class="gecko-tail" data-tail-green/>' +
    '</g>' +
    buildLegs() +
    buildBody() +
    buildHead() +
    '</g>' +
    '</svg>'
  );
}
