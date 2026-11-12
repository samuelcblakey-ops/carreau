// Timed games: how many mènes follow the time limit (Setup and Quick setup), the "Ended on time" wording in the score box,
// the round clock on Draw & results, and its beeps, banner and wake lock (Playwright's page.clock moves time on).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const L = [];
  const ev = async fn => { const r = await p.evaluate(fn); L.push(...r); };
  const helpers = `const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), L = [];
    const noScroll = () => document.documentElement.scrollWidth <= innerWidth;`;
  // 1. Setup: hidden at 0, shown once a limit is set, +2 by default
  await ev(new Function(`return (async () => { ${helpers} try {
    q('[data-act="new-t"]').click(); await w(150); q('[data-act="wiz-skip"]').click(); await w(150);
    L.push('setup time 0: extra mènes shown ' + !!q('.time-extra'));
    const f = q('#f-timelimit'); f.value = '60'; f.dispatchEvent(new Event('change', { bubbles: true })); await w(150);
    L.push('setup time 60: ' + q('.time-extra .eyebrow').textContent + ' | ' + [...document.querySelectorAll('[data-set="timeExtra"]')].map(x => x.textContent).join(' / ') + ' | pressed ' + q('[data-set="timeExtra"][aria-pressed="true"]').textContent);
    L.push('help +2: ' + q('.time-extra p').textContent);
    q('.time-extra').scrollIntoView({ block: 'center' });
    } catch (e) { L.push('ERR ' + e.message); } return L; })()`));
  await p.waitForTimeout(100); await p.screenshot({ path: process.env.OUT + '/timed-setup-390.png' });
  await ev(new Function(`return (async () => { ${helpers} try {
    q('[data-set="timeExtra"][data-val="1"]').click(); await w(150);
    L.push('tap +1: saved ' + C.T().timeExtra + ' ' + typeof C.T().timeExtra + ' | help ' + q('.time-extra p').textContent);
    // French: the label and both buttons are translated
    q('[data-lang="fr"]').click(); await w(100);
    const fr = [q('.time-extra .eyebrow').textContent, ...[...document.querySelectorAll('[data-set="timeExtra"]')].map(x => x.textContent)];
    L.push('fr setup: translated ' + (fr[0] !== 'When time is up' && fr[1] !== '+1 mène' && fr[2] !== '+2 mènes'));
    q('[data-lang="en"]').click(); await w(100);
    L.push('phone 390: no sideways scroll ' + noScroll());
    // a run-through copies the choice
    const src = JSON.parse(JSON.stringify(C.T())); src.template = true; await S.store.setTournament(src); S.tournaments[src.id] = src; q('[data-tab="draw"]').click(); await w(80);
    q('[data-act="use-template"]').click(); await w(200);
    L.push('run-through keeps +1: ' + (C.T().id !== src.id && C.T().timeExtra === 1));
    // Quick setup up to its last step
    q('[data-act="new-t"]').click(); await w(150); q('#wz-name').value = 'Timed'; q('[data-act="wiz-next"]').click(); await w(60);
    q('[data-act="wiz-set"][data-k="kind"][data-v="triples"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(60); q('[data-act="wiz-next"]').click(); await w(60);
    L.push('quick setup time 0: when time is up shown ' + !!(q('#wz-extra') && !q('#wz-extra').hidden));
    } catch (e) { L.push('ERR ' + e.message); } return L; })()`));
  // typed for real, so the cursor has to stay in the box
  await p.locator('#wz-time').tap(); await p.keyboard.press('Control+A'); await p.keyboard.type('45'); await p.waitForTimeout(100);
  await ev(new Function(`return (async () => { ${helpers} try {
    const x = q('#wz-extra');
    L.push('quick setup time 45 typed: ' + x.querySelector('.eyebrow').textContent + ' | ' + [...x.querySelectorAll('.wiz-opt')].map(o => o.textContent).join(' / ') + ' | on ' + x.querySelector('.wiz-opt.on').textContent + ' | cursor still in the box ' + (document.activeElement && document.activeElement.id === 'wz-time' && x.hidden === false));
    x.scrollIntoView({ block: 'center' });
    } catch (e) { L.push('ERR ' + e.message); } return L; })()`));
  await p.waitForTimeout(100); await p.screenshot({ path: process.env.OUT + '/timed-wizard-390.png' });
  await p.locator('[data-act="wiz-set"][data-k="timeExtra"][data-v="1"]').tap(); await p.waitForTimeout(150);
  await ev(new Function(`return (async () => { ${helpers} try {
    const opts = [...document.querySelectorAll('[data-k="timeExtra"]')];
    L.push('quick setup phone 390: options 44+ px ' + opts.every(o => o.getBoundingClientRect().height >= 44) + ' | no sideways scroll ' + noScroll());
    L.push('quick setup help +1: ' + q('#wz-extra p').textContent + ' | time kept ' + q('#wz-time').value);
    q('[data-act="wiz-next"]').click(); await w(200);
    L.push('quick setup +1 finished: time ' + C.T().timeLimit + ' | extra ' + C.T().timeExtra + ' ' + typeof C.T().timeExtra);
    q('[data-tab="setup"]').click(); await w(80); q('[data-act="wiz-again"]').click(); await w(150);
    for (let i = 0; i < 3; i++) { q('[data-act="wiz-next"]').click(); await w(60); }
    L.push('quick setup again: on ' + q('.wiz-opt.on[data-k="timeExtra"]').textContent);
    q('[data-act="wiz-skip"]').click(); await w(100);
    // shooting has no time limit, so no choice
    q('[data-act="new-t"]').click(); await w(150); q('#wz-name').value = 'Shoot'; q('[data-act="wiz-next"]').click(); await w(60);
    q('[data-act="wiz-set"][data-k="kind"][data-v="shooting"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(60); q('[data-act="wiz-next"]').click(); await w(60);
    L.push('quick setup shooting: when time is up shown ' + !!(q('#wz-extra') && !q('#wz-extra').hidden));
    q('[data-act="wiz-skip"]').click(); await w(100);
    // the score box when a game ended on time
    q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Timed score', system: 'swiss', checkin: false, swissRounds: 3, timeLimit: 50, wizard: false });
    ['A', 'B', 'C', 'D'].forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(300);
    const g = C.MS().find(m => m.a && m.b && !m.bye); q('[data-match="' + g.id + '"]').click(); await w(80);
    q('[data-act="mode"][data-mode="time"]').click(); await w(40);
    L.push('ended on time notice: ' + q('#modal .notice').textContent);
    q('[data-act="pick"][data-k="sa"][data-n="9"]').click(); await w(30); q('[data-act="pick"][data-k="sb"][data-n="9"]').click(); await w(30);
    q('[data-act="save-final"]').click(); await w(100);
    L.push('level refused: ' + (q('#modal .err')?.textContent || ''));
    q('[data-act="close"]').click(); await w(60);
    } catch (e) { L.push('ERR ' + e.message); } return L; })()`));
  // ---- the round clock: its own page, with a clock the test moves on ----
  {
    const P = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true }); P.on('pageerror', e => errs.push(e.message));
    await P.clock.install({ time: new Date('2026-11-14T14:05:00') });
    await P.goto(process.env.APP_URL); await P.evaluate(() => localStorage.clear()); await P.reload(); await P.waitForTimeout(300);
    const run = async fn => { const r = await P.evaluate(new Function(`return (async () => { ${helpers}
      const badges = () => document.querySelectorAll('main .pill.timeup').length, row = () => q('.clk-row'), digits = () => q('.clk-row .clk-time .clk-digits')?.textContent;
      const comp = async (sys, n, extra) => { q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
        Object.assign(t, { name: 'Clock ' + sys, system: sys, checkin: false, swissRounds: 3, timeLimit: 60, wizard: false, courts: [{ id: 'c1', name: '1', active: true }, { id: 'c2', name: '2', active: true }] }, extra || {});
        for (let i = 0; i < n; i++) t.teams.push({ id: 'T' + i, name: 'Team ' + 'ABCDEFGH'[i], players: ['x'], active: true });
        await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(300); };
      const quick = async id => { q('[data-tab="draw"]').click(); await w(40); q('[data-match="' + id + '"]').click(); await w(80); q('[data-act="qlose"][data-k="sb"][data-n="5"]').click(); await w(300); };
      try { ${fn} } catch (e) { L.push('ERR ' + e.message); } return L; })()`)); L.push(...r); };
    const shot = async name => { await P.evaluate(() => { const c = document.querySelector('.clk'); c && c.scrollIntoView({ block: 'start' }); window.scrollBy(0, -60); }); await P.screenshot({ path: process.env.OUT + `/clock-${name}-390.png` });
      await P.setViewportSize({ width: 1100, height: 900 }); await P.evaluate(() => window.scrollTo(0, 0)); await P.screenshot({ path: process.env.OUT + `/clock-${name}-desktop.png` }); await P.setViewportSize({ width: 390, height: 844 }); };
    const forwardTo = async ms => { const now = await P.evaluate(() => Date.now()); await P.clock.fastForward(Math.max(0, ms - now)); await P.waitForTimeout(150); };
    await run(`await comp('swiss', 6);
      L.push('round 1 drawn: ' + q('.clk .eyebrow').textContent + ' | ' + row().querySelector('b').textContent + ' | ' + row().querySelector('.clk-head .muted').textContent + ' | ' + row().querySelector('[data-act="clock-start"]').textContent);
      L.push('badges before start: ' + badges());`);
    await shot('before');
    await run(`q('[data-act="clock-start"]').click(); await w(150);
      const g = C.MS().filter(m => !m.bye); L.push('started: ' + digits() + ' | clockAt on ' + g.filter(m => m.clockAt).length + ' of ' + g.length + ' games | time at shown ' + /Time at \\d\\d:\\d\\d/.test(row().textContent));
      q('.clk').__mark = 1;`);
    const start = await P.evaluate(() => Math.min(...window.__carreau.MS().filter(m => m.clockAt).map(m => m.clockAt)));
    await P.clock.fastForward(1000); await P.waitForTimeout(50);
    await run(`L.push('after 1 s: ' + digits() + ' | page redrawn ' + !(q('.clk') && q('.clk').__mark === 1));`);
    await forwardTo(start + 20 * 60000);
    await run(`const waiting = C.MS().find(m => !m.bye && !m.court && !m.done); S.__late = waiting.id;
      await quick(C.MS().find(m => !m.bye && m.court && !m.done).id);
      const late = S.matches[S.__late];
      L.push('game finished at 20 min: waiting game on a piste ' + !!late.court + ' | started later ' + /Piste \\S+ · started later/.test(q('.clk-late')?.textContent || '') + ' | ' + digits());`);
    await shot('late');
    await forwardTo(start + 60 * 60000);
    await run(`const late = S.__late; L.push('at 60 min: ' + row().querySelector('.clk-up').textContent + ' | ' + row().querySelector('.clk-up + span').textContent + ' | badges ' + badges() + ' | late game badge ' + !!q('[data-match="' + late + '"] .pill.timeup'));`);
    await shot('timeup');
    await forwardTo(await P.evaluate(() => { const S = window.__carreau.S; return S.matches[S.__late].courtAt + 60 * 60000; })); // the late game got its piste at 20 min: 80 min
    await run(`const late = S.__late; L.push('late game at 80 min: badge ' + !!q('[data-match="' + late + '"] .pill.timeup'));
      let t = JSON.parse(JSON.stringify(C.T())); t.timeExtra = 1; t.courts.push({ id: 'c3', name: '3', active: true }); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); C.render(); await w(30);
      L.push('+1 setting: ' + row().querySelector('.clk-up + span').textContent);
      const before = S.matches[late].courtAt; q('[data-match="' + late + '"]').click(); await w(80);
      q('#mcourt').value = 'c3'; q('[data-act="save-live"]').click(); await w(200);
      L.push('moved piste keeps time: ' + (S.matches[late].court === 'c3' && S.matches[late].courtAt === before));
      q('[data-act="clock-stop-ask"]').click(); await w(60); L.push('stop asks: ' + q('.clk-ask span').textContent);
      q('.clk-ask [data-act="clock-stop"]').click(); await w(150);
      L.push('stopped: ' + row().querySelector('[data-act="clock-start"]').textContent + ' | clockAt on ' + C.MS().filter(m => m.clockAt).length + ' games | badges ' + badges());
      for (const m of C.MS().filter(m => !m.bye && !m.done && m.court)) await quick(m.id);
      L.push('round finished: panel shown ' + !!q('.clk'));`);
    // undo a round with its clock running, then draw it again
    await run(`await comp('swiss', 4); q('[data-act="clock-start"]').click(); await w(100);`);
    await P.clock.fastForward(2000);
    await run(`q('[data-act="undo"]').click(); await w(300); q('[data-act="first-draw"]').click(); await w(300);
      L.push('undo and redraw: clock started ' + (C.MS().some(m => m.clockAt) || !q('[data-act="clock-start"]')));`);
    await run(`await comp('roundrobin', 4); L.push('round robin row: ' + row().querySelector('b').textContent);
      const pf = S.permFn; S.permFn = () => ({ edit: false, score: true }); C.render(); await w(30);
      L.push('scorer link: clock shown ' + !!q('.clk') + ' | start button ' + !!q('[data-act="clock-start"]'));
      S.permFn = () => ({ edit: false, score: false }); C.render(); await w(30); L.push('spectator: clock shown ' + !!q('.clk'));
      S.permFn = pf; C.render(); await w(30);
      q('[data-lang="fr"]').click(); await w(100); L.push('fr: start button translated ' + (q('[data-act="clock-start"]').textContent !== 'Start the clock'));
      q('[data-lang="en"]').click(); await w(100);
      L.push('phone 390: no sideways scroll ' + noScroll() + ' | start button 44+ px ' + (q('[data-act="clock-start"]').getBoundingClientRect().height >= 44));`);
    await P.close();
  }
  // ---- clock alerts: beeps (counted in window.__beeps), the Time banner, flashing and a fake screen wake lock ----
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await ctx.addInitScript(() => {
      window.__beeps = 0; window.__wake = { req: 0, rel: 0, active: null };
      Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { const W = window.__wake; W.req++; const l = new EventTarget(); l.released = false;
        l.release = async () => { if (l.released) return; l.released = true; W.rel++; if (W.active === l) W.active = null; l.dispatchEvent(new Event('release')); }; W.active = l; return l; } } });
    });
    const A = await ctx.newPage(); A.on('pageerror', e => errs.push(e.message));
    await A.clock.install({ time: new Date('2026-11-14T14:05:00') });
    await A.goto(process.env.APP_URL); await A.evaluate(() => localStorage.clear()); await A.reload(); await A.waitForTimeout(300);
    const run = async (fn, page = A) => { const r = await page.evaluate(new Function(`return (async () => { ${helpers}
      const row = () => q('.clk-row'), flashing = () => !!row() && getComputedStyle(row()).animationName !== 'none', red = () => !!row() && row().classList.contains('up');
      const comp = async (n, extra) => { q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
        Object.assign(t, { name: 'Alerts', system: 'swiss', checkin: false, swissRounds: 3, timeLimit: 60, wizard: false, courts: [{ id: 'c1', name: '1', active: true }, { id: 'c2', name: '2', active: true }] }, extra || {});
        for (let i = 0; i < n; i++) t.teams.push({ id: 'T' + i, name: 'Team ' + 'ABCDEFGH'[i], players: ['x'], active: true });
        await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(300); };
      const quick = async id => { q('[data-tab="draw"]').click(); await w(40); q('[data-match="' + id + '"]').click(); await w(80); q('[data-act="qlose"][data-k="sb"][data-n="5"]').click(); await w(300); };
      const startAt = () => Math.min(...C.MS().filter(m => m.clockAt).map(m => m.clockAt));
      try { ${fn} } catch (e) { L.push('ERR ' + e.message); } return L; })()`)); L.push(...r); };
    const now = page => (page || A).evaluate(() => Date.now());
    const forwardTo = async (ms, page = A) => { await page.clock.fastForward(Math.max(0, ms - await now(page))); await page.waitForTimeout(150); };
    const startOf = page => (page || A).evaluate(() => Math.min(...window.__carreau.MS().filter(m => m.clockAt).map(m => m.clockAt)));
    // a round with a late game: 55 min amber and one beep, 60 min three more and a flash, late game time up on Registration
    await run(`await comp(6); q('[data-act="clock-start"]').click(); await w(100); window.__beeps = 0;`);
    let st = await startOf(); await forwardTo(st + 20 * 60000);
    await run(`const waiting = C.MS().find(m => !m.bye && !m.court && !m.done); S.__late = waiting.id; await quick(C.MS().find(m => !m.bye && m.court && !m.done).id);`);
    await forwardTo(st + 55 * 60000);
    await run(`L.push('55 min: amber ' + (row().classList.contains('warn') && getComputedStyle(row().querySelector('.clk-digits')).color !== getComputedStyle(document.body).color) + ' | beeps ' + window.__beeps); row().scrollIntoView({ block: 'center' });`);
    await A.screenshot({ path: process.env.OUT + '/clock-amber-390.png' });
    await forwardTo(st + 60 * 60000);
    await run(`L.push('60 min: beeps ' + window.__beeps + ' | flash ' + flashing() + ' | red ' + red()); row().scrollIntoView({ block: 'center' });`);
    await A.screenshot({ path: process.env.OUT + '/clock-red-390.png' });
    await A.clock.fastForward(10000); await A.waitForTimeout(150);
    await run(`L.push('after 10 s: flash ' + flashing() + ' | red ' + red()); q('[data-tab="entries"]').click(); await w(60);`);
    await forwardTo(await A.evaluate(() => { const S = window.__carreau.S; return S.matches[S.__late].courtAt + 60 * 60000; }));
    await run(`L.push('late game time up: beeps ' + window.__beeps + ' | banner ' + (q('#roundalert:not([hidden]) b')?.textContent || 'none'));`);
    await A.screenshot({ path: process.env.OUT + '/clock-banner-390.png' });
    // time up while on Registration
    await run(`q('[data-act="alert-close"]')?.click(); await comp(4); q('[data-act="clock-start"]').click(); await w(100); q('[data-tab="entries"]').click(); await w(1500);`);
    st = await startOf(); await forwardTo(st + 60 * 60000);
    await run(`L.push('on Registration at time up: banner ' + (q('#roundalert:not([hidden]) b')?.textContent || 'none')); q('[data-tab="draw"]').click(); await w(60);`);
    // a phone that opens the competition after time is up stays quiet, and sound waits for a tap
    await A.reload(); await A.waitForTimeout(400);
    await run(`window.__beeps = 0; S.tab = 'draw'; C.render(); await w(2500); // no tap yet: a tap would turn sound on
      L.push('opened after time up: beeps ' + window.__beeps);
      const shown = () => !!q('[data-act="sound-on"]'); const before = shown(); document.querySelector('main h2').click(); await w(100);
      L.push('sound locked after reload: Turn on the beep shown ' + before + ' | after tap shown ' + shown() + ' | reminder ' + /Keep this phone unlocked/.test(q('.clk').textContent));`);
    // a restarted clock alerts again: this phone already passed this round's time up (alerts used up), then Stop and Start
    const restart = `q('[data-act="clock-stop-ask"]').click(); await w(60); q('.clk-ask [data-act="clock-stop"]').click(); await w(100); q('[data-act="clock-start"]').click(); await w(1500); window.__beeps = 0;`; // a tick sees the new clock coming
    await run(`q('[data-tab="draw"]').click(); await w(60); ${restart}`);
    st = await startOf(); await forwardTo(st + 55 * 60000);
    await run(`S.__r55 = 'beeps ' + window.__beeps + ' amber ' + row().classList.contains('warn');`);
    await forwardTo(st + 60 * 60000);
    await run(`L.push('restart after time up: 55 min ' + S.__r55 + ' | 60 min beeps ' + window.__beeps + ' flash ' + flashing() + ' red ' + red());`);
    // restarted again, and this phone is on Registration at time up
    await run(`q('[data-act="alert-close"]')?.click(); ${restart} q('[data-tab="entries"]').click(); await w(60);`);
    st = await startOf(); await forwardTo(st + 55 * 60000); await forwardTo(st + 60 * 60000);
    await run(`L.push('restart, on Registration at time up: banner ' + (q('#roundalert:not([hidden]) b')?.textContent || 'none')); q('[data-act="alert-close"]')?.click(); q('[data-tab="draw"]').click(); await w(60);`);
    // restarted by another phone: a new clockAt saved on each of the round's games, as another phone's Start would
    await run(`const at = Date.now(); // the round on screen is the only one with a clock
      for (const m of C.MS().filter(m => !m.bye && !m.done && m.clockAt)) await S.store.updateMatch(S.tid, m.id, { clockAt: at });
      await w(1500); window.__beeps = 0;`);
    st = await startOf(); await forwardTo(st + 55 * 60000); await forwardTo(st + 60 * 60000);
    await run(`L.push('restarted by another phone: 60 min beeps ' + window.__beeps);
      window.__beeps = 0; for (let i = 0; i < 3; i++) { C.render(); await w(50); } await w(1500);
      L.push('same clock, page redrawn: repeat beeps ' + window.__beeps);`);
    // no warning when the limit is 5 minutes or less
    await run(`await comp(4, { timeLimit: 5 }); window.__beeps = 0; q('[data-act="clock-start"]').click(); await w(1500);`);
    st = await startOf(); await forwardTo(st + 4 * 60000 + 59000);
    await run(`L.push('limit 5 min: warning beeps ' + window.__beeps);`);
    // the wake lock: on while a timed round is played, asked for again when the page shows again, let go once the round is finished
    await run(`await comp(4); q('[data-act="clock-start"]').click(); await w(1500);
      const W = window.__wake; const on = !!W.active && W.req >= 1;
      let vis = 'hidden'; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => vis });
      await W.active.release(); document.dispatchEvent(new Event('visibilitychange')); await w(50); const req = W.req;
      vis = 'visible'; document.dispatchEvent(new Event('visibilitychange')); await w(100); const again = W.req === req + 1 && !!W.active;
      for (const m of C.MS().filter(m => !m.bye && !m.done && m.court)) await quick(m.id);
      await w(1500); L.push('wake lock: on while clock runs ' + on + ' | off after round finished ' + !W.active + ' | asked again when visible ' + again);`);
    // ---- each part of a EuroCup round, and each rotation game of an inter-club day, has its own clock ----
    const mk = `const rowNames = () => [...document.querySelectorAll('.clk-row .clk-head b')].map(b => b.textContent).join(',');
      const pistes = n => Array.from({ length: n }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      const mk = async (extra, teams) => { q('[data-act="alert-close"]')?.click(); q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
        Object.assign(t, { wizard: false, checkin: false, timeLimit: 60, courts: pistes(6), teams }, extra);
        await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(300); };
      const finish = async ids => { for (const id of ids) { const p = { sa: 13, sb: 7, done: true }; Object.assign(S.matches[id], p); await S.store.updateMatch(S.tid, id, p); }
        await C.assignCourts(); await w(150); C.render(); await w(60); };`;
    // EuroCup: 4 clubs, line-ups written straight to round 1's games; 6 pistes, so a whole part plays at once
    await run(mk + `const squad = c => ({ players: Array.from({ length: 8 }, (_, i) => c + ' P' + (i + 1)), genders: Array.from({ length: 8 }, (_, i) => i < 3 ? 'f' : 'm') });
      await mk({ system: 'eurocup', name: 'Euro clock' }, ['Ash', 'Birch', 'Cedar', 'Dale'].map(c => Object.assign({ id: 'e' + c[0], name: c, club: c, active: true }, squad(c))));
      const lu = { ot: [4, 5, 6], mt: [1, 2, 3], od1: [4, 5], od2: [6, 7], md: [1, 8] }, nm = id => C.T().teams.find(x => x.id === id).name;
      for (const m of C.MS().filter(m => m.round === 1)) { const la = lu[m.eu].map(i => nm(m.a[0]) + ' P' + i), lb = lu[m.eu].map(i => nm(m.b[0]) + ' P' + i); Object.assign(S.matches[m.id], { la, lb }); await S.store.updateMatch(S.tid, m.id, { la, lb }); }
      await C.assignCourts(); await w(150); C.render(); await w(60);
      L.push('eurocup round 1: ' + rowNames() + ' | ' + row().querySelector('.clk-head .muted').textContent + ' | ' + row().querySelector('[data-act="clock-start"]').textContent);
      q('[data-act="clock-start"]').click(); await w(1500);
      const r1 = () => C.MS().filter(m => m.round === 1);
      L.push('eurocup triples started: triples stamped ' + r1().filter(m => m.leg === 1 && m.clockAt).length + ' of ' + r1().filter(m => m.leg === 1).length + ' | doubles stamped ' + r1().filter(m => m.leg === 2 && m.clockAt).length);
      await finish(r1().filter(m => m.leg === 1).map(m => m.id));
      L.push('eurocup doubles on pistes: ' + rowNames() + ' | ' + (q('.clk-row [data-act="clock-start"]') ? 'not started' : 'running') + ' | triples row gone ' + !/Triples/.test(rowNames()));
      q('[data-act="clock-start"]').click(); await w(1500); window.__beeps = 0;`);
    st = await A.evaluate(() => Math.min(...window.__carreau.MS().filter(m => m.leg === 2 && m.clockAt).map(m => m.clockAt)));
    await forwardTo(st + 55 * 60000);
    await run(`L.push('eurocup doubles 55 min: amber ' + row().classList.contains('warn') + ' | beeps ' + window.__beeps); row().scrollIntoView({ block: 'center' });`);
    await A.screenshot({ path: process.env.OUT + '/clock-eurocup-doubles-390.png' });
    await run(`q('[data-tab="entries"]').click(); await w(60);`);
    await forwardTo(st + 60 * 60000);
    await run(`L.push('eurocup doubles time up, on Registration: banner ' + (q('#roundalert:not([hidden]) b')?.textContent || 'none'));
      q('[data-act="alert-close"]')?.click(); q('[data-tab="draw"]').click(); await w(60);
      q('[data-lang="fr"]').click(); await w(100); const fr = q('.clk-row .clk-head b').textContent; q('[data-lang="en"]').click(); await w(100);
      L.push('fr eurocup row: translated ' + (fr !== 'Round 1 · Doubles' && /Doublettes/.test(fr)));`);
    // inter-club: the rotation pairing has a clock for each game number; one game per team per day keeps one clock for the day
    await run(mk + `const teams = []; for (const c of ['North', 'South']) for (let i = 1; i <= 3; i++) teams.push({ id: c[0] + i, name: c + ' ' + i, club: c, players: ['x'], active: true });
      await mk({ system: 'clubs', clubPairing: 'rotation', clubTeams: 3, clubDays: 1, name: 'Rotation', courts: pistes(3) }, teams);
      const first = rowNames(); await finish(C.MS().filter(m => m.game === 1).map(m => m.id));
      L.push('inter-club rotation: ' + first + ' | then ' + rowNames());
      await mk({ system: 'clubs', clubPairing: 'like', clubTeams: 3, clubDays: 1, name: 'Like for like', courts: pistes(3) }, teams);
      L.push('inter-club default pairing: ' + rowNames());
      await comp(4); L.push('swiss: ' + rowNames());`);
    // spectators: no sound, no wake lock
    await run(`await comp(4); q('[data-act="clock-start"]').click(); await w(200); S.permFn = () => ({ edit: false, score: false }); C.render(); window.__beeps = 0; await w(1500);`);
    st = await startOf(); await forwardTo(st + 55 * 60000); await forwardTo(st + 60 * 60000);
    await run(`L.push('spectator: beeps ' + window.__beeps + ' | wake lock ' + !!window.__wake.active);`);
    await A.close();
    // reduced motion: the row turns red without flashing
    const R = await ctx.newPage(); R.on('pageerror', e => errs.push(e.message)); await R.emulateMedia({ reducedMotion: 'reduce' });
    await R.clock.install({ time: new Date('2026-11-14T14:05:00') });
    await R.goto(process.env.APP_URL); await R.evaluate(() => localStorage.clear()); await R.reload(); await R.waitForTimeout(300);
    await run(`await comp(4); q('[data-act="clock-start"]').click(); await w(1500);`, R);
    st = await startOf(R); await forwardTo(st + 60 * 60000, R);
    await run(`L.push('reduced motion: flash ' + flashing() + ' | red ' + red() + ' | flash class on ' + row().classList.contains('flash'));`, R);
    await ctx.close();
  }
  console.log(L.join('\n')); console.log('errs', errs); await b.close();
})();
