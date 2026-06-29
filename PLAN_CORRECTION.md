# Plan de correction progressif — Genome Reunion Web Page

## Objectif

Corriger la page de communication **Génome Réunion** sans perdre le contrôle visuel du rendu.

La règle de travail est simple : **une correction = une petite branche ou une petite PR = un rendu vérifiable**.

Ce document sert de plan de correction. Le fichier `index.md` sert de contexte de reprise pour comprendre rapidement le dépôt, les fichiers importants et les décisions prises.

---

## État de départ

Le dépôt a été restauré sur `main` après une correction globale trop rapide. L'objectif est maintenant de reprendre les améliorations avec une méthode progressive.

L'état visuel actuel doit être considéré comme le **rendu de référence initial**. Toute modification devra pouvoir être comparée à cet état.

---

## Principes de correction

1. Ne pas modifier plusieurs sujets en même temps.
2. Ne pas mélanger correction de code, correction de texte et correction graphique dans un même commit.
3. Garder le site fonctionnel après chaque étape.
4. Créer des PR courtes, faciles à relire.
5. Tester visuellement le rendu après chaque PR.
6. Documenter les corrections importantes dans ce fichier ou dans `index.md`.

---

## Ordre recommandé des corrections

### Étape 0 — Documentation de travail

**Objectif :** créer le cadre de correction.

Fichiers concernés :

- `README.md`
- `PLAN_CORRECTION.md`
- `index.md`

Impact visuel : aucun.

Statut : en cours.

---

### Étape 1 — Correction JavaScript invisible

**Objectif :** éviter que `script.js` plante sur les pages qui ne contiennent pas toutes les sections de la page d'accueil.

Problème identifié :

- `script.js` utilise `document.getElementById('hero')` et d'autres éléments liés à la page d'accueil.
- Sur `participer.html`, certains éléments peuvent être absents.
- Le script doit vérifier l'existence des éléments avant d'appliquer les animations.

Fichiers concernés :

- `script.js`

Impact visuel attendu : aucun.

Critère de validation :

- `index.html` continue de s'animer normalement.
- `participer.html` ne génère pas d'erreur JavaScript visible dans la console.

---

### Étape 2 — Correction du bloc des chiffres clés

**Objectif :** rendre les chiffres clés plus institutionnels sans modifier la mise en page.

Corrections envisagées :

- remplacer `4 IA` par `4 modules` ou `4 modules d'aide à l'analyse` ;
- préciser que les 350 génomes sont des WGS sélectionnés ;
- clarifier le rôle des 100 familles si elles sont conservées dans la communication publique.

Fichiers concernés :

- `index.html`

Impact visuel attendu : faible, limité au texte.

Critère de validation :

- la barre de statistiques conserve son équilibre graphique ;
- aucun chiffre ne donne une impression de promesse clinique excessive.

---

### Étape 3 — Correction des formulations médicales trop fortes

**Objectif :** conserver la force du message tout en évitant les promesses trop directes.

Passages à revoir :

- `Un médicament dosé pour un Européen peut être trop fort ou insuffisant...`
- `pour que chaque soin s'adapte enfin à vous`
- `Votre risque de diabète ou d'hypertension... peut ne pas vous correspondre du tout`

Orientation :

- parler de documentation, d'interprétation, d'aide à l'analyse ;
- éviter les formulations qui promettent directement un bénéfice individuel immédiat ;
- garder un langage compréhensible pour le grand public.

Fichiers concernés :

- `index.html`

Impact visuel attendu : faible à modéré, selon longueur des textes.

---

### Étape 4 — Stabilisation du vocabulaire scientifique

**Objectif :** éviter les confusions entre :

- génome de référence au sens GRCh/pangénome ;
- référentiel génomique local ;
- base de fréquences locale ;
- cohorte de référence.

Formulation recommandée :

- `référentiel génomique réunionnais` ;
- `base locale de fréquences de variants` ;
- `ressource génomique dédiée à la population réunionnaise`.

