// Quick score entry (tap the winner, tap the loser's score, it saves), Undo, Ended on time, and the time-limit badge.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = [];
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Quick', system: 'swiss', checkin: false, swissRounds: 3 });
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    const games = C.MS().filter(m => m.a && m.b && !m.bye);
    const open = async id => { q('[data-tab="draw"]').click(); await w(40); q(`[data-match="${id}"]`).click(); await w(60); };
    // 1. quick: one tap on the loser's score
    await open(games[0].id);
    L.push('quick by default: ' + !!q('.quick [data-act="qlose"]') + ' | no score boxes: ' + !q('#sc-sa') + ' | no who-won step: ' + !q('[data-act="qwin"]'));
    L.push('loser pad buttons: ' + document.querySelectorAll('[data-act="qlose"][data-k="sa"]').length + '+' + document.querySelectorAll('[data-act="qlose"][data-k="sb"]').length + ' | teams ' + [...document.querySelectorAll('.qteam .qwho')].map(x => x.textContent.trim()).join(' / ') + ' | ' + q('#modal .quick .small.muted').textContent);
    q('[data-act="qlose"][data-k="sa"][data-n="6"]').click(); await w(200);
    let m = S.matches[games[0].id]; L.push(`saved: ${m.done} ${m.sa}-${m.sb} modal closed ${!S.modal} | undo shown ${!!q('#toast:not([hidden]) [data-act="toast-undo"]')}`);
    // 2. undo
    q('[data-act="toast-undo"]').click(); await w(200);
    m = S.matches[games[0].id]; L.push(`undone: done ${m.done} piste back ${!!m.court}`);
    // 3. ended on time: level is refused, 11-9 is saved and labelled
    await open(games[0].id);
    q('[data-act="mode"][data-mode="time"]').click(); await w(40);
    q('[data-act="pick"][data-k="sa"][data-n="9"]').click(); await w(30); q('[data-act="pick"][data-k="sb"][data-n="9"]').click(); await w(30);
    q('[data-act="save-final"]').click(); await w(100);
    L.push('level refused: ' + (q('#modal .err')?.textContent || ''));
    q('#sc-sa').click(); await w(30); q('[data-act="pick"][data-k="sa"][data-n="11"]').click(); await w(30);
    q('[data-act="save-final"]').click(); await w(200);
    m = S.matches[games[0].id]; q('[data-tab="draw"]').click(); await w(60);
    L.push(`time result: ${m.done} ${m.sa}-${m.sb} time ${m.time} | card says ${q(`[data-match="${m.id}"] .pill`)?.textContent}`);
    // 4. a normal score below 13 without Ended on time is refused
    await open(games[1].id); q('[data-act="mode"][data-mode="full"]').click(); await w(30);
    q('[data-act="pick"][data-k="sa"][data-n="10"]').click(); await w(30); q('[data-act="pick"][data-k="sb"][data-n="4"]').click(); await w(30);
    q('[data-act="save-final"]').click(); await w(100); L.push('below target refused: ' + /Ended on time/.test(q('#modal .err')?.textContent || ''));
    q('[data-act="close"]').click(); await w(40);
    // 5. time limit badge after the limit
    const tt = JSON.parse(JSON.stringify(C.T())); tt.timeLimit = 50; await S.store.setTournament(tt); S.tournaments[tt.id] = tt; await w(30);
    S.matches[games[1].id].courtAt = Date.now() - 51 * 60000; S.matches[games[2].id].courtAt = Date.now() - 10 * 60000;
    q('[data-tab="draw"]').click(); await w(60);
    L.push(`time badge: late ${q(`[data-match="${games[1].id}"] .pill`)?.textContent} | on time ${q(`[data-match="${games[2].id}"] .pill`)?.textContent.trim()}`);
    // 6. French
    q('[data-lang="fr"]').click(); await w(60); await open(games[2].id);
    L.push('french: ' + [...document.querySelectorAll('#modal .modeseg button')].map(b => b.textContent).join(' / ') + ' | ' + q('#modal .quick .small.muted')?.textContent);
    return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/quick-score.png' });
  // 7. small phones, real taps: the Winner to 13 | Ended on time switch keeps its height, the ✕ sits above the new-round banner
  const phone = async (width, height, long) => {
    const ctx = await b.newContext({ viewport: { width, height }, hasTouch: true }); const pp = await ctx.newPage(); pp.on('pageerror', e => errs.push(e.message));
    await pp.goto(process.env.APP_URL); await pp.evaluate(() => localStorage.clear()); await pp.reload(); await pp.waitForTimeout(300);
    const id = await pp.evaluate(async long => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: 'Small', system: 'swiss', checkin: false, swissRounds: 3 });
      ['A', 'B', 'C', 'D'].forEach(n => t.teams.push({ id: n, name: long ? `Les Boulistes Extraordinaires de Saint-Rémy-de-Provence ${n}` : 'Team ' + n, players: ['x'], active: true }));
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
      q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
      S.alert = { tid: t.id, label: 'Round 1 is out', until: Date.now() + 15000 }; C.render(); await w(40);
      return C.MS().find(m => m.a && m.b && !m.bye).id; }, long);
    await pp.locator(`[data-match="${id}"]`).tap(); await pp.waitForTimeout(150);
    if (long) { await pp.evaluate(() => window.__carreau.toast('That change didn\'t save. Check your connection and try again.')); await pp.waitForTimeout(150); }
    const seg = await pp.evaluate(() => { const r = document.querySelector('#modal .modeseg').getBoundingClientRect(); return Math.round(r.height); });
    const r = { seg, size: `${width}x${height}` };
    // the ✕ is what a finger at its centre lands on, with the banner still up
    r.close = await pp.evaluate(() => { const x = document.querySelector('#modal [data-act="close"]'), al = document.querySelector('#roundalert'); if (!x || al.hidden) return false;
      const b = x.getBoundingClientRect(), hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return b.top >= 0 && b.bottom <= innerHeight && !!hit && x.contains(hit); });
    await pp.screenshot({ path: `${process.env.OUT}/quick-score-${width}x${height}.png` });
    if (!long) {
      const tb = pp.locator('#modal [data-act="mode"][data-mode="time"]'); await tb.scrollIntoViewIfNeeded();
      r.hit = await tb.evaluate(el => { const b = el.getBoundingClientRect(), hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return b.height >= 44 && !!hit && el.contains(hit); });
      await tb.tap(); await pp.waitForTimeout(80); r.hit = r.hit && await tb.getAttribute('aria-pressed') === 'true';
      await pp.locator('#modal [data-act="pick"][data-k="sa"][data-n="11"]').first().tap(); await pp.waitForTimeout(40);
      await pp.locator('#modal [data-act="pick"][data-k="sb"][data-n="9"]').first().tap(); await pp.waitForTimeout(40);
      await pp.locator('#modal [data-act="save-final"]').tap(); await pp.waitForTimeout(200);
      r.saved = await pp.evaluate(id => { const C = window.__carreau, m = C.S.matches[id]; document.querySelector('[data-tab="draw"]').click(); return m.done && m.time ? `${m.sa}-${m.sb}` : 'not saved'; }, id);
      await pp.waitForTimeout(60); r.pill = await pp.locator(`[data-match="${id}"] .pill`).first().textContent();
    }
    await ctx.close(); return r;
  };
  const se = await phone(375, 667, false);
  console.log(`score dialog 375x667: switch ${se.seg >= 44 ? '44+' : se.seg} px | ended on time tappable ${se.hit} | ${se.saved} saved ${se.pill}`);
  console.log(`score dialog close button visible over the new-round banner: ${se.close}`);
  const lg = await phone(390, 844, true);
  console.log(`score dialog 390x844 with toast and long names: switch ${lg.seg >= 44 ? '44+' : lg.seg} px`);
  // 8. undo when a game was waiting: the undone game gets its piste back, the other game waits again
  { const pp = await b.newPage({ viewport: { width: 400, height: 860 } }); pp.on('pageerror', e => errs.push(e.message));
    await pp.goto(process.env.APP_URL); await pp.evaluate(() => localStorage.clear()); await pp.reload(); await pp.waitForTimeout(300);
    const line = await pp.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: 'Undo', system: 'swiss', checkin: false, swissRounds: 3, randomCourts: false, courts: [1, 2, 3].map(i => ({ id: 'c' + i, name: String(i), active: true })) });
      'ABCDEFGH'.split('').forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
      q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
      const games = C.MS().filter(m => m.a && m.b && !m.bye);
      const on1 = games.find(m => m.court === 'c1'), waiting = games.filter(m => !m.court);
      if (!on1 || waiting.length !== 1) return `setup wrong: on pistes ${games.filter(m => m.court).length} waiting ${waiting.length}`;
      q(`[data-match="${on1.id}"]`).click(); await w(60);
      q('[data-act="qlose"][data-k="sa"][data-n="6"]').click(); await w(200);
      const took = S.matches[waiting[0].id].court === 'c1';
      q('[data-act="toast-undo"]').click(); await w(300);
      const a = S.matches[on1.id], o = S.matches[waiting[0].id];
      return `undo with a waiting game: piste handed on ${took} | undone game ${a.court ? 'Piste ' + C.T().courts.find(c => c.id === a.court).name : 'waiting'} | other game ${o.court ? 'Piste ' + o.court : 'waiting'}`; });
    console.log(line); await pp.screenshot({ path: process.env.OUT + '/quick-score-undo-piste.png' }); await pp.close(); }
  console.log('errs', errs); await b.close();
})();
