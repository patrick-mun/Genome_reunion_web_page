/* ============================================================
   assets/js/lib/geometry.js
   Rôle : calculs géométriques réutilisables par les animations (courbes de
   Bézier, trajets à vitesse constante, angles).
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
 * Point d'une courbe de Bézier cubique.
 * @param {{x: number, y: number}} p0 Point de départ.
 * @param {{x: number, y: number}} p1 Premier point de contrôle.
 * @param {{x: number, y: number}} p2 Second point de contrôle.
 * @param {{x: number, y: number}} p3 Point d'arrivée.
 * @param {number} t Position sur la courbe, entre 0 et 1.
 * @returns {{x: number, y: number}} Point de la courbe.
 */
export function computeBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/**
 * Découpe une courbe de Bézier en points et cumule les longueurs, pour
 * pouvoir la parcourir à vitesse constante (voir `sampleAlong`).
 * @param {{x: number, y: number}} p0 Point de départ.
 * @param {{x: number, y: number}} p1 Premier point de contrôle.
 * @param {{x: number, y: number}} p2 Second point de contrôle.
 * @param {{x: number, y: number}} p3 Point d'arrivée.
 * @param {number} steps Nombre de sous-segments.
 * @returns {{pts: Array<{x: number, y: number}>, cum: number[], arc: number}} Points,
 *   longueurs cumulées et longueur totale de l'arc.
 */
export function buildBezierPath(p0, p1, p2, p3, steps) {
  const pts = [p0];
  const cum = [0];
  let previous = p0;
  for (let k = 1; k <= steps; k++) {
    const point = computeBezierPoint(p0, p1, p2, p3, k / steps);
    pts.push(point);
    cum.push(cum[k - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
    previous = point;
  }
  return { pts, cum, arc: cum[steps] };
}

/**
 * Point d'un trajet à une fraction de sa longueur (vitesse visuelle constante,
 * quelle que soit la courbure de la courbe).
 * @param {{pts: Array<{x: number, y: number}>, cum: number[], arc: number}} segment Trajet
 *   produit par `buildBezierPath`.
 * @param {number} t Fraction de la longueur totale, entre 0 et 1.
 * @returns {{x: number, y: number}} Point correspondant.
 */
export function sampleAlong(segment, t) {
  const distance = clamp(t, 0, 1) * segment.arc;
  let k = 1;
  while (k < segment.cum.length && segment.cum[k] < distance) k++;

  const previousDistance = segment.cum[k - 1];
  const nextDistance = segment.cum[k];
  const fraction =
    nextDistance > previousDistance
      ? (distance - previousDistance) / (nextDistance - previousDistance)
      : 0;
  const p0 = segment.pts[k - 1];
  const p1 = segment.pts[k];

  return {
    x: p0.x + (p1.x - p0.x) * fraction,
    y: p0.y + (p1.y - p0.y) * fraction,
  };
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
