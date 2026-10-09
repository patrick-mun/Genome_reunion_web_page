/* ============================================================
   assets/js/lib/maloya-rhythm.js
   Rôle : rythme du maloya de la frise (calcul pur) : frappes de chaque instrument, levée des
   mains entre deux frappes (plus haute avant une frappe forte), accent du premier temps,
   secousse du kayamb. Le temps musical
   est compté en temps (beats) : une mesure de 4 temps ternaires, soit 12 pulsations.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { clamp, computeSmoothstep } from './geometry.js';

export const PULSES_PER_BEAT = 3;
export const BEATS_PER_MEASURE = 4;
export const PULSES_PER_MEASURE = PULSES_PER_BEAT * BEATS_PER_MEASURE;

/* ── FRAPPES ──
   Pulsations frappées dans la mesure, par main (a : main proche, b : main éloignée).
   Roulèr : main A sur chaque temps, main B en levée, petit roulement avant la mesure suivante.
   Sati : baguettes alternées sur chaque pulsation. Pikèr : motif décalé. Bobre : une seule main.
*/
export const ROULER_HITS = { a: [0, 3, 6, 9], b: [2, 5, 8, 10, 11] };
export const SATI_HITS = { a: [0, 2, 4, 6, 8, 10], b: [1, 3, 5, 7, 9, 11] };
export const PIKER_HITS = { a: [0, 4, 6, 10], b: [2, 3, 8, 9] };
export const BOBRE_HITS = [0, 2, 3, 5, 6, 8, 9];

// La main remonte après la frappe, culmine aux 3/5 de l'intervalle, puis redescend vite.
const LIFT_PEAK_AT = 0.6;
const LIFT_EXPONENT = Math.log(0.5) / Math.log(LIFT_PEAK_AT);
// Un intervalle d'un temps (3 pulsations) donne la levée complète ; plus court, la main monte moins.
const FULL_LIFT_PULSES = 3;
// Force des frappes : premier temps, autres temps, contretemps.
const STRIKE_STRENGTH = { downbeat: 1, beat: 0.85, offbeat: 0.7 };
// Montée de l'accent du premier temps, en temps.
const ACCENT_RISE = 0.15;
// Près de 1 : onde presque triangulaire, retournements secs du kayamb.
const SHAKE_ROUNDING = 0.97;

/**
 * Profil de levée entre deux frappes.
 * @param {number} u Avancement entre la frappe précédente (0) et la suivante (1).
 * @returns {number} Hauteur relative : 0 aux frappes, 1 au sommet.
 */
export function computeLiftShape(u) {
  return Math.sin(Math.PI * Math.pow(u, LIFT_EXPONENT));
}

/**
 * Frappes qui encadrent une position dans la mesure, avec bouclage d'une mesure à l'autre.
 * @param {number} pulse Position en pulsations, dans [0, 12).
 * @param {number[]} hits Frappes de la main, triées, dans [0, 12).
 * @returns {{prev: number, next: number}} Frappe précédente (incluse) et suivante.
 */
export function findSurroundingHits(pulse, hits) {
  let prev = hits[hits.length - 1] - PULSES_PER_MEASURE;
  let next = hits[0] + PULSES_PER_MEASURE;
  for (const hit of hits) {
    if (hit > pulse) {
      next = hit;
      break;
    }
    prev = hit;
  }
  return { prev, next };
}

/**
 * Force d'une frappe selon sa place dans la mesure : la main monte plus haut avant une frappe
 * forte.
 * @param {number} pulse Pulsation de la frappe (prise modulo la mesure).
 * @returns {number} 1 sur le premier temps, 0,85 sur les autres temps, 0,7 en contretemps.
 */
export function computeStrikeStrength(pulse) {
  const inMeasure = ((pulse % PULSES_PER_MEASURE) + PULSES_PER_MEASURE) % PULSES_PER_MEASURE;
  if (inMeasure === 0) return STRIKE_STRENGTH.downbeat;
  return inMeasure % PULSES_PER_BEAT === 0 ? STRIKE_STRENGTH.beat : STRIKE_STRENGTH.offbeat;
}

/**
 * Coup d'une main qui frappe un instrument : hauteur de la main, réglée sur la force de la
 * frappe qui vient, sens du geste et écart de la boucle qu'elle décrit (nul sur l'instrument et
 * au sommet, le plus grand à mi-montée et à mi-descente).
 * @param {number} beats Temps musical, en temps.
 * @param {number[]} hits Frappes de la main dans la mesure.
 * @returns {{lift: number, loop: number, isRising: boolean}} Hauteur (0 : main sur
 *   l'instrument, 1 : levée complète avant le premier temps), écart de la boucle (même
 *   échelle), et vrai tant que la main monte.
 */
export function computeHandStroke(beats, hits) {
  const total = beats * PULSES_PER_BEAT;
  const pulse = ((total % PULSES_PER_MEASURE) + PULSES_PER_MEASURE) % PULSES_PER_MEASURE;
  const { prev, next } = findSurroundingHits(pulse, hits);
  const gap = next - prev;
  const u = (pulse - prev) / gap;
  const height = Math.min(1, gap / FULL_LIFT_PULSES) * computeStrikeStrength(next);
  const shape = computeLiftShape(u);
  return {
    lift: height * shape,
    loop: height * Math.sin(Math.PI * shape),
    isRising: u < LIFT_PEAK_AT,
  };
}

/**
 * Accent du premier temps de chaque mesure : montée douce en 0,15 temps, puis retombée
 * jusqu'à la fin du temps. Sans saut, pour que le hochement de tête reste souple.
 * @param {number} beats Temps musical, en temps.
 * @returns {number} De 0 à 1 : 1 juste après le premier temps, 0 sur les trois autres.
 */
export function computeDownbeatAccent(beats) {
  const inMeasure = ((beats % BEATS_PER_MEASURE) + BEATS_PER_MEASURE) % BEATS_PER_MEASURE;
  const rise = computeSmoothstep(clamp(inMeasure / ACCENT_RISE, 0, 1));
  const fall = computeSmoothstep(clamp((inMeasure - ACCENT_RISE) / (1 - ACCENT_RISE), 0, 1));
  return rise * (1 - fall);
}

/**
 * Secousse du kayamb : va-et-vient à chaque pulsation, retournements secs (c'est là que les
 * graines frappent le cadre), geste plus ample sur les temps.
 * @param {number} beats Temps musical, en temps.
 * @returns {number} Position de -1 (en arrière) à 1 (en avant).
 */
export function computeKayambShake(beats) {
  const s = Math.sin(Math.PI * beats * PULSES_PER_BEAT);
  const triangle = Math.asin(SHAKE_ROUNDING * s) / Math.asin(SHAKE_ROUNDING);
  return triangle * (0.75 + 0.25 * Math.cos(2 * Math.PI * beats));
}
