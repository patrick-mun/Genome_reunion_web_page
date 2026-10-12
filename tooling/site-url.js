/* ============================================================
   tooling/site-url.js
   Rôle : transformations qui dépendent de l'adresse définitive du site (balises canonical, og:url,
   og:image, sitemap.xml, robots.txt, chemins de la page 404), utilisées par set-site-url.mjs.
   Logique pure, sans fichier ni réseau.
   Pages concernées : aucune (outil de mise en ligne).
   Accroches : aucune.
   ============================================================ */

const TWITTER_CARD_LINE = /^([ \t]*)<meta name="twitter:card" content="summary" \/>$/m;
const NOINDEX_LINE = /^[ \t]*<meta name="robots" content="noindex" \/>\r?\n/m;
const URL_ATTRIBUTE = /\b(href|src)="([^"]*)"/g;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Échappe une valeur pour un attribut HTML ou un texte XML.
 * @param {string} value Valeur brute.
 * @returns {string} Valeur échappée.
 */
function escapeMarkup(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Analyse l'adresse du site : origine et dossier de base (le site peut être dans un sous-dossier).
 * @param {string} input Adresse saisie, par exemple « https://exemple.fr/ ».
 * @returns {{origin: string, basePath: string, secure: boolean}} `basePath` commence et finit par « / ».
 * @throws {Error} Si l'adresse n'est pas une adresse http(s) simple (sans paramètres ni ancre).
 */
export function parseSiteUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`Adresse invalide : « ${input} ». Attendu : https://exemple.fr/`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Adresse invalide : « ${input} » doit commencer par https:// (ou http://).`);
  }
  if (url.search || url.hash) {
    throw new Error(`Adresse invalide : « ${input} » ne doit pas contenir de paramètres ni d'ancre.`);
  }
  const basePath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  return { origin: url.origin, basePath, secure: url.protocol === 'https:' };
}

/**
 * Adresse complète d'une page ; l'accueil est l'adresse du dossier, sans « index.html ».
 * @param {{origin: string, basePath: string}} site Résultat de parseSiteUrl.
 * @param {string} file Nom du fichier de la page (« participer.html »).
 * @returns {string} Adresse absolue de la page.
 */
export function pageUrl(site, file) {
  const root = `${site.origin}${site.basePath}`;
  return file === 'index.html' ? root : `${root}${file}`;
}

/**
 * Ajoute canonical et og:url, et, avec une image, og:image et twitter:image (la carte de partage
 * passe alors à « summary_large_image »). Les balises se placent après twitter:card.
 * @param {string} html Source d'une page.
 * @param {{canonicalUrl: string, imageUrl?: string, imageAlt?: string}} options Adresses absolues.
 * @returns {string} Page complétée.
 * @throws {Error} Si la page n'a pas la balise twitter:card attendue ou porte déjà un canonical.
 */
export function addSeoTags(html, { canonicalUrl, imageUrl, imageAlt }) {
  if (html.includes('rel="canonical"')) throw new Error('la page porte déjà une balise canonical');
  const anchor = html.match(TWITTER_CARD_LINE);
  if (!anchor) throw new Error('balise <meta name="twitter:card" content="summary" /> introuvable');
  const indent = anchor[1];
  const tags = [
    `<link rel="canonical" href="${escapeMarkup(canonicalUrl)}" />`,
    `<meta property="og:url" content="${escapeMarkup(canonicalUrl)}" />`,
  ];
  let card = '<meta name="twitter:card" content="summary" />';
  if (imageUrl) {
    card = '<meta name="twitter:card" content="summary_large_image" />';
    tags.push(`<meta property="og:image" content="${escapeMarkup(imageUrl)}" />`);
    if (imageAlt) tags.push(`<meta property="og:image:alt" content="${escapeMarkup(imageAlt)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeMarkup(imageUrl)}" />`);
  }
  return html.replace(TWITTER_CARD_LINE, [`${indent}${card}`, ...tags.map((tag) => `${indent}${tag}`)].join('\n'));
}

/**
 * Retire la balise noindex posée dans les sources pendant la construction : la copie de production doit
 * pouvoir être indexée. Sans effet si la page n'a pas cette balise.
 * @param {string} html Source d'une page.
 * @returns {string} Page sans balise noindex.
 */
export function removeNoindex(html) {
  return html.replace(NOINDEX_LINE, '');
}

/**
 * Rend absolus (depuis le dossier de base du site) les href et src relatifs : la page 404 est servie
 * pour n'importe quelle adresse inconnue, quelle que soit sa profondeur. Les ancres, les adresses
 * absolues et celles qui ont un schéma (mailto:, https:) restent telles quelles.
 * @param {string} html Source de la page.
 * @param {string} basePath Dossier de base, commençant et finissant par « / ».
 * @returns {string} Page aux chemins absolus.
 */
export function absolutizeLinks(html, basePath) {
  return html.replace(URL_ATTRIBUTE, (match, attribute, value) =>
    value === '' || value.startsWith('#') || value.startsWith('/') || HAS_SCHEME.test(value)
      ? match
      : `${attribute}="${basePath}${value}"`,
  );
}

/**
 * Construit sitemap.xml.
 * @param {string[]} urls Adresses absolues des pages à indexer.
 * @returns {string} Contenu du fichier.
 */
export function buildSitemap(urls) {
  const entries = urls.map((url) => `  <url><loc>${escapeMarkup(url)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

/**
 * Construit robots.txt : tout est autorisé et le plan du site est indiqué.
 * @param {string} sitemapUrl Adresse absolue de sitemap.xml.
 * @returns {string} Contenu du fichier.
 */
export function buildRobots(sitemapUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
}
