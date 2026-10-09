/* ============================================================
   assets/js/lib/maloya-musicians.js
   Rôle : poses des musiciens de la frise du maloya (calcul pur), vus de profil et tournés
   vers +x. Assis : roulèr, sati, pikèr, frappés des deux mains ou de deux baguettes. Debout :
   bobre (arc à calebasse) et kayamb (cadre secoué). Le corps est fait de chaînes de points
   (colonne, bras, jambes) que maloya-bodies.js habille de contours continus ; la tête, les
   mains, les pieds et les instruments sont rendus par {x, y, angle}. La colonne se courbe et
   plonge dans les temps, du bas du dos vers le haut ; la tête compense le buste au lieu de le
   suivre ; la main monte près du corps et retombe en avant, le poignet en retard.
   Sol en y = 0 (70 unités ≈ 1 m).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { computeGroovePulse, computeLoopNoise, DEFAULT_STYLE } from './maloya-groove.js';
import { addPoints, computeBoneAngle, lerp, rotatePoint, solveTwoBone } from './maloya-limbs.js';
import {
  BOBRE_HITS,
  computeDownbeatAccent,
  computeHandStroke,
  computeKayambShake,
  PIKER_HITS,
  ROULER_HITS,
  SATI_HITS,
} from './maloya-rhythm.js';

export const BODY = {
  spine: [11, 10, 8], // hanche → taille → poitrine → haut des épaules
  neck: 5, // haut des épaules → base du cou
  upperArm: 19,
  forearm: 16,
  thigh: 29,
  shin: 29,
};

/* ── CORPS DE PROFIL ──
   Colonne en trois segments, de plus en plus penchés vers le haut (dos arrondi au-dessus de
   l'instrument). Elle plonge dans les temps, le bas du dos d'abord, le haut avec retard.
*/

// Part de l'inclinaison du buste, du bas vers le haut (en moyenne 1 : les épaules restent où
// les placerait un buste droit penché d'autant).
const SPINE_SHARE = [0.7, 1.05, 1.35];
const PULSE_SHARE = [0.4, 0.8, 1.2]; // part de la plongée, du bas vers le haut
const SPINE_LAG = 0.06; // en temps, d'un segment de la colonne au suivant
const HEAD_BASE = 0.25; // la tête penche du quart de l'inclinaison du buste…
const HEAD_FOLLOW = 0.3; // … et ne reprend que 30 % de ses mouvements
const HEAD_LAG = 0.12; // en temps
const NOD = 4; // hochement sur le premier temps, en degrés

function computeSpine(hip, angles) {
  const points = [hip];
  angles.forEach((angle, i) => {
    points.push(addPoints(points[i], rotatePoint({ x: 0, y: -BODY.spine[i] }, angle)));
  });
  return points;
}

/**
 * Haut du corps de profil : colonne courbée, base du cou, épaule, angle de la tête.
 * @param {{x: number, y: number}} hip Hanche (bas de la colonne).
 * @param {number} lean Inclinaison du buste, en degrés (positive : vers l'avant).
 * @param {(lag: number) => number} plunge Plongée du buste, avec un retard donné en temps.
 * @param {number} headBeats Temps propre au personnage, pour le hochement de tête.
 * @returns {{spine: Array<{x: number, y: number}>, neck: object, shoulder: object,
 *   head: {x: number, y: number, angle: number}}} Colonne, cou, épaule et tête.
 */
export function computeProfileTrunk(hip, lean, plunge, headBeats) {
  const angles = SPINE_SHARE.map(
    (share, i) => lean * share + PULSE_SHARE[i] * plunge(i * SPINE_LAG),
  );
  const spine = computeSpine(hip, angles);
  const top = spine[3];
  const neck = addPoints(top, rotatePoint({ x: 0, y: -BODY.neck }, angles[2]));
  const headAngle =
    HEAD_BASE * lean +
    HEAD_FOLLOW * (angles[2] - lean * SPINE_SHARE[2]) +
    0.4 * plunge(HEAD_LAG) +
    NOD * computeDownbeatAccent(headBeats - HEAD_LAG);
  return {
    spine,
    neck,
    shoulder: addPoints(top, rotatePoint({ x: 1.5, y: -1 }, angles[2])),
    head: { ...neck, angle: headAngle },
  };
}

/**
 * Bras de profil vers un poignet donné, coude vers le bas et l'arrière.
 * @param {{x: number, y: number}} shoulder Épaule.
 * @param {{x: number, y: number}} wrist Poignet visé.
 * @param {number} [handAngle] Angle de la main ; par défaut, dans l'axe de l'avant-bras.
 * @returns {{chain: Array<{x: number, y: number}>, hand: object, foreAngle: number,
 *   elbowBend: number, shortfall: number}} Chaîne épaule-coude-poignet, main, angle de
 *   l'avant-bras, ouverture du coude et manque d'allonge.
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
    chain: [shoulder, joint, end],
    hand: { ...end, angle: handAngle ?? foreAngle },
    foreAngle,
    elbowBend: bend,
    shortfall,
  };
}

/**
 * Jambe de profil, genou plié vers l'avant et le haut.
 * @param {{x: number, y: number}} hip Hanche.
 * @param {{x: number, y: number}} ankle Cheville.
 * @returns {{chain: Array<{x: number, y: number}>, foot: object}} Chaîne hanche-genou-cheville
 *   et pied.
 */
