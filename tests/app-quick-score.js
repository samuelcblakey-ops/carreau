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
    // 1. quick: two taps
    await open(games[0].id);
    L.push('quick by default: ' + !!q('[data-act="qwin"]') + ' | no score boxes: ' + !q('#sc-sa'));
    q('[data-act="qwin"][data-side="b"]').click(); await w(40);
    L.push('loser pad buttons: ' + document.querySelectorAll('[data-act="qlose"]').length);
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
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/quick-score.png' }); console.log('errs', errs); await b.close();
})();
