/* ============================================================
   assets/js/lib/maloya-outlines.js
   Rôle : contours continus des corps de la frise du maloya (calcul pur). Un membre (épaule,
   coude, poignet) ou un buste (hanche, taille, poitrine, épaules) est une chaîne de points ;
   son contour la suit d'un seul tenant, avec une largeur qui varie le long du corps. Les
   articulations se plient (pli à l'intérieur, arrondi à l'extérieur) au lieu de pivoter comme
   les pièces d'un pantin. Un vêtement est le contour d'une portion de la même chaîne (manche,
   pantalon), un peu plus large que la peau. Calculé à chaque image pour une centaine de
   contours : pas de trigonométrie, des vecteurs.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { buildSmoothCurves, formatNumber, lerp } from './maloya-limbs.js';

const KAPPA = 0.5523; // quart de cercle en courbe de Bézier
const MIN_SPAN = 6; // en unités : pas de point intermédiaire sur une portion plus courte
const INNER_MAX = 1.8; // creux du pli intérieur, en part de la demi-largeur
const INNER_ROOM = 0.8; // le pli s'arrête avant les points voisins (pas de boucle)

const normalize = (v) => {
  const length = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / length, y: v.y / length };
};
// Côté 0 d'une direction : la direction tournée d'un quart de tour (sens de rotate() en SVG).
const sideOf = (direction) => ({ x: -direction.y, y: direction.x });

/**
 * Niveau d'un contour : centre, demi-largeurs de part et d'autre, et côté 0.
 * @typedef {{center: {x: number, y: number}, half: number[],
 *   normal: {x: number, y: number}}} OutlineLevel
 *   `half[0]` du côté de `normal` (vecteur unitaire), `half[1]` à l'opposé. Pour une chaîne
 *   qui descend (épaule → poignet), ce côté est la gauche de l'écran ; pour un buste qui monte,
 *   l'avant d'un personnage tourné vers +x.
 */

function measureChain(chain) {
  const lengths = [0];
  for (let i = 1; i < chain.length; i++) {
    const segment = Math.hypot(chain[i].x - chain[i - 1].x, chain[i].y - chain[i - 1].y);
    lengths.push(lengths[i - 1] + segment);
  }
  const total = lengths[lengths.length - 1] || 1;
  return { total, nodes: lengths.map((length) => length / total) };
}

function findSegment(nodes, s) {
  let i = 0;
  while (i < nodes.length - 2 && s > nodes[i + 1]) i++;
  return { i, t: (s - nodes[i]) / (nodes[i + 1] - nodes[i] || 1) };
}

// Articulation : le niveau suit la bissectrice ; l'extérieur s'arrondit, l'intérieur se creuse
// jusqu'au croisement des deux bords, sans dépasser les niveaux voisins.
function bendJoint(chain, index, half, room) {
  const [a, b, c] = [chain[index - 1], chain[index], chain[index + 1]];
  const before = normalize({ x: b.x - a.x, y: b.y - a.y });
  const after = normalize({ x: c.x - b.x, y: c.y - b.y });
  const direction = normalize({ x: before.x + after.x, y: before.y + after.y });
  const cosHalf = Math.max(before.x * direction.x + before.y * direction.y, 0.2);
  const sinHalf = Math.sqrt(1 - cosHalf * cosHalf);
  // Le côté half[0] est intérieur quand la chaîne tourne vers lui.
  const turnsToFirst = before.x * after.y - before.y * after.x > 0;
  const limit = sinHalf > 1e-3 ? (INNER_ROOM * room) / sinHalf : Infinity;
  const inner = (h) => Math.min(h / cosHalf, INNER_MAX * h, limit);
  const outer = (h) => (h * (1 + 1 / cosHalf)) / 2;
  return {
    normal: sideOf(direction),
    half: turnsToFirst ? [inner(half[0]), outer(half[1])] : [outer(half[0]), inner(half[1])],
  };
}

function listStops(nodes, from, to, total) {
  const stops = [from];
  const add = (s) => {
    const previous = stops[stops.length - 1];
    if ((s - previous) * total > MIN_SPAN) stops.push((previous + s) / 2);
    stops.push(s);
  };
  for (let i = 1; i < nodes.length - 1; i++) {
    if (nodes[i] > from + 1e-6 && nodes[i] < to - 1e-6) add(nodes[i]);
  }
  add(to);
  return stops;
}

