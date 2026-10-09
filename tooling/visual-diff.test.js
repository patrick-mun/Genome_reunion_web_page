/* ============================================================
   tooling/visual-diff.test.js
   Rôle : tests de la comparaison de relevés de styles (visual-diff.js).
   Pages concernées : aucune (outil de développement).
   Accroches : aucune (lancé par node --test).
   ============================================================ */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { alignKeys, compareElements, diffStyles, isIdentical } from './visual-diff.js';

const el = (tag, label, styles = {}) => ({ tag, label, styles });

test('alignKeys aligne deux suites identiques élément par élément', () => {
  assert.deepEqual(alignKeys(['a', 'b', 'c'], ['a', 'b', 'c']), {
    pairs: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    removed: [],
    added: [],
  });
});

test('alignKeys repère un élément inséré sans décaler les suivants', () => {
  const { pairs, added, removed } = alignKeys(['ul', 'span', 'a'], ['ul', 'li', 'span', 'a']);
  assert.deepEqual(added, [1]);
  assert.deepEqual(removed, []);
  assert.deepEqual(pairs, [
    [0, 0],
    [1, 2],
    [2, 3],
  ]);
});

test('alignKeys repère un élément retiré', () => {
  const { pairs, added, removed } = alignKeys(['div', 'p', 'a'], ['div', 'a']);
  assert.deepEqual(removed, [1]);
  assert.deepEqual(added, []);
  assert.deepEqual(pairs, [
    [0, 0],
    [2, 1],
  ]);
});

test('alignKeys gère des suites vides', () => {
  assert.deepEqual(alignKeys([], ['a']), { pairs: [], removed: [], added: [0] });
  assert.deepEqual(alignKeys(['a'], []), { pairs: [], removed: [0], added: [] });
});

test('diffStyles ne garde que les propriétés modifiées, ajoutées ou retirées', () => {
  assert.deepEqual(diffStyles({ color: 'red', margin: '0px', top: '1px' }, { color: 'red', margin: '4px', left: '2px' }), [
    { property: 'margin', before: '0px', after: '4px' },
    { property: 'top', before: '1px', after: undefined },
    { property: 'left', before: undefined, after: '2px' },
  ]);
});

test('compareElements ignore un renommage de classe sans effet sur les styles', () => {
  const result = compareElements([el('LI', 'li.step', { color: 'red' })], [el('LI', 'li.methode-step', { color: 'red' })]);
  assert.ok(isIdentical(result));
});

test('compareElements signale les styles modifiés et les éléments ajoutés', () => {
  const result = compareElements(
    [el('UL', 'ul.list', { gap: '8px' }), el('SPAN', 'span.pill')],
    [el('UL', 'ul.list', { gap: '12px' }), el('LI', 'li'), el('SPAN', 'span.pill')],
  );
  assert.deepEqual(result.added, ['li']);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.changed, [
    { label: 'ul.list', diffs: [{ property: 'gap', before: '8px', after: '12px' }] },
  ]);
  assert.equal(isIdentical(result), false);
});
