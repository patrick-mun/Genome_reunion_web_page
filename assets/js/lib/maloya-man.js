/* ============================================================
   assets/js/lib/maloya-man.js
   Rôle : pose du danseur de la frise du maloya (calcul pur), vu de face. Pieds écartés à la
   largeur des épaules, genoux fléchis et ouverts, même pas et même haut du corps que les
   danseuses (maloya-dancers.js), plus appuyés. Les bras, souples, mains près des hanches, se
   balancent avec retard sur le bassin. En fin de phrase, il plonge sur ses genoux en ouvrant
   les bras.
   Sol en y = 0, axe du corps en x = 0 (70 unités ≈ 1 m).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { computeFootwork, computeFrontalLimb, computeFrontTrunk } from './maloya-dancers.js';
import {
  computeFlourish,
  computeGroovePulse,
  computeWeightShift,
  DEFAULT_STYLE,
  MAX_SHIFT,
} from './maloya-groove.js';
import { addPoints, lerpPoint, rotatePoint } from './maloya-limbs.js';
import { BODY } from './maloya-musicians.js';

const MAN_TRUNK = {
  chest: 12,
  top: 23,
  waistHalf: 9,
  chestHalf: 11.5,
  topHalf: 13.2,
  shoulder: 12.3,
};

const MAN_HIP_Y = -60; // genoux bien fléchis (et loin de la jambe tendue, où le genou saute)
const MAN_HIP_SWAY = 5;
const MAN_BOB = 2.8;
const MAN_FOOT_SPREAD = 10.5;
const ARM_LAG = 0.2; // en temps : les bras se balancent après le bassin
const DIP = 5; // plongée de fin de phrase, en unités

// Bras souples, mains près des hanches : elles suivent le bassin avec retard (balancier) ; en
// fin de phrase, elles s'ouvrent à hauteur de poitrine.
function computeManArm(shoulder, sign, swing, open) {
  const rest = { x: shoulder.x + sign * 13 + 3 * swing, y: shoulder.y + 25 - 2 * sign * swing };
  const wide = { x: shoulder.x + sign * 24, y: shoulder.y + 7 };
  const limb = computeFrontalLimb(
    shoulder,
    lerpPoint(rest, wide, open),
    [BODY.upperArm, BODY.forearm],
    sign,
    1,
  );
  return {
    chain: limb.chain,
    hand: { ...limb.chain[2], angle: limb.tipAngle },
    elbowBend: limb.bend,
    shortfall: limb.shortfall,
  };
}

function computeManLeg(waist, hipTilt, sign, foot) {
  const hip = addPoints(waist, rotatePoint({ x: sign * 5, y: 2 }, hipTilt));
  const ankle = { x: foot.x, y: -4 - foot.lift };
  const limb = computeFrontalLimb(hip, ankle, [BODY.thigh, BODY.shin], sign, -1);
  return { chain: limb.chain, foot: { ...limb.chain[2], angle: 0 } };
}

/**
 * Pose du danseur.
 * @param {number} beats Temps musical, en temps.
 * @param {typeof DEFAULT_STYLE} [style] Style propre au personnage.
 * @returns {object} Buste (trunk), tête, bras et jambes (left, right).
 */
export function computeManPose(beats, style = DEFAULT_STYLE) {
  const t = beats + style.timing;
  const steps = computeFootwork(t, MAN_FOOT_SPREAD);
  const flourish = computeFlourish(t);
  const bob = style.amp * MAN_BOB * computeGroovePulse(t, style.seed) + DIP * flourish.strength;
  const waist = {
    x: steps.centerX + MAN_HIP_SWAY * style.amp * computeWeightShift(t, style.seed),
    y: MAN_HIP_Y + bob,
  };
  const trunk = computeFrontTrunk({ waist, centerX: steps.centerX, beats: t, style }, MAN_TRUNK);
  const swing = computeWeightShift(t - ARM_LAG, style.seed) / MAX_SHIFT;

  return {
    trunk: trunk.levels,
    head: trunk.head,
    arms: {
      left: computeManArm(trunk.shoulders.left, -1, swing, flourish.strength),
      right: computeManArm(trunk.shoulders.right, 1, swing, flourish.strength),
    },
    legs: {
      left: computeManLeg(waist, trunk.hipTilt, -1, steps.left),
      right: computeManLeg(waist, trunk.hipTilt, 1, steps.right),
    },
  };
}
