/* ============================================================
   assets/js/lib/maloya-svg.js
   Rôle : assemblage SVG de la frise du maloya : distribution des personnages (place, rang,
   sens), halo et feu, formatage des transformations. Les personnages et leurs instruments
   sont dessinés par maloya-figures.js.
   Pages concernées : accueil.
   Accroches : [data-part] (parties animées, retrouvées par maloya.js). Les couleurs viennent
   des classes maloya-* de pages/home/maloya.css (matières, et une palette par personnage).
   ============================================================ */

import { buildDancerFigure, buildManFigure, buildProfileFigure } from './maloya-figures.js';
import { SPARK_COUNT } from './maloya-fire.js';

export const SCENE = { width: 1080, height: 150, ground: 142 };
export const FIRE_X = 540;
const BACK_ROW = { ground: 133, scale: 0.86 };
// Classe de palette d'un personnage : préfixe suivi de son identifiant (maloya-cast-rouler…).
const CAST_CLASS_PREFIX = 'maloya-cast-';

/* ── DISTRIBUTION ──
   Dans l'ordre du dessin : le rang du fond, puis le feu, puis le rang de devant.
   facing : 1 tourné vers la droite, -1 vers la gauche ; offset : décalage du pas, en temps.
*/
export const CAST = [
  {
    id: 'piker',
    kind: 'seated',
    instrument: 'piker',
    x: 316,
    row: 'back',
    facing: 1,
    head: 'hair',
  },
  {
    id: 'sati',
    kind: 'seated',
    instrument: 'sati',
    x: 490,
    row: 'back',
    facing: 1,
    head: 'bandana',
  },
  {
    id: 'bobre',
    kind: 'standing',
    instrument: 'bobre',
    x: 602,
    row: 'back',
    facing: -1,
    head: 'hat',
  },
  {
    id: 'rouler',
    kind: 'seated',
    instrument: 'rouler',
    x: 428,
    row: 'front',
    facing: 1,
    head: 'hat',
  },
  {
    id: 'kayamb',
    kind: 'standing',
    instrument: 'kayamb',
    x: 664,
    row: 'front',
    facing: -1,
    head: 'hair',
  },
  { id: 'dancer2', kind: 'dancer', x: 248, row: 'front', offset: 5 },
  { id: 'man', kind: 'man', x: 754, row: 'front', offset: 1 },
  { id: 'dancer1', kind: 'dancer', x: 834, row: 'front', offset: 0 },
];

const formatNumber = (n) => Number(n.toFixed(2));
const path = (cls, d) => `<path class="${cls}" d="${d}" />`;

/**
 * Transformation d'une partie : déplacement à son pivot puis rotation.
 * @param {{x: number, y: number, angle: number}} part Pivot et angle, en degrés.
 * @returns {string} Valeur de l'attribut `transform`.
 */
export function formatPartTransform(part) {
  return `translate(${formatNumber(part.x)},${formatNumber(part.y)}) rotate(${formatNumber(part.angle)})`;
}

/**
 * Transformation du tour sur soi : rétrécissement horizontal autour de l'axe du danseur.
 * @param {{x: number, scaleX: number}} turn Axe du danseur et échelle horizontale.
 * @returns {string} Valeur de l'attribut `transform`.
 */
export function formatTurnTransform(turn) {
  const x = formatNumber(turn.x);
  return `translate(${x},0) scale(${formatNumber(turn.scaleX)},1) translate(${-x},0)`;
}

/* ── FEU ──
   Halo et lueur au sol (dégradés radiaux), bûches croisées, trois couches de flammes et
   étincelles. Le halo est dessiné en premier, derrière tous les personnages.
*/

function buildGlow() {
  return [
    `<g transform="translate(${FIRE_X},${SCENE.ground})">`,
    '<g data-part="glow"><ellipse fill="url(#maloya-glow)" cx="0" cy="-26" rx="150" ry="80" /></g>',
    '<ellipse fill="url(#maloya-floor)" cx="0" cy="-1" rx="110" ry="9" />',
    '</g>',
  ].join('');
}

function buildFire() {
  const sparks = Array.from(
    { length: SPARK_COUNT },
    (_, i) => `<circle class="maloya-spark" data-part="spark-${i}" cx="0" cy="0" r="1.4" />`,
  ).join('');
  return [
    `<g transform="translate(${FIRE_X},${SCENE.ground})">`,
    path('maloya-log', 'M-27,-3 L21,-11 M27,-3 L-21,-11'),
    path('maloya-log maloya-log-front', 'M-19,-2.6 L19,-2.6'),
    '<g transform="translate(0,-7)">',
    '<path class="maloya-flame-outer" data-part="flame-outer" d="" />',
    '<path class="maloya-flame-mid" data-part="flame-mid" d="" />',
    '<path class="maloya-flame-core" data-part="flame-core" d="" />',
    sparks,
    '</g>',
    '</g>',
  ].join('');
}

function buildFigure(member) {
  const row = member.row === 'back' ? BACK_ROW : { ground: SCENE.ground, scale: 1 };
  const facing = member.facing ?? 1;
  const draw = {
    seated: buildProfileFigure,
    standing: buildProfileFigure,
    dancer: buildDancerFigure,
    man: buildManFigure,
  }[member.kind];
  return [
    `<g class="${CAST_CLASS_PREFIX}${member.id}" transform="translate(${member.x},${row.ground}) scale(${facing * row.scale},${row.scale})">`,
    draw(member),
    '</g>',
  ].join('');
}

/**
 * Balisage SVG complet de la frise. Recadrée par le bas et au centre (le feu) quand la
 * frise est plus étroite que ses proportions : les personnages des bords sortent du cadre.
 * @returns {string} Élément `<svg>` sérialisé.
 */
export function buildMaloyaSvg() {
  const figures = (isBack) => CAST.filter((m) => (m.row === 'back') === isBack).map(buildFigure);
  return [
    `<svg class="maloya-scene" viewBox="0 0 ${SCENE.width} ${SCENE.height}" preserveAspectRatio="xMidYMax slice">`,
    '<defs>',
    '<radialGradient id="maloya-glow"><stop offset="0" class="maloya-glow-in" /><stop offset="1" class="maloya-glow-out" /></radialGradient>',
    '<radialGradient id="maloya-floor"><stop offset="0" class="maloya-floor-in" /><stop offset="1" class="maloya-glow-out" /></radialGradient>',
    '</defs>',
    buildGlow(),
    ...figures(true),
    buildFire(),
    ...figures(false),
    '</svg>',
  ].join('');
}
