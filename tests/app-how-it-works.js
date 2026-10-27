// How it works page: linked from the footer and from Setup (straight to the chosen format), and the page itself
// has a card for every format, working jump links, and no sideways scrolling on a phone.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(120); q('[data-act="wiz-skip"]').click(); await w(120);
    L.push('footer link: ' + q('#foot a[href="how-it-works.html"]')?.textContent);
    const setupLink = () => q('main a[href^="how-it-works.html"]')?.getAttribute('href');
    L.push('setup swiss: ' + setupLink());
    for (const sys of ['pools', 'leagues', 'roundrobin', 'clubs']) { const t = JSON.parse(JSON.stringify(C.T())); t.system = sys; await S.store.setTournament(t); S.tournaments[t.id] = t; await w(120); L.push(`setup ${sys}: ${setupLink()}`); }
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(100);
    L.push(`french: ${q('#foot a[href="how-it-works.html"]').textContent} | ${q('main a[href^="how-it-works.html"]').textContent}`);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="en"]').click(); await w(80);
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  // the page itself
  await p.goto('file://' + path.join(__dirname, '..', 'public', 'how-it-works.html')); await p.waitForTimeout(200);
  const pg = await p.evaluate(() => { const ids = [...document.querySelectorAll('.jump a')].map(a => a.getAttribute('href').slice(1));
    return `cards ${document.querySelectorAll('.fmt').length} | jump links ${ids.length} all found ${ids.every(id => document.getElementById(id))} | every card has a draw line ${[...document.querySelectorAll('.fmt')].every(c => /Draw/.test(c.querySelector('dt')?.textContent || ''))} | page width ${document.documentElement.scrollWidth} | back link ${document.querySelector('.back').getAttribute('href')}`; });
  console.log(out.join('\n')); console.log('page: ' + pg); console.log('errs', errs); await b.close();
})();
