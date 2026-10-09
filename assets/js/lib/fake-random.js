/* ============================================================
   assets/js/lib/fake-random.js
   Rôle : générateur pseudo-aléatoire déterministe pour les tests unitaires.
   Pages concernées : aucune (utilisé seulement par les fichiers *.test.js).
   Accroches : aucune.
   ============================================================ */

/**
 * Générateur qui rejoue en boucle une suite de valeurs fixées.
 * @param {number[]} values Valeurs dans [0, 1[ à rejouer.
 * @returns {() => number} Fonction utilisable à la place de Math.random.
 */
export function createSequence(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

/**
 * Générateur congruentiel linéaire à graine : suite stable d'une exécution à l'autre.
 * @param {number} seed Graine entière.
 * @returns {() => number} Fonction renvoyant des valeurs dans [0, 1[.
 */
export function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
