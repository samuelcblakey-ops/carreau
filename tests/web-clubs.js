// Inter-club on the real database (emulator): the draw saves, games appear, and a score can be entered from Draw & results.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(process.env.WEB_URL); await new Promise(r => setTimeout(r, 3500));
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(2500);
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Clubs web', system: 'clubs', clubTeams: 4, clubPairing: 'like', checkin: false, wizard: false });
    ['Alpha', 'Bravo', 'Charlie'].forEach((cl, ci) => { for (let i = 0; i < 4; i++) t.teams.push({ id: `e${ci}${i}`, name: `${cl} ${i + 1}`, players: ['a', 'b', 'c'], club: cl, active: true }); });
    await S.store.setTournament(t); await w(1500);
    q('[data-tab="draw"]').click(); await w(400); q('[data-act="first-draw"]').click(); await w(3000);
    const ms = C.MS(); L.push(`saved: games ${ms.length} | fixtures ${C.T().clubFix.length} on days ${C.T().clubFix.map(f => f.day).join(',')} | toast ${q('#toast').textContent}`);
    const cards = document.querySelectorAll('.fixture button.match[data-match]'); L.push('score buttons: ' + cards.length);
    // enter a score the way an organiser does: tap the game, tap the winner, tap the loser's score
    const m = ms.find(x => x.round === 1); q(`[data-match="${m.id}"]`).click(); await w(300);
    q('[data-act="qlose"][data-k="sb"][data-n="7"]').click(); await w(1500);
    const m2 = C.MS().find(x => x.id === m.id); L.push(`scored: done ${m2.done} ${m2.sa}-${m2.sb} | fixture ${q('.fixture .fx').innerText.replace(/\s+/g, ' ')}`);
    // the organiser moves the day-2 fixture to day 3
    const f2 = C.T().clubFix.find(f => f.day === 2); q(`[data-act="fx-day"][data-fx="${f2.id}"][data-day="3"]`).click(); await w(2000);
    L.push(`moved: fixture on day ${C.T().clubFix.find(f => f.id === f2.id).day} | its games ${C.MS().filter(m => m.ca === f2.a && m.cb === f2.b).map(m => m.round).join(',')}`);
    // a fresh load reads it back from the database
    location.reload();
    } catch (e) { L.push('ERR ' + e.message); } return L; }).catch(() => null);
  await new Promise(r => setTimeout(r, 4000));
  const back = await p.evaluate(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)); await w(1500);
    const fx = C.T().clubFix || []; return `after reload: games ${C.MS().length} | done ${C.MS().filter(m => m.done).length} | plan ${fx.map(f => f.day).sort().join(',')} | rounds ${[...new Set(fx.map(f => C.MS().find(m => m.ca === f.a && m.cb === f.b).round))].sort().map(String).join(',')}`; });
  console.log((out || ['(page reloaded)']).join('\n')); console.log(back); console.log('errs', errs); await b.close();
})();
