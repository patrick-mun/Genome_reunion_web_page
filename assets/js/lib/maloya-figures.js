/* ============================================================
   assets/js/lib/maloya-figures.js
   Rôle : dessin SVG des personnages et des instruments de la frise du maloya (chaînes
   construites à partir de constantes, sans couleur). Les corps (buste, bras, jambes et leurs
   vêtements) sont des tracés vides [data-part="<id>-<partie>"] dont le contour est recalculé à
   chaque image (maloya-bodies.js) ; la tête, les mains, les pieds et les instruments sont des
   groupes [data-part] dessinés autour de leur pivot (0, 0), qui ne font que bouger et tourner.
   Pages concernées : accueil.
   Accroches : [data-part] (parties animées, retrouvées par maloya.js). Les couleurs viennent
   des classes maloya-* de pages/home/maloya.css.
   ============================================================ */

const path = (cls, d) => `<path class="${cls}" d="${d}" />`;
// Membre éloigné : même forme, recouverte d'un voile sombre translucide.
const shaded = (cls, d, isFar) => path(cls, d) + (isFar ? path('maloya-shade', d) : '');
const group = (id, part, inner) => `<g data-part="${id}-${part}">${inner}</g>`;
// Partie dont le contour est recalculé à chaque image ; voilée elle aussi si elle est éloignée.
const body = (id, part, cls) => `<path class="${cls}" data-part="${id}-${part}" d="" />`;
const shadedBody = (id, part, cls, isFar) =>
  body(id, part, cls) + (isFar ? body(id, `${part}-shade`, 'maloya-shade') : '');

/* ── PERSONNAGES DE PROFIL ──
   Musiciens assis (roulèr, sati, pikèr) ou debout (bobre, kayamb), tournés vers +x : chemise,
   puis bassin en tissu du pantalon par-dessus (chemise rentrée), tête, membres.
*/

const PROFILE_HEAD =
  'M-1,-5 C-7,-5 -8.5,-11 -8,-15 C-7.5,-21 -3,-24 1,-24 C5.5,-24 8,-21 8.4,-16.5 L10,-13.5 L8.6,-12.8 C8.8,-10 8.4,-7.5 6.5,-6 C4.5,-4.6 2,-4.8 -1,-5 Z';
const NECK = 'M-3,1 L-2.8,-5 L3.2,-5 L3.4,1 Z';
const PROFILE_HEADWEAR = {
  hat: [
    path('maloya-hat', 'M-6.5,-20 C-7,-26 -4,-28.5 1,-28.5 C6,-28.5 8.5,-26 8,-20 Z'),
    path('maloya-hat-band', 'M-6.7,-22.4 L8.2,-22.4 L8.1,-20.2 L-6.6,-20.2 Z'),
    '<ellipse class="maloya-hat" cx="1" cy="-19.8" rx="13.5" ry="2.1" />',
  ].join(''),
  hair: path(
    'maloya-hair',
    'M-8.2,-14 C-8.6,-21 -3.5,-24.8 1,-24.6 C5.6,-24.4 8.2,-21.6 8.3,-18 C5,-19.6 1,-19 -1.6,-17.4 C-3,-13.6 -5,-10.8 -7.6,-10 Z',
  ),
  bandana:
    path(
      'maloya-bandana',
      'M-8.3,-15 C-8.4,-21.5 -3.4,-25 1.4,-24.8 C6,-24.6 8.5,-21.6 8.5,-18 L-8.3,-14.6 Z',
    ) + path('maloya-bandana', 'M-7.6,-17.5 L-13.5,-14.5 L-12.2,-12.4 L-7.4,-15 Z'),
};
const PROFILE_HAND =
  'M-2.6,-0.5 C-3.6,3 -3.4,6.5 -1.4,8.4 C0.6,9.6 2.8,8.2 3,5.6 C3.2,3.2 2.9,1.2 2.4,-0.5 Z';
const PROFILE_FOOT =
  'M-3.2,-2 C-4.6,1 -3.6,4 -1,4 L11.5,4 C13.6,4 13.8,1.6 12,0.6 C9,-0.8 3,-1.6 -3.2,-2 Z';
// Baguette tenue dans le poing, vers l'avant de la main.
const STICK = path('maloya-stick', 'M-0.5,5 L13,9');
// Bobre : courte baguette et kaskavel (petit hochet de vannerie) dans la même main.
const BOBRE_STICK =
  path('maloya-stick', 'M-0.5,5 L8,2.5') +
  '<ellipse class="maloya-straw" cx="-2.6" cy="5" rx="2.6" ry="1.8" />';

function buildProfileArm(id, side, handExtra) {
  const isFar = side === 'far';
  return [
    shadedBody(id, `${side}-arm`, 'maloya-skin', isFar),
    shadedBody(id, `${side}-sleeve`, 'maloya-shirt', isFar),
    group(id, `${side}-hand`, handExtra + shaded('maloya-skin', PROFILE_HAND, isFar)),
  ].join('');
}

