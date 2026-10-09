/* ============================================================
   assets/js/lib/bird-flight.test.js
   Rôle : tests de bird-flight.js (destinations, entrée en scène, pilotage et qualité du vol
   des paille-en-queue).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  advanceBird,
  chooseDestination,
  computeBirdPose,
  computeMaxTurnRate,
  computeTailAngle,
  computeWander,
  createBird,
  getOffscreenPoint,
  isOffscreen,
  pickRandomOffscreenPoint,
  pickSkyPoint,
  wrapAngle,
} from './bird-flight.js';
import { BIRD_VIEWBOX } from './bird-svg.js';
import { createSeededRandom, createSequence } from './fake-random.js';

const world = { width: 1280, height: 860 };
const DT = 1 / 60;
const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`);

/* ── DESTINATIONS ── */

test('pickSkyPoint reste dans la partie haute et centrale du hero', () => {
  const random = createSeededRandom(1);
  for (let i = 0; i < 200; i++) {
    const p = pickSkyPoint(world, random);
    assert.ok(p.x >= 0.06 * world.width && p.x <= 0.94 * world.width, `x=${p.x}`);
    assert.ok(p.y >= 0.08 * world.height && p.y <= 0.72 * world.height, `y=${p.y}`);
  }
});

test('getOffscreenPoint place le point hors du hero, du côté demandé', () => {
  const random = createSeededRandom(2);
  assert.equal(getOffscreenPoint(world, 'left', random).x, -120);
  assert.equal(getOffscreenPoint(world, 'right', random).x, world.width + 120);
  assert.equal(getOffscreenPoint(world, 'top', random).y, -120);
  assert.equal(getOffscreenPoint(world, 'bottom', random).y, world.height + 120);
});

test('pickRandomOffscreenPoint sort toujours à gauche, à droite ou en haut', () => {
  const random = createSeededRandom(3);
  for (let i = 0; i < 100; i++) {
    const p = pickRandomOffscreenPoint(world, random);
    assert.ok(p.x < 0 || p.x > world.width || p.y < 0, JSON.stringify(p));
  }
});

test('isOffscreen tient compte de la marge', () => {
  assert.equal(isOffscreen({ x: -50, y: 100 }, world, 60), false);
  assert.equal(isOffscreen({ x: -61, y: 100 }, world, 60), true);
  assert.equal(isOffscreen({ x: 100, y: world.height + 61 }, world, 60), true);
});

test('chooseDestination : une sortie hors champ quand le tirage le décide', () => {
  const bird = { pos: { x: 640, y: 400 }, heading: 0 };
  const destination = chooseDestination(bird, world, createSequence([0.1, 0.5, 0.5, 0.5]));
  assert.equal(destination.isExit, true);
  assert.ok(isOffscreen(destination.point, world, 100));
});

test('chooseDestination choisit surtout des points éloignés et devant l’oiseau', () => {
  const random = createSeededRandom(4);
  const bird = { pos: { x: 640, y: 430 }, heading: 0 };
  let sky = 0;
  let suitable = 0;
  for (let i = 0; i < 400; i++) {
    const { point, isExit } = chooseDestination(bird, world, random);
    if (isExit) continue;
    sky++;
    const turn = Math.abs(Math.atan2(point.y - bird.pos.y, point.x - bird.pos.x));
    if (Math.hypot(point.x - 640, point.y - 430) >= 320 && turn <= (120 * Math.PI) / 180) {
      suitable++;
    }
  }
  assert.ok(suitable / sky > 0.8, `${suitable} sur ${sky}`);
});

/* ── ANGLES ET LIMITES ── */

test('wrapAngle ramène tout angle dans [-π, π]', () => {
  near(wrapAngle(3 * Math.PI), Math.PI, 1e-12);
  near(wrapAngle(-Math.PI / 2), -Math.PI / 2);
  near(wrapAngle((5 * Math.PI) / 2), Math.PI / 2, 1e-12);
});

test('computeMaxTurnRate correspond à un rayon de virage de 140 px', () => {
  near(computeMaxTurnRate(140), 1);
  near(computeMaxTurnRate(70), 0.5);
});

test('computeWander et computeTailAngle restent modérés', () => {
  for (let time = 0; time < 120; time += 0.1) {
    assert.ok(Math.abs(computeWander({ time, phaseOff: 1.3 })) <= 0.48);
    assert.ok(Math.abs(computeTailAngle({ time, phaseOff: 1.3, tailBend: 9 })) <= 10.8 + 1e-9);
  }
});

/* ── ÉTAT ET ENTRÉE EN SCÈNE ── */

test('createBird crée un oiseau hors du hero, non encore apparu, tourné vers le hero', () => {
  const bird = createBird(0, world, createSeededRandom(8));
  assert.equal(bird.isBorn, false);
  assert.ok(bird.pos.x < 0);
  assert.equal(bird.heading, 0);
  assert.equal(bird.angle, 90);
  assert.ok(bird.cw >= BIRD_VIEWBOX.width * 0.6 && bird.cw <= BIRD_VIEWBOX.width * 0.82);
  assert.equal(bird.ch / bird.cw, BIRD_VIEWBOX.height / BIRD_VIEWBOX.width);
  assert.ok(Number(bird.finalOpacity) >= 0.93 && Number(bird.finalOpacity) <= 0.99);
  assert.equal(bird.speed, bird.cruiseSpeed);
});

