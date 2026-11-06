// A big draw on the real database (emulator): Swiss, 60 teams, round 2 (30 games). The games and the competition are written
// together, so the organiser and a spectator both go from no round 2 to all 30 games in one step, never part of the round.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const mk = async (n, vw = 1100, vh = 900) => { const c = await b.newContext({ viewport: { width: vw, height: vh } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const A = await mk('organiser'); await A.goto(base); await A.waitForSelector('[data-act="new-t"]', { timeout: 20000 }).catch(e => errs.push('organiser: ' + e.message));
  await w(3500); // let sign-in and the first snapshots settle before writing, as the other web tests do
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(() => location.hash.slice(1).split('.')[0]);
  const r1 = await A.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms));
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Big Swiss', system: 'swiss', checkin: false, wizard: false, listed: false });
    for (let i = 1; i <= 60; i++) t.teams.push({ id: 'e' + i, name: 'Team ' + i, players: ['a', 'b', 'c'], active: true });
    await S.store.setTournament(t); await w(1500);
    document.querySelector('[data-tab="draw"]').click(); await w(400); document.querySelector('[data-act="first-draw"]').click(); await w(4000);
    const ms = C.MS().filter(m => m.round === 1 && m.a && m.b);
    for (const [k, m] of ms.entries()) await S.store.updateMatch(S.tid, m.id, { sa: 13, sb: k % 13, done: true });
    await w(2000); return C.MS().filter(m => m.round === 1 && m.done).length; });
  log('round 1 games done:', r1);
  // a spectator follows the competition from its link
  const V = await mk('spectator', 390, 844); await V.goto(base + '#' + tid); await w(5000);
  // both screens note every count of round 2 games they hold (checked every few milliseconds)
  const watch = p => p.evaluate(() => { const seen = [0]; window.__seen = seen; const tick = () => { const n = window.__carreau.MS().filter(m => m.round === 2).length; if (n !== seen[seen.length - 1]) seen.push(n); setTimeout(tick, 4); }; tick(); });
  await watch(V); await watch(A);
  await A.click('[data-act="next-round"]'); await w(6000);
  const sv = await V.evaluate(() => window.__seen), so = await A.evaluate(() => window.__seen.slice(1));
  log('spectator counts seen:', sv.join(' → '));
  log('organiser counts seen:', so.join(', ') + (so.length === 1 ? ' only' : ''));
  log('spectator round 2 shown:', await V.evaluate(() => window.__carreau.T().draws.some(d => d.round === 2)));
  await V.screenshot({ path: process.env.OUT + '/web-big-draw-spectator.png' }); await A.screenshot({ path: process.env.OUT + '/web-big-draw-organiser.png' });
  log('errs', errs); await b.close();
})();
