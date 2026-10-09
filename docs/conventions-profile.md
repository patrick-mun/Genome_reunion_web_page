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

| Rôle                                                 | Chemin                                                   |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Polices (@font-face)                                 | `assets/css/fonts.css`                                   |
| Tokens (valeurs uniquement)                          | `assets/css/tokens.css`                                  |
| Base (reset, base, layout, utilitaires)              | `assets/css/base.css`                                    |
| Composants (un fichier par composant)                | `assets/css/components/`                                 |
| Pages (un dossier par page, une section par fichier) | `assets/css/pages/home/`, `assets/css/pages/participer/` |
| Utilitaires (chargés en dernier)                     | `assets/css/utilities.css`                               |

## Sens des media queries (CSS-05)

`max-width`. Point de rupture actuel : 900 px (à confirmer d'après le contenu
lors de l'éclatement des media queries).

## Échelle d'espacement (CSS-11)

4, 8, 12, 16, 24, 32, 48, 72, 120 px (`--space-1` … `--space-9`), plus deux filets `--space-hairline` (1 px) et `--space-line` (2 px) pour les grilles à séparateurs.

## Espacements responsives (CSS-06)

Les espacements qui changent sous 900 px sont des jetons par rôle (`--space-gutter`, `--space-section-y`, `--space-columns`, `--space-steps`, `--space-nav-y`, `--space-footer-y`, `--space-stats-y`), redéfinis dans un seul bloc `@media` en fin de `tokens.css`. Les composants n'ont plus de media query d'espacement ; les leurs ne changent que la mise en page (colonnes, affichage).

## Échelle d'opacité (CSS-14)

5, 10, 20, 40, 60, 80, 95 % (`--<couleur>-<pourcentage>`, ex. `--white-60`, `--navy-05`).

## Échelles de texte, de rayons et d'ombres (CSS-12, CSS-15)

Texte : `--text-2xs` à `--text-2xl` (0,65 à 1,8 rem) et `--text-fluid-1` à `--text-fluid-9` (`clamp()` par rang).
Rayons : `--radius-xs`, `-sm`, `-md`, `-lg`, `-pill`.
Ombres : `--shadow-sm`, `-md`, `-lg`, `-accent-sm`, `-accent-md`, `-accent-lg`, `-efs`.

## Typographie (CSS-13)

Graisses : `--weight-light`, `-regular`, `-medium`, `-semibold`, `-bold` (300 à 700), imposées par Stylelint hors `fonts.css` (les descripteurs `@font-face` n'acceptent pas `var()`).
Interlignes : `--leading-1` à `--leading-6` (1 à 1,7). Approche : `--tracking-neg-2`, `-neg-1` (−0,03 et −0,02 em) et `--tracking-1` à `--tracking-5` (0,06 à 0,18 em).
Seules les valeurs employées au moins trois fois sont des jetons ; les autres restent écrites dans leur règle (contrôle par relecture).

## Dérogations

| Règle                                                                | Choix du projet                             | Raison                                                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| HTML-11 (html-validate `no-redundant-role`, `prefer-native-element`) | `role="list"` autorisé sur `<ul>` et `<ol>` | Safari/VoiceOver retire la sémantique de liste quand `list-style: none` est posé ; le rôle explicite la rétablit |