test("createBird alterne le côté d'entrée et décale l'apparition", () => {
  const left = createBird(0, world, createSeededRandom(9));
  const right = createBird(1, world, createSeededRandom(9));
  assert.ok(left.pos.x < 0);
  assert.ok(right.pos.x > world.width);
  assert.equal(right.angle, 270);
  assert.ok(right.delay >= 850);
  assert.ok(left.delay < 850);
});

test("advanceBird attend son délai avant d'entrer en scène", () => {
  const bird = createBird(0, world, createSeededRandom(10));
  bird.t0base = 1000;
  bird.delay = 500;
  const start = { ...bird.pos };
  assert.equal(advanceBird(bird, 1400, DT, world, createSeededRandom(10)), false);
  assert.equal(bird.isBorn, false);
  assert.deepEqual(bird.pos, start);
});

test("advanceBird signale l'entrée en scène une seule fois et vise le ciel", () => {
  const random = createSeededRandom(11);
  const bird = createBird(0, world, random);
  bird.delay = 0;
  assert.equal(advanceBird(bird, 10, DT, world, random), true);
  assert.equal(bird.isBorn, true);
  assert.equal(bird.isExiting, false);
  assert.ok(!isOffscreen(bird.target, world, 0));
  assert.equal(advanceBird(bird, 26, DT, world, random), false);
});

/* ── QUALITÉ DU VOL ──
   Trois oiseaux simulés trois minutes à 60 images par seconde : aucun virage sous le rayon
   minimal, aucune cassure de direction, aucun saut de vitesse, corps toujours dans l'axe du vol.
*/

function simulate(seed, seconds) {
  const random = createSeededRandom(seed);
  const birds = Array.from({ length: 3 }, (_, index) => createBird(index, world, random));
  const frames = birds.map(() => []);
  for (let frame = 0; frame < seconds * 60; frame++) {
    birds.forEach((bird, index) => {
      advanceBird(bird, frame * DT * 1000, DT, world, random);
      if (!bird.isBorn) return;
      // Copie de l'image : l'état de l'oiseau et de ses ailes est modifié sur place.
      frames[index].push({ ...bird, pos: { ...bird.pos }, wings: { ...bird.wings } });
    });
  }
  return frames;
}

const flights = simulate(42, 180);

function forEachFlyingPair(callback) {
  for (const frames of flights) {
    for (let k = 1; k < frames.length; k++) {
      const [a, b] = [frames[k - 1], frames[k]];
      const jump = Math.hypot(b.pos.x - a.pos.x, b.pos.y - a.pos.y);
      // Hors champ, l'oiseau patiente puis réapparaît ailleurs : ce saut n'est pas un vol.
      if (a.awayLeft > 0 || b.awayLeft > 0 || jump > 10) continue;
      callback(a, b);
    }
  }
}

test('le vol garde des valeurs finies', () => {
  for (const frames of flights) {
    for (const b of frames) {
      assert.ok([b.pos.x, b.pos.y, b.angle, b.speed, b.turnRate].every(Number.isFinite));
    }
  }
});

test('le cap ne tourne jamais plus vite que le rayon minimal ne le permet', () => {
  forEachFlyingPair((a, b) => {
    const turn = Math.abs(wrapAngle(b.heading - a.heading));
    assert.ok(turn <= computeMaxTurnRate(a.speed) * DT * 1.001, `${turn} rad en une image`);
  });
});

test('le corps est toujours dans l’axe du vol', () => {
  forEachFlyingPair((a, b) => {
    const direction = Math.atan2(b.pos.y - a.pos.y, b.pos.x - a.pos.x);
    assert.ok(Math.abs(wrapAngle(direction - b.heading)) < 1e-6);
    near(b.angle, (b.heading * 180) / Math.PI + 90, 1e-9);
  });
});

test('la vitesse varie en douceur et reste proche de la croisière', () => {
  forEachFlyingPair((a, b) => {
    assert.ok(Math.abs(b.speed - a.speed) / a.speed < 0.01);
    assert.ok(b.speed >= b.cruiseSpeed * 0.8 - 1e-9 && b.speed <= b.cruiseSpeed * 1.1 + 1e-9);
  });
});

test("l'oiseau alterne battements et glissades, et passe l'essentiel du temps à l'écran", () => {
  for (const frames of flights) {
    const flying = frames.filter((b) => b.awayLeft <= 0);
    const gliding = flying.filter((b) => !b.wings.isFlapping).length / flying.length;
    const away = frames.filter((b) => b.awayLeft > 0).length / frames.length;
    assert.ok(gliding > 0.05 && gliding < 0.4, `glissade ${gliding}`);
    assert.ok(away < 0.25, `hors champ ${away}`);
  }
});

test('computeBirdPose donne la pose des deux ailes et de la queue', () => {
  const pose = computeBirdPose(flights[0].at(-1));
  for (const wing of [pose.wings.left, pose.wings.right]) {
    assert.ok(wing.span > 0.4 && wing.span <= 1);
    assert.ok(Number.isFinite(wing.sweep));
  }
  assert.ok(Number.isFinite(pose.tail));
});
