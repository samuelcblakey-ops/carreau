const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), L = [];
    const mk = async (cfg, n) => { q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { entry: 'melee', checkin: false }, cfg);
      t.players = Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, active: true })); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); };
    try {
    // teams drawn once
    await mk({ name: 'Once', meleeMode: 'once', format: 'triples', system: 'swiss' }, 14);
    q('[data-tab="setup"]').click(); await w(40); L.push('setup shows style: ' + !!q('[data-set="meleeMode"][data-val="once"][aria-pressed="true"]'));
    q('[data-tab="draw"]').click(); await w(40); L.push('draw teams button: ' + !!q('[data-act="melee-teams"]'));
    q('[data-act="melee-teams"]').click(); await w(150);
    let t = C.T(); L.push('teams drawn: ' + t.entry + ' ' + t.teams.length + ' sizes ' + t.teams.map(x => x.players.length).sort().join('') + ' players kept ' + t.players.length);
    L.push('registration notice: ' + !!q('[data-act="melee-redraw"]'));
    const before = JSON.stringify(C.T().teams.map(x => x.players)); q('[data-act="melee-redraw"]').click(); await w(150);
    L.push('redraw: ' + (C.T().teams.length === 5) + ' changed ' + (JSON.stringify(C.T().teams.map(x => x.players)) !== before));
    q('[data-act="melee-unteam"]').click(); await w(150); L.push('back to players: ' + C.T().entry + ' ' + C.T().teams.length);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="melee-teams"]').click(); await w(150);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(200);
    L.push('swiss with drawn teams: ' + C.MS().length + ' games, bye ' + C.MS().some(m => m.bye) + ' notice gone ' + !q('[data-act="melee-redraw"]'));
    // all rounds in advance
    await mk({ name: 'Advance', meleeMode: 'advance', format: 'doubles', swissRounds: 3 }, 16);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(250);
    t = C.T(); const ms = C.MS();
    L.push('advance: draws ' + t.draws.length + ' games ' + ms.length + ' rounds ' + [...new Set(ms.map(m => m.round))].join(','));
    const pk = {}; ms.forEach(m => [m.a, m.b].forEach(s => s.forEach(x => s.forEach(y => { if (x < y) pk[x + y] = (pk[x + y] || 0) + 1; }))));
    L.push('repeat partners: ' + Object.values(pk).filter(v => v > 1).length);
    L.push('only round 1 on pistes: ' + ms.filter(m => m.court).every(m => m.round === 1) + ' r1 courts ' + ms.filter(m => m.court && m.round === 1).length);
    L.push('status: ' + q('main .panel').innerText.replace(/\s+/g, ' ').slice(0, 90) + ' | print ' + !!q('[data-act="print-draw"]') + ' next-round hidden ' + !q('[data-act="next-round"]'));
    for (const m of C.MS().filter(m => m.round === 1)) await C.recordResult(m.id, 13, 5, true);
    q('[data-act="assign"]').click(); await w(200);
    L.push('round 2 gets pistes after round 1: ' + C.MS().filter(m => m.round === 2 && m.court).length);
    // undo whole draw on a fresh advance comp
    await mk({ name: 'Advance 2', meleeMode: 'advance', format: 'doubles', swissRounds: 2 }, 8);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(200);
    q('[data-act="undo-all"]').click(); await w(300); L.push('undo all: draws ' + C.T().draws.length + ' games ' + C.MS().length);
    } catch (e) { L.push('ERR ' + e.message); }
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
