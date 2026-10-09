/* ============================================================
   assets/js/lib/maloya-musicians.test.js
   Rôle : tests de maloya-musicians.js (poses des musiciens assis et debout).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeBobrePose,
  computeKayambPose,
  computeProfileArm,
  computeProfileLeg,
  computeSeatedPose,
  KAYAMB_SHAPE,
  PIKER,
  ROULER,
  SATI,
} from './maloya-musicians.js';
import { PULSES_PER_BEAT } from './maloya-rhythm.js';

const SEATED = { ROULER, SATI, PIKER };

test('assis : à chaque frappe, le poignet est sur son point de contact', () => {
  for (const [name, config] of Object.entries(SEATED)) {
    for (const side of ['a', 'b']) {
      const arm = side === 'a' ? 'near' : 'far';
      for (const hit of config.hits[side]) {
        const pose = computeSeatedPose(hit / PULSES_PER_BEAT, config);
        const { x, y } = pose.arms[arm].hand;
        assert.ok(
          Math.hypot(x - config.wristContact[side].x, y - config.wristContact[side].y) < 1e-6,
          name,
        );
      }
    }
  }
});

test('assis : les poignets restent à portée, coudes jamais repliés', () => {
  for (const [name, config] of Object.entries(SEATED)) {
    for (let beats = 0; beats < 4; beats += 0.02) {
      for (const arm of Object.values(computeSeatedPose(beats, config).arms)) {
        assert.ok(arm.shortfall < 1e-6, `${name} : cible hors de portée`);
        assert.ok(arm.elbowBend > 40, `${name} : coude replié à ${arm.elbowBend}°`);
      }
    }
  }
});

test('debout : les mains du kayamb tiennent les deux bords du cadre', () => {
  const pose = computeKayambPose(0.4);
  const { x, y } = pose.instrument;
  for (const arm of Object.values(pose.arms)) {
    const d = Math.hypot(arm.hand.x - x, arm.hand.y - y);
    assert.ok(Math.abs(d - KAYAMB_SHAPE.halfWidth) < 1e-6, `${d}`);
  }
});

test('debout : le bobre suit le buste et sa main frappe à portée', () => {
  for (let beats = 0; beats < 4; beats += 0.05) {
    const pose = computeBobrePose(beats);
    assert.deepEqual(pose.instrument, pose.torso);
    assert.ok(pose.arms.near.shortfall < 1e-6);
  }
});

test('bras et jambe de profil : coude vers l’arrière, genou vers l’avant', () => {
  const arm = computeProfileArm({ x: 0, y: -60 }, { x: 25, y: -40 });
  assert.ok(arm.fore.x < 25 / 2, 'coude derrière le milieu de l’épaule au poignet');
  const leg = computeProfileLeg({ x: 0, y: -40 }, { x: 20, y: -4 });
  assert.ok(leg.shin.x > 10, 'genou devant le milieu de la hanche à la cheville');
});
