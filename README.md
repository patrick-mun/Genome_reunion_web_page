# Genome Reunion Web Page

Site web statique de communication pour le projet **Génome Réunion**.

Ce dépôt contient une page visuelle destinée à présenter le projet à un public non spécialiste, tout en gardant une exigence de prudence scientifique et institutionnelle.

**Hébergement :** à définir. Ce dépôt GitHub sert à la construction et à la conservation du code ; l'adresse `github.io` éventuelle n'est pas l'adresse définitive.

**Calendrier de collecte :** `npm run collectes -- fichier.csv` met à jour les tableaux de `participer.html` à partir d'un CSV exporté d'Excel (détails dans `docs/index.md`).

**Mise en ligne :** `npm run set-site-url -- https://adresse-definitive/` prépare une copie du site avec les balises `canonical` et `og:url`, `sitemap.xml`, `robots.txt` et l'image de partage `og:image`, une page 404 aux chemins absolus, et retire la balise `noindex` des sources (détails dans `docs/index.md`). Tant que le site est en préproduction, toutes les pages portent `noindex` : elles restent consultables mais ne sont pas référencées.

---

## Objectif du site

Le site doit expliquer simplement :

- pourquoi la population réunionnaise est importante pour la génomique ;
- pourquoi les référentiels mondiaux actuels représentent mal les populations admixées et ultramarines ;
- comment le projet Génome Réunion prévoit de construire un référentiel génomique local ;
- quelles applications sont envisagées pour l'interprétation des variants, la pharmacogénétique, la génétique des populations et la médecine personnalisée ;
- comment les modalités de participation seront présentées lorsque le cadre sera validé.

---

## Structure du dépôt

```text
.
├── index.html                  # Page d'accueil
├── participer.html             # Page d'information participation
├── mentions-legales.html       # Mentions légales (préremplies, à valider par le DPO)
├── confidentialite.html        # Politique de confidentialité du site (préremplie, à valider par le DPO)
├── 404.html                    # Page d'erreur (à déclarer côté serveur selon l'hébergeur)
├── favicon.ico                 # Icône du site
├── data/                       # collectes.csv : dates de collecte (npm run collectes)
├── README.md                   # Présentation du dépôt
├── package.json, .nvmrc        # Outils de vérification (Node 22)
├── tooling/, .githooks/        # Contrôles, vérification du rendu, mise en ligne (set-site-url), calendrier (collectes), hook pré-commit
├── .github/                    # Action de vérification et Dependabot
│
├── assets/                     # Ressources statiques
│   ├── css/
│   │   ├── fonts.css           # @font-face des polices hébergées (assets/fonts/)
│   │   ├── tokens.css          # Valeurs de conception (couleurs, échelles)
│   │   ├── base.css            # Reset, html, body
│   │   ├── utilities.css       # Apparition au défilement (.reveal), chargé en dernier
│   │   ├── components/         # Un fichier par composant partagé (nav, footer, vagues…)
│   │   └── pages/              # Un dossier par page, une section par fichier (home/, participer/, legal/, erreur/)
│   ├── js/
│   │   ├── pages/              # Point d'entrée par page (modules ES)
│   │   └── lib/                # Modules partagés (animations, comportements)
│   ├── fonts/                  # Polices (woff2) et licences
│   └── images/                 # Images, logos et sprite SVG (logo, vagues, icônes)
│
└── docs/                       # Documentation de travail interne
    ├── PLAN_CORRECTION.md      # Plan de correction progressive
    ├── conventions-profile.md  # Profil de conventions du projet (choix et dérogations)
    └── index.md               # Index de contexte pour reprise de travail
```

---

## Documents de suivi

Deux fichiers servent à encadrer les prochaines modifications :

- [`docs/PLAN_CORRECTION.md`](docs/PLAN_CORRECTION.md) : plan étape par étape des corrections, avec un tableau d'avancement (les étapes éditoriales restent à valider par l'équipe) ;
- [`docs/index.md`](docs/index.md) : résumé opérationnel du contexte, des fichiers et des points sensibles.

Ces fichiers doivent être consultés avant toute modification importante.

---

## Méthode de travail

Les corrections doivent être faites progressivement.

Règle principale :

> Une correction = une branche = une PR = un rendu vérifiable.

Le JavaScript et la qualité du code sont traités. Restent, dans cet ordre, les étapes éditoriales
à valider par l'équipe projet (détail dans [`docs/PLAN_CORRECTION.md`](docs/PLAN_CORRECTION.md)) :

1. Valider le bloc des chiffres clés.
2. Valider les formulations médicales.
3. Valider le vocabulaire scientifique.
4. Sécuriser la page participation : vraies dates de collecte dans `data/collectes.csv` puis `npm run collectes` (les dates actuelles sont fictives), et relecture par l'EFS et le DPO de la description du consentement (il n'y a pas d'inscription : la participation passe par le don de sang à l'EFS).
5. Confirmer les partenaires et statuts institutionnels.
6. Faire valider par le DPO les pages légales (mentions légales, confidentialité), renseigner l'hébergeur, puis retirer l'avis de validation et les surlignages.

---

## Installation locale

Le site est statique, sans étape de génération. Ses scripts sont des modules ES : il doit être servi
par HTTP (voir ci-dessous), l'ouverture directe du fichier (`file://`) ne charge pas le JavaScript.

Pour récupérer le dépôt :

