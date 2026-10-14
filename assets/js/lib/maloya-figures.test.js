/* ============================================================
   assets/js/lib/maloya-figures.test.js
   Rôle : tests de maloya-figures.js (chaque personnage expose les parties [data-part] que
   maloya.js anime, sans couleur en dur, et les membres éloignés sont voilés).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDancerFigure, buildManFigure, buildProfileFigure } from './maloya-figures.js';

const INSTRUMENTS = ['rouler', 'sati', 'piker', 'bobre', 'kayamb'];
const parts = (svg) => [...svg.matchAll(/data-part="([^"]+)"/g)].map((m) => m[1]);

test('chaque musicien expose sa tête, ses bras, ses jambes et son torse', () => {
  for (const instrument of INSTRUMENTS) {
    const names = parts(buildProfileFigure({ id: 'm', instrument, head: 'hat' }));
    for (const part of ['m-head', 'm-near-arm', 'm-far-arm', 'm-torso-shirt', 'm-torso-pelvis']) {
      assert.ok(names.includes(part), `${instrument} : ${part} manquant`);
    }
  }
});

test("les musiciens à instrument mobile exposent aussi l'instrument", () => {
  for (const instrument of ['bobre', 'kayamb']) {
    const svg = buildProfileFigure({ id: 'm', instrument, head: 'hair' });
    assert.ok(parts(svg).includes('m-instrument'));
  }
});

test('les membres éloignés ont un voile, pas les proches', () => {
  const svg = buildProfileFigure({ id: 'm', instrument: 'sati', head: 'bandana' });
  assert.ok(parts(svg).includes('m-far-arm-shade'));
  assert.ok(!parts(svg).includes('m-near-arm-shade'));
});

test('le danseur et la danseuse exposent leurs parties animées', () => {
  const dancer = parts(buildDancerFigure({ id: 'd' }));
  for (const part of ['d-skirt', 'd-torso', 'd-head', 'd-left-arm', 'd-right-arm']) {
    assert.ok(dancer.includes(part), `${part} manquant`);
  }
  const man = parts(buildManFigure({ id: 'h' }));
  for (const part of ['h-left-leg', 'h-right-leg', 'h-torso', 'h-head']) {
    assert.ok(man.includes(part), `${part} manquant`);
  }
});

test('aucune couleur en dur dans le dessin', () => {
  const svgs = [
    buildProfileFigure({ id: 'm', instrument: 'piker', head: 'hair' }),
    buildDancerFigure({ id: 'd' }),
    buildManFigure({ id: 'h' }),
  ];
  for (const svg of svgs) assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,6}\b|rgb\(/);
});
