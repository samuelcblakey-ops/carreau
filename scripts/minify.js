// Minifies the built page (dist/index.html) in place: the app script with terser, the styles with clean-css.
// The live site then serves compressed code that is much harder to read or lift; behaviour is unchanged.
// Run by scripts/build.py; the web tests run against this minified build.
const fs = require('fs');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const NOTICE = '© 2026 Sam Blakey · SN Pétanque Competition Desk. All rights reserved. Copying, modifying or reusing this code without written permission is not allowed.';

(async () => {
  const file = process.argv[2];
  let html = fs.readFileSync(file, 'utf8');
  const before = html.length;

  // the app script (one <script type="module">)
  const open = '<script type="module">', close = '</script>';
  const a = html.indexOf(open), b = html.indexOf(close, a);
  if (a < 0 || b < 0) throw new Error('module script not found');
  const js = html.slice(a + open.length, b);
  const out = await minify(js, {
    module: true, ecma: 2020,
    compress: { passes: 2 },
    mangle: true,
    format: { comments: false, preamble: `/*! ${NOTICE} */`, ascii_only: false },
  });
  if (!out.code) throw new Error('terser produced no output');
  html = html.slice(0, a + open.length) + out.code + html.slice(b);

  // every <style> block
  const css = new CleanCSS({ level: 1, returnPromise: false });
  html = html.replace(/<style>([\s\S]*?)<\/style>/g, (m, body) => {
    const r = css.minify(body);
    if (r.errors.length) throw new Error('clean-css: ' + r.errors.join('; '));
    return `<style>${r.styles}</style>`;
  });

  // notice at the very top of the page source
  html = html.replace('<!doctype html>', `<!doctype html>\n<!-- ${NOTICE} -->`);
  fs.writeFileSync(file, html);
  console.log(`minified ${file}: ${before} → ${html.length} bytes (${Math.round(100 - 100 * html.length / before)}% smaller)`);
})().catch(e => { console.error(e); process.exit(1); });
