/* ============================================================
   assets/js/lib/maloya-dancers.js
   Rôle : poses des danseurs de la frise du maloya (calcul pur), vus de face. Pieds ancrés à la
   largeur des épaules, qui glissent à tour de rôle d'un petit pas à chaque temps ; genoux
   fléchis ; bassin ample qui passe sur le pied d'appui ; buste puis tête qui suivent le bassin
   avec retard (mouvement en vague) ; petite dérive latérale ; un tour sur soi de temps en temps.
   Sol en y = 0, axe du corps en x = 0 (70 unités ≈ 1 m).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { clamp, computeSmoothstep } from './geometry.js';
import {
  addPoints,
  buildSmoothPath,
  computeBoneAngle,
  computeEdgeSmoothstep,
  lerp,
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

/* ── TOUR SUR SOI ──
   Toutes les quatre mesures, le danseur fait un tour complet en deux temps. Vu de face, le tour
   se lit comme un rétrécissement horizontal jusqu'au profil, puis l'image du dos (symétrique),
   puis de nouveau la face. Le corps ne descend pas sous sa largeur de profil : le passage de
   face à dos se fait à cette largeur, où les deux images se confondent presque.
*/

const TURN_PERIOD = 16;
const TURN_START = 12; // en temps dans le cycle
const TURN_BEATS = 2;

/**
 * Tour sur soi.
 * @param {number} beats Temps musical, en temps.
 * @param {number} minWidth Largeur de profil, en part de la largeur de face.
 * @returns {{scaleX: number, spin: number}} Échelle horizontale (négative : vu de dos) et
 *   intensité du tour (0 hors tour, 1 à mi-tour) pour évaser la jupe.
 */
export function computeTurn(beats, minWidth) {
  const inCycle = ((beats % TURN_PERIOD) + TURN_PERIOD) % TURN_PERIOD;
  const progress = clamp((inCycle - TURN_START) / TURN_BEATS, 0, 1);
  const c = Math.cos(2 * Math.PI * computeSmoothstep(progress));
  return {
    scaleX: (c < 0 ? -1 : 1) * Math.max(Math.abs(c), minWidth),
    spin: Math.sin(Math.PI * progress),
  };
}

/**
 * Membre de face (bras ou jambe), calculé dans le repère du côté droit (x miroir pour le gauche).
 * @param {{x: number, y: number}} root Épaule ou hanche.
 * @param {{x: number, y: number}} end Poignet ou cheville visé.
 * @param {number[]} lengths Longueurs des deux segments.
 * @param {1|-1} sign +1 pour le côté droit (x positif), -1 pour le gauche.
 * @param {number} bendSign Côté du pli dans le repère du côté droit (voir solveTwoBone).
 * @returns {object} Parties (pivots et angles) du membre, ouverture et manque d'allonge.
 */
export function computeFrontalLimb(root, end, lengths, sign, bendSign) {
  const local = (p) => ({ x: sign * (p.x - root.x), y: p.y - root.y });
  const world = (p) => ({ x: root.x + sign * p.x, y: root.y + p.y });
  const solved = solveTwoBone({ x: 0, y: 0 }, local(end), lengths[0], lengths[1], bendSign);
  const joint = world(solved.joint);
  const tip = world(solved.end);
  return {
    first: { ...root, angle: computeBoneAngle(root, joint) },
    second: { ...joint, angle: computeBoneAngle(joint, tip) },
    tip: { ...tip, angle: computeBoneAngle(joint, tip) },
    bend: solved.bend,
    shortfall: solved.shortfall,
  };
}

/* ── DANSEUSE ──
   Les deux mains tiennent la jupe de chaque côté et la font jouer : le côté vers lequel passe le
   bassin s'ouvre et se soulève davantage. La jupe suit les hanches avec retard et s'évase
   pendant les tours.
*/

export const DANCER_ARM = { upper: 20, fore: 18 };

