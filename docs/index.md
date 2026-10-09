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
├── favicon.ico                 # Icône du site (les autres icônes sont dans assets/images/)
├── README.md                   # Présentation du dépôt
├── package.json, .nvmrc        # Outils de vérification (Node 22)
├── tooling/, .githooks/        # Contrôles HTML/CSS, vérification du rendu (npm run visual), hook pré-commit
├── .github/                    # Action de vérification et Dependabot
│
├── assets/
│   ├── css/fonts.css           # @font-face des polices hébergées (assets/fonts/)
│   ├── css/tokens.css          # Valeurs de conception (couleurs, échelles)
│   ├── css/base.css            # Reset, html, body
│   ├── css/components/         # nav, footer, boutons, vagues, lien d'évitement, barre de progression, eyebrow
│   ├── css/pages/              # home/ et participer/ (une section par fichier)
│   ├── css/utilities.css       # .reveal, chargé en dernier
│   ├── js/pages/               # Point d'entrée par page (home.js, participer.js)
│   ├── js/lib/                 # Modules partagés (un module par comportement)
│   ├── fonts/                  # Polices woff2 (Spectral, DM Sans, Space Grotesk) et licences OFL
│   └── images/                 # sprite.svg (logo, vagues), efs-logo.svg, popgen-logo.svg, favicon.svg, apple-touch-icon.png
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

