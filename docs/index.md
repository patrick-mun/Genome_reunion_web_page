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
- présentation du partenariat EFS ;
- calendrier de collecte ;
- étapes d'inscription ;
- contact par email.

Points sensibles :

- les dates de collecte peuvent être fictives ou non validées ;
- l'inscription ne doit pas être présentée comme ouverte si ce n'est pas officiellement le cas ;
- éviter de promettre un bilan sanguin complet si cela n'est pas validé ;
- le partenariat EFS doit être formulé selon le statut réel de la convention.

---

### `assets/css/styles.css`

Feuille de style principale.

Contient :

- variables de couleurs ;
- typographies ;
- navigation ;
- hero ;
- sections ;
- cartes ;
- responsive ;
- animations CSS.

Règle : ne pas modifier les styles tant que les corrections textuelles ne sont pas validées visuellement.

---

### `assets/js/script.js`

Script commun du site.

Contient :

- barre de progression ;
- changement de style de navigation au scroll ;
- animations d'apparition ;
- compteurs statistiques ;
- légende du donut ;
- parallaxe du hero ;
- animation du donut chart.

Point technique identifié :

- certaines fonctions supposent la présence de `#hero` et d'éléments spécifiques à `index.html` ;
- il faut ajouter des gardes JavaScript pour éviter les erreurs sur `participer.html`.

---

### `assets/images/efs-logo.svg`

Logo EFS SVG utilisé dans la page participation.

Point d'attention :

- ne pas modifier sans vérifier le rendu ;
- le logo a déjà fait l'objet d'une correction de positionnement.

---

## Documents de pilotage

### `PLAN_CORRECTION.md`

Plan général de correction progressive.

Il définit :

- les étapes ;
- les fichiers concernés ;
- les risques ;
- l'ordre recommandé des PR.

### `index.md`

Présent fichier.

Il sert de résumé opérationnel pour reprendre rapidement le contexte.

---

## État actuel après restauration

La branche `main` a été restaurée après une correction globale trop rapide.

But actuel : reprendre avec des micro-corrections contrôlées.

La première vraie correction à faire après cette documentation est :

> Étape 1 — corriger `script.js` pour éviter les erreurs sur les pages sans `#hero`, sans changer le rendu visuel.

---

## Workflow imposé pour les corrections suivantes

Pour chaque correction :

1. partir de `main` ;
2. créer une branche courte ;
3. modifier un seul sujet ;
4. créer une PR ;
5. vérifier le rendu ;
6. merger seulement après validation.

Exemple :

```bash
git checkout main
git pull origin main
git checkout -b correction-etape-1-js
```

---

## Liste courte des corrections à venir

1. `script.js` : ajouter des gardes sans modifier le rendu.
2. `index.html` : remplacer `4 IA` par une formulation plus institutionnelle.
3. `index.html` : adoucir les promesses médicales trop fortes.
4. `index.html` : stabiliser le vocabulaire autour de `référentiel génomique réunionnais`.
5. `participer.html` : sécuriser les dates, l'inscription et les promesses de bilan.
6. `index.html` / `participer.html` : corriger les partenaires selon les conventions réelles.
7. `styles.css` : ajustements visuels seulement après validation des contenus.

---

## Formulations recommandées

À privilégier :

- `référentiel génomique réunionnais` ;
- `base locale de fréquences de variants` ;
- `ressource génomique dédiée à la population réunionnaise` ;
- `modules d'aide à l'analyse clinique` ;
- `collaborations en cours de structuration` ;
- `modalités de participation à confirmer`.

À éviter ou à revoir :

- `génome de référence`, sauf explication ;
- `4 IA` comme argument isolé ;
- `chaque soin s'adapte enfin à vous` ;
- `le bon médicament à la bonne dose`, si formulé comme promesse immédiate ;
- dates ou lieux de collecte non confirmés ;
- partenaires présentés comme officiellement acquis sans convention.

---

## Règle de rendu visuel

Le rendu actuel doit rester la référence tant que l'utilisateur n'a pas validé une correction.

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

Pour voir les branches :

```bash
git branch -a
```
