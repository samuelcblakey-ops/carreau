const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), L = [];
    try {
    for (let i = 0; i < 8; i++) { q('[data-act="new-t"]').click(); await w(40); const t = JSON.parse(JSON.stringify(C.T())); t.name = (i === 7 ? 'Bristol Open ' : 'Club night ') + i; if (i < 2) t.listed = true; await S.store.setTournament(t); S.tournaments[t.id] = t; await w(20); }
    C.render ? C.render() : null; await w(50);
    L.push('no select: ' + !q('header select'));
    q('.picker-btn').click(); await w(80);
    L.push('open: ' + !!q('.picker') + ' groups: ' + [...document.querySelectorAll('.pick-group .eyebrow')].map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' / '));
    L.push('meta: ' + (q('.pick-row .small')?.textContent || ''));
    L.push('search focused: ' + (document.activeElement?.id === 'picker-q'));
    const inp = q('#picker-q'); inp.value = 'bristol'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(30);
    L.push('search filters: ' + [...document.querySelectorAll('.pick-row')].filter(r => !r.hidden).map(r => r.querySelector('b').textContent).join(','));
    [...document.querySelectorAll('.pick-row')].find(r => !r.hidden).click(); await w(80);
    L.push('picked: ' + C.T().name + ' closed: ' + !q('.picker') + ' button shows: ' + q('.picker-btn').textContent.trim());
    q('.picker-btn').click(); await w(50); q('main').click(); await w(50); L.push('outside click closes: ' + !q('.picker'));
    q('.picker-btn').click(); await w(50); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await w(50); L.push('escape closes: ' + !q('.picker'));
    } catch (e) { L.push('ERR ' + e.message); }
    return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/picker.png' }); console.log('errs', errs); await b.close();
})();
