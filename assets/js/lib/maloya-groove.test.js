/* ============================================================
   assets/js/lib/maloya-groove.test.js
   Rôle : tests de maloya-groove.js (appuis, flexion des genoux, phrasé, variations).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeFlourish,
  computeGroovePulse,
  computeKneeFlex,
  computeLoopNoise,
  computeStepAmplitude,
  computeWeightShift,
  PHRASE_BEATS,
} from './maloya-groove.js';

const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`);

test('le bassin part sans à-coup, dépasse un peu l’appui puis y revient', () => {
  // Temps 0 : du pied gauche (temps -1) vers le pied droit ; vitesse nulle au départ.
  const start = computeWeightShift(0, 0);
  near(computeWeightShift(0.001, 0) - start, 0, 1e-3);
  const to = computeStepAmplitude(0, 0);
  const travel = to + computeStepAmplitude(-1, 0);
  near(computeWeightShift(0.55, 0), to + 0.05 * travel, 1e-9);
  near(computeWeightShift(0.95, 0), to, 1e-9);
});

test('le transfert d’appui est continu et change de côté à chaque temps', () => {
  let previous = computeWeightShift(0, 0.4);
  for (let beats = 0.005; beats < PHRASE_BEATS; beats += 0.005) {
    const value = computeWeightShift(beats, 0.4);
    assert.ok(Math.abs(value - previous) < 0.06, `saut de ${value - previous} à ${beats}`);
    previous = value;
  }
  assert.ok(computeWeightShift(0.8, 0) > 0.8 && computeWeightShift(1.8, 0) < -0.8);
});

test('le bassin tient l’appui une bonne partie du temps au lieu d’osciller sans arrêt', () => {
  const step = 0.002;
  const speeds = [];
  for (let beats = 0; beats < 8; beats += step) {
    speeds.push(Math.abs(computeWeightShift(beats + step, 0) - computeWeightShift(beats, 0)));
  }
  const max = Math.max(...speeds);
  const still = speeds.filter((v) => v < 0.15 * max).length / speeds.length;
  assert.ok(still > 0.4, `immobile ${still}`);
});

test('le premier temps de la mesure est plus marqué, et l’amplitude varie sur la phrase', () => {
  assert.ok(computeStepAmplitude(0, 0) > computeStepAmplitude(1, 0));
  assert.ok(computeStepAmplitude(8, 0) !== computeStepAmplitude(24, 0));
  near(computeStepAmplitude(3, 0.7), computeStepAmplitude(3 + PHRASE_BEATS, 0.7));
});

test('les genoux se grandissent pendant le transfert puis s’enfoncent dans l’appui', () => {
  assert.ok(computeKneeFlex(0.2) < 0);
  assert.ok(computeKneeFlex(0.775) > 0.99);
  near(computeKneeFlex(0), 0);
  near(computeKneeFlex(0.9999), 0, 1e-6);
  // Sans à-coup d'un temps à l'autre, même quand l'amplitude change (premier temps).
  for (let beats = 0; beats < 8; beats += 0.001) {
    const step = Math.abs(computeGroovePulse(beats + 0.001, 0) - computeGroovePulse(beats, 0));
    assert.ok(step < 0.02, `saut de ${step} à ${beats}`);
  }
});

test('la figure de fin de phrase revient toutes les quatre mesures, sur deux temps', () => {
  assert.deepEqual(computeFlourish(5), { progress: 0, strength: 0 });
  near(computeFlourish(13).strength, 1);
  near(computeFlourish(29).strength, 1);
  assert.equal(computeFlourish(14.5).progress, 1);
});

test('les variations douces sont bornées et bouclent sur la phrase', () => {
  for (let beats = 0; beats < PHRASE_BEATS; beats += 0.1) {
    const value = computeLoopNoise(beats, 1.3);
    assert.ok(Math.abs(value) <= 1);
    near(value, computeLoopNoise(beats + PHRASE_BEATS, 1.3), 1e-9);
  }
});
