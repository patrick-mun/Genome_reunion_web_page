/* ============================================================
   assets/js/lib/maloya-rhythm.test.js
   Rôle : tests de maloya-rhythm.js (frappes, levée des mains, accent, secousse du kayamb).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BOBRE_HITS,
  computeDownbeatAccent,
  computeHandLift,
  computeKayambShake,
  computeLiftShape,
  findSurroundingHits,
  PIKER_HITS,
  PULSES_PER_BEAT,
  ROULER_HITS,
  SATI_HITS,
} from './maloya-rhythm.js';

const ALL_HANDS = [ROULER_HITS, SATI_HITS, PIKER_HITS]
  .flatMap((p) => Object.values(p))
  .concat([BOBRE_HITS]);

test('chaque main est sur son instrument exactement à chacune de ses frappes', () => {
  for (const hits of ALL_HANDS) {
    for (const hit of hits) assert.equal(computeHandLift(hit / PULSES_PER_BEAT, hits), 0);
  }
});

test('la levée culmine aux 3/5 de l’intervalle et reste entre 0 et 1', () => {
  assert.ok(Math.abs(computeLiftShape(0.6) - 1) < 1e-9);
  for (let u = 0; u <= 1; u += 0.05) {
    const lift = computeLiftShape(u);
    assert.ok(lift >= -1e-9 && lift <= 1 + 1e-9, `${lift}`);
  }
});

test('les frappes encadrantes bouclent d’une mesure à l’autre', () => {
  assert.deepEqual(findSurroundingHits(1, ROULER_HITS.a), { prev: 0, next: 3 });
  assert.deepEqual(findSurroundingHits(11, ROULER_HITS.a), { prev: 9, next: 12 });
  assert.deepEqual(findSurroundingHits(0.5, ROULER_HITS.b), { prev: -1, next: 2 });
});

test('un intervalle court entre deux frappes donne une levée plus basse', () => {
  // Main B du roulèr : intervalle d'une pulsation entre 10 et 11, de trois entre 2 et 5.
  const roll = computeHandLift((10 + 0.6) / PULSES_PER_BEAT, ROULER_HITS.b);
  const full = computeHandLift((2 + 0.6 * 3) / PULSES_PER_BEAT, ROULER_HITS.b);
  assert.ok(roll < full / 2);
});

test('l’accent du premier temps monte sans saut puis retombe à zéro en un temps', () => {
  assert.equal(computeDownbeatAccent(0), 0);
  assert.equal(computeDownbeatAccent(0.15), 1);
  assert.equal(computeDownbeatAccent(4.15), 1);
  assert.equal(computeDownbeatAccent(1.5), 0);
  for (let beats = 0; beats < 4; beats += 0.01) {
    const step = Math.abs(computeDownbeatAccent(beats + 0.01) - computeDownbeatAccent(beats));
    assert.ok(step < 0.2, `saut de ${step} à ${beats}`);
  }
});

test('la secousse du kayamb reste bornée et continue', () => {
  let previous = computeKayambShake(0);
  for (let i = 1; i <= 1600; i++) {
    const value = computeKayambShake(i / 100);
    assert.ok(Math.abs(value) <= 1);
    assert.ok(Math.abs(value - previous) < 0.2);
    previous = value;
  }
});
