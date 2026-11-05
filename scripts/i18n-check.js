#!/usr/bin/env node
// Translation check: is everything this branch adds to the page translated into all 8 languages?
//   node scripts/i18n-check.js                     this copy (including uncommitted changes) against origin/main
//   node scripts/i18n-check.js --base <ref> --head <ref>   two commits, e.g. to try it on an old pull request
// It looks at the lines the branch adds to src/carreau.html and src/web-boot.js: text between tags and quoted
// sentences ("Result saved.") are looked up with the app's own translation code (tr), in every language.
// It also lists keys that some languages have and others don't (only the ones this branch introduced).
// Text that should stay in English (names, codes) belongs in an element with data-notr; such lines are skipped.
// Exit code 1 when something is missing, so scripts/check.sh stops.
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), FILES = ['src/carreau.html', 'src/web-boot.js'], LANGS = ['fr', 'es', 'it', 'de', 'nl', 'pt', 'th'];
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const headRef = arg('--head');
let base = arg('--base');
if (!base) { try { base = git('merge-base', 'HEAD', 'origin/main').trim(); } catch { base = 'main'; } }
const read = (ref, f) => ref ? git('show', `${ref}:${f}`) : fs.readFileSync(path.join(ROOT, f), 'utf8');

// the app's own translation tables and lookup (the same code the page runs)
function engine(html) {
  const a = html.indexOf('/* @@I18N-DATA-START'), b = html.indexOf('/* @@I18N-DATA-END */');
  const fnA = html.indexOf('// Rounds with their own French names'), fnB = html.indexOf('/* translation engine');
  const trA = html.indexOf('function frCompile()'), trB = html.indexOf('function localize(root)');
  if ([a, b, fnA, fnB, trA, trB].some(i => i < 0)) throw new Error('i18n-check: markers not found in src/carreau.html (update scripts/i18n-check.js)');
  const code = html.slice(html.indexOf('*/', a) + 2, b) + '\n' + html.slice(fnA, fnB) +
    '\nconst I18N = { lang: "en", cache: {}, exact: null, re: [], loaded: {} };\n' + html.slice(trA, trB) +
    '\nreturn { tables: { fr: FR_TEXT, ...LANG_TEXT }, I18N, trCore };';
  const e = new Function(code)();
  // true when the language has an entry for this text (mirrors tr(): outer spaces, "·", ":" and "?" are allowed around it)
  e.has = (lang, s) => {
    e.I18N.lang = lang;
    const m = String(s).match(/^([\s·:]*)([\s\S]*?)([\s·:?]*)$/), core = m[2];
    if (!core || !/[A-Za-z]/.test(core)) return true;
    const punct = m[3].trim();
    if ((punct === '?' || punct === ':') && e.trCore((core + punct).replace(/\s+/g, ' ')) != null) return true;
    return e.trCore(core.replace(/\s+/g, ' ')) != null;
  };
  // a ${...} that is really fixed text (e.g. ${LEG_NAME[2]}): accept any key that fits with something in its place
  e.like = (lang, t) => {
    if (!t.includes(MARK)) return false;
    const core = t.replace(/^[\s·:]+|[\s·:?.]+$/g, '').replace(/\s+/g, ' ');
    const re = new RegExp('^' + core.split(MARK).map(x => x.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&')).join('.+?') + '[\\s·:?.]*$');
    return Object.keys(e.tables[lang] || {}).some(k => re.test(k));
  };
  return e;
}

// "${...}" (with nested braces and strings) becomes a marker; when checking, it's tried as a number (which the {n}/{x}
// keys accept) and as nothing (for optional bits glued onto a word, like `finished${extra}.`)
const MARK = '\u0007';
function fillTemplates(line) {
  let out = '', i = 0;
  while (i < line.length) {
    if (line[i] === '$' && line[i + 1] === '{') {
      let d = 0, j = i + 1;
      for (; j < line.length; j++) { if (line[j] === '{') d++; else if (line[j] === '}' && --d === 0) break; }
      out += /</.test(line.slice(i, j)) ? '<i>' : MARK; i = j + 1; // HTML inside ${} splits the text, as it does on the page
    } else out += line[i++];
  }
  return out;
}
const variants = t => [t.replace(/(\S?)\u0007/g, (m, c) => /[A-Za-z)]/.test(c) ? c : c + '7'), t.replace(/\u0007/g, '7'), t.replace(/\u0007/g, '').replace(/\s+/g, ' ').trim()];
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&middot;/g, '·').replace(/&hellip;/g, '…').replace(/&[lr]?[sd]?quo;|&#39;|&quot;/g, "'").replace(/&[a-z]+;/g, ' ');
const codeLike = s => /=>|==|&&|\|\||\+\+|--|[;{}"`\\[\]]| \? .* : |\b[a-z]\w*\.[a-z]\w*/.test(s);
const looksLikeText = s => /[A-Za-z]{2,}/.test(s) && !codeLike(s) && !/^\s*[a-z-]+\s*$/.test(s) && !/©/.test(s);
const sentence = s => /^[A-Z][^<>]*[a-z]/.test(s) && (/\s/.test(s.trim()) || /[.!?…:]$/.test(s)) && s.length <= 240 && !/^[A-Z_]+$/.test(s) && !/https?:|\.(js|json|png|html)\b|©/.test(s);

function candidates(line) {
  const out = new Set(), filled = fillTemplates(line);
  for (const m of filled.matchAll(/>([^<>]+)</g)) { const t = decode(m[1]).replace(/[ \t]+/g, ' ').trim(); if (looksLikeText(t.replace(/\u0007/g, '7'))) out.add(t); }
  for (const m of filled.matchAll(/"((?:[^"\\]|\\.){3,240})"|'((?:[^'\\]|\\.){3,240})'|`([^`<>]{3,240})`/g)) {
    const t = (m[1] ?? m[2] ?? m[3]).replace(/\\(.)/g, '$1').trim();
    if (sentence(t.replace(/\u0007/g, '7'))) out.add(t);
  }
  return out;
}
// web-boot.js sections whose heading mentions "admin" are the site admin's own pages (English only)
function adminLines(js) {
  const skip = new Set(); let inAdmin = false;
  js.split('\n').forEach((l, i) => { if (/^\s*(\/\*|\/\/) -{3,}/.test(l)) inAdmin = /admin/i.test(l); if (inAdmin) skip.add(i + 1); });
  return skip;
}

