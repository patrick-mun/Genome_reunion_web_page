/* ============================================================
   assets/js/lib/maloya-dancers.js
   Rôle : poses des danseuses de la frise du maloya (calcul pur), vues de face, et ce qu'elles
   partagent avec le danseur (maloya-man.js) : pas et haut du corps. Pieds ancrés à la largeur
   des épaules ; le pied libre glisse d'un petit pas pendant que l'autre porte le poids, puis
   reçoit le poids au temps suivant. Le bassin passe d'un appui à l'autre, tient l'appui et
   s'enfonce (maloya-groove.js) ; la hanche d'appui monte, les épaules s'inclinent en sens
   inverse ; le buste suit le bassin à moitié et la tête reste presque droite.
   Sol en y = 0, axe du corps en x = 0 (70 unités ≈ 1 m).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { clamp } from './geometry.js';
import {
  computeFlourish,
  computeGroovePulse,
  computeLoopNoise,
  computeWeightShift,
  DEFAULT_STYLE,
  MAX_SHIFT,
} from './maloya-groove.js';
import {
  addPoints,
  computeBoneAngle,
  computeEdgeSmoothstep,
  lerp,
  rotatePoint,
  solveTwoBone,
} from './maloya-limbs.js';
import { buildFoldPaths, buildSkirtPath, computeSkirtGrip } from './maloya-skirt.js';

/* ── PAS COMMUN ──
   Le pied gauche glisse pendant la tenue des temps pairs (le poids est sur le pied droit) et
   reçoit le poids au temps impair suivant ; le droit, l'inverse. Une petite dérive latérale
   déplace les pas d'un côté puis de l'autre.
*/

const DRIFT = 5; // amplitude de la dérive latérale, en unités
const DRIFT_BEATS = 8; // une dérive aller-retour toutes les deux mesures
const STEP_START = 0.5; // le pied libre part une fois le poids passé sur l'autre pied…
const STEP_END = 0.95; // … et se pose juste avant de reprendre le poids
const SLIDE_LIFT = 1.2; // le pied rase le sol

/**
 * Dérive latérale du danseur (petits pas d'un côté puis de l'autre).
 * @param {number} beats Temps musical, en temps.
 * @returns {number} Décalage horizontal, en unités.
 */
export function computeDrift(beats) {
  return DRIFT * Math.sin((2 * Math.PI * beats) / DRIFT_BEATS);
}

/**
 * Position d'un pied ancré : il ne glisse que pendant la tenue de l'autre pied, puis reste posé.
 * @param {number} beats Temps musical, en temps.
 * @param {0|1} phase 0 : le pied glisse pendant les temps pairs ; 1 : pendant les impairs.
 * @param {number} offset Écart du pied par rapport à l'axe, en unités.
 * @returns {{x: number, lift: number}} Abscisse et hauteur au-dessus du sol.
 */
export function computeAnchoredFoot(beats, phase, offset) {
  const cycle = (beats - phase) / 2;
  const step = Math.floor(cycle);
  const inCycle = 2 * (cycle - step); // en temps, de 0 à 2
  const progress = computeEdgeSmoothstep(STEP_START, STEP_END, inCycle);
  const slide = clamp((inCycle - STEP_START) / (STEP_END - STEP_START), 0, 1);
  return {
    x: offset + computeDrift(2 * (step + progress) + phase - 1),
    lift: SLIDE_LIFT * Math.sin(Math.PI * slide),
  };
}

/**
 * Pas des deux pieds, écartés de part et d'autre de l'axe.
 * @param {number} beats Temps musical, en temps.
 * @param {number} spread Écart de chaque pied par rapport à l'axe, en unités.
 * @returns {{left: object, right: object, centerX: number}} Pieds (voir computeAnchoredFoot)
 *   et milieu des deux pieds.
 */
export function computeFootwork(beats, spread) {
  const left = computeAnchoredFoot(beats, 0, -spread);
  const right = computeAnchoredFoot(beats, 1, spread);
  return { left, right, centerX: (left.x + right.x) / 2 };
}

