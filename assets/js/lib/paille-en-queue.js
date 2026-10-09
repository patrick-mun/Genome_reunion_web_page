/* ============================================================
   assets/js/lib/paille-en-queue.js
   Rôle : paille-en-queue du hero, vol décoratif continu sans pose sur les lettres.
   Pages concernées : accueil.
   Accroches : .js-hero, .js-bird-layer (couche créée par ce module), [data-wing-left],
   [data-wing-right] et [data-tail] dans chaque oiseau. Position via --x, --y, --angle.
   ============================================================ */

import { startFrameLoop } from './animation-loop.js';
import { advanceBird, computeBirdPose, createBird } from './bird-flight.js';
import { buildBirdSvg, formatTailTransform, formatWingTransform } from './bird-svg.js';
import { isMotionPaused, prefersReducedMotion } from './motion.js';
import { placeElement } from './placement.js';

const BIRD_COUNT = 3;
const MIN_VIEWPORT_WIDTH_PX = 760;
const VISIBILITY_THRESHOLD = 0.02;

function measureHero(hero) {
  const rect = hero.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function createLayer(hero) {
  document.querySelectorAll('.js-bird-layer').forEach((oldLayer) => oldLayer.remove());
  const layer = document.createElement('div');
  layer.className = 'bird-layer js-bird-layer';
  layer.setAttribute('aria-hidden', 'true');
  hero.appendChild(layer);
  return layer;
}

/**
 * Crée l'élément d'un oiseau dans la couche, à la taille de son état, et retrouve ses parties animées.
 * @param {HTMLElement} layer Couche qui reçoit l'oiseau.
 * @param {{cw: number, ch: number}} bird État de l'oiseau (largeur et hauteur du SVG).
 * @returns {{el: HTMLElement, leftWing: Element, rightWing: Element, tail: Element}} Élément,
 *   ailes et queue.
 */
function createBirdElement(layer, bird) {
  const el = document.createElement('div');
  el.className = 'paille';
  // eslint-disable-next-line no-restricted-properties -- SVG construit uniquement à partir de constantes du module
  el.innerHTML = buildBirdSvg();
  layer.appendChild(el);

  const svg = el.firstElementChild;
  svg.setAttribute('width', bird.cw);
  svg.setAttribute('height', bird.ch);
  return {
    el,
    leftWing: el.querySelector('[data-wing-left]'),
    rightWing: el.querySelector('[data-wing-right]'),
    tail: el.querySelector('[data-tail]'),
  };
}

function applyPose(bird, parts) {
  const pose = computeBirdPose(bird);
  parts.leftWing.setAttribute('transform', formatWingTransform('left', pose.wings.left));
  parts.rightWing.setAttribute('transform', formatWingTransform('right', pose.wings.right));
  parts.tail.setAttribute('transform', formatTailTransform(pose.tail));
  placeElement(parts.el, bird.pos.x - bird.cw / 2, bird.pos.y - bird.ch / 2, bird.angle);
}

function trackHeroVisibility(hero) {
  const state = { isVisible: true };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        state.isVisible = entry.isIntersecting;
      },
      { threshold: VISIBILITY_THRESHOLD },
    ).observe(hero);
  }
  return state;
}

/**
 * Lance le vol des paille-en-queue dans le hero (inactif en mouvement réduit ou sur petit écran).
 */
export function initPailleEnQueue() {
  if (prefersReducedMotion()) return;
  if (window.innerWidth < MIN_VIEWPORT_WIDTH_PX) return;

  const hero = document.querySelector('.js-hero');
  if (!hero) return;

  const layer = createLayer(hero);
  const t0base = performance.now();
  const birds = Array.from({ length: BIRD_COUNT }, (_, index) => {
    const bird = createBird(index, measureHero(hero));
    bird.t0base = t0base;
    const parts = createBirdElement(layer, bird);
    placeElement(parts.el, bird.pos.x - bird.cw / 2, bird.pos.y - bird.ch / 2, bird.angle);
    return { bird, parts };
  });
  const visibility = trackHeroVisibility(hero);

  startFrameLoop(
    (now, dt) => {
      const world = measureHero(hero);
      birds.forEach(({ bird, parts }) => {
        const isNewlyBorn = advanceBird(bird, now, dt, world);
        if (!bird.isBorn) return;
        if (isNewlyBorn) {
          parts.el.style.setProperty('--opacity', bird.finalOpacity);
          parts.el.classList.add('is-born');
        }
        applyPose(bird, parts);
      });
    },
    () => !visibility.isVisible || isMotionPaused(),
  );
}
