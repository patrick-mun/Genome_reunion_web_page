/* ============================================================
   assets/js/lib/bird-flight.js
   Rôle : vol des paille-en-queue (calcul pur, sans DOM) : l'oiseau garde un cap et une vitesse,
   et tourne vers ses destinations sans jamais descendre sous un rayon de virage minimal.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur ; le DOM est dans paille-en-queue.js).
   ============================================================ */

import { clamp } from './geometry.js';
import { getRandomBetween, pickRandomIndex } from './random.js';
import {
  advanceWings,
  computeThrust,
  computeWingPose,
  createWings,
  startFlapping,
} from './bird-wings.js';

export const BIRD_VIEWBOX = { width: 72, height: 82 };

/* ── DESTINATIONS ──
   Points du « ciel » du hero, ou sorties hors champ. Une destination est choisie plutôt devant
   l'oiseau : un demi-tour reste possible, mais il prend la forme d'une large boucle.
*/

const OFFSCREEN_MARGIN_PX = 120;
const OFFSCREEN_SIDES = ['left', 'right', 'top'];
const EXIT_CHANCE = 0.22;
const MIN_LEG_DISTANCE_PX = 320;
const AHEAD_CHANCE = 0.85; // part des destinations choisies à moins de MAX_AHEAD_TURN_RAD du cap
const MAX_AHEAD_TURN_RAD = (120 * Math.PI) / 180;
const TARGET_TRIES = 10;

/**
 * Point au hasard dans le « ciel » du hero (partie haute et centrale).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{x: number, y: number}} Point dans le hero.
 */
export function pickSkyPoint(world, random = Math.random) {
  return {
    x: getRandomBetween(world.width * 0.06, world.width * 0.94, random),
    y: getRandomBetween(world.height * 0.08, world.height * 0.72, random),
  };
}

/**
 * Point hors du hero, du côté demandé.
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {'left'|'right'|'top'|'bottom'} side Côté de sortie.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{x: number, y: number}} Point situé à OFFSCREEN_MARGIN_PX hors du hero.
 */
export function getOffscreenPoint(world, side, random = Math.random) {
  const alongY = () => getRandomBetween(world.height * 0.1, world.height * 0.7, random);
  const alongX = () => getRandomBetween(world.width * 0.1, world.width * 0.9, random);
  if (side === 'left') return { x: -OFFSCREEN_MARGIN_PX, y: alongY() };
  if (side === 'right') return { x: world.width + OFFSCREEN_MARGIN_PX, y: alongY() };
  if (side === 'top') return { x: alongX(), y: -OFFSCREEN_MARGIN_PX };
  return { x: alongX(), y: world.height + OFFSCREEN_MARGIN_PX };
}

/**
 * Point hors du hero, sur un côté tiré au hasard (gauche, droite ou haut).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{x: number, y: number}} Point hors du hero.
 */
export function pickRandomOffscreenPoint(world, random = Math.random) {
  const side = OFFSCREEN_SIDES[pickRandomIndex(OFFSCREEN_SIDES.length, random)];
  return getOffscreenPoint(world, side, random);
}

/**
 * Indique si un point est sorti du hero d'au moins `margin` pixels.
 * @param {{x: number, y: number}} point Point à tester.
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {number} margin Distance minimale hors du hero, en pixels.
 * @returns {boolean} Vrai si le point est hors champ.
 */
export function isOffscreen(point, world, margin) {
  return (
    point.x < -margin ||
    point.x > world.width + margin ||
    point.y < -margin ||
    point.y > world.height + margin
  );
}

/**
 * Prochaine destination : une sortie de temps en temps, sinon un point du ciel assez loin,
 * le plus souvent devant l'oiseau.
 * @param {{pos: {x: number, y: number}, heading: number}} bird Oiseau (cap en radians).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{point: {x: number, y: number}, isExit: boolean}} Destination.
 */
