/* ============================================================
   assets/js/lib/maloya-scene.test.js
   Rôle : tests de maloya-scene.js, maloya-svg.js et maloya-figures.js : chaque partie dessinée
   reçoit une valeur à chaque image, et le mouvement de chaque personnage, simulé image par
   image, est continu, boucle sans saut et garde des coudes ouverts.
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeAngleDifference } from './geometry.js';
import { computeMemberPose, computeSceneFrame } from './maloya-scene.js';
import { buildCapsulePath } from './maloya-figures.js';
import { buildMaloyaSvg, CAST, formatPartTransform, SCENE } from './maloya-svg.js';

const TEMPO_BPM = 96;
const FPS = 60;
const LOOP_BEATS = 16; // plus long cycle de la scène : l'échange des bras des danseuses

function flattenParts(pose) {
  const parts = { torso: pose.torso, head: pose.head };
  for (const [side, arm] of Object.entries(pose.arms)) {
    for (const bone of ['upper', 'fore', 'hand']) parts[`${side}-${bone}`] = arm[bone];
  }
  for (const [side, leg] of Object.entries(pose.legs ?? {})) {
    for (const bone of ['thigh', 'shin', 'foot']) parts[`${side}-${bone}`] = leg[bone];
  }
  return parts;
}

function measureGap(a, b) {
  let angle = 0;
  let distance = 0;
  for (const name of Object.keys(a)) {
    angle = Math.max(angle, Math.abs(computeAngleDifference(a[name].angle, b[name].angle)));
    distance = Math.max(distance, Math.hypot(a[name].x - b[name].x, a[name].y - b[name].y));
  }
  return { angle, distance };
}

test('chaque partie dessinée reçoit une valeur à chaque image, et inversement', () => {
  const drawn = [...buildMaloyaSvg().matchAll(/data-part="([\w-]+)"/g)].map((m) => m[1]);
  const frame = computeSceneFrame(1.7, 2.3);
  const given = [
    ...Object.keys(frame.transforms),
    ...Object.keys(frame.paths),
    ...frame.sparks.map((_, i) => `spark-${i}`),
    'glow',
  ];
  assert.equal(new Set(drawn).size, drawn.length, 'parties en double');
  assert.deepEqual([...drawn].sort(), given.sort());
});

test('le SVG est bien formé et à la taille de la scène', () => {
  const svg = buildMaloyaSvg();
  assert.match(svg, new RegExp(`^<svg[^>]* viewBox="0 0 ${SCENE.width} ${SCENE.height}"`));
  for (const tag of ['g', 'defs', 'pattern', 'radialGradient']) {
    const opened = svg.split(`<${tag}`).length - 1;
    const closed = svg.split(`</${tag}>`).length - 1;
    assert.equal(opened, closed, `<${tag}> : ${opened} ouverts, ${closed} fermés`);
  }
  assert.equal(new Set(CAST.map((m) => m.id)).size, CAST.length);
});

test('formats de dessin : segment arrondi et transformation d’une partie', () => {
  assert.equal(buildCapsulePath(10, 4, 2), 'M-2,0 A2,2 0 0 1 2,0 L1,10 A1,1 0 0 1 -1,10 Z');
  assert.equal(
    formatPartTransform({ x: 1.234, y: -5, angle: 30.126 }),
    'translate(1.23,-5) rotate(30.13)',
  );
});

test('chaque personnage : mouvement continu, boucle sans saut, coudes ouverts, cibles atteintes', () => {
  const step = TEMPO_BPM / 60 / FPS;
  for (const member of CAST) {
    let previous = flattenParts(computeMemberPose(member, 0));
    for (let i = 1; i <= Math.round(LOOP_BEATS / step); i++) {
      const pose = computeMemberPose(member, i * step);
      const parts = flattenParts(pose);
      const gap = measureGap(parts, previous);
      assert.ok(gap.angle < 15, `${member.id} : ${gap.angle.toFixed(1)}° en une image`);
      assert.ok(gap.distance < 4, `${member.id} : ${gap.distance.toFixed(2)} en une image`);
      for (const arm of Object.values(pose.arms)) {
        assert.ok(arm.elbowBend > 35, `${member.id} : coude replié à ${arm.elbowBend.toFixed(0)}°`);
        assert.ok(
          arm.shortfall < 0.5,
          `${member.id} : cible manquée de ${arm.shortfall.toFixed(2)}`,
        );
      }
      previous = parts;
    }
    const loop = measureGap(
      flattenParts(computeMemberPose(member, 0)),
      flattenParts(computeMemberPose(member, LOOP_BEATS)),
    );
    assert.ok(loop.angle < 1e-6 && loop.distance < 1e-6, `${member.id} : raccord de la boucle`);
  }
});
