/* ============================================================
   assets/js/lib/random.test.js
   Rôle : tests de random.js (tirages aléatoires à générateur injectable).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSequence } from './fake-random.js';
import { getRandomBetween, pickRandomIndex } from './random.js';

test('getRandomBetween renvoie la borne basse pour 0 et reste sous la borne haute', () => {
  assert.equal(
    getRandomBetween(10, 20, () => 0),
    10,
  );
  assert.equal(
    getRandomBetween(10, 20, () => 0.5),
    15,
  );
  assert.ok(getRandomBetween(10, 20, () => 0.999999) < 20);
});

test('getRandomBetween accepte un intervalle négatif', () => {
  assert.equal(
    getRandomBetween(-1, 1, () => 0.5),
    0,
  );
});

test('pickRandomIndex couvre tous les indices sans dépasser la longueur', () => {
  const draw = createSequence([0, 0.34, 0.67, 0.999]);
  assert.deepEqual(
    [draw, draw, draw, draw].map((r) => pickRandomIndex(3, r)),
    [0, 1, 2, 2],
  );
});

test('getRandomBetween et pickRandomIndex utilisent Math.random par défaut', () => {
  const value = getRandomBetween(0, 1);
  assert.ok(value >= 0 && value < 1);
  assert.ok(Number.isInteger(pickRandomIndex(5)));
});
