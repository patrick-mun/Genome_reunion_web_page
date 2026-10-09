/* ============================================================
   tooling/visual-check.mjs
   Rôle : vérifie qu'une modification ne change pas le rendu. Compare la copie de travail à une
   version de référence (HEAD par défaut) : captures pleine page et styles calculés à 1280, 820
   et 390 px, propriétés de mouvement, états survol / clic / focus.
   Usage : npm run visual -- [référence] [--browser <chemin de Chrome>] [--out <dossier>]
   Pages concernées : toutes les pages .html de la racine.
   Accroches : aucune (outil de développement, hors CI : il lui faut Chrome ou Chromium).
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { compareElements, isIdentical } from './visual-diff.js';

const WIDTHS = [1280, 820, 390];
const VIEWPORT_HEIGHT = 900;
const SETTLE_MS = 800; // laisse finir les apparitions et le chargement des polices
const STATES = ['hover', 'active', 'focus-visible'];
const MAX_REPORTED = 20; // éléments détaillés par vérification, au-delà un simple décompte
const MAX_PROPERTIES = 3; // propriétés citées par élément (color entraîne caret-color, outline-color…)
const MOTION_PROPERTIES = /^(transition|animation)|^z-index$/;
// Couches animées en continu (oiseaux, margouillat) : leur position change à chaque image.
const ANIMATED_LAYERS = '.gecko-layer, .bird-layer';
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/* ── LIGNE DE COMMANDE ──
   Référence git en argument libre, chemin du navigateur et dossier de sortie en options.
*/

/**
 * Lit les arguments de la ligne de commande.
 * @param {string[]} args Arguments après le nom du script.
 * @returns {{ref: string, browserPath: string | undefined, outDir: string}} Options.
 */
function parseArgs(args) {
  const options = { ref: 'HEAD', browserPath: process.env.VISUAL_BROWSER, outDir: 'visual-check-output' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--browser') options.browserPath = args[++i];
    else if (args[i] === '--out') options.outDir = args[++i];
    else options.ref = args[i];
  }
  return options;
}

/* ── SERVEUR ET RÉFÉRENCE ──
   Les modules ES exigent HTTP : chaque version est servie par un petit serveur statique.
   La référence est extraite dans un worktree git temporaire, supprimé en fin de script.
*/

/**
 * Sert un dossier en HTTP sur un port libre.
 * @param {string} root Dossier à servir.
 * @returns {Promise<{url: string, close: () => void}>} Adresse du serveur et fonction d'arrêt.
 */
function serve(root) {
  const server = createServer((request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
    try {
      const body = readFileSync(join(root, path === '/' ? 'index.html' : path));
      response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(path)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => {
      done({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() });
    });
  });
}

/**
 * Extrait une version du dépôt dans un dossier temporaire.
 * @param {string} ref Référence git (HEAD, main, un commit…).
 * @returns {{dir: string, remove: () => void}} Dossier extrait et fonction de nettoyage.
 */
function checkout(ref) {
  const dir = mkdtempSync(join(tmpdir(), 'visual-check-'));
  try {
    execFileSync('git', ['worktree', 'add', '--detach', dir, ref], { stdio: 'ignore' });
  } catch (error) {
    rmSync(dir, { recursive: true });
    throw error;
  }
  return { dir, remove: () => execFileSync('git', ['worktree', 'remove', '--force', dir]) };
}

/* ── RELEVÉS DANS LA PAGE ──
   Fonctions envoyées au navigateur par page.evaluate : elles n'utilisent que leurs arguments.
*/

/**
 * Relève les styles calculés des éléments d'une page ou d'un sous-arbre.
 * @param {{root: string | null, skip: string, only: string | null}} options Racine (sélecteur,
 *   ou toute la page), couches à ignorer, motif des propriétés à garder (toutes si null).
 * @returns {Array<{tag: string, label: string, styles: Record<string, string>}>} Relevé.
 */
