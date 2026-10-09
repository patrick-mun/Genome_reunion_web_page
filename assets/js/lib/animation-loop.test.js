/* ============================================================
   assets/js/lib/animation-loop.test.js
   Rôle : tests de animation-loop.js (écart de temps borné entre deux images).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeFrameDelta } from './animation-loop.js';

test('computeFrameDelta vaut 16 ms à la première image', () => {
  assert.equal(computeFrameDelta(1000, 0), 0.016);
});

test('computeFrameDelta convertit les millisecondes en secondes', () => {
  assert.equal(computeFrameDelta(1020, 1000), 0.02);
});

test('computeFrameDelta est borné à 50 ms après une longue interruption', () => {
  assert.equal(computeFrameDelta(60000, 1000), 0.05);
});
