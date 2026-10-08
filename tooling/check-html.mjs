#!/usr/bin/env node
// Contrôles HTML que html-validate ne couvre pas (règles HTML-01, 10, 21, 22, 33, 34, 35, 43).
// Usage : node check-html.mjs <fichier-ou-dossier>...
// Sortie : erreurs (code 1) et avertissements. Analyse par expressions régulières :
// pages complètes uniquement, les fragments et modèles de gabarit ne sont pas gérés.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function collect(path) {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((name) => {
    if (name === 'node_modules' || name.startsWith('.')) return [];
    const full = join(path, name);
    return statSync(full).isDirectory() ? collect(full) : full.endsWith('.html') ? [full] : [];
  });
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage : node check-html.mjs <fichier-ou-dossier>...');
  process.exit(2);
}

let errorCount = 0;
let warningCount = 0;

for (const file of targets.flatMap(collect)) {
  const raw = readFileSync(file, 'utf8');
  // Les commentaires sont blanchis (même longueur) pour garder les numéros de ligne.
  const text = raw.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  const lineOf = (index) => text.slice(0, index).split('\n').length;
  const report = (level, index, id, message) => {
    const where = index === null ? '' : `:${lineOf(index)}`;
    console.log(`${file}${where}  ${level}  ${id}  ${message}`);
    level === 'erreur' ? errorCount++ : warningCount++;
  };

  // HTML-21 : pas de gestionnaire d'événement inline
  for (const m of text.matchAll(/<[a-z][^>]*?\s(on[a-z]+)\s*=/gi)) {
    report('erreur', m.index, 'HTML-21', `attribut ${m[1]}= interdit, utiliser addEventListener`);
  }

  // HTML-22 : scripts
  const bodyStart = text.search(/<body[\s>]/i);
  for (const m of text.matchAll(/<script\b([^>]*)>/gi)) {
    const attrs = m[1];
    const type = /type\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1] ?? '';
    const isData = /^(application\/(ld\+)?json|importmap)$/i.test(type);
    if (!/\bsrc\s*=/i.test(attrs)) {
      if (!isData) report('erreur', m.index, 'HTML-22', 'script inline avec logique, le déplacer dans un fichier');
      continue;
    }
    if (type.toLowerCase() !== 'module' && !/\b(defer|async)\b/i.test(attrs)) {
      report('erreur', m.index, 'HTML-22', 'script externe sans defer');
    }
    if (bodyStart >= 0 && m.index > bodyStart) {
      report('erreur', m.index, 'HTML-22', 'script externe à placer dans <head>');
    }
  }

  // HTML-01 : meta charset en premier dans <head>, meta description
  const head = /<head[^>]*>\s*(<[^>]*>)?/i.exec(text);
  if (!head || !/^<meta\s+charset\s*=/i.test(head[1] ?? '')) {
    report('erreur', head ? head.index : null, 'HTML-01', '<meta charset> doit être le premier élément de <head>');
  }
  if (!/<meta\s+[^>]*name\s*=\s*["']description["']/i.test(text)) {
    report('erreur', null, 'HTML-01', '<meta name="description"> absent');
  }

  // HTML-10 : repères de page
  const mains = [...text.matchAll(/<main[\s>]/gi)].length;
  if (mains !== 1) report('erreur', null, 'HTML-10', `${mains} élément(s) <main>, un seul attendu`);
  for (const tag of ['header', 'footer']) {
    if (!new RegExp(`<${tag}[\\s>]`, 'i').test(text)) report('erreur', null, 'HTML-10', `<${tag}> absent`);
  }

  // HTML-33 : ressources en HTTPS (ni http: ni //)
  for (const m of text.matchAll(/<(?:[a-z][^>]*?\s(?:src|srcset|poster)|link\b[^>]*?\shref)\s*=\s*["'](?:http:|\/\/)/gi)) {
    report('erreur', m.index, 'HTML-33', 'ressource en http: ou sans protocole, utiliser https: ou un chemin relatif');
  }

  // HTML-34 : pas de type inutile sur <script> et <link rel="stylesheet">
  for (const m of text.matchAll(/<script\b[^>]*\stype\s*=\s*["'](?:text|application)\/(?:java|ecma)script["']/gi)) {
    report('erreur', m.index, 'HTML-34', 'type inutile sur <script>');
  }
  for (const m of text.matchAll(/<link\b[^>]*\stype\s*=\s*["']text\/css["']/gi)) {
    report('erreur', m.index, 'HTML-34', 'type inutile sur <link rel="stylesheet">');
  }

  // HTML-35 : pas d'entité pour un caractère UTF-8 (hors &lt; &gt; &amp; &quot; &apos; &nbsp;)
  for (const m of text.matchAll(/&(?!(?:lt|gt|amp|quot|apos|nbsp);)(?:[a-z][a-z0-9]*|#\d+|#x[0-9a-f]+);/gi)) {
    report('erreur', m.index, 'HTML-35', `entité ${m[0]} : écrire le caractère UTF-8`);
  }

  // HTML-43 : <br> pour la mise en forme (avertissement : l'intention relève du jugement)
  for (const m of text.matchAll(/<br\b/gi)) {
    report('avertissement', m.index, 'HTML-43', '<br> : vérifier que le saut de ligne fait partie du contenu');
  }
}

console.log(`\n${errorCount} erreur(s), ${warningCount} avertissement(s).`);
process.exit(errorCount > 0 ? 1 : 0);
