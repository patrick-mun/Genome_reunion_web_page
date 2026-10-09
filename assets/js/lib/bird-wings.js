/* ============================================================
   assets/js/lib/bird-wings.js
   Rôle : battement d'ailes des paille-en-queue (calcul pur, sans DOM) : séries de battements
   et glissades ailes tendues, envergure apparente de chaque aile vue du dessous.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur ; le DOM est dans paille-en-queue.js).
   ============================================================ */

import { clamp, computeSmoothstep } from './geometry.js';
import { getRandomBetween } from './random.js';

/* ── COURSE DE L'AILE ──
   Angle de l'aile au-dessus de l'horizontale pendant un battement. L'abaissement (temps moteur)
   dure plus longtemps que la remontée, pendant laquelle le poignet se replie un peu.
*/

const DOWNSTROKE_SHARE = 0.58; // part du cycle consacrée à l'abaissement
const ELEVATION_UP_DEG = 48;
const ELEVATION_DOWN_DEG = -26;
const ELEVATION_GLIDE_DEG = 5; // léger dièdre, ailes tendues
const SWEEP_DEG = 5; // balayage vers l'avant à l'abaissement, vers l'arrière à la remontée
const SWEEP_GLIDE_DEG = -2;
const UPSTROKE_FOLD = 0.12; // raccourcissement apparent, poignet replié en milieu de remontée
// Aile relevée et oiseau incliné s'additionnent : au-delà de 60°, l'aile vue du dessous
// deviendrait un trait (moins de la moitié de sa longueur), ce qui se lit mal à cette taille.
const MAX_APPARENT_ANGLE_DEG = 60;
// En plein battement, la course de l'aile domine : l'inclinaison n'y compte que pour 40 %,
// sinon une aile paraîtrait minuscule à chaque haut de course dans les virages.
const BANK_FLAP_DAMPING = 0.6;

/**
 * Position de l'aile à un instant du battement.
 * @param {number} cycle Avancement dans le battement, entre 0 (aile en haut) et 1.
 * @returns {{elevation: number, sweep: number, fold: number}} Angle au-dessus de
 *   l'horizontale (degrés), balayage vers l'avant (degrés) et repli du poignet (0 à 1).
 */
export function computeStroke(cycle) {
  const c = cycle - Math.floor(cycle);
  // Le temps est déformé pour que l'abaissement occupe DOWNSTROKE_SHARE du cycle ;
  // aux deux extrémités de la course, la vitesse de l'aile est nulle : pas de cassure.
  const u =
    c < DOWNSTROKE_SHARE
      ? (0.5 * c) / DOWNSTROKE_SHARE
      : 0.5 + (0.5 * (c - DOWNSTROKE_SHARE)) / (1 - DOWNSTROKE_SHARE);
  const middle = (ELEVATION_UP_DEG + ELEVATION_DOWN_DEG) / 2;
  const amplitude = (ELEVATION_UP_DEG - ELEVATION_DOWN_DEG) / 2;
  return {
    elevation: middle + amplitude * Math.cos(2 * Math.PI * u),
    sweep: SWEEP_DEG * Math.sin(2 * Math.PI * u),
    fold: Math.max(0, -Math.sin(2 * Math.PI * u)),
  };
}

/* ── BATTEMENTS ET GLISSADES ──
   Une série de battements, puis une glissade ailes tendues. L'amplitude (enveloppe) s'ouvre et se
   referme progressivement : le passage de l'un à l'autre ne saute jamais.
*/

const FLAP_HZ = { min: 2.6, max: 3.1 };
const BURST_BEATS = { min: 4, max: 9 };
const GLIDE_S = { min: 0.6, max: 1.4 };
const ENVELOPE_RATE_PER_S = 3.2; // ouverture ou fermeture complète en un peu plus de 0,3 s

/**
 * Crée l'état des ailes d'un oiseau, en plein battement.
 * @param {() => number} [random] Générateur dans [0, 1[.
 * @returns {{isFlapping: boolean, cycle: number, frequency: number, beatsLeft: number,
 *   glideLeft: number, envelope: number}} État des ailes (fréquence en battements par seconde).
 */
