/* ============================================================
   tooling/visual-diff.js
   Rôle : comparaison de deux relevés de styles calculés (avant / après une modification),
   utilisée par visual-check.mjs. Logique pure, sans navigateur ni fichier.
   Pages concernées : aucune (outil de développement).
   Accroches : aucune.
   ============================================================ */

/**
 * Aligne deux suites de clés par plus longue sous-suite commune, pour retrouver les mêmes
 * éléments quand la page a gagné ou perdu des nœuds (un <li> ajouté, un <link> en plus).
 * @param {string[]} before Clés de la version de référence.
 * @param {string[]} after Clés de la version modifiée.
 * @returns {{pairs: Array<[number, number]>, removed: number[], added: number[]}} Couples
 *   d'indices alignés, indices présents seulement avant, indices présents seulement après.
 */
export function alignKeys(before, after) {
  const rows = before.length + 1;
  const cols = after.length + 1;
  const lengths = Array.from({ length: rows }, () => new Uint16Array(cols));
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      lengths[i][j] =
        before[i] === after[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }
  const result = { pairs: [], removed: [], added: [] };
  let i = 0;
  let j = 0;
  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) result.pairs.push([i++, j++]);
    else if (lengths[i + 1][j] >= lengths[i][j + 1]) result.removed.push(i++);
    else result.added.push(j++);
  }
  while (i < before.length) result.removed.push(i++);
  while (j < after.length) result.added.push(j++);
  return result;
}

/**
 * Liste les propriétés dont la valeur diffère entre deux relevés d'un même élément.
 * @param {Record<string, string>} before Styles de référence.
 * @param {Record<string, string>} after Styles modifiés.
 * @returns {Array<{property: string, before: string | undefined, after: string | undefined}>}
 */
export function diffStyles(before, after) {
  const properties = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...properties]
    .filter((property) => before[property] !== after[property])
    .map((property) => ({ property, before: before[property], after: after[property] }));
}

/**
 * Compare deux relevés d'éléments. Les éléments sont alignés par leur balise (la structure),
 * pas par leurs classes : un renommage de classe sans effet sur le rendu ne compte pas.
 * @param {Array<{tag: string, label: string, styles: Record<string, string>}>} before Référence.
 * @param {Array<{tag: string, label: string, styles: Record<string, string>}>} after Modifié.
 * @returns {{added: string[], removed: string[], changed: Array<{label: string,
 *   diffs: ReturnType<typeof diffStyles>}>}} Éléments ajoutés, retirés, et styles modifiés.
 */
export function compareElements(before, after) {
  const { pairs, removed, added } = alignKeys(
    before.map((el) => el.tag),
    after.map((el) => el.tag),
  );
  const changed = pairs
    .map(([i, j]) => ({ label: after[j].label, diffs: diffStyles(before[i].styles, after[j].styles) }))
    .filter((entry) => entry.diffs.length > 0);
  return {
    added: added.map((j) => after[j].label),
    removed: removed.map((i) => before[i].label),
    changed,
  };
}

/**
 * Indique si une comparaison ne relève aucun écart.
 * @param {ReturnType<typeof compareElements>} comparison Résultat de compareElements.
 * @returns {boolean} Vrai si rien n'a été ajouté, retiré ou modifié.
 */
export function isIdentical(comparison) {
  return (
    comparison.added.length === 0 &&
    comparison.removed.length === 0 &&
    comparison.changed.length === 0
  );
}
