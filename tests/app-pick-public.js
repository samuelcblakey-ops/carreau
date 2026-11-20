// Pick the Winner: everyone's picks by name as soon as they're saved (pick-game-picks-public). The pick chips (flag, ✓/✗
// once scored, "–" for a closed round with no pick, nothing for an open one), a team with no flag (its code), the chip
// label, the note under Save pick, and 10 rounds with a 30-character name at 390 px. The web layer is a fake here.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = 'swiss'; t.swissRounds = 10;
    [['fr', '🇫🇷 France (FRA)'], ['it', '🇮🇹 Italy (ITA)'], ['es', '🇪🇸 Spain (ESP)'], ['th', '🇹🇭 Thailand (THA)'], ['tw', 'Chinese Taipei (TPE)'], ['xx', 'Boulistes']]
      .forEach(([id, name]) => t.teams.push({ id, name, players: ['x'], active: true }));
    const day = 864e5, now = Date.now();
    t.pick = { on: true, rounds: [1, 2, 3, 4].map(n => ({ id: 'p' + n, name: 'Round ' + n, src: 'swiss:' + n })) };
    t.pickClose = { p1: now + day, p2: now + 2 * day, p3: now + 3 * day, p4: now + 4 * day };
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    const perm = S.permFn; S.permFn = x => ({ edit: false, score: false });
    // before any close: Ann and Bob have picked for the open Round 1 (Bob joined later, so he's first)
    S.pickGame = { st: { ready: true, me: null, picks: {}, link: '' }, data: { pickers: { ann: { name: 'Ann', at: 1000 }, bob: { name: 'Bob', at: 2000 } },
      picks: [{ pid: 'ann', round: 'p1', team: 'fr' }, { pid: 'bob', round: 'p1', team: 'it' }] },
      state() { return this.st; }, board() { return this.data; }, async join() {}, async pick() {} };
    C.render(); await w(40); q('[data-tab="pick"]').click(); await w(80);
    r.push('open round chips: ' + qa('.pk-prow').map(el => txt(el.querySelector('.pk-chip [data-notr]')) + ' ' + [...el.querySelectorAll('.pk-pc')].map(c => c.textContent).join(' ')).reverse().join(' | '));
    S.pickGame.data.picks.push({ pid: 'ann', round: 'p2', team: 'tw' }, { pid: 'bob', round: 'p2', team: 'xx' }); C.render(); await w(40);
    r.push('chip no flag: ' + q('.pk-prow:last-child .pk-pc:nth-child(2)')?.textContent + ' | no code either: ' + q('.pk-prow:first-child .pk-pc:nth-child(2)')?.textContent);
    // rounds 1 to 3 closed and played: Ann right in R1, wrong in R2, no pick in R3, a pick for the open R4
    const t2 = JSON.parse(JSON.stringify(C.T())); t2.pickClose = { p1: now - 3 * day, p2: now - 2 * day, p3: now - day, p4: now + day }; S.tournaments[t2.id] = t2;
    const g = (id, round, a, sa, bb, sb) => ({ id, stage: 'swiss', group: 'R' + round, round, order: 0, a: [a], b: [bb], sa, sb, done: true });
    S.matches = Object.fromEntries([g('m1', 1, 'fr', 13, 'it', 4), g('m2', 2, 'it', 6, 'es', 13), g('m3', 3, 'th', 13, 'fr', 2)].map(m => [m.id, m]));
    S.pickGame.data.picks = [{ pid: 'ann', round: 'p1', team: 'fr' }, { pid: 'ann', round: 'p2', team: 'it' }, { pid: 'ann', round: 'p4', team: 'es' }, { pid: 'bob', round: 'p1', team: 'it' }];
    C.render(); await w(60);
    const annRow = q('.pk-table tr[data-pid="ann"]');
    r.push('closed chips: Ann ' + [...annRow.querySelectorAll('.pk-pc')].map(c => c.textContent).join(' '));
    r.push('chip label: ' + annRow.querySelector('.pk-pc').getAttribute('aria-label') + ' | title same ' + (annRow.querySelector('.pk-pc').title === annRow.querySelector('.pk-pc').getAttribute('aria-label')));
    r.push('bob, no pick for R2 and R3: ' + [...q('.pk-table tr[data-pid="bob"]').querySelectorAll('.pk-pc')].map(c => c.textContent).join(' '));
    r.push('place/right/diff kept: ' + [...annRow.cells].filter((c, i) => i !== 1).map(txt).join(' '));
    // the player: the note under Save pick
    S.pickGame.st = { ready: true, me: { pid: 'ann', name: 'Ann' }, picks: { p1: 'fr', p2: 'it', p4: 'es' }, link: 'x' }; C.render(); await w(40);
    r.push('pick note: ' + txt(q('.pk-card[data-round="p4"] .pk-note')));
    // 10 rounds, a 30-character name, 45 players
    const t3 = JSON.parse(JSON.stringify(C.T())); t3.pick.rounds = Array.from({ length: 10 }, (_, i) => ({ id: 'p' + (i + 1), name: 'Round ' + (i + 1), src: 'swiss:' + (i + 1) }));
    t3.pickClose = Object.fromEntries(t3.pick.rounds.map((x, i) => [x.id, i < 6 ? now - (10 - i) * 36e5 : now + (i + 1) * 36e5])); S.tournaments[t3.id] = t3;
    const teams = ['fr', 'it', 'es', 'th', 'tw', 'xx'], pickers = {}, picks = [];
    for (let i = 1; i <= 45; i++) { const pid = 'x' + i; pickers[pid] = { name: i === 7 ? 'Annabelle Christophersen-Smyth' : 'Player ' + i, at: i };
      for (let k = 1; k <= 10; k++) if ((i + k) % 4) picks.push({ pid, round: 'p' + k, team: teams[(i + k) % 6] }); }
    S.pickGame.data = { pickers, picks }; S.pickGame.st = { ready: true, me: { pid: 'x7', name: 'Annabelle Christophersen-Smyth' }, picks: {}, link: 'x' }; C.render(); await w(80);
    r.push(`390 px, 10 rounds, 30-char name: ${document.documentElement.scrollWidth > innerWidth ? 'SIDEWAYS SCROLL' : 'no sideways scroll'} | chips on the long name's row ${q('.pk-table tr[data-pid="x7"]').querySelectorAll('.pk-pc').length}`);
    window.__t3 = t3; return r;
  });
  console.log(out.join('\n'));
  await p.evaluate(() => document.querySelector('.pk-board').scrollIntoView()); await p.screenshot({ path: process.env.OUT + '/pick-public-after-390.png' });
  // before any close, 45 players with picks
  const out2 = await p.evaluate(async () => { const C = window.__carreau, S = C.S, t = JSON.parse(JSON.stringify(C.T()));
    t.pickClose = Object.fromEntries(t.pick.rounds.map((x, i) => [x.id, Date.now() + (i + 1) * 36e5])); S.tournaments[t.id] = t; C.render(); await new Promise(r => setTimeout(r, 80));
    document.querySelector('.pk-board').scrollIntoView();
    return ['390 px before close: ' + (document.documentElement.scrollWidth > innerWidth ? 'SIDEWAYS SCROLL' : 'no sideways scroll') + ' | rows ' + document.querySelectorAll('.pk-prow').length + ' | ' + document.querySelector('.pk-sub').textContent]; });
  console.log(out2.join('\n'));
  await p.screenshot({ path: process.env.OUT + '/pick-public-before-390.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(100);
  await p.evaluate(() => document.querySelector('.pk-board').scrollIntoView()); await p.screenshot({ path: process.env.OUT + '/pick-public-desktop.png' });
  console.log('errs', errs); await b.close();
})();
