/* ============================================================
   assets/js/lib/animation-loop.js
   Rôle : boucle requestAnimationFrame partagée par les animations
   décoratives, avec écart de temps borné et mise en veille.
   Pages concernées : accueil.
   Accroches : aucune (le DOM n'est touché que par requestAnimationFrame).
   ============================================================ */

const MAX_FRAME_DELTA_S = 0.05;
const FIRST_FRAME_DELTA_S = 0.016;

/**
 * Écart de temps entre deux images, en secondes, borné pour éviter un saut de
 * position si l'onglet était en arrière-plan.
 * @param {number} now Horodatage de l'image courante, en millisecondes.
 * @param {number} lastTime Horodatage de l'image précédente (0 si aucune).
 * @returns {number} Écart en secondes, au plus 0,05.
 */
export function computeFrameDelta(now, lastTime) {
  const delta = lastTime ? (now - lastTime) / 1000 : FIRST_FRAME_DELTA_S;
  return Math.min(delta, MAX_FRAME_DELTA_S);
}

/**
 * Lance une boucle d'animation qui appelle `onFrame` à chaque image.
 * @param {(now: number, dt: number) => void} onFrame Mise à jour d'une image.
 * @param {() => boolean} [shouldSkip] Renvoie vrai pour suspendre les mises à jour
 *   (pause, élément hors écran) sans arrêter la boucle.
 */
export function startFrameLoop(onFrame, shouldSkip = () => false) {
  let lastTime = 0;

  function frame(now) {
    if (shouldSkip()) {
      lastTime = now;
    } else {
      onFrame(now, computeFrameDelta(now, lastTime));
      lastTime = now;
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
