/* ============================================================
   assets/js/lib/bird-wings.test.js
   Rôle : tests de bird-wings.js (course de l'aile, battements et glissades, envergure apparente).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  advanceWings,
  computeStroke,
  computeThrust,
  computeWingPose,
  createWings,
  startFlapping,
} from './bird-wings.js';
import { createSeededRandom } from './fake-random.js';

const DT = 1 / 60;
const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`);

test('computeStroke : aile en haut au début du cycle, en bas à la fin de l’abaissement', () => {
  near(computeStroke(0).elevation, 48);
  near(computeStroke(0.58).elevation, -26);
});

test('computeStroke est périodique et sans cassure', () => {
  near(computeStroke(1).elevation, computeStroke(0).elevation);
  near(computeStroke(1.3).elevation, computeStroke(0.3).elevation);
  for (let c = 0; c < 1; c += 0.001) {
    const step = Math.abs(computeStroke(c + 0.001).elevation - computeStroke(c).elevation);
    assert.ok(step < 0.5, `saut de ${step}° en ${c}`);
  }
});

test("computeStroke : l'abaissement dure plus longtemps que la remontée", () => {
  const lowest = Array.from({ length: 1000 }, (_, i) => i / 1000).reduce((best, c) =>
    computeStroke(c).elevation < computeStroke(best).elevation ? c : best,
  );
  assert.ok(lowest > 0.5, `aile en bas à ${lowest} du cycle`);
});

test('computeStroke : le poignet ne se replie que pendant la remontée', () => {
  for (let c = 0; c < 0.58; c += 0.01) assert.equal(computeStroke(c).fold, 0);
  assert.ok(computeStroke(0.8).fold > 0.9);
});

test('createWings démarre en plein battement', () => {
  const wings = createWings(createSeededRandom(1));
  assert.equal(wings.isFlapping, true);
  assert.equal(wings.envelope, 1);
  assert.ok(wings.frequency >= 2.6 && wings.frequency <= 3.1);
  assert.ok(wings.beatsLeft >= 4 && wings.beatsLeft <= 9);
});

test('advanceWings passe en glissade après la série de battements, puis reprend', () => {
  const random = createSeededRandom(2);
  const wings = createWings(random);
  let frames = 0;
  while (wings.isFlapping && frames < 600) {
    advanceWings(wings, DT, random);
    frames++;
  }
  assert.equal(wings.isFlapping, false);
  let glideFrames = 0;
  while (!wings.isFlapping && glideFrames < 600) {
    advanceWings(wings, DT, random);
    glideFrames++;
  }
  assert.ok(
    glideFrames * DT >= 0.6 && glideFrames * DT <= 1.45,
    `glissade de ${glideFrames * DT} s`,
  );
  assert.equal(wings.cycle, 0);
});

test("advanceWings ouvre et referme l'amplitude progressivement", () => {
  const random = createSeededRandom(3);
  const wings = createWings(random);
  let previous = wings.envelope;
  for (let i = 0; i < 60 * 30; i++) {
    advanceWings(wings, DT, random);
    assert.ok(Math.abs(wings.envelope - previous) <= 3.2 * DT + 1e-12);
    previous = wings.envelope;
  }
});

test("la reprise des battements après une glissade ne fait pas sauter l'aile", () => {
  const random = createSeededRandom(4);
  const wings = createWings(random);
  let previous = computeWingPose(wings, 0).left.span;
  let restarts = 0;
  for (let i = 0; i < 60 * 60; i++) {
    const wasFlapping = wings.isFlapping;
    advanceWings(wings, DT, random);
    const span = computeWingPose(wings, 0).left.span;
    if (!wasFlapping && wings.isFlapping) {
      restarts++;
      assert.ok(Math.abs(span - previous) < 0.01, `saut de ${span - previous}`);
    }
    previous = span;
  }
  assert.ok(restarts > 3);
});

test('startFlapping relance une série sans effet si les ailes battent déjà', () => {
  const random = createSeededRandom(5);
  const wings = createWings(random);
  const before = { ...wings };
  startFlapping(wings, random);
  assert.deepEqual(wings, before);
});

test('computeThrust vaut 1 en plein battement et 0 en glissade', () => {
  assert.equal(computeThrust({ envelope: 1 }), 1);
  assert.equal(computeThrust({ envelope: 0 }), 0);
});

test('computeWingPose : ailes tendues et symétriques en glissade, sans virage', () => {
  const pose = computeWingPose({ cycle: 0.3, envelope: 0 }, 0);
  near(pose.left.span, Math.cos((5 * Math.PI) / 180));
  near(pose.right.span, pose.left.span);
  near(pose.left.sweep, -2);
});

test("computeWingPose : en virage à droite, l'aile gauche (extérieure, relevée) paraît plus courte", () => {
  const pose = computeWingPose({ cycle: 0.3, envelope: 0 }, 30);
  assert.ok(pose.left.span < pose.right.span);
});

test('computeWingPose : envergure apparente bornée sur tout le cycle', () => {
  for (let c = 0; c < 1; c += 0.01) {
    for (const bank of [-40, -25, 0, 25, 40]) {
      const { left, right } = computeWingPose({ cycle: c, envelope: 1 }, bank);
      for (const span of [left.span, right.span]) assert.ok(span > 0.4 && span <= 1, `${span}`);
    }
  }
  near(computeWingPose({ cycle: 0, envelope: 1 }, 0).left.span, Math.cos((48 * Math.PI) / 180));
});

test("computeWingPose : en plein battement, l'inclinaison déséquilibre moins les ailes", () => {
  const gap = (envelope) => {
    const { left, right } = computeWingPose({ cycle: 0.35, envelope }, 25);
    return Math.abs(left.span - right.span);
  };
  assert.ok(gap(1) < gap(0) * 0.6, `${gap(1)} contre ${gap(0)}`);
});
