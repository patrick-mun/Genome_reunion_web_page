# Profil de conventions du projet — Génome Réunion

Lu en premier par le skill `web-code-conventions`. Il contient les choix du
projet ; les règles du skill s'appliquent pour tout ce qui n'est pas dérogé ici.

## Version du skill

`web-code-conventions` : version courante (non publiée, sans tag)

## Outils

Commande de contrôle lancée avant chaque commit : `npm run lint`
(Stylelint, html-validate, ESLint, `check-html.mjs`, `check-dead-code.mjs`).
Formatage : `npm run format` ; tests : `npm test`.

Les versions installées sont figées dans `package-lock.json`.

## Organisation du JS (JS-02)

| Rôle                    | Chemin             |
| ----------------------- | ------------------ |
| Point d'entrée par page | `assets/js/pages/` |
| Modules partagés        | `assets/js/lib/`   |

## Titre de page (HTML-02)

Format du `<title>` : `Page — Génome Réunion` (la page d'accueil : `Génome Réunion`).

## Fichier de tokens

Valeurs de conception documentées dans `docs/design-tokens.md` (à créer à
l'étape des tokens).

## Organisation des fichiers (CSS-02)

Cible de migration : aujourd'hui tout est dans `assets/css/styles.css`.

| Rôle                                    | Chemin                   |
| --------------------------------------- | ------------------------ |
| Tokens (valeurs uniquement)             | `assets/css/tokens.css`  |
| Base (reset, base, layout, utilitaires) | `assets/css/base.css`    |
| Composants (un fichier par composant)   | `assets/css/components/` |
| Pages (un fichier par page)             | `assets/css/pages/`      |

## Sens des media queries (CSS-05)

`max-width`. Point de rupture actuel : 900 px (à confirmer d'après le contenu
lors de l'éclatement des media queries).

## Échelle d'espacement (CSS-11)

4, 8, 12, 16, 24, 32, 48, 72 px (`--space-1` … `--space-8`).

## Échelle d'opacité (CSS-14)

10, 20, 40, 60, 80 % (`--<couleur>-<pourcentage>`, ex. `--white-60`). À ajuster
d'après les opacités réellement utilisées (.12, .3, .5, .75, .92…).

## Dérogations

| Règle    | Choix du projet | Raison |
| -------- | --------------- | ------ |
| (aucune) |                 |        |
