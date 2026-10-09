/* ============================================================
   assets/js/lib/geometry.js
   Rôle : calculs géométriques réutilisables par les animations (bornes,
   interpolation, angles).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

/**
 * Borne une valeur dans un intervalle.
 * @param {number} value Valeur à borner.
 * @param {number} min Borne basse.
 * @param {number} max Borne haute.
 * @returns {number} Valeur comprise entre min et max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Interpolation douce : départ et arrivée progressifs.
 * @param {number} t Progression entre 0 et 1.
 * @returns {number} Progression adoucie entre 0 et 1.
 */
export function computeSmoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Écart angulaire signé le plus court entre deux angles.
 * @param {number} target Angle visé, en degrés.
 * @param {number} current Angle actuel, en degrés.
 * @returns {number} Écart entre -180 et 180 degrés (positif = sens horaire).
 */
export function computeAngleDifference(target, current) {
  return ((target - current + 540) % 360) - 180;
}

/**
 * Angle d'orientation d'un élément dessiné « tête vers le haut » qui avance
 * dans la direction (dx, dy).
 * @param {number} dx Déplacement horizontal.
 * @param {number} dy Déplacement vertical (vers le bas positif).
 * @returns {number} Angle en degrés : 0 vers le haut, 90 vers la droite.
 */
export function computeHeadingAngle(dx, dy) {
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}
