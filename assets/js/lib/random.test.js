import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sequence } from './fake-random.js';
import { rand, randomIndex } from './random.js';

test('rand renvoie la borne basse pour 0 et reste sous la borne haute', () => {
  assert.equal(
    rand(10, 20, () => 0),
    10,
  );
  assert.equal(
    rand(10, 20, () => 0.5),
    15,
  );
  assert.ok(rand(10, 20, () => 0.999999) < 20);
});

test('rand accepte un intervalle négatif', () => {
  assert.equal(
    rand(-1, 1, () => 0.5),
    0,
  );
});

test('randomIndex couvre tous les indices sans dépasser la longueur', () => {
  const draw = sequence([0, 0.34, 0.67, 0.999]);
  assert.deepEqual(
    [draw, draw, draw, draw].map((r) => randomIndex(3, r)),
    [0, 1, 2, 2],
  );
});

test('rand et randomIndex utilisent Math.random par défaut', () => {
  const value = rand(0, 1);
  assert.ok(value >= 0 && value < 1);
  assert.ok(Number.isInteger(randomIndex(5)));
});
