/* ============================================================
   assets/js/lib/random.js
   Rôle : tirages aléatoires avec générateur injectable (testables).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

/**
 * Tire un nombre dans l'intervalle [min, max[.
 * @param {number} min Borne basse.
 * @param {number} max Borne haute.
 * @param {() => number} [random] Générateur dans [0, 1[ (défaut : Math.random).
 * @returns {number} Valeur tirée.
 */
export function getRandomBetween(min, max, random = Math.random) {
  return min + random() * (max - min);
}

/**
 * Tire un indice entier dans [0, length[.
 * @param {number} length Nombre d'éléments possibles.
 * @param {() => number} [random] Générateur dans [0, 1[ (défaut : Math.random).
 * @returns {number} Indice tiré.
 */
export function pickRandomIndex(length, random = Math.random) {
  return Math.floor(random() * length);
}
