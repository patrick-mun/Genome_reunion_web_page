/* ============================================================
   tooling/collectes.js
   Rôle : lecture d'un fichier CSV de dates de collecte (export d'Excel) et mise à jour des tableaux
   du calendrier de participer.html, utilisées par update-collectes.mjs. Logique pure, sans fichier.
   Pages concernées : participer.html (analysée par update-collectes.mjs).
   Accroches : aucune.
   ============================================================ */

const COLUMNS = ['zone', 'date', 'lieu', 'adresse', 'horaires'];
const ZONES = ['nord', 'sud'];
const ROW_INDENT = ' '.repeat(18);
const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Échappe un texte pour du HTML.
 * @param {string} value Texte brut.
 * @returns {string} Texte échappé.
 */
function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Choisit le séparateur d'un CSV : Excel en français écrit des points-virgules.
 * @param {string} text Contenu du fichier.
 * @returns {string} « ; » ou « , ».
 */
export function detectDelimiter(text) {
  const header = text.split(/\r?\n/, 1)[0];
  return header.split(';').length >= header.split(',').length ? ';' : ',';
}

/**
 * Lit une cellule à partir de la position donnée : entre guillemets (avec « "" » pour un guillemet) ou brute.
 * @param {string} source CSV dont les fins de ligne sont des « \n ».
 * @param {number} start Position du premier caractère de la cellule.
 * @param {string} delimiter Séparateur de cellules.
 * @returns {{value: string, end: number}} Texte de la cellule et position du séparateur ou de la fin de ligne.
 */
function readCell(source, start, delimiter) {
  let i = start;
  let value = '';
  if (source[i] === '"') {
    i++;
    while (i < source.length) {
      if (source[i] === '"' && source[i + 1] === '"') {
        value += '"';
        i += 2;
      } else if (source[i] === '"') {
        i++;
        break;
      } else {
        value += source[i++];
      }
    }
  }
  while (i < source.length && source[i] !== delimiter && source[i] !== '\n') value += source[i++];
  return { value, end: i };
}

/**
 * Découpe un CSV en lignes de cellules (guillemets, guillemets doublés et retours à la ligne dans une
 * cellule pris en charge).
 * @param {string} text Contenu du fichier, sans BOM.
 * @param {string} delimiter Séparateur de cellules.
 * @returns {string[][]} Lignes de cellules.
 */
