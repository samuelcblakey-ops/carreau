// Pick the Winner (pick-game) on the website: joining, the private link on a second device, and the rules for picks
// (own picks only, before the round's close; others' picks readable once closed; the organiser can't pick for anyone).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const mk = async (n, vw = 1100) => { const c = await b.newContext({ viewport: { width: vw, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  // a write or read through the rules: allowed, denied, or the error code
  const raw = (p, op, ...args) => p.evaluate(async ([op, args]) => { try { await window.__testRaw[op](...args); return 'allowed'; } catch (e) { return e.code === 'permission-denied' ? 'denied' : (e.code || e.message); } }, [op, args]);
  const pickOp = ([pid, round, team]) => [['set', `tournaments/${window.__tid}/picks/${pid}_${round}`, { pid, round, team, at: '__now' }]];
  const AD = await mk('admin'); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  await AD.click('[data-act="open-testing"]'); await w(2500); // strict mode: the rules decide
  // the organiser: a competition with 4 teams and three pick rounds: p1 open, p2 closed, p3 open (closed later)
  const A = await mk('organiser'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500); const tid = await A.evaluate(() => location.hash.slice(1));
  await A.evaluate(async () => { const C = window.__carreau, S = C.S, t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = 'swiss'; t.swissRounds = 3;
    ['Italy (ITA)', 'France (FRA)', 'Thailand (THA)', 'Spain (ESP)'].forEach((name, i) => t.teams.push({ id: 'e' + i, name, players: ['a', 'b', 'c'], active: true }));
    t.pick = { on: true, rounds: [{ id: 'p1', name: 'Round 1', src: 'swiss:1' }, { id: 'p2', name: 'Round 2', src: 'swiss:2' }, { id: 'p3', name: 'Round 3', src: 'swiss:3' }] };
    t.pickClose = { p1: Date.now() + 36e5, p2: Date.now() - 36e5, p3: Date.now() + 36e5 };
    await S.store.setTournament(t); S.tournaments[t.id] = t; });
  await w(2000);
  const setTid = p => p.evaluate(t => { window.__tid = t; }, tid);
  // player 1 joins on their phone and saves a pick through the page
  const P = await mk('player', 390); await P.goto(base + '#' + tid); await w(5000); await setTid(P);
  await P.click('[data-tab="pick"]'); await w(800);
  await P.fill('#pk-you', 'Ann'); await P.click('[data-act="pk-join"]'); await w(2500);
  const link = await P.evaluate(() => document.querySelector('#pk-link')?.value || '');
  const pid = /\.pk-([A-Z0-9]+)-/.exec(link)?.[1] || '';
  log('joined: ' + await P.evaluate(() => document.querySelector('.pk-me span')?.textContent) + ' | link ' + /#\w+\.pk-[A-Z0-9]{8}-[A-Z0-9]{16}$/.test(link));
  await P.screenshot({ path: process.env.OUT + '/web-pick-joined-390.png', fullPage: true });
  // one player per device (pick-game-join-once): joining again gives back the same player, here and after a reload
  const again = await P.evaluate(async () => { const C = window.__carreau; return (await C.S.pickGame.join(C.T(), 'Ann again')).pid; });
  await P.reload(); await w(5000); await setTid(P);
  const again2 = await P.evaluate(async () => { const C = window.__carreau; return (await C.S.pickGame.join(C.T(), 'Ann again')).pid; });
  log('device with a player joins again: ' + (again === pid && again2 === pid ? 'same player' : `new player ${again} ${again2} (was ${pid})`));
  // four joins at once on a new phone (a slow join tapped repeatedly) make one player
  const R = await mk('player4', 390); await R.goto(base + '#' + tid); await w(5000);
  const four = await R.evaluate(async () => { const C = window.__carreau, t = C.T(); return [...new Set((await Promise.all([1, 2, 3, 4].map(() => C.S.pickGame.join(t, 'Teat')))).map(x => x.pid))]; });
  log('join 4 times at once on one phone: ' + four.length + ' player' + (four.length === 1 ? '' : 's'));
  await R.close();
  for (const id of four) await raw(AD, 'del', `tournaments/${tid}/pickers/${id}`); // keep the leaderboard checks below to Ann and Bob
  await P.selectOption('#pk-sel-p1', 'e0'); await P.click('[data-act="pk-save"][data-r="p1"]'); await w(2000);
  log('own pick before close: ' + (await P.evaluate(() => document.querySelector('.pk-card[data-round="p1"] .pk-mine')?.textContent || '')).replace('Your pick: Italy (ITA)', 'allowed'));
  log('own pick (raw) before close: ' + await raw(P, 'batch', await P.evaluate(pickOp, [pid, 'p3', 'e1'])));
  log('own pick after close: ' + await raw(P, 'batch', await P.evaluate(pickOp, [pid, 'p2', 'e2'])));
  log('round not in the game: ' + await raw(P, 'batch', await P.evaluate(pickOp, [pid, 'p9', 'e2'])));
  log('pick id not matching: ' + await raw(P, 'batch', [['set', `tournaments/${tid}/picks/${pid}_p1x`, { pid, round: 'p1', team: 'e2', at: '__now' }]]));
  log('private key read: ' + await raw(P, 'get', `tournaments/${tid}/pickkeys/${pid}`));
  // the organiser closes round 3: Ann's pick in it can't change any more
  await A.evaluate(async () => { const C = window.__carreau; await C.S.store.updateTournament(C.T().id, { pickClose: Object.assign({}, C.T().pickClose, { p3: Date.now() - 1000 }) }); });
  await w(1500);
  log('change pick after close: ' + await raw(P, 'batch', await P.evaluate(pickOp, [pid, 'p3', 'e3'])));
  log('delete pick after close: ' + await raw(P, 'del', `tournaments/${tid}/picks/${pid}_p3`));
  // player 2, on another phone
  const Q = await mk('player2', 390); await Q.goto(base + '#' + tid); await w(5000); await setTid(Q);
  await Q.click('[data-tab="pick"]'); await w(800); await Q.fill('#pk-you', 'Bob'); await Q.click('[data-act="pk-join"]'); await w(2500);
  log('pick for another player: ' + await raw(Q, 'batch', await Q.evaluate(pickOp, [pid, 'p1', 'e3'])));
  log("read another's open pick: " + await raw(Q, 'get', `tournaments/${tid}/picks/${pid}_p1`));
  log("read another's closed pick: " + await raw(Q, 'get', `tournaments/${tid}/picks/${pid}_p3`));
  const V = await mk('spectator', 390); await V.goto(base + '#' + tid); await w(4000);
  log('spectator reads closed pick: ' + await raw(V, 'get', `tournaments/${tid}/picks/${pid}_p3`) + ' | open pick ' + await raw(V, 'get', `tournaments/${tid}/picks/${pid}_p1`));
  log('spectator lists a closed round: ' + await V.evaluate(async t => { try { return (await window.__testRaw.where('tournaments/' + t + '/picks', 'round', 'p3')).length; } catch (e) { return e.code; } }, tid)
    + ' | an open round ' + await V.evaluate(async t => { try { return (await window.__testRaw.where('tournaments/' + t + '/picks', 'round', 'p1')).length; } catch (e) { return e.code; } }, tid));
  // the private link on a second device: it plays as Ann
  const D = await mk('second device', 390); await D.goto(link); await w(6000); await setTid(D);
  log('second device: tab ' + await D.evaluate(() => document.querySelector('[data-tab="pick"]')?.getAttribute('aria-current')) + ' | ' + await D.evaluate(() => document.querySelector('.pk-me span')?.textContent) + ' | sees own pick ' + await D.evaluate(() => document.querySelector('.pk-card[data-round="p1"] .pk-mine')?.textContent));
  log('second device with private link writes pick: ' + await raw(D, 'batch', await D.evaluate(pickOp, [pid, 'p1', 'e2'])));
  await w(1500);
  log('first device follows: ' + await P.evaluate(() => document.querySelector('.pk-card[data-round="p1"] .pk-mine')?.textContent));
  // a wrong key: the link is refused, and a direct write too
  const E = await mk('wrong key', 390); await E.goto(link.replace(/-([A-Z0-9]{16})$/, '-AAAAAAAAAAAAAAAA')); await w(6000); await setTid(E);
  const eUid = await E.evaluate(() => window.__testUid());
  log('wrong key joins: ' + await raw(E, 'batch', [['set', `tournaments/${tid}/pickdev/${eUid}`, { pid, key: 'AAAAAAAAAAAAAAAA', at: '__now' }]]) + ' | page still asks for a name ' + await E.evaluate(async () => { document.querySelector('[data-tab="pick"]').click(); await new Promise(r => setTimeout(r, 800)); return !!document.querySelector('#pk-you') && !document.querySelector('.pk-me'); }));
  log('wrong key writes pick: ' + await raw(E, 'batch', await E.evaluate(pickOp, [pid, 'p1', 'e3'])));
  log('new player with an existing id: ' + await raw(E, 'batch', [['set', `tournaments/${tid}/pickers/${pid}`, { name: 'Eve', at: '__now' }], ['set', `tournaments/${tid}/pickkeys/${pid}`, { key: 'BBBBBBBBBBBBBBBB' }], ['set', `tournaments/${tid}/pickdev/${eUid}`, { pid, key: 'BBBBBBBBBBBBBBBB', at: '__now' }]]));
  // the organiser
  await setTid(A);
  log("organiser writes a player's pick: " + await raw(A, 'batch', await A.evaluate(pickOp, [pid, 'p1', 'e3'])));
  log('organiser reads private key: ' + await raw(A, 'get', `tournaments/${tid}/pickkeys/${pid}`));
  // pick-game-leaderboard: the organiser hides an unsuitable name; nobody else can, and nobody can rename a player
  log('organiser hides player: ' + await raw(A, 'update', `tournaments/${tid}/pickers/${pid}`, { hidden: true }));
  log('player hides another: ' + await raw(Q, 'update', `tournaments/${tid}/pickers/${pid}`, { hidden: false }));
  log('organiser renames player: ' + await raw(A, 'update', `tournaments/${tid}/pickers/${pid}`, { name: 'Rude' }));
  log('organiser hides with a non-bool: ' + await raw(A, 'update', `tournaments/${tid}/pickers/${pid}`, { hidden: 'yes' }));
  log('player renames self: ' + await raw(P, 'update', `tournaments/${tid}/pickers/${pid}`, { name: 'Ann 2' }));
  { const V3 = await mk('leaderboard viewer', 390); await V3.goto(base + '#' + tid); await w(4000); await V3.click('[data-tab="pick"]'); await w(3000);
    log('leaderboard for a spectator: ' + await V3.evaluate(() => [...document.querySelectorAll('.pk-table tbody tr')].map(r => r.textContent.replace(/\s+/g, ' ').trim()).join(' / ') + ' | ' + (document.querySelector('.pk-board > p')?.textContent || '')));
    await V3.screenshot({ path: process.env.OUT + '/web-pick-board-390.png', fullPage: true }); }
  // pick-game-picks-public: picks are public as soon as they're saved, but not once the competition is archived
  log('spectator with no player reads picks: ' + await raw(V, 'get', `tournaments/${tid}/picks/${pid}_p1`) + ' | lists an open round ' + await V.evaluate(async t => { try { return (await window.__testRaw.where('tournaments/' + t + '/picks', 'round', 'p1')).length; } catch (e) { return e.code; } }, tid));
  log('stranger turns the game off: ' + await raw(E, 'update', `tournaments/${tid}`, { pick: { on: false, rounds: [] } }));
  log('archive: ' + await raw(A, 'update', `tournaments/${tid}`, { archived: true }));
  log('read picks of an archived competition: ' + await raw(V, 'get', `tournaments/${tid}/picks/${pid}_p1`) + ' | admin ' + await raw(AD, 'get', `tournaments/${tid}/picks/${pid}_p1`));
  await AD.click('[data-act="open-testing"]'); await w(1500); // back to the beta default
  log('errs', errs); await b.close();
})();
