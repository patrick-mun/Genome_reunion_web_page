/* ============================================================
   assets/js/lib/bird-flight.js
   Rôle : trajectoires et pose des paille-en-queue (calcul pur, sans DOM).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur ; le DOM est dans paille-en-queue.js).
   ============================================================ */

import {
  angleDifference,
  buildBezierPath,
  clamp,
  headingToAngle,
  sampleAlong,
} from './geometry.js';
import { rand, randomIndex } from './random.js';

export const BIRD_VIEWBOX = { width: 72, height: 82 };

const BEZIER_STEPS = 46;
const OFFSCREEN_MARGIN_PX = 120;
const OFFSCREEN_SIDES = ['left', 'right', 'top'];
const RETURN_OFFSCREEN_CHANCE = 0.22;
const MIN_TURN_SPEED = 8;

/**
 * Point au hasard dans le « ciel » du hero (partie haute et centrale).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{x: number, y: number}} Point dans le hero.
 */
export function skyPoint(world, random = Math.random) {
  return {
    x: rand(world.width * 0.06, world.width * 0.94, random),
    y: rand(world.height * 0.08, world.height * 0.72, random),
  };
}

/**
 * Point hors du hero, du côté demandé.
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {'left'|'right'|'top'|'bottom'} side Côté de sortie.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{x: number, y: number}} Point situé à OFFSCREEN_MARGIN_PX hors du hero.
 */
export function offscreenPoint(world, side, random = Math.random) {
  if (side === 'left') {
    return { x: -OFFSCREEN_MARGIN_PX, y: rand(world.height * 0.1, world.height * 0.7, random) };
  }
  if (side === 'right') {
    return {
      x: world.width + OFFSCREEN_MARGIN_PX,
      y: rand(world.height * 0.1, world.height * 0.7, random),
    };
  }
  if (side === 'top') {
    return { x: rand(world.width * 0.1, world.width * 0.9, random), y: -OFFSCREEN_MARGIN_PX };
  }
  return {
    x: rand(world.width * 0.1, world.width * 0.9, random),
    y: world.height + OFFSCREEN_MARGIN_PX,
  };
}

/**
 * Point hors du hero, sur un côté tiré au hasard (gauche, droite ou haut).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{x: number, y: number}} Point hors du hero.
 */
export function randomOffscreenPoint(world, random = Math.random) {
  return offscreenPoint(
    world,
    OFFSCREEN_SIDES[randomIndex(OFFSCREEN_SIDES.length, random)],
    random,
  );
}

/**
 * Construit un segment de vol de la position de l'oiseau vers `endPoint`, en
 * alignant la tangente de départ sur son cap actuel pour éviter tout virage brutal.
 * @param {{pos: {x: number, y: number}, angle: number, speed: number}} bird Oiseau qui part.
 * @param {{x: number, y: number}} endPoint Destination.
 * @param {{lift?: number, durScale?: number}} options Courbure verticale et facteur de durée.
 * @param {number} now Horodatage de départ, en millisecondes.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{pts: Array<{x: number, y: number}>, cum: number[], arc: number, dur: number,
 *   t0: number}} Segment de vol (`dur` en millisecondes).
 */
export function createFlight(bird, endPoint, options, now, random = Math.random) {
  const start = { x: bird.pos.x, y: bird.pos.y };
  const dx = endPoint.x - start.x;
  const dy = endPoint.y - start.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const px = -uy;
  const py = ux;

  const currentHeading = ((bird.angle - 90) * Math.PI) / 180;
  const hx = Math.cos(currentHeading);
  const hy = Math.sin(currentHeading);
  const turn = Math.abs(angleDifference(headingToAngle(dx, dy), bird.angle)) / 180;

  const sway = rand(-1, 1, random) * Math.min(dist * 0.32, 190);
  const out = clamp(dist * 0.4, 110, 360);
  const lift = options.lift || rand(-90, 60, random);
  const wide = 1 + turn * 1.1;

  const p1 = {
    x: start.x + hx * out * wide + px * sway * 0.35,
    y: start.y + hy * out * wide + py * sway * 0.35 + lift - turn * 90,
  };
  const p2 = {
    x: endPoint.x - ux * out * 0.92 + px * sway * 0.58,
    y: endPoint.y - uy * out * 0.92 + py * sway * 0.58 + lift * 0.2 - turn * 55,
  };
  const path = buildBezierPath(start, p1, p2, endPoint, BEZIER_STEPS);

  return {
    ...path,
    dur: clamp(path.arc / bird.speed, 2.1, 18.0) * 1000 * (options.durScale || 1),
    t0: now,
  };
}

