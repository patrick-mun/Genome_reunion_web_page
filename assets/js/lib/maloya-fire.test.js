/* ============================================================
   assets/js/lib/maloya-fire.test.js
   Rôle : tests de maloya-fire.js (vacillement, flammes, halo, étincelles).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeFlames,
  computeFlicker,
  computeGlow,
  computeSparks,
  SPARK_COUNT,
} from './maloya-fire.js';

test('le vacillement reste dans [-1, 1]', () => {
  for (let s = 0; s < 20; s += 0.037) {
    const f = computeFlicker(s, 1.3);
    assert.ok(f >= -1 && f <= 1, `${f}`);
  }
});

test('trois couches de flammes, chacune faite de tracés fermés', () => {
  const flames = computeFlames(2.5);
  assert.deepEqual(Object.keys(flames), ['outer', 'mid', 'core']);
  for (const d of Object.values(flames)) {
    assert.match(d, /^M-?\d/);
    assert.equal(d.split('Z').length - 1, 5);
  }
});

test('le halo garde une opacité et une échelle modérées', () => {
  for (let s = 0; s < 10; s += 0.1) {
    const glow = computeGlow(s);
    assert.ok(glow.opacity >= 0.55 && glow.opacity <= 0.85);
    assert.ok(glow.scale >= 0.94 && glow.scale <= 1.06);
  }
});

test('les étincelles montent au-dessus du feu et s’éteignent', () => {
  const sparks = computeSparks(3.1);
  assert.equal(sparks.length, SPARK_COUNT);
  for (const spark of sparks) {
    assert.ok(spark.y < 0);
    assert.ok(spark.opacity >= 0 && spark.opacity <= 1);
  }
});
