/* ============================================================
   tooling/pages-sync.test.js
   Rôle : garde-fou contre la dérive entre les pages du site (accueil, participer, pages légales) : parties communes
   (navigation, pied de page, en-tête du <body>, feuilles partagées), sprite SVG et liens internes.
   Pages concernées : index.html, participer.html, mentions-legales.html, confidentialite.html (fichiers analysés, pas modifiés).
   Accroches : aucune (lancé par node --test).
   ============================================================ */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const home = read('index.html');
const participer = read('participer.html');
const mentions = read('mentions-legales.html');
const confidentialite = read('confidentialite.html');
const pages = {
  'index.html': home,
  'participer.html': participer,
  'mentions-legales.html': mentions,
  'confidentialite.html': confidentialite,
};
const sprite = read('assets/images/sprite.svg');

/* Ce qui peut légitimement différer : la cible de chaque lien (ancre locale ou index.html#…) et le
   libellé du lien d'action de la page (nav-cta et dernier lien du pied de page). */
function skeleton(fragment) {
  const lines = fragment
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '>\n<')
    .trim()
    .split('\n')
    .map((line) => line.replace(/ href="[^"]*"/g, ' href=""'));
  const lastFooterLink = lines.map((l) => l.includes('class="footer-link"')).lastIndexOf(true);
  return lines.map((line, i) =>
    line.includes('class="nav-cta"') || i === lastFooterLink ? line.replace(/(<a [^>]*>)[^<]*(<\/a>)/, '$1…$2') : line,
  );
}

function assertSameSkeleton(name, regex) {
  const a = skeleton(home.match(regex)?.[0] ?? '');
  for (const [file, html] of Object.entries(pages)) {
    const b = skeleton(html.match(regex)?.[0] ?? '');
    assert.ok(a.length > 1 && b.length > 1, `${name} introuvable dans index.html ou ${file}`);
    const i = a.findIndex((line, k) => line !== b[k]);
    assert.ok(
      i === -1 && a.length === b.length,
      `${name} diffère entre index.html et ${file} (ligne ${i + 1}) :\n  index.html ${a[i]}\n  ${file} ${b[i]}`,
    );
  }
}

test('la navigation est identique dans les deux pages (hors cibles des liens)', () => {
  assertSameSkeleton('la navigation', /<nav[\s\S]*?<\/nav>/);
});

test('le pied de page est identique dans les deux pages (hors cibles des liens)', () => {
  assertSameSkeleton('le pied de page', /<footer[\s\S]*?<\/footer>/);
});

test('le début du <body> (lien d\'évitement, barre de progression) est identique', () => {
  assertSameSkeleton('le début du body', /<body>[\s\S]*?(?=<header>)/);
});

test('les feuilles, icônes et préchargements partagés sont les mêmes et dans le même ordre', () => {
  const shared = (html) =>
    [...html.matchAll(/<(?:link|meta)\b[^>]*?\/>/gs)]
      .map((m) => m[0].replace(/\s+/g, ' '))
      .filter((tag) => !tag.includes('assets/css/pages/') && !tag.includes('name="description"'));
  for (const html of Object.values(pages)) assert.deepEqual(shared(html), shared(home));
});

test('chaque <use> pointe vers un <symbol> du sprite, et chaque symbole sert', () => {
  const symbols = [...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  const uses = [...Object.values(pages).join('').matchAll(/<use\b[^>]*href="assets\/images\/sprite\.svg#([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.ok(symbols.length > 0, 'aucun symbole dans le sprite');
  for (const id of uses) assert.ok(symbols.includes(id), `symbole manquant dans le sprite : ${id}`);
  for (const id of symbols) assert.ok(uses.includes(id), `symbole jamais utilisé : ${id}`);
});

test('le sprite est du XML bien formé : pas de « -- » dans un commentaire', () => {
  for (const [, body] of sprite.matchAll(/<!--([\s\S]*?)-->/g)) {
    assert.ok(!body.includes('--'), 'un commentaire XML ne peut pas contenir deux tirets consécutifs');
  }
  assert.equal((sprite.match(/<symbol\b/g) || []).length, (sprite.match(/<\/symbol>/g) || []).length);
});

test('les dessins du sprite ne sont pas recopiés dans les pages', () => {
  for (const [name, html] of Object.entries(pages)) {
    assert.doesNotMatch(html, /<svg\s+class="wave-\d"[^>]*>\s*<path/, `${name} : vague recopiée`);
    assert.doesNotMatch(html, /stroke-linecap="round"[^>]*transform="translate\(10,8\)"/, `${name} : logo recopié`);
  }
});

test('chaque lien interne mène à une ancre qui existe', () => {
  const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const anchors = Object.fromEntries(Object.entries(pages).map(([name, html]) => [name, ids(html)]));
  for (const [name, html] of Object.entries(pages)) {
    for (const [, target] of html.matchAll(/<a\b[^>]*\shref="([^"]*#[^"]+)"/g)) {
      const [file, id] = target.split('#');
      const page = file === '' ? name : file;
      assert.ok(page in anchors, `${name} : lien vers une page inconnue (${target})`);
      assert.ok(anchors[page].has(id), `${name} : l'ancre #${id} n'existe pas dans ${page}`);
    }
  }
});

test('les commentaires de section suivent le format « ── NOM ── » (HTML-60)', () => {
  for (const [name, html] of Object.entries(pages)) {
    for (const [, text] of html.matchAll(/<!--([\s\S]*?)-->/g)) {
      assert.match(text.trim(), /^── .+ ──$/, `${name} : commentaire hors format « <!-- ── NOM ── --> » : ${text.trim()}`);
    }
  }
});

test('chaque page porte les liens vers les pages légales, et ces pages existent', () => {
  for (const [name, html] of Object.entries(pages)) {
    for (const file of ['mentions-legales.html', 'confidentialite.html']) {
      assert.match(html, new RegExp(`class="footer-legal-link" href="${file}"`), `${name} : lien vers ${file} absent du pied de page`);
    }
  }
});
