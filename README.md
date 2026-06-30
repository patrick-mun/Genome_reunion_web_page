# Genome Reunion Web Page

Site web statique de communication pour le projet **Génome Réunion**.

Ce dépôt contient une page visuelle destinée à présenter le projet à un public non spécialiste, tout en gardant une exigence de prudence scientifique et institutionnelle.

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
├── README.md                   # Présentation du dépôt
│
├── assets/                     # Ressources statiques
│   ├── css/
│   │   └── styles.css          # Styles principaux
│   ├── js/
│   │   ├── script.js           # Animations et comportements communs
│   │   └── paille-en-queue.js  # Animation décorative du hero
│   └── images/                 # Images et logos
│
└── docs/                       # Documentation de travail interne
    ├── PLAN_CORRECTION.md      # Plan de correction progressive
    └── index.md               # Index de contexte pour reprise de travail
```

---

## Documents de suivi

Deux fichiers servent à encadrer les prochaines modifications :

- [`docs/PLAN_CORRECTION.md`](docs/PLAN_CORRECTION.md) : plan étape par étape des corrections à réaliser ;
- [`docs/index.md`](docs/index.md) : résumé opérationnel du contexte, des fichiers et des points sensibles.

Ces fichiers doivent être consultés avant toute modification importante.

---

## Méthode de travail

Les corrections doivent être faites progressivement.

Règle principale :

> Une correction = une branche = une PR = un rendu vérifiable.

Ordre recommandé :

1. Corriger le JavaScript sans changer le rendu.
2. Corriger le bloc des chiffres clés.
3. Adoucir les formulations médicales trop fortes.
4. Stabiliser le vocabulaire scientifique.
5. Sécuriser la page participation.
6. Corriger les partenaires et statuts institutionnels.
7. Ajuster le rendu visuel si nécessaire.

---

## Installation locale

Le site est statique. Il peut être ouvert directement dans un navigateur.

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

Option directe : ouvrir `index.html` dans le navigateur.

Option avec serveur local Python :

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
- `modalités de participation à confirmer`.

À éviter sans précision :

- `génome de référence` ;
- `4 IA` ;
- promesses directes de bénéfice clinique individuel ;
- dates de collecte non confirmées ;
- partenaires présentés comme acquis sans convention.

---

## État actuel

Le dépôt a été restauré sur `main` après une correction globale trop rapide. Les prochaines corrections doivent donc être menées étape par étape, avec validation visuelle après chaque PR.
