/* ============================================================
   assets/js/lib/donut-geometry.test.js
   Rôle : tests de donut-geometry.js (lecture des parts, arcs de l'anneau).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeDonutArcs, parseShare } from './donut-geometry.js';

const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`);

test('parseShare lit un pourcentage entier', () => {
  assert.equal(parseShare('45 %'), 45);
  assert.equal(parseShare(' 7 % '), 7);
});

test('parseShare accepte la virgule décimale française', () => {
  assert.equal(parseShare('7,5 %'), 7.5);
  assert.equal(parseShare('12.25%'), 12.25);
});

test('parseShare renvoie NaN sans nombre', () => {
  assert.ok(Number.isNaN(parseShare('')));
  assert.ok(Number.isNaN(parseShare('n/a')));
});

test('computeDonutArcs : la circonférence vaut 2πr', () => {
  near(computeDonutArcs([100], 38).circumference, 2 * Math.PI * 38);
});

test("computeDonutArcs : les arcs referment exactement l'anneau", () => {
  const { circumference, arcs } = computeDonutArcs([45, 25, 15, 8, 7], 38);
  near(
    arcs.reduce((sum, a) => sum + a.length, 0),
    circumference,
  );
});

test('computeDonutArcs : longueurs proportionnelles aux parts', () => {
  const { circumference, arcs } = computeDonutArcs([45, 25, 15, 8, 7], 38);
  near(arcs[0].length, 0.45 * circumference);
  near(arcs[4].length, 0.07 * circumference);
});

test('computeDonutArcs : chaque arc démarre où le précédent finit', () => {
  const { arcs } = computeDonutArcs([45, 25, 15, 8, 7], 38);
  assert.equal(arcs[0].offset, -0);
  for (let i = 1; i < arcs.length; i++) {
    near(arcs[i].offset, arcs[i - 1].offset - arcs[i - 1].length);
  }
});

test('computeDonutArcs : normalise des parts qui ne font pas 100', () => {
  const { circumference, arcs } = computeDonutArcs([1, 1], 10);
  near(arcs[0].length, circumference / 2);
  near(arcs[1].length, circumference / 2);
});

test('computeDonutArcs : parts nulles ou liste vide sans valeur absurde', () => {
  assert.deepEqual(computeDonutArcs([], 38).arcs, []);
  const zero = computeDonutArcs([0, 0], 38).arcs;
  assert.ok(zero.every((a) => a.length === 0 && Number.isFinite(a.offset)));
});
