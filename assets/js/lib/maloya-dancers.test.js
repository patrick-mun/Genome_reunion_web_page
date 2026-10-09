/* ============================================================
   assets/js/lib/maloya-dancers.test.js
   Rôle : tests de maloya-dancers.js (pas ancrés, tour sur soi, mains sur la jupe, danseur).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildSkirtPath,
  computeAnchoredFoot,
  computeDancerPose,
  computeDrift,
  computeFrontalLimb,
  computeManPose,
  computeSkirtGrip,
  computeTurn,
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

test('le tour sur soi : de face hors du tour, de dos à mi-tour, jamais plus mince que le profil', () => {
  assert.deepEqual(computeTurn(4, 0.45), { scaleX: 1, spin: 0 });
  const middle = computeTurn(13, 0.45);
  assert.ok(middle.scaleX < -0.99 && middle.spin > 0.99);
  let flips = 0;
  let previous = computeTurn(11.9, 0.45);
  for (let beats = 11.9; beats <= 14.1; beats += 0.01) {
    const turn = computeTurn(beats, 0.45);
    assert.ok(Math.abs(turn.scaleX) >= 0.45 - 1e-9);
    if (Math.sign(turn.scaleX) !== Math.sign(previous.scaleX)) flips++;
    else assert.ok(Math.abs(turn.scaleX - previous.scaleX) < 0.1, `saut à ${beats}`);
    previous = turn;
  }
  assert.equal(flips, 2, 'un passage de face à dos, puis de dos à face');
});

test('pendant le tour, les bords de la jupe suivent les mains sans se croiser', () => {
  for (let beats = 11.9; beats <= 14.1; beats += 0.02) {
    const { skirt } = computeDancerPose(beats);
    assert.match(skirt, /^M.* Z$/);
  }
  const back = computeDancerPose(13);
  assert.ok(back.arms.left.hand.x < back.arms.right.hand.x);
});

test('les deux mains tiennent la jupe, de chaque côté, sans jamais monter au-dessus des épaules', () => {
  for (let beats = 0; beats < 16; beats += 0.05) {
    const pose = computeDancerPose(beats);
    const { left, right } = pose.arms;
    assert.ok(left.hand.x < pose.torso.x && right.hand.x > pose.torso.x);
    for (const arm of [left, right]) {
      assert.ok(arm.shortfall < 1e-6, 'main sur la jupe');
      assert.ok(arm.hand.y > arm.upper.y + 20, 'main basse');
    }
  }
});

test('le côté de la jupe s’ouvre et se soulève avec la main', () => {
  const waist = { x: 0, y: -66 };
  const closed = computeSkirtGrip(waist, 1, 0);
  const opened = computeSkirtGrip(waist, 1, 1);
  assert.ok(opened.x > closed.x && opened.y < closed.y);
  assert.ok(computeSkirtGrip(waist, -1, 1).x < -closed.x);
});

test('un membre de face est le reflet exact de son symétrique', () => {
  const right = computeFrontalLimb({ x: 10, y: -80 }, { x: 25, y: -55 }, [20, 18], 1, -1);
  const left = computeFrontalLimb({ x: -10, y: -80 }, { x: -25, y: -55 }, [20, 18], -1, -1);
  assert.ok(Math.abs(right.second.x + left.second.x) < 1e-9);
  assert.ok(Math.abs(right.second.y - left.second.y) < 1e-9);
});

test('la jupe est un tracé fermé ; le danseur reste posé au sol', () => {
  assert.match(computeDancerPose(1.7).skirt, /^M.* Z$/);
  const skirt = buildSkirtPath(
    {
      waist: { x: 0, y: -66 },
      hipTilt: 0,
      hemX: 0,
      grips: { left: { x: -20, y: -58 }, right: { x: 25, y: -60 } },
      lifts: { left: 0.2, right: 0.9 },
      flare: 0.5,
    },
    0,
  );
  assert.match(skirt, /^M.* Z$/);
  for (let beats = 0; beats < 4; beats += 0.1) {
    for (const leg of Object.values(computeManPose(beats).legs)) {
      assert.ok(leg.foot.y <= -4 + 1e-9 && leg.foot.y > -6);
    }
  }
});
