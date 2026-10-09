/* ============================================================
   assets/js/lib/geometry.test.js
   Rôle : tests de geometry.js (courbes de Bézier, trajets à vitesse constante et angles).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeAngleDifference,
  computeBezierPoint,
  buildBezierPath,
  clamp,
  computeHeadingAngle,
  sampleAlong,
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

test('computeBezierPoint part du premier point et arrive au dernier', () => {
  const p = [
    { x: 0, y: 0 },
    { x: 10, y: 40 },
    { x: 60, y: 40 },
    { x: 100, y: 0 },
  ];
  assert.deepEqual(computeBezierPoint(...p, 0), p[0]);
  assert.deepEqual(computeBezierPoint(...p, 1), p[3]);
});

test('computeBezierPoint sur une droite régulière reste sur la droite', () => {
  const line = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 20 },
    { x: 30, y: 30 },
  ];
  const mid = computeBezierPoint(...line, 0.5);
  near(mid.x, 15);
  near(mid.y, 15);
});

test("buildBezierPath cumule des longueurs croissantes et mesure l'arc", () => {
  const path = buildBezierPath(
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
    { x: 30, y: 0 },
    10,
  );
  assert.equal(path.pts.length, 11);
  assert.equal(path.cum.length, 11);
  assert.equal(path.cum[0], 0);
  for (let i = 1; i < path.cum.length; i++) assert.ok(path.cum[i] >= path.cum[i - 1]);
  near(path.arc, 30);
});

test('sampleAlong avance à vitesse constante sur une droite', () => {
  const path = buildBezierPath(
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
    { x: 30, y: 0 },
    20,
  );
  near(sampleAlong(path, 0).x, 0);
  near(sampleAlong(path, 0.5).x, 15);
  near(sampleAlong(path, 1).x, 30);
  near(sampleAlong(path, 0.25).x, 7.5);
});

test('sampleAlong borne t hors de [0, 1]', () => {
  const path = buildBezierPath(
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
    { x: 30, y: 0 },
    5,
  );
  near(sampleAlong(path, -4).x, 0);
  near(sampleAlong(path, 9).x, 30);
});

test('sampleAlong supporte un trajet de longueur nulle', () => {
  const still = { x: 5, y: 5 };
  const path = buildBezierPath(still, still, still, still, 4);
  assert.deepEqual(sampleAlong(path, 0.5), still);
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