function buildProfileLeg(id, side) {
  const isFar = side === 'far';
  return [
    shadedBody(id, `${side}-leg`, 'maloya-skin', isFar),
    shadedBody(id, `${side}-trouser`, 'maloya-trousers', isFar),
    group(id, `${side}-foot`, shaded('maloya-skin', PROFILE_FOOT, isFar)),
  ].join('');
}

/* ── INSTRUMENTS ──
   Dans le repère du personnage (roulèr, sati, pikèr, tabouret) ou dans celui du buste qui
   les tient (bobre, kayamb : groupe <id>-instrument).
*/

const ROULER_DRUM = [
  path('maloya-wood', 'M-40,-34 Q-4,-42 32,-34 L32,-3 Q-4,1.5 -40,-3 Z'),
  path('maloya-band', 'M-30,-37 Q-31.8,-19 -30,-1.4 M21,-37.4 Q22.8,-19 21,-1'),
  '<ellipse class="maloya-drum-skin" cx="32" cy="-18.5" rx="5" ry="15.5" />',
  '<ellipse class="maloya-band" cx="32" cy="-18.5" rx="5" ry="15.5" />',
].join('');
const STOOL =
  path('maloya-wood', 'M-15,-24.5 L7,-24.5 L7,-21.5 L-15,-21.5 Z') +
  path('maloya-band maloya-band-thick', 'M-12,-22 L-13.5,0 M4,-22 L5.5,0');
const SATI_PLATE =
  path('maloya-metal', 'M7,-38.5 L33,-36.5 L32.4,-33.6 L6.4,-35.6 Z') +
  path('maloya-metal-light', 'M9,-37.6 L30,-36 L29.8,-35.2 L8.8,-36.8 Z');
const PIKER_BAMBOO = [
  path(
    'maloya-band maloya-band-thick',
    'M29,0 L29,-12 M25,-17 L29,-12 L33,-17 M66,0 L66,-12 M62,-17 L66,-12 L70,-17',
  ),
  path(
    'maloya-bamboo',
    'M24,-20.5 L74,-20.5 A3.5,3.5 0 0 1 74,-13.5 L24,-13.5 A3.5,3.5 0 0 1 24,-20.5 Z',
  ),
  path('maloya-bamboo-node', 'M37,-20.5 L37,-13.5 M51,-20.5 L51,-13.5 M64,-20.5 L64,-13.5'),
].join('');
const BOBRE_BOW = [
  path('maloya-bow', 'M9,5 Q38,-30 33,-74'),
  path('maloya-string', 'M9,5 L33,-74'),
  '<circle class="maloya-gourd" cx="12" cy="-11" r="7" />',
  '<ellipse class="maloya-gourd-mouth" cx="7" cy="-11" rx="1.6" ry="4" />',
].join('');
const KAYAMB = [
  '<rect class="maloya-straw" x="-11" y="-7.5" width="22" height="15" rx="1" />',
  path('maloya-straw-dark', 'M-7,-7 L-7,7 M-3,-7 L-3,7 M1,-7 L1,7 M5,-7 L5,7 M9,-7 L9,7'),
  '<rect class="maloya-band" x="-11" y="-7.5" width="22" height="15" rx="1" />',
].join('');

/**
 * Musicien de profil avec son instrument, dans l'ordre de dessin propre à l'instrument.
 * @param {{id: string, instrument: string, head: string}} member Personnage de la distribution.
 * @returns {string} Contenu SVG du personnage, dans son repère (sol en y = 0).
 */
export function buildProfileFigure(member) {
  const { id, instrument } = member;
  const head = group(
    id,
    'head',
    path('maloya-skin', NECK) + path('maloya-skin', PROFILE_HEAD) + PROFILE_HEADWEAR[member.head],
  );
  const torso =
    body(id, 'torso-shirt', 'maloya-shirt') + body(id, 'torso-pelvis', 'maloya-trousers');
  const stick = instrument === 'sati' || instrument === 'piker' ? STICK : '';
  const nearArm = buildProfileArm(id, 'near', instrument === 'bobre' ? BOBRE_STICK : stick);
  const farArm = buildProfileArm(id, 'far', stick);
  const near = buildProfileLeg(id, 'near');
  const far = buildProfileLeg(id, 'far');
  const layers = {
    rouler: [far, farArm, ROULER_DRUM, torso, head, near, nearArm],
    sati: [STOOL, far, farArm, torso, head, near, SATI_PLATE, nearArm],
    piker: [STOOL, far, farArm, PIKER_BAMBOO, torso, head, near, nearArm],
    bobre: [far, farArm, torso, head, near, group(id, 'instrument', BOBRE_BOW), nearArm],
    kayamb: [far, farArm, torso, head, near, group(id, 'instrument', KAYAMB), nearArm],
  };
  const isWide = instrument === 'rouler' || instrument === 'piker';
  const shadow = `<ellipse class="maloya-shadow" cx="${instrument === 'piker' ? 22 : 0}" cy="0" rx="${isWide ? 44 : 26}" ry="4" />`;
  return shadow + layers[instrument].join('');
}

