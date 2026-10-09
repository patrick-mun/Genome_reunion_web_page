/* ============================================================
   assets/js/lib/gecko-svg.js
   Rôle : balisage SVG du margouillat (chaîne constante, sans DOM).
   Pages concernées : accueil.
   Accroches : [data-sway], [data-tail-dark], [data-tail-green], [data-head] et
   [data-leg-fl|fr|bl|br], retrouvés par margouillat.js.
   ============================================================ */

const GREEN = '#8CC152';
const DARK = '#3E5A2B';
const PAD = '#C8E6A0';

/* Le contour sombre des pattes est simulé par un trait large sombre sous le trait vert. */
function leg(name, d, toes) {
  const toeMarkup = toes
    .map(
      ([cx, cy]) =>
        `<circle cx="${cx}" cy="${cy}" r="2.3" fill="${PAD}" stroke="${DARK}" stroke-width="1.1"/>`,
    )
    .join('');
  return (
    `<g data-${name}>` +
    `<path d="${d}" fill="none" stroke="${DARK}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${GREEN}" stroke-width="4.2" stroke-linecap="round"/>` +
    `${toeMarkup}</g>`
  );
}

function legs() {
  return (
    leg('leg-fl', 'M34,42 C25,39 19,33 15,26', [
      [11.5, 23],
      [14, 20.2],
      [17.6, 19.8],
    ]) +
    leg('leg-fr', 'M56,42 C65,39 71,33 75,26', [
      [78.5, 23],
      [76, 20.2],
      [72.4, 19.8],
    ]) +
    leg('leg-bl', 'M36,72 C25,72 18,77 13,85', [
      [9.4, 87.6],
      [12.3, 90.6],
      [16, 90.2],
    ]) +
    leg('leg-br', 'M54,72 C65,72 72,77 77,85', [
      [80.6, 87.6],
      [77.7, 90.6],
      [74, 90.2],
    ])
  );
}

function body() {
  const spot = (cx, cy, rx, ry) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${DARK}" opacity=".28"/>`;
  return (
    '<path d="M45,26 C57,28 60,42 59,56 C58,72 53,82 45,86 C37,82 32,72 31,56 C30,42 33,28 45,26 Z"' +
    ` fill="${GREEN}" stroke="${DARK}" stroke-width="2.4"/>` +
    spot(41, 47, 2.6, 1.9) +
    spot(51, 57, 2.4, 1.8) +
    spot(43.5, 68, 2.2, 1.7)
  );
}

function head() {
  const eye = (cx) =>
    `<circle cx="${cx}" cy="12" r="5" fill="#ffffff" stroke="${DARK}" stroke-width="1.6"/>`;
  const pupil = (cx) => `<circle cx="${cx}" cy="12.8" r="2.2" fill="#16242E"/>`;
  const nostril = (cx) => `<circle cx="${cx}" cy="6.8" r=".8" fill="${DARK}" opacity=".55"/>`;
  return (
    '<g data-head>' +
    '<path d="M45,4 C55,5 61,13 60,22 C59,31 53,35 45,36 C37,35 31,31 30,22 C29,13 35,5 45,4 Z"' +
    ` fill="${GREEN}" stroke="${DARK}" stroke-width="2.4"/>` +
    eye(34) +
    eye(56) +
    pupil(34.6) +
    pupil(55.4) +
    nostril(41.5) +
    nostril(48.5) +
    `<path d="M39,27 Q45,31 51,27" fill="none" stroke="${DARK}" stroke-width="1.7" stroke-linecap="round"/>` +
    '</g>'
  );
}

/**
 * Balisage SVG du margouillat vu de dessus, tête vers le haut du viewBox. Les
 * groupes `data-*` sont animés individuellement : 4 pattes (démarche en
 * diagonale), queue (dont la géométrie est injectée par le JS) et tête.
 * @returns {string} Élément `<svg>` sérialisé.
 */
export function geckoSVG() {
  return (
    '<svg viewBox="0 0 90 150">' +
    '<g data-sway>' +
    '<g data-tail>' +
    `<path data-tail-dark fill="${DARK}"/>` +
    `<path data-tail-green fill="${GREEN}"/>` +
    '</g>' +
    legs() +
    body() +
    head() +
    '</g>' +
    '</svg>'
  );
}
