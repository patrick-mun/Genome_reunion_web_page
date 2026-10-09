/* ============================================================
   assets/js/lib/gecko-motion.js
   Rôle : déplacements du margouillat (pause, pivot, détalage, fuite devant le
   pointeur), calcul pur sans DOM.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur ; le DOM est dans margouillat.js).
   ============================================================ */

import {
  clamp,
  computeHeadingAngle,
  computeAngleDifference,
  computeSmoothstep,
} from './geometry.js';
import { getRandomBetween } from './random.js';

export const GECKO_VIEWBOX = { width: 90, height: 150 };

const FLEE_DISTANCE_PX = 110;
const TURN_SPEED_DEG_PER_S = 460;
const RUN_SPEED_THRESHOLD = 40;
const STEP_CYCLE_PX = 46;

/**
 * Crée l'état d'un margouillat, au repos dans la zone haute de la promenade.
 * @param {{minX: number, maxX: number, minY: number, maxY: number}} bounds Zone autorisée.
 * @param {number} viewportHeight Hauteur de la fenêtre, en pixels.
 * @param {number} now Horodatage courant, en millisecondes.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {object} État du margouillat.
 */
export function createGecko(bounds, viewportHeight, now, random = Math.random) {
  const pos = {
    x: getRandomBetween(bounds.minX, bounds.maxX, random),
    /* apparition dans la zone haute pour être visible dès les premières sections */
    y: getRandomBetween(
      bounds.minY,
      Math.min(bounds.maxY, bounds.minY + viewportHeight * 1.5),
      random,
    ),
  };
  return {
    pos,
    prev: { x: pos.x, y: pos.y },
    angle: getRandomBetween(0, 360, random),
    state: 'pause',
    until: now + getRandomBetween(700, 2200, random),
    targetAngle: 0,
    seg: null,
    phase: getRandomBetween(0, Math.PI * 2, random),
    idleOff: getRandomBetween(0, Math.PI * 2, random),
    run: 0,
  };
}

function clampToBounds(point, bounds) {
  return {
    x: clamp(point.x, bounds.minX, bounds.maxX),
    y: clamp(point.y, bounds.minY, bounds.maxY),
  };
}

function isFarEnough(gecko, target) {
  return Math.hypot(target.x - gecko.pos.x, target.y - gecko.pos.y) >= 50;
}

function randomPointIn(bounds, random) {
  return {
    x: getRandomBetween(bounds.minX, bounds.maxX, random),
    y: getRandomBetween(bounds.minY, bounds.maxY, random),
  };
}

/**
 * Choisit une destination : petits trajets fréquents, longues traversées
 * occasionnelles, toujours dans la zone autorisée.
 * @param {object} gecko État du margouillat.
 * @param {{minX: number, maxX: number, minY: number, maxY: number}} bounds Zone autorisée.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{x: number, y: number}} Destination.
 */
export function pickTarget(gecko, bounds, random = Math.random) {
  const isFar = random() < 0.18;
  const distance = isFar ? getRandomBetween(420, 900, random) : getRandomBetween(100, 340, random);
  const heading = getRandomBetween(0, Math.PI * 2, random);
  const target = clampToBounds(
    {
      x: gecko.pos.x + Math.cos(heading) * distance,
      y: gecko.pos.y + Math.sin(heading) * distance,
    },
    bounds,
  );
  return isFarEnough(gecko, target) ? target : randomPointIn(bounds, random);
}

/**
 * Destination de fuite, à l'opposé du pointeur.
 * @param {object} gecko État du margouillat.
 * @param {{x: number, y: number}} pointer Position du pointeur (coordonnées du document).
 * @param {{minX: number, maxX: number, minY: number, maxY: number}} bounds Zone autorisée.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{x: number, y: number}} Destination.
 */
export function fleeTarget(gecko, pointer, bounds, random = Math.random) {
  const dx = gecko.pos.x - pointer.x;
  const dy = gecko.pos.y - pointer.y;
  const dist = Math.hypot(dx, dy) || 1;
  const target = clampToBounds(
    {
      x: gecko.pos.x + (dx / dist) * getRandomBetween(220, 360, random),
      y: gecko.pos.y + (dy / dist) * getRandomBetween(220, 360, random),
    },
    bounds,
  );
  return isFarEnough(gecko, target) ? target : randomPointIn(bounds, random);
}

/**
 * Le margouillat pivote sur place avant de détaler, comme le vrai.
 * @param {object} gecko État du margouillat, modifié sur place.
 * @param {{x: number, y: number}} target Destination.
 * @param {number} speed Vitesse de détalage, en pixels par seconde.
 */
