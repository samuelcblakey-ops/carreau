// Standings: the top three are gold, silver and bronze (tables and knockout podiums), and a "Facts and figures"
// panel is worked out from the finished games.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    const make = async (system, n, extra = {}) => { q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: system, system, format: 'singles', checkin: false, wizard: false, swissRounds: 3, seeding: 'entry' }, extra);
      for (let i = 0; i < n; i++) t.teams.push({ id: 'e' + i, name: 'Team ' + 'ABCDEFGHIJKLMNOP'[i], players: ['x'], active: true });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); await tab('draw'); q('[data-act="first-draw"]').click(); await w(250); };
    const idx = id => +id.slice(1);
    // the lower-numbered team always wins; the margin is set by the pair so the facts are predictable
    const playReady = async (scoreOf) => { for (let k = 0; k < 60; k++) { const m = C.MS().filter(m => m.a && m.b && !m.done && !m.bye).sort((x, y) => x.round - y.round || x.order - y.order)[0]; if (!m) break;
      const [sa, sb] = scoreOf(m); await C.recordResult(m.id, sa, sb, true); await w(20); } C.render(); await w(60); };
    const facts = () => qa('.facts .fact').map(f => txt(f.querySelector('.eyebrow')) + ' = ' + txt(f.querySelector('.fact-v')) + ' (' + txt(f.querySelector('.small')) + ')');
    const rows = () => [...(qa('main .tw.st')[0]?.querySelectorAll('tbody tr') || [])];
    // 1. Swiss, 8 teams: nothing highlighted before any result
    await make('swiss', 8); await tab('standings');
    L.push('before results: medals ' + qa('main .medal').length + ' | facts ' + !!q('.facts'));
    // round 1 (entry seeding: A v B, C v D…): 13–0, 13–12, 13–5, 13–12
    let r = 0; const r1 = [[13, 0], [13, 12], [13, 5], [13, 12]];
    await tab('draw'); await playReady(m => { const lowA = idx(m.a[0]) < idx(m.b[0]); const [x, y] = m.round === 1 ? r1[r++] : [13, 7]; return lowA ? [x, y] : [y, x]; });
    for (let round = 2; round <= 3; round++) { await tab('draw'); q('[data-act="next-round"]')?.click(); await w(250); await playReady(m => { const lowA = idx(m.a[0]) < idx(m.b[0]); return lowA ? [13, 7] : [7, 13]; }); }
    await tab('standings');
    L.push('podium rows: ' + rows().slice(0, 4).map(tr => (tr.className || '-') + ':' + (tr.querySelector('.rank .medal')?.textContent || tr.querySelector('.rank').textContent)).join(' '));
    L.push('medal colours: ' + ['m1', 'm2', 'm3'].map(c => getComputedStyle(q('.rank .medal.' + c)).backgroundColor).join(' | '));
    L.push('rank text unchanged: ' + rows().slice(0, 3).map(tr => tr.querySelector('td.rank').textContent).join(','));
    L.push('facts: ' + facts().join(' ; '));
    await tab('draw'); L.push('draw table has no medals: ' + !q('.draw-table .medal'));
    // phone: facts fit without sideways scrolling
    await tab('standings'); const vw0 = innerWidth;
    // 2. Knockout: winner, runner-up and third get medals on Standings
    await make('knockout', 8, { koThird: true });
    await playReady(m => idx(m.a[0]) < idx(m.b[0]) ? [13, 4] : [4, 13]);
    await tab('standings');
    L.push('knockout podium: ' + qa('main .panel h3 ~ div').filter(d => d.querySelector('.eyebrow')).slice(0, 4).map(d => (d.querySelector('.medal')?.className.replace('medal ', '') || '-') + ' ' + txt(d.querySelector('.eyebrow'))).join(' | '));
    L.push('knockout facts: ' + facts().filter(f => /^(GAMES PLAYED|UNBEATEN|LONGEST WINNING RUN)/.test(f)).join(' ; '));
    // 3. Barrage groups keep their qualification look (no medals in the group tables)
    await make('pools', 8, { poolSize: 4 });
    await playReady(m => idx(m.a[0]) < idx(m.b[0]) ? [13, 9] : [9, 13]);
    await tab('standings'); L.push('barrage groups: medals ' + qa('.pools .medal').length + ' | facts ' + !!q('.facts'));
    // 4. French
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(100);
    L.push('french: ' + txt(q('.facts-panel h3')) + ' | ' + txt(qa('.facts .fact')[1]) + ' | ' + txt(qa('.facts .fact').find(f => /MOYEN/.test(txt(f)))));
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="en"]').click(); await w(60);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n'));
  // phone width: the facts grid stays inside the page
  await p.setViewportSize({ width: 375, height: 800 }); await p.waitForTimeout(200);
  console.log('phone overflow: ' + await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) + ' | facts columns ' + await p.evaluate(() => getComputedStyle(document.querySelector('.facts')).gridTemplateColumns.split(' ').length));
  console.log('errs', errs); await b.close();
})();