```bash
git clone https://github.com/patrick-mun/Genome_reunion_web_page.git
cd Genome_reunion_web_page
```

Pour mettre à jour une copie locale :

```bash
git checkout main
git pull origin main
```

---

## Visualisation locale simple

Lancer un serveur local depuis la racine du dépôt (les modules ES ne se chargent pas en `file://`) :

```bash
python -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000
```

---

## Points de vigilance rédactionnelle

Avant diffusion externe, vérifier :

- le statut réel des partenaires ;
- l'adresse de contact officielle ;
- les formulations liées à l'EFS et aux collectes ;
- la description de la participation (donneurs de l'EFS, fonds de tube, livret, entretien avec le médecin, accord du donneur), à faire relire par l'EFS et le DPO ;
- la conformité des pages de participation avec le cadre éthique, RGPD et hospitalier ;
- les promesses médicales, qui doivent rester prudentes ;
- l'usage du terme `IA`, qui doit être explicité ou remplacé par une formulation plus institutionnelle.

---

## Vocabulaire recommandé

À privilégier :

- `référentiel génomique réunionnais` ;
- `base locale de fréquences de variants` ;
- `ressource génomique dédiée à la population réunionnaise` ;
- `modules d'aide à l'analyse clinique` ;
- `métissage`, `métissé`, `issu du métissage` ;
- `donneur de l'EFS`, `fonds de tube` (ce qui reste dans les tubes après les analyses habituelles), `sans prélèvement supplémentaire` ;
- `pseudonymisation` : l'EFS attribue un code et garde seul le lien avec l'identité.

À éviter sans précision :

- `génome de référence` ;
- `4 IA` ;
- `anonymisation` pour les données des participants (elles sont pseudonymisées) ;
- `mélangé` (employer `métissé` ou `métissage`) ;
- `prélèvement sanguin` pour le projet et `inscription` : le projet utilise les fonds de tube des analyses de l'EFS, sans prélèvement supplémentaire ni inscription ;
- `premier`, `première` (référentiel, référence) tant que ce n'est pas établi ;
- promesses directes de bénéfice clinique individuel ;
- dates de collecte non confirmées ;
- partenaires présentés comme acquis sans convention.

---

## État actuel

Le code est conforme aux conventions du skill `web-code-conventions` (profil : [`docs/conventions-profile.md`](docs/conventions-profile.md)) et vérifié automatiquement (voir ci-dessous). Les étapes éditoriales restent à valider par l'équipe projet ; chaque correction est menée dans sa propre PR, avec vérification du rendu.

## Contrôles qualité

Les conventions de code (CSS, HTML, JS) sont vérifiées automatiquement.

```bash
npm ci               # installe les outils et active le hook pré-commit (Node 22, voir .nvmrc)
npm run verify       # lint + formatage + tests (ce que lance le hook)
npm run lint         # Stylelint, html-validate, ESLint, contrôles HTML et classes CSS inutilisées
npm run format       # reformate avec Prettier
npm test             # tests unitaires (node --test)
npm run visual       # compare le rendu de la copie de travail à HEAD (voir ci-dessous)
npm run collectes    # met à jour le calendrier de participer.html depuis data/collectes.csv
npm run set-site-url # prépare la copie de production pour l'adresse définitive
```

**Vérification du rendu** (`tooling/visual-check.mjs`, hors CI) : extrait une version de référence
dans un dossier temporaire, sert les deux versions en HTTP et compare, pour chaque page, les
captures pleine page et les styles calculés à 1280, 820 et 390 px, les propriétés de mouvement
(transitions, animations, calques) et les états survol, clic et focus. Code de sortie 1 en cas
d'écart ; les captures différentes sont enregistrées dans `visual-check-output/` (ignoré par git). Une page absente de la référence (page nouvelle) est signalée, pas comparée.

```bash
npm run visual                    # copie de travail comparée au dernier commit (HEAD)
npm run visual -- main            # branche courante comparée à main
npm run visual -- main --browser "/chemin/vers/chrome"   # autre navigateur Chromium
```

Il utilise Google Chrome installé sur la machine (`playwright-core` ne télécharge aucun
navigateur) ; sinon passer `--browser <chemin>` ou la variable `VISUAL_BROWSER`. Firefox et Safari
ne sont pas couverts. Compter environ deux minutes.

- **Avant chaque commit** : `.githooks/pre-commit` lance `npm run verify` (pas `npm run visual`, trop lent). Contournement ponctuel : `git commit --no-verify`.
- **Sur GitHub** : l'action `.github/workflows/verify.yml` lance les mêmes contrôles à chaque pull request et à chaque push sur `main`.
- **Dépendances** : Dependabot propose chaque semaine une PR groupée pour les outils de vérification, validée par la CI. Aucune dépendance n'est livrée avec le site (0 vulnérabilité en production). `npm audit` signale 9 alertes sur la chaîne Stylelint (`braces`, dépendance transitive de développement) : aucun correctif n'est publié, et Stylelint n'analyse que nos propres fichiers.
- **Protection de `main`** (réglage du dépôt GitHub, pas dans le code) : un « ruleset » interdit la suppression de `main` et les poussées forcées, et exige le contrôle `verify` vert avant fusion, sans obligation de mettre la branche à jour (relevé le 13 octobre 2026 par l'API publique ; la liste des contournements n'y est pas visible).
