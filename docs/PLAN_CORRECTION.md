# Plan de correction progressif — Genome Reunion Web Page

## Objectif

Corriger la page de communication **Génome Réunion** sans perdre le contrôle visuel du rendu.

La règle de travail est simple : **une correction = une petite branche ou une petite PR = un rendu vérifiable**.

Ce document sert de plan de correction. Le fichier `index.md` sert de contexte de reprise pour comprendre rapidement le dépôt, les fichiers importants et les décisions prises.

> **Mise à jour du 16 octobre 2026.** Les étapes techniques (0, 1, 7) sont réalisées, ainsi que la préparation de la mise en ligne côté code (étapes 9 et 10). Les étapes éditoriales (2 à 6) et la validation des pages légales (étape 9) concernent le **contenu** : elles relèvent de l'équipe projet et du DPO, et l'état indiqué est un constat sur le texte actuel, pas une validation. L'hébergement final n'est pas choisi : ce dépôt GitHub sert à la construction et à la conservation du code. Depuis le 14 octobre : les textes de l'accueil et de participer ont été reformulés pour le grand public (étape 11), la page participer décrit la participation comme un don de sang à l'EFS dont les fonds de tube sont utilisés, sans prélèvement supplémentaire ni inscription (étape 12, à relire par l'EFS et le DPO), et la politique de confidentialité du site ne traite plus de la recherche.

---

## État de départ

Le dépôt a été restauré sur `main` après une correction globale trop rapide. L'objectif est maintenant de reprendre les améliorations avec une méthode progressive.

L'état visuel actuel doit être considéré comme le **rendu de référence initial**. Toute modification devra pouvoir être comparée à cet état.

---

## État d'avancement

| Étape | Sujet                                | Statut                               | Constat                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Documentation de travail             | Fait                                 | `README.md`, `docs/index.md`, `docs/conventions-profile.md` à jour                                                                                                                                                                                                                                                                                                                        |
| 1     | JavaScript multi-pages               | Fait                                 | `script.js` n'existe plus : un module par comportement dans `assets/js/lib/`, chacun vérifie ses éléments                                                                                                                                                                                                                                                                                 |
| 2     | Chiffres clés                        | À valider                            | « 4 IA » n'apparaît plus (« Quatre modules d'aide à l'analyse ») ; libellés au futur : « participants à analyser sur puce SNP », « familles pour étudier la transmission de l'ADN », « génomes à séquencer en entier (WGS) » (analyses, familles et génomes à réaliser)                                                                                                                   |
| 3     | Formulations médicales               | À valider                            | les trois passages cités ne figurent plus dans `index.html`                                                                                                                                                                                                                                                                                                                               |
| 4     | Vocabulaire scientifique             | À valider                            | « référentiel génomique réunionnais » employé ; « génome de référence » absent                                                                                                                                                                                                                                                                                                            |
| 5     | Page participation                   | À valider                            | décrite selon le déroulé réel (don de sang à l'EFS, fonds de tube, livret, entretien, sans prélèvement supplémentaire ni inscription) ; bouton « Trouver une collecte » ; dates de collecte toujours fictives : `npm run collectes` les met à jour depuis `data/collectes.csv` (vraies dates à fournir) ; à relire par l'EFS et le DPO ; « pseudonymisation » au lieu d'« anonymisation » |
| 6     | Partenaires et gouvernance           | À valider                            | statut de chaque partenaire à confirmer (EFS indiqué comme confirmé dans `docs/index.md`)                                                                                                                                                                                                                                                                                                 |
| 7     | Accessibilité et qualité web         | Fait côté code                       | meta description, contrastes AA, repères et listes sémantiques, `lang`, favicon, plus de style inline ni de lien mort, repli sans JavaScript, débordements mobile corrigés (320 à 1 280 px)                                                                                                                                                                                               |
| 8     | README et documentation de diffusion | En cours                             | à finaliser quand le contenu est validé                                                                                                                                                                                                                                                                                                                                                   |
| 9     | Pages légales et RGPD                | Préremplies, à valider par le DPO    | mentions légales et politique de confidentialité du site dans `main` (préproduction), passages à compléter surlignés ; hébergeur, DPO, bases légales et durées des e-mails à fournir                                                                                                                                                                                                      |
| 10    | Mise en ligne (SEO, hébergeur)       | Préparée côté code                   | `noindex` en préproduction, balises de partage, image de partage, 404, `npm run set-site-url` ; hébergeur et adresse définitive à choisir                                                                                                                                                                                                                                                 |
| 11    | Textes accessibles au grand public   | Fait, relu par l'équipe scientifique | accueil (en-tête, chiffres clés, problème, change, carrefour, méthode, outils, équipe) et participer (partenariat) reformulés ; relus et validés le 16 octobre 2026 ; essais Safari et téléphone sans problème, Firefox non testé                                                                                                                                                         |
| 12    | Participation : don de sang à l'EFS  | Fait, à relire par l'EFS et le DPO   | `participer.html` sans prélèvement ni inscription ; politique de confidentialité du site séparée de la recherche ; repère de carte dans le calendrier                                                                                                                                                                                                                                     |

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
- `docs/PLAN_CORRECTION.md`
- `docs/index.md`

Impact visuel : aucun.

Statut : fait.

---

### Étape 1 — Correction JavaScript invisible

> **Fait.** `script.js` a été remplacé par des modules ES (`assets/js/pages/`, `assets/js/lib/`) qui testent chacun l'existence de leurs éléments. Le texte ci-dessous est conservé comme historique.

**Objectif :** éviter que `script.js` plante sur les pages qui ne contiennent pas toutes les sections de la page d'accueil.

Problème identifié :

- `script.js` utilise `document.getElementById('hero')` et d'autres éléments liés à la page d'accueil.
- Sur `participer.html`, certains éléments peuvent être absents.
- Le script doit vérifier l'existence des éléments avant d'appliquer les animations.

Fichiers concernés (à l'époque) :

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
- il n'y a pas d'inscription : ne pas réintroduire de réservation, de convocation ni de formulaire ;
- décrire la participation comme elle est : don de sang à l'EFS, fonds de tube utilisés avec l'accord du donneur, sans prélèvement supplémentaire ;
- le partenariat EFS ne doit pas être formulé comme définitivement opérationnel si la convention n'est pas signée.

État (octobre 2026) : les dates affichées restent fictives. `npm run collectes` remplace le contenu des deux tableaux à partir d'un CSV exporté d'Excel (`data/collectes.csv`) ; il manque les vraies dates. L'appel « Je m'inscris » est remplacé par « Trouver une collecte » (voir l'étape 12).

Approche retenue :

- conserver la structure visuelle ;
- garder le calendrier, présenté comme celui des collectes de dons de sang de l'EFS ;
- remplacer le CTA `Je m'inscris` par un lien vers le calendrier.

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

> **Fait côté code** (octobre 2026) : meta description, contrastes WCAG AA mesurés, repères `header`/`main`, listes et titres sémantiques, `lang`, favicon, styles inline supprimés, liens internes vérifiés. Voir `docs/conventions-profile.md`.

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
- `assets/css/` (anciennement `styles.css`)
- `assets/js/` (anciennement `script.js`)

Impact visuel attendu : faible.

---

### Étape 8 — README final et documentation de diffusion

**Objectif :** mettre à jour la documentation quand le rendu final est validé.

Fichiers concernés :

- `README.md`
- `docs/PLAN_CORRECTION.md`
- `docs/index.md`

Impact visuel : aucun.

### Étape 9 — Pages légales et RGPD

**Objectif :** publier des mentions légales et une politique de confidentialité justes, centrées sur l'usage du site.

État (octobre 2026) : `mentions-legales.html` et `confidentialite.html` sont dans `main`, préremplies à partir du dossier MR-004 (éditeur, hébergeur, responsable de traitement, droits, cookies). La politique est celle d'un site web ordinaire : elle ne traite que le site (visite, e-mails reçus, hébergeur, cookies, droits). La recherche a sa propre information RGPD, remise aux donneurs par l'EFS ; elle ne figure plus sur le site, ni en renvoi.

À faire avec le DPO : coordonnées du DPO, éditeur, directeur de la publication, finalité, base légale et durée de conservation des e-mails, hébergeur (non choisi), puis retirer l'avis de validation (`.legal-todo`) et les surlignages (`.legal-blank`).

Fichiers concernés :

- `mentions-legales.html`
- `confidentialite.html`
- `assets/css/pages/legal/legal.css`

Impact visuel : limité à ces deux pages.

---

### Étape 10 — Mise en ligne (SEO, hébergeur)

**Objectif :** préparer le passage de la préproduction à l'adresse définitive sans réécrire les pages.

État (octobre 2026) : les sources ne contiennent aucune adresse absolue et portent `noindex`. `npm run set-site-url -- <adresse>` produit une copie prête à déployer (canonical, `og:url`, `og:image`, sitemap, robots, 404 à chemins absolus, retrait du `noindex`).

À faire : choisir l'hébergeur et l'adresse, lancer la commande, configurer le serveur (en-têtes de sécurité, cache, déclaration de la 404), renseigner l'hébergeur dans les pages légales, mettre à jour les redirections du dépôt `Genome-Reunion-page` (QR code du livret donneur).

Fichiers concernés :

- `tooling/set-site-url.mjs`, `tooling/site-url.js`
- `404.html`, `assets/images/partage.png`

Impact visuel : aucun.

---

### Étape 11 — Textes accessibles au grand public

**Objectif :** rendre les textes lisibles par un public non spécialiste (phrases plus courtes, terme technique expliqué à sa première apparition), sans changer le fond scientifique ni promettre de bénéfice médical.

État (16 octobre 2026) : le bloc des chiffres clés et les sections `hero`, `probleme`, `change`, `carrefour`, `methode`, `outils` et `equipe` de `index.html`, et `partenariat` de `participer.html`, ont été reformulées (PR 61, 62 et 63, puis le bloc des chiffres clés). Les reformulations, définitions comprises, ont été relues et validées par l'équipe scientifique. Le site a été essayé sur Safari et sur téléphone sans problème (avant l'ajout du repère de carte, étape 12) ; Firefox n'a pas été testé. Le 19 octobre, les chiffres clés et la méthode ont été mis au futur : les 2 500 analyses sur puce SNP, les 100 familles et les 350 génomes (WGS) sont à réaliser, pas faits.

Règles retenues :

- langage clair : phrases courtes, un terme technique expliqué à sa première apparition, sans passer en FALC strict ;
- explications intégrées au texte (pas d'info-bulle ni de glossaire) : lisible au clavier et sur mobile ;
- vocabulaire : « métissage », « métissé » et « issu du métissage » (et non « mélangé ») ; « pseudonymisé » (et non « anonymisé ») ;
- une section = un commit ; un avant/après validé avant chaque modification.

Mesure indicative : formule de Kandel et Moles adaptée au français, comptage de syllabes approximatif, échantillons courts, donc pas une validation. Facilité (plus elle est basse, plus c'est difficile ; 60 et plus : accessible) : `outils` 19 → 31, `probleme` 26 → 39, `methode` 30 → 49, `change` 45 → 52, `partenariat` 38 → 43. Aucun outil de mesure n'est dans le dépôt.

Reste à traiter :

- modules d'aide à l'analyse (« 4 modules », section « Ce que ça permet ») : existent-ils déjà ou sont-ils à développer ? Le texte est à vérifier de la même façon que les chiffres clés ;
- devise du pied de page (« Le premier référentiel génomique dédié à la population réunionnaise », cinq pages) : « premier » est-il établi ? ;
- « Zarabe / Gujarati » dans la légende de l'anneau : explication à fournir ;
- pages légales : registre juridique, validation par le DPO ; cohérence de la pseudonymisation avec `partenariat`.

Fichiers concernés :

- `index.html`
- `participer.html`

Impact visuel : accueil plus haut d'environ 200 px sur ordinateur et 520 px sur mobile ; participer inchangé en hauteur.

---

### Étape 12 — Participation : don de sang à l'EFS, sans inscription

**Objectif :** que `participer.html` décrive la participation comme elle est, et que la politique de confidentialité du site ne traite que du site.

État (16 octobre 2026) : les participants sont, dans un premier temps, des donneurs de l'EFS. Il n'y a ni prélèvement supplémentaire ni inscription : avec l'accord du donneur, les fonds de tube des analyses faites par l'EFS sont utilisés pour ce programme de recherche. Un livret explicatif est remis à l'arrivée ; lors de l'entretien, le médecin de l'EFS répond aux questions et recueille l'accord. La page (bandeau, description, partenariat, calendrier, trois étapes, bouton « Trouver une collecte ») et l'appel final de l'accueil sont réécrits en ce sens (PR 66) ; « S'inscrire » devient « Participer » sur les cinq pages. La politique de confidentialité ne traite plus de la recherche, qui a sa propre information RGPD remise par l'EFS (PR 67). Les adresses du calendrier ont un repère de carte, lien vers Google Maps ouvert dans un nouvel onglet, au bleu du hero (PR 68 et 69) ; la page ne charge aucun service tiers, Google n'étant contacté qu'au clic.

À faire avec l'EFS et le DPO : relire la description du consentement (fonds de tube, livret, entretien, « sans prélèvement supplémentaire », « sans inscription ») pour qu'elle corresponde à ce que les donneurs reçoivent. Dates de collecte réelles à fournir.

Fichiers concernés :

- `participer.html`, `index.html` (appel final)
- `confidentialite.html`, `mentions-legales.html`
- `tooling/collectes.js`, `assets/css/pages/participer/collectes.css`, `assets/images/sprite.svg`

Impact visuel : participer environ 170 px plus haut sur ordinateur et 300 px sur mobile (textes plus complets, repère de carte compris) ; politique de confidentialité plus courte (environ 285 px sur ordinateur, 500 px sur mobile).

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
2. tester localement (`npm run verify` : lint, formatage et tests, lancés aussi par le hook pré-commit et la CI) ;
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
- Relecture par l'EFS et le DPO de la description du consentement sur la page participation (fonds de tube, livret, entretien, « sans prélèvement supplémentaire », « sans inscription »).
- La devise du pied de page (« Le premier référentiel génomique dédié à la population réunionnaise ») : « premier » est-il établi ?
- Explication de « Zarabe / Gujarati » dans la légende de l'anneau.
- Hébergeur et adresse définitive du site.
- Coordonnées du DPO, éditeur et directeur de la publication, bases légales et durées de conservation des e-mails reçus.
- Dates de collecte réelles (`data/collectes.csv`) et URL du logo POPgen.

---

## Règle de sécurité rédactionnelle

Le site peut être ambitieux visuellement, mais le texte doit rester prudent :

- ne pas promettre un bénéfice clinique individuel immédiat ;
- ne pas annoncer une collecte opérationnelle non validée ;
- ne pas parler de prélèvement ni d'inscription pour le projet : la participation passe par le don de sang à l'EFS, sans démarche ni prélèvement supplémentaire ;
- ne pas présenter des partenaires comme officiellement engagés sans convention ;
- ne pas confondre référentiel local et génome humain de référence ;
- ne pas utiliser `IA` comme argument principal sans expliquer qu'il s'agit de modules d'aide à l'analyse.
