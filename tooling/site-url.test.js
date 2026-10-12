/* ============================================================
   tooling/site-url.test.js
   Rôle : tests de la préparation du site pour son adresse définitive (site-url.js) et, de bout en bout,
   de la commande set-site-url.mjs sur les vraies pages du dépôt.
   Pages concernées : toutes les pages .html de la racine (fichiers analysés, pas modifiés).
   Accroches : aucune (lancé par node --test).
   ============================================================ */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { absolutizeLinks, addSeoTags, buildRobots, buildSitemap, pageUrl, parseSiteUrl } from './site-url.js';

const SCRIPT = new URL('./set-site-url.mjs', import.meta.url).pathname;
const SOURCE_ROOT = new URL('..', import.meta.url).pathname;
const workFolder = mkdtempSync(join(tmpdir(), 'set-site-url-'));
after(() => rmSync(workFolder, { recursive: true, force: true }));

const runCommand = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
const head = '  <head>\n    <meta name="twitter:card" content="summary" />\n  </head>';

test('parseSiteUrl : domaine à la racine, sous-dossier et http', () => {
  assert.deepEqual(parseSiteUrl('https://exemple.fr'), { origin: 'https://exemple.fr', basePath: '/', secure: true });
  assert.deepEqual(parseSiteUrl('https://exemple.fr/'), { origin: 'https://exemple.fr', basePath: '/', secure: true });
  assert.deepEqual(parseSiteUrl('https://exemple.fr/genome'), { origin: 'https://exemple.fr', basePath: '/genome/', secure: true });
  assert.equal(parseSiteUrl('http://exemple.fr').secure, false);
});

test('parseSiteUrl : refuse ce qui n\'est pas une adresse de site', () => {
  for (const input of ['', 'exemple.fr', 'ftp://exemple.fr', 'https://exemple.fr/?a=1', 'https://exemple.fr/#haut']) {
    assert.throws(() => parseSiteUrl(input), /Adresse invalide/, input);
  }
});

test('pageUrl : l\'accueil est l\'adresse du dossier, les autres pages gardent leur nom', () => {
  const site = parseSiteUrl('https://exemple.fr/genome');
  assert.equal(pageUrl(site, 'index.html'), 'https://exemple.fr/genome/');
  assert.equal(pageUrl(site, 'participer.html'), 'https://exemple.fr/genome/participer.html');
});

test('addSeoTags : canonical et og:url après twitter:card, indentation conservée', () => {
  const html = addSeoTags(head, { canonicalUrl: 'https://exemple.fr/' });
  assert.match(html, /<meta name="twitter:card" content="summary" \/>\n {4}<link rel="canonical" href="https:\/\/exemple\.fr\/" \/>\n {4}<meta property="og:url" content="https:\/\/exemple\.fr\/" \/>/);
  assert.doesNotMatch(html, /og:image|twitter:image/);
});

