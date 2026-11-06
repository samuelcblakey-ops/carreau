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
    // every state the round box goes through while round 2 is drawn: never "Round finished" for round 2, never an active Draw round 3
    const seen = []; const rec = () => { const bx = box(); if (!bx || !/Round 2 of/.test(bx.textContent)) return; const sn = snap(); const g = bx.textContent.match(/(\d+)\/(\d+) games finished/);
      seen.push({ finished: sn.state === 'ready', next: /Draw round 3\|enabled/.test(sn.next), games: g ? +g[2] : -1 }); };
    const mo = new MutationObserver(rec); mo.observe(q('main'), { childList: true, subtree: true, characterData: true });
    q('[data-act="next-round"]').click(); rec(); await w(300); mo.disconnect(); rec();
    L.push(`draw round 2 renders: finished seen ${seen.some(x => x.finished)} | next enabled seen ${seen.some(x => x.next)} | games shown ${seen.length ? Math.min(...seen.map(x => x.games)) : 'none'}`);
    s = snap(); L.push(`round 2 drawn: ${s.state} | ${s.text} | ${s.next}`);
    for (const m of C.MS().filter(m => m.group === 'R2' && m.a && m.b && !m.bye)) await C.recordResult(m.id, 13, 1, true);
    await w(100); q('[data-tab="draw"]').click(); await w(40); s = snap(); L.push(`last planned round finished: ${s.state} | ${s.text} | ${s.next}`);
    // a second tap while the draw is saving does nothing: one tap, one round
    const t2 = JSON.parse(JSON.stringify(C.T())); t2.id = t.id + 'b'; t2.name = 'Double tap'; t2.draws = [];
    await S.store.setTournament(t2); S.tournaments[t2.id] = t2; S.tid = t2.id; S.matches = {}; C.render?.(); await w(60);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    for (const m of C.MS().filter(m => m.group === 'R1' && m.a && m.b && !m.bye)) await C.recordResult(m.id, 13, 2, true);
    await w(100); q('[data-tab="draw"]').click(); await w(40);
    // the second tap lands on the same button, as on a phone whose redraw is held back
    const nb = q('[data-act="next-round"]'); nb.click(); if (!nb.isConnected) q('main').appendChild(nb); nb.click(); await w(400);
    L.push(`double tap: rounds ${C.T().draws.filter(d => d.kind === 'round').length}`);
    return L; });
  // wide screens put "Undo round N" where "Draw round N" was: a double tap must still leave the new round in place
  const ready = async (pg, name) => { await pg.goto(process.env.APP_URL); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(300);
    await pg.evaluate(async name => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name, system: 'swiss', checkin: false, swissRounds: 3 });
      ['A', 'B', 'C', 'D'].forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
      q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
      for (const m of C.MS().filter(m => m.group === 'R1' && m.a && m.b && !m.bye)) await C.recordResult(m.id, 13, 2, true);
      await w(100); q('[data-tab="draw"]').click(); await w(60);
      window.__toasts = []; new MutationObserver(() => window.__toasts.push(document.querySelector('#toast').textContent)).observe(document.querySelector('#toast'), { childList: true, subtree: true, characterData: true });
    }, name); };
  const rounds = pg => pg.evaluate(() => window.__carreau.T().draws.filter(d => d.kind === 'round').length);
  const removed = pg => pg.evaluate(() => window.__toasts.some(x => /Draw removed/.test(x)));
  for (const width of [1024, 768, 390]) {
    const ctx = await b.newContext({ viewport: { width, height: 900 }, hasTouch: true }); const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message));
    await ready(pg, 'Wide ' + width); await pg.dblclick('[data-act="next-round"]'); await pg.waitForTimeout(600);
    const r1 = await rounds(pg), t1 = await removed(pg);
    await ready(pg, 'Taps ' + width); const bb = await pg.locator('[data-act="next-round"]').boundingBox();
    const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2; await pg.touchscreen.tap(x, y); await pg.waitForTimeout(120); await pg.touchscreen.tap(x, y); await pg.waitForTimeout(600);
    const r2 = await rounds(pg), t2 = await removed(pg);
    console.log(`double tap draw round 2 at ${width}: rounds ${Math.min(r1, r2)} | toast ${t1 || t2 ? '"Draw removed."' : 'not "Draw removed."'} | dblclick ${r1} taps ${r2}`);
    if (width === 1024) { await pg.screenshot({ path: 'test-results/round-status-double-tap-1024.png' });
      await pg.waitForTimeout(1500); await pg.click('[data-act="undo"]'); await pg.waitForTimeout(500);
      console.log(`undo after 2 s: rounds ${await rounds(pg)}`); }
    if (width === 390) await pg.screenshot({ path: 'test-results/round-status-double-tap-390.png' });
    await ctx.close();
  }
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
