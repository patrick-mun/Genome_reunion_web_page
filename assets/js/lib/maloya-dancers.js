/* ============================================================
   assets/js/lib/maloya-dancers.js
   Rôle : poses des danseurs de la frise du maloya (calcul pur), vus de face. Pieds ancrés à la
   largeur des épaules, qui glissent à tour de rôle d'un petit pas à chaque temps ; genoux
   fléchis ; bassin ample qui passe sur le pied d'appui ; buste droit et détendu ; petite dérive
   latérale sur deux mesures. Sol en y = 0, axe du corps en x = 0 (70 unités ≈ 1 m).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { clamp } from './geometry.js';
import {
  addPoints,
  buildSmoothPath,
  computeBoneAngle,
  computeEdgeSmoothstep,
  lerp,
  lerpPoint,
  rotatePoint,
  solveTwoBone,
} from './maloya-limbs.js';
import { BODY } from './maloya-musicians.js';

/* ── PAS COMMUN ──
   Chaque pied glisse pendant le début de son temps puis reste posé ; le gauche part sur les
   temps pairs, le droit sur les impairs. Le bassin passe au-dessus du pied d'appui.
*/

const DRIFT = 5; // amplitude de la dérive latérale, en unités
const DRIFT_BEATS = 8; // une dérive aller-retour toutes les deux mesures
const STEP_SHARE = 0.3; // part du cycle de deux temps pendant laquelle le pied glisse
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
 * Position d'un pied ancré : il ne bouge que pendant son pas, puis reste posé.
 * @param {number} beats Temps musical, en temps.
 * @param {0|1} phase 0 : le pied part sur les temps pairs ; 1 : sur les temps impairs.
 * @param {number} offset Écart du pied par rapport à l'axe, en unités.
 * @returns {{x: number, lift: number}} Abscisse et hauteur au-dessus du sol.
 */
export function computeAnchoredFoot(beats, phase, offset) {
  const cycle = (beats - phase) / 2;
  const step = Math.floor(cycle);
  const progress = cycle - step;
  const stepped = step + computeEdgeSmoothstep(0, STEP_SHARE, progress);
  const lift = SLIDE_LIFT * Math.sin(Math.PI * clamp(progress / STEP_SHARE, 0, 1));
  return { x: offset + computeDrift(2 * stepped + phase), lift };
}

function computeFootwork(beats, spread, sway) {
  const left = computeAnchoredFoot(beats, 0, -spread);
  const right = computeAnchoredFoot(beats, 1, spread);
  return { left, right, hipX: (left.x + right.x) / 2 + sway };
}

/* ── DANSEUSE ──
   Une main tient le bord de la jupe, l'autre est levée ; elles échangent leur rôle toutes les
   deux mesures, la main passant au large, bras tendu. La jupe suit les hanches avec retard.
*/

export const DANCER_ARM = { upper: 20, fore: 18 };

const WAIST_Y = -66;
const HIP_SWAY = 6.5;
const HIP_TILT = 1.2; // degrés de bascule du bassin par unité de déplacement
const TORSO_COUNTER = 1; // le buste penche un peu à l'opposé des hanches
const BOB = 2; // flexion des genoux sur le temps
const SKIRT_LAG = 0.35; // en temps
const SKIRT_SWING = 5.5;
const HEM_Y = -4;
const HEM_HALF_WIDTH = 29;
const WAIST_HALF_WIDTH = 8.5;
const ARM_SWAP_BEATS = 8;
const ARM_SWAP_DURATION = 2;
const SWAP_ARC = 7;
const ARM_REACH = DANCER_ARM.upper + DANCER_ARM.fore;
// Hauteur, autour de l'épaule, où le coude se redresse pour changer de côté.
const BEND_SWITCH_BAND = 14;

/**
 * Poids de la main gauche sur la jupe (1 : elle la tient, 0 : elle est levée).
 * @param {number} beats Temps musical, en temps.
 * @returns {number} Poids entre 0 et 1, continu dans le temps.
 */
export function computeLeftHoldWeight(beats) {
  const block = Math.floor(beats / ARM_SWAP_BEATS);
  const holds = (k) => (((k % 2) + 2) % 2 === 0 ? 1 : 0);
  const t = computeEdgeSmoothstep(0, ARM_SWAP_DURATION, beats - block * ARM_SWAP_BEATS);
  return lerp(holds(block - 1), holds(block), t);
}

/**
 * Bras de la danseuse, calculé dans le repère du bras droit (x miroir pour le gauche). Entre
 * la main levée et la main sur la jupe, la main décrit un arc autour de l'épaule par
 * l'extérieur et passe bras tendu à hauteur d'épaule : le coude change de côté sans saut.
 * @param {{x: number, y: number}} shoulder Épaule.
 * @param {{x: number, y: number}} raised Cible de la main levée.
 * @param {{x: number, y: number}} grip Cible de la main sur la jupe.
 * @param {number} hold Poids de la prise de jupe (0 : levée, 1 : sur la jupe).
 * @param {1|-1} sign +1 pour le bras droit (côté x positif), -1 pour le gauche.
 * @returns {object} Parties upper, fore, hand, ouverture du coude et manque d'allonge.
 */