function readStyles({ root, skip, only }) {
  const scope = root ? document.querySelector(root) : document.documentElement;
  const keep = only ? new RegExp(only) : null;
  const read = (el, pseudo) => {
    const computed = getComputedStyle(el, pseudo);
    const styles = {};
    for (const property of computed) {
      if (!property.startsWith('--') && (!keep || keep.test(property))) {
        styles[property] = computed.getPropertyValue(property);
      }
    }
    return styles;
  };
  const elements = [scope, ...scope.querySelectorAll('*')].filter((el) => !el.closest(skip));
  return elements.flatMap((el) => {
    const label = `${el.tagName.toLowerCase()}${el.classList.length ? '.' + [...el.classList].join('.') : ''}`;
    // Un ::before ou ::after sans contenu n'est pas affiché : il ne ferait que du bruit.
    const pseudos = ['::before', '::after'].filter((p) => getComputedStyle(el, p).content !== 'none');
    return ['', ...pseudos].map((pseudo) => ({
      tag: el.tagName + pseudo,
      label: label + pseudo,
      styles: read(el, pseudo || null),
    }));
  });
}

/**
 * Marque les éléments visés par une règle :hover, :active ou :focus des feuilles de style.
 * @returns {number} Nombre d'éléments marqués (attribut data-visual-target).
 */
function markInteractiveTargets() {
  const selectors = new Set();
  const visit = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules) visit(rule.cssRules);
      for (const part of rule.selectorText?.split(',') ?? []) {
        const match = /^(.*?):(hover|active|focus)/.exec(part.trim());
        if (match?.[1]) selectors.add(match[1]);
      }
    }
  };
  for (const sheet of document.styleSheets) visit(sheet.cssRules);
  const targets = new Set([...selectors].flatMap((selector) => [...document.querySelectorAll(selector)]));
  [...targets].forEach((el, index) => el.setAttribute('data-visual-target', String(index)));
  return targets.size;
}

/* ── CAPTURES ──
   Une page est capturée en mouvement réduit (rendu stable), puis sans (durées, calques),
   puis état par état, transitions coupées, grâce aux pseudo-classes forcées de Chrome.
*/

/**
 * Ouvre une page prête à être relevée : apparitions forcées, polices et images chargées.
 * @returns {Promise<import('playwright-core').Page>} Page ouverte.
 */
async function openPage(browser, url, { width, reducedMotion }) {
  const context = await browser.newContext({ viewport: { width, height: VIEWPORT_HEIGHT }, reducedMotion });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('.js-reveal').forEach((el) => el.classList.add('is-revealed')));
  await page.waitForTimeout(SETTLE_MS);
  return page;
}

/**
 * Relève les états survol, clic et focus de chaque élément interactif et de ses descendants.
 * @returns {Promise<Array<{tag: string, label: string, styles: Record<string, string>}>>} Relevé.
 */
async function captureStates(browser, url, reducedMotion) {
  const page = await openPage(browser, url, { width: WIDTHS[0], reducedMotion });
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
  const count = await page.evaluate(markInteractiveTargets);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const result = [];
  for (let index = 0; index < count; index++) {
    const selector = `[data-visual-target="${index}"]`;
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    for (const state of STATES) {
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [state] });
      const styles = await page.evaluate(readStyles, { root: selector, skip: ANIMATED_LAYERS, only: null });
      result.push(...styles.map((el) => ({ ...el, tag: `${el.tag}:${state}`, label: `${el.label} :${state}` })));
    }
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
  }
  await page.context().close();
  return result;
}

/**
 * Capture une page : rendu et styles par largeur, mouvement, états interactifs.
 * @returns {Promise<object>} Relevé de la page, indexé par nom de vérification.
 */
async function capturePage(browser, url) {
  const checks = {};
  for (const width of WIDTHS) {
    const page = await openPage(browser, url, { width, reducedMotion: 'reduce' });
    checks[`${width}px`] = {
      png: await page.screenshot({ fullPage: true }),
      elements: await page.evaluate(readStyles, { root: null, skip: ANIMATED_LAYERS, only: null }),
    };
    await page.context().close();
  }
  const page = await openPage(browser, url, { width: WIDTHS[0], reducedMotion: 'no-preference' });
  const only = MOTION_PROPERTIES.source;
  checks['mouvement'] = { elements: await page.evaluate(readStyles, { root: null, skip: ANIMATED_LAYERS, only }) };
  await page.context().close();
  checks['états'] = { elements: await captureStates(browser, url, 'no-preference') };
  checks['états, mouvement réduit'] = { elements: await captureStates(browser, url, 'reduce') };
  return checks;
}

