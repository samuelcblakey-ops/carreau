// Draw & results shows the live table (with points difference) for Swiss, snake, mêlée and round robin, matching Standings.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = [];
    const tableInfo = () => { const tb = q('main .tw.st table'); if (!tb) return 'no table'; const ths = [...tb.querySelectorAll('thead th')].filter(th => getComputedStyle(th).display !== 'none');
      const i = ths.findIndex(th => th.textContent.trim() === '+/-'); const vis = i >= 0 && ths[i].getBoundingClientRect().right <= innerWidth + 1;
      const rows = [...tb.querySelectorAll('tbody tr')].map(tr => { const tds = [...tr.children].filter(td => getComputedStyle(td).display !== 'none'); return tds[1].querySelector('b')?.textContent + ' ' + tds[i]?.textContent; });
      return `${ths.map(th => th.textContent.trim()).join(',')} | +/- visible ${vis} | ${rows.join(' / ')}`; };
    const make = async (system, extra = {}) => { q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: system, system, format: 'singles', checkin: false, swissRounds: 3, wizard: false }, extra);
      ['A', 'B', 'C', 'D'].forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['Marc Dupontel Montpellier'], active: true })); // long names: the +/- column must still fit a phone
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
      q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300); return t; };
    // Swiss: round 1, one result in
    await make('swiss');
    L.push('swiss before results: ' + (q('.draw-table h3')?.textContent || 'none'));
    const g = C.MS().filter(m => m.a && m.b && !m.bye).sort((x, y) => x.order - y.order);
    await C.recordResult(g[0].id, 13, 7, true); await C.recordResult(g[1].id, 4, 13, true); C.render(); await w(80);
    L.push('swiss draw: ' + tableInfo());
    q('[data-tab="standings"]').click(); await w(60); const std = tableInfo();
    q('[data-tab="draw"]').click(); await w(60);
    L.push('swiss matches standings: ' + (std === tableInfo()));
    q('.draw-table [data-tab="standings"]').click(); await w(60); L.push('full standings button: ' + (S.tab === 'standings'));
    // round robin
    await make('roundrobin');
    const r = C.MS().filter(m => m.a && m.b && !m.bye && m.round === 1);
    await C.recordResult(r[0].id, 13, 11, true); C.render(); await w(80);
    L.push('rr draw: ' + tableInfo());
    // barrage keeps its own per-barrage tables (no extra table)
    await make('pools', { poolSize: 4 });
    L.push('barrage: extra table ' + !!q('.draw-table') + ' | pool tables ' + qa('.pools table').length);
    // French
    q('[data-lang="fr"]')?.click(); await w(60);
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