export function chooseDestination(bird, world, random = Math.random) {
  if (random() < EXIT_CHANCE) {
    return { point: pickRandomOffscreenPoint(world, random), isExit: true };
  }
  const wantsAhead = random() < AHEAD_CHANCE;
  let point = pickSkyPoint(world, random);
  for (let tries = 1; tries < TARGET_TRIES && !suitsBird(bird, point, wantsAhead); tries++) {
    point = pickSkyPoint(world, random);
  }
  return { point, isExit: false };
}

function suitsBird(bird, point, wantsAhead) {
  const dx = point.x - bird.pos.x;
  const dy = point.y - bird.pos.y;
  const turn = Math.abs(wrapAngle(Math.atan2(dy, dx) - bird.heading));
  return Math.hypot(dx, dy) >= MIN_LEG_DISTANCE_PX && (!wantsAhead || turn <= MAX_AHEAD_TURN_RAD);
}

/* ── PILOTAGE ──
   La vitesse de virage visée est proportionnelle à l'écart au cap, bornée par le rayon minimal ;
   l'oiseau s'incline et se redresse progressivement (TURN_RESPONSE_S). Le corps suit le cap.
*/

const MIN_TURN_RADIUS_PX = 140;
const STEERING_GAIN_PER_S = 1.0; // vitesse de virage visée par radian d'écart au cap
const TURN_RESPONSE_S = 0.5;
const MAX_BANK_DEG = 25;
const ARRIVAL_RADIUS_PX = 110;
const OVERSHOOT_RADIUS_PX = 2.2 * MIN_TURN_RADIUS_PX; // destination dépassée : en choisir une autre
const OVERSHOOT_TURN_RAD = (100 * Math.PI) / 180;
const MAX_LEG_S = 14; // une destination trop serrée ferait tourner l'oiseau en rond
const MAX_EXIT_S = 25; // traversée complète du hero comprise
const MAX_LEG_TURN_RAD = 1.5 * Math.PI; // au-delà, l'oiseau tournerait en rond autour du point
// Dérive lente du cap (somme de deux ondulations) : les trajets serpentent au lieu d'aller droit.
const WANDER = [
  { radians: 0.32, periodS: 7.3 },
  { radians: 0.16, periodS: 3.9 },
];

/**
 * Ramène un angle dans [-π, π].
 * @param {number} angle Angle en radians.
 * @returns {number} Angle équivalent entre -π et π.
 */
export function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/**
 * Vitesse de virage maximale à une vitesse donnée (rayon de virage minimal).
 * @param {number} speed Vitesse en pixels par seconde.
 * @returns {number} Vitesse de virage maximale, en radians par seconde.
 */
export function computeMaxTurnRate(speed) {
  return speed / MIN_TURN_RADIUS_PX;
}

/**
 * Dérive du cap à un instant donné, propre à chaque oiseau.
 * @param {{time: number, phaseOff: number}} bird État de l'oiseau (temps en secondes).
 * @returns {number} Décalage du cap visé, en radians.
 */
export function computeWander(bird) {
  return WANDER.reduce(
    (sum, { radians, periodS }, index) =>
      sum + radians * Math.sin((2 * Math.PI * bird.time) / periodS + bird.phaseOff * (index + 2)),
    0,
  );
}

function shouldChangeDestination(bird, distance, headingError) {
  if (bird.isExiting) return bird.legTime > MAX_EXIT_S || bird.legTurn > 2 * Math.PI;
  if (distance < ARRIVAL_RADIUS_PX || bird.legTime > MAX_LEG_S) return true;
  if (bird.legTurn > MAX_LEG_TURN_RAD) return true;
  return distance < OVERSHOOT_RADIUS_PX && Math.abs(headingError) > OVERSHOOT_TURN_RAD;
}

function setDestination(bird, destination) {
  bird.target = destination.point;
  bird.isExiting = destination.isExit;
  bird.legTime = 0;
  bird.legTurn = 0;
}

