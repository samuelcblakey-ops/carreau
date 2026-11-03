// Busy self-scored days. The organiser's screen publishes every confirmed score as soon as it comes in, even when a
// batch is already being saved (it used to wait for the next 30-second check); an auto-confirmed score is published the
// moment its wait is over. Changes from other devices are drawn in batches (at most a couple of redraws a second), and a
// screen that isn't showing catches up when it comes back.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = [];
    // team score entry on, this screen is the organiser's
    S.teamScoringOn = () => true; S.myTeam = () => null;
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Busy day', system: 'swiss', checkin: false, swissRounds: 3, scoreMode: 'teams' });
    'ABCDEFGH'.split('').forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(400);
    const games = C.MS().filter(m => m.group === 'R1' && m.a && m.b && !m.bye).sort((x, y) => x.order - y.order);
    // like the live site: the organiser's own change shows on its screen at once, but the save only finishes when the
    // server answers (a slow signal here); the teams' confirmations land straight in the shared data
    const direct = S.store.updateMatch.bind(S.store);
    S.store.updateMatch = async (...a) => { const r = await direct(...a); await w(250); return r; };
    const confirm = (m, sa, sb) => direct(t.id, m.id, { proposal: { sa, sb, by: m.a[0], at: Date.now(), status: 'confirmed', confirmedBy: m.b[0] } });
    const t0 = Date.now();
    await confirm(games[0], 13, 4); await w(120);
    for (const [i, m] of games.slice(1).entries()) await confirm(m, 13, 5 + i);
    const allIn = async () => { for (let i = 0; i < 80; i++) { if (games.every(m => S.matches[m.id]?.done && S.matches[m.id]?.proposal?.status === 'applied')) return true; await w(100); } return false; };
    const done = await allIn();
    L.push(`burst published: ${done} | games ${games.length} | within 8 s ${Date.now() - t0 < 8000} | all applied ${games.every(m => S.matches[m.id]?.proposal?.status === 'applied')}`);
    L.push(`scores: ${games.map(m => `${S.matches[m.id].sa}-${S.matches[m.id].sb}`).join(',')}`);
    // auto-confirm: an unanswered score goes up the moment its wait is over
    S.store.updateMatch = direct;
    q('[data-act="next-round"]').click(); await w(400);
    const t2 = C.T(); t2.scoreMode = 'teams-auto'; t2.autoConfirmMin = 0.04; await S.store.setTournament(t2); await w(60); // 2.4 s
    const g2 = C.MS().filter(m => m.group === 'R2' && m.a && m.b && !m.bye).sort((x, y) => x.order - y.order)[0];
    const t1 = Date.now();
    await direct(t2.id, g2.id, { proposal: { sa: 13, sb: 9, by: g2.a[0], at: Date.now(), status: 'pending' } });
    await w(1500); const early = !!S.matches[g2.id].done;
    for (let i = 0; i < 60 && !S.matches[g2.id].done; i++) await w(100);
    const took = Date.now() - t1;
    L.push(`auto: not before the wait ${!early} | published ${!!S.matches[g2.id].done} ${S.matches[g2.id].proposal?.status} | soon after ${took >= 2400 && took < 5000}`);
    // redraws: changes from other devices are drawn in batches
    q('[data-tab="standings"]').click(); await w(700);
    const main = q('#main'); let redraws = 0;
    const mo = new MutationObserver(rs => rs.forEach(r => { if (r.addedNodes.length && r.removedNodes.length) redraws++; })); mo.observe(main, { childList: true });
    C.renderSoon(); await w(0); const first = redraws;
    for (let i = 0; i < 20; i++) { C.renderSoon(); await w(20); }
    await w(700); mo.takeRecords().forEach(r => { if (r.addedNodes.length && r.removedNodes.length) redraws++; });
    L.push(`first change drawn at once: ${first === 1} | 21 changes in ${redraws} redraws | batched ${redraws <= 3}`);
    // a screen that isn't showing skips them, then catches up
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); await w(600); redraws = 0;
    for (let i = 0; i < 5; i++) { C.renderSoon(); await w(30); }
    await w(700); const hiddenRedraws = redraws;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); await w(50);
    L.push(`hidden: redraws ${hiddenRedraws} | shown again: ${redraws === 1}`);
    mo.disconnect();
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