/* ── RAPPORT ──
   Un écart de pixels enregistre les deux captures dans le dossier de sortie pour les comparer.
*/

/**
 * Décrit les écarts d'une vérification ; enregistre les deux captures si les pixels diffèrent.
 * @returns {string[]} Lignes du rapport (vide si identique).
 */
function describeDifferences(reference, current, capturePrefix) {
  const lines = [];
  if (reference.png && !reference.png.equals(current.png)) {
    mkdirSync(dirname(capturePrefix), { recursive: true });
    writeFileSync(`${capturePrefix}-avant.png`, reference.png);
    writeFileSync(`${capturePrefix}-apres.png`, current.png);
    lines.push(`  pixels différents (captures : ${capturePrefix}-avant.png et -apres.png)`);
  }
  const comparison = compareElements(reference.elements, current.elements);
  if (isIdentical(comparison)) return lines;
  if (comparison.added.length) lines.push(`  ajoutés : ${comparison.added.join(', ')}`);
  if (comparison.removed.length) lines.push(`  retirés : ${comparison.removed.join(', ')}`);
  for (const { label, diffs } of comparison.changed.slice(0, MAX_REPORTED)) {
    const shown = diffs.slice(0, MAX_PROPERTIES).map((d) => `${d.property} ${d.before} → ${d.after}`);
    const more = diffs.length > MAX_PROPERTIES ? ` (+${diffs.length - MAX_PROPERTIES})` : '';
    lines.push(`  ${label} : ${shown.join(' ; ')}${more}`);
  }
  if (comparison.changed.length > MAX_REPORTED) {
    lines.push(`  … et ${comparison.changed.length - MAX_REPORTED} autres éléments modifiés`);
  }
  return lines;
}

/**
 * Compare deux relevés de page et affiche le résultat de chaque vérification.
 * @returns {number} Nombre de vérifications en écart.
 */
function report(name, before, after, outDir) {
  let failures = 0;
  for (const [check, reference] of Object.entries(before)) {
    const lines = describeDifferences(reference, after[check], join(outDir, `${name}-${check}`));
    console.log(`${name} — ${check} : ${lines.length ? 'ÉCART' : 'identique'}`);
    lines.forEach((line) => console.log(line));
    if (lines.length) failures++;
  }
  return failures;
}

/**
 * Lance Chrome (ou le navigateur Chromium indiqué) ; arrête le script avec un message clair sinon.
 * @returns {Promise<import('playwright-core').Browser>} Navigateur lancé.
 */
async function launchBrowser(browserPath) {
  try {
    return await chromium.launch(browserPath ? { executablePath: browserPath } : { channel: 'chrome' });
  } catch {
    console.error('Navigateur introuvable : installer Google Chrome, ou passer --browser <chemin> (ou VISUAL_BROWSER).');
    process.exit(1);
  }
}

/* ── PROGRAMME ── */

const options = parseArgs(process.argv.slice(2));
const repoRoot = resolve(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());
const pages = readdirSync(repoRoot).filter((file) => file.endsWith('.html'));
const browser = await launchBrowser(options.browserPath);
let reference;
try {
  reference = checkout(options.ref);
} catch {
  console.error(`Référence git introuvable : ${options.ref}`);
  await browser.close();
  process.exit(1);
}
const servers = await Promise.all([serve(reference.dir), serve(repoRoot)]);
let failures = 0;
let aborted = false;
try {
  console.log(`Référence : ${options.ref} — copie de travail comparée sur ${pages.join(', ')}\n`);
  for (const file of pages) {
    const before = await capturePage(browser, `${servers[0].url}/${file}`);
    const after = await capturePage(browser, `${servers[1].url}/${file}`);
    failures += report(file.replace('.html', ''), before, after, options.outDir);
  }
} catch (error) {
  console.error(error.message);
  aborted = true;
} finally {
  await browser.close();
  servers.forEach((server) => server.close());
  reference.remove();
}
if (aborted) console.log('\nVérification interrompue.');
else console.log(failures ? `\n${failures} vérification(s) en écart.` : '\nRendu identique.');
process.exit(aborted || failures ? 1 : 0);