test('addSeoTags : avec une image, la carte passe en grand format et l\'image est posée deux fois', () => {
  const html = addSeoTags(head, { canonicalUrl: 'https://exemple.fr/', imageUrl: 'https://exemple.fr/p.png', imageAlt: 'Vagues & logo' });
  assert.match(html, /twitter:card" content="summary_large_image"/);
  assert.match(html, /og:image" content="https:\/\/exemple\.fr\/p\.png"/);
  assert.match(html, /twitter:image" content="https:\/\/exemple\.fr\/p\.png"/);
  assert.match(html, /og:image:alt" content="Vagues &amp; logo"/);
});

test('addSeoTags : refuse une page sans twitter:card ou déjà munie d\'un canonical', () => {
  assert.throws(() => addSeoTags('<head></head>', { canonicalUrl: 'https://exemple.fr/' }), /twitter:card/);
  const once = addSeoTags(head, { canonicalUrl: 'https://exemple.fr/' });
  assert.throws(() => addSeoTags(once, { canonicalUrl: 'https://exemple.fr/' }), /déjà/);
});

test('absolutizeLinks : rend absolus les chemins relatifs, laisse le reste', () => {
  const html = [
    '<link href="assets/css/base.css" />',
    '<a href="index.html#probleme">',
    '<use href="assets/images/sprite.svg#logo" />',
    '<script src="assets/js/a.js"></script>',
    '<a href="#contenu">',
    '<a href="/deja.html">',
    '<a href="mailto:a@b.fr">',
    '<a href="https://cnil.fr">',
  ].join('\n');
  assert.equal(
    absolutizeLinks(html, '/sous/'),
    [
      '<link href="/sous/assets/css/base.css" />',
      '<a href="/sous/index.html#probleme">',
      '<use href="/sous/assets/images/sprite.svg#logo" />',
      '<script src="/sous/assets/js/a.js"></script>',
      '<a href="#contenu">',
      '<a href="/deja.html">',
      '<a href="mailto:a@b.fr">',
      '<a href="https://cnil.fr">',
    ].join('\n'),
  );
});

test('buildSitemap et buildRobots', () => {
  const sitemap = buildSitemap(['https://exemple.fr/', 'https://exemple.fr/a?x=1&y=2']);
  assert.match(sitemap, /<loc>https:\/\/exemple\.fr\/<\/loc>/);
  assert.match(sitemap, /a\?x=1&amp;y=2/);
  assert.equal(buildRobots('https://exemple.fr/sitemap.xml'), 'User-agent: *\nAllow: /\n\nSitemap: https://exemple.fr/sitemap.xml\n');
});

test('commande : prépare le site réel sans toucher aux sources', () => {
  const before = readFileSync(join(SOURCE_ROOT, 'index.html'), 'utf8');
  const out = join(workFolder, 'site');
  const result = runCommand('https://exemple.fr/genome', '--out', out);
  assert.equal(result.status, 0, result.stderr);

  const pages = readdirSync(SOURCE_ROOT).filter((name) => name.endsWith('.html') && name !== '404.html');
  assert.ok(pages.length >= 4, 'pages introuvables');
  for (const file of pages) {
    const html = readFileSync(join(out, file), 'utf8');
    const url = file === 'index.html' ? 'https://exemple.fr/genome/' : `https://exemple.fr/genome/${file}`;
    assert.ok(html.includes(`<link rel="canonical" href="${url}" />`), `${file} : canonical`);
    assert.ok(html.includes(`<meta property="og:url" content="${url}" />`), `${file} : og:url`);
    assert.ok(readFileSync(join(out, 'sitemap.xml'), 'utf8').includes(`<loc>${url}</loc>`), `${file} : sitemap`);
  }
  const error = readFileSync(join(out, '404.html'), 'utf8');
  assert.doesNotMatch(error, /rel="canonical"/);
  assert.match(error, /href="\/genome\/assets\/css\/base\.css"/);
  assert.match(error, /href="\/genome\/index\.html"/);
  assert.doesNotMatch(error, /(?:href|src)="(?!\/|#|mailto:|https?:)[^"]/);
  assert.ok(!readFileSync(join(out, 'sitemap.xml'), 'utf8').includes('404'), 'la 404 n\'est pas dans le sitemap');
  assert.match(readFileSync(join(out, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/exemple\.fr\/genome\/sitemap\.xml/);
  assert.ok(existsSync(join(out, 'favicon.ico')) && existsSync(join(out, 'assets/css/base.css')));
  assert.ok(!existsSync(join(out, 'assets/js/lib/random.test.js')), 'les tests ne sont pas copiés');
  assert.equal(readFileSync(join(SOURCE_ROOT, 'index.html'), 'utf8'), before, 'index.html source modifié');
});

test('commande : refuse un dossier de sortie non vide, une adresse invalide et une image absente', () => {
  const busy = join(workFolder, 'occupe');
  mkdirSync(busy);
  writeFileSync(join(busy, 'x'), '');
  assert.match(runCommand('https://exemple.fr', '--out', busy).stderr, /non vide/);
  assert.match(runCommand('exemple.fr', '--out', join(workFolder, 'a')).stderr, /Adresse invalide/);
  assert.match(runCommand('https://exemple.fr', '--out', join(workFolder, 'b'), '--image', 'assets/images/absente.png').stderr, /Image introuvable/);
  assert.match(runCommand('https://exemple.fr', '--out', join(SOURCE_ROOT, 'assets', 'x')).stderr, /refusé/);
});

test('commande : avec une image existante, og:image et twitter:image sont posées', () => {
  const out = join(workFolder, 'avec-image');
  const result = runCommand('https://exemple.fr', '--out', out, '--image', 'assets/images/apple-touch-icon.png', '--image-alt', 'Logo');
  assert.equal(result.status, 0, result.stderr);
  const html = readFileSync(join(out, 'index.html'), 'utf8');
  assert.ok(html.includes('<meta property="og:image" content="https://exemple.fr/assets/images/apple-touch-icon.png" />'));
  assert.ok(html.includes('twitter:card" content="summary_large_image"'));
});