const WAIST_Y = -66;
const HIP_SWAY = 6.5;
const HIP_TILT = 1.2; // degrés de bascule du bassin par unité de déplacement
const TORSO_COUNTER = 0.8; // le buste penche un peu à l'opposé des hanches
const TORSO_LAG = 0.12; // en temps : le buste suit le bassin
const HEAD_LAG = 0.25; // en temps : la tête suit le buste
const ARM_LAG = 0.1; // en temps : les mains suivent le bassin
const BOB = 2; // flexion des genoux sur le temps
const SKIRT_LAG = 0.35; // en temps
const SKIRT_SWING = 5.5;
const HEM_Y = -4;
const HEM_HALF_WIDTH = 29;
const WAIST_HALF_WIDTH = 8.5;
const DANCER_PROFILE_WIDTH = 0.45; // buste de profil : environ la moitié de sa largeur de face

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
 *   chaque côté (lifts) et évasement du tour (flare).
 * @param {number} beats Temps musical, en temps.
 * @returns {string} Attribut `d`.
 */
export function buildSkirtPath({ waist, hipTilt, hemX, grips, lifts, flare }, beats) {
  const w = rotatePoint({ x: WAIST_HALF_WIDTH, y: 0 }, hipTilt);
  const side = (sign, lift) => ({
    x: hemX + sign * HEM_HALF_WIDTH * (1 + 0.06 * lift + 0.22 * flare),
    y: HEM_Y - 5 * lift - 4 * flare,
  });
  const leftHem = side(-1, lifts.left);
  const rightHem = side(1, lifts.right);
  const hem = [4, 3, 2, 1].map((i) => ({
    x: lerp(rightHem.x, leftHem.x, i / 5),
    y: HEM_Y + 1.6 + 1.4 * Math.sin(Math.PI * beats + i * 1.7),
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

function buildFoldPaths(waist, hemX, beats) {
  return [-0.45, 0, 0.45].map((f, i) => {
    const top = { x: waist.x + f * WAIST_HALF_WIDTH * 1.6, y: waist.y + 3 };
    const sway = Math.sin(Math.PI * (beats - SKIRT_LAG) + i) * 2;
    const bottom = { x: hemX + f * HEM_HALF_WIDTH * 1.5 + sway, y: HEM_Y - 2 };
    const middle = { x: lerp(top.x, bottom.x, 0.55) + sway * 0.6, y: lerp(top.y, bottom.y, 0.55) };
    return buildSmoothPath([top, middle, bottom]);
  });
}

function computeSkirtArm(shoulder, grip, side) {
  // Coude vers l'extérieur, main basse : pli du côté « sous la droite épaule-main ».
  const limb = computeFrontalLimb(shoulder, grip, [DANCER_ARM.upper, DANCER_ARM.fore], side, -1);
  return {
    upper: limb.first,
    fore: limb.second,
    hand: limb.tip,
    elbowBend: limb.bend,
    shortfall: limb.shortfall,
  };
}

/**
 * Pose de la danseuse.
 * @param {number} beats Temps musical, en temps.
 * @returns {object} Parties (torso, head, arms.left/right, feet), tour, tracés de la jupe.
 */
export function computeDancerPose(beats) {
  const sway = Math.cos(Math.PI * beats); // +1 : hanches à droite, sur le pied droit
  const steps = computeFootwork(beats, 6.5, HIP_SWAY * sway);
  const bob = BOB * (0.5 + 0.5 * Math.cos(2 * Math.PI * (beats - 0.08)));
  const waist = { x: steps.hipX, y: WAIST_Y + bob };
  const tilt = -TORSO_COUNTER * HIP_SWAY * Math.cos(Math.PI * (beats - TORSO_LAG));
  const headTilt = -0.5 * TORSO_COUNTER * HIP_SWAY * Math.cos(Math.PI * (beats - HEAD_LAG));
  const drift = computeDrift(beats);
  const hemX = drift + SKIRT_SWING * Math.cos(Math.PI * (beats - SKIRT_LAG));
  const turn = computeTurn(beats, DANCER_PROFILE_WIDTH);
  const neck = addPoints(waist, rotatePoint({ x: 0, y: -24.5 }, tilt));
  const shoulder = (sign) => addPoints(waist, rotatePoint({ x: sign * 13, y: -22.5 }, tilt));

  // Ouverture de chaque côté : suit le bassin avec retard ; les deux s'ouvrent pendant le tour.
  const armSway = Math.cos(Math.PI * (beats - ARM_LAG));
  const open = (sign) => clamp(0.5 + 0.5 * sign * armSway + 0.6 * turn.spin, 0, 1);
  const arms = {
    left: computeSkirtArm(shoulder(-1), computeSkirtGrip(waist, -1, open(-1)), -1),
    right: computeSkirtArm(shoulder(1), computeSkirtGrip(waist, 1, open(1)), 1),
  };
  // La jupe en cloche ne tourne pas : seuls ses bords suivent les mains, qui tournent avec le
  // buste. De dos, la main de droite passe à gauche : les côtés sont échangés.
  const turned = (hand) => ({ x: drift + (hand.x - drift) * turn.scaleX, y: hand.y });
  const isBack = turn.scaleX < 0;
  const hands = [turned(arms.left.hand), turned(arms.right.hand)];
  const lifts = [open(-1), open(1)];
  const skirt = {
    waist,
    hipTilt: HIP_TILT * (waist.x - drift),
    hemX,
    grips: { left: hands[isBack ? 1 : 0], right: hands[isBack ? 0 : 1] },
    lifts: { left: lifts[isBack ? 1 : 0], right: lifts[isBack ? 0 : 1] },
    flare: turn.spin,
  };

  return {
    torso: { ...waist, angle: tilt },
    head: { ...neck, angle: headTilt + 2 * Math.sin(Math.PI * (beats - HEAD_LAG) + 0.6) },
    arms,
    feet: {
      left: { x: steps.left.x, y: -steps.left.lift, angle: 0 },
      right: { x: steps.right.x, y: -steps.right.lift, angle: 0 },
    },
    turn: { x: drift, scaleX: turn.scaleX },
    skirt: buildSkirtPath(skirt, beats),
    folds: buildFoldPaths(waist, hemX, beats),
  };
}

/* ── DANSEUR ──
   Pieds à la largeur des épaules, genoux fléchis et ouverts ; les bras, coudes près du corps,
   se balancent avec retard sur le bassin.
*/

const MAN_HIP_Y = -62;
const MAN_HIP_SWAY = 5;
const MAN_BOB = 2.6;
const MAN_FOOT_SPREAD = 10.5;
const MAN_PROFILE_WIDTH = 0.4;

function computeManArm(waist, tilt, sign, swing) {
  const shoulder = addPoints(waist, rotatePoint({ x: sign * 12.5, y: -23 }, tilt));
  const hand = { x: shoulder.x + sign * 17, y: shoulder.y + 22 + sign * 5 * swing };
  const limb = computeFrontalLimb(shoulder, hand, [BODY.upperArm, BODY.forearm], sign, 1);
  return {
    upper: limb.first,
    fore: limb.second,
    hand: limb.tip,
    elbowBend: limb.bend,
    shortfall: limb.shortfall,
  };
}

function computeManLeg(waist, sign, foot) {
  const hip = addPoints(waist, { x: sign * 5, y: 2 });
  const ankle = { x: foot.x, y: -4 - foot.lift };
  const limb = computeFrontalLimb(hip, ankle, [BODY.thigh, BODY.shin], sign, -1);
  return { thigh: limb.first, shin: limb.second, foot: { ...limb.tip, angle: 0 } };
}

/**
 * Pose du danseur.
 * @param {number} beats Temps musical, en temps.
 * @returns {object} Parties (torso, head, arms.left/right, legs.left/right) et tour.
 */
export function computeManPose(beats) {
  const sway = Math.cos(Math.PI * beats);
  const steps = computeFootwork(beats, MAN_FOOT_SPREAD, MAN_HIP_SWAY * sway);
  const bob = MAN_BOB * (0.5 + 0.5 * Math.cos(2 * Math.PI * (beats - 0.08)));
  const waist = { x: steps.hipX, y: MAN_HIP_Y + bob };
  const tilt = -0.8 * MAN_HIP_SWAY * Math.cos(Math.PI * (beats - TORSO_LAG));
  const swing = Math.sin(Math.PI * (beats - 0.2) + 0.8);
  const headTilt = -0.4 * MAN_HIP_SWAY * Math.cos(Math.PI * (beats - HEAD_LAG));

  return {
    torso: { ...waist, angle: tilt },
    head: {
      ...addPoints(waist, rotatePoint({ x: 0, y: -25 }, tilt)),
      angle: headTilt + 2 * Math.sin(Math.PI * (beats - HEAD_LAG) + 0.8),
    },
    arms: {
      left: computeManArm(waist, tilt, -1, swing),
      right: computeManArm(waist, tilt, 1, swing),
    },
    legs: {
      left: computeManLeg(waist, -1, steps.left),
      right: computeManLeg(waist, 1, steps.right),
    },
    turn: { x: computeDrift(beats), scaleX: computeTurn(beats, MAN_PROFILE_WIDTH).scaleX },
  };
}