/**
 * Membre de face (bras ou jambe), calculé dans le repère du côté droit (x miroir pour le gauche).
 * @param {{x: number, y: number}} root Épaule ou hanche.
 * @param {{x: number, y: number}} end Poignet ou cheville visé.
 * @param {number[]} lengths Longueurs des deux segments.
 * @param {1|-1} sign +1 pour le côté droit (x positif), -1 pour le gauche.
 * @param {number} bendSign Côté du pli dans le repère du côté droit (voir solveTwoBone).
 * @returns {{chain: Array<{x: number, y: number}>, tipAngle: number, bend: number,
 *   shortfall: number}} Chaîne du membre, angle du dernier segment, ouverture et manque
 *   d'allonge.
 */
export function computeFrontalLimb(root, end, lengths, sign, bendSign) {
  const local = (p) => ({ x: sign * (p.x - root.x), y: p.y - root.y });
  const world = (p) => ({ x: root.x + sign * p.x, y: root.y + p.y });
  const solved = solveTwoBone({ x: 0, y: 0 }, local(end), lengths[0], lengths[1], bendSign);
  const joint = world(solved.joint);
  const tip = world(solved.end);
  return {
    chain: [root, joint, tip],
    tipAngle: computeBoneAngle(joint, tip),
    bend: solved.bend,
    shortfall: solved.shortfall,
  };
}

/* ── HAUT DU CORPS DE FACE ──
   Trois niveaux (taille, poitrine, épaules) dont maloya-bodies.js fait le contour du buste :
   la ligne de taille suit la bascule du bassin, celle des épaules s'y oppose.
*/

const PELVIS_TILT = 5; // degrés par unité d'appui : la hanche d'appui monte
const SHOULDER_TILT = 3.5; // les épaules s'inclinent en sens inverse…
const SHOULDER_LAG = 0.12; // … avec retard, en temps
const UPPER_FOLLOW = 0.45; // le haut du buste ne suit le bassin qu'à moitié
const HEAD_COUNTER = 0.8; // la tête penche à peine à l'opposé du bassin, en degrés
const HEAD_LAG = 0.25; // en temps

/**
 * Haut du corps de face : niveaux du buste, épaules, cou et tête.
 * @param {object} body Taille (waist), milieu des pieds (centerX), temps propre (beats) et
 *   style du personnage.
 * @param {{chest: number, top: number, waistHalf: number, chestHalf: number,
 *   topHalf: number, shoulder: number}} size Hauteurs (depuis la taille) et demi-largeurs.
 * @returns {{levels: object[], hipTilt: number, shoulders: {left: object, right: object},
 *   head: {x: number, y: number, angle: number}}} Buste, bascule du bassin, épaules, tête.
 */
export function computeFrontTrunk({ waist, centerX, beats, style }, size) {
  const shift = (lag) => style.amp * computeWeightShift(beats - lag, style.seed);
  const hipTilt = -PELVIS_TILT * shift(0);
  const shoulderTilt = SHOULDER_TILT * shift(SHOULDER_LAG);
  const top = { x: centerX + UPPER_FOLLOW * (waist.x - centerX), y: waist.y - size.top };
  const chest = { x: lerp(waist.x, top.x, 0.6), y: waist.y - size.chest };
  const onShoulders = (local) => addPoints(top, rotatePoint(local, shoulderTilt));
  // Niveau de contour (maloya-outlines.js), avec son inclinaison en degrés.
  const level = (center, half, angle) => ({
    center,
    half: [half, half],
    normal: rotatePoint({ x: 1, y: 0 }, angle),
    angle,
  });
  return {
    levels: [
      level(waist, size.waistHalf, hipTilt),
      level(chest, size.chestHalf, (hipTilt + shoulderTilt) / 2),
      level(top, size.topHalf, shoulderTilt),
    ],
    hipTilt,
    shoulders: {
      left: onShoulders({ x: -size.shoulder, y: 1.2 }),
      right: onShoulders({ x: size.shoulder, y: 1.2 }),
    },
    head: {
      ...onShoulders({ x: 0, y: -2 }),
      angle: -HEAD_COUNTER * shift(HEAD_LAG) + 0.8 * computeLoopNoise(beats, style.seed + 1),
    },
  };
}

