/* ============================================================
   assets/js/lib/bird-flight.test.js
   Rôle : tests de bird-flight.js (trajectoires, entrée en scène et pose des paille-en-queue).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  advanceBird,
  computeBirdPose,
  BIRD_VIEWBOX,
  createBird,
  createFlight,
  computeFlapFrequency,
  getOffscreenPoint,
  pickRandomOffscreenPoint,
  pickSkyPoint,
} from './bird-flight.js';
import { createSeededRandom, createSequence } from './fake-random.js';

const world = { width: 1000, height: 600 };

test('pickSkyPoint reste dans la partie haute et centrale du hero', () => {
  const random = createSeededRandom(1);
  for (let i = 0; i < 200; i++) {
    const p = pickSkyPoint(world, random);
    assert.ok(p.x >= 60 && p.x <= 940, `x=${p.x}`);
    assert.ok(p.y >= 48 && p.y <= 432, `y=${p.y}`);
  }
});

test('getOffscreenPoint place le point hors du hero, du côté demandé', () => {
  const random = createSeededRandom(2);
  assert.equal(getOffscreenPoint(world, 'left', random).x, -120);
  assert.equal(getOffscreenPoint(world, 'right', random).x, 1120);
  assert.equal(getOffscreenPoint(world, 'top', random).y, -120);
  assert.equal(getOffscreenPoint(world, 'bottom', random).y, 720);
});

test('pickRandomOffscreenPoint sort toujours à gauche, à droite ou en haut', () => {
  const random = createSeededRandom(3);
  for (let i = 0; i < 100; i++) {
    const p = pickRandomOffscreenPoint(world, random);
    assert.ok(p.x < 0 || p.x > world.width || p.y < 0, JSON.stringify(p));
  }
});

test("createFlight relie la position de l'oiseau à la destination", () => {
  const bird = { pos: { x: 100, y: 100 }, angle: 90, speed: 100 };
  const end = { x: 700, y: 300 };
  const flight = createFlight(bird, end, { lift: 20 }, 5000, createSeededRandom(4));
  assert.deepEqual(flight.pts[0], { x: 100, y: 100 });
  assert.deepEqual(flight.pts.at(-1), end);
  assert.equal(flight.t0, 5000);
  assert.ok(flight.arc >= Math.hypot(600, 200));
});

test('createFlight borne la durée entre 2,1 s et 18 s (avant facteur)', () => {
  const near = createFlight(
    { pos: { x: 0, y: 0 }, angle: 0, speed: 1000 },
    { x: 10, y: 0 },
    { lift: 1 },
    0,
    createSeededRandom(5),
  );
  assert.equal(near.dur, 2100);
  const far = createFlight(
    { pos: { x: 0, y: 0 }, angle: 0, speed: 1 },
    { x: 5000, y: 0 },
    { lift: 1 },
    0,
    createSeededRandom(5),
  );
  assert.equal(far.dur, 18000);
});

test('createFlight applique le facteur de durée', () => {
  const bird = { pos: { x: 0, y: 0 }, angle: 0, speed: 1000 };
  const flight = createFlight(
    bird,
    { x: 10, y: 0 },
    { lift: 1, durScale: 2 },
    0,
    createSeededRandom(6),
  );
  assert.equal(flight.dur, 4200);
});

test('createFlight supporte une destination confondue avec la position', () => {
  const bird = { pos: { x: 50, y: 50 }, angle: 0, speed: 100 };
  const flight = createFlight(bird, { x: 50, y: 50 }, { lift: 1 }, 0, createSeededRandom(7));
  assert.ok(Number.isFinite(flight.arc));
  assert.ok(flight.pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test('createBird crée un oiseau hors du hero, non encore apparu', () => {
  const bird = createBird(0, world, createSeededRandom(8));
  assert.equal(bird.isBorn, false);
  assert.equal(bird.seg, null);
  assert.ok(bird.pos.x < 0);
  assert.equal(bird.angle, 90);
  assert.ok(bird.cw >= BIRD_VIEWBOX.width * 0.68 && bird.cw <= BIRD_VIEWBOX.width * 0.96);
  assert.ok(Number(bird.finalOpacity) >= 0.78 && Number(bird.finalOpacity) <= 1);
});

test("createBird alterne le côté d'entrée et décale l'apparition", () => {
  const left = createBird(0, world, createSeededRandom(9));
  const right = createBird(1, world, createSeededRandom(9));
  assert.ok(left.pos.x < 0);
  assert.ok(right.pos.x > world.width);
  assert.equal(right.angle, -90);
  assert.ok(right.delay >= 850);
  assert.ok(left.delay < 850);
});

test("advanceBird attend son délai avant d'entrer en scène", () => {
  const bird = createBird(0, world, createSeededRandom(10));
  bird.t0base = 1000;
  bird.delay = 500;
  assert.equal(advanceBird(bird, 1400, 0.016, world, createSeededRandom(10)), false);
  assert.equal(bird.isBorn, false);
  assert.equal(bird.seg, null);
});

test("advanceBird signale l'entrée en scène une seule fois", () => {
  const random = createSeededRandom(11);
  const bird = createBird(0, world, random);
  bird.t0base = 0;
  bird.delay = 0;
  assert.equal(advanceBird(bird, 10, 0.016, world, random), true);
  assert.equal(bird.isBorn, true);
  assert.ok(bird.seg);
  assert.equal(advanceBird(bird, 26, 0.016, world, random), false);
});

test('advanceBird enchaîne un nouveau vol à la fin du segment', () => {
  const random = createSeededRandom(12);
  const bird = createBird(0, world, random);
  bird.t0base = 0;
  bird.delay = 0;
  advanceBird(bird, 0, 0.016, world, random);
  const first = bird.seg;
  advanceBird(bird, first.t0 + first.dur + 1, 0.016, world, random);
  assert.notEqual(bird.seg, first);
  assert.ok(bird.seg.t0 > first.t0);
});

test('advanceBird garde des valeurs finies sur une longue simulation', () => {
  const random = createSeededRandom(13);
  const bird = createBird(0, world, random);
  bird.t0base = 0;
  bird.delay = 0;
  for (let now = 0; now < 60000; now += 16) advanceBird(bird, now, 0.016, world, random);
  assert.ok(Number.isFinite(bird.pos.x) && Number.isFinite(bird.pos.y));
  assert.ok(Number.isFinite(bird.angle) && Number.isFinite(bird.phase));
});

test('computeFlapFrequency croît avec la vitesse et reste bornée', () => {
  assert.equal(computeFlapFrequency(0), 2.0);
  assert.ok(computeFlapFrequency(100) > computeFlapFrequency(0));
  assert.equal(computeFlapFrequency(10000), 2.0 + 180 * 0.004);
  assert.ok(computeFlapFrequency(0) >= 1.6 && computeFlapFrequency(10000) <= 3.6);
});

test('computeBirdPose reste dans les plages attendues', () => {
  const draw = createSequence([0, 0.25, 0.5, 0.75]);
  for (let i = 0; i < 50; i++) {
    const pose = computeBirdPose({ phase: draw() * 20, phaseOff: draw() * 6 });
    assert.ok(pose.wingSpan >= 0.5 && pose.wingSpan <= 1);
    assert.ok(Math.abs(pose.tailSway) <= 4.8);
    assert.ok(Math.abs(pose.bob) <= 0.8);
  }
});
