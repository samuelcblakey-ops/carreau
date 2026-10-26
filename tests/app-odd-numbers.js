// Odd and awkward numbers. Swiss: teams meet teams with the same results in the same order (WWL v WWL), closest on points
// difference; cross-overs only where a group is odd, flagged, spread across teams; no rematches, no second bye while
// others wait, the leaders never get the bye. Knockout consolante: every team that loses its first real game, byes
// included, and no crash when too few lose. Barrages: never a barrage of 2. Mêlée: no repeat partners where there's room.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(80); const base = JSON.parse(JSON.stringify(C.T()));
    const W = s => (s.match(/W/g) || []).length;
    // play a Swiss competition through drawSwissRound; stronger teams usually win
    const swiss = (N, R, check) => {
      const t = JSON.parse(JSON.stringify(base)); Object.assign(t, { system: 'swiss', entry: 'teams', checkin: false, swissRounds: R, draws: [], teams: [] });
      for (let i = 0; i < N; i++) t.teams.push({ id: 'T' + String(i).padStart(2, '0'), name: 'T' + i, players: ['x'], active: true });
      const str = Object.fromEntries(t.teams.map((x, i) => [x.id, Math.random() * 2 + (N - i) / N]));
      const seq = Object.fromEntries(t.teams.map(x => [x.id, ''])), diff = Object.fromEntries(t.teams.map(x => [x.id, 0]));
      const r = { crosses: [], flagWrong: 0, rematches: 0, byes: {}, byeWhileWaiting: 0, byeToLeader: 0, gap2: 0, adjacent: true, notes: [], ctx: '' }; let ms = []; const played = new Set();
      for (let n = 1; n <= R; n++) {
        const d = C.drawSwissRound(t, ms); t.draws.push(d.draw); if (d.note) r.notes.push(d.note); const pre = { ...diff };
        const wv = Object.values(seq).map(W), top = Math.max(...wv), low = Math.min(...wv); let cr = 0; const res = {};
        for (const m of d.matches) {
          if (!m.b) { const id = m.a[0]; if (Object.keys(seq).some(x => x !== id && !r.byes[x]) && r.byes[id]) r.byeWhileWaiting++; r.byes[id] = (r.byes[id] || 0) + 1;
            if (top > low && W(seq[id]) === top) r.byeToLeader++; res[id] = 'W'; diff[id] += 6; continue; }
          const a = m.a[0], bb = m.b[0]; if (played.has(a + bb)) r.rematches++; played.add(a + bb); played.add(bb + a);
          const x = seq[a] !== seq[bb]; if (x !== !!m.cross) r.flagWrong++; if (x) { cr++; if (Math.abs(W(seq[a]) - W(seq[bb])) >= 2) r.gap2++; if (!r.ctx) r.ctx = C.matchContext(t, m); }
          const aw = Math.random() < str[a] / (str[a] + str[bb]), ls = Math.floor(Math.random() * 12);
          Object.assign(m, { done: true, sa: aw ? 13 : ls, sb: aw ? ls : 13 }); res[a] = aw ? 'W' : 'L'; res[bb] = aw ? 'L' : 'W'; diff[a] += aw ? 13 - ls : ls - 13; diff[bb] -= aw ? 13 - ls : ls - 13;
        }
        // inside a group, teams closest on points difference meet: 1st v 2nd, 3rd v 4th
        if (check) { const grp = {}; d.matches.filter(m => m.b && !m.cross).forEach(m => (grp[seq[m.a[0]]] = grp[seq[m.a[0]]] || []).push(m));
          for (const g of Object.values(grp)) { const ids = g.flatMap(m => [m.a[0], m.b[0]]).sort((x, y) => pre[y] - pre[x]); const pos = Object.fromEntries(ids.map((id, i) => [id, i]));
            if (!g.every(m => Math.floor(pos[m.a[0]] / 2) === Math.floor(pos[m.b[0]] / 2) || pre[m.a[0]] === pre[ids[pos[m.a[0]] ^ 1]] || pre[m.b[0]] === pre[ids[pos[m.b[0]] ^ 1]])) r.adjacent = false; } }
        for (const id in seq) seq[id] += res[id] || 'L'; r.crosses.push(cr); ms = ms.concat(d.matches);
      }
      return r;
    };
    const s8 = swiss(8, 4, true); L.push(`swiss 8 teams: crosses per round ${s8.crosses.join(',')} | flagged right ${s8.flagWrong === 0} | rematches ${s8.rematches} | closest on points ${s8.adjacent} | context ${s8.ctx}`);
    const s32 = swiss(32, 5, true); L.push(`swiss 32 teams: crosses per round ${s32.crosses.join(',')} | rematches ${s32.rematches} | closest on points ${s32.adjacent}`);
    let agg = { flag: 0, rem: 0, wait: 0, lead: 0, rep: 0, gap2: 0, notes: 0 };
    for (const [N, R] of [[9, 5], [11, 5], [13, 5], [17, 5], [21, 5]]) for (let i = 0; i < 6; i++) { const r = swiss(N, R);
      agg.flag += r.flagWrong; agg.rem += r.rematches; agg.wait += r.byeWhileWaiting; agg.lead += r.byeToLeader; agg.rep += Object.values(r.byes).filter(v => v > 1).length; agg.gap2 += r.gap2; agg.notes += r.notes.filter(x => /cross-over game\(s\)/.test(x)).length; }
    L.push(`swiss odd fields: flag wrong ${agg.flag} | rematches ${agg.rem} | second bye while others waited ${agg.wait} | bye to leaders ${agg.lead} | repeat byes ${agg.rep} | cross-over notes ${agg.notes > 0}`);
    // consolante: 9 teams, 16 bracket, 7 byes. Seeds win; 8 v 9 is the only first-round game
    const t = JSON.parse(JSON.stringify(base)); Object.assign(t, { system: 'knockout', consolante: true, seeding: 'entry', name: 'Cons', checkin: false, wizard: false });
    for (let i = 1; i <= 9; i++) t.teams.push({ id: 'k' + i, name: 'Seed ' + i, players: ['a'], active: true }); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(200);
    const panel = () => [...document.querySelectorAll('.panel')].find(x => /Consolante/.test(x.innerText) && x.querySelector('[data-act="start-cons"]'));
    const play = async () => { for (const m of C.MS().filter(m => m.bracket === 'A' && !m.done && m.a && m.b)) { const ia = +m.a[0].slice(1), ib = +m.b[0].slice(1); await C.recordResult(m.id, ia < ib ? 13 : 5, ia < ib ? 5 : 13, true); } await w(120); };
    await play(); L.push(`consolante after round 1: ${panel().innerText.replace(/\s+/g, ' ')} | disabled ${panel().querySelector('button').disabled}`);
    await play(); const ce = C.consolanteEntrants(C.MS());
    L.push(`consolante after round 2: ${panel().innerText.replace(/\s+/g, ' ')} | entrants ${ce.losers.map(x => x.slice(1)).join(',')}`);
    panel().querySelector('button').click(); await w(250);
    const B = C.T().brackets.find(x => x.id === 'B'); L.push(`consolante drawn: ${B ? B.entrants : 'none'} teams`);
    L.push(`one team: ${C.createBracket(C.T(), 'B', 'Consolante', ['k1']).error}`);
    // barrages
    const pools = (n, size) => { const tt = JSON.parse(JSON.stringify(base)); Object.assign(tt, { system: 'pools', poolSize: size, poolStyle: 'rr', checkin: false, teams: [] });
      for (let i = 0; i < n; i++) tt.teams.push({ id: 'p' + i, name: 'P' + i, players: ['a'], active: true }); return C.drawPools(tt).pools.map(p => p.members.length).join('/'); };
    L.push(`barrages: 11 in 3s ${pools(11, 3)} | 13 in 4s ${pools(13, 4)} | 18 in 4s ${pools(18, 4)} | 9 in 4s ${pools(9, 4)} | 7 in 3s ${pools(7, 3)}`);
    // mêlée: 20 players in doubles, 5 rounds
    let rp = 0; for (let s = 0; s < 5; s++) { const tm = JSON.parse(JSON.stringify(base)); Object.assign(tm, { entry: 'melee', format: 'doubles', checkin: false, swissRounds: 5, draws: [], players: [] });
      for (let i = 0; i < 20; i++) tm.players.push({ id: 'M' + i, name: 'M' + i, active: true }); let ms = []; const part = {};
      for (let r = 1; r <= 5; r++) { const d = C.drawMeleeRound(tm, ms); tm.draws.push(d.draw); d.matches.forEach(m => { m.done = true; m.sa = 13; m.sb = 4; if (m.b) [m.a, m.b].forEach(sd => { const k = [...sd].sort().join('|'); part[k] = (part[k] || 0) + 1; }); }); ms = ms.concat(d.matches); }
      rp += Object.values(part).filter(v => v > 1).length; }
    L.push(`melee 20 doubles: repeat partners ${rp}`);
  } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