Fichiers concernés :

- `index.html`
- `participer.html`
- `README.md` si nécessaire

Impact visuel attendu : faible.

---

### Étape 5 — Page participation

**Objectif :** sécuriser la page `participer.html` sans casser son intérêt visuel.

Points à vérifier :

- les dates de collecte ne doivent pas être fictives ;
- l'inscription ne doit pas être présentée comme ouverte si elle ne l'est pas ;
- le partenariat EFS ne doit pas être formulé comme définitivement opérationnel si la convention n'est pas signée ;
- éviter la promesse d'un bilan sanguin complet si ce point n'est pas validé.

Approche proposée :

- conserver la structure visuelle ;
- remplacer les dates par un bloc `calendrier à venir` ou `modalités en cours de validation` ;
- remplacer le CTA `Je m'inscris` par `Être informé` ou `Contacter l'équipe projet` si nécessaire.

Fichiers concernés :

- `participer.html`

Impact visuel attendu : modéré.

---

### Étape 6 — Partenaires et gouvernance

**Objectif :** éviter d'annoncer comme acquis ce qui dépend de conventions, financements ou validations institutionnelles.

Points à revoir :

- EFS ;
- CRB ;
- Université de La Réunion ;
- POPgen ;
- Région Réunion ;
- CHU de La Réunion.

Formulations possibles :

- `partenaires pressentis` ;
- `collaborations en cours de structuration` ;
- `partenaires à confirmer selon conventions et financements`.

Fichiers concernés :

- `index.html`
- `participer.html`

Impact visuel attendu : faible.

---

### Étape 7 — Accessibilité et qualité web

**Objectif :** améliorer la robustesse du site sans modifier fortement le design.

Actions possibles :

- ajouter les balises `meta description` ;
- vérifier les `alt` des images ;
- vérifier les contrastes ;
- vérifier le rendu mobile ;
- limiter les styles inline lorsqu'ils gênent la maintenance ;
- vérifier que les liens internes fonctionnent.

Fichiers concernés :

- `index.html`
- `participer.html`
- `styles.css`
- `script.js`

Impact visuel attendu : faible.

---

### Étape 8 — README final et documentation de diffusion

**Objectif :** mettre à jour la documentation quand le rendu final est validé.

Fichiers concernés :

- `README.md`
- `PLAN_CORRECTION.md`
- `index.md`

Impact visuel : aucun.

---

## Workflow recommandé

Pour chaque étape :

```bash
git checkout main
git pull origin main
git checkout -b correction-etape-X-description
```

Puis :

1. modifier uniquement les fichiers nécessaires ;
2. tester localement ;
3. créer une PR ;
4. vérifier le rendu ;
5. merger seulement si le rendu est accepté.

---

## Commandes locales utiles

```bash
git status
git branch
git pull origin main
git checkout main
git checkout -b correction-etape-1-js
git add .
git commit -m "Fix script guards without visual change"
git push origin correction-etape-1-js
```

---

## Décisions à confirmer avant diffusion externe

- Statut exact du partenariat EFS.
- Adresse de contact officielle.
- Statut des financements ou demandes FEDER.
- Liste validée des partenaires.
- Niveau de formulation accepté par la communication institutionnelle.
- Mention éthique/RGPD à intégrer dans la page participation.
- Existence ou non d'un formulaire d'inscription officiel.

---

## Règle de sécurité rédactionnelle

Le site peut être ambitieux visuellement, mais le texte doit rester prudent :

- ne pas promettre un bénéfice clinique individuel immédiat ;
- ne pas annoncer une collecte opérationnelle non validée ;
- ne pas présenter des partenaires comme officiellement engagés sans convention ;
- ne pas confondre référentiel local et génome humain de référence ;
- ne pas utiliser `IA` comme argument principal sans expliquer qu'il s'agit de modules d'aide à l'analyse.
