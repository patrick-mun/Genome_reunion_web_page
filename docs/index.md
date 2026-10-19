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
- **Hébergement :** à définir. Ce dépôt GitHub sert à la construction et à la conservation du code ; l'adresse `github.io` éventuelle n'est pas l'adresse définitive.

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
├── mentions-legales.html       # Mentions légales (préremplies, à valider par le DPO)
├── confidentialite.html        # Politique de confidentialité du site (préremplie, à valider par le DPO)
├── 404.html                    # Page d'erreur (à déclarer côté serveur selon l'hébergeur)
├── favicon.ico                 # Icône du site (les autres icônes sont dans assets/images/)
├── README.md                   # Présentation du dépôt
├── data/collectes.csv          # Dates de collecte (source de npm run collectes ; dates fictives à remplacer)
├── package.json, .nvmrc        # Outils de vérification (Node 22)
├── tooling/, .githooks/        # Contrôles, vérification du rendu (npm run visual), mise en ligne (set-site-url), calendrier (collectes), hook pré-commit
├── .github/                    # Action de vérification et Dependabot
│
├── assets/
│   ├── css/fonts.css           # @font-face des polices hébergées (assets/fonts/)
│   ├── css/tokens.css          # Valeurs de conception (couleurs, échelles)
│   ├── css/base.css            # Reset, html, body
│   ├── css/components/         # nav, footer, boutons, vagues, lien d'évitement, barre de progression, eyebrow
│   ├── css/pages/              # home/, participer/, legal/ (pages légales) et erreur/ (page 404) : une section par fichier
│   ├── css/utilities.css       # .reveal, chargé en dernier
│   ├── js/pages/               # Point d'entrée par page (home.js, participer.js, legal.js, erreur.js)
│   ├── js/lib/                 # Modules partagés (un module par comportement)
│   ├── fonts/                  # Polices woff2 (Spectral, DM Sans, Space Grotesk) et licences OFL
│   └── images/                 # sprite.svg (logo, vagues, repère de carte, icônes de réseaux sociaux), efs-logo.svg, popgen-logo.svg, crb-logo.svg, favicon.svg, apple-touch-icon.png, partage.png (image de partage 1 200 × 630)
│
└── docs/
    ├── PLAN_CORRECTION.md      # Plan de correction progressive
    ├── conventions-profile.md  # Profil de conventions du projet (choix et dérogations)
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

### `mentions-legales.html` et `confidentialite.html`

Pages légales : même navigation et même pied de page que les autres pages (gardés synchronisés par
`tooling/pages-sync.test.js`), un bandeau de titre puis une section par rubrique (`.legal-section`).
Le texte est prérempli ; ce que les documents ne fixent pas reste surligné (`.legal-blank`), et un avis en
tête de page (`.legal-todo`) signale que le DPO doit valider. Ces pages sont déjà dans `main` (préproduction) :
avant la mise en ligne définitive, retirer l'avis et les surlignages après validation et renseigner l'hébergeur. La politique de confidentialité est celle d'un site web ordinaire : elle ne traite que le
site (visite, e-mails reçus, hébergeur, cookies, droits). La recherche Génome Réunion (dossier MR-004) a sa
propre information RGPD, remise aux donneurs par l'EFS : elle ne figure pas sur le site, ni en renvoi.
Le site n'utilise ni cookie ni stockage local et ne charge aucun service tiers (Google Maps n'est contacté
qu'au clic sur un repère de carte, qui ouvre un nouvel onglet).
Le pied de page des trois pages renvoie vers elles (`.footer-legal-link`). Feuille de style :
`assets/css/pages/legal/legal.css` ; entrée JS : `assets/js/pages/legal.js`.

---

### Pied de page et partage

- Icônes LinkedIn, Facebook et Instagram dans le pied de page (`.footer-social`, tracés Simple Icons CC0 dans le sprite). Les réseaux ne sont pas encore ouverts : chaque `<a class="footer-social-link">` n'a volontairement pas d'`href`. Quand un compte existe, ajouter `href` (et `target`/`rel` si besoin) et retirer « (bientôt disponible) » de l'`aria-label` de l'icône.
- Balises de partage `og:*` et `twitter:card` dans le `<head>` de chaque page ; `og:title` et `og:description` doivent rester identiques au `<title>` et à la description (testé). Pas encore d'`og:image` ni d'`og:url` : ils attendent l'URL définitive du site.

