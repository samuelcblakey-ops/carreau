const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Swiss ranking', system: 'swiss', checkin: false, draws: [{ id: 'R1', kind: 'round', label: 'Round 1', round: 1 }, { id: 'R2', kind: 'round', label: 'Round 2', round: 2 }] });
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    // A: 1 win, big points difference, weak opponents. C: 1 win, level points difference, strong opponents.
    const g = [['R1', 1, 'A', 'B', 13, 0], ['R1', 1, 'C', 'D', 13, 12], ['R1', 1, 'F', 'E', 13, 12], ['R2', 2, 'E', 'A', 13, 12], ['R2', 2, 'F', 'C', 13, 12], ['R2', 2, 'D', 'B', 13, 5]];
    for (const [gid, r, a, bb, sa, sb] of g) { const m = { id: `${gid}-${a}`, stage: 'swiss', group: gid, round: r, order: 0, a: [a], b: [bb], sa, sb, done: true }; await S.store.setMatch(t.id, m); S.matches[m.id] = m; }
    await w(50); q('[data-tab="standings"]').click(); await w(80);
    const order = [...document.querySelectorAll('main table tbody tr')].map(tr => tr.querySelector('b').textContent.replace('Team ', ''));
    return ['order: ' + order.join(''), 'A above C: ' + (order.indexOf('A') < order.indexOf('C')), 'note: ' + q('main p.small.muted').textContent.slice(0, 60)]; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
