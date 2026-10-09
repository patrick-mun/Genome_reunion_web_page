/* ============================================================
   assets/js/lib/maloya-bodies.js
   Rôle : habillage des corps de la frise du maloya (calcul pur) : contours continus de la peau
   et des vêtements autour des chaînes de points des poses (maloya-outlines.js). Musiciens de
   profil : chemise rentrée dans un pantalon qui couvre le bassin et les fesses, manches
   roulées sous le coude, pantalon roulé à mi-mollet. Danseuses : corsage à manches courtes,
   ceinture d'étoffe. Danseur : chemise à manches roulées, ceinture, pantalon roulé.
   Largeurs en demi-largeurs, en unités du dessin (70 unités ≈ 1 m).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur).
   ============================================================ */

import { buildBandOutline, buildChainOutline } from './maloya-outlines.js';

// Demi-largeurs à chaque point d'une chaîne : un nombre (symétrique) ou [côté 0, côté 1].
const halves = (...values) => values.map((v) => (Array.isArray(v) ? v : [v, v]));

/* Musiciens de profil. Colonne : hanche, taille, poitrine, haut des épaules ; côté 0 : avant. */
const PROFILE = {
  arm: halves(3.2, 2.8, 2.3),
  sleeve: halves(3.75, 3.35, 3.05),
  sleeveEnd: 0.66, // manche roulée juste sous le coude
  leg: halves(5, 4.2, 3.1),
  trouser: halves(5.8, 4.8, 4.4),
  trouserEnd: 0.76, // pantalon roulé à mi-mollet
  shirt: halves([9, 9.4], [9.3, 9.9], [9.2, 9.6], [7.4, 7.6]),
  shirtStart: 0.2, // le bas de la chemise est rentré dans le pantalon
  pelvis: halves([9.8, 11.2], [9.5, 10.2], [9.2, 9.6], [7.4, 7.6]),
  pelvisEnd: 0.3,
};

/* Danseuses et danseur, de face : buste par niveaux (taille, poitrine, épaules). */
const DANCER = {
  arm: halves(3.1, 2.6, 2),
  sleeve: halves(4.3, 3.8, 3.4),
  sleeveEnd: 0.17,
  sash: { below: 2.2, above: 1.6, halves: [9.2, 8.9] },
};
const MAN = {
  arm: halves(3.1, 2.7, 2.2),
  sleeve: halves(3.6, 3.2, 2.9),
  sleeveEnd: 0.6,
  leg: halves(4.8, 4, 3),
  trouser: halves(5.5, 4.6, 4.3),
  trouserEnd: 0.76,
  belt: { below: 2.6, above: 0.8, halves: [9.4, 9.2] },
};
const SHOULDER_CAP = 0.15; // ligne d'épaules à peine bombée

// Contours d'une chaîne figée (membre immobile) : calculés une fois, puis réutilisés.
const frozenLimbs = new WeakMap();

function buildLimb(chain, skin, cloth, clothEnd) {
  if (frozenLimbs.has(chain)) return frozenLimbs.get(chain);
  const limb = {
    skin: buildChainOutline(chain, skin),
    cloth: buildChainOutline(chain, cloth, { to: clothEnd, end: 'flat' }),
  };
  if (Object.isFrozen(chain)) frozenLimbs.set(chain, limb);
  return limb;
}

// Bande à la taille (ceinture), parallèle à la ligne de taille.
function buildWaistBand(waistLevel, band) {
  const { center, normal } = waistLevel;
  // Vers le bas du corps : le côté 0 (vers +x) tourné d'un quart de tour.
  const down = { x: -normal.y, y: normal.x };
  const level = (dy, half) => ({
    center: { x: center.x + down.x * dy, y: center.y + down.y * dy },
    half: [half, half],
    normal,
  });
  return buildBandOutline([level(band.below, band.halves[0]), level(-band.above, band.halves[1])], {
    start: 'flat',
    end: 'flat',
  });
}

/**
 * Contours d'un musicien de profil.
 * @param {object} pose Pose (spine, arms.near/far.chain, legs.near/far.chain).
 * @returns {Record<string, string>} Attributs `d`, par partie (torso-shirt, near-arm…).
 */
export function computeProfileBodyPaths(pose) {
  const paths = {
    'torso-shirt': buildChainOutline(pose.spine, PROFILE.shirt, {
      from: PROFILE.shirtStart,
      start: 'flat',
      end: 0.7,
    }),
    'torso-pelvis': buildChainOutline(pose.spine, PROFILE.pelvis, {
      to: PROFILE.pelvisEnd,
      end: 'flat',
    }),
  };
  for (const side of ['near', 'far']) {
    const arm = buildLimb(pose.arms[side].chain, PROFILE.arm, PROFILE.sleeve, PROFILE.sleeveEnd);
    const leg = buildLimb(pose.legs[side].chain, PROFILE.leg, PROFILE.trouser, PROFILE.trouserEnd);
    paths[`${side}-arm`] = arm.skin;
    paths[`${side}-sleeve`] = arm.cloth;
    paths[`${side}-leg`] = leg.skin;
    paths[`${side}-trouser`] = leg.cloth;
  }
  return paths;
}

/**
 * Contours d'une danseuse.
 * @param {object} pose Pose (trunk, arms.left/right.chain).
 * @returns {Record<string, string>} Attributs `d`, par partie (torso, sash, left-arm…).
 */
export function computeDancerBodyPaths(pose) {
  const paths = {
    torso: buildBandOutline(pose.trunk, { start: 'flat', end: SHOULDER_CAP }),
    sash: buildWaistBand(pose.trunk[0], DANCER.sash),
  };
  for (const side of ['left', 'right']) {
    const arm = buildLimb(pose.arms[side].chain, DANCER.arm, DANCER.sleeve, DANCER.sleeveEnd);
    paths[`${side}-arm`] = arm.skin;
    paths[`${side}-sleeve`] = arm.cloth;
  }
  return paths;
}

/**
 * Contours du danseur.
 * @param {object} pose Pose (trunk, arms et legs left/right.chain).
 * @returns {Record<string, string>} Attributs `d`, par partie (torso, belt, left-arm…).
 */
export function computeManBodyPaths(pose) {
  const paths = {
    torso: buildBandOutline(pose.trunk, { start: 'flat', end: SHOULDER_CAP }),
    belt: buildWaistBand(pose.trunk[0], MAN.belt),
  };
  for (const side of ['left', 'right']) {
    const arm = buildLimb(pose.arms[side].chain, MAN.arm, MAN.sleeve, MAN.sleeveEnd);
    const leg = buildLimb(pose.legs[side].chain, MAN.leg, MAN.trouser, MAN.trouserEnd);
    paths[`${side}-arm`] = arm.skin;
    paths[`${side}-sleeve`] = arm.cloth;
    paths[`${side}-leg`] = leg.skin;
    paths[`${side}-trouser`] = leg.cloth;
  }
  return paths;
}
