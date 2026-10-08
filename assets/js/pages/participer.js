/* ============================================================
   assets/js/pages/participer.js
   Rôle : point d'entrée de la page « Participer ».
   Pages concernées : participer.html.
   Accroches : voir les modules importés.
   ============================================================ */

import { initHeroReveal } from '../lib/hero-reveal.js';
import { initMotionToggle } from '../lib/motion-toggle.js';
import { initNavScroll } from '../lib/nav-scroll.js';
import { initProgressBar } from '../lib/progress-bar.js';
import { initScrollReveal } from '../lib/scroll-reveal.js';

initProgressBar();
initNavScroll();
initHeroReveal();
initScrollReveal();
initMotionToggle();
