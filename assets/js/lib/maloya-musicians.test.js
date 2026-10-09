/* ============================================================
   assets/js/lib/maloya-musicians.test.js
   Rôle : tests de maloya-musicians.js (poses des musiciens assis et debout : frappes, portée,
   courbure du dos, tête stabilisée, variations d'une mesure à l'autre).
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
  computeStrokeWrist,
  KAYAMB_SHAPE,
  PIKER,
  ROULER,
  SATI,
} from './maloya-musicians.js';
import { PULSES_PER_BEAT } from './maloya-rhythm.js';

const SEATED = { ROULER, SATI, PIKER };
const STYLE = { timing: 0.03, amp: 1.15, seed: 2.1 };
const range = (values) => Math.max(...values) - Math.min(...values);
// Inclinaison d'un segment de la colonne : 0 à la verticale, positive vers l'avant (+x).
const leanOf = (from, to) => (Math.atan2(to.x - from.x, from.y - to.y) * 180) / Math.PI;

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
    for (let beats = 0; beats < 32; beats += 0.02) {
      for (const arm of Object.values(computeSeatedPose(beats, config, STYLE).arms)) {
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

test('debout : l’arc du bobre suit le bassin et ses deux mains sont à portée', () => {
  for (let beats = 0; beats < 32; beats += 0.05) {
    const pose = computeBobrePose(beats, STYLE);
    assert.equal(pose.instrument.x, pose.spine[0].x);
    assert.equal(pose.instrument.y, pose.spine[0].y);
    for (const arm of Object.values(pose.arms)) {
      assert.ok(arm.shortfall < 1e-6 && arm.elbowBend > 40);
    }
    for (const arm of Object.values(computeKayambPose(beats, STYLE).arms)) {
      assert.ok(arm.shortfall < 1e-6 && arm.elbowBend > 40);
    }
  }
});

test('bras et jambe de profil : coude vers l’arrière, genou vers l’avant', () => {
  const arm = computeProfileArm({ x: 0, y: -60 }, { x: 25, y: -40 });
  assert.ok(arm.chain[1].x < 25 / 2, 'coude derrière le milieu de l’épaule au poignet');
  const leg = computeProfileLeg({ x: 0, y: -40 }, { x: 20, y: -4 });
  assert.ok(leg.chain[1].x > 10, 'genou devant le milieu de la hanche à la cheville');
});

test('la main monte près du corps et retombe en avant (boucle, pas un va-et-vient)', () => {
  const contact = { x: 0, y: 0 };
  const raised = { x: 0, y: -20 };
  const up = computeStrokeWrist(contact, raised, { lift: 0.5, loop: 1, isRising: true }, 0.2);
  const down = computeStrokeWrist(contact, raised, { lift: 0.5, loop: 1, isRising: false }, 0.2);
  assert.ok(up.x < -1 && down.x > 1, `${up.x} / ${down.x}`);
  const top = computeStrokeWrist(contact, raised, { lift: 1, loop: 0, isRising: true }, 0.2);
  assert.ok(Math.hypot(top.x - raised.x, top.y - raised.y) < 1e-9);
});

test('assis : le dos s’arrondit et la tête bouge bien moins que le haut du buste', () => {
  const tops = [];
  const heads = [];
  for (let beats = 0; beats < 32; beats += 0.05) {
    const { spine, head } = computeSeatedPose(beats, ROULER, STYLE);
    const low = leanOf(spine[0], spine[1]);
    const high = leanOf(spine[2], spine[3]);
    assert.ok(high > low + 10, 'le haut du dos penche plus vers l’avant que le bas');
    tops.push(high);
    heads.push(head.angle);
  }
  assert.ok(range(heads) < 0.7 * range(tops), `tête ${range(heads)}°, buste ${range(tops)}°`);
});

test('deux mesures ne se répètent jamais à l’identique', () => {
  for (const config of Object.values(SEATED)) {
    let gap = 0;
    for (let beats = 0; beats < 28; beats += 0.25) {
      const a = computeSeatedPose(beats, config, STYLE);
      const b = computeSeatedPose(beats + 4, config, STYLE);
      gap = Math.max(gap, Math.abs(a.head.angle - b.head.angle));
    }
    assert.ok(gap > 0.5, `${gap}°`);
  }
});
