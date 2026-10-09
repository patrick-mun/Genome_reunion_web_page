/* ============================================================
   assets/js/lib/maloya-outlines.js
   Rôle : contours continus des corps de la frise du maloya (calcul pur). Un membre (épaule,
   coude, poignet) ou un buste (hanche, taille, poitrine, épaules) est une chaîne de points ;
   son contour la suit d'un seul tenant, avec une largeur qui varie le long du corps. Les
   articulations se plient (pli à l'intérieur, arrondi à l'extérieur) au lieu de pivoter comme
   les pièces d'un pantin. Un vêtement est le contour d'une portion de la même chaîne (manche,
   pantalon), un peu plus large que la peau.
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
const angleOf = (v) => (Math.atan2(v.y, v.x) * 180) / Math.PI;

/**
 * Niveau d'un contour : centre, demi-largeurs de part et d'autre, et orientation.
 * @typedef {{center: {x: number, y: number}, half: number[], angle: number}} OutlineLevel
 *   `half[0]` du côté de `angle` (vecteur (1, 0) tourné de `angle`), `half[1]` à l'opposé.
 *   Pour une chaîne qui descend (épaule → poignet), ce côté est la gauche de l'écran ; pour
 *   un buste qui monte, l'avant d'un personnage tourné vers +x.
 */

function measureChain(chain) {
  const lengths = chain.slice(1).map((p, i) => Math.hypot(p.x - chain[i].x, p.y - chain[i].y));
  const total = lengths.reduce((sum, l) => sum + l, 0) || 1;
  const nodes = [0];
  lengths.forEach((l, i) => nodes.push(nodes[i] + l / total));
  return { total, nodes };
}

function interpolateHalf(widths, nodes, s) {
  let i = 0;
  while (i < nodes.length - 2 && s > nodes[i + 1]) i++;
  const t = (s - nodes[i]) / (nodes[i + 1] - nodes[i] || 1);
  return [lerp(widths[i][0], widths[i + 1][0], t), lerp(widths[i][1], widths[i + 1][1], t)];
}

function locateOnSegment(chain, nodes, s) {
  let i = 0;
  while (i < nodes.length - 2 && s > nodes[i + 1]) i++;
  const t = (s - nodes[i]) / (nodes[i + 1] - nodes[i] || 1);
  const from = chain[i];
  const to = chain[i + 1];
  const direction = normalize({ x: to.x - from.x, y: to.y - from.y });
  return { center: { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) }, direction };
}

// Articulation : le niveau suit la bissectrice ; l'extérieur s'arrondit, l'intérieur se creuse
// jusqu'au croisement des deux bords, sans dépasser les niveaux voisins.
function bendJoint(chain, index, half, room) {
  const before = normalize({
    x: chain[index].x - chain[index - 1].x,
    y: chain[index].y - chain[index - 1].y,
  });
  const after = normalize({
    x: chain[index + 1].x - chain[index].x,
    y: chain[index + 1].y - chain[index].y,
  });
  const direction = normalize({ x: before.x + after.x, y: before.y + after.y });
  const cosHalf = Math.max(before.x * direction.x + before.y * direction.y, 0.2);
  const sinHalf = Math.sqrt(1 - cosHalf * cosHalf);
  // Le côté half[0] est intérieur quand la chaîne tourne vers lui.
  const turnsToFirst = before.x * after.y - before.y * after.x > 0;
  const limit = sinHalf > 1e-3 ? (INNER_ROOM * room) / sinHalf : Infinity;
  const inner = (h) => Math.min(h / cosHalf, INNER_MAX * h, limit);
  const outer = (h) => (h * (1 + 1 / cosHalf)) / 2;
  return {
    direction,
    half: turnsToFirst ? [inner(half[0]), outer(half[1])] : [outer(half[0]), inner(half[1])],
  };
}

function listStops(nodes, from, to, total) {
  const joints = nodes.slice(1, -1).filter((s) => s > from + 1e-6 && s < to - 1e-6);
  const stops = [from, ...joints, to];
  return stops.flatMap((s, i) => {
    if (i === 0) return [s];
    const previous = stops[i - 1];
    return (s - previous) * total > MIN_SPAN ? [(previous + s) / 2, s] : [s];
  });
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
    const half = interpolateHalf(widths, nodes, s);
    const joint = nodes.findIndex((node, i) => i > 0 && i < nodes.length - 1 && node === s);
    if (joint > 0 && k > 0 && k < stops.length - 1) {
      const room = Math.min(s - stops[k - 1], stops[k + 1] - s) * total;
      const bent = bendJoint(chain, joint, half, room);
      return { center: chain[joint], half: bent.half, angle: angleOf(bent.direction) + 90 };
    }
    const { center, direction } = locateOnSegment(chain, nodes, s);
    return { center, half, angle: angleOf(direction) + 90 };
  });
}

const sidePoint = (level, side) => {
  const a = (level.angle * Math.PI) / 180;
  const h = side === 0 ? level.half[0] : -level.half[1];
  return { x: level.center.x + h * Math.cos(a), y: level.center.y + h * Math.sin(a) };
};
const format = (p) => `${formatNumber(p.x)},${formatNumber(p.y)}`;

// Bout arrondi (demi-ellipse) d'un bord à l'autre, bombé dans le sens `forward` (+1 : vers la
// suite de la chaîne, -1 : vers l'arrière). `bulge` : hauteur de l'arrondi en part du rayon.
function buildCap(level, forward, bulge) {
  const a = (level.angle * Math.PI) / 180;
  const n = { x: Math.cos(a), y: Math.sin(a) };
  const d = { x: forward * n.y, y: -forward * n.x };
  const radius = (level.half[0] + level.half[1]) / 2;
  const shift = (level.half[0] - level.half[1]) / 2;
  const center = { x: level.center.x + n.x * shift, y: level.center.y + n.y * shift };
  const along = radius * bulge;
  const at = (u, v) => ({ x: center.x + n.x * u + d.x * v, y: center.y + n.y * u + d.y * v });
  // Du côté 0 (où le tracé arrive) vers le côté 1 au bout de fin, dans l'autre sens au début.
  const sign = forward > 0 ? 1 : -1;
  const tip = at(0, along);
  const end = at(-sign * radius, 0);
  return [
    `C${format(at(sign * radius, along * KAPPA))} ${format(at(sign * radius * KAPPA, along))} ${format(tip)}`,
    `C${format(at(-sign * radius * KAPPA, along))} ${format(at(-sign * radius, along * KAPPA))} ${format(end)}`,
  ].join(' ');
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
  return [
    `M${format(first[0])}`,
    buildSmoothCurves(first),
    endCap === 'flat' ? `L${format(second[0])}` : buildCap(levels[levels.length - 1], 1, endCap),
    buildSmoothCurves(second),
    startCap === 'flat' ? '' : buildCap(levels[0], -1, startCap),
    'Z',
  ]
    .filter(Boolean)
    .join(' ');
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
