/* ============================================================
   assets/js/lib/maloya-skirt.test.js
   Rôle : tests de maloya-skirt.js (mains sur les bords de la jupe, contour fermé, plis qui
   font le tour de la jupe pendant le tourbillon).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFoldPaths, buildSkirtPath, computeSkirtGrip } from './maloya-skirt.js';

const WAIST = { x: 0, y: -66 };

test('le côté de la jupe s’ouvre et se soulève avec la main', () => {
  const closed = computeSkirtGrip(WAIST, 1, 0);
  const opened = computeSkirtGrip(WAIST, 1, 1);
  assert.ok(opened.x > closed.x && opened.y < closed.y);
  assert.ok(computeSkirtGrip(WAIST, -1, 1).x < -closed.x);
});

test('la jupe est un tracé fermé qui passe par les deux mains', () => {
  const grips = { left: { x: -20, y: -58 }, right: { x: 25, y: -60 } };
  const skirt = buildSkirtPath(
    {
      waist: WAIST,
      hipTilt: 3,
      hemX: 1,
      grips,
      lifts: { left: 0.2, right: 0.9 },
      flare: 0.5,
      spin: 0.3,
    },
    1.2,
  );
  assert.match(skirt, /^M.* Z$/);
  assert.match(skirt, / -20,-58 /);
  assert.match(skirt, / 25,-60 /);
});

test('au repos, trois plis de face ; le tourbillon les fait glisser et passer derrière', () => {
  const rest = buildFoldPaths(WAIST, 0, 0, 0);
  assert.equal(rest.length, 6);
  assert.deepEqual(
    rest.map((d) => d !== ''),
    [true, true, false, false, false, true],
  );
  // Un douzième de tour plus loin : le pli du milieu a glissé, celui de 60° passe derrière.
  const turned = buildFoldPaths(WAIST, 0, 0, 1 / 12);
  assert.notEqual(turned[0], rest[0]);
  assert.equal(turned[1], '');
  assert.equal(buildFoldPaths(WAIST, 0, 0, 1).join('|'), rest.join('|'), 'un tour complet');
});

test('un pli qui passe sur le côté raccourcit au lieu de disparaître d’un coup', () => {
  const length = (d) => {
    const numbers = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    const [first, last] = [numbers[0], numbers[numbers.length - 1]];
    return Math.hypot(last[0] - first[0], last[1] - first[1]);
  };
  // Le pli 1 part de 60° : il raccourcit à mesure qu'il approche du bord.
  const lengths = [0, 0.02, 0.04, 0.06].map((spin) => buildFoldPaths(WAIST, 0, 0, spin)[1]);
  const visible = lengths.filter(Boolean).map(length);
  for (let i = 1; i < visible.length; i++) assert.ok(visible[i] < visible[i - 1]);
});
