// Bracket games show their state by border colour (grey not started, red playing, green finished) instead of a footer,
// so every game is the same height and the connecting lines meet the middle of each game.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { system: 'knockout', name: 'Colours', checkin: false, wizard: false, seeding: 'entry' });
    for (let i = 1; i <= 8; i++) t.teams.push({ id: 's' + i, name: 'Team ' + i, players: ['a'], active: true });
    t.courts = [{ id: 'c1', name: '1', active: true }, { id: 'c2', name: '2', active: true }];
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(250);
    // one quarter-final finished: it frees a piste, so the next waiting game starts
    const qf = C.MS().filter(m => m.round === 1).sort((x, y) => x.order - y.order); await C.recordResult(qf[0].id, 13, 6, true); await w(150); C.render(); await w(80);
    const cards = qa('.bk .bkm'); const st = el => ['playing', 'done', 'ready', 'pending'].find(c => el.classList.contains(c));
    L.push('states: ' + cards.map(st).join(','));
    L.push('no footer: ' + !q('.bkm-foot') + ' | piste tags ' + qa('.bkm-pst').map(x => x.textContent).join(','));
    const col = el => getComputedStyle(el).borderTopColor; const byState = s => [...new Set(cards.filter(c => st(c) === s).map(col))];
    L.push(`colours: playing ${byState('playing')} | done ${byState('done')} | waiting ${byState('ready')} | pending ${byState('pending')}`);
    const hs = [...new Set(cards.filter(c => !c.classList.contains('bye')).map(c => Math.round(c.getBoundingClientRect().height)))];
    L.push('one height: ' + (hs.length === 1) + ' ' + hs.join(','));
    // the line between the two teams sits on the slot's centre line, where the connectors are drawn
    const off = qa('.bk .bk-slot').filter(s => s.querySelector('.bkm')).map(s => { const r = s.getBoundingClientRect(), row = s.querySelector('.bkm-row').getBoundingClientRect(); return Math.abs((r.top + r.height / 2) - row.bottom); });
    L.push('lines meet the middle: ' + off.every(d => d <= 1.5) + ' max ' + Math.max(...off).toFixed(1));
    L.push('key: ' + q('.bk-key').innerText.replace(/\s+/g, ' ').trim());
    L.push('tooltip: ' + qa('.bkm.playing')[0].title + ' | ' + qa('.bkm.ready')[0]?.title);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80);
    L.push('french key: ' + q('.bk-key').innerText.replace(/\s+/g, ' ').trim() + ' | tag ' + q('.bkm-pst').textContent);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/bracket-colours.png' }); console.log('errs', errs); await b.close();
})();
