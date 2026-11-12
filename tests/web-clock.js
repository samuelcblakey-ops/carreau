// Starting and stopping a round clock saves the whole round in one write (clock-batch-write), with two organisers on the emulators:
// A taps Start and Stop, B watches; a score B saves at the moment A taps Start is kept.
const { open, together, w } = require('./two-organisers');
(async () => {
  const log = (...a) => console.log(...a);
  const o = await open({ teams: 12 }); const { A, B, tid, errs } = o;
  // a timed Swiss competition on 6 pistes, no check-in: round 1 has 6 games, all on a piste
  await A.evaluate(async tid => { const C = window.__carreau, S = C.S;
    await S.store.updateTournament(tid, { system: 'swiss', swissRounds: 3, checkin: false, timeLimit: 60, courts: [1, 2, 3, 4, 5, 6].map(n => ({ id: 'c' + n, name: String(n), active: true })) }); }, tid);
  await w(2000);
  await A.click('[data-tab="draw"]'); await B.click('[data-tab="draw"]'); await w(800);
  await A.click('[data-act="first-draw"]'); await w(4000);
  // count A's saves of games
  await A.evaluate(() => { const st = window.__carreau.S.store; window.__calls = { many: 0, one: 0 };
    const um = st.updateMatches, u1 = st.updateMatch;
    st.updateMatches = function (...a) { window.__calls.many++; return um.apply(this, a); };
    st.updateMatch = function (...a) { window.__calls.one++; return u1.apply(this, a); }; });
  const calls = async () => { const c = await A.evaluate(() => { const c = window.__calls; window.__calls = { many: 0, one: 0 }; return c; }); return `updateMatches calls ${c.many} | updateMatch calls ${c.one}`; };
  const games = p => p.evaluate(() => window.__carreau.MS().filter(m => !m.bye).map(m => ({ id: m.id, clockAt: m.clockAt || null, done: !!m.done, sa: m.sa, sb: m.sb })));
  const rowState = p => p.evaluate(() => { const r = document.querySelector('.clk-row'); return !r ? 'none' : r.querySelector('[data-act="clock-start"]') ? 'start' : r.classList.contains('up') ? 'up' : 'run'; });
  log(`round 1: games ${(await games(A)).length} | B start button ${await rowState(B)}`);
  // start
  await A.click('[data-act="clock-start"]'); await w(3000);
  const g1 = await games(A);
  log(`start: ${await calls()} | stamped ${g1.filter(m => m.clockAt).length} of ${g1.length} | B sees the clock running ${await rowState(B) === 'run'}`);
  await A.screenshot({ path: process.env.OUT + '/web-clock-a-running.png' });
  await B.screenshot({ path: process.env.OUT + '/web-clock-b-running.png' });
  // stop: watch the row for 2 seconds after the tap
  await A.click('[data-act="clock-stop-ask"]'); await w(300);
  const seen = await A.evaluate(async () => { document.querySelector('.clk-ask [data-act="clock-stop"]').click(); const st = [];
    for (let t = 0; t < 2000; t += 20) { const r = document.querySelector('.clk-row'); st.push(!r ? 'none' : r.querySelector('[data-act="clock-start"]') ? 'start' : 'running'); await new Promise(r => setTimeout(r, 20)); }
    return st; });
  await w(1500);
  const g2 = await games(A), g2b = await games(B);
  log(`stop: ${await calls()} | row went back to running ${seen.includes('running')} | clockAt on ${g2.filter(m => m.clockAt).length + g2b.filter(m => m.clockAt).length} games | B sees Start the clock ${await rowState(B) === 'start'}`);
  await A.screenshot({ path: process.env.OUT + '/web-clock-a-stopped.png' });
  // B saves a score at the moment A taps Start
  const target = g2[0].id;
  await B.evaluate(id => document.querySelector(`[data-match="${id}"]`).click(), target); await w(600);
  await together(() => A.evaluate(() => document.querySelector('[data-act="clock-start"]').click()),
    () => B.evaluate(() => document.querySelector('[data-act="qlose"][data-k="sb"][data-n="5"]').click()));
  await w(4000);
  const g3 = await games(A), g3b = await games(B);
  const ta = g3.find(m => m.id === target), tb = g3b.find(m => m.id === target);
  log(`score saved by B during A's Start is kept: ${ta.done && tb.done && ta.sb === 5 && tb.sb === 5} | that game stamped ${!!ta.clockAt && !!tb.clockAt}`);
  log('errs', JSON.stringify(errs));
  await o.close();
})().catch(e => { console.log('crashed:', e.message); process.exit(1); });
