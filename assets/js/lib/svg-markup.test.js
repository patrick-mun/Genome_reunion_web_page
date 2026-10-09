/* ============================================================
   assets/js/lib/svg-markup.test.js
   Rôle : tests de bird-svg.js et gecko-svg.js (balisage SVG de l'oiseau et du margouillat : accroches,
   absence de couleur, transformations des ailes et de la queue).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BIRD_PIVOTS, buildBirdSvg, formatTailTransform, formatWingTransform } from './bird-svg.js';
import { buildGeckoSvg } from './gecko-svg.js';

const countOf = (text, pattern) => (text.match(pattern) || []).length;

test('buildBirdSvg est un svg unique et fermé', () => {
  const svg = buildBirdSvg();
  assert.ok(svg.startsWith('<svg viewBox="0 0 72 82">'));
  assert.ok(svg.endsWith('</svg>'));
  assert.equal(countOf(svg, /<svg/g), 1);
  assert.equal(countOf(svg, /<g[ >]/g), countOf(svg, /<\/g>/g));
});

test('buildBirdSvg expose les accroches animées par paille-en-queue.js', () => {
  const svg = buildBirdSvg();
  for (const hook of ['data-wing-left', 'data-wing-right', 'data-tail']) {
    assert.equal(countOf(svg, new RegExp(`${hook}[ =>]`, 'g')), 1, hook);
  }
});

test('formatWingTransform fait pivoter et raccourcit chaque aile autour de son épaule', () => {
  const pose = { span: 0.75, sweep: 4 };
  const { x, y } = BIRD_PIVOTS.leftShoulder;
  assert.equal(
    formatWingTransform('left', pose),
    `translate(${x},${y}) rotate(4.00) scale(0.750,1) translate(${-x},${-y})`,
  );
  // Balayage vers l'avant : l'aile droite tourne dans l'autre sens.
  assert.match(formatWingTransform('right', pose), /^translate\(38,22\) rotate\(-4\.00\)/);
});

test('formatTailTransform fait pivoter les brins à leur base', () => {
  const { x, y } = BIRD_PIVOTS.tail;
  assert.equal(formatTailTransform(-3.456), `rotate(-3.46 ${x} ${y})`);
});

test('buildBirdSvg ne porte aucun style en ligne', () => {
  assert.doesNotMatch(buildBirdSvg(), /style=/);
});

test('buildGeckoSvg est un svg unique et fermé, aux groupes équilibrés', () => {
  const svg = buildGeckoSvg();
  assert.ok(svg.startsWith('<svg viewBox="0 0 90 150">'));
  assert.ok(svg.endsWith('</svg>'));
  assert.equal(countOf(svg, /<g[ >]/g), countOf(svg, /<\/g>/g));
});

test('buildGeckoSvg expose toutes les accroches animées par margouillat.js', () => {
  const svg = buildGeckoSvg();
  for (const hook of [
    'data-sway',
    'data-tail-dark',
    'data-tail-green',
    'data-head',
    'data-leg-fl',
    'data-leg-fr',
    'data-leg-bl',
    'data-leg-br',
  ]) {
    assert.equal(countOf(svg, new RegExp(`${hook}[ =>/]`, 'g')), 1, hook);
  }
});

test('buildGeckoSvg dessine quatre pattes de trois doigts', () => {
  const svg = buildGeckoSvg();
  assert.equal(countOf(svg, /data-leg-/g), 4);
  assert.equal(countOf(svg, /r="2\.3"/g), 12);
});

test('buildBirdSvg ne porte aucune couleur : elles viennent du CSS', () => {
  assert.doesNotMatch(buildBirdSvg(), /#[0-9a-f]{3,8}|fill=|stroke=/i);
});

test('buildGeckoSvg ne porte aucune couleur ni trait : ils viennent du CSS', () => {
  assert.doesNotMatch(buildGeckoSvg(), /#[0-9a-f]{3,8}|fill=|stroke=|opacity=/i);
});

test('buildGeckoSvg et buildBirdSvg exposent les classes de peinture attendues', () => {
  const gecko = buildGeckoSvg();
  for (const cls of [
    'gecko-skin',
    'gecko-limb',
    'gecko-limb-edge',
    'gecko-toe',
    'gecko-eye',
    'gecko-tail',
  ]) {
    assert.match(gecko, new RegExp(`class="${cls}"`), cls);
  }
  assert.match(buildBirdSvg(), /class="paille-beak"/);
  assert.match(buildBirdSvg(), /class="paille-eye"/);
});
