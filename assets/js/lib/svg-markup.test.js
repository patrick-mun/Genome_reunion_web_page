/* ============================================================
   assets/js/lib/svg-markup.test.js
   Rôle : tests de bird-svg.js et gecko-svg.js (balisage SVG de l'oiseau et du margouillat (accroches, absence de couleur)).
   Pages concernées : aucune (tests unitaires, lancés par node --test).
   Accroches : aucune.
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBirdSvg } from './bird-svg.js';
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
  assert.match(svg, /data-wings/);
  assert.match(svg, /data-tail/);
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
