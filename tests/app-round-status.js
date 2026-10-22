// The round box on Draw & results: red while games are still being played (Draw round N+1 shown but not clickable),
// green once every game in the round has a score (Draw round N+1 becomes the green button).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = [];
    const colour = v => { const el = document.createElement('span'); el.style.color = `var(${v})`; document.body.appendChild(el); const c = getComputedStyle(el).color; el.remove(); return c; };
    const box = () => q('main .panel.rp-live, main .panel.rp-ready');
    const snap = () => { const bx = box(); const nx = q('[data-act="next-round"]'), wt = q('main .btn.wait'); return {
      state: bx ? (bx.classList.contains('rp-ready') ? 'ready' : 'live') : 'none', border: bx ? getComputedStyle(bx).borderTopColor : '',
      text: bx ? bx.querySelector('.rp-state')?.textContent : '', next: nx ? `${nx.textContent}|enabled` : wt ? `${wt.textContent}|${wt.disabled ? 'disabled' : 'enabled'}` : 'none' }; };
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Round box', system: 'swiss', checkin: false, swissRounds: 2 });
    ['A', 'B', 'C', 'D'].forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    const red = colour('--danger'), green = colour('--accent');
    let s = snap(); L.push(`round 1 drawn: ${s.state} red ${s.border === red} | ${s.text} | ${s.next}`);
    const games = C.MS().filter(m => m.group === 'R1' && m.a && m.b && !m.bye);
    await C.recordResult(games[0].id, 13, 5, true); await w(100); q('[data-tab="draw"]').click(); await w(40);
    s = snap(); L.push(`one score in: ${s.state} red ${s.border === red} | ${s.text} | ${s.next}`);
    q('[data-lang="fr"]').click(); await w(60); s = snap(); L.push(`french: ${s.text} | ${s.next}`); q('[data-lang="en"]').click(); await w(60);
    await C.recordResult(games[1].id, 13, 9, true); await w(100); q('[data-tab="draw"]').click(); await w(40);
    s = snap(); L.push(`all scores in: ${s.state} green ${s.border === green} | ${s.text} | ${s.next}`);
    q('[data-act="next-round"]').click(); await w(300); s = snap(); L.push(`round 2 drawn: ${s.state} | ${s.text} | ${s.next}`);
    for (const m of C.MS().filter(m => m.group === 'R2' && m.a && m.b && !m.bye)) await C.recordResult(m.id, 13, 1, true);
    await w(100); q('[data-tab="draw"]').click(); await w(40); s = snap(); L.push(`last planned round finished: ${s.state} | ${s.text} | ${s.next}`);
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
