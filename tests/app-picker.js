const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 860 }, locale: 'en-GB' });
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
    // summary line: a EuroCup with its ties drawn, and a mêlée drawn in advance with round 1 still in play
    const meta = id => [...document.querySelectorAll('.pick-row')].find(r => r.dataset.id === id)?.querySelector('.small')?.textContent || '';
    q('[data-act="new-t"]').click(); await w(60);
    { const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Euro summary', date: '2026-11-04', entry: 'teams', format: 'triples', system: 'eurocup', wizard: false,
        teams: ['Riverside', 'Hilltop', 'Lakeside', 'Seaview'].map((n, i) => ({ id: 'e' + i, name: n, players: ['A', 'B', 'C'], active: true })), draws: [{ id: 'CL', kind: 'schedule', label: 'EuroCup ties' }] });
      await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(50);
      q('.picker-btn').click(); await w(60); L.push('eurocup summary: ' + meta(t.id)); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await w(40); }
    q('[data-act="new-t"]').click(); await w(60);
    { const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Advance summary', entry: 'melee', checkin: false, meleeMode: 'advance', format: 'doubles', swissRounds: 4, wizard: false });
      t.players = Array.from({ length: 16 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, active: true })); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); C.render(); await w(40);
      q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(250);
      for (const m of C.MS().filter(m => m.round === 1 && !m.bye).slice(0, 2)) await C.recordResult(m.id, 13, 7, true); await w(100);
      q('.picker-btn').click(); await w(60); L.push('melee in advance summary after 2 results: ' + (meta(t.id).match(/Round \d+|All \d+ rounds drawn/) || ['none'])[0] + ' | ' + meta(t.id)); }
    } catch (e) { L.push('ERR ' + e.message); }
    return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/picker.png' }); console.log('errs', errs); await b.close();
})();
