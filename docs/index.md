# Index de contexte — Genome Reunion Web Page

Ce fichier sert de **mémoire de travail** pour reprendre rapidement le contexte du dépôt et guider les corrections futures.

Il ne remplace pas le README public. Il sert surtout à documenter :

- la structure du site ;
- les fichiers importants ;
- les corrections prévues ;
- les points sensibles de communication ;
- les règles de travail étape par étape.

---

## Dépôt

- Nom GitHub : `patrick-mun/Genome_reunion_web_page`
- Branche principale : `main`
- Type : site HTML/CSS/JS statique
- Public cible : grand public, institutionnels, partenaires, non spécialistes
- Projet : Génome Réunion
- **Site en ligne :** https://patrick-mun.github.io/Genome_reunion_web_page/index.html

---

## Objectif du site

Présenter le projet Génome Réunion de façon visuelle, accessible et compréhensible par un public non spécialiste, tout en restant compatible avec une communication scientifique et institutionnelle.

Le site doit expliquer :

1. pourquoi une population réunionnaise admixée et fondatrice est insuffisamment représentée dans les bases génomiques mondiales ;
2. pourquoi cela complique l'interprétation des variants ;
3. comment le projet prévoit de construire un référentiel génomique local ;
4. quelles applications cliniques et scientifiques sont envisagées ;
5. comment la participation sera organisée lorsque le cadre sera validé.

---

## Structure du dépôt

```text
.
├── index.html                  # Page d'accueil
├── participer.html             # Page d'information participation
├── README.md                   # Présentation du dépôt
│
├── assets/
│   ├── css/tokens.css          # Valeurs de conception (couleurs, échelles)
│   ├── css/base.css            # Reset, html, body
│   ├── css/components/         # nav, footer, vagues, lien d'évitement, barre de progression, eyebrow
│   ├── css/pages/              # home/ et participer/ (une section par fichier)
│   ├── css/utilities.css       # .reveal, chargé en dernier
│   ├── js/pages/               # Point d'entrée par page (home.js, participer.js)
│   ├── js/lib/                 # Modules partagés (un module par comportement)
│   └── images/efs-logo.svg     # Logo EFS
│
└── docs/
    ├── PLAN_CORRECTION.md      # Plan de correction progressive
    └── index.md                # Ce fichier
```

---

## Fichiers principaux

### `index.html`

Page d'accueil du site.

Contient :

- hero principal ;
- barre de chiffres clés ;
- section problème ;
- section bénéfices ;
- section carrefour génétique ;
- section méthode ;
- section outils/modules cliniques ;
- section équipe ;
- section partenaires ;
- CTA vers la participation.

Points sensibles :

- ne pas employer `génome de référence` sans prudence ;
- éviter les promesses médicales trop directes ;
- remplacer progressivement `4 IA` par une formulation plus institutionnelle ;
- vérifier les partenaires affichés avant diffusion externe.

---

### `participer.html`

Page d'information sur la participation.

Contient :

- hero de page ;
- section partenariat EFS (confirmé) ;
- calendrier de collecte ;
- étapes d'inscription ;
- contact par email.

Points sensibles :

- les dates de collecte peuvent être fictives ou non validées ;
- l'inscription ne doit pas être présentée comme ouverte si ce n'est pas officiellement le cas ;
- éviter de promettre un bilan sanguin complet si cela n'est pas validé.

---

### `assets/css/`

Le CSS est découpé par rôle (CSS-02) et chargé par des `<link>` dans cet ordre :

