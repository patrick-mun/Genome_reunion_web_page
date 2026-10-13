/* ============================================================
   tooling/collectes.test.js
   Rôle : tests de la lecture du CSV des collectes (collectes.js) et, de bout en bout, de la commande
   update-collectes.mjs sur une copie de participer.html.
   Pages concernées : participer.html (copie analysée, jamais modifiée).
   Accroches : aucune (lancé par node --test).
   ============================================================ */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { buildRow, detectDelimiter, formatDate, formatHours, parseDate, readEntries, selectEntries, splitCsv } from './collectes.js';

const ROOT = new URL('..', import.meta.url).pathname;
const SCRIPT = join(ROOT, 'tooling/update-collectes.mjs');
const TEMPLATE_CSV = join(ROOT, 'data/collectes.csv');
const work = mkdtempSync(join(tmpdir(), 'collectes-'));
after(() => rmSync(work, { recursive: true, force: true }));

const copyPage = (name) => {
  const page = join(work, name);
  copyFileSync(join(ROOT, 'participer.html'), page);
  return page;
};
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
const countRows = (html) => (html.match(/<tr class="collecte-row">/g) ?? []).length;

test('splitCsv : guillemets, guillemets doublés, retours à la ligne dans une cellule et fins de ligne Windows', () => {
  assert.deepEqual(splitCsv('a;b\r\n"x;y";"dit ""oui"""\r\nz;"l1\nl2"', ';'), [['a', 'b'], ['x;y', 'dit "oui"'], ['z', 'l1\nl2']]);
  assert.deepEqual(splitCsv('', ';'), []);
});

test('detectDelimiter : point-virgule (Excel français) ou virgule', () => {
  assert.equal(detectDelimiter('zone;date;lieu'), ';');
  assert.equal(detectDelimiter('zone,date,lieu'), ',');
});

test('parseDate : 05/11/2026 et 2026-11-05, refuse les dates impossibles', () => {
  assert.equal(parseDate('05/11/2026'), '2026-11-05');
  assert.equal(parseDate('5/1/2026'), '2026-01-05');
  assert.equal(parseDate('2026-11-05'), '2026-11-05');
  for (const bad of ['31/02/2026', '2026-13-01', 'demain', '']) assert.equal(parseDate(bad), null, bad);
});

test('formatDate : jour de la semaine calculé, au format du calendrier', () => {
  assert.equal(formatDate('2026-07-03'), 'Ven. 3 juil. 2026');
  assert.equal(formatDate('2026-08-07'), 'Ven. 7 août 2026');
  assert.equal(formatDate('2026-09-15'), 'Mar. 15 sept. 2026');
});

test('formatHours : tiret demi-cadratin entre deux heures, texte libre conservé', () => {
  assert.equal(formatHours('8h-13h30'), '8h – 13h30');
  assert.equal(formatHours('9h – 15h'), '9h – 15h');
  assert.equal(formatHours('toute la journée'), 'toute la journée');
});

test('readEntries : entrées valides et erreurs avec numéro de ligne, colonnes dans le désordre et accents', () => {
  const csv = 'Horaires;Zone;Date;Lieu;Adresse\n8h-13h;Nord;05/11/2026;Mairie;1 rue A\n9h;Est;06/11/2026;X;Y\n9h;Sud;31/02/2026;X;Y\n;Sud;07/11/2026;X;Y';
  const { entries, errors } = readEntries(csv);
  assert.deepEqual(entries, [{ zone: 'nord', date: '2026-11-05', lieu: 'Mairie', adresse: '1 rue A', horaires: '8h – 13h' }]);
  assert.equal(errors.length, 3);
  assert.match(errors[0], /ligne 3 : zone « Est » inconnue/);
  assert.match(errors[1], /ligne 4 : date « 31\/02\/2026 » invalide/);
  assert.match(errors[2], /ligne 5 : lieu et horaires sont obligatoires/);
  assert.match(readEntries('zone;date\nNord;05/11/2026').errors[0], /colonne\(s\) manquante\(s\) : lieu, adresse, horaires/);
});

