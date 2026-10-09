/* ============================================================
   assets/js/lib/maloya-limbs.js
   Rôle : géométrie des personnages de la frise du maloya (calcul pur) : interpolation,
   rotation de points, cinématique inverse à deux segments (bras, jambes), tracé lissé.
   Convention : y vers le bas (SVG), angles en degrés, positifs dans le sens horaire.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { clamp, computeSmoothstep } from './geometry.js';

/**
 * Interpolation linéaire.
 * @param {number} a Valeur de départ.
 * @param {number} b Valeur d'arrivée.
 * @param {number} t Progression (0 : a, 1 : b).
 * @returns {number} Valeur interpolée.
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Interpolation linéaire entre deux points.
 * @param {{x: number, y: number}} p Point de départ.
 * @param {{x: number, y: number}} q Point d'arrivée.
 * @param {number} t Progression (0 : p, 1 : q).
 * @returns {{x: number, y: number}} Point interpolé.
 */
export function lerpPoint(p, q, t) {
  return { x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) };
}

/**
 * Transition douce de 0 à 1 entre deux bornes.
 * @param {number} edge0 Début de la transition.
 * @param {number} edge1 Fin de la transition.
 * @param {number} x Valeur courante.
 * @returns {number} 0 avant `edge0`, 1 après `edge1`, courbe en S entre les deux.
 */
export function computeEdgeSmoothstep(edge0, edge1, x) {
  return computeSmoothstep(clamp((x - edge0) / (edge1 - edge0), 0, 1));
}

/**
 * Tourne un vecteur dans le sens horaire de l'écran (même sens que `rotate()` en SVG).
 * @param {{x: number, y: number}} v Vecteur.
 * @param {number} deg Angle, en degrés.
 * @returns {{x: number, y: number}} Vecteur tourné.
 */
export function rotatePoint(v, deg) {
  const a = (deg * Math.PI) / 180;
  return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) };
}

/**
 * Somme d'un point et d'un vecteur.
 * @param {{x: number, y: number}} p Point.
 * @param {{x: number, y: number}} v Vecteur.
 * @returns {{x: number, y: number}} Point déplacé.
 */
export function addPoints(p, v) {
  return { x: p.x + v.x, y: p.y + v.y };
}

/**
 * Rotation SVG d'un segment dessiné vers le bas (+y) pour qu'il aille d'un point à l'autre.
 * @param {{x: number, y: number}} from Origine du segment.
 * @param {{x: number, y: number}} to Extrémité visée.
 * @returns {number} Angle de `rotate()`, en degrés.
 */
export function computeBoneAngle(from, to) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI - 90;
}

/**
 * Cinématique inverse à deux segments (épaule-coude-poignet, hanche-genou-cheville). Hors de
 * portée, le membre se tend vers la cible sans la dépasser.
 * @param {{x: number, y: number}} root Articulation racine.
 * @param {{x: number, y: number}} target Extrémité visée.
 * @param {number} upper Longueur du premier segment.
 * @param {number} lower Longueur du second segment.
 * @param {number} bendSign Côté du pli, de -1 à 1 : +1 tourne le premier segment dans le sens
 *   horaire par rapport à la droite racine-cible, -1 dans l'autre sens. Une valeur
 *   intermédiaire redresse le membre : passer par 0 change de côté sans saut, membre tendu.
 * @returns {{joint: {x: number, y: number}, end: {x: number, y: number}, bend: number,
 *   shortfall: number}} Articulation du milieu, extrémité atteinte, angle intérieur du milieu
 *   (180 : membre tendu) et distance restant jusqu'à la cible.
 */
export function solveTwoBone(root, target, upper, lower, bendSign) {
  const distance = clamp(
    Math.hypot(target.x - root.x, target.y - root.y),
    Math.abs(upper - lower) + 1e-6,
    upper + lower - 1e-6,
  );
  const base = Math.atan2(target.y - root.y, target.x - root.x);
  const spread = Math.acos(
    clamp((upper * upper + distance * distance - lower * lower) / (2 * upper * distance), -1, 1),
  );
  const angle = base + bendSign * spread;
  const joint = { x: root.x + upper * Math.cos(angle), y: root.y + upper * Math.sin(angle) };
  const reach = Math.atan2(target.y - joint.y, target.x - joint.x);
  const end = { x: joint.x + lower * Math.cos(reach), y: joint.y + lower * Math.sin(reach) };
  const dot = (root.x - joint.x) * (end.x - joint.x) + (root.y - joint.y) * (end.y - joint.y);
  return {
    joint,
    end,
    bend: (Math.acos(clamp(dot / (upper * lower), -1, 1)) * 180) / Math.PI,
    shortfall: Math.hypot(target.x - end.x, target.y - end.y),
  };
}

/**
 * Nombre arrondi au centième, écrit pour un tracé ou une transformation (« -12.5 », « 3.07 »,
 * « 0 »). Écrit à la main : plusieurs fois plus rapide que toFixed, sur les milliers de
 * nombres de chaque image.
 * @param {number} n Nombre.
 * @returns {string} Nombre écrit, sans zéro inutile.
 */
export function formatNumber(n) {
  const rounded = Math.round(n * 100);
  const abs = rounded < 0 ? -rounded : rounded;
  const units = Math.floor(abs / 100);
  const cents = abs - units * 100;
  let decimals = '';
  if (cents >= 10) decimals = cents % 10 === 0 ? `.${cents / 10}` : `.${cents}`;
  else if (cents > 0) decimals = `.0${cents}`;
  return `${rounded < 0 ? '-' : ''}${units}${decimals}`;
}

function formatCurves(points, isClosed) {
  const n = points.length;
  const at = (i) => (isClosed ? points[(i + n) % n] : points[clamp(i, 0, n - 1)]);
  const parts = [];
  for (let i = 0; i < (isClosed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    parts.push(
      `C${formatNumber(c1.x)},${formatNumber(c1.y)} ${formatNumber(c2.x)},${formatNumber(c2.y)} ${formatNumber(p2.x)},${formatNumber(p2.y)}`,
    );
  }
  return parts;
}

/**
 * Tracé lissé (Catmull-Rom converti en courbes de Bézier) passant par une suite de points.
 * @param {Array<{x: number, y: number}>} points Points de passage (au moins 2).
 * @param {boolean} [isClosed] Vrai pour refermer la forme.
 * @returns {string} Attribut `d`.
 */
export function buildSmoothPath(points, isClosed = false) {
  const parts = [`M${formatNumber(points[0].x)},${formatNumber(points[0].y)}`];
  parts.push(...formatCurves(points, isClosed));
  if (isClosed) parts.push('Z');
  return parts.join(' ');
}

/**
 * Suite de courbes lissées du premier point au dernier, sans déplacement initial : pour
 * continuer un tracé déjà commencé au premier point.
 * @param {Array<{x: number, y: number}>} points Points de passage (au moins 2).
 * @returns {string} Commandes `C` successives.
 */
export function buildSmoothCurves(points) {
  return formatCurves(points, false).join(' ');
}
