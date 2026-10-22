// Leagues: teams drawn at random into N leagues, each a round robin with its own table (wins, fewest losses, +/-, points for).
// Also: "Barrage" is the new name for pools, and group tables show L / For / Agst.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    const mk = async (cfg, n) => { q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, cfg, { checkin: false, wizard: false });
      for (let i = 0; i < n; i++) t.teams.push({ id: 'e' + i, name: 'Team ' + i, players: ['a'], active: true }); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); };
    // 1. Setup names
    await mk({ system: 'pools', name: 'Names' }, 8); await tab('setup');
    L.push('system options: ' + qa('[data-set="system"]').map(b => b.textContent).join(','));
    L.push('barrage fields: ' + !!q('#f-psize') + ' | ' + txt(q('#f-psize').closest('label').querySelector('span')));
    await tab('draw'); L.push('draw button: ' + txt(q('[data-act="first-draw"]')));
    q('[data-act="first-draw"]').click(); await w(150);
    L.push('barrage names: ' + C.T().pools.map(p => p.name).join(',') + ' | header: ' + txt(q('main .eyebrow')) + ' | ' + txt(q('main .panel.spread b')));
    L.push('barrage columns: ' + qa('.pools table thead th').slice(0, 7).map(th => th.textContent).join(','));
    // 2. Leagues: 10 teams into 3 leagues
    await mk({ system: 'leagues', leagueCount: 3, name: 'League test' }, 10); await tab('setup');
    L.push('league fields: ' + !!q('#f-leagues') + ' value ' + q('#f-leagues').value + ' | note: ' + txt(q('#f-leagues').closest('.panel').querySelector('p.small')).slice(0, 60));
    L.push('plan unit: ' + qa('table.plan thead th')[1].textContent + ' | presets: ' + qa('[data-act="plan-preset"]').map(b => b.textContent).join(' / '));
    await tab('draw'); L.push('draw button: ' + txt(q('[data-act="first-draw"]')));
    q('[data-act="first-draw"]').click(); await w(200);
    const t = C.T(); const sizes = t.pools.map(p => p.members.length);
    L.push('leagues: ' + t.pools.map(p => p.name).join(',') + ' sizes ' + sizes.join(',') + ' | league flag ' + t.pools.every(p => p.league) + ' | games ' + C.MS().length + ' | header: ' + txt(q('main .eyebrow')) + ' | ' + txt(q('main .panel.spread b')));
    L.push('round robin inside: ' + t.pools.every(p => C.MS().filter(m => m.pool === p.id).length === p.members.length * (p.members.length - 1) / 2));
    L.push('undo label: ' + txt(q('[data-act="undo"][data-id="pools"]')));
    // play league A so that two teams end on equal wins; ranking = wins, fewest losses, diff, pf
    const A = t.pools[0]; const am = C.MS().filter(m => m.pool === A.id).sort((x, y) => x.round - y.round || x.order - y.order);
    for (const m of am) { const ia = +m.a[0].slice(1), ib = +m.b[0].slice(1); await C.recordResult(m.id, ia < ib ? 13 : 7, ia < ib ? 7 : 13, true); }
    await w(60); C.render(); await w(40);
    const rows = [...document.querySelectorAll('.pools .panel')][0].querySelectorAll('tbody tr');
    L.push('league A table: ' + [...rows].map(r => txt(r)).join(' | '));
    // league B: everyone 1-1, split by points difference; league C: equal wins, fewest losses first
    const B = t.pools[1], Cc = t.pools[2]; const g = (pl, i) => C.MS().filter(m => m.pool === pl.id).sort((x, y) => x.round - y.round || x.order - y.order)[i];
    const res = async (m, first, sa, sb) => { const [x, y] = m.a[0] === first ? [sa, sb] : [sb, sa]; await C.recordResult(m.id, x, y, true); };
    const [b0, b1, b2] = B.members; const pair = (u, v) => C.MS().find(m => m.pool === B.id && [m.a[0], m.b[0]].includes(u) && [m.a[0], m.b[0]].includes(v));
    await res(pair(b0, b1), b0, 13, 5); await res(pair(b1, b2), b1, 13, 12); await res(pair(b2, b0), b2, 13, 0);
    const [c0, c1, c2] = Cc.members; const pc = (u, v) => C.MS().find(m => m.pool === Cc.id && [m.a[0], m.b[0]].includes(u) && [m.a[0], m.b[0]].includes(v));
    await res(pc(c0, c1), c0, 13, 0); await res(pc(c1, c2), c1, 13, 12);
    await w(60); C.render(); await w(40);
    const order = pl => [...document.querySelectorAll('.pools .panel')].find(x => x.querySelector('h3').textContent === pl.name).querySelectorAll('tbody tr');
    L.push('league B order: ' + [...order(B)].map(r => r.children[1].textContent).join(',') + ' expected ' + [b2, b0, b1].map(id => 'Team ' + id.slice(1)).join(','));
    L.push('league C order: ' + [...order(Cc)].map(r => txt(r)).join(' | '));
    await tab('standings');
    L.push('standings cols: ' + qa('.pools .st thead th').slice(0, 8).map(th => th.textContent).join(',') + ' | for/agst visible: ' + (getComputedStyle(qa('.pools .st thead th')[5]).display !== 'none'));
    L.push('standings note: ' + txt([...document.querySelectorAll('main p.small')].pop()).slice(0, 70));
    // leagues cannot be French poules
    L.push('no french poule: ' + t.pools.every(p => !p.french) + ' | plan default: ' + JSON.stringify(C.getPlan(C.T()).brackets.map(b => [b.name, b.from, b.to])));
    // 3. French and the wizard
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80); await tab('setup');
    L.push('french: ' + qa('[data-set="system"]').map(b => b.textContent).join(',') + ' | ' + txt(q('#f-leagues').closest('label').querySelector('span')));
    q('[data-lang="en"]').click(); await w(60);
    q('[data-act="new-t"]').click(); await w(150); q('#wz-name').value = 'Wiz leagues'; q('[data-act="wiz-next"]').click(); await w(60); q('[data-act="wiz-next"]').click(); await w(60);
    L.push('wizard formats: ' + qa('.wiz-opt').map(b => b.querySelector('b').textContent).join(','));
    q('[data-act="wiz-set"][data-k="system"][data-v="leagues"]').click(); await w(60); q('#wz-leagues').value = '4'; q('[data-act="wiz-next"]').click(); await w(60); q('[data-act="wiz-next"]').click(); await w(200);
    L.push('wizard saved: ' + C.T().system + ' ' + C.T().leagueCount);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/leagues.png', fullPage: true }); console.log('errs', errs); await b.close();
})();
