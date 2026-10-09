/* ============================================================
   assets/js/lib/maloya-fire.js
   Rôle : feu de bois de la frise du maloya (calcul pur), en secondes, indépendant du tempo :
   langues de flamme, halo et étincelles. Le vacillement somme des sinus de fréquences sans
   rapport simple : il reste continu et ne se répète pas visiblement.
   Repère : base des flammes en (0, 0), y vers le bas.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { lerp } from './maloya-limbs.js';

/* ── FLAMMES ──
   Langues de flamme (décalage à la base, hauteur, largeur, phase propre) et couches de la
   flamme, de l'extérieur au cœur (échelle de hauteur et de largeur).
*/
const TONGUES = [
  { x: -13, height: 24, width: 12, phase: 0.0 },
  { x: -6, height: 37, width: 14, phase: 1.9 },
  { x: 1, height: 47, width: 16, phase: 3.7 },
  { x: 8, height: 35, width: 14, phase: 5.3 },
  { x: 14, height: 22, width: 11, phase: 2.6 },
];
const FLAME_LAYERS = [
  { name: 'outer', scale: 1, widthScale: 1 },
  { name: 'mid', scale: 0.7, widthScale: 0.72 },
  { name: 'core', scale: 0.4, widthScale: 0.45 },
];
// Étincelles : départ, durée de vie (s), phase, dérive et hauteur de montée.
const SPARKS = [
  { x: -6, period: 1.9, phase: 0.1, drift: 7, rise: 95 },
  { x: 4, period: 2.4, phase: 0.55, drift: -9, rise: 110 },
  { x: 0, period: 1.6, phase: 0.8, drift: 5, rise: 80 },
  { x: 9, period: 2.9, phase: 0.3, drift: 11, rise: 120 },
  { x: -10, period: 2.2, phase: 0.7, drift: -6, rise: 100 },
];
export const SPARK_COUNT = SPARKS.length;

const formatNumber = (n) => Number(n.toFixed(2));

/**
 * Vacillement lissé autour de 0 (somme de sinus), amplitude ≈ 1.
 * @param {number} seconds Temps, en secondes.
 * @param {number} phase Décalage propre à l'élément.
 * @returns {number} Valeur dans [-1, 1].
 */
export function computeFlicker(seconds, phase) {
  return (
    0.55 * Math.sin(seconds * 7.1 + phase) +
    0.3 * Math.sin(seconds * 12.7 + phase * 1.7) +
    0.15 * Math.sin(seconds * 21.3 + phase * 2.3)
  );
}

function buildTonguePath(tongue, seconds, layer) {
  const h = tongue.height * layer.scale * (1 + 0.2 * computeFlicker(seconds, tongue.phase));
  const w = tongue.width * layer.widthScale;
  const tipX = tongue.x + 0.28 * h * computeFlicker(seconds * 0.8, tongue.phase + 1.3);
  const bend = 0.12 * h * computeFlicker(seconds * 0.6, tongue.phase + 2.1);
  const left = tongue.x - w / 2;
  const right = tongue.x + w / 2;
  return [
    `M${formatNumber(left)},0`,
    `C${formatNumber(left - w * 0.12)},${formatNumber(-h * 0.42)} ${formatNumber(tipX - w * 0.2 + bend)},${formatNumber(-h * 0.7)} ${formatNumber(tipX)},${formatNumber(-h)}`,
    `C${formatNumber(tipX + w * 0.1 + bend)},${formatNumber(-h * 0.66)} ${formatNumber(right + w * 0.14)},${formatNumber(-h * 0.4)} ${formatNumber(right)},0`,
    'Z',
  ].join(' ');
}

/**
 * Tracés des flammes, une chaîne par couche (toutes les langues réunies).
 * @param {number} seconds Temps, en secondes.
 * @returns {Record<string, string>} Attribut `d` par couche (outer, mid, core).
 */
export function computeFlames(seconds) {
  return Object.fromEntries(
    FLAME_LAYERS.map((layer) => [
      layer.name,
      TONGUES.map((tongue) => buildTonguePath(tongue, seconds, layer)).join(' '),
    ]),
  );
}

/**
 * Intensité du halo : suit le vacillement global des flammes.
 * @param {number} seconds Temps, en secondes.
 * @returns {{opacity: number, scale: number}} Opacité (0,55 à 0,85) et échelle (0,94 à 1,06).
 */
export function computeGlow(seconds) {
  const f = computeFlicker(seconds * 0.9, 0.4);
  return { opacity: 0.7 + 0.15 * f, scale: 1 + 0.06 * f };
}

/**
 * Étincelles qui montent en dérivant et s'éteignent.
 * @param {number} seconds Temps, en secondes.
 * @returns {Array<{x: number, y: number, opacity: number}>} Position et opacité de chaque étincelle.
 */
export function computeSparks(seconds) {
  return SPARKS.map((spark) => {
    const u = (((seconds / spark.period + spark.phase) % 1) + 1) % 1;
    return {
      x:
        spark.x +
        spark.drift * Math.sin(u * Math.PI * 1.5) +
        2 * Math.sin(seconds * 9 + spark.phase * 10),
      y: -18 - spark.rise * u,
      opacity: u < 0.1 ? u / 0.1 : lerp(1, 0, (u - 0.1) / 0.9),
    };
  });
}