export function computeProfileLeg(hip, ankle) {
  const { joint, end } = solveTwoBone(hip, ankle, BODY.thigh, BODY.shin, -1);
  return { chain: [hip, joint, end], foot: { ...end, angle: 0 } };
}

/* ── MUSICIENS ASSIS ──
   Une configuration par instrument : siège, inclinaison du buste, poignets en frappe et en
   levée, angle de la main sur l'instrument, chevilles.
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
  strokeArc: 0.18, // mains nues : la main monte près du corps et retombe en avant
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
  wristRaised: { a: { x: 22, y: -60 }, b: { x: 18.5, y: -60.5 } },
  strokeArc: 0.06, // baguettes menées surtout du poignet
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
  strokeArc: 0.12,
  handContactAngle: -35,
  wristFlexRaised: 20,
  ankles: { near: { x: 14, y: -4 }, far: { x: 10, y: -5 } },
};

const PULSE_LEAD = 0.72; // le buste des musiciens est au plus bas juste sur le temps
// Jambes des musiciens assis : immobiles, calculées une fois par instrument et figées (leur
// contour peut alors être réutilisé d'une image à l'autre, voir maloya-bodies.js).
const seatedLegs = new WeakMap();

function computeSeatedLegs(config) {
  if (!seatedLegs.has(config)) {
    const leg = (offset, ankle) => {
      const { chain, foot } = computeProfileLeg(addPoints(config.seat, offset), ankle);
      return Object.freeze({ chain: Object.freeze(chain), foot });
    };
    seatedLegs.set(config, {
      near: leg({ x: 1, y: 1 }, config.ankles.near),
      far: leg({ x: -1, y: 0 }, config.ankles.far),
    });
  }
  return seatedLegs.get(config);
}
const PULSE_LEAN = 1.5; // degrés de plongée par unité de pulsation
const SWAY = 1.5; // balancement lent du buste sur deux temps, en degrés
const STROKE_FORWARD = 0.6; // la main retombe en avant sur un arc plus serré qu'à la montée
const BOBRE_ARC = 0.15;
const HAND_LAG = 0.06; // en temps : le poignet suit l'avant-bras (coup de fouet)

/**
 * Poignet sur la course d'une frappe : il monte en passant près du corps et retombe en avant,
 * comme une boucle, au lieu d'aller et venir sur une droite.
 * @param {{x: number, y: number}} contact Poignet sur l'instrument.
 * @param {{x: number, y: number}} raised Poignet en haut de la levée complète.
 * @param {{lift: number, loop: number, isRising: boolean}} stroke Coup (computeHandStroke).
 * @param {number} arc Écart de la boucle à mi-course, en part de la course.
 * @returns {{x: number, y: number}} Poignet.
 */
export function computeStrokeWrist(contact, raised, stroke, arc) {
  const axis = { x: raised.x - contact.x, y: raised.y - contact.y };
  const side = stroke.isRising ? arc : -STROKE_FORWARD * arc;
  const bulge = side * stroke.loop;
  // (axis.y, -axis.x) : perpendiculaire à la course, vers l'arrière du personnage.
  return {
    x: contact.x + axis.x * stroke.lift + axis.y * bulge,
    y: contact.y + axis.y * stroke.lift - axis.x * bulge,
  };
}

function computeStrikingArm(config, shoulder, beats, side) {
  const hits = config.hits[side];
  const stroke = computeHandStroke(beats, hits);
  const wrist = computeStrokeWrist(
    config.wristContact[side],
    config.wristRaised[side],
    stroke,
    config.strokeArc,
  );
  const arm = computeProfileArm(shoulder, wrist);
  const flex = computeHandStroke(beats - HAND_LAG, hits).lift;
  const angle = lerp(config.handContactAngle, arm.foreAngle + config.wristFlexRaised, flex);
  return { ...arm, hand: { ...arm.hand, angle } };
}

/**
 * Pose d'un musicien assis.
 * @param {number} beats Temps musical, en temps.
 * @param {typeof ROULER} config Instrument joué (ROULER, SATI, PIKER).
 * @param {typeof DEFAULT_STYLE} [style] Style propre au personnage.
 * @returns {object} Colonne (spine), tête, bras et jambes (near, far), levées des mains.
 */
