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
    const ms = C.MS(); L.push(`saved: games ${ms.length} | days ${C.T().clubSched.length} | toast ${q('#toast').textContent}`);
    const cards = document.querySelectorAll('.fixture button.match[data-match]'); L.push('score buttons: ' + cards.length);
    // enter a score the way an organiser does: tap the game, tap the winner, tap the loser's score
    const m = ms.find(x => x.round === 1); q(`[data-match="${m.id}"]`).click(); await w(300);
    q('[data-act="qwin"][data-side="a"]').click(); await w(150); q('[data-act="qlose"][data-n="7"]')?.click(); await w(1500);
    const m2 = C.MS().find(x => x.id === m.id); L.push(`scored: done ${m2.done} ${m2.sa}-${m2.sb} | fixture ${q('.fixture .fx').innerText.replace(/\s+/g, ' ')}`);
    // a fresh load reads it back from the database
    location.reload();
    } catch (e) { L.push('ERR ' + e.message); } return L; }).catch(() => null);
  await new Promise(r => setTimeout(r, 4000));
  const back = await p.evaluate(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)); await w(1500);
    return `after reload: games ${C.MS().length} | done ${C.MS().filter(m => m.done).length} | days ${(C.T().clubSched || []).length}`; });
  console.log((out || ['(page reloaded)']).join('\n')); console.log(back); console.log('errs', errs); await b.close();
})();
