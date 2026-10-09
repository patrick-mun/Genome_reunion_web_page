/* ============================================================
   assets/js/lib/maloya-man.test.js
   Rôle : tests de maloya-man.js (pieds au sol, bras à portée, plongée de fin de phrase).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeManPose } from './maloya-man.js';

const STYLE = { timing: -0.03, amp: 1.15, seed: 1.7 };

test('le danseur reste posé au sol, bras à portée et coudes ouverts', () => {
  for (let beats = 0; beats < 32; beats += 0.05) {
    const pose = computeManPose(beats, STYLE);
    for (const leg of Object.values(pose.legs)) {
      assert.ok(leg.foot.y <= -4 + 1e-9 && leg.foot.y > -6);
    }
    for (const arm of Object.values(pose.arms)) {
      assert.ok(arm.shortfall < 1e-6 && arm.elbowBend > 35, `coude ${arm.elbowBend}`);
    }
  }
});

test('en fin de phrase, il plonge sur ses genoux en ouvrant les bras', () => {
  // Même place dans la mesure : temps 5 (hors figure) et 13 (milieu de la figure).
  const calm = computeManPose(5 - STYLE.timing, STYLE);
  const dip = computeManPose(13 - STYLE.timing, STYLE);
  assert.ok(dip.trunk[0].center.y > calm.trunk[0].center.y + 3, 'bassin plus bas');
  const reach = (pose) => pose.arms.right.hand.x - pose.arms.left.hand.x;
  assert.ok(reach(dip) > reach(calm) + 8, 'bras ouverts');
});