function steer(bird, dt, world, random) {
  bird.legTime += dt;
  let dx = bird.target.x - bird.pos.x;
  let dy = bird.target.y - bird.pos.y;
  let error = wrapAngle(Math.atan2(dy, dx) - bird.heading);
  if (shouldChangeDestination(bird, Math.hypot(dx, dy), error)) {
    setDestination(bird, chooseDestination(bird, world, random));
    dx = bird.target.x - bird.pos.x;
    dy = bird.target.y - bird.pos.y;
    error = wrapAngle(Math.atan2(dy, dx) - bird.heading);
  }
  const maxRate = computeMaxTurnRate(bird.speed);
  const wanted = clamp(
    STEERING_GAIN_PER_S * wrapAngle(error + computeWander(bird)),
    -maxRate,
    maxRate,
  );
  bird.turnRate += (wanted - bird.turnRate) * (1 - Math.exp(-dt / TURN_RESPONSE_S));
  bird.turnRate = clamp(bird.turnRate, -maxRate, maxRate);
}

/* ── VITESSE ──
   L'oiseau accélère en battant des ailes et ralentit en glissade ; trop lent, il rebat des ailes.
*/

const FLAP_SPEED_RATIO = 1.06;
const FLAP_ACCEL_PER_S = 0.5;
const GLIDE_DRAG_PER_S = 0.07;
const RESUME_FLAP_SPEED_RATIO = 0.88;
const SPEED_RATIO_RANGE = { min: 0.8, max: 1.1 };

function updateSpeed(bird, dt, random) {
  const thrust = computeThrust(bird.wings);
  const cruise = bird.cruiseSpeed;
  bird.speed += (cruise * FLAP_SPEED_RATIO - bird.speed) * FLAP_ACCEL_PER_S * thrust * dt;
  bird.speed -= bird.speed * GLIDE_DRAG_PER_S * (1 - thrust) * dt;
  bird.speed = clamp(bird.speed, cruise * SPEED_RATIO_RANGE.min, cruise * SPEED_RATIO_RANGE.max);
  if (!bird.wings.isFlapping && bird.speed < cruise * RESUME_FLAP_SPEED_RATIO) {
    startFlapping(bird.wings, random);
  }
}

/* ── QUEUE ──
   Les brins traînent derrière l'oiseau : en virage, ils suivent la courbe vers l'intérieur,
   avec un temps de retard, et frémissent légèrement.
*/

const TAIL_TURN_DEG = 9;
const TAIL_RESPONSE_S = 0.4;
const TAIL_FLUTTER = [
  { degrees: 1.2, hz: 1.6 },
  { degrees: 0.6, hz: 2.7 },
];

function updateTail(bird, dt, turnShare) {
  const target = -TAIL_TURN_DEG * turnShare;
  bird.tailBend += (target - bird.tailBend) * (1 - Math.exp(-dt / TAIL_RESPONSE_S));
}

/**
 * Angle de la queue : courbure en virage et frémissement.
 * @param {{tailBend: number, time: number, phaseOff: number}} bird État de l'oiseau.
 * @returns {number} Rotation des brins en degrés (positive : vers la gauche de l'oiseau).
 */
export function computeTailAngle(bird) {
  return TAIL_FLUTTER.reduce(
    (angle, { degrees, hz }, index) =>
      angle + degrees * Math.sin(2 * Math.PI * hz * bird.time + bird.phaseOff * (index + 1)),
    bird.tailBend,
  );
}

/* ── ÉTAT ET IMAGE PAR IMAGE ── */

const REENTRY_DELAY_S = { min: 0.8, max: 4 };
const ENTRY_HEADING_JITTER_RAD = (15 * Math.PI) / 180;

/**
 * Crée l'état d'un oiseau, posé hors du hero avant son entrée en scène.
 * @param {number} index Rang de l'oiseau (décale son apparition et son côté d'entrée).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {object} État de l'oiseau (taille, vitesses, position, cap, ailes, délai…).
 */
