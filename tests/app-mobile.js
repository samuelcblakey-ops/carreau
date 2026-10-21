const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const L = [];
  for (const [wd, label] of [[375, 'phone'], [1100, 'desktop']]) {
    const p = await b.newPage({ viewport: { width: wd, height: 812 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    const r = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('[data-act="new-t"]').click(); await w(80); const res = {};
      for (const tab of ['entries', 'setup', 'draw', 'courts', 'standings']) { q(`[data-tab="${tab}"]`).click(); await w(40); res[tab] = document.documentElement.scrollWidth; }
      q('[data-tab="entries"]').click(); await w(40);
      const nav = q('nav.tabs'), cs = getComputedStyle(nav);
      return { overflow: Math.max(...Object.values(res)) > innerWidth, navFixed: cs.position === 'fixed', navBottom: Math.round(nav.getBoundingClientRect().bottom) === innerHeight,
        icons: getComputedStyle(q('nav.tabs .t-ic')).display !== 'none', header: Math.round(q('header.app').getBoundingClientRect().height),
        inputFont: getComputedStyle(q('main input[type=text], main input:not([type])')).fontSize };
    });
    L.push(`${label}: ${JSON.stringify(r)}`); await p.close();
  }
  console.log(L.join('\n')); console.log('errs', errs); await b.close();
})();
