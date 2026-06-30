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
│   ├── css/styles.css          # Styles principaux
│   ├── js/script.js            # Animations et comportements communs
│   ├── js/paille-en-queue.js   # Animation décorative du hero (oiseau)
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

### `assets/css/styles.css`

Feuille de style principale.

Contient :

- variables de couleurs (tokens CSS dans `:root`) ;
- typographies (Spectral, DM Sans, Space Grotesk) ;
- navigation ;
- hero ;
- sections ;
- cartes ;
- responsive ;
- animations CSS.

Règle : ne pas modifier les styles tant que les corrections textuelles ne sont pas validées visuellement.

---

### `assets/js/script.js`

Script commun aux deux pages.

Contient :

- barre de progression au scroll ;
- changement de style de navigation au scroll ;
- animations d'apparition au scroll (`.reveal`) ;
- compteurs statistiques animés ;
- légende du donut (injection des marqueurs de couleur) ;
- parallaxe souris sur le hero ;
- animation du donut chart au scroll.

Toutes les fonctions sont gardées (`if (el)`) et fonctionnent sans erreur sur `participer.html`.

---

### `assets/js/paille-en-queue.js`

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
