/* ============================================================
   tooling/update-collectes.mjs
   Rôle : met à jour les deux tableaux du calendrier de collecte de participer.html (zones Nord et Sud)
   à partir d'un fichier CSV exporté d'Excel. Les dates passées sont retirées, les autres triées.
   Usage : npm run collectes -- [fichier.csv] [--page <page.html>] [--today AAAA-MM-JJ] [--keep-past] [--check]
   Pages concernées : participer.html.
   Accroches : aucune (outil de mise à jour du contenu).
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEntries, replaceZoneRows, selectEntries } from './collectes.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_CSV = resolve(repoRoot, 'data/collectes.csv');
const DEFAULT_PAGE = resolve(repoRoot, 'participer.html');
const BOM = 0xfeff;
const USAGE = 'Usage : npm run collectes -- [fichier.csv] [--page <page.html>] [--today AAAA-MM-JJ] [--keep-past] [--check]';

/**
 * Affiche un message d'erreur et arrête le script.
 * @param {string} message Message.
 */
function fail(message) {
  console.error(message);
  process.exit(1);
}

/**
 * Lit les arguments de la ligne de commande.
 * @param {string[]} args Arguments après le nom du script.
 * @returns {{csv: string, page: string, today?: string, keepPast: boolean, check: boolean}} Options.
 */
function parseArgs(args) {
  const options = { csv: DEFAULT_CSV, page: DEFAULT_PAGE, keepPast: false, check: false };
  const switches = { '--keep-past': 'keepPast', '--check': 'check' };
  const values = { '--page': 'page', '--today': 'today' };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg in switches) options[switches[arg]] = true;
    else if (arg in values) options[values[arg]] = args[++i] ?? fail(`${arg} attend une valeur. ${USAGE}`);
    else if (arg.startsWith('--')) fail(`Option inconnue : ${arg}. ${USAGE}`);
    else options.csv = resolve(arg);
  }
  options.page = resolve(options.page);
  return options;
}

/**
 * Date du jour à La Réunion, au format « AAAA-MM-JJ ».
 * @returns {string} Date du jour.
 */
function todayInReunion() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Reunion' }).format(new Date());
}

/**
 * Lit un fichier texte en UTF-8, ou en Windows-1252 (export « CSV » d'Excel en français) s'il n'est pas
 * en UTF-8 valide ; retire le BOM.
 * @param {string} path Chemin du fichier.
 * @returns {string} Contenu du fichier.
 */
function readText(path) {
  const bytes = readFileSync(path);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder('windows-1252').decode(bytes);
  }
  return text.charCodeAt(0) === BOM ? text.slice(1) : text;
}

const options = parseArgs(process.argv.slice(2));
const today = options.today ?? todayInReunion();
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) fail(`--today attend AAAA-MM-JJ, reçu « ${today} ».`);

let csvText;
try {
  csvText = readText(options.csv);
} catch {
  fail(`Fichier introuvable : ${options.csv}`);
}
const { entries, errors } = readEntries(csvText);
if (errors.length > 0) fail(`Le fichier contient des erreurs, rien n'a été modifié :\n  - ${errors.join('\n  - ')}`);

const selected = selectEntries(entries, today, options.keepPast);
let html = readFileSync(options.page, 'utf8');
try {
  for (const [zone, zoneEntries] of Object.entries(selected)) html = replaceZoneRows(html, zone, zoneEntries);
} catch (error) {
  fail(`${options.page} : ${error.message}`);
}

const skipped = entries.length - Object.values(selected).flat().length;
console.log(`Calendrier du ${today} : ${selected.nord.length} date(s) Nord, ${selected.sud.length} date(s) Sud${skipped > 0 ? `, ${skipped} date(s) passée(s) ignorée(s)` : ''}.`);
if (Object.values(selected).every((zoneEntries) => zoneEntries.length === 0)) console.warn('Attention : aucune date à venir, les deux tableaux affichent « Aucune date programmée ».');
if (options.check) {
  console.log('Mode --check : aucune écriture.');
} else if (html === readFileSync(options.page, 'utf8')) {
  console.log(`${options.page} est déjà à jour.`);
} else {
  writeFileSync(options.page, html);
  console.log(`${options.page} mis à jour.`);
}
