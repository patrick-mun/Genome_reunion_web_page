# Polices hébergées

Polices du site, servies depuis le dépôt (aucune requête vers Google Fonts ou un autre service tiers).

| Fichier                                                  | Famille                  | Graisses utilisées | Licence                          |
| -------------------------------------------------------- | ------------------------ | ------------------ | -------------------------------- |
| `spectral-300.woff2`, `spectral-400.woff2`               | Spectral                 | 300, 400           | `licenses/OFL-spectral.txt`      |
| `spectral-300-italic.woff2`, `spectral-400-italic.woff2` | Spectral italique        | 300, 400           | `licenses/OFL-spectral.txt`      |
| `dm-sans-variable.woff2`                                 | DM Sans (variable)       | 300 à 500          | `licenses/OFL-dm-sans.txt`       |
| `space-grotesk-variable.woff2`                           | Space Grotesk (variable) | 500 à 600          | `licenses/OFL-space-grotesk.txt` |

- **Licence :** SIL Open Font License 1.1. Les textes complets et les mentions de copyright sont dans `licenses/` ; ils doivent rester avec les fichiers de police.
- **Origine :** fichiers `woff2` du sous-ensemble `latin` servis par Google Fonts le 9 octobre 2026. Les textes de licence viennent des paquets `@fontsource/*` (`spectral`, `dm-sans`, `space-grotesk`).
- **Déclaration :** `assets/css/fonts.css`. Les noms de famille correspondent aux jetons `--f-display`, `--f-body` et `--f-ui` de `tokens.css`.
- **Caractères :** le sous-ensemble `latin` couvre le français. Un caractère hors de cette plage (par exemple « ≥ ») s'affiche avec une police système de repli. Pour un autre alphabet, ajouter le sous-ensemble correspondant.
- **Ajouter ou changer une graisse :** télécharger le fichier `woff2` voulu, l'ajouter ici, déclarer un `@font-face` dans `fonts.css`, et, si la police sert en haut de page, un `preload` dans les deux pages.
