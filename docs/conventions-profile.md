# Profil de conventions du projet — Génome Réunion

Lu en premier par le skill `web-code-conventions`. Il contient les choix du
projet ; les règles du skill s'appliquent pour tout ce qui n'est pas dérogé ici.

## Version du skill

`web-code-conventions` : version courante (non publiée, sans tag)

## Outils

Commande de contrôle lancée avant chaque commit : `npm run verify` (lint, formatage, tests), par le hook `.githooks/pre-commit` installé par `npm ci`, et par la GitHub Action `.github/workflows/verify.yml` à chaque pull request et push sur `main`.
`npm run lint` regroupe Stylelint, html-validate, ESLint, `check-html.mjs` et `check-dead-code.mjs`. Formatage : `npm run format` ; tests : `npm test`.

Les versions installées sont figées dans `package-lock.json`.

## Organisation du JS (JS-02)

| Rôle                    | Chemin             |
| ----------------------- | ------------------ |
| Point d'entrée par page | `assets/js/pages/` |
| Modules partagés        | `assets/js/lib/`   |

## Titre de page (HTML-02)

Format du `<title>` : `Page — Génome Réunion` (la page d'accueil : `Génome Réunion`).

## Fichier de tokens

Valeurs de conception : `assets/css/tokens.css` (seul fichier où les valeurs brutes sont permises).

## Organisation des fichiers (CSS-02)

| Rôle                                    | Chemin                     |
| --------------------------------------- | -------------------------- |
| Tokens (valeurs uniquement)             | `assets/css/tokens.css`    |
| Base (reset, base, layout, utilitaires) | `assets/css/base.css`      |
| Composants (un fichier par composant)   | `assets/css/components/`   |
| Pages (un fichier par page)             | `assets/css/pages/`        |
| Page découpée par section (accueil)     | `assets/css/pages/home/`   |
| Utilitaires (chargés en dernier)        | `assets/css/utilities.css` |

## Sens des media queries (CSS-05)

`max-width`. Point de rupture actuel : 900 px (à confirmer d'après le contenu
lors de l'éclatement des media queries).

## Échelle d'espacement (CSS-11)

4, 8, 12, 16, 24, 32, 48, 72, 120 px (`--space-1` … `--space-9`), plus deux filets `--space-hairline` (1 px) et `--space-line` (2 px) pour les grilles à séparateurs.

## Échelle d'opacité (CSS-14)

5, 10, 20, 40, 60, 80, 95 % (`--<couleur>-<pourcentage>`, ex. `--white-60`, `--navy-05`).

## Échelles de texte, de rayons et d'ombres (CSS-12, CSS-15)

Texte : `--text-2xs` à `--text-2xl` (0,65 à 1,8 rem) et `--text-fluid-1` à `--text-fluid-9` (`clamp()` par rang).
Rayons : `--radius-xs`, `-sm`, `-md`, `-lg`, `-pill`.
Ombres : `--shadow-sm`, `-md`, `-lg`, `-accent-sm`, `-accent-md`, `-accent-lg`, `-efs`.

## Dérogations

| Règle    | Choix du projet | Raison |
| -------- | --------------- | ------ |
| (aucune) |                 |        |