1. `tokens.css` : valeurs de conception, seul endroit où les valeurs brutes sont permises ;
2. `base.css` : reset, `html`, `body` ;
3. `components/*.css` : composants partagés par les deux pages, chacun avec ses media queries ;
4. `pages/home/*.css` (un fichier par section de l'accueil : hero, stats, probleme, change, carrefour, methode, outils, equipe, partenaires, cta, paille-en-queue, margouillat) ou `pages/participer/*.css` (hero, partenariat, collectes, inscription) : styles propres à une page ;
5. `utilities.css` : `.reveal`, chargé en dernier car il doit l'emporter sur les transitions des composants.

---

### `assets/js/pages/` et `assets/js/lib/`

Le JS est découpé en modules ES chargés par `<script type="module">` dans le `<head>`.
Chaque page charge un seul point d'entrée (`pages/home.js`, `pages/participer.js`) qui
appelle les fonctions `init…` des modules de `lib/`.

Les éléments sont retrouvés par des classes `js-…` ou des attributs `data-…`
(jamais par `id` ni par classe de style) :

- `progress-bar.js` : barre de progression au scroll (`.js-progress`) ;
- `nav-scroll.js` : style de la navigation au scroll (`.js-nav`) ;
- `hero-reveal.js` : apparition du hero (`[data-hero-reveal]`, délai en ms) ;
- `scroll-reveal.js` : apparition au scroll (`.js-reveal`) ;
- `stats-counter.js` : compteurs animés (`.js-stat-item`, `.js-count`) ;
- `legend-dots.js` : marqueurs de couleur de la légende (`.js-legend-dot`) ;
- `hero-parallax.js` : parallaxe souris (`[data-parallax-depth]`) ;
- `donut-geometry.js` et `donut-chart.js` : arcs de l'anneau calculés à partir des pourcentages de la légende (`.js-legend-pct`), puis tracés au scroll (`.js-donut`) ;
- `motion.js` : préférence `prefers-reduced-motion` et état de pause manuelle (classe `is-motion-paused` sur `<html>`) ;
- `motion-toggle.js` : bouton « Mettre en pause les animations » du pied de page (`.js-motion-toggle`), qui suspend les vagues, la parallaxe, les oiseaux et le margouillat (WCAG 2.2.2) ;
- `geometry.js`, `random.js`, `animation-loop.js` : calculs purs partagés (Bézier, angles, tirages injectables) et boucle `requestAnimationFrame` ;
- `bird-flight.js`, `bird-svg.js` et `paille-en-queue.js` : trajectoires et pose des oiseaux (purs), balisage SVG, puis branchement au DOM ;
- `gecko-motion.js`, `gecko-pose.js`, `gecko-svg.js` et `margouillat.js` : même découpage pour le margouillat ;
- `placement.js` : pose `--x`, `--y` et `--angle` sur un élément animé (utilisé par les animations du hero et des sections).

Le JS ne pose aucun style direct (JS-11) : il bascule des classes d'état (`is-revealed`, `is-drawn`, `is-born`, `is-scrolled`) ou pose des variables CSS (`--progress`, `--reveal-delay`, `--parallax-x`, `--x`…) que le CSS consomme.

Chaque module vérifie que ses éléments existent avant de s'en servir.

Tests : la logique pure (modules sans `document` ni `window`) est testée par des fichiers `*.test.js` voisins, lancés par `npm test` (`node --test`, aucune dépendance). `fake-random.js` fournit des générateurs déterministes.

Mouvement réduit : en `prefers-reduced-motion: reduce`, les animations JS (parallaxe, oiseaux, margouillat, compteurs, donut) ne démarrent pas, et le CSS neutralise chaque mouvement par un bloc `@media` placé juste après sa règle.

---

### `assets/js/lib/paille-en-queue.js`

Animation décorative du hero : 3 oiseaux (paille-en-queue) en vol continu.

Techniques utilisées :

- courbes bezier cubiques pour les trajectoires ;
- paramétrage par longueur d'arc pour une vitesse visuelle constante ;
- tangente de départ alignée sur le cap courant pour éviter les virages brusques ;
- battements d'ailes et oscillation de la queue pilotés par `requestAnimationFrame` ;
- désactivé si `prefers-reduced-motion` ou écran < 760 px.

---

### `assets/images/efs-logo.svg`

Logo EFS SVG utilisé dans `participer.html`.

Point d'attention : ne pas modifier sans vérifier le rendu.

---

## État actuel

Le dépôt est propre et organisé. La structure `assets/` / `docs/` est en place.

Travaux récents effectués :

- ✅ Réorganisation du dépôt (assets/, docs/) et suppression des fichiers morts.
- ✅ Gardes JavaScript ajoutées dans `script.js` (compatibilité multi-pages).
- ✅ Partenariat EFS confirmé et libellés mis à jour dans `participer.html`.
- ✅ URL du site ajoutée dans le README.
- ✅ Commentaires de maintenance ajoutés dans `paille-en-queue.js`.

---

## Corrections à venir

1. `index.html` : remplacer `4 IA` par une formulation plus institutionnelle.
2. `index.html` : adoucir les promesses médicales trop fortes.
3. `index.html` : stabiliser le vocabulaire autour de `référentiel génomique réunionnais`.
4. `participer.html` : sécuriser les dates de collecte et les promesses de bilan sanguin.
5. `styles.css` : ajustements visuels uniquement après validation des contenus.

---

## Workflow de correction

Pour chaque correction :

1. partir de `main` à jour ;
2. créer une branche courte ;
3. modifier un seul sujet ;
4. créer une PR ;
5. vérifier le rendu ;
6. merger seulement après validation.

```bash
git checkout main
git pull origin main
git checkout -b correction-<sujet>
```

---

## Formulations recommandées

À privilégier :

- `référentiel génomique réunionnais` ;
- `base locale de fréquences de variants` ;
- `ressource génomique dédiée à la population réunionnaise` ;
- `modules d'aide à l'analyse clinique` ;
- `modalités de participation à confirmer`.

À éviter ou à revoir :

- `génome de référence`, sauf explication ;
- `4 IA` comme argument isolé ;
- `chaque soin s'adapte enfin à vous` ;
- `le bon médicament à la bonne dose`, si formulé comme promesse immédiate ;
- dates ou lieux de collecte non confirmés.

---

## Règle de rendu visuel

Le rendu actuel doit rester la référence tant qu'une correction n'a pas été validée.

Une correction textuelle ne doit pas provoquer :

- rupture de grille ;
- déséquilibre majeur des cartes ;
- bloc trop long ;
- CTA incohérent ;
- perte de lisibilité mobile.

---

## Commande locale de reprise

```bash
git checkout main
git pull origin main
```

## Sources uniques

Une valeur ne s'écrit qu'à un endroit :

- **Couleurs** : `assets/css/tokens.css`. Les SVG du HTML utilisent `fill="var(--navy)"`, et le balisage SVG des animations (`gecko-svg.js`, `bird-svg.js`) ne porte aucune couleur : elles viennent des classes `gecko-*` et `paille-*` du CSS. Seul le logo POPgen, œuvre d'un tiers, garde ses couleurs.
- **Anneau des ascendances** : les pourcentages de la légende (`.legend-pct`) sont l'unique source. Les arcs sont calculés par `donut-geometry.js` ; l'ordre des cercles du SVG doit suivre celui de la légende, et leur couleur vient de la classe `origin-<origine>` partagée avec la légende.
