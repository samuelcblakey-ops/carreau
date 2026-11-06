const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), L = [];
    try {
    // A footer row like the website's install row: a .pick-row with no data-id or data-name.
    S.pickerFooter = () => `<button type="button" class="pick-row" data-act="noop-install"><span class="pr-main"><b>Add to home screen</b></span></button>`;
    for (let i = 0; i < 8; i++) { q('[data-act="new-t"]').click(); await w(40); const t = JSON.parse(JSON.stringify(C.T())); t.name = (i === 7 ? 'Bristol Open ' : i === 6 ? 'Mêlée du club ' : 'Club night ') + i; if (i < 2) t.listed = true; await S.store.setTournament(t); S.tournaments[t.id] = t; await w(20); }
    C.render ? C.render() : null; await w(50);
    L.push('no select: ' + !q('header select'));
    q('.picker-btn').click(); await w(80);
    L.push('open: ' + !!q('.picker') + ' groups: ' + [...document.querySelectorAll('.pick-group .eyebrow')].map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' / '));
    L.push('meta: ' + (q('.pick-row .small')?.textContent || ''));
    L.push('search focused: ' + (document.activeElement?.id === 'picker-q'));
    const inp = q('#picker-q'); inp.value = 'bristol'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(30);
    L.push('search filters: ' + [...document.querySelectorAll('.pick-row')].filter(r => !r.hidden && r.dataset.id).map(r => r.querySelector('b').textContent).join(','));
    window.__pickErrs = [];
    const onErr = ev => window.__pickErrs.push(ev.message); window.addEventListener('error', onErr);
    inp.value = 'zzzz'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(30);
    L.push('search zzzz: no match message ' + !q('.pick-none').hidden + ' | errors ' + window.__pickErrs.length);
    const tidBefore = localStorage.getItem('carreau-tid'), nameBefore = C.T()?.name;
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await w(80);
    L.push('enter with no match: ' + (C.T()?.name === nameBefore && !!q('.picker') ? 'no competition opened' : 'opened ' + C.T()?.name) + ' | carreau-tid ' + (localStorage.getItem('carreau-tid') === tidBefore ? 'unchanged' : 'changed to ' + localStorage.getItem('carreau-tid')));
    inp.value = 'melee'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(30);
    const vis = [...document.querySelectorAll('.pick-row[data-id]')].filter(r => !r.hidden).map(r => r.querySelector('b').textContent);
    L.push('search melee finds Mêlée: ' + (vis.length === 1 && vis[0] === 'Mêlée du club 6'));
    window.removeEventListener('error', onErr);
    inp.value = 'bristol'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(30);
    [...document.querySelectorAll('.pick-row[data-id]')].find(r => !r.hidden).click(); await w(80);
    L.push('picked: ' + C.T().name + ' closed: ' + !q('.picker') + ' button shows: ' + q('.picker-btn').textContent.trim());
    q('.picker-btn').click(); await w(50); q('main').click(); await w(50); L.push('outside click closes: ' + !q('.picker'));
    q('.picker-btn').click(); await w(50); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await w(50); L.push('escape closes: ' + !q('.picker'));
    } catch (e) { L.push('ERR ' + e.message); }
    return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/picker.png' }); console.log('errs', errs); await b.close();
})();
