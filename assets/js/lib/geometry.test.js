/* ============================================================
   assets/js/lib/geometry.test.js
   Rôle : tests de geometry.js (bornes, interpolation et angles).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeAngleDifference,
  clamp,
  computeHeadingAngle,
  computeSmoothstep,
} from './geometry.js';

const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`);

test('clamp borne des deux côtés', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(42, 0, 10), 10);
});

test('computeSmoothstep vaut 0 en 0, 1 en 1 et 0,5 au milieu', () => {
  assert.equal(computeSmoothstep(0), 0);
  assert.equal(computeSmoothstep(1), 1);
  assert.equal(computeSmoothstep(0.5), 0.5);
});

test('computeAngleDifference prend le chemin le plus court', () => {
  assert.equal(computeAngleDifference(10, 350), 20);
  assert.equal(computeAngleDifference(350, 10), -20);
  assert.equal(computeAngleDifference(90, 90), 0);
  assert.equal(Math.abs(computeAngleDifference(180, 0)), 180);
});

test('computeHeadingAngle : 0 vers le haut, 90 vers la droite, 180 vers le bas', () => {
  near(computeHeadingAngle(0, -1), 0);
  near(computeHeadingAngle(1, 0), 90);
  near(computeHeadingAngle(0, 1), 180);
  near(computeHeadingAngle(-1, 0), 270);
});
