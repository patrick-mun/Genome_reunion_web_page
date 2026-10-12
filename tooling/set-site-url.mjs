/* ============================================================
   tooling/set-site-url.mjs
   Rôle : prépare une copie du site prête à déployer pour une adresse donnée : canonical, og:url,
   og:image (image de partage par défaut, ou celle de --image), sitemap.xml, robots.txt, et chemins absolus dans 404.html.
   Les sources ne sont jamais modifiées : le dépôt reste sans adresse absolue.
   Usage : npm run set-site-url -- <adresse> [--out <dossier>] [--image <chemin>] [--image-alt <texte>] [--no-image] [--keep-noindex]
   L'image de partage par défaut est assets/images/partage.png (--no-image pour s'en passer).
   La balise noindex des sources (préproduction) est retirée de la copie, sauf avec --keep-noindex.
   Pages concernées : toutes les pages .html de la racine.
   Accroches : aucune (outil de mise en ligne).
   ============================================================ */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { absolutizeLinks, addSeoTags, buildRobots, buildSitemap, pageUrl, parseSiteUrl, removeNoindex } from './site-url.js';

const DEFAULT_OUT = '.site-dist'; // dossier caché : ignoré par les contrôles du dépôt
const ERROR_PAGE = '404.html';
const DEFAULT_IMAGE = 'assets/images/partage.png';
const DEFAULT_IMAGE_ALT = 'Génome Réunion : Mieux lire nos génomes. Référentiel génomique réunionnais.';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Lit les arguments de la ligne de commande.
 * @param {string[]} args Arguments après le nom du script.
 * @returns {{siteUrl: string, out: string, image?: string, imageAlt?: string, keepNoindex?: boolean, noImage?: boolean}} Options.
 */
function parseArgs(args) {
  const options = { out: DEFAULT_OUT };
  const valueFlags = { '--out': 'out', '--image': 'image', '--image-alt': 'imageAlt' };
  const switchFlags = { '--keep-noindex': 'keepNoindex', '--no-image': 'noImage' };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg in switchFlags) {
      options[switchFlags[arg]] = true;
    } else if (arg in valueFlags) {
      if (args[i + 1] === undefined) fail(`${arg} attend une valeur.`);
      options[valueFlags[arg]] = args[++i];
    } else if (arg.startsWith('--') || options.siteUrl !== undefined) {
      fail(`Argument inattendu : ${arg}`);
    } else {
      options.siteUrl = arg;
    }
  }
  if (options.siteUrl === undefined) {
    fail('Usage : npm run set-site-url -- <adresse> [--out <dossier>] [--image <chemin>] [--image-alt <texte>] [--no-image] [--keep-noindex]');
  }
  if (options.noImage && options.image) fail('--no-image et --image sont incompatibles.');
  return options;
}

/**
 * Affiche un message d'erreur et arrête le script.
 * @param {string} message Message.
 */
function fail(message) {
  console.error(message);
  process.exit(1);
}

/**
 * Vérifie que le dossier de sortie est sûr : absent ou vide, et à l'écart des sources.
 * @param {string} out Chemin du dossier de sortie.
 */
function checkOutputFolder(out) {
  const fromRoot = relative(repoRoot, out);
  const containsRoot = fromRoot === '' || fromRoot.startsWith('..') ? relative(out, repoRoot) : null;
  if (fromRoot === '' || (containsRoot !== null && !containsRoot.startsWith('..'))) {
    fail(`Dossier de sortie refusé : ${out} contient ou est le dossier du projet.`);
  }
  const insideSources = fromRoot.split(sep)[0];
  if (['assets', 'tooling', 'docs', '.git', 'node_modules'].includes(insideSources)) {
    fail(`Dossier de sortie refusé : ${out} est dans ${insideSources}/.`);
  }
  if (existsSync(out) && readdirSync(out).length > 0) {
    fail(`Dossier de sortie non vide : ${out}. Supprimez-le ou choisissez --out autre.`);
  }
}

const options = parseArgs(process.argv.slice(2));
let site;
try {
  site = parseSiteUrl(options.siteUrl);
} catch (error) {
  fail(error.message);
}
const out = resolve(options.out);
checkOutputFolder(out);

const imagePath = options.noImage ? undefined : (options.image ?? DEFAULT_IMAGE).replace(/^\/+/, '');
if (imagePath && !existsSync(join(repoRoot, imagePath))) fail(`Image introuvable : ${imagePath}`);
const imageAlt = options.image ? options.imageAlt : (options.imageAlt ?? DEFAULT_IMAGE_ALT);
const imageUrl = imagePath ? `${site.origin}${site.basePath}${imagePath}` : undefined;

mkdirSync(out, { recursive: true });
cpSync(join(repoRoot, 'assets'), join(out, 'assets'), { recursive: true, filter: (source) => !source.endsWith('.test.js') });
cpSync(join(repoRoot, 'favicon.ico'), join(out, 'favicon.ico'));

const pages = readdirSync(repoRoot).filter((name) => name.endsWith('.html'));
const indexed = [];
for (const file of pages) {
  const original = readFileSync(join(repoRoot, file), 'utf8');
  const source = options.keepNoindex ? original : removeNoindex(original);
  try {
    if (file === ERROR_PAGE) {
      writeFileSync(join(out, file), absolutizeLinks(source, site.basePath));
    } else {
      writeFileSync(join(out, file), addSeoTags(source, { canonicalUrl: pageUrl(site, file), imageUrl, imageAlt }));
      indexed.push(pageUrl(site, file));
    }
  } catch (error) {
    fail(`${file} : ${error.message}`);
  }
}
const sitemapUrl = `${site.origin}${site.basePath}sitemap.xml`;
writeFileSync(join(out, 'sitemap.xml'), buildSitemap(indexed));
writeFileSync(join(out, 'robots.txt'), buildRobots(sitemapUrl));

console.log(`Site préparé pour ${site.origin}${site.basePath} dans ${out}`);
console.log(`  ${indexed.length} pages avec canonical et og:url, ${ERROR_PAGE} aux chemins absolus, sitemap.xml, robots.txt`);
console.log(options.keepNoindex ? '  noindex conservé (--keep-noindex) : le site ne sera pas indexé.' : '  noindex retiré : le site pourra être indexé.');
if (!site.secure) console.warn('  Attention : adresse en http://, préférer https:// en production.');
if (site.basePath !== '/') console.warn('  Attention : site dans un sous-dossier ; les moteurs ne lisent robots.txt qu\'à la racine du domaine.');
if (!imageUrl) console.warn('  Pas d\'image de partage (--no-image) : og:image et twitter:image ne sont pas posées.');