export function startTurn(gecko, target, speed) {
  gecko.state = 'turn';
  gecko.targetAngle = computeHeadingAngle(target.x - gecko.pos.x, target.y - gecko.pos.y);
  gecko.seg = { from: { x: gecko.pos.x, y: gecko.pos.y }, to: target, speed };
}

function startDash(gecko, now) {
  const seg = gecko.seg;
  const dist = Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y);
  seg.dur = clamp(dist / seg.speed, 0.28, 4.5) * 1000;
  seg.t0 = now;
  gecko.state = 'dash';
}

/**
 * Au repos : fuit si le pointeur s'approche, sinon part vers une nouvelle destination
 * quand la pause est écoulée.
 * @param {object} gecko État du margouillat, modifié sur place.
 * @param {object} ctx Contexte de l'image (voir `stepGecko`).
 */
function updatePause(gecko, ctx) {
  const { now, getBounds, pointer, random } = ctx;
  if (pointer.hasPosition) {
    const dx = gecko.pos.x - pointer.x;
    const dy = gecko.pos.y - pointer.y;
    if (dx * dx + dy * dy < FLEE_DISTANCE_PX * FLEE_DISTANCE_PX) {
      startTurn(
        gecko,
        fleeTarget(gecko, pointer, getBounds(), random),
        getRandomBetween(430, 560, random),
      );
    }
  }
  if (gecko.state === 'pause' && now >= gecko.until) {
    startTurn(gecko, pickTarget(gecko, getBounds(), random), getRandomBetween(230, 400, random));
  }
}

function updateTurn(gecko, ctx) {
  const diff = computeAngleDifference(gecko.targetAngle, gecko.angle);
  const step = TURN_SPEED_DEG_PER_S * ctx.dt;
  if (Math.abs(diff) <= step || Math.abs(diff) < 4) {
    gecko.angle = gecko.targetAngle;
    startDash(gecko, ctx.now);
  } else {
    gecko.angle += Math.sign(diff) * step;
  }
}

/**
 * En détalage : avance le long du segment avec un départ et une arrivée progressifs, puis
 * reprend une pause (courte le plus souvent, longue de temps en temps).
 * @param {object} gecko État du margouillat, modifié sur place.
 * @param {object} ctx Contexte de l'image (voir `stepGecko`).
 */
function updateDash(gecko, ctx) {
  const { now, random } = ctx;
  const t = clamp((now - gecko.seg.t0) / gecko.seg.dur, 0, 1);
  const eased = computeSmoothstep(t);
  gecko.pos.x = gecko.seg.from.x + (gecko.seg.to.x - gecko.seg.from.x) * eased;
  gecko.pos.y = gecko.seg.from.y + (gecko.seg.to.y - gecko.seg.from.y) * eased;
  if (t >= 1) {
    gecko.state = 'pause';
    /* pause courte le plus souvent, longue « pose lézard » parfois */
    gecko.until =
      now +
      (random() < 0.22
        ? getRandomBetween(4500, 9000, random)
        : getRandomBetween(900, 3800, random));
    gecko.seg = null;
  }
}

/**
 * Fait avancer le margouillat d'une image : machine à états (pause, pivot,
 * détalage), vitesse mesurée et phase de marche.
 * @param {object} gecko État du margouillat, modifié sur place.
 * @param {{now: number, dt: number, getBounds: () => {minX: number, maxX: number, minY: number,
 *   maxY: number}, pointer: {x: number, y: number, hasPosition: boolean}, random?: () => number}} ctx
 *   Contexte de l'image (`dt` en secondes, strictement positif).
 */
export function stepGecko(gecko, ctx) {
  const context = { ...ctx, random: ctx.random || Math.random };
  if (gecko.state === 'pause') updatePause(gecko, context);
  if (gecko.state === 'turn') updateTurn(gecko, context);
  if (gecko.state === 'dash') updateDash(gecko, context);

  const speed = Math.hypot(gecko.pos.x - gecko.prev.x, gecko.pos.y - gecko.prev.y) / ctx.dt;
  gecko.prev = { x: gecko.pos.x, y: gecko.pos.y };
  gecko.run += ((speed > RUN_SPEED_THRESHOLD ? 1 : 0) - gecko.run) * clamp(ctx.dt * 6, 0, 1);
  /* La phase de pas est pilotée par la distance parcourue : les pattes s'arrêtent avec le corps. */
  gecko.phase += speed * ctx.dt * ((Math.PI * 2) / STEP_CYCLE_PX);
}