const headHtml = read(headRef, FILES[0]), baseHtml = read(base, FILES[0]);
const H = engine(headHtml), B = engine(baseHtml);
const problems = [];

// 1. keys that only some languages have, new on this branch
const union = t => new Set(Object.values(t).flatMap(Object.keys));
const headKeys = union(H.tables), baseKeys = union(B.tables);
for (const k of headKeys) {
  const missing = LANGS.filter(l => !(k in H.tables[l]));
  const before = baseKeys.has(k) ? LANGS.filter(l => !(k in B.tables[l])) : [];
  const fresh = missing.filter(l => !before.includes(l));
  if (fresh.length) problems.push(`key "${k}" is missing in: ${fresh.join(', ')}`);
}

// 2. text the branch adds to the page that a language can't translate
const diff = headRef ? git('diff', '-U0', base, headRef, '--', ...FILES) : git('diff', '-U0', base, '--', ...FILES);
const [i18nA, i18nB] = [headHtml.indexOf('/* @@I18N-DATA-START'), headHtml.indexOf('/* @@I18N-DATA-END */')].map(i => headHtml.slice(0, i).split('\n').length);
let file = '', ln = 0; const seen = new Set(), adminOnly = adminLines(read(headRef, FILES[1]));
for (const row of diff.split('\n')) {
  if (row.startsWith('+++ ')) { file = row.slice(6); continue; }
  const h = row.match(/^@@ -\S+ \+(\d+)/); if (h) { ln = +h[1]; continue; }
  if (!row.startsWith('+')) continue;
  const line = row.slice(1), at = ln++;
  if (file === FILES[0] && at >= i18nA && at <= i18nB) continue; // the translation tables themselves
  if (/data-notr|console\.|throw new|new Error\(|\/\/ i18n-ok/.test(line) || /^\s*(\/\/|\/\*|\*)/.test(line)) continue;
  if (file === FILES[1] && adminOnly.has(at)) continue;
  if (/^\s*["']?(en|fr|es|it|de|nl|pt|th)["']?\s*:\s*\{/.test(line)) continue; // a language's own inline table, e.g. HOF_I18N
  for (const t of candidates(line)) {
    if (seen.has(t)) continue; seen.add(t);
    const missing = LANGS.filter(l => !variants(t).some(v => H.has(l, v)) && !H.like(l, t));
    const show = variants(t)[0];
    if (missing.length === LANGS.length) problems.push(`${file}:${at} "${show}" has no translation`);
    else if (missing.length) problems.push(`${file}:${at} "${show}" is missing in: ${missing.join(', ')}`);
  }
}

if (problems.length) {
  console.log(`Translations: ${problems.length} thing(s) to fix (compared with ${headRef || 'this copy'} against ${base.slice(0, 12)}):`);
  for (const p of problems) console.log('  - ' + p);
  console.log('Add each English text as a key in FR_TEXT and LANG_TEXT.{es,it,de,nl,pt,th} (one Object.assign line per language),\n' +
    'or put text that must stay as it is (names, codes) in an element with data-notr, or end the line with // i18n-ok.');
  process.exit(1);
}
console.log(`Translations: OK, everything new is in all 8 languages (${seen.size} new text(s) checked against ${base.slice(0, 12)}).`);
