/* ============================================================
   assets/js/lib/maloya-bodies.test.js
   Rôle : tests de maloya-bodies.js (chaque partie habillée reçoit un contour fermé).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeDancerBodyPaths,
  computeManBodyPaths,
  computeProfileBodyPaths,
} from './maloya-bodies.js';
import { computeDancerPose } from './maloya-dancers.js';
import { computeManPose } from './maloya-man.js';
import { computeSeatedPose, ROULER } from './maloya-musicians.js';

const closed = /^M[-\d.]+,[-\d.]+ .* Z$/;

test('musicien de profil : buste, bras, jambes et vêtements, contours fermés', () => {
  const paths = computeProfileBodyPaths(computeSeatedPose(1.3, ROULER));
  const parts = ['torso-shirt', 'torso-pelvis'];
  for (const side of ['near', 'far']) {
    parts.push(`${side}-arm`, `${side}-sleeve`, `${side}-leg`, `${side}-trouser`);
  }
  assert.deepEqual(Object.keys(paths).sort(), parts.sort());
  for (const d of Object.values(paths)) assert.match(d, closed);
});

test('danseuse et danseur : buste, ceinture, bras et jambes, contours fermés', () => {
  const dancer = computeDancerBodyPaths(computeDancerPose(2.4));
  assert.deepEqual(
    Object.keys(dancer).sort(),
    ['left-arm', 'left-sleeve', 'right-arm', 'right-sleeve', 'sash', 'torso'].sort(),
  );
  const man = computeManBodyPaths(computeManPose(2.4));
  assert.ok(['belt', 'left-leg', 'right-trouser', 'torso'].every((part) => part in man));
  for (const d of [...Object.values(dancer), ...Object.values(man)]) assert.match(d, closed);
});
