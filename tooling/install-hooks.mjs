// Active les hooks Git versionnés dans .githooks/ (pré-commit : mêmes contrôles que la CI).
// Lancé par `npm install` / `npm ci` via le script « prepare » ; sans effet hors d'un dépôt Git.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('.git')) process.exit(0);

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
} catch {
  console.warn('Hooks Git non activés : la commande git est introuvable.');
}
