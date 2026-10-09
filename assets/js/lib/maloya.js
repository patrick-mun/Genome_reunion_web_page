/* ============================================================
   assets/js/lib/maloya.js
   Rôle : frise animée du maloya en bas de la section « Carrefour génétique » : musiciens
   autour d'un feu de bois et danseurs. Construit le SVG, puis le met à jour à chaque image
   tant que la frise est visible (seuls les attributs qui changent sont réécrits, et les
   personnages hors champ d'un écran étroit ne sont pas recalculés).
   Pages concernées : accueil.
   Accroches : .js-maloya (conteneur), [data-part] dans le SVG construit.
   Mouvement réduit : une seule image fixe. Le bouton de pause du pied de page fige la frise.
   ============================================================ */

import { startFrameLoop } from './animation-loop.js';
import { computeSceneFrame } from './maloya-scene.js';
import { buildMaloyaSvg, SCENE } from './maloya-svg.js';
import { isMotionPaused, prefersReducedMotion } from './motion.js';

const TEMPO_BPM = 96;
// Instant de départ (et image fixe en mouvement réduit) : mains levées, danseuses de côté.
const START_BEATS = 0.35;
const START_SECONDS = 1.3;
const VISIBILITY_THRESHOLD = 0.05;

function collectParts(container) {
  const parts = {};
  container.querySelectorAll('[data-part]').forEach((el) => {
    parts[el.dataset.part] = el;
  });
  return parts;
}

// Recopie une image dans les attributs, en sautant ceux qui n'ont pas changé (membres immobiles).
function createFrameWriter(parts) {
  const last = new Map();
  const write = (name, attribute, value) => {
    const key = `${name} ${attribute}`;
    if (last.get(key) === value) return;
    last.set(key, value);
    parts[name].setAttribute(attribute, value);
  };
  return (frame) => {
    for (const [name, value] of Object.entries(frame.transforms)) write(name, 'transform', value);
    for (const [name, value] of Object.entries(frame.paths)) write(name, 'd', value);
    frame.sparks.forEach((spark, i) => {
      write(`spark-${i}`, 'cx', spark.cx);
      write(`spark-${i}`, 'cy', spark.cy);
      write(`spark-${i}`, 'opacity', spark.opacity);
    });
    write('glow', 'transform', frame.glow.transform);
    write('glow', 'opacity', frame.glow.opacity);
  };
}

// Partie visible de la scène : sur un écran étroit, la frise est recadrée autour du feu
// (preserveAspectRatio « xMidYMax slice ») et les personnages des bords sont hors champ.
function measureView(container) {
  const { clientWidth: width, clientHeight: height } = container;
  if (!width || !height) return { from: 0, to: SCENE.width };
  const scale = Math.max(width / SCENE.width, height / SCENE.height);
  const half = width / scale / 2;
  return { from: SCENE.width / 2 - half, to: SCENE.width / 2 + half };
}

function trackView(container) {
  const state = { view: measureView(container) };
  const update = () => {
    state.view = measureView(container);
  };
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(container);
  else window.addEventListener('resize', update);
  return state;
}

function trackVisibility(container) {
  const state = { isVisible: true };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        state.isVisible = entry.isIntersecting;
      },
      { threshold: VISIBILITY_THRESHOLD },
    ).observe(container);
  }
  return state;
}

/**
 * Construit la frise du maloya et l'anime (image fixe en mouvement réduit).
 */
export function initMaloya() {
  const container = document.querySelector('.js-maloya');
  if (!container) return;

  // eslint-disable-next-line no-restricted-properties -- SVG construit uniquement à partir de constantes du module
  container.innerHTML = buildMaloyaSvg();
  const applyFrame = createFrameWriter(collectParts(container));
  const clock = { beats: START_BEATS, seconds: START_SECONDS };
  applyFrame(computeSceneFrame(clock.beats, clock.seconds));
  if (prefersReducedMotion()) return;

  const visibility = trackVisibility(container);
  const framing = trackView(container);
  startFrameLoop(
    (now, dt) => {
      clock.beats += (dt * TEMPO_BPM) / 60;
      clock.seconds += dt;
      applyFrame(computeSceneFrame(clock.beats, clock.seconds, framing.view));
    },
    () => !visibility.isVisible || isMotionPaused(),
  );
}