export function computeDancerArm(shoulder, raised, grip, hold, sign) {
  const local = (p) => ({ x: sign * (p.x - shoulder.x), y: p.y - shoulder.y });
  const world = (p) => ({ x: shoulder.x + sign * p.x, y: shoulder.y + p.y });
  const from = local(raised);
  const to = local(grip);
  const angle = lerp(Math.atan2(from.y, from.x), Math.atan2(to.y, to.x), hold);
  const radius = Math.min(
    ARM_REACH,
    lerp(Math.hypot(from.x, from.y), Math.hypot(to.x, to.y), hold) +
      SWAP_ARC * Math.sin(Math.PI * hold),
  );
  const target = { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  const bendSign = clamp(-target.y / BEND_SWITCH_BAND, -1, 1);
  const solved = solveTwoBone({ x: 0, y: 0 }, target, DANCER_ARM.upper, DANCER_ARM.fore, bendSign);
  const joint = world(solved.joint);
  const end = world(solved.end);
  const foreAngle = computeBoneAngle(joint, end);
  const aimed = world(target);
  return {
    upper: { ...shoulder, angle: computeBoneAngle(shoulder, joint) },
    fore: { ...joint, angle: foreAngle },
    hand: { ...end, angle: foreAngle },
    elbowBend: solved.bend,
    shortfall: Math.hypot(end.x - aimed.x, end.y - aimed.y),
  };
}

/**
 * Contour de la jupe : taille, bords latéraux (tirés par la main qui les tient), ourlet ondulé.
 * @param {object} shape Taille, bascule du bassin, centre de l'ourlet, prises et mains.
 * @param {number} beats Temps musical, en temps.
 * @returns {string} Attribut `d`.
 */
export function buildSkirtPath({ waist, hipTilt, hemX, holds, grips }, beats) {
  const w = rotatePoint({ x: WAIST_HALF_WIDTH, y: 0 }, hipTilt);
  const side = (sign, hold, grip) => {
    const natural = { x: (waist.x + hemX) / 2 + sign * 21, y: -36 };
    // La jupe n'est tirée que lorsque la main l'a saisie, pas pendant que la main descend.
    const pull = computeEdgeSmoothstep(0.65, 1, hold);
    return {
      mid: lerpPoint(natural, grip, pull),
      hem: { x: hemX + sign * HEM_HALF_WIDTH * (1 + 0.08 * pull), y: HEM_Y - 8 * pull },
    };
  };
  const left = side(-1, holds.left, grips.left);
  const right = side(1, holds.right, grips.right);
  const hem = [4, 3, 2, 1].map((i) => ({
    x: lerp(right.hem.x, left.hem.x, i / 5),
    y: HEM_Y + 1.6 + 1.4 * Math.sin(Math.PI * beats + i * 1.7),
  }));
  return buildSmoothPath(
    [
      { x: waist.x - w.x, y: waist.y - w.y },
      left.mid,
      left.hem,
      ...hem,
      right.hem,
      right.mid,
      { x: waist.x + w.x, y: waist.y + w.y },
    ],
    true,
  );
}

function buildFoldPaths(waist, hemX, beats) {
  return [-0.45, 0, 0.45].map((f, i) => {
    const top = { x: waist.x + f * WAIST_HALF_WIDTH * 1.6, y: waist.y + 3 };
    const sway = Math.sin(Math.PI * (beats - SKIRT_LAG) + i) * 2;
    const bottom = { x: hemX + f * HEM_HALF_WIDTH * 1.5 + sway, y: HEM_Y - 2 };
    const middle = { x: lerp(top.x, bottom.x, 0.55) + sway * 0.6, y: lerp(top.y, bottom.y, 0.55) };
    return buildSmoothPath([top, middle, bottom]);
  });
}

/**
 * Pose de la danseuse.
 * @param {number} beats Temps musical, en temps.
 * @returns {object} Parties (torso, head, arms.left/right, feet), tracés de la jupe et des plis.
 */
export function computeDancerPose(beats) {
  const sway = Math.cos(Math.PI * beats); // +1 : hanches à droite, sur le pied droit
  const steps = computeFootwork(beats, 6.5, HIP_SWAY * sway);
  const bob = BOB * (0.5 + 0.5 * Math.cos(2 * Math.PI * (beats - 0.08)));
  const waist = { x: steps.hipX, y: WAIST_Y + bob };
  const tilt = -TORSO_COUNTER * HIP_SWAY * sway;
  const hemX = computeDrift(beats) + SKIRT_SWING * Math.cos(Math.PI * (beats - SKIRT_LAG));
  const neck = addPoints(waist, rotatePoint({ x: 0, y: -24.5 }, tilt));
  const shoulder = (sign) => addPoints(waist, rotatePoint({ x: sign * 13, y: -22.5 }, tilt));

  const left = computeLeftHoldWeight(beats);
  const holds = { left, right: 1 - left };
  // Une main levée au-dessus de la tête ; l'autre tient la jupe et la balance avec le bassin.
  const raised = (sign) => ({
    x: neck.x + sign * (10 + 2 * Math.sin(Math.PI * beats)),
    y: -121 + 2.5 * Math.cos(Math.PI * beats) + bob,
  });
  const grip = (sign) => ({ x: waist.x + sign * (21 + 3 * sign * sway), y: -58 - 2 * sign * sway });
  const arms = {
    left: computeDancerArm(shoulder(-1), raised(-1), grip(-1), holds.left, -1),
    right: computeDancerArm(shoulder(1), raised(1), grip(1), holds.right, 1),
  };
  const skirt = { waist, hipTilt: HIP_TILT * (waist.x - computeDrift(beats)), hemX, holds };

  return {
    torso: { ...waist, angle: tilt },
    head: { ...neck, angle: tilt * 0.4 + 3 * Math.sin(Math.PI * beats + 0.6) },
    arms,
    feet: {
      left: { x: steps.left.x, y: -steps.left.lift, angle: 0 },
      right: { x: steps.right.x, y: -steps.right.lift, angle: 0 },
    },
    skirt: buildSkirtPath(
      { ...skirt, grips: { left: arms.left.hand, right: arms.right.hand } },
      beats,
    ),
    folds: buildFoldPaths(waist, hemX, beats),
    holds,
  };
}

/* ── DANSEUR ──
   Pieds à la largeur des épaules, genoux fléchis et ouverts ; les bras, coudes près du corps,
   se balancent à contretemps des hanches.
*/

const MAN_HIP_Y = -62;
const MAN_HIP_SWAY = 5;
const MAN_BOB = 2.6;
const MAN_FOOT_SPREAD = 10.5;

function computeFrontalLimb(root, end, lengths, sign, bendSign) {
  const local = (p) => ({ x: sign * (p.x - root.x), y: p.y - root.y });
  const world = (p) => ({ x: root.x + sign * p.x, y: root.y + p.y });
  const solved = solveTwoBone({ x: 0, y: 0 }, local(end), lengths[0], lengths[1], bendSign);
  const joint = world(solved.joint);
  const tip = world(solved.end);
  return { root, joint, tip, bend: solved.bend, shortfall: solved.shortfall };
}

/**
 * Pose du danseur.
 * @param {number} beats Temps musical, en temps.
 * @returns {object} Parties (torso, head, arms.left/right, legs.left/right).
 */
export function computeManPose(beats) {
  const sway = Math.cos(Math.PI * beats);
  const steps = computeFootwork(beats, MAN_FOOT_SPREAD, MAN_HIP_SWAY * sway);
  const bob = MAN_BOB * (0.5 + 0.5 * Math.cos(2 * Math.PI * (beats - 0.08)));
  const waist = { x: steps.hipX, y: MAN_HIP_Y + bob };
  const tilt = -MAN_HIP_SWAY * sway * 0.8;
  const swing = Math.sin(Math.PI * beats + 0.8);

  const arm = (sign) => {
    const shoulder = addPoints(waist, rotatePoint({ x: sign * 12.5, y: -23 }, tilt));
    const hand = { x: shoulder.x + sign * 17, y: shoulder.y + 22 + sign * 6 * swing };
    const limb = computeFrontalLimb(shoulder, hand, [BODY.upperArm, BODY.forearm], sign, 1);
    return {
      upper: { ...shoulder, angle: computeBoneAngle(shoulder, limb.joint) },
      fore: { ...limb.joint, angle: computeBoneAngle(limb.joint, limb.tip) },
      hand: { ...limb.tip, angle: computeBoneAngle(limb.joint, limb.tip) },
      elbowBend: limb.bend,
      shortfall: limb.shortfall,
    };
  };
  const leg = (sign, foot) => {
    const hip = addPoints(waist, { x: sign * 5, y: 2 });
    const limb = computeFrontalLimb(
      hip,
      { x: foot.x, y: -4 - foot.lift },
      [BODY.thigh, BODY.shin],
      sign,
      -1,
    );
    return {
      thigh: { ...hip, angle: computeBoneAngle(hip, limb.joint) },
      shin: { ...limb.joint, angle: computeBoneAngle(limb.joint, limb.tip) },
      foot: { ...limb.tip, angle: 0 },
    };
  };

  return {
    torso: { ...waist, angle: tilt },
    head: {
      ...addPoints(waist, rotatePoint({ x: 0, y: -25 }, tilt)),
      angle: tilt * 0.4 + 2.5 * swing,
    },
    arms: { left: arm(-1), right: arm(1) },
    legs: { left: leg(-1, steps.left), right: leg(1, steps.right) },
  };
}