test('selectEntries : retire les dates passées (sauf --keep-past), trie, sépare les zones', () => {
  const entries = [
    { zone: 'sud', date: '2026-11-10' },
    { zone: 'nord', date: '2026-11-20' },
    { zone: 'nord', date: '2026-11-05' },
    { zone: 'nord', date: '2026-10-01' },
  ];
  const selected = selectEntries(entries, '2026-11-05', false);
  assert.deepEqual(selected.nord.map((e) => e.date), ['2026-11-05', '2026-11-20']);
  assert.equal(selected.sud.length, 1);
  assert.equal(selectEntries(entries, '2026-11-05', true).nord.length, 3);
});

test('buildRow : balisage identique à celui de la page, texte échappé, adresse facultative', () => {
  const html = buildRow({ date: '2026-11-05', lieu: 'Café <Le Port> & Cie', adresse: '', horaires: '9h – 15h' });
  assert.match(html, /<td class="collecte-date">Jeu\. 5 nov\. 2026<\/td>/);
  assert.match(html, /Café &lt;Le Port&gt; &amp; Cie/);
  assert.doesNotMatch(html, /collecte-adresse/);
});

test('commande : le modèle CSV remplit la vraie page, sans toucher au reste', () => {
  const page = copyPage('page-1.html');
  const before = readFileSync(page, 'utf8');
  const result = run(TEMPLATE_CSV, '--page', page, '--today', '2026-01-01');
  assert.equal(result.status, 0, result.stderr);
  const after = readFileSync(page, 'utf8');
  assert.equal(countRows(after), 14);
  assert.match(after, /Ven\. 3 juil\. 2026/);
  const outside = (html) => html.replace(/<tbody>[\s\S]*?<\/tbody>/g, '<tbody></tbody>');
  assert.equal(outside(after), outside(before), 'la page a changé hors des tableaux');
  // Le balisage généré est celui de la page d'origine : seuls les jours de la semaine fictifs diffèrent.
  const withoutWeekday = (html) => html.replace(/(collecte-date">)[^ <]+ /g, '$1');
  assert.equal(withoutWeekday(after), withoutWeekday(before), 'le balisage des lignes diffère de celui de la page');
  assert.match(run(TEMPLATE_CSV, '--page', page, '--today', '2026-01-01').stdout, /déjà à jour/);
});

test('commande : dates passées retirées, tableaux vides signalés, --check n\'écrit rien', () => {
  const page = copyPage('page-2.html');
  const result = run(TEMPLATE_CSV, '--page', page, '--today', '2026-07-20');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /date\(s\) passée\(s\) ignorée\(s\)/);
  const partial = readFileSync(page, 'utf8');
  assert.ok(countRows(partial) > 0 && countRows(partial) < 14);
  assert.doesNotMatch(partial, /Ven\. 3 juil\. 2026/);

  const empty = run(TEMPLATE_CSV, '--page', page, '--today', '2027-01-01');
  assert.match(empty.stderr, /aucune date à venir/);
  assert.equal((readFileSync(page, 'utf8').match(/Aucune date programmée/g) ?? []).length, 2);

  const check = copyPage('page-3.html');
  const original = readFileSync(check, 'utf8');
  assert.match(run(TEMPLATE_CSV, '--page', check, '--today', '2026-07-20', '--check').stdout, /aucune écriture/);
  assert.equal(readFileSync(check, 'utf8'), original);
});

test('commande : erreurs de saisie, rien n\'est modifié ; accents Windows-1252 et virgules acceptés', () => {
  const page = copyPage('page-4.html');
  const original = readFileSync(page, 'utf8');
  const bad = join(work, 'mauvais.csv');
  writeFileSync(bad, 'zone;date;lieu;adresse;horaires\nNord;pas une date;X;Y;8h-9h\n');
  const failed = run(bad, '--page', page);
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /ligne 2 : date « pas une date » invalide/);
  assert.equal(readFileSync(page, 'utf8'), original);
  assert.equal(run(join(work, 'absent.csv'), '--page', page).status, 1);

  const latin = join(work, 'excel-fr.csv');
  writeFileSync(latin, Buffer.from('zone,date,lieu,adresse,horaires\nSud,05/11/2026,Médiathèque de Saint-André,Rue du Stade,8h-12h\n', 'latin1'));
  assert.equal(run(latin, '--page', page, '--today', '2026-01-01').status, 0);
  assert.match(readFileSync(page, 'utf8'), /Médiathèque de Saint-André/);
});