---

### `404.html`

Page d'erreur : même navigation et même pied de page que les autres pages (gardés synchronisés par
`tooling/pages-sync.test.js`), un bandeau avec deux boutons (accueil, participer). Style :
`assets/css/pages/erreur/erreur.css` ; entrée JS : `assets/js/pages/erreur.js`.
**Limite connue :** dans le dépôt, les chemins de cette page sont relatifs. Elle s'affiche correctement pour une
adresse inconnue à un seul niveau (`/inexistante.html`) ; pour une adresse plus profonde (`/a/b/inexistante`), les
feuilles de style et les liens se résolvent depuis ce dossier et la page apparaît sans style. La commande de mise en
ligne (voir « Mise en ligne ») règle ce point : sa copie de `404.html` a des chemins absolus. Une balise `<base>`
ne convient pas : elle ferait aussi pointer le lien d'évitement `#contenu` vers l'accueil. Selon l'hébergeur, il faut
en plus déclarer la page côté serveur (`error_page 404` pour nginx, `ErrorDocument 404` pour Apache) en gardant le
code HTTP 404.

### Calendrier de collecte : `npm run collectes`

Les deux tableaux du calendrier de `participer.html` (zones Nord et Sud) se mettent à jour à partir d'un
fichier CSV exporté d'Excel, sans toucher au HTML à la main :

```
npm run collectes -- [fichier.csv] [--page page.html] [--today AAAA-MM-JJ] [--keep-past] [--check]
```