export function computeSeatedPose(beats, config, style = DEFAULT_STYLE) {
  const t = beats + style.timing;
  const variation = computeLoopNoise(t, style.seed);
  const liftA = computeHandStroke(t, config.hits.a).lift;
  const liftB = computeHandStroke(t, config.hits.b).lift;
  const handsDown = 1 - (liftA + liftB) / 2;
  const sway = SWAY * (1 + 0.5 * variation) * Math.sin(Math.PI * t + config.swayPhase);
  const lean = config.lean + sway + 1.5 * variation + config.leanOnHit * handsDown;
  const plunge = (lag) =>
    style.amp * PULSE_LEAN * computeGroovePulse(t - lag, style.seed, PULSE_LEAD);
  const trunk = computeProfileTrunk(config.seat, lean, plunge, t);

  return {
    spine: trunk.spine,
    head: trunk.head,
    arms: {
      near: computeStrikingArm(config, trunk.shoulder, t, 'a'),
      far: computeStrikingArm(config, addPoints(trunk.shoulder, { x: -2, y: -1 }), t, 'b'),
    },
    legs: computeSeatedLegs(config),
    lifts: { a: liftA, b: liftB },
  };
}

/* ── MUSICIENS DEBOUT ──
   Genoux souples qui plongent sur chaque temps. L'instrument suit le buste : ses points
   sont donnés dans le repère du buste (hanche en 0, buste vers -y, avant vers +x).
*/

const STANDING_HIP_Y = -60;
const STANDING_BOB = 1.8;
const STANDING_ANKLES = { near: { x: 4, y: -4 }, far: { x: -6, y: -4 } };

export const BOBRE_SHAPE = {
  grip: { x: 15, y: -23 }, // main éloignée sur l'arc
  strike: { x: 19, y: -16 }, // main proche, baguette contre la corde
  strikeRaised: { x: 25, y: -19 },
};

export const KAYAMB_SHAPE = {
  center: { x: 19.5, y: -21 },
  halfWidth: 11,
  shakeDistance: 2.6,
  shakeAngle: 7,
};

function computeStandingBody(t, style, lean) {
  // Comme les musiciens assis, ils plongent sur le temps (les danseurs, après le transfert).
  const bob = style.amp * STANDING_BOB * computeGroovePulse(t, style.seed, PULSE_LEAD);
  const hip = { x: 0, y: STANDING_HIP_Y + bob };
  const plunge = (lag) => style.amp * computeGroovePulse(t - lag, style.seed, PULSE_LEAD);
  const trunk = computeProfileTrunk(hip, lean, plunge, t);
  return {
    ...trunk,
    torso: { ...hip, angle: lean },
    toWorld: (local) => addPoints(hip, rotatePoint(local, lean)),
    legs: {
      near: computeProfileLeg(addPoints(hip, { x: 2, y: 1 }), STANDING_ANKLES.near),
      far: computeProfileLeg(addPoints(hip, { x: -2, y: 0 }), STANDING_ANKLES.far),
    },
  };
}

/**
 * Pose du joueur de bobre : l'arc contre le ventre, une main le tient, l'autre frappe la corde.
 * @param {number} beats Temps musical, en temps.
 * @param {typeof DEFAULT_STYLE} [style] Style propre au personnage.
 * @returns {object} Colonne, tête, bras, jambes, pose de l'arc (instrument) et levée.
 */
export function computeBobrePose(beats, style = DEFAULT_STYLE) {
  const t = beats + style.timing;
  const stroke = computeHandStroke(t, BOBRE_HITS);
  const lift = 0.6 * stroke.lift;
  const lean = 6 + 2 * Math.sin(Math.PI * t + 0.7) + computeLoopNoise(t, style.seed);
  const body = computeStandingBody(t, style, lean);
  const strike = computeStrokeWrist(
    body.toWorld(BOBRE_SHAPE.strike),
    body.toWorld(BOBRE_SHAPE.strikeRaised),
    { lift, loop: 0.6 * stroke.loop, isRising: stroke.isRising },
    BOBRE_ARC,
  );
  return {
    spine: body.spine,
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
 * @param {typeof DEFAULT_STYLE} [style] Style propre au personnage.
 * @returns {object} Colonne, tête, bras, jambes, pose du kayamb (instrument) et secousse.
 */
export function computeKayambPose(beats, style = DEFAULT_STYLE) {
  const t = beats + style.timing;
  const shake = computeKayambShake(t);
  const lean =
    4 + 1.5 * shake + 1.5 * Math.sin(Math.PI * t + 1.9) + computeLoopNoise(t, style.seed);
  const body = computeStandingBody(t, style, lean);
  const { center, halfWidth, shakeDistance, shakeAngle } = KAYAMB_SHAPE;
  const angle = lean + shakeAngle * shake;
  const middle = body.toWorld({ x: center.x + shakeDistance * shake, y: center.y });
  const edge = (side) => addPoints(middle, rotatePoint({ x: side * halfWidth, y: 0 }, angle));
  return {
    spine: body.spine,
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
