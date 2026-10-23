// Round robin, barrage and league tie-break: teams level on wins, points difference and points for are split by a
// mini-league of the games between them (wins, then points difference, then points for), then by the drawn lot.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = [];
    const make = async (system, extra = {}) => { q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: system, system, format: 'singles', checkin: false, wizard: false }, extra);
      ['A', 'B', 'C', 'D'].forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
      q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); for (let i = 0; i < 40 && C.MS().filter(m => m.a && m.b).length < 6; i++) await w(100); return C.T(); };
    const play = async results => { for (const [x, y, sx, sy] of results) { const m = C.MS().filter(m => !m.done).find(m => m.a && m.b && ((m.a[0] === x && m.b[0] === y) || (m.a[0] === y && m.b[0] === x)));
      const [sa, sb] = m.a[0] === x ? [sx, sy] : [sy, sx]; await C.recordResult(m.id, sa, sb, true, { time: Math.max(sa, sb) < 13 }); } C.render(); await w(80); };
    const order = () => { q('[data-tab="standings"]').click(); return qa('main .tw.st tbody tr').map(tr => tr.querySelector('td.wrap b').textContent.replace('Team ', '') + '(' + [...tr.children].slice(-1)[0].textContent + ')').join(' '); };
    // A, B and C all win 2, +5, 31 points for; between themselves A beat B 13-5, B beat C 13-11, C beat A 13-9
    const circle = [['A', 'B', 13, 5], ['B', 'C', 13, 11], ['C', 'A', 13, 9], ['A', 'D', 9, 8], ['B', 'D', 13, 2], ['C', 'D', 7, 4]];
    const t = await make('roundrobin'); await play(circle);
    await w(40); L.push('round robin: ' + order());
    L.push('note: ' + /mini-league of the games between them/.test(qa('main p.small.muted').map(p => p.textContent).join(' ')));
    // all level inside the mini-league too (A beat B, B beat C, C beat A, all 13-10): the drawn lot decides, the same every time
    const t2 = await make('roundrobin'); await play([['A', 'B', 13, 10], ['B', 'C', 13, 10], ['C', 'A', 13, 10], ['A', 'D', 13, 10], ['B', 'D', 13, 10], ['C', 'D', 13, 10]]);
    const o1 = order(); C.render(); await w(40); const o2 = order(); L.push('still level: lot order stable ' + (o1 === o2) + ' | D last ' + o1.trim().endsWith('D(-9)'));
    // two-way tie still uses the game between them
    const t3 = await make('roundrobin'); await play([['A', 'B', 13, 10], ['C', 'A', 13, 10], ['A', 'D', 13, 7], ['B', 'C', 13, 10], ['B', 'D', 13, 7], ['D', 'C', 13, 0]]);
    L.push('two-way: ' + order());
    // barrage (round-robin groups) and leagues use the same rule
    const t4 = await make('pools', { poolSize: 4, poolStyle: 'rr' }); await play(circle); L.push('barrage: ' + order());
    const t5 = await make('leagues', { leagueCount: 1 }); await play(circle); L.push('league: ' + order());
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