- **Fichier :** `data/collectes.csv` par défaut, colonnes `zone ; date ; lieu ; adresse ; horaires`
  (ordre libre ; la première ligne porte les noms). `zone` : Nord ou Sud. `date` : `05/11/2026` ou `2026-11-05`.
  `horaires` : `8h-13h` devient `8h – 13h`. `adresse` est facultative. Dans Excel : _Enregistrer sous_
  → _CSV UTF-8_ (ou _CSV (séparateur : point-virgule)_) ; le séparateur `;` ou `,` est détecté, le BOM
  retiré, et un fichier en Windows-1252 (accents d'Excel en français) est reconnu.
- **Ce que fait la commande :** retire les dates passées (date du jour à La Réunion ; `--keep-past` les
  garde), trie par date, calcule elle-même le jour de la semaine (« Ven. 5 nov. 2026 »), échappe le texte,
  et remplace uniquement le contenu des deux `<tbody>`. Sans date à venir pour une zone, le tableau affiche
  « Aucune date programmée pour le moment. ». `--check` montre le résultat sans écrire.
- **Repère de carte :** chaque ligne a une quatrième cellule (`.collecte-carte`) avec un lien rond vers une
  recherche Google Maps (lieu, adresse, « La Réunion »), ouvert dans un nouvel onglet
  (`target="_blank"`, `rel="noopener noreferrer"`) ; sans adresse, la cellule reste vide. L'icône vient du
  sprite (`icon-pin`) et prend le bleu du hero (`--navy`). Aucun script ni clé d'API : Google n'est
  contacté qu'au clic. L'adresse de l'en-tête de chaque tableau (« Centre fixe · … ») reste du texte.
  Adresses ambiguës pour Google (boîte postale, « Pl. du 20 Décembre ») : préciser l'adresse dans le CSV.
- **Erreurs :** zone inconnue, date invalide, lieu ou horaires manquants sont listés avec leur numéro de ligne ;
  dans ce cas rien n'est modifié.
- **À savoir :** les dates de `data/collectes.csv` livré sont **fictives** (reprises de la page d'origine, les
  jours de la semaine y étaient faux) : à remplacer par les vraies avant de lancer la commande, sinon les
  tableaux seront vidés (toutes passées). Fichier Excel natif (.xlsx) non géré : il faudrait ajouter une
  bibliothèque ; exporter en CSV suffit. Le résultat est un changement de `participer.html` à relire et à
  commiter (la commande ne s'exécute pas à la mise en ligne). Logique pure dans `tooling/collectes.js`,
  testée avec la commande elle-même sur une copie de la vraie page (`tooling/collectes.test.js`).

---

### Mise en ligne : `npm run set-site-url`

Les sources ne contiennent aucune adresse absolue (l'hébergeur n'est pas choisi). Quand l'adresse définitive est
connue :

```
npm run set-site-url -- https://exemple.fr/ [--out dossier] [--image chemin --image-alt "texte"] [--no-image] [--keep-noindex]
```

La commande écrit une copie prête à déployer (par défaut dans `.site-dist/`, ignoré par git, vide ou absent
avant le lancement) avec, pour chaque page : `<link rel="canonical">` et `og:url`, ainsi que `og:image`,
`twitter:image` (avec `og:image:alt`) et la carte `summary_large_image`, avec l'image de partage `assets/images/partage.png` (1 200 × 630, titre « Mieux lire nos génomes. » sur les vagues du site ; `--image` en choisit une autre, `--no-image` n'en met pas); `sitemap.xml` ; `robots.txt` ; une
`404.html` aux chemins absolus. **`noindex` :** les sources portent `<meta name="robots" content="noindex" />`
sur toutes les pages (préproduction : les moteurs ne doivent pas référencer le brouillon, qui reste consultable
par son adresse) ; la copie de production le retire, sauf avec `--keep-noindex` (préproduction à l'adresse finale).
`noindex` n'est pas une protection d'accès. Les sources ne sont pas modifiées. Logique pure dans `tooling/site-url.js`,
testée avec la commande elle-même sur les vraies pages (`tooling/site-url.test.js`). Limites : l'image de partage est un fichier fixe (pour changer son texte, il faut la refaire) ; `robots.txt` n'est lu qu'à la racine du domaine ; la commande ne
configure pas le serveur (en-têtes de sécurité, cache, redirections).

---

### `participer.html`

Page d'information sur la participation : les participants sont, dans un premier temps, des donneurs de
l'EFS. Il n'y a ni prélèvement supplémentaire ni inscription : avec l'accord du donneur, les fonds de tube
des analyses faites par l'EFS sont utilisés pour ce programme de recherche. Un livret explicatif est remis à
l'arrivée du donneur ; lors de l'entretien, le médecin de l'EFS répond à ses questions et recueille son accord.

Contient :

- hero de page ;
- section partenariat EFS (confirmé) ;
- calendrier de collecte (collectes de dons de sang, avec un repère de carte par adresse) ;
- trois étapes de participation (venir donner son sang, lire le livret et poser ses questions, donner son
  accord) et un bouton « Trouver une collecte » ;
- contact par email.

Points sensibles :

- les dates de collecte peuvent être fictives ou non validées ;
- ne pas réintroduire d'inscription, de réservation, de convocation ni de formulaire : il n'y en a pas ;
- ne pas parler de prélèvement pour le projet ni promettre un bilan sanguin ;
- la description du consentement (fonds de tube, livret, entretien, « sans prélèvement supplémentaire »,
  « sans inscription ») est à faire relire par l'EFS et le DPO avant la mise en ligne.

---

### `assets/css/`

Le CSS est découpé par rôle (CSS-02) et chargé par des `<link>` dans cet ordre :

0. `fonts.css` : `@font-face` des polices hébergées (`assets/fonts/`, aucun appel à Google Fonts) ;
1. `tokens.css` : valeurs de conception, seul endroit où les valeurs brutes sont permises ;
2. `base.css` : reset, `html`, `body` ;
3. `components/*.css` : composants partagés par les pages, chacun avec ses media queries ;
4. `pages/home/*.css` (un fichier par section de l'accueil : hero, stats, probleme, change, carrefour, methode, outils, equipe, partenaires, cta, paille-en-queue, margouillat, maloya) ou `pages/participer/*.css` (hero, partenariat, collectes, inscription), `pages/legal/legal.css` (pages légales) ou `pages/erreur/erreur.css` (page 404) : styles propres à une page ;
5. `utilities.css` : `.reveal`, chargé en dernier car il doit l'emporter sur les transitions des composants.

---

### `assets/js/pages/` et `assets/js/lib/`

Le JS est découpé en modules ES chargés par `<script type="module">` dans le `<head>`.
Chaque page charge un seul point d'entrée (`pages/home.js`, `pages/participer.js`, `pages/legal.js`, `pages/erreur.js`) qui
appelle les fonctions `init…` des modules de `lib/`.

**Repli sans JavaScript.** Tout contenu masqué au départ puis révélé par le JS (`.reveal`, `.stat-item`, les textes du hero) reste visible quand le script ne tourne pas : son bloc `@media (prefers-reduced-motion: reduce)` porte aussi `(scripting: none)`. Les compteurs des chiffres clés ont leur valeur finale écrite dans le HTML (test dans `tooling/pages-sync.test.js`) ; le JS les anime depuis 0. Limite : si le JS est actif mais plante au chargement, les blocs masqués le restent. Les décors générés par le JS (oiseaux, margouillat, frise du maloya, arcs de l'anneau) n'apparaissent pas sans lui.

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

- cadrage (`FRAME` dans `maloya-svg.js`) : la scène est dessinée sur 1 080 × 150, mais seule la fenêtre x = 155 à 925, centrée sur le feu, est affichée (les personnages occupent x = 206 à 877) : les figures sont agrandies d'environ 1,4 (frise de 210 px de haut sur ordinateur). `aspect-ratio` de `.maloya` (`maloya.css`) doit rester `FRAME.width / SCENE.height` (testé, ainsi que la présence de chaque personnage dans le cadrage) ; le calcul de la zone visible sur écran étroit (`maloya.js`) part du même cadrage ;
- rythme ternaire (`maloya-rhythm.js`) : mesure de 4 temps de 3 pulsations, frappes propres à chaque instrument ; les mains et baguettes touchent l'instrument exactement à chaque frappe et montent plus haut avant une frappe forte (premier temps) ; tempo 96 temps par minute ;
- poids et phrasé (`maloya-groove.js`) : le bassin passe d'un appui à l'autre sans à-coup, dépasse un peu, revient et tient l'appui ; les genoux s'enfoncent après la prise d'appui (danseurs) ou sur le temps (musiciens) ; premier temps plus marqué, amplitude qui enfle et retombe sur une phrase de huit mesures, petites variations propres à chacun ; chaque personnage a son style (`style` dans la distribution : avance ou retard sur le temps, ampleur, phase) ; une figure marque la fin de chaque phrase de quatre mesures ; tout boucle sur 32 temps ;
- corps continus (`maloya-outlines.js`, `maloya-bodies.js`) : bras, jambes et bustes ne sont plus des pièces rigides qui pivotent comme un pantin, mais des contours d'un seul tenant autour de chaînes de points (épaule-coude-poignet, hanche-genou-cheville, colonne) : les articulations se plient (pli à l'intérieur, arrondi à l'extérieur), manches et pantalons suivent le membre ; seuls la tête, les mains, les pieds et les instruments restent rigides ;
- musiciens (`maloya-musicians.js`) : poses de profil, bras et jambes par cinématique inverse (`maloya-limbs.js`) ; colonne courbée qui plonge dans les temps, du bas du dos vers le haut ; tête qui compense le buste au lieu de le suivre, avec un hochement sur le premier temps ; mains qui montent près du corps et retombent en avant (boucle), poignet en retard ; chemise rentrée dans le pantalon, qui couvre le bassin ; le rang du fond est plus petit et plus haut pour suggérer le cercle ;
- danse (`maloya-dancers.js`, `maloya-skirt.js`, `maloya-man.js`) : pieds ancrés à la largeur des épaules ; le pied libre glisse d'un petit pas pendant que l'autre porte le poids, puis reçoit le poids au temps suivant ; genoux fléchis ; bassin ample, hanche d'appui plus haute et épaules inclinées en sens inverse ; buste qui ne suit le bassin qu'à moitié et tête presque droite ; petite dérive latérale sur deux mesures ; les danseuses tiennent la jupe des deux mains et la font jouer avec le bassin ; en fin de phrase, elles font tourbillonner leur jupe (mains ouvertes, ourlet évasé, plis qui font le tour de la jupe) et le danseur plonge sur ses genoux en ouvrant les bras (le tour sur soi en 2D, peu lisible, a été retiré) ; les bras du danseur sont menés par leurs angles (repos, mains près des hanches, ou ouverts), sans cible à atteindre ;
- feu (`maloya-fire.js`) : flammes, halo et étincelles en temps réel ;
- `maloya-scene.js` calcule chaque image (valeurs à poser), `maloya.js` les recopie dans les attributs du SVG tant que la frise est visible, en sautant ceux qui n'ont pas changé (jambes des musiciens assis, par exemple) ; sur un écran étroit (frise recadrée autour du feu), les personnages hors champ ne sont pas recalculés ;
- diversité suggérée par des teintes de peau différentes et des tenues créoles communes (chemises claires, pantalons roulés, chapeaux de paille, jupes longues, foulards madras), sans marqueur « ethnique » ; couleurs dans `tokens.css` (`--maloya-*`) et `pages/home/maloya.css` ;
- frise aux proportions 1080 × 150, au moins 100 px de haut : sur un écran étroit, elle est recadrée autour du feu (musiciens et danseur visibles) au lieu d'être réduite ;
- image fixe en mouvement réduit ; figée par le bouton de pause.

---

### `assets/images/efs-logo.svg`, `assets/images/popgen-logo.svg` et `assets/images/crb-logo.svg`

Logos des partenaires, œuvres de tiers reproduites telles quelles avec leurs propres couleurs, chargés par `<img>` : EFS dans `index.html` et `participer.html`, POPgen et CRB dans `index.html` (liens à ajouter quand leur adresse sera connue). Le logo du CRB (hauteur de 48 px, plus haut que les autres car il est presque carré et porte du texte) est une vectorisation d'un PNG fourni par l'équipe : contours tracés finement, 25 zones à dégradés SVG, fond transparent, aucune image intégrée ni ressource externe (73 Ko). Il reproduit l'original à environ 0,45 sur 255 près ; le fichier d'origine du CRB (SVG, AI ou EPS), s'il est obtenu, le remplacera avec profit.

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
- ✅ Logo POPgen en fichier image ; frise animée du maloya en bas de la section carrefour (modules purs testés, image fixe en mouvement réduit), agrandie d'environ 1,4 sur ordinateur (`FRAME`).
- ✅ Pages légales préremplies (à valider par le DPO), page 404, titre d'accueil descriptif, `noindex` en préproduction, balises de partage et image de partage, icônes de réseaux sociaux (liens à ajouter à l'ouverture des comptes).
- ✅ Mise en ligne préparée sans hébergeur : `npm run set-site-url` (canonical, `og:url`, `og:image`, sitemap, robots, 404 à chemins absolus, retrait du `noindex`).
- ✅ Calendrier de collecte alimenté par un CSV : `npm run collectes`.
- ✅ Repli sans JavaScript (contenu visible, chiffres clés corrects) ; mobile : tableau des collectes lisible, plus de débordement de page de 320 à 1 280 px.
- ✅ `participer.html` : « pseudonymisation » au lieu d'« anonymisation ».
- ✅ Textes de l'accueil et de participer reformulés pour le grand public (étape 11 du plan), relus par l'équipe scientifique ; « métissé » au lieu de « mélangé ».
- ✅ `participer.html` décrit la participation comme elle est : don de sang à l'EFS, fonds de tube, livret, entretien, sans prélèvement supplémentaire ni inscription (à relire par l'EFS et le DPO) ; « S'inscrire » devient « Participer » sur les cinq pages.
- ✅ Politique de confidentialité du site séparée de l'information RGPD de la recherche.
- ✅ Calendrier : repère de carte (lien Google Maps, nouvel onglet) dans une quatrième colonne ; marges du tableau resserrées, jeton `--space-map-link`.
- ✅ `main` protégée (ruleset GitHub : `verify` obligatoire, suppression et poussée forcée interdites).

---

## Corrections à venir

Les corrections éditoriales sont suivies dans `PLAN_CORRECTION.md` (tableau d'avancement, étapes 2 à 6) :
le texte actuel a déjà été repris (plus de « 4 IA », « référentiel génomique réunionnais » employé),
mais chaque étape reste à valider par l'équipe projet. Restent notamment :

1. `participer.html` : dates de collecte réelles à fournir ; description du consentement à faire relire par l'EFS et le DPO.
2. `index.html` et `participer.html` : statut de chaque partenaire à confirmer ; lien du logo POPgen à ajouter.
3. `mentions-legales.html`, `confidentialite.html` : validation par le DPO, coordonnées du DPO, éditeur, directeur de la publication, durées et bases légales des e-mails ; hébergeur à renseigner (non choisi) ; retirer ensuite l'avis `.legal-todo` et les surlignages `.legal-blank`.
4. Mise en ligne : adresse définitive et hébergeur, puis `npm run set-site-url` (canonical, `og:url`, `og:image`, sitemap, robots), configuration serveur (en-têtes de sécurité, cache, déclaration de la 404) et mise à jour des redirections du dépôt `Genome-Reunion-page`.
5. Dates de collecte réelles dans `data/collectes.csv`, puis `npm run collectes`.
6. `assets/css/` : ajustements visuels uniquement après validation des contenus.

---

## Workflow de correction

Pour chaque correction :

1. partir de `main` à jour ;
2. créer une branche courte ;
3. modifier un seul sujet ;
4. créer une PR ;
5. vérifier le rendu (`npm run visual -- origin/main`) ;
6. merger seulement après validation et contrôle `verify` vert (obligatoire : `main` est protégée).

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
- `métissage`, `métissé`, `issu du métissage` ;
- `donneur de l'EFS`, `fonds de tube`, `sans prélèvement supplémentaire`.

À éviter ou à revoir :

- `génome de référence`, sauf explication ;
- `4 IA` comme argument isolé ;
- `chaque soin s'adapte enfin à vous` ;
- `le bon médicament à la bonne dose`, si formulé comme promesse immédiate ;
- `mélangé` (employer `métissé` ou `métissage`) ;
- `prélèvement sanguin` pour le projet et `inscription` (il n'y en a pas) ;
- `premier`, `première` (référentiel, référence) tant que ce n'est pas établi ;
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

- **Logo et vagues** : un seul dessin dans `assets/images/sprite.svg`, référencé par `<use href="assets/images/sprite.svg#logo">` (identifiants `logo`, `wave-1` à `wave-3`, `icon-pin` et les icônes de réseaux sociaux). Les couleurs y sont des variables CSS héritées de l'élément `<use>` : ne pas ouvrir le sprite seul. Un commentaire XML ne peut pas contenir `--`.
- **Couleurs** : `assets/css/tokens.css`. Les SVG du HTML utilisent `fill="var(--navy)"`, et le balisage SVG des animations (`gecko-svg.js`, `bird-svg.js`, `maloya-figures.js`, `maloya-svg.js`) ne porte aucune couleur : elles viennent des classes `gecko-*`, `paille-*` et `maloya-*` du CSS (pour la frise, une palette par personnage, `maloya-cast-*`). Seuls les logos des partenaires (`efs-logo.svg`, `popgen-logo.svg`), œuvres de tiers, gardent leurs couleurs.
- **Anneau des ascendances** : les pourcentages de la légende (`.ancestry-legend-pct`) sont l'unique source. Les arcs sont calculés par `donut-geometry.js` ; l'ordre des cercles du SVG doit suivre celui de la légende, et leur couleur vient de la classe `origin-<origine>` partagée avec la légende.

## Parties communes aux pages

Le site n'a pas d'étape de génération : la navigation, le pied de page, le lien d'évitement, la barre de progression, les balises de partage et les feuilles partagées sont écrits dans chaque page (accueil, participer, 404, mentions légales, confidentialité). Pour éviter qu'ils divergent :

- modifier **toutes les pages ensemble** ;
- `tooling/pages-sync.test.js` (lancé par `npm test`, le hook pré-commit et la CI) échoue si ces parties diffèrent, hors cibles des liens et libellé du lien d'action (« Participer » sur toutes les pages depuis la suppression de l'inscription) ;
- il vérifie aussi que le sprite SVG est bien formé, que chaque `<use>` a son symbole, qu'aucun dessin du sprite n'est recopié, et que chaque lien interne mène à une ancre existante.
