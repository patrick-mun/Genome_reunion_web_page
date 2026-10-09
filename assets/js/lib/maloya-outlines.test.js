/* ============================================================
   assets/js/lib/maloya-outlines.test.js
   Rôle : tests de maloya-outlines.js (niveaux le long d'une chaîne, pli des articulations,
   contours fermés et leurs bouts).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBandOutline, buildChainOutline, sampleChain } from './maloya-outlines.js';

const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`);

const ARM = [
  [3, 3],
  [2.5, 2.5],
  [2, 2],
];

function bentArm(interior) {
  const turn = ((180 - interior) * Math.PI) / 180;
  return [
    { x: 0, y: 0 },
    { x: 0, y: 19 },
    { x: 16 * Math.sin(turn), y: 19 + 16 * Math.cos(turn) },
  ];
}

const sidePoint = (level, side) => {
  const a = (level.angle * Math.PI) / 180;
  const h = side === 0 ? level.half[0] : -level.half[1];
  return { x: level.center.x + h * Math.cos(a), y: level.center.y + h * Math.sin(a) };
};

test('les niveaux passent par les bouts et par l’articulation, avec les largeurs prévues', () => {
  const levels = sampleChain(bentArm(180), ARM);
  const centers = levels.map((l) => l.center.y);
  assert.deepEqual(
    centers.map((y) => Number(y.toFixed(6))),
    [0, 9.5, 19, 27, 35],
  );
  near(levels[0].half[0], 3);
  near(levels[2].half[0], 2.5);
  near(levels[4].half[1], 2);
  // Chaîne qui descend : le côté 0 est à gauche de l’écran.
  near(sidePoint(levels[0], 0).x, -3);
});

test('une portion de chaîne s’arrête où on le demande, sans point intermédiaire trop court', () => {
  const levels = sampleChain(bentArm(180), ARM, 0, 0.66);
  near(levels[levels.length - 1].center.y, 0.66 * 35, 1e-9);
  assert.equal(levels.length, 4, 'début, milieu du bras, coude, fin (portion courte)');
});

test('au coude plié, le pli se creuse à l’intérieur et s’arrondit à l’extérieur', () => {
  const levels = sampleChain(bentArm(90), ARM);
  const elbow = levels[2];
  // L’avant-bras part vers +x : l’intérieur du pli est du côté +x (côté 1 ici).
  assert.ok(elbow.half[1] > 2.5 * 1.3, `intérieur ${elbow.half[1]}`);
  assert.ok(elbow.half[0] > 2.5 && elbow.half[0] < elbow.half[1], `extérieur ${elbow.half[0]}`);
});

test('même très plié, le bord intérieur ne revient pas en arrière (pas de boucle)', () => {
  for (const interior of [150, 120, 90, 60, 40]) {
    const chain = bentArm(interior);
    const levels = sampleChain(chain, ARM, 0, 0.66);
    const inner = levels.map((level) => sidePoint(level, 1));
    // Le long du bras : les points intérieurs descendent jusqu’au coude…
    const upper = inner.filter((_, i) => levels[i].center.y < 19 - 1e-9);
    for (let i = 1; i < upper.length; i++) assert.ok(upper[i].y > upper[i - 1].y);
    // … et le point du pli reste avant le dernier point, le long de l’avant-bras.
    const fore = { x: chain[2].x - chain[1].x, y: chain[2].y - chain[1].y };
    const along = (p) => (p.x - chain[1].x) * fore.x + (p.y - chain[1].y) * fore.y;
    assert.ok(along(inner[inner.length - 2]) < along(inner[inner.length - 1]), `${interior}°`);
  }
});

test('le contour est fermé ; bouts arrondis ou droits selon la demande', () => {
  const round = buildChainOutline(bentArm(120), ARM);
  assert.match(round, /^M[-\d.]+,[-\d.]+ C.* Z$/);
  const flat = buildChainOutline(bentArm(120), ARM, { to: 0.6, start: 'flat', end: 'flat' });
  assert.match(flat, / L[-\d.]+,[-\d.]+ C/);
  assert.ok(
    round.split('C').length > flat.split('C').length,
    'les bouts arrondis ajoutent des courbes',
  );
});

test('un bout arrondi dépasse le dernier niveau de sa hauteur d’arrondi', () => {
  const levels = [
    { center: { x: 0, y: 0 }, half: [4, 4], angle: 0 },
    { center: { x: 0, y: -10 }, half: [4, 4], angle: 0 },
  ];
  // Niveaux qui montent (angle 0 : côté 0 vers +x) : le bout de fin bombe vers le haut.
  const d = buildBandOutline(levels, { start: 'flat', end: 0.5 });
  const ys = [...d.matchAll(/-?[\d.]+,(-?[\d.]+)/g)].map((m) => Number(m[1]));
  near(Math.min(...ys), -12, 1e-9);
  near(Math.max(...ys), 0, 1e-9);
});