export function createWings(random = Math.random) {
  return {
    isFlapping: true,
    cycle: random(),
    frequency: getRandomBetween(FLAP_HZ.min, FLAP_HZ.max, random),
    beatsLeft: Math.round(getRandomBetween(BURST_BEATS.min, BURST_BEATS.max, random)),
    glideLeft: 0,
    envelope: 1,
  };
}

/**
 * Lance une nouvelle série de battements, en commençant aile en haut. L'amplitude repart de
 * son niveau courant : si elle était nulle (glissade), l'aile quitte la position tendue en douceur.
 * @param {object} wings État des ailes, modifié sur place.
 * @param {() => number} [random] Générateur dans [0, 1[.
 */
export function startFlapping(wings, random = Math.random) {
  if (wings.isFlapping) return;
  wings.isFlapping = true;
  wings.cycle = 0;
  wings.frequency = getRandomBetween(FLAP_HZ.min, FLAP_HZ.max, random);
  wings.beatsLeft = Math.round(getRandomBetween(BURST_BEATS.min, BURST_BEATS.max, random));
}

/**
 * Fait avancer les ailes d'une image : battement, fin de série, glissade, reprise.
 * @param {object} wings État des ailes, modifié sur place.
 * @param {number} dt Écart depuis l'image précédente, en secondes.
 * @param {() => number} [random] Générateur dans [0, 1[.
 */
export function advanceWings(wings, dt, random = Math.random) {
  const step = ENVELOPE_RATE_PER_S * dt;
  if (wings.isFlapping) {
    wings.envelope = Math.min(1, wings.envelope + step);
    wings.cycle += wings.frequency * dt;
    if (wings.cycle >= 1) {
      wings.cycle -= 1;
      wings.beatsLeft -= 1;
      if (wings.beatsLeft <= 0) {
        wings.isFlapping = false;
        wings.glideLeft = getRandomBetween(GLIDE_S.min, GLIDE_S.max, random);
      }
    }
    return;
  }
  wings.envelope = Math.max(0, wings.envelope - step);
  wings.cycle += wings.frequency * dt;
  wings.glideLeft -= dt;
  if (wings.glideLeft <= 0 && wings.envelope === 0) startFlapping(wings, random);
}

/**
 * Part de la poussée des ailes, pour la vitesse de l'oiseau.
 * @param {{envelope: number}} wings État des ailes.
 * @returns {number} 1 en plein battement, 0 en glissade.
 */
export function computeThrust(wings) {
  return computeSmoothstep(wings.envelope);
}

/* ── ENVERGURE APPARENTE ──
   Vue du dessous, une aile paraît d'autant plus courte qu'elle s'écarte de l'horizontale.
   En virage, l'oiseau s'incline : l'aile extérieure se relève, l'aile intérieure s'abaisse.
*/

/**
 * Envergure apparente et balayage de chaque aile.
 * @param {{cycle: number, envelope: number}} wings État des ailes.
 * @param {number} bankDeg Inclinaison en degrés, positive quand l'oiseau tourne vers sa droite.
 * @returns {{left: {span: number, sweep: number}, right: {span: number, sweep: number}}}
 *   Envergure apparente (1 : aile entière) et balayage vers l'avant (degrés) de chaque aile.
 */
export function computeWingPose(wings, bankDeg) {
  const amount = computeSmoothstep(clamp(wings.envelope, 0, 1));
  const stroke = computeStroke(wings.cycle);
  const elevation = ELEVATION_GLIDE_DEG + amount * (stroke.elevation - ELEVATION_GLIDE_DEG);
  const sweep = SWEEP_GLIDE_DEG + amount * (stroke.sweep - SWEEP_GLIDE_DEG);
  const fold = 1 - UPSTROKE_FOLD * amount * stroke.fold;
  const bank = bankDeg * (1 - BANK_FLAP_DAMPING * amount);
  const spanAt = (angleDeg) => {
    const angle = clamp(angleDeg, -MAX_APPARENT_ANGLE_DEG, MAX_APPARENT_ANGLE_DEG);
    return Math.cos((angle * Math.PI) / 180) * fold;
  };
  return {
    left: { span: spanAt(elevation + bank), sweep },
    right: { span: spanAt(elevation - bank), sweep },
  };
}
