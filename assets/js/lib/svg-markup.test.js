import assert from 'node:assert/strict';
import { test } from 'node:test';
import { birdSVG } from './bird-svg.js';
import { geckoSVG } from './gecko-svg.js';

const countOf = (text, pattern) => (text.match(pattern) || []).length;

test('birdSVG est un svg unique et fermé', () => {
  const svg = birdSVG();
  assert.ok(svg.startsWith('<svg viewBox="0 0 72 82">'));
  assert.ok(svg.endsWith('</svg>'));
  assert.equal(countOf(svg, /<svg/g), 1);
  assert.equal(countOf(svg, /<g[ >]/g), countOf(svg, /<\/g>/g));
});

test('birdSVG expose les accroches animées par paille-en-queue.js', () => {
  const svg = birdSVG();
  assert.match(svg, /data-wings/);
  assert.match(svg, /data-tail/);
});

test('birdSVG ne porte aucun style en ligne', () => {
  assert.doesNotMatch(birdSVG(), /style=/);
});

test('geckoSVG est un svg unique et fermé, aux groupes équilibrés', () => {
  const svg = geckoSVG();
  assert.ok(svg.startsWith('<svg viewBox="0 0 90 150">'));
  assert.ok(svg.endsWith('</svg>'));
  assert.equal(countOf(svg, /<g[ >]/g), countOf(svg, /<\/g>/g));
});

test('geckoSVG expose toutes les accroches animées par margouillat.js', () => {
  const svg = geckoSVG();
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

test('geckoSVG dessine quatre pattes de trois doigts', () => {
  const svg = geckoSVG();
  assert.equal(countOf(svg, /data-leg-/g), 4);
  assert.equal(countOf(svg, /r="2\.3"/g), 12);
});

test('birdSVG ne porte aucune couleur : elles viennent du CSS', () => {
  assert.doesNotMatch(birdSVG(), /#[0-9a-f]{3,8}|fill=|stroke=/i);
});

test('geckoSVG ne porte aucune couleur ni trait : ils viennent du CSS', () => {
  assert.doesNotMatch(geckoSVG(), /#[0-9a-f]{3,8}|fill=|stroke=|opacity=/i);
});

test('geckoSVG et birdSVG exposent les classes de peinture attendues', () => {
  const gecko = geckoSVG();
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
  assert.match(birdSVG(), /class="paille-beak"/);
  assert.match(birdSVG(), /class="paille-eye"/);
});
