// Check-in buttons are easy to find: a full-size "Check in everyone" while anyone is missing, a clear outlined
// "Check in" on every entry (filled once checked in), and the same shortcut on Draw & results where the draw is blocked.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    q('[data-act="new-t"]').click(); await w(150); q('[data-act="wiz-skip"]').click(); await w(100);
    q('[data-tab="entries"]').click(); await w(80);
    L.push('empty: check in everyone shown ' + !!q('[data-act="checkin-all"]'));
    q('#bulk').value = 'Les Pointeurs: A, B, C\nBoule d\'Or: D, E, F\nMistral: G, H, I\nGravier: J, K, L'; q('#bulk-form button[type=submit]').click(); await w(200);
    const all = q('[data-act="checkin-all"]'), h = el => Math.round(el.getBoundingClientRect().height);
    L.push(`everyone button: primary ${all.classList.contains('primary')} | big ${h(all) >= 44} | icon ${!!all.querySelector('svg')} | text ${all.textContent.trim()}`);
    const rows = qa('[data-act="checkin"]');
    L.push(`row buttons: ${rows.length} | outlined ${rows.every(x => getComputedStyle(x).borderTopWidth === '2px')} | tall ${rows.every(x => h(x) >= 44)} | text ${rows[0].textContent.trim()}`);
    // Draw & results: the draw is blocked, so the shortcut is right there
    q('[data-tab="draw"]').click(); await w(80);
    L.push(`draw tab: blocked ${!q('[data-act="first-draw"]')} | shortcut ${!!q('.notice [data-act="checkin-all"]')} | go to registration ${!!q('.notice [data-tab="entries"]')}`);
    q('.notice [data-act="checkin-all"]').click(); await w(150);
    L.push(`after shortcut: checked ${C.T().teams.filter(x => x.checkedIn).length} | draw button ${!!q('[data-act="first-draw"]')} | notice gone ${!q('.notice')}`);
    q('[data-tab="entries"]').click(); await w(80);
    const r2 = qa('[data-act="checkin"]');
    L.push(`all in: everyone button gone ${!q('[data-act="checkin-all"]')} | clear shown ${!!q('[data-act="checkin-clear"]')} | rows filled ${r2.every(x => x.classList.contains('checked') && x.getAttribute('aria-pressed') === 'true')} | ${r2[0].textContent.trim()}`);
    r2[1].click(); await w(150);
    L.push(`one out: everyone button back ${!!q('[data-act="checkin-all"]')} | row ${qa('[data-act="checkin"]')[1].textContent.trim()} pressed ${qa('[data-act="checkin"]')[1].getAttribute('aria-pressed')}`);
    // translations still apply with the icons in place
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(100);
    L.push(`french: ${q('[data-act="checkin-all"]').textContent.trim()} | ${qa('[data-act="checkin"]')[1].textContent.trim()} | ${qa('[data-act="checkin"]')[0].textContent.trim()}`);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="en"]').click(); await w(80);
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/checkin.png', fullPage: true }); console.log('errs', errs); await b.close();
})();
