#!/usr/bin/env node
// Détecte les classes CSS définies mais jamais utilisées (règle CSS-16).
// Usage : node check-dead-code.mjs <dossier> [--ignore classe1,classe2]
// Une classe est « utilisée » si elle apparaît dans un attribut class d'un fichier
// HTML/gabarit, ou comme mot entier dans un fichier JS. Un nom construit dynamiquement
// en JS ('legend-dot-' + id) est reconnu quand un fragment de chaîne se termine par un
// tiret et commence le nom de la classe. Limites : les classes ajoutées par une
// bibliothèque externe ou construites autrement sont à déclarer avec --ignore.
// Sortie : liste des classes inutilisées (code 1 s'il y en a), avec fichier et ligne.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const ignoreIndex = args.indexOf('--ignore');
const ignored = new Set(ignoreIndex >= 0 ? args.splice(ignoreIndex, 2)[1].split(',') : []);
const root = args[0];
if (!root) {
  console.error('Usage : node check-dead-code.mjs <dossier> [--ignore classe1,classe2]');
  process.exit(2);
}

const TEMPLATE_EXT = ['.html', '.htm', '.php', '.njk', '.vue', '.jsx', '.tsx'];
const SCRIPT_EXT = ['.js', '.mjs', '.cjs', '.ts', ...TEMPLATE_EXT];

const walk = (d) =>
  readdirSync(d).flatMap((name) => {
    if (name === 'node_modules' || name.startsWith('.')) return [];
    const full = join(d, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
const files = walk(root);
const read = (f) => readFileSync(f, 'utf8');

// Classes définies : sélecteurs des fichiers .css et des blocs <style>.
const defined = new Map(); // nom -> { file, line }
const collectSelectors = (text, file, lineOffset = 0) => {
  const clean = text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(["'])(?:\\.|(?!\1).)*\1/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/url\([^)]*\)/g, (m) => m.replace(/[^\n]/g, ' '));
  for (const m of clean.matchAll(/([^{};]+)\{/g)) {
    const prelude = m[1];
    if (prelude.trim().startsWith('@')) continue;
    for (const c of prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
      if (defined.has(c[1])) continue;
      const index = m.index + m[0].indexOf(c[0]);
      defined.set(c[1], { file, line: lineOffset + clean.slice(0, index).split('\n').length });
    }
  }
};
for (const f of files) {
  if (f.endsWith('.css')) collectSelectors(read(f), f);
  else if (TEMPLATE_EXT.includes(f.slice(f.lastIndexOf('.')))) {
    const text = read(f);
    for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
      collectSelectors(m[1], f, text.slice(0, m.index).split('\n').length - 1);
    }
  }
}

// Classes utilisées.
const used = new Set();
const fragments = [];
for (const f of files) {
  const ext = f.slice(f.lastIndexOf('.'));
  if (!SCRIPT_EXT.includes(ext)) continue;
  const text = read(f);
  if (TEMPLATE_EXT.includes(ext)) {
    const body = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    for (const m of body.matchAll(/class(?:Name)?\s*=\s*["']([^"']*)["']/g)) m[1].split(/\s+/).forEach((c) => used.add(c));
  }
  if (!ext.match(/\.html?$/)) {
    for (const m of text.matchAll(/[\w-]+/g)) used.add(m[0]);
    for (const m of text.matchAll(/["'`]([\w-]*[-_])["'`]/g)) fragments.push(m[1]);
  } else {
    for (const m of text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)) {
      for (const w of m[1].matchAll(/[\w-]+/g)) used.add(w[0]);
      for (const q of m[1].matchAll(/["'`]([\w-]*[-_])["'`]/g)) fragments.push(q[1]);
    }
  }
}

const dead = [...defined].filter(([name]) => !ignored.has(name) && !used.has(name) && !fragments.some((p) => name.startsWith(p)));
for (const [name, { file, line }] of dead) console.log(`${file}:${line}  CSS-16  classe .${name} définie mais jamais utilisée`);
console.log(`\n${dead.length} classe(s) inutilisée(s) sur ${defined.size} définie(s).`);
process.exit(dead.length > 0 ? 1 : 0);
