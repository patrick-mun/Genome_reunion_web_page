/* ============================================================
   assets/js/lib/gecko-pose.test.js
   Rôle : tests de gecko-pose.js (pose du margouillat et contour de la queue).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeGeckoPose, computeTailAngles, computeTailOutline } from './gecko-pose.js';

const gecko = { phase: 1.3, run: 0.6, idleOff: 2.1 };

test('computeTailOutline produit un chemin SVG fermé', () => {
  const d = computeTailOutline([0, 0, 0], 5, 0.7);
  assert.match(d, /^M[-\d.,]+(L[-\d.,]+)+Z$/);
});

test('computeTailOutline compte deux points par os de colonne, plus la base', () => {
  const angles = new Array(11).fill(0);
  const d = computeTailOutline(angles, 5, 0.7);
  assert.equal(d.split('L').length, 2 * 12);
});

test("computeTailOutline s'effile jusqu'à une pointe de largeur nulle", () => {
  const d = computeTailOutline([0, 0, 0, 0], 5, 0.7);
  const points = d
    .slice(1, -1)
    .split('L')
    .map((p) => p.split(',').map(Number));
  const n = points.length / 2;
  assert.deepEqual(points[n - 1], points[n], 'gauche et droite se rejoignent à la pointe');
  assert.ok(Math.abs(points[0][0] - points.at(-1)[0]) > 1, 'la base est large');
});

test("computeTailOutline sans flexion est symétrique autour de l'axe de la queue", () => {
  const d = computeTailOutline([0, 0, 0], 4, 1);
  const points = d
    .slice(1, -1)
    .split('L')
    .map((p) => p.split(',').map(Number));
  assert.equal(Math.round((points[0][0] + points.at(-1)[0]) * 100) / 100, 90);
});

test('computeTailOutline accepte une queue sans os', () => {
  assert.match(computeTailOutline([], 5, 0.7), /^M.*Z$/);
});

test('computeTailAngles renvoie une flexion finie par os, de faible amplitude', () => {
  const angles = computeTailAngles(gecko, 1234);
  assert.equal(angles.length, 11);
  assert.ok(angles.every((a) => Number.isFinite(a) && Math.abs(a) < 0.25));
});

test("computeTailAngles est plus ample à la course qu'au repos", () => {
  const amplitude = (run) =>
    Math.max(...computeTailAngles({ phase: 0.9, run, idleOff: 0 }, 0).map(Math.abs));
  assert.ok(amplitude(1) > amplitude(0));
});

test('computeGeckoPose reste dans les plages attendues', () => {
  const pose = computeGeckoPose(gecko, 5000);
  assert.ok(Math.abs(pose.legSwing) <= 24);
  assert.ok(Math.abs(pose.bodySway) <= 3);
  assert.ok(Math.abs(pose.headIdle) <= 9);
  assert.match(pose.tailOuter, /^M.*Z$/);
  assert.match(pose.tailInner, /^M.*Z$/);
});

test('computeGeckoPose immobile : pattes et corps au repos', () => {
  const pose = computeGeckoPose({ phase: 1, run: 0, idleOff: 0 }, 0);
  assert.equal(pose.bodySway, 0);
  assert.ok(Math.abs(pose.legSwing) <= 24 * 0.25);
});

test('la queue extérieure est plus large que la queue intérieure', () => {
  const pose = computeGeckoPose({ phase: 0, run: 0, idleOff: 0 }, 0);
  const firstX = (d) => Number(d.slice(1).split('L')[0].split(',')[0]);
  assert.ok(firstX(pose.tailOuter) < firstX(pose.tailInner));
});
