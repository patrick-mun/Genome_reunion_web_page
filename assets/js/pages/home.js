/* ============================================================
   assets/js/pages/home.js
   Rôle : point d'entrée de la page d'accueil.
   Pages concernées : index.html.
   Accroches : voir les modules importés.
   ============================================================ */

import { initDonutChart } from '../lib/donut-chart.js';
import { initHeroParallax } from '../lib/hero-parallax.js';
import { initHeroReveal } from '../lib/hero-reveal.js';
import { initLegendDots } from '../lib/legend-dots.js';
import { initMaloya } from '../lib/maloya.js';
import { initMargouillat } from '../lib/margouillat.js';
import { initMotionToggle } from '../lib/motion-toggle.js';
import { initNavScroll } from '../lib/nav-scroll.js';
import { initPailleEnQueue } from '../lib/paille-en-queue.js';
import { initProgressBar } from '../lib/progress-bar.js';
import { initScrollReveal } from '../lib/scroll-reveal.js';
import { initStatsCounter } from '../lib/stats-counter.js';

initProgressBar();
initNavScroll();
initHeroReveal();
initScrollReveal();
initStatsCounter();
initLegendDots();
initHeroParallax();
initDonutChart();
initMaloya();
initPailleEnQueue();
initMargouillat();
initMotionToggle();
