/* ============================================================
   assets/js/lib/paille-en-queue.js
   Rôle : paille-en-queue du hero, vol décoratif continu sans pose sur les lettres.
   Pages concernées : accueil.
   Accroches : .js-hero, .js-bird-layer (couche créée par ce module). Position via --x, --y, --angle.
   ============================================================ */

import { startFrameLoop } from './animation-loop.js';
import { advanceBird, birdPose, createBird } from './bird-flight.js';
import { birdSVG } from './bird-svg.js';
import { isMotionPaused, prefersReducedMotion } from './motion.js';
import { placeElement } from './placement.js';

const BIRD_COUNT = 3;
const MIN_VIEWPORT_WIDTH_PX = 760;
const VISIBILITY_THRESHOLD = 0.02;

function heroSize(hero) {
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

function createBirdElement(layer, bird) {
  const el = document.createElement('div');
  el.className = 'paille';
  // eslint-disable-next-line no-restricted-properties -- SVG construit uniquement à partir de constantes du module
  el.innerHTML = birdSVG();
  layer.appendChild(el);

  const svg = el.firstElementChild;
  svg.setAttribute('width', bird.cw);
  svg.setAttribute('height', bird.ch);
  return {
    el,
    wings: el.querySelector('[data-wings]'),
    tail: el.querySelector('[data-tail]'),
  };
}

function applyPose(bird, parts) {
  const pose = birdPose(bird);
  parts.wings.setAttribute(
    'transform',
    `translate(36,0) scale(${pose.wingSpan.toFixed(3)},1) translate(-36,0)`,
  );
  parts.tail.setAttribute('transform', `rotate(${pose.tailSway.toFixed(2)} 36 43)`);
  placeElement(parts.el, bird.pos.x - bird.cw / 2, bird.pos.y - bird.ch / 2 + pose.bob, bird.angle);
}

function trackHeroVisibility(hero) {
  const state = { visible: true };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        state.visible = entry.isIntersecting;
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
    const bird = createBird(index, heroSize(hero));
    bird.t0base = t0base;
    const parts = createBirdElement(layer, bird);
    placeElement(parts.el, bird.pos.x - bird.cw / 2, bird.pos.y - bird.ch / 2, bird.angle);
    return { bird, parts };
  });
  const visibility = trackHeroVisibility(hero);

  startFrameLoop(
    (now, dt) => {
      const world = heroSize(hero);
      birds.forEach(({ bird, parts }) => {
        const justBorn = advanceBird(bird, now, dt, world);
        if (!bird.born) return;
        if (justBorn) {
          parts.el.style.setProperty('--opacity', bird.finalOpacity);
          parts.el.classList.add('is-born');
        }
        applyPose(bird, parts);
      });
    },
    () => !visibility.visible || isMotionPaused(),
  );
}
