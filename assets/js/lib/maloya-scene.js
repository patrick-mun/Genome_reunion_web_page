/* ============================================================
   assets/js/lib/maloya-scene.js
   Rôle : image complète de la frise du maloya à un instant (calcul pur) : transformations des
   parties rigides de chaque personnage (tête, mains, pieds, instrument), contours de son corps
   et de ses vêtements, tracés de la jupe, des plis et des flammes, halo et étincelles. Le DOM
   n'a plus qu'à recopier ces valeurs dans les attributs.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import {
  computeDancerBodyPaths,
  computeManBodyPaths,
  computeProfileBodyPaths,
} from './maloya-bodies.js';
import { computeDancerPose } from './maloya-dancers.js';
import { computeFlames, computeGlow, computeSparks } from './maloya-fire.js';
import { formatNumber } from './maloya-limbs.js';
import { computeManPose } from './maloya-man.js';
import {
  computeBobrePose,
  computeKayambPose,
  computeSeatedPose,
  PIKER,
  ROULER,
  SATI,
} from './maloya-musicians.js';
import { CAST, formatPartTransform, SCENE } from './maloya-svg.js';

const SEATED = { rouler: ROULER, sati: SATI, piker: PIKER };
const STANDING = { bobre: computeBobrePose, kayamb: computeKayambPose };
// Demi-largeur de ce qu'anime un personnage (jupe évasée, mains, instrument), en unités.
const MEMBER_REACH = 50;
const FULL_VIEW = { from: 0, to: SCENE.width };
const BODY_PATHS = {
  seated: computeProfileBodyPaths,
  standing: computeProfileBodyPaths,
  dancer: computeDancerBodyPaths,
  man: computeManBodyPaths,
};

/**
 * Pose d'un personnage de la distribution.
 * @param {(typeof CAST)[number]} member Personnage.
 * @param {number} beats Temps musical, en temps.
 * @returns {object} Pose propre à son type (parties, et tracés pour les danseuses).
 */
export function computeMemberPose(member, beats) {
  const t = beats + (member.offset ?? 0);
  if (member.kind === 'seated') {
    return computeSeatedPose(t, SEATED[member.instrument], member.style);
  }
  if (member.kind === 'standing') return STANDING[member.instrument](t, member.style);
  if (member.kind === 'dancer') return computeDancerPose(t, member.style);
  return computeManPose(t, member.style);
}

function addMemberValues(transforms, paths, member, pose) {
  const { id } = member;
  transforms[`${id}-head`] = formatPartTransform(pose.head);
  for (const [side, arm] of Object.entries(pose.arms)) {
    transforms[`${id}-${side}-hand`] = formatPartTransform(arm.hand);
  }
  for (const [side, leg] of Object.entries(pose.legs ?? {})) {
    transforms[`${id}-${side}-foot`] = formatPartTransform(leg.foot);
  }
  for (const [side, foot] of Object.entries(pose.feet ?? {})) {
    transforms[`${id}-${side}-foot`] = formatPartTransform(foot);
  }
  if (pose.instrument) transforms[`${id}-instrument`] = formatPartTransform(pose.instrument);
  for (const [part, d] of Object.entries(BODY_PATHS[member.kind](pose))) {
    paths[`${id}-${part}`] = d;
    // Membre éloigné : le voile reprend le même contour.
    if (part.startsWith('far-')) paths[`${id}-${part}-shade`] = d;
  }
  if (pose.skirt) {
    paths[`${id}-skirt`] = pose.skirt;
    pose.folds.forEach((d, i) => {
      paths[`${id}-fold-${i}`] = d;
    });
  }
}

/**
 * Image de la frise.
 * @param {number} beats Temps musical, en temps (musiciens et danseurs).
 * @param {number} seconds Temps réel, en secondes (feu).
 * @param {{from: number, to: number}} [view] Partie visible de la scène, en abscisses : les
 *   personnages hors champ (bords recadrés sur un écran étroit) ne sont pas calculés.
 * @returns {{transforms: Record<string, string>, paths: Record<string, string>,
 *   sparks: Array<{cx: string, cy: string, opacity: string}>,
 *   glow: {transform: string, opacity: string}}} Valeurs à poser dans les attributs.
 */
export function computeSceneFrame(beats, seconds, view = FULL_VIEW) {
  const transforms = {};
  const paths = {};
  for (const member of CAST) {
    if (member.x + MEMBER_REACH < view.from || member.x - MEMBER_REACH > view.to) continue;
    addMemberValues(transforms, paths, member, computeMemberPose(member, beats));
  }

  const flames = computeFlames(seconds);
  paths['flame-outer'] = flames.outer;
  paths['flame-mid'] = flames.mid;
  paths['flame-core'] = flames.core;
  const glow = computeGlow(seconds);
  return {
    transforms,
    paths,
    sparks: computeSparks(seconds).map((s) => ({
      cx: formatNumber(s.x),
      cy: formatNumber(s.y),
      opacity: formatNumber(s.opacity),
    })),
    glow: { transform: `scale(${formatNumber(glow.scale)})`, opacity: formatNumber(glow.opacity) },
  };
}
