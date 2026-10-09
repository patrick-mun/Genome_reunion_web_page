/* ============================================================
   assets/js/lib/maloya-dancers.test.js
   Rôle : tests de maloya-dancers.js (pas ancrés, transfert d'appui, bassin et épaules opposés,
   tête presque droite, mains sur la jupe, tourbillon sans aplatir le corps).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeAnchoredFoot,
  computeDancerPose,
  computeDrift,
  computeFrontalLimb,
} from './maloya-dancers.js';

const STYLE = { timing: 0.02, amp: 1.05, seed: 2.8 };

test('un pied ancré reste posé hors de son pas, et ne bouge que pendant son pas', () => {
  // Pied gauche (phase 0) : il glisse de 0,5 à 0,95 temps, puis reste posé jusqu’à 2,5.
  const planted = [1.1, 1.6, 2.3].map((b) => computeAnchoredFoot(b, 0, -6));
  for (const foot of planted) {
    assert.ok(Math.abs(foot.x - planted[0].x) < 1e-9);
    assert.ok(Math.abs(foot.lift) < 1e-9);
  }
  assert.ok(computeAnchoredFoot(0.7, 0, -6).lift > 0);
});

test('les deux pieds partent à tour de rôle, sur des temps différents', () => {
  const left = computeAnchoredFoot(1.7, 0, -6);
  const right = computeAnchoredFoot(1.7, 1, 6);
  assert.ok(Math.abs(left.lift) < 1e-9);
  assert.ok(right.lift > 0.1);
});

test('un pied ne glisse que lorsque le bassin est passé sur l’autre pied', () => {
  for (let beats = 0; beats < 32; beats += 0.02) {
    const pose = computeDancerPose(beats, STYLE);
    const hips = pose.trunk[0].center.x - (pose.feet.left.x + pose.feet.right.x) / 2;
    if (pose.feet.left.y < -0.05) assert.ok(hips > 3, `bassin à ${hips} à ${beats}`);
    if (pose.feet.right.y < -0.05) assert.ok(hips < -3, `bassin à ${hips} à ${beats}`);
  }
});

test('la dérive latérale fait un aller-retour toutes les deux mesures', () => {
  assert.ok(Math.abs(computeDrift(8) - computeDrift(0)) < 1e-9);
  assert.ok(computeDrift(2) > 0 && computeDrift(6) < 0);
});

test('hanche d’appui plus haute, épaules inclinées en sens inverse, tête presque droite', () => {
  // Au milieu du temps 2, le poids est sur le pied droit (+x).
  const pose = computeDancerPose(2.7, STYLE);
  const [waist, , shoulders] = pose.trunk;
  assert.ok(waist.angle < -3, `taille ${waist.angle}`);
  assert.ok(shoulders.angle > 2, `épaules ${shoulders.angle}`);
  for (let beats = 0; beats < 32; beats += 0.05) {
    assert.ok(Math.abs(computeDancerPose(beats, STYLE).head.angle) < 4);
  }
});

test('les deux mains tiennent la jupe, de chaque côté, sans jamais monter au-dessus des épaules', () => {
  for (let beats = 0; beats < 32; beats += 0.05) {
    const pose = computeDancerPose(beats, STYLE);
    const { left, right } = pose.arms;
    const waist = pose.trunk[0].center;
    assert.ok(left.hand.x < waist.x && right.hand.x > waist.x);
    for (const arm of [left, right]) {
      assert.ok(arm.shortfall < 1e-6, 'main sur la jupe');
      assert.ok(arm.hand.y > arm.chain[0].y + 20, 'main basse');
    }
  }
});

test('pendant le tourbillon, le corps reste de face et les plis font le tour de la jupe', () => {
  const rest = computeDancerPose(4, STYLE);
  const swirl = computeDancerPose(13, STYLE);
  const width = (pose) => pose.trunk[2].half[0] + pose.trunk[2].half[1];
  assert.equal(width(swirl), width(rest), 'pas de rétrécissement du buste');
  assert.notDeepEqual(swirl.folds, rest.folds);
  assert.equal(rest.folds.filter(Boolean).length, 3, 'trois plis de face au repos');
  assert.match(swirl.skirt, /^M.* Z$/);
});

test('un membre de face est le reflet exact de son symétrique', () => {
  const right = computeFrontalLimb({ x: 10, y: -80 }, { x: 25, y: -55 }, [20, 18], 1, -1);
  const left = computeFrontalLimb({ x: -10, y: -80 }, { x: -25, y: -55 }, [20, 18], -1, -1);
  assert.ok(Math.abs(right.chain[1].x + left.chain[1].x) < 1e-9);
  assert.ok(Math.abs(right.chain[1].y - left.chain[1].y) < 1e-9);
  assert.ok(Math.abs(right.tipAngle + left.tipAngle) < 1e-9);
});
