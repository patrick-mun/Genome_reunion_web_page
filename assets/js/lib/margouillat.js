/* ============================================================
   assets/js/lib/margouillat.js
   Rôle : margouillat des sections, gecko cartoon qui se promène au hasard en fond de page.
   Pages concernées : accueil.
   Accroches : .js-hero, .js-gecko-layer (couche créée par ce module). Position via --x, --y, --angle.
   ============================================================ */

import { startFrameLoop } from './animation-loop.js';
import { clamp } from './geometry.js';
import { createGecko, GECKO_VIEWBOX, stepGecko } from './gecko-motion.js';
import { computeGeckoPose } from './gecko-pose.js';
import { buildGeckoSvg } from './gecko-svg.js';
import { isMotionPaused, prefersReducedMotion } from './motion.js';
import { placeElement } from './placement.js';

/* Le gecko passe sous les cartes et les textes. Le placement en profondeur repose
   sur pages/home.css : la couche .gecko-layer est à z-index 1 (au-dessus des
   fonds de section, statiques) et les contenus sont remontés à z-index 2.
   Le hero reste le territoire des paille-en-queue : le margouillat ne monte
   jamais au-dessus du bas du hero. */

const SCALE = 0.55;
const MIN_VIEWPORT_WIDTH_PX = 760;

/* Zone de promenade en coordonnées document : toute la page sauf le hero
   (marge de 60 px sous sa limite). Recalculée à chaque usage pour suivre les
   changements de hauteur de page. */
function walkBounds(hero) {
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.scrollHeight;
  const heroBottom = hero.offsetTop + hero.offsetHeight;
  return {
    minX: 36,
    maxX: Math.max(140, width - 36),
    minY: heroBottom + 60,
    maxY: Math.max(heroBottom + 180, height - 56),
  };
}

function createLayer() {
  document.querySelectorAll('.js-gecko-layer').forEach((oldLayer) => oldLayer.remove());
  const layer = document.createElement('div');
  layer.className = 'gecko-layer js-gecko-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  return layer;
}

/**
 * Crée l'élément du margouillat dans la couche et retrouve ses parties animées.
 * @param {HTMLElement} layer Couche pleine page qui reçoit le margouillat.
 * @param {number} width Largeur du SVG, en pixels.
 * @param {number} height Hauteur du SVG, en pixels.
 * @returns {{el: HTMLElement, sway: Element, tailDark: Element, tailGreen: Element, head: Element,
 *   legFL: Element, legFR: Element, legBL: Element, legBR: Element}} Élément et parties animées.
 */
function createGeckoElement(layer, width, height) {
  const el = document.createElement('div');
  el.className = 'gecko';
  // eslint-disable-next-line no-restricted-properties -- SVG construit uniquement à partir de constantes du module
  el.innerHTML = buildGeckoSvg();
  layer.appendChild(el);

  const svg = el.firstElementChild;
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  return {
    el,
    sway: el.querySelector('[data-sway]'),
    tailDark: el.querySelector('[data-tail-dark]'),
    tailGreen: el.querySelector('[data-tail-green]'),
    head: el.querySelector('[data-head]'),
    legFL: el.querySelector('[data-leg-fl]'),
    legFR: el.querySelector('[data-leg-fr]'),
    legBL: el.querySelector('[data-leg-bl]'),
    legBR: el.querySelector('[data-leg-br]'),
  };
}

function formatRotation(degrees, cx, cy) {
  return `rotate(${degrees.toFixed(2)} ${cx} ${cy})`;
}

function applyPose(parts, pose) {
  parts.legFL.setAttribute('transform', formatRotation(pose.legSwing, 34, 42));
  parts.legFR.setAttribute('transform', formatRotation(-pose.legSwing, 56, 42));
  parts.legBL.setAttribute('transform', formatRotation(-pose.legSwing, 36, 72));
  parts.legBR.setAttribute('transform', formatRotation(pose.legSwing, 54, 72));
  parts.sway.setAttribute('transform', formatRotation(pose.bodySway, 45, 56));
  parts.tailDark.setAttribute('d', pose.tailOuter);
  parts.tailGreen.setAttribute('d', pose.tailInner);
  parts.head.setAttribute('transform', formatRotation(pose.headIdle, 45, 30));
}

function trackPointer() {
  const pointer = { x: -1e5, y: -1e5, hasPosition: false };
  document.addEventListener(
    'mousemove',
    (event) => {
      pointer.x = event.clientX + window.scrollX;
      pointer.y = event.clientY + window.scrollY;
      pointer.hasPosition = true;
    },
    { passive: true },
  );
  return pointer;
}

/**
 * Lance la promenade du margouillat (inactif en mouvement réduit ou sur petit écran).
 */
export function initMargouillat() {
  if (prefersReducedMotion()) return;
  if (window.innerWidth < MIN_VIEWPORT_WIDTH_PX) return;

  const hero = document.querySelector('.js-hero');
  if (!hero) return;

  const width = GECKO_VIEWBOX.width * SCALE;
  const height = GECKO_VIEWBOX.height * SCALE;
  const getBounds = () => walkBounds(hero);
  const parts = createGeckoElement(createLayer(), width, height);
  const gecko = createGecko(getBounds(), window.innerHeight, performance.now());
  const pointer = trackPointer();

  window.addEventListener('resize', () => {
    const b = getBounds();
    gecko.pos.x = clamp(gecko.pos.x, b.minX, b.maxX);
    gecko.pos.y = clamp(gecko.pos.y, b.minY, b.maxY);
    gecko.prev = { x: gecko.pos.x, y: gecko.pos.y };
  });

  startFrameLoop((now, dt) => {
    stepGecko(gecko, { now, dt, getBounds, pointer });
    applyPose(parts, computeGeckoPose(gecko, now));
    placeElement(parts.el, gecko.pos.x - width / 2, gecko.pos.y - height / 2, gecko.angle);
  }, isMotionPaused);
}