export function createBird(index, world, random = Math.random) {
  const scale = getRandomBetween(0.68, 0.96, random);
  const cruiseSpeed = getRandomBetween(86, 128, random);
  const start = getOffscreenPoint(world, index % 2 === 0 ? 'left' : 'right', random);
  const heading = start.x < 0 ? 0 : Math.PI;
  return {
    cw: BIRD_VIEWBOX.width * scale,
    ch: BIRD_VIEWBOX.height * scale,
    finalOpacity: (0.78 + scale * 0.22).toFixed(2),
    cruiseSpeed,
    speed: cruiseSpeed,
    pos: { x: start.x, y: start.y },
    heading,
    angle: (heading * 180) / Math.PI + 90,
    turnRate: 0,
    bank: 0,
    target: null,
    isExiting: false,
    legTime: 0,
    legTurn: 0,
    awayLeft: 0,
    wings: createWings(random),
    tailBend: 0,
    time: 0,
    phaseOff: getRandomBetween(0, Math.PI * 2, random),
    delay: index * 850 + getRandomBetween(0, 500, random),
    isBorn: false,
    t0base: 0,
  };
}

function enterScene(bird, world, random, start) {
  bird.pos = start ?? pickRandomOffscreenPoint(world, random);
  setDestination(bird, { point: pickSkyPoint(world, random), isExit: false });
  const toTarget = Math.atan2(bird.target.y - bird.pos.y, bird.target.x - bird.pos.x);
  bird.heading = toTarget + getRandomBetween(-1, 1, random) * ENTRY_HEADING_JITTER_RAD;
  bird.turnRate = 0;
  bird.speed = bird.cruiseSpeed;
}

function fly(bird, dt, world, random) {
  bird.time += dt;
  steer(bird, dt, world, random);
  updateSpeed(bird, dt, random);
  bird.heading = wrapAngle(bird.heading + bird.turnRate * dt);
  bird.legTurn += Math.abs(bird.turnRate * dt);
  bird.pos = {
    x: bird.pos.x + Math.cos(bird.heading) * bird.speed * dt,
    y: bird.pos.y + Math.sin(bird.heading) * bird.speed * dt,
  };
  const turnShare = clamp(bird.turnRate / computeMaxTurnRate(bird.speed), -1, 1);
  bird.bank = MAX_BANK_DEG * turnShare;
  bird.angle = (bird.heading * 180) / Math.PI + 90;
  updateTail(bird, dt, turnShare);
  if (bird.isExiting && isOffscreen(bird.pos, world, OFFSCREEN_MARGIN_PX / 2)) {
    bird.awayLeft = getRandomBetween(REENTRY_DELAY_S.min, REENTRY_DELAY_S.max, random);
  }
}

/**
 * Fait avancer un oiseau d'une image : entrée en scène, pilotage, vitesse, ailes et queue.
 * Sorti du hero, l'oiseau patiente hors champ puis revient par un côté tiré au hasard.
 * @param {object} bird État de l'oiseau, modifié sur place.
 * @param {number} now Horodatage courant, en millisecondes.
 * @param {number} dt Écart depuis l'image précédente, en secondes (strictement positif).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {boolean} Vrai à l'image où l'oiseau entre en scène (le DOM le révèle alors).
 */
export function advanceBird(bird, now, dt, world, random = Math.random) {
  let isNewlyBorn = false;
  if (!bird.isBorn) {
    if (now < bird.t0base + bird.delay) return false;
    bird.isBorn = true;
    isNewlyBorn = true;
    enterScene(bird, world, random, bird.pos);
  }
  if (bird.awayLeft > 0) {
    bird.awayLeft -= dt;
    if (bird.awayLeft <= 0) enterScene(bird, world, random);
    return isNewlyBorn;
  }
  fly(bird, dt, world, random);
  advanceWings(bird.wings, dt, random);
  return isNewlyBorn;
}

/**
 * Pose de l'oiseau : envergure et balayage de chaque aile, angle de la queue.
 * @param {object} bird État de l'oiseau.
 * @returns {{wings: ReturnType<typeof computeWingPose>, tail: number}} Pose à dessiner.
 */
export function computeBirdPose(bird) {
  return { wings: computeWingPose(bird.wings, bird.bank), tail: computeTailAngle(bird) };
}