export function splitCsv(text, delimiter) {
  const source = text.replace(/\r\n?/g, '\n');
  const rows = [];
  let row = [];
  let i = 0;
  while (i < source.length) {
    const { value, end } = readCell(source, i, delimiter);
    row.push(value);
    if (source[end] !== delimiter) {
      rows.push(row);
      row = [];
    }
    i = end + 1;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

/**
 * Normalise un nom de colonne : minuscules, sans accent ni espace superflu.
 * @param {string} name Nom lu dans l'en-tête.
 * @returns {string} Nom normalisé (« horaires », « zone »…).
 */
function normalizeHeader(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Convertit une date saisie (« 2026-11-05 » ou « 05/11/2026 ») en « AAAA-MM-JJ ».
 * @param {string} input Date saisie.
 * @returns {string|null} Date au format ISO, ou null si elle est invalide.
 */
export function parseDate(input) {
  const iso = input.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const french = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const [year, month, day] = iso ? iso.slice(1) : french ? [french[3], french[2], french[1]] : [];
  if (!year) return null;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const valid = date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day);
  return valid ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
}

/**
 * Écrit une date au format du calendrier : « Jeu. 3 juil. 2026 ».
 * @param {string} iso Date « AAAA-MM-JJ ».
 * @returns {string} Date lisible.
 */
export function formatDate(iso) {
  const text = DATE_FORMAT.format(new Date(`${iso}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Met une plage d'horaires au format « 8h – 13h » (tiret demi-cadratin) ; tout autre texte est gardé.
 * @param {string} input Horaires saisis, par exemple « 8h-13h ».
 * @returns {string} Horaires normalisés.
 */
export function formatHours(input) {
  const text = input.trim();
  return /^\d{1,2}h\d{0,2}\s*[-–—]\s*\d{1,2}h\d{0,2}$/.test(text) ? text.replace(/\s*[-–—]\s*/, ' – ') : text;
}

/**
 * Transforme le texte d'un CSV en entrées de calendrier, en signalant chaque erreur avec son numéro de ligne.
 * @param {string} text Contenu du fichier, sans BOM.
 * @returns {{entries: Array<{zone: string, date: string, lieu: string, adresse: string, horaires: string}>, errors: string[]}} Entrées valides et erreurs.
 */
export function readEntries(text) {
  const rows = splitCsv(text, detectDelimiter(text)).filter((row) => row.some((cell) => cell.trim() !== ''));
  const header = (rows[0] ?? []).map(normalizeHeader);
  const missing = COLUMNS.filter((name) => !header.includes(name));
  if (missing.length > 0) return { entries: [], errors: [`colonne(s) manquante(s) : ${missing.join(', ')} (attendu : ${COLUMNS.join(' ; ')})`] };
  const entries = [];
  const errors = [];
  rows.slice(1).forEach((cells, index) => {
    const line = index + 2;
    const get = (name) => (cells[header.indexOf(name)] ?? '').trim();
    const zone = get('zone').toLowerCase();
    const date = parseDate(get('date'));
    if (!ZONES.includes(zone)) errors.push(`ligne ${line} : zone « ${get('zone')} » inconnue (attendu : Nord ou Sud)`);
    else if (!date) errors.push(`ligne ${line} : date « ${get('date')} » invalide (attendu : 05/11/2026 ou 2026-11-05)`);
    else if (!get('lieu') || !get('horaires')) errors.push(`ligne ${line} : lieu et horaires sont obligatoires`);
    else entries.push({ zone, date, lieu: get('lieu'), adresse: get('adresse'), horaires: formatHours(get('horaires')) });
  });
  return { entries, errors };
}

/**
 * Choisit, trie et classe par zone les dates à afficher.
 * @param {Array<{zone: string, date: string}>} entries Entrées valides.
 * @param {string} today Date du jour « AAAA-MM-JJ ».
 * @param {boolean} keepPast Garder aussi les dates passées.
 * @returns {Record<string, object[]>} Entrées triées par date, pour chaque zone.
 */
export function selectEntries(entries, today, keepPast) {
  return Object.fromEntries(
    ZONES.map((zone) => [zone, entries.filter((e) => e.zone === zone && (keepPast || e.date >= today)).sort((a, b) => a.date.localeCompare(b.date))]),
  );
}

/**
 * Écrit une ligne du tableau, au balisage de participer.html.
 * @param {{date: string, lieu: string, adresse: string, horaires: string}} entry Entrée du calendrier.
 * @returns {string} Ligne <tr> indentée.
 */
export function buildRow(entry) {
  const pad = (depth) => ROW_INDENT + '  '.repeat(depth);
  const address = entry.adresse ? `\n${pad(2)}<div class="collecte-adresse">${escapeHtml(entry.adresse)}</div>` : '';
  return [
    `${pad(0)}<tr class="collecte-row">`,
    `${pad(1)}<td class="collecte-date">${formatDate(entry.date)}</td>`,
    `${pad(1)}<td>`,
    `${pad(2)}<div class="collecte-lieu">${escapeHtml(entry.lieu)}</div>${address}`,
    `${pad(1)}</td>`,
    `${pad(1)}<td class="collecte-horaire">${escapeHtml(entry.horaires)}</td>`,
    `${pad(0)}</tr>`,
  ].join('\n');
}

/**
 * Remplace les lignes du tableau d'une zone dans participer.html (ligne unique si aucune date).
 * @param {string} html Source de la page.
 * @param {string} zone « nord » ou « sud ».
 * @param {object[]} entries Entrées à afficher pour cette zone.
 * @returns {string} Page mise à jour.
 * @throws {Error} Si le tableau de la zone est introuvable.
 */
export function replaceZoneRows(html, zone, entries) {
  const pattern = new RegExp(`(collecte-zone-badge collecte-zone-${zone}[\\s\\S]*?<tbody>\\n)[\\s\\S]*?(\\n {16}</tbody>)`);
  if (!pattern.test(html)) throw new Error(`tableau de la zone ${zone} introuvable dans la page`);
  const empty = `${ROW_INDENT}<tr class="collecte-row">\n${ROW_INDENT}  <td colspan="3">Aucune date programmée pour le moment.</td>\n${ROW_INDENT}</tr>`;
  const rows = entries.length > 0 ? entries.map(buildRow).join('\n') : empty;
  return html.replace(pattern, (match, start, end) => `${start}${rows}${end}`);
}