/* ── DANSEUSES ET DANSEUR ──
   Vus de face. Danseuses : corsage clair à manches courtes, jupe longue et plis (tracés
   recalculés à chaque image), foulard madras dont le motif est défini dans le groupe du
   personnage pour en hériter les teintes. Danseur : chemise claire, pantalon roulé, chapeau
   de paille.
*/

const FRONT_NECK = 'M-3,2 L-2.8,-6 L2.8,-6 L3,2 Z';
const FRONT_FACE = '<ellipse class="maloya-skin" cx="0" cy="-12.5" rx="6.7" ry="8.2" />';
const SCARF =
  'M-7.6,-12 C-8.4,-19 -5,-23.4 0,-23.4 C5,-23.4 8.4,-19 7.6,-12 C6.4,-15.6 3.6,-17.4 0,-17.4 C-3.6,-17.4 -6.4,-15.6 -7.6,-12 Z M1.5,-22.4 C3.6,-28 8.6,-28.2 8.9,-24.6 C9.1,-22 6,-21 1.5,-22.4 Z M0.6,-22.8 C-1.2,-27.4 -5.2,-27.2 -5.2,-24.5 C-5.2,-22.6 -2.2,-21.8 0.6,-22.8 Z';
const FRONT_HAND = 'M-2.2,-0.5 C-3,3 -2.4,6.6 0,7.4 C2.4,6.6 3,3 2.2,-0.5 Z';
const FOLD_COUNT = 6;
const FRONT_HAT = [
  path('maloya-hat', 'M-6.5,-17 C-7,-24 -4,-26.5 0,-26.5 C4,-26.5 7,-24 6.5,-17 Z'),
  path('maloya-hat-band', 'M-6.8,-19.6 L6.8,-19.6 L6.6,-17.4 L-6.6,-17.4 Z'),
  '<ellipse class="maloya-hat" cx="0" cy="-17" rx="13.5" ry="2.6" />',
].join('');

function buildMadrasPattern(patternId) {
  return [
    `<defs><pattern id="${patternId}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">`,
    '<rect class="maloya-madras" width="6" height="6" />',
    '<path class="maloya-madras-line" d="M0,1.8 H6 M1.8,0 V6" />',
    '<path class="maloya-madras-thread" d="M0,4.5 H6 M4.5,0 V6" />',
    '</pattern></defs>',
  ].join('');
}

function buildFrontArm(id, side, sleeveClass) {
  return [
    body(id, `${side}-arm`, 'maloya-skin'),
    body(id, `${side}-sleeve`, sleeveClass),
    group(id, `${side}-hand`, path('maloya-skin', FRONT_HAND)),
  ].join('');
}

/**
 * Danseuse vue de face ; son motif madras est défini dans son propre groupe.
 * @param {{id: string}} member Personnage de la distribution.
 * @returns {string} Contenu SVG du personnage, dans son repère (sol en y = 0).
 */
export function buildDancerFigure({ id }) {
  const patternId = `maloya-${id}-madras`;
  const foot = '<ellipse class="maloya-skin" cx="0" cy="-1.8" rx="4" ry="2.2" />';
  return [
    buildMadrasPattern(patternId),
    '<ellipse class="maloya-shadow" cx="0" cy="0" rx="32" ry="3.5" />',
    group(id, 'left-foot', foot),
    group(id, 'right-foot', foot),
    body(id, 'skirt', 'maloya-skirt'),
    Array.from({ length: FOLD_COUNT }, (_, i) => body(id, `fold-${i}`, 'maloya-skirt-fold')).join(
      '',
    ),
    body(id, 'torso', 'maloya-blouse'),
    body(id, 'sash', 'maloya-sash'),
    group(
      id,
      'head',
      path('maloya-skin', FRONT_NECK) +
        FRONT_FACE +
        `<path fill="url(#${patternId})" d="${SCARF}" />`,
    ),
    buildFrontArm(id, 'left', 'maloya-blouse'),
    buildFrontArm(id, 'right', 'maloya-blouse'),
  ].join('');
}

/**
 * Danseur vu de face.
 * @param {{id: string}} member Personnage de la distribution.
 * @returns {string} Contenu SVG du personnage, dans son repère (sol en y = 0).
 */
export function buildManFigure({ id }) {
  const leg = (side) =>
    [
      body(id, `${side}-leg`, 'maloya-skin'),
      body(id, `${side}-trouser`, 'maloya-trousers'),
      group(id, `${side}-foot`, '<ellipse class="maloya-skin" cx="0" cy="2" rx="4.4" ry="2.3" />'),
    ].join('');
  return [
    '<ellipse class="maloya-shadow" cx="0" cy="0" rx="26" ry="3.5" />',
    leg('left'),
    leg('right'),
    body(id, 'torso', 'maloya-shirt'),
    body(id, 'belt', 'maloya-trousers'),
    group(id, 'head', path('maloya-skin', FRONT_NECK) + FRONT_FACE + FRONT_HAT),
    buildFrontArm(id, 'left', 'maloya-shirt'),
    buildFrontArm(id, 'right', 'maloya-shirt'),
  ].join('');
}
