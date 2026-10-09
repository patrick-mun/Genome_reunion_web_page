/* ============================================================
   assets/js/lib/maloya-scene.js
   Rôle : image complète de la frise du maloya à un instant (calcul pur) : transformations des
   parties de chaque personnage, tracés recalculés (jupes, plis, flammes), halo et étincelles.
   Le DOM n'a plus qu'à recopier ces valeurs dans les attributs.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { computeDancerPose, computeManPose } from './maloya-dancers.js';
import { computeFlames, computeGlow, computeSparks } from './maloya-fire.js';
import {
  computeBobrePose,
  computeKayambPose,
  computeSeatedPose,
  PIKER,
  ROULER,
  SATI,
} from './maloya-musicians.js';
import { CAST, formatPartTransform } from './maloya-svg.js';

const SEATED = { rouler: ROULER, sati: SATI, piker: PIKER };
const STANDING = { bobre: computeBobrePose, kayamb: computeKayambPose };
const formatNumber = (n) => Number(n.toFixed(2));

/**
 * Pose d'un personnage de la distribution.
 * @param {(typeof CAST)[number]} member Personnage.
 * @param {number} beats Temps musical, en temps.
 * @returns {object} Pose propre à son type (parties, et tracés pour les danseuses).
 */
export function computeMemberPose(member, beats) {
  const t = beats + (member.offset ?? 0);
  if (member.kind === 'seated') return computeSeatedPose(t, SEATED[member.instrument]);
  if (member.kind === 'standing') return STANDING[member.instrument](t);
  if (member.kind === 'dancer') return computeDancerPose(t);
  return computeManPose(t);
}

function addLimbTransforms(transforms, id, limbs, bones) {
  for (const [side, limb] of Object.entries(limbs ?? {})) {
    for (const bone of bones) transforms[`${id}-${side}-${bone}`] = formatPartTransform(limb[bone]);
  }
}

function addMemberValues(transforms, paths, id, pose) {
  transforms[`${id}-torso`] = formatPartTransform(pose.torso);
  transforms[`${id}-head`] = formatPartTransform(pose.head);
  addLimbTransforms(transforms, id, pose.arms, ['upper', 'fore', 'hand']);
  addLimbTransforms(transforms, id, pose.legs, ['thigh', 'shin', 'foot']);
  if (pose.instrument) transforms[`${id}-instrument`] = formatPartTransform(pose.instrument);
  if (pose.feet) {
    transforms[`${id}-left-foot`] = formatPartTransform(pose.feet.left);
    transforms[`${id}-right-foot`] = formatPartTransform(pose.feet.right);
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
 * @returns {{transforms: Record<string, string>, paths: Record<string, string>,
 *   sparks: Array<{cx: number, cy: number, opacity: number}>,
 *   glow: {transform: string, opacity: number}}} Valeurs à poser dans les attributs.
 */
export function computeSceneFrame(beats, seconds) {
  const transforms = {};
  const paths = {};
  for (const member of CAST) {
    addMemberValues(transforms, paths, member.id, computeMemberPose(member, beats));
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
