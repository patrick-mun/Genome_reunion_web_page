/* ============================================================
   assets/js/lib/maloya-musicians.js
   Rôle : poses des musiciens de la frise du maloya (calcul pur), vus de profil et tournés
   vers +x. Assis : roulèr, sati, pikèr, frappés des deux mains ou de deux baguettes. Debout :
   bobre (arc à calebasse) et kayamb (cadre secoué). Chaque partie est rendue par
   {x, y, angle} : position de son pivot et rotation SVG. Sol en y = 0 (70 unités ≈ 1 m).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import {
  BOBRE_HITS,
  computeDownbeatAccent,
  computeHandLift,
  computeKayambShake,
  PIKER_HITS,
  ROULER_HITS,
  SATI_HITS,
} from './maloya-rhythm.js';
import {
  addPoints,
  computeBoneAngle,
  lerp,
  lerpPoint,
  rotatePoint,
  solveTwoBone,
} from './maloya-limbs.js';

export const BODY = {
  torso: 34, // hanche → base du cou
  shoulder: 30, // hanche → épaule, le long du buste
  upperArm: 19,
  forearm: 16,
  thigh: 29,
  shin: 29,
};

/* ── MUSICIENS ASSIS ──
   Une configuration par instrument : siège, inclinaison du buste, poignets en frappe et en
   levée, angle de la main sur l'instrument, chevilles. Le buste accompagne les frappes.
*/

/* Roulèr : à califourchon sur le tambour couché, penché au-dessus de la peau (face avant). */
export const ROULER = {
  hits: ROULER_HITS,
  seat: { x: -6, y: -41 },
  lean: 42,
  leanOnHit: 5,
  swayPhase: 0,
  wristContact: { a: { x: 32, y: -37.5 }, b: { x: 33.5, y: -34.5 } },
  wristRaised: { a: { x: 33, y: -57 }, b: { x: 35, y: -55 } },
  handContactAngle: -12,
  wristFlexRaised: 30,
  ankles: { near: { x: 19, y: -4 }, far: { x: 15, y: -5 } },
};

/* Sati : sur un tabouret bas, la plaque de métal posée sur les genoux. */
export const SATI = {
  hits: SATI_HITS,
  seat: { x: -4, y: -28 },
  lean: 12,
  leanOnHit: 3,
  swayPhase: 1.3,
  wristContact: { a: { x: 22, y: -45 }, b: { x: 18, y: -46 } },
  wristRaised: { a: { x: 20, y: -60 }, b: { x: 16, y: -61 } },
  handContactAngle: -35,
  wristFlexRaised: 20,
  ankles: { near: { x: 22, y: -4 }, far: { x: 18, y: -5 } },
};

/* Pikèr : sur un tabouret bas, penché vers le bambou couché sur ses fourches. */
export const PIKER = {
  hits: PIKER_HITS,
  seat: { x: -6, y: -28 },
  lean: 30,
  leanOnHit: 4,
  swayPhase: 2.4,
  wristContact: { a: { x: 30, y: -27 }, b: { x: 26, y: -28 } },
  wristRaised: { a: { x: 27, y: -45 }, b: { x: 23, y: -46 } },
  handContactAngle: -35,
  wristFlexRaised: 20,
  ankles: { near: { x: 14, y: -4 }, far: { x: 10, y: -5 } },
};

const NOD_ON_DOWNBEAT = 6;
const BODY_SWAY = 1.5; // balancement du buste sur deux temps, en degrés
const HEAD_LAG = 0.25; // en temps : la tête suit le buste

/**
 * Bras de profil vers un poignet donné, coude vers le bas et l'arrière.
 * @param {{x: number, y: number}} shoulder Épaule.
 * @param {{x: number, y: number}} wrist Poignet visé.
 * @param {number} [handAngle] Angle de la main ; par défaut, dans l'axe de l'avant-bras.
 * @returns {object} Parties upper, fore, hand, ouverture du coude et manque d'allonge.
 */
export function computeProfileArm(shoulder, wrist, handAngle) {
  const { joint, end, bend, shortfall } = solveTwoBone(
    shoulder,
    wrist,
    BODY.upperArm,
    BODY.forearm,
    1,
  );
  const foreAngle = computeBoneAngle(joint, end);
  return {
    upper: { ...shoulder, angle: computeBoneAngle(shoulder, joint) },
    fore: { ...joint, angle: foreAngle },
    hand: { ...end, angle: handAngle ?? foreAngle },
    elbowBend: bend,
    shortfall,
  };
}

/**
 * Jambe de profil, genou plié vers l'avant et le haut.
 * @param {{x: number, y: number}} hip Hanche.
 * @param {{x: number, y: number}} ankle Cheville.
 * @returns {object} Parties thigh, shin, foot.
 */
export function computeProfileLeg(hip, ankle) {
  const { joint, end } = solveTwoBone(hip, ankle, BODY.thigh, BODY.shin, -1);
  return {
    thigh: { ...hip, angle: computeBoneAngle(hip, joint) },
    shin: { ...joint, angle: computeBoneAngle(joint, end) },
    foot: { ...end, angle: 0 },
  };
}

function computeStrikingArm(config, shoulder, lift, side) {
  const wrist = lerpPoint(config.wristContact[side], config.wristRaised[side], lift);
  const arm = computeProfileArm(shoulder, wrist);
  return {
    ...arm,
    hand: {
      ...arm.hand,
      angle: lerp(config.handContactAngle, arm.fore.angle + config.wristFlexRaised, lift),
    },
  };
}

/**
 * Pose d'un musicien assis.
 * @param {number} beats Temps musical, en temps.
 * @param {typeof ROULER} config Instrument joué (ROULER, SATI, PIKER).
 * @returns {object} Parties (torso, head, arms.near/far, legs.near/far) et levées des mains.
 */
