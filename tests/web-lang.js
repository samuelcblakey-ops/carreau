// Languages on the website: the page carries no translations; each language is its own file, fetched only when it's
// the one shown (English fetches none), before anything is drawn.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const w = ms => new Promise(r => setTimeout(r, ms));
  const mk = async (n, lang) => { const c = await b.newContext({ viewport: { width: 1100, height: 900 } });
    await c.addInitScript(l => { window.__CARREAU_EMULATOR = true; if (l) try { localStorage.setItem('carreau-lang', l); } catch {} }, lang);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); const files = []; p.on('request', r => { const m = r.url().match(/\/lang\/([a-z]+)-[0-9a-f]{8}\.json$/); if (m) files.push(m[1]); });
    return { p, files }; };
  const hero = p => p.evaluate(() => document.querySelector('.start-hero h1')?.textContent.trim());
  // the page itself
  const html = await (await fetch(base)).text();
  console.log('page: ' + Math.round(html.length / 1024) + 'KB | French in page ' + /Tous droits réservés|Diffuser une partie/.test(html) + ' | lists files ' + /fr-[0-9a-f]{8}\.json/.test(html));
  // 1. English: no language file at all
  const E = await mk('en'); await E.p.goto(base); await w(3500);
  console.log('english: ' + await hero(E.p) + ' | files ' + (E.files.join(',') || 'none'));
  // 2. French saved on this device: only the French file, and the first thing drawn is already French
  const F = await mk('fr', 'fr');
  await F.p.addInitScript(() => { window.__firstMain = null; new MutationObserver((_, o) => { const m = document.querySelector('main'); if (m && m.innerText.trim() && !/Loading/.test(m.innerText)) { window.__firstMain = m.innerText.slice(0, 80); o.disconnect(); } }).observe(document, { subtree: true, childList: true, characterData: true }); });
  await F.p.goto(base); await w(3500);
  console.log('french: ' + await hero(F.p) + ' | files ' + F.files.join(',') + ' | first drawn ' + (await F.p.evaluate(() => window.__firstMain || '')).split('\n')[0]);
  // 3. switching language fetches just that one
  await F.p.click('[data-act="lang-menu"]'); await w(200); await F.p.click('[data-lang="de"]'); await w(800);
  console.log('to german: ' + await hero(F.p) + ' | files ' + F.files.join(','));
  await F.p.click('[data-act="lang-menu"]'); await w(200); await F.p.click('[data-lang="fr"]'); await w(500);
  console.log('back to french: ' + await hero(F.p) + ' | files ' + F.files.join(','));
  await F.p.click('[data-act="lang-menu"]'); await w(200); await F.p.click('[data-lang="en"]'); await w(500);
  console.log('to english: ' + await hero(F.p) + ' | files ' + F.files.join(','));
  // 4. a missing file leaves the page working, in English
  const X = await mk('broken', 'th'); await X.p.route(/\/lang\/th-/, r => r.fulfill({ status: 404, body: 'gone' })); await X.p.goto(base); await w(3500);
  console.log('missing file: ' + await hero(X.p));
  console.log('errs', errs); await b.close();
})();