/* ── DANSEUSE ──
   Les deux mains tiennent la jupe de chaque côté et la font jouer : le côté vers lequel passe le
   bassin s'ouvre et se soulève davantage, avec retard. En fin de phrase, tourbillon de jupe.
*/

export const DANCER_ARM = { upper: 20, fore: 18 };
const DANCER_TRUNK = {
  chest: 12,
  top: 22.5,
  waistHalf: 8.5,
  chestHalf: 11.2,
  topHalf: 13.4,
  shoulder: 12.6,
};

const WAIST_Y = -66;
const FOOT_SPREAD = 6.5;
const HIP_SWAY = 6.5;
const BOB = 2.2; // flexion des genoux sur le temps
const ARM_LAG = 0.1; // en temps : les mains suivent le bassin
const SKIRT_LAG = 0.3; // en temps : l'ourlet suit le bassin
const SKIRT_SWING = 5.5;
const SWIRL_SWING = 4; // balancement de l'ourlet pendant le tourbillon

function computeSkirtArm(shoulder, grip, side) {
  // Coude vers l'extérieur, main basse : pli du côté « sous la droite épaule-main ».
  const limb = computeFrontalLimb(shoulder, grip, [DANCER_ARM.upper, DANCER_ARM.fore], side, -1);
  return {
    chain: limb.chain,
    hand: { ...limb.chain[2], angle: limb.tipAngle },
    elbowBend: limb.bend,
    shortfall: limb.shortfall,
  };
}

/**
 * Pose de la danseuse.
 * @param {number} beats Temps musical, en temps.
 * @param {typeof DEFAULT_STYLE} [style] Style propre au personnage.
 * @returns {object} Buste (trunk), tête, bras (left, right), pieds, tracés de la jupe.
 */
export function computeDancerPose(beats, style = DEFAULT_STYLE) {
  const t = beats + style.timing;
  const shift = (lag) => style.amp * computeWeightShift(t - lag, style.seed);
  const steps = computeFootwork(t, FOOT_SPREAD);
  const flourish = computeFlourish(t);
  const waist = {
    x: steps.centerX + HIP_SWAY * shift(0),
    y: WAIST_Y + style.amp * BOB * computeGroovePulse(t, style.seed),
  };
  const trunk = computeFrontTrunk({ waist, centerX: steps.centerX, beats: t, style }, DANCER_TRUNK);
  // Ouverture de chaque côté, de 0 à 1 sans écrêtage (pas d'arrêt sec) ; tout ouvert au milieu
  // du tourbillon.
  const armShift = shift(ARM_LAG) / (style.amp * MAX_SHIFT);
  const swirl = flourish.strength;
  const open = (sign) => 0.5 + 0.5 * sign * armShift * (1 - swirl) + 0.5 * swirl;
  const arms = {
    left: computeSkirtArm(trunk.shoulders.left, computeSkirtGrip(waist, -1, open(-1)), -1),
    right: computeSkirtArm(trunk.shoulders.right, computeSkirtGrip(waist, 1, open(1)), 1),
  };
  const hemX =
    computeDrift(t) +
    SKIRT_SWING * shift(SKIRT_LAG) +
    SWIRL_SWING * flourish.strength * Math.sin(2 * Math.PI * flourish.progress);
  const skirt = {
    waist,
    hipTilt: trunk.hipTilt,
    hemX,
    grips: { left: arms.left.hand, right: arms.right.hand },
    lifts: { left: open(-1), right: open(1) },
    flare: flourish.strength,
    spin: flourish.progress,
  };

  return {
    trunk: trunk.levels,
    head: trunk.head,
    arms,
    feet: {
      left: { x: steps.left.x, y: -steps.left.lift, angle: 0 },
      right: { x: steps.right.x, y: -steps.right.lift, angle: 0 },
    },
    skirt: buildSkirtPath(skirt, t),
    folds: buildFoldPaths(waist, hemX, t, flourish.progress),
  };
}
