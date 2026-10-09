/* ============================================================
   assets/js/lib/maloya-groove.js
   Rôle : ce qui donne du poids et de la vie aux mouvements de la frise du maloya (calcul pur).
   Le bassin passe d'un appui à l'autre au début du temps (départ et arrivée en douceur), dépasse
   un peu, revient puis tient l'appui, au lieu d'un balancier qui ne s'arrête jamais ; les
   genoux s'enfoncent à la réception ;
   le premier temps de la mesure est plus marqué ; l'amplitude enfle et retombe sur une phrase
   de huit mesures ; chaque personnage a ses petites variations et sa façon d'être en avance
   ou en retard sur le temps ; une figure marque la fin de chaque phrase de quatre mesures.
   Tout boucle sur 32 temps.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { clamp, computeSmoothstep } from './geometry.js';
import { lerp } from './maloya-limbs.js';

export const PHRASE_BEATS = 32;
// Style d'un personnage : avance ou retard sur le temps (en temps), ampleur, phase propre.
export const DEFAULT_STYLE = { timing: 0, amp: 1, seed: 0 };
const SHIFT_SHARE = 0.55; // part du temps consacrée au transfert d'appui ; le reste est tenu
const OVERSHOOT = 0.05; // le bassin dépasse l'appui de 5 % de sa course… (voir MAX_SHIFT)
const SETTLE_BEATS = 0.25; // … et y revient en un quart de temps
const DOWNBEAT_ACCENT = 0.18;
const PHRASE_SWELL = 0.12;
// Plus grand écart du bassin (premier temps, haut de la phrase, dépassement compris) : pour
// ramener un transfert d'appui entre -1 et 1 sans l'écrêter.
export const MAX_SHIFT = (1 + DOWNBEAT_ACCENT) * (1 + PHRASE_SWELL) * 1.05;
const RISE_IN_TRANSFER = 0.3; // on se grandit un peu pendant le transfert, avant de s'enfoncer
// Figure de fin de phrase : toutes les quatre mesures, pendant deux temps de la dernière.
const FLOURISH_PERIOD = 16;
const FLOURISH_START = 12;
const FLOURISH_BEATS = 2;

/**
 * Amplitude d'un appui : plus forte sur le premier temps de la mesure, et qui enfle puis
 * retombe sur la phrase.
 * @param {number} step Numéro du temps (entier).
 * @param {number} seed Phase propre au personnage.
 * @returns {number} Facteur d'amplitude, autour de 1.
 */
export function computeStepAmplitude(step, seed) {
  const inMeasure = ((step % 4) + 4) % 4;
  const swell = 1 + PHRASE_SWELL * Math.sin((2 * Math.PI * step) / PHRASE_BEATS + seed);
  return (inMeasure === 0 ? 1 + DOWNBEAT_ACCENT : 1) * swell;
}

/**
 * Transfert d'appui : position latérale du bassin, positive sur le pied droit (temps pairs),
 * négative sur le pied gauche (temps impairs), multipliée par l'amplitude de l'appui. Le
 * transfert part et arrive sans à-coup (vitesse nulle), dépasse un peu l'appui, y revient, puis
 * le bassin tient l'appui jusqu'au temps suivant.
 * @param {number} beats Temps musical, en temps.
 * @param {number} seed Phase propre au personnage.
 * @returns {number} Position, autour de -1 à 1.
 */
export function computeWeightShift(beats, seed) {
  const step = Math.floor(beats);
  const u = beats - step;
  const side = (k) => (((k % 2) + 2) % 2 === 0 ? 1 : -1) * computeStepAmplitude(k, seed);
  const from = side(step - 1);
  const to = side(step);
  if (u < SHIFT_SHARE) {
    return lerp(from, to, (1 + OVERSHOOT) * computeSmoothstep(u / SHIFT_SHARE));
  }
  const settle = computeSmoothstep(clamp((u - SHIFT_SHARE) / SETTLE_BEATS, 0, 1));
  return to + OVERSHOOT * (to - from) * (1 - settle);
}

/**
 * Flexion des genoux sur un temps : on se grandit un peu pendant le transfert, puis on
 * s'enfonce dans l'appui et on remonte avant le temps suivant. Départs et arrivées sans
 * à-coup : vitesse nulle au début du temps, à la fin du transfert et à la fin du temps.
 * @param {number} beats Temps musical, en temps.
 * @returns {number} De -0,3 (grandi) à 1 (genoux les plus fléchis).
 */
export function computeKneeFlex(beats) {
  const u = beats - Math.floor(beats);
  if (u < SHIFT_SHARE) return -RISE_IN_TRANSFER * Math.sin((Math.PI * u) / SHIFT_SHARE) ** 2;
  return Math.sin((Math.PI * (u - SHIFT_SHARE)) / (1 - SHIFT_SHARE)) ** 2;
}

/**
 * Flexion du corps sur les temps (genoux des danseurs, buste des musiciens), plus marquée sur
 * le premier temps de la mesure et selon la phrase.
 * @param {number} beats Temps musical, en temps.
 * @param {number} seed Phase propre au personnage.
 * @param {number} [lead] Avance, en temps : 0 pour s'enfoncer après la prise d'appui (danse),
 *   0,72 pour plonger au moment de la frappe (le plus bas juste sur le temps).
 * @returns {number} De -0,4 environ (grandi) à 1,4 environ (le plus fléchi).
 */
export function computeGroovePulse(beats, seed, lead = 0) {
  const x = beats + lead;
  return computeKneeFlex(x) * computeStepAmplitude(Math.floor(x), seed);
}

/**
 * Figure de fin de phrase (tourbillon de jupe, plongée du danseur) : toutes les quatre
 * mesures, pendant deux temps.
 * @param {number} beats Temps musical, en temps.
 * @returns {{progress: number, strength: number}} Avancement de la figure (0 à 1, départ et
 *   arrivée en douceur) et intensité (0 hors figure, 1 au milieu, sans à-coup).
 */
export function computeFlourish(beats) {
  const inCycle = ((beats % FLOURISH_PERIOD) + FLOURISH_PERIOD) % FLOURISH_PERIOD;
  const t = clamp((inCycle - FLOURISH_START) / FLOURISH_BEATS, 0, 1);
  return { progress: computeSmoothstep(t), strength: Math.sin(Math.PI * t) ** 2 };
}

/**
 * Variation douce et lente, propre à un personnage, qui boucle sur la phrase de 32 temps.
 * @param {number} beats Temps musical, en temps.
 * @param {number} seed Phase propre au personnage.
 * @returns {number} Valeur dans [-1, 1].
 */
export function computeLoopNoise(beats, seed) {
  const t = (2 * Math.PI * beats) / PHRASE_BEATS;
  return (
    0.5 * Math.sin(3 * t + seed) +
    0.3 * Math.sin(5 * t + 1.7 * seed) +
    0.2 * Math.sin(11 * t + 2.3 * seed)
  );
}