0. `fonts.css` : `@font-face` des polices hébergées (`assets/fonts/`, aucun appel à Google Fonts) ;
1. `tokens.css` : valeurs de conception, seul endroit où les valeurs brutes sont permises ;
2. `base.css` : reset, `html`, `body` ;
3. `components/*.css` : composants partagés par les deux pages, chacun avec ses media queries ;
4. `pages/home/*.css` (un fichier par section de l'accueil : hero, stats, probleme, change, carrefour, methode, outils, equipe, partenaires, cta, paille-en-queue, margouillat, maloya) ou `pages/participer/*.css` (hero, partenariat, collectes, inscription) : styles propres à une page ;
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
- `legend-dots.js` : marqueurs de couleur de la légende (`.js-ancestry-legend-dot`) ;
- `hero-parallax.js` : parallaxe souris (`[data-parallax-depth]`) ;
- `donut-geometry.js` et `donut-chart.js` : arcs de l'anneau calculés à partir des pourcentages de la légende (`.js-ancestry-legend-pct`), puis tracés au scroll (`.js-donut`) ;
- `motion.js` : préférence `prefers-reduced-motion` et état de pause manuelle (classe `is-motion-paused` sur `<html>`) ;
- `motion-toggle.js` : bouton « Mettre en pause les animations » du pied de page (`.js-motion-toggle`), qui suspend les vagues, la parallaxe, les oiseaux, le margouillat et la frise du maloya (WCAG 2.2.2) ;
- `geometry.js`, `random.js`, `animation-loop.js` : calculs purs partagés (bornes, interpolation, angles, tirages injectables) et boucle `requestAnimationFrame` ;
- `bird-flight.js`, `bird-wings.js`, `bird-svg.js` et `paille-en-queue.js` : vol et battement d'ailes des oiseaux (purs), balisage SVG et transformations, puis branchement au DOM ;
- `gecko-motion.js`, `gecko-pose.js`, `gecko-svg.js` et `margouillat.js` : même découpage pour le margouillat ;
- `maloya-rhythm.js`, `maloya-groove.js`, `maloya-limbs.js`, `maloya-outlines.js`, `maloya-musicians.js`, `maloya-dancers.js`, `maloya-skirt.js`, `maloya-man.js`, `maloya-bodies.js`, `maloya-fire.js` et `maloya-scene.js` (purs), `maloya-figures.js` et `maloya-svg.js` (balisage SVG), puis `maloya.js` (DOM, `.js-maloya`) : frise du maloya de la section carrefour ;
- `placement.js` : pose `--x`, `--y` et `--angle` sur un élément animé (utilisé par les animations du hero et des sections).

Le JS ne pose aucun style direct (JS-11) : il bascule des classes d'état (`is-revealed`, `is-drawn`, `is-born`, `is-scrolled`) ou pose des variables CSS (`--progress`, `--reveal-delay`, `--parallax-x`, `--x`…) que le CSS consomme.

Chaque module vérifie que ses éléments existent avant de s'en servir.

Tests : la logique pure (modules sans `document` ni `window`) est testée par des fichiers `*.test.js` voisins, lancés par `npm test` (`node --test`, aucune dépendance). `fake-random.js` fournit des générateurs déterministes.

Mouvement réduit : en `prefers-reduced-motion: reduce`, les animations JS (parallaxe, oiseaux, margouillat, compteurs, donut) ne démarrent pas, la frise du maloya reste une image fixe, et le CSS neutralise chaque mouvement par un bloc `@media` placé juste après sa règle.

---

### `assets/js/lib/paille-en-queue.js`

Animation décorative du hero : 3 oiseaux (paille-en-queue) en vol continu.

Techniques utilisées :

- vol piloté (`bird-flight.js`) : l'oiseau garde un cap et une vitesse et tourne vers ses destinations sans descendre sous un rayon de virage de 140 px ; il s'incline et se redresse progressivement, et son corps suit toujours la direction du vol (pas de glissade de côté ni de demi-tour sur place) ;
- destinations choisies plutôt devant l'oiseau, avec une légère dérive du cap pour que les trajets serpentent ; une destination contournée depuis plus de 270° est abandonnée (pas de ronde sans fin) ;
- vitesse continue : l'oiseau accélère en battant des ailes et ralentit en glissade ; sorti du hero, il patiente puis revient par un autre côté ;
- ailes (`bird-wings.js`) : séries de battements (abaissement plus long que la remontée, poignet replié en remontée) et glissades ailes tendues, enchaînées sans saut ; chaque aile pivote à son épaule, et l'inclinaison en virage les déséquilibre (surtout en glissade) ;
- queue : les brins suivent la courbe des virages avec retard et frémissent légèrement ;
- dessin (`bird-svg.js`) : paille-en-queue à brins blancs vu du dessous, ailes longues et pointues coudées au poignet, signes de l'espèce (barre noire en chevron et bout noir des ailes, masque noir, bec jaune orangé, longs brins) ; chaque forme n'est écrite que pour le côté gauche, le côté droit en est le reflet (`mirrorPath`) ; couleurs dans `pages/home/paille-en-queue.css` (`--white`, `--navy-deep`, `--amber`) ;
- désactivé si `prefers-reduced-motion` ou écran < 760 px ; figé par le bouton de pause.

---

### `assets/js/lib/maloya.js`

Frise décorative en bas de la section « Carrefour génétique » : cinq musiciens de maloya en arc autour d'un feu de bois (roulèr, sati, pikèr, bobre, kayamb), deux danseuses et un danseur, en aplats colorés.

- rythme ternaire (`maloya-rhythm.js`) : mesure de 4 temps de 3 pulsations, frappes propres à chaque instrument ; les mains et baguettes touchent l'instrument exactement à chaque frappe et montent plus haut avant une frappe forte (premier temps) ; tempo 96 temps par minute ;
- poids et phrasé (`maloya-groove.js`) : le bassin passe d'un appui à l'autre sans à-coup, dépasse un peu, revient et tient l'appui ; les genoux s'enfoncent après la prise d'appui (danseurs) ou sur le temps (musiciens) ; premier temps plus marqué, amplitude qui enfle et retombe sur une phrase de huit mesures, petites variations propres à chacun ; chaque personnage a son style (`style` dans la distribution : avance ou retard sur le temps, ampleur, phase) ; une figure marque la fin de chaque phrase de quatre mesures ; tout boucle sur 32 temps ;
- corps continus (`maloya-outlines.js`, `maloya-bodies.js`) : bras, jambes et bustes ne sont plus des pièces rigides qui pivotent comme un pantin, mais des contours d'un seul tenant autour de chaînes de points (épaule-coude-poignet, hanche-genou-cheville, colonne) : les articulations se plient (pli à l'intérieur, arrondi à l'extérieur), manches et pantalons suivent le membre ; seuls la tête, les mains, les pieds et les instruments restent rigides ;
- musiciens (`maloya-musicians.js`) : poses de profil, bras et jambes par cinématique inverse (`maloya-limbs.js`) ; colonne courbée qui plonge dans les temps, du bas du dos vers le haut ; tête qui compense le buste au lieu de le suivre, avec un hochement sur le premier temps ; mains qui montent près du corps et retombent en avant (boucle), poignet en retard ; chemise rentrée dans le pantalon, qui couvre le bassin ; le rang du fond est plus petit et plus haut pour suggérer le cercle ;
- danse (`maloya-dancers.js`, `maloya-skirt.js`, `maloya-man.js`) : pieds ancrés à la largeur des épaules ; le pied libre glisse d'un petit pas pendant que l'autre porte le poids, puis reçoit le poids au temps suivant ; genoux fléchis ; bassin ample, hanche d'appui plus haute et épaules inclinées en sens inverse ; buste qui ne suit le bassin qu'à moitié et tête presque droite ; petite dérive latérale sur deux mesures ; les danseuses tiennent la jupe des deux mains et la font jouer avec le bassin ; en fin de phrase, elles font tourbillonner leur jupe (mains ouvertes, ourlet évasé, plis qui font le tour de la jupe) et le danseur plonge sur ses genoux en ouvrant les bras (le tour sur soi en 2D, peu lisible, a été retiré) ;
- feu (`maloya-fire.js`) : flammes, halo et étincelles en temps réel ;
- `maloya-scene.js` calcule chaque image (valeurs à poser), `maloya.js` les recopie dans les attributs du SVG tant que la frise est visible, en sautant ceux qui n'ont pas changé (jambes des musiciens assis, par exemple) ;
- diversité suggérée par des teintes de peau différentes et des tenues créoles communes (chemises claires, pantalons roulés, chapeaux de paille, jupes longues, foulards madras), sans marqueur « ethnique » ; couleurs dans `tokens.css` (`--maloya-*`) et `pages/home/maloya.css` ;
- frise aux proportions 1080 × 150, au moins 100 px de haut : sur un écran étroit, elle est recadrée autour du feu (musiciens et danseur visibles) au lieu d'être réduite ;
- image fixe en mouvement réduit ; figée par le bouton de pause.

---

### `assets/images/efs-logo.svg` et `assets/images/popgen-logo.svg`

Logos des partenaires, œuvres de tiers reproduites telles quelles avec leurs propres couleurs, chargés par `<img>` : EFS dans `index.html` et `participer.html`, POPgen dans `index.html` (lien à ajouter quand son URL sera connue).

Point d'attention : ne pas modifier sans vérifier le rendu.

---

## État actuel

Le dépôt est propre et organisé. La structure `assets/` / `docs/` est en place.

Travaux récents effectués :

- ✅ Réorganisation du dépôt (assets/, docs/) et suppression des fichiers morts.
- ✅ JavaScript découpé en modules ES testés (`assets/js/pages/`, `assets/js/lib/`) ; chaque module vérifie ses éléments (compatibilité multi-pages).
- ✅ Partenariat EFS confirmé et libellés mis à jour dans `participer.html`.
- ✅ URL du site ajoutée dans le README.
- ✅ Conformité aux conventions de code web (CSS, HTML, JS) : outillage, tokens, CSS découpé par section, contrastes AA, accessibilité, contrôles automatiques (`npm run verify`, hook pré-commit, GitHub Action).
- ✅ Hygiène du dépôt : favicon, `.nvmrc` et `engines`, Dependabot.
- ✅ Polices Google hébergées dans `assets/fonts/` : plus aucune requête vers un service tiers (performance, RGPD).
- ✅ Sources uniques (sprite SVG, couleurs, anneau calculé depuis la légende) et test de synchronisation des deux pages.
- ✅ Jetons de typographie et d'espacements responsives, préfixes de classes par composant, boutons regroupés dans `components/button.css`.
- ✅ Logo POPgen en fichier image ; frise animée du maloya en bas de la section carrefour (modules purs testés, image fixe en mouvement réduit).

---

## Corrections à venir

Les corrections éditoriales sont suivies dans `PLAN_CORRECTION.md` (tableau d'avancement, étapes 2 à 6) :
le texte actuel a déjà été repris (plus de « 4 IA », « référentiel génomique réunionnais » employé),
mais chaque étape reste à valider par l'équipe projet. Restent notamment :

1. `participer.html` : dates de collecte et ouverture réelle des inscriptions à confirmer.
2. `index.html` et `participer.html` : statut de chaque partenaire à confirmer ; lien du logo POPgen à ajouter.
3. `assets/css/` : ajustements visuels uniquement après validation des contenus.

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

- **Logo et vagues** : un seul dessin dans `assets/images/sprite.svg`, référencé par `<use href="assets/images/sprite.svg#logo">` (identifiants `logo`, `wave-1` à `wave-3`). Les couleurs y sont des variables CSS héritées de l'élément `<use>` : ne pas ouvrir le sprite seul. Un commentaire XML ne peut pas contenir `--`.
- **Couleurs** : `assets/css/tokens.css`. Les SVG du HTML utilisent `fill="var(--navy)"`, et le balisage SVG des animations (`gecko-svg.js`, `bird-svg.js`, `maloya-figures.js`, `maloya-svg.js`) ne porte aucune couleur : elles viennent des classes `gecko-*`, `paille-*` et `maloya-*` du CSS (pour la frise, une palette par personnage, `maloya-cast-*`). Seuls les logos des partenaires (`efs-logo.svg`, `popgen-logo.svg`), œuvres de tiers, gardent leurs couleurs.
- **Anneau des ascendances** : les pourcentages de la légende (`.ancestry-legend-pct`) sont l'unique source. Les arcs sont calculés par `donut-geometry.js` ; l'ordre des cercles du SVG doit suivre celui de la légende, et leur couleur vient de la classe `origin-<origine>` partagée avec la légende.

## Parties communes aux deux pages

Le site n'a pas d'étape de génération : la navigation, le pied de page, le lien d'évitement, la barre de progression et les feuilles partagées sont écrits dans chaque page. Pour éviter qu'ils divergent :

- modifier **les deux pages ensemble** ;
- `tooling/pages-sync.test.js` (lancé par `npm test`, le hook pré-commit et la CI) échoue si ces parties diffèrent, hors cibles des liens et libellé du lien d'action (« Participer » / « S'inscrire ») ;
- il vérifie aussi que le sprite SVG est bien formé, que chaque `<use>` a son symbole, qu'aucun dessin du sprite n'est recopié, et que chaque lien interne mène à une ancre existante.
