import assert from 'node:assert/strict';
import { test } from 'node:test';
import { frameDelta } from './animation-loop.js';

test('frameDelta vaut 16 ms à la première image', () => {
  assert.equal(frameDelta(1000, 0), 0.016);
});

test('frameDelta convertit les millisecondes en secondes', () => {
  assert.equal(frameDelta(1020, 1000), 0.02);
});

test('frameDelta est borné à 50 ms après une longue interruption', () => {
  assert.equal(frameDelta(60000, 1000), 0.05);
});
