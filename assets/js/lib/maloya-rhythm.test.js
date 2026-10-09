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
  computeHandStroke,
  computeKayambShake,
  computeLiftShape,
  computeStrikeStrength,
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
    for (const hit of hits) assert.equal(computeHandStroke(hit / PULSES_PER_BEAT, hits).lift, 0);
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
  const roll = computeHandStroke((10 + 0.6) / PULSES_PER_BEAT, ROULER_HITS.b).lift;
  const full = computeHandStroke((2 + 0.6 * 3) / PULSES_PER_BEAT, ROULER_HITS.b).lift;
  assert.ok(roll < full / 2);
});

test('la main monte plus haut avant le premier temps qu’avant un contretemps', () => {
  assert.equal(computeStrikeStrength(0), 1);
  assert.equal(computeStrikeStrength(12), 1);
  assert.ok(computeStrikeStrength(3) > computeStrikeStrength(4));
  // Main A du roulèr : de 9 à 12 (premier temps suivant), puis de 0 à 3 (deuxième temps).
  const beforeDownbeat = computeHandStroke((9 + 1.8) / PULSES_PER_BEAT, ROULER_HITS.a);
  const beforeBeat = computeHandStroke(1.8 / PULSES_PER_BEAT, ROULER_HITS.a);
  assert.ok(Math.abs(beforeDownbeat.lift - 1) < 1e-9);
  assert.ok(beforeDownbeat.lift > beforeBeat.lift);
});

test('le coup monte jusqu’au sommet de la levée, puis redescend, en boucle', () => {
  assert.equal(computeHandStroke(1 / PULSES_PER_BEAT, ROULER_HITS.a).isRising, true);
  assert.equal(computeHandStroke(2.5 / PULSES_PER_BEAT, ROULER_HITS.a).isRising, false);
  // La boucle s'annule sur l'instrument et au sommet (aux 3/5 de l'intervalle).
  assert.equal(computeHandStroke(0, ROULER_HITS.a).loop, 0);
  assert.ok(Math.abs(computeHandStroke(1.8 / PULSES_PER_BEAT, ROULER_HITS.a).loop) < 1e-9);
  assert.ok(computeHandStroke(0.9 / PULSES_PER_BEAT, ROULER_HITS.a).loop > 0.5);
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
