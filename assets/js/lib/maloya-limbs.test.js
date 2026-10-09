/* ============================================================
   assets/js/lib/maloya-limbs.test.js
   Rôle : tests de maloya-limbs.js (interpolation, rotation, cinématique inverse, tracé lissé).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addPoints,
  buildSmoothPath,
  computeBoneAngle,
  computeEdgeSmoothstep,
  lerp,
  lerpPoint,
  rotatePoint,
  solveTwoBone,
} from './maloya-limbs.js';

const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`);

test('lerp et lerpPoint interpolent entre leurs bornes', () => {
  assert.equal(lerp(2, 6, 0.25), 3);
  assert.deepEqual(lerpPoint({ x: 0, y: 0 }, { x: 10, y: -4 }, 0.5), { x: 5, y: -2 });
  assert.deepEqual(addPoints({ x: 1, y: 2 }, { x: 3, y: -5 }), { x: 4, y: -3 });
});

test('computeEdgeSmoothstep est borné et vaut 0,5 au milieu des bornes', () => {
  assert.equal(computeEdgeSmoothstep(2, 4, 1), 0);
  assert.equal(computeEdgeSmoothstep(2, 4, 3), 0.5);
  assert.equal(computeEdgeSmoothstep(2, 4, 9), 1);
});

test('rotatePoint tourne dans le sens horaire de l’écran, comme rotate() en SVG', () => {
  const p = rotatePoint({ x: 1, y: 0 }, 90);
  near(p.x, 0);
  near(p.y, 1);
});

test('computeBoneAngle oriente un segment dessiné vers le bas', () => {
  near(computeBoneAngle({ x: 0, y: 0 }, { x: 0, y: 10 }), 0);
  near(computeBoneAngle({ x: 0, y: 0 }, { x: 10, y: 0 }), -90);
});

test('la cinématique inverse atteint une cible à portée, du côté demandé', () => {
  const target = { x: 20, y: 10 };
  const clockwise = solveTwoBone({ x: 0, y: 0 }, target, 15, 15, 1);
  const counter = solveTwoBone({ x: 0, y: 0 }, target, 15, 15, -1);
  near(clockwise.shortfall, 0, 1e-6);
  near(counter.shortfall, 0, 1e-6);
  assert.notDeepEqual(clockwise.joint, counter.joint);
  near(clockwise.bend, counter.bend, 1e-6);
});

test('une cible hors de portée tend le membre sans le dépasser', () => {
  const solved = solveTwoBone({ x: 0, y: 0 }, { x: 100, y: 0 }, 15, 15, 1);
  near(solved.end.x, 30, 1e-3);
  assert.ok(solved.bend > 179);
  near(solved.shortfall, 70, 1e-3);
});

test('un côté de pli nul redresse le membre', () => {
  const solved = solveTwoBone({ x: 0, y: 0 }, { x: 20, y: 0 }, 15, 15, 0);
  near(solved.joint.y, 0);
});

test('le tracé lissé passe par ses points, et se referme sur demande', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 5 },
    { x: 20, y: 0 },
  ];
  assert.match(buildSmoothPath(points), /^M0,0 C.* 10,5 C.* 20,0$/);
  assert.match(buildSmoothPath(points, true), / 0,0 Z$/);
});