/**
 * Niveaux d'un contour le long d'une chaîne, entre deux fractions de sa longueur : bornes,
 * articulations comprises, et milieux des portions assez longues.
 * @param {Array<{x: number, y: number}>} chain Points de la chaîne (au moins 2).
 * @param {number[][]} widths Demi-largeurs [côté 0, côté 1] à chaque point de la chaîne.
 * @param {number} [from] Début, en fraction de la longueur (0 : premier point).
 * @param {number} [to] Fin, en fraction de la longueur (1 : dernier point).
 * @returns {OutlineLevel[]} Niveaux, du début à la fin.
 */
export function sampleChain(chain, widths, from = 0, to = 1) {
  const { total, nodes } = measureChain(chain);
  const stops = listStops(nodes, from, to, total);
  return stops.map((s, k) => {
    const { i, t } = findSegment(nodes, s);
    const half = [lerp(widths[i][0], widths[i + 1][0], t), lerp(widths[i][1], widths[i + 1][1], t)];
    const isJoint = t === 1 && i + 1 < nodes.length - 1 && k > 0 && k < stops.length - 1;
    if (isJoint) {
      const room = Math.min(s - stops[k - 1], stops[k + 1] - s) * total;
      return { center: chain[i + 1], ...bendJoint(chain, i + 1, half, room) };
    }
    const start = chain[i];
    const end = chain[i + 1];
    return {
      center: { x: lerp(start.x, end.x, t), y: lerp(start.y, end.y, t) },
      half,
      normal: sideOf(normalize({ x: end.x - start.x, y: end.y - start.y })),
    };
  });
}

const sidePoint = ({ center, half, normal }, side) => {
  const h = side === 0 ? half[0] : -half[1];
  return { x: center.x + h * normal.x, y: center.y + h * normal.y };
};
const format = (x, y) => `${formatNumber(x)},${formatNumber(y)}`;

// Bout arrondi (demi-ellipse) d'un bord à l'autre, bombé dans le sens `forward` (+1 : vers la
// suite de la chaîne, -1 : vers l'arrière). `bulge` : hauteur de l'arrondi en part du rayon.
function buildCap({ center, half, normal: n }, forward, bulge) {
  const d = { x: forward * n.y, y: -forward * n.x };
  const radius = (half[0] + half[1]) / 2;
  const shift = (half[0] - half[1]) / 2;
  const cx = center.x + n.x * shift;
  const cy = center.y + n.y * shift;
  const along = radius * bulge;
  const at = (u, v) => format(cx + n.x * u + d.x * v, cy + n.y * u + d.y * v);
  // Du côté 0 (où le tracé arrive) vers le côté 1 au bout de fin, dans l'autre sens au début.
  const r = forward > 0 ? radius : -radius;
  return (
    `C${at(r, along * KAPPA)} ${at(r * KAPPA, along)} ${at(0, along)}` +
    ` C${at(-r * KAPPA, along)} ${at(-r, along * KAPPA)} ${at(-r, 0)}`
  );
}

/**
 * Contour fermé passant par les bords de ses niveaux : un bord du début à la fin, le bout de
 * fin, l'autre bord en revenant, le bout de début. Un bout est droit (`flat`) ou arrondi.
 * @param {OutlineLevel[]} levels Niveaux, du début à la fin (au moins 2).
 * @param {{start?: number|'flat', end?: number|'flat'}} [caps] Bouts : 'flat', ou hauteur de
 *   l'arrondi en part du rayon (1 : demi-cercle). Arrondis par défaut.
 * @returns {string} Attribut `d`.
 */
export function buildBandOutline(levels, caps = {}) {
  const first = levels.map((level) => sidePoint(level, 0));
  const second = levels.map((level) => sidePoint(level, 1)).reverse();
  const startCap = caps.start ?? 1;
  const endCap = caps.end ?? 1;
  const last = levels[levels.length - 1];
  return [
    `M${format(first[0].x, first[0].y)}`,
    buildSmoothCurves(first),
    endCap === 'flat' ? `L${format(second[0].x, second[0].y)}` : buildCap(last, 1, endCap),
    buildSmoothCurves(second),
    startCap === 'flat' ? 'Z' : `${buildCap(levels[0], -1, startCap)} Z`,
  ].join(' ');
}

/**
 * Contour d'une portion de chaîne (membre, manche, pantalon, buste de profil).
 * @param {Array<{x: number, y: number}>} chain Points de la chaîne.
 * @param {number[][]} widths Demi-largeurs [côté 0, côté 1] à chaque point.
 * @param {{from?: number, to?: number, start?: number|'flat', end?: number|'flat'}} [options]
 *   Portion (fractions de la longueur) et bouts (voir buildBandOutline).
 * @returns {string} Attribut `d`.
 */
export function buildChainOutline(chain, widths, options = {}) {
  const levels = sampleChain(chain, widths, options.from ?? 0, options.to ?? 1);
  return buildBandOutline(levels, options);
}
