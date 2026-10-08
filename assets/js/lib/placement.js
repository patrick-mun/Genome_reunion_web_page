/* ============================================================
   assets/js/lib/placement.js
   Rôle : positionne un élément animé par des variables CSS (JS-11).
   Pages concernées : accueil.
   Accroches : aucune (utilisé par margouillat.js et paille-en-queue.js).
   ============================================================ */

/**
 * Pose la position et l'angle d'un élément dans les variables `--x`, `--y` et
 * `--angle`, que le CSS assemble en `transform`.
 * @param {HTMLElement} el Élément à placer.
 * @param {number} x Décalage horizontal, en pixels.
 * @param {number} y Décalage vertical, en pixels.
 * @param {number} angleDeg Rotation, en degrés.
 */
export function placeElement(el, x, y, angleDeg) {
  el.style.setProperty('--x', `${x.toFixed(2)}px`);
  el.style.setProperty('--y', `${y.toFixed(2)}px`);
  el.style.setProperty('--angle', `${angleDeg.toFixed(2)}deg`);
}
