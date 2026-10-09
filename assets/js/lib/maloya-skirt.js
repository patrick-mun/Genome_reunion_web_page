/* ============================================================
   assets/js/lib/maloya-skirt.js
   Rôle : jupe des danseuses de la frise du maloya (calcul pur) : contour qui part de la taille,
   passe par les mains qui tiennent ses bords et finit par un ourlet ondulé ; plis. En fin de
   phrase, la danseuse fait tourbillonner sa jupe : les deux côtés s'ouvrent, l'ourlet s'évase
   et ondule plus vite, et les plis font le tour de la jupe (ils glissent d'un bord à l'autre
   et disparaissent derrière) : le tour se lit dans le tissu, sans aplatir le corps.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import {
  buildSmoothPath,
  computeEdgeSmoothstep,
  lerp,
  lerpPoint,
  rotatePoint,
} from './maloya-limbs.js';

export const SKIRT = {
  hemY: -4,
  hemHalfWidth: 29,
  waistHalfWidth: 8.5,
};

const SKIRT_LAG = 0.35; // en temps : les plis suivent le bassin
const FOLD_COUNT = 6; // plis répartis tout autour de la jupe ; trois se voient de face
const FOLD_FADE = [0.15, 0.45]; // un pli raccourcit vers l'ourlet en passant sur le côté

/**
 * Cible d'une main sur la jupe : plus ouverte et plus haute quand le côté s'ouvre.
 * @param {{x: number, y: number}} waist Taille.
 * @param {1|-1} side +1 côté droit, -1 côté gauche.
 * @param {number} open Ouverture du côté, de 0 à 1.
 * @returns {{x: number, y: number}} Poignet visé.
 */
export function computeSkirtGrip(waist, side, open) {
  return { x: waist.x + side * (17 + 8 * open), y: -55 - 6 * open };
}

/**
 * Contour de la jupe : taille, bords latéraux passant par les mains, ourlet ondulé.
 * @param {object} shape Taille, bascule du bassin, centre de l'ourlet, mains, ouverture de
 *   chaque côté (lifts), évasement (flare) et avancement du tourbillon (spin, de 0 à 1).
 * @param {number} beats Temps musical, en temps.
 * @returns {string} Attribut `d`.
 */
export function buildSkirtPath({ waist, hipTilt, hemX, grips, lifts, flare, spin }, beats) {
  const w = rotatePoint({ x: SKIRT.waistHalfWidth, y: 0 }, hipTilt);
  const side = (sign, lift) => ({
    x: hemX + sign * SKIRT.hemHalfWidth * (1 + 0.06 * lift + 0.22 * flare),
    y: SKIRT.hemY - 5 * lift - 4 * flare,
  });
  const leftHem = side(-1, lifts.left);
  const rightHem = side(1, lifts.right);
  // Pendant le tourbillon, l'ourlet ondule plus fort et deux tours d'onde de plus.
  const wave = Math.PI * beats + 4 * Math.PI * spin;
  const hem = [4, 3, 2, 1].map((i) => ({
    x: lerp(rightHem.x, leftHem.x, i / 5),
    y: SKIRT.hemY + 1.6 + (1.4 + 1.2 * flare) * Math.sin(wave + i * 1.7),
  }));
  return buildSmoothPath(
    [
      { x: waist.x - w.x, y: waist.y - w.y },
      grips.left,
      leftHem,
      ...hem,
      rightHem,
      grips.right,
      { x: waist.x + w.x, y: waist.y + w.y },
    ],
    true,
  );
}

/**
 * Plis de la jupe, répartis tout autour comme sur un cylindre : seuls ceux de devant se
 * voient. Le tourbillon les fait tourner d'un tour complet.
 * @param {{x: number, y: number}} waist Taille.
 * @param {number} hemX Centre de l'ourlet.
 * @param {number} beats Temps musical, en temps.
 * @param {number} spin Avancement du tourbillon, de 0 à 1.
 * @returns {string[]} Attributs `d` (vides pour les plis de derrière).
 */
export function buildFoldPaths(waist, hemX, beats, spin) {
  return Array.from({ length: FOLD_COUNT }, (_, i) => {
    const theta = (2 * Math.PI * i) / FOLD_COUNT + 2 * Math.PI * spin;
    const shown = computeEdgeSmoothstep(FOLD_FADE[0], FOLD_FADE[1], Math.cos(theta));
    if (shown < 0.05) return '';
    const across = Math.sin(theta);
    const sway = 2 * Math.sin(Math.PI * (beats - SKIRT_LAG) + i);
    const top = { x: waist.x + across * SKIRT.waistHalfWidth * 0.85, y: waist.y + 3 };
    const bottom = { x: hemX + across * SKIRT.hemHalfWidth * 0.78 + sway, y: SKIRT.hemY - 2 };
    const start = lerpPoint(bottom, top, shown);
    const middle = {
      x: lerp(start.x, bottom.x, 0.55) + sway * 0.6,
      y: lerp(start.y, bottom.y, 0.55),
    };
    return buildSmoothPath([start, middle, bottom]);
  });
}