export function computeSeatedPose(beats, config) {
  const liftA = computeHandLift(beats, config.hits.a);
  const liftB = computeHandLift(beats, config.hits.b);
  const sway = BODY_SWAY * Math.sin(Math.PI * beats + config.swayPhase);
  const lean = config.lean + sway + config.leanOnHit * (1 - (liftA + liftB) / 2);
  const { seat } = config;
  const neck = addPoints(seat, rotatePoint({ x: 0, y: -BODY.torso }, lean));
  const shoulder = addPoints(seat, rotatePoint({ x: 1.5, y: -BODY.shoulder }, lean));

  return {
    torso: { ...seat, angle: lean },
    head: {
      ...neck,
      angle:
        config.lean * 0.25 +
        BODY_SWAY * Math.sin(Math.PI * (beats - HEAD_LAG) + config.swayPhase) +
        NOD_ON_DOWNBEAT * computeDownbeatAccent(beats - 0.1),
    },
    arms: {
      near: computeStrikingArm(config, shoulder, liftA, 'a'),
      far: computeStrikingArm(config, addPoints(shoulder, { x: -2, y: -1 }), liftB, 'b'),
    },
    legs: {
      near: computeProfileLeg(addPoints(seat, { x: 1, y: 1 }), config.ankles.near),
      far: computeProfileLeg(addPoints(seat, { x: -1, y: 0 }), config.ankles.far),
    },
    lifts: { a: liftA, b: liftB },
  };
}

/* ── MUSICIENS DEBOUT ──
   Genoux souples qui marquent le temps. L'instrument suit le buste : ses points sont donnés
   dans le repère du buste (hanche en 0, buste vers -y, avant vers +x).
*/

const STANDING_HIP_Y = -60;
const STANDING_BOB = 1.6;
const STANDING_ANKLES = { near: { x: 4, y: -4 }, far: { x: -6, y: -4 } };

export const BOBRE_SHAPE = {
  grip: { x: 15, y: -23 }, // main éloignée sur l'arc
  strike: { x: 19, y: -16 }, // main proche, baguette contre la corde
  strikeRaised: { x: 25, y: -19 },
};

export const KAYAMB_SHAPE = {
  center: { x: 18, y: -21 },
  halfWidth: 11,
  shakeDistance: 2.6,
  shakeAngle: 7,
};

function computeStandingBody(beats, lean, headLean) {
  const bob = STANDING_BOB * (0.5 + 0.5 * Math.cos(2 * Math.PI * (beats - 0.1)));
  const hip = { x: 0, y: STANDING_HIP_Y + bob };
  const toWorld = (local) => addPoints(hip, rotatePoint(local, lean));
  return {
    toWorld,
    torso: { ...hip, angle: lean },
    head: { ...toWorld({ x: 0, y: -BODY.torso }), angle: headLean * 0.3 },
    shoulder: toWorld({ x: 1.5, y: -BODY.shoulder }),
    legs: {
      near: computeProfileLeg(addPoints(hip, { x: 2, y: 1 }), STANDING_ANKLES.near),
      far: computeProfileLeg(addPoints(hip, { x: -2, y: 0 }), STANDING_ANKLES.far),
    },
  };
}

/**
 * Pose du joueur de bobre : l'arc contre le ventre, une main le tient, l'autre frappe la corde.
 * @param {number} beats Temps musical, en temps.
 * @returns {object} Parties, pose de l'arc (instrument) et levée de la main qui frappe.
 */
export function computeBobrePose(beats) {
  const lift = computeHandLift(beats, BOBRE_HITS) * 0.6;
  const lean = 6 + 2 * Math.sin(Math.PI * beats + 0.7);
  const body = computeStandingBody(
    beats,
    lean,
    6 + 2 * Math.sin(Math.PI * (beats - HEAD_LAG) + 0.7),
  );
  const strike = body.toWorld(lerpPoint(BOBRE_SHAPE.strike, BOBRE_SHAPE.strikeRaised, lift));
  return {
    torso: body.torso,
    head: body.head,
    legs: body.legs,
    instrument: body.torso,
    arms: {
      near: computeProfileArm(body.shoulder, strike, lean - 60),
      far: computeProfileArm(
        addPoints(body.shoulder, { x: -2, y: -1 }),
        body.toWorld(BOBRE_SHAPE.grip),
      ),
    },
    lift,
  };
}

/**
 * Pose du joueur de kayamb : le cadre tenu des deux mains devant la poitrine, secoué.
 * @param {number} beats Temps musical, en temps.
 * @returns {object} Parties, pose du kayamb (instrument) et secousse.
 */
export function computeKayambPose(beats) {
  const shake = computeKayambShake(beats);
  const lean = 4 + 1.5 * shake + 1.5 * Math.sin(Math.PI * beats + 1.9);
  const body = computeStandingBody(
    beats,
    lean,
    4 + 1.5 * Math.sin(Math.PI * (beats - HEAD_LAG) + 1.9),
  );
  const { center, halfWidth, shakeDistance, shakeAngle } = KAYAMB_SHAPE;
  const angle = lean + shakeAngle * shake;
  const middle = body.toWorld({ x: center.x + shakeDistance * shake, y: center.y });
  const edge = (side) => addPoints(middle, rotatePoint({ x: side * halfWidth, y: 0 }, angle));
  return {
    torso: body.torso,
    head: body.head,
    legs: body.legs,
    instrument: { ...middle, angle },
    arms: {
      near: computeProfileArm(body.shoulder, edge(1)),
      far: computeProfileArm(addPoints(body.shoulder, { x: -2, y: -1 }), edge(-1)),
    },
    shake,
  };
}
