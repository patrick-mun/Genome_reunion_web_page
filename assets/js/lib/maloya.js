/* ============================================================
   assets/js/lib/maloya.js
   Rôle : frise animée du maloya en bas de la section « Carrefour génétique » : musiciens
   autour d'un feu de bois et danseurs. Construit le SVG, puis le met à jour à chaque image
   tant que la frise est visible.
   Pages concernées : accueil.
   Accroches : .js-maloya (conteneur), [data-part] dans le SVG construit.
   Mouvement réduit : une seule image fixe. Le bouton de pause du pied de page fige la frise.
   ============================================================ */

import { startFrameLoop } from './animation-loop.js';
import { computeSceneFrame } from './maloya-scene.js';
import { buildMaloyaSvg } from './maloya-svg.js';
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

function applyFrame(parts, frame) {
  for (const [name, value] of Object.entries(frame.transforms)) {
    parts[name].setAttribute('transform', value);
  }
  for (const [name, value] of Object.entries(frame.paths)) parts[name].setAttribute('d', value);
  frame.sparks.forEach((spark, i) => {
    const el = parts[`spark-${i}`];
    el.setAttribute('cx', spark.cx);
    el.setAttribute('cy', spark.cy);
    el.setAttribute('opacity', spark.opacity);
  });
  parts.glow.setAttribute('transform', frame.glow.transform);
  parts.glow.setAttribute('opacity', frame.glow.opacity);
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
  const parts = collectParts(container);
  const clock = { beats: START_BEATS, seconds: START_SECONDS };
  applyFrame(parts, computeSceneFrame(clock.beats, clock.seconds));
  if (prefersReducedMotion()) return;

  const visibility = trackVisibility(container);
  startFrameLoop(
    (now, dt) => {
      clock.beats += (dt * TEMPO_BPM) / 60;
      clock.seconds += dt;
      applyFrame(parts, computeSceneFrame(clock.beats, clock.seconds));
    },
    () => !visibility.isVisible || isMotionPaused(),
  );
}
