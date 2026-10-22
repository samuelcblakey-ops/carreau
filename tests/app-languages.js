// Language menu: eight languages, chosen from a menu in the header and remembered on the device.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(150);
    L.push('menu closed: ' + q('.lang-menu').hidden);
    q('[data-act="lang-menu"]').click(); await w(60); L.push('menu open: ' + !q('.lang-menu').hidden + ' options ' + document.querySelectorAll('.lang-menu [data-lang]').length);
    document.body.click(); await w(60); L.push('outside click closes: ' + q('.lang-menu').hidden);
    for (const l of ['fr', 'es', 'it', 'de', 'nl', 'pt', 'th']) {
      q('[data-act="lang-menu"]').click(); await w(40); q(`[data-lang="${l}"]`).click(); await w(80);
      L.push(`${l}: ${q('.lang-btn').textContent.trim().slice(0, 2)} | ${q('.memorial').textContent} | ${q('[data-tab="entries"]').textContent.trim()} | ${q('.wiz h3')?.textContent} | html lang ${document.documentElement.lang}`);
    }
    L.push('footer fr: ' + (q('[data-act="lang-menu"]').click(), await w(40), q('[data-lang="fr"]').click(), await w(80), q('#foot').textContent.replace(/\s+/g, ' ').trim()) + ' | link ' + q('#foot a').getAttribute('href'));
    L.push('remembered: ' + localStorage.getItem('carreau-lang'));
    q('[data-lang="en"]').click(); await w(60); L.push('back to english: ' + q('.memorial').textContent);
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