/**
 * Crée l'état d'un oiseau, posé hors du hero avant son entrée en scène.
 * @param {number} index Rang de l'oiseau (décale son apparition et son côté d'entrée).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {object} État de l'oiseau (taille, vitesse, position, phase d'aile, délai…).
 */
export function createBird(index, world, random = Math.random) {
  const scale = rand(0.68, 0.96, random);
  const start = offscreenPoint(world, index % 2 === 0 ? 'left' : 'right', random);
  return {
    cw: BIRD_VIEWBOX.width * scale,
    ch: BIRD_VIEWBOX.height * scale,
    finalOpacity: (0.78 + scale * 0.22).toFixed(2),
    speed: rand(86, 128, random),
    phase: rand(0, Math.PI * 2, random),
    phaseOff: rand(0, Math.PI * 2, random),
    pos: { x: start.x, y: start.y },
    prev: { x: start.x, y: start.y },
    angle: start.x < 0 ? 90 : -90,
    seg: null,
    delay: index * 850 + rand(0, 500, random),
    born: false,
    t0base: 0,
  };
}

function enterFromOffscreen(bird, now, world, random) {
  const start = randomOffscreenPoint(world, random);
  bird.pos = { x: start.x, y: start.y };
  bird.prev = { x: start.x, y: start.y };
  bird.angle = start.x < 0 ? 90 : -90;
  bird.seg = createFlight(
    bird,
    skyPoint(world, random),
    { lift: rand(-110, 40, random), durScale: 1.05 },
    now,
    random,
  );
}

function planNextFlight(bird, now, world, random) {
  const target =
    random() < RETURN_OFFSCREEN_CHANCE
      ? randomOffscreenPoint(world, random)
      : skyPoint(world, random);
  bird.seg = createFlight(
    bird,
    target,
    { lift: rand(-115, 70, random), durScale: rand(0.92, 1.18, random) },
    now,
    random,
  );
}

function followSegment(bird, now, world, random) {
  const t = (now - bird.seg.t0) / bird.seg.dur;
  if (t >= 1) {
    const end = bird.seg.pts[bird.seg.pts.length - 1];
    bird.pos = { x: end.x, y: end.y };
    bird.prev = { x: end.x, y: end.y };
    planNextFlight(bird, now, world, random);
  } else {
    bird.pos = sampleAlong(bird.seg, t);
  }
}

/**
 * Fréquence de battement d'ailes, qui croît avec la vitesse.
 * @param {number} speed Vitesse de l'oiseau, en pixels par seconde.
 * @returns {number} Battements par seconde, entre 1,6 et 3,6.
 */
export function flapFrequency(speed) {
  return clamp(2.0 + Math.min(speed, 180) * 0.004, 1.6, 3.6);
}

/**
 * Fait avancer un oiseau d'une image : entrée en scène, suivi de trajectoire,
 * orientation et phase de battement.
 * @param {object} bird État de l'oiseau, modifié sur place.
 * @param {number} now Horodatage courant, en millisecondes.
 * @param {number} dt Écart depuis l'image précédente, en secondes (strictement positif).
 * @param {{width: number, height: number}} world Dimensions du hero.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {boolean} Vrai à l'image où l'oiseau entre en scène (le DOM le révèle alors).
 */
export function advanceBird(bird, now, dt, world, random = Math.random) {
  let justBorn = false;
  if (!bird.born) {
    if (now < bird.t0base + bird.delay) return false;
    bird.born = true;
    justBorn = true;
    enterFromOffscreen(bird, now, world, random);
  }

  if (bird.seg) followSegment(bird, now, world, random);

  const vx = (bird.pos.x - bird.prev.x) / dt;
  const vy = (bird.pos.y - bird.prev.y) / dt;
  const speed = Math.hypot(vx, vy);
  bird.prev = { x: bird.pos.x, y: bird.pos.y };

  if (speed > MIN_TURN_SPEED) {
    bird.angle += angleDifference(headingToAngle(vx, vy), bird.angle) * clamp(dt * 3.1, 0, 1);
  }
  bird.phase += dt * flapFrequency(speed) * Math.PI * 2;
  return justBorn;
}

/**
 * Pose de l'oiseau à partir de sa phase de battement.
 * @param {{phase: number, phaseOff: number}} bird État de l'oiseau.
 * @returns {{wingSpan: number, tailSway: number, bob: number}} Envergure (0,5 à 1),
 *   balancement de la queue en degrés et ondulation verticale en pixels.
 */
export function birdPose(bird) {
  return {
    wingSpan: 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(bird.phase)),
    tailSway: 4.8 * Math.sin(bird.phase * 0.5 + 0.6 + bird.phaseOff),
    bob: Math.sin(bird.phase) * 0.8,
  };
}
