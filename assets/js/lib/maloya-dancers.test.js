/* ============================================================
   assets/js/lib/maloya-dancers.test.js
   Rôle : tests de maloya-dancers.js (pas ancrés, échange des bras, jupe, danseur).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildSkirtPath,
  computeAnchoredFoot,
  computeDancerArm,
  computeDancerPose,
  computeDrift,
  computeLeftHoldWeight,
  computeManPose,
} from './maloya-dancers.js';

test('un pied ancré reste posé hors de son pas, et ne bouge que pendant son pas', () => {
  // Pied gauche (phase 0) : pas de 0 à 0,6 temps, posé de 0,6 à 2.
  const planted = [0.7, 1.2, 1.9].map((b) => computeAnchoredFoot(b, 0, -6));
  for (const foot of planted) {
    assert.ok(Math.abs(foot.x - planted[0].x) < 1e-9);
    assert.ok(Math.abs(foot.lift) < 1e-9);
  }
  assert.ok(computeAnchoredFoot(0.3, 0, -6).lift > 0);
});

test('les deux pieds partent à tour de rôle, sur des temps différents', () => {
  const left = computeAnchoredFoot(1.3, 0, -6);
  const right = computeAnchoredFoot(1.3, 1, 6);
  assert.ok(Math.abs(left.lift) < 1e-9);
  assert.ok(right.lift > 0.1);
});

test('la dérive latérale fait un aller-retour toutes les deux mesures', () => {
  assert.ok(Math.abs(computeDrift(8) - computeDrift(0)) < 1e-9);
  assert.ok(computeDrift(2) > 0 && computeDrift(6) < 0);
});

test('les mains de la danseuse échangent leur rôle toutes les deux mesures', () => {
  assert.equal(computeLeftHoldWeight(4), 1);
  assert.equal(computeLeftHoldWeight(12), 0);
  assert.equal(computeLeftHoldWeight(20), 1);
});

test('pendant l’échange, le coude change de côté bras tendu, sans saut', () => {
  const shoulder = { x: 13, y: -89 };
  const raised = { x: 10, y: -121 };
  const grip = { x: 21, y: -58 };
  let previous = computeDancerArm(shoulder, raised, grip, 0, 1);
  for (let hold = 0.01; hold <= 1; hold += 0.01) {
    const arm = computeDancerArm(shoulder, raised, grip, hold, 1);
    const jump = Math.hypot(arm.fore.x - previous.fore.x, arm.fore.y - previous.fore.y);
    assert.ok(jump < 2, `coude déplacé de ${jump} pour un pas de 0,01`);
    previous = arm;
  }
});

test('la jupe est un tracé fermé ; la danseuse et le danseur restent posés au sol', () => {
  const pose = computeDancerPose(1.7);
  assert.match(pose.skirt, /^M.* Z$/);
  assert.equal(pose.folds.length, 3);
  const skirt = buildSkirtPath(
    {
      waist: { x: 0, y: -66 },
      hipTilt: 0,
      hemX: 0,
      holds: { left: 0, right: 1 },
      grips: { left: { x: -20, y: -60 }, right: { x: 25, y: -55 } },
    },
    0,
  );
  assert.match(skirt, /^M.* Z$/);
  for (let beats = 0; beats < 4; beats += 0.1) {
    const man = computeManPose(beats);
    for (const leg of Object.values(man.legs)) {
      assert.ok(leg.foot.y <= -4 + 1e-9 && leg.foot.y > -6);
    }
  }
});
