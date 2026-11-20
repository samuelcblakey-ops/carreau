// Pick the Winner: who has joined, before the first round closes (pick-game-players-so-far). The count, the chips newest
// first, the viewer's own chip, no picks shown, hidden players (spectator v organiser), 45 players with Show all, and the
// table once a round has closed. The web layer (S.pickGame) and spectator/organiser (S.permFn) are stood in for here.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = 'swiss'; t.swissRounds = 3;
    ['A', 'B', 'C'].forEach(id => t.teams.push({ id, name: 'Italy (ITA)'.replace('Italy', 'Team ' + id), players: ['x'], active: true }));
    const close = Date.now() + 864e5;
    t.pick = { on: true, rounds: [{ id: 'p1', name: 'Round 1', src: 'swiss:1' }, { id: 'p2', name: 'Round 2', src: 'swiss:2' }] }; t.pickClose = { p1: close, p2: close + 864e5 };
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    const perm = S.permFn; let organiser = false; S.permFn = x => organiser ? perm(x) : { edit: false, score: false };
    // joined Ann, then Bob, then Cat (server times as Firestore gives them, and as plain numbers)
    const ts = ms => ({ toMillis: () => ms });
    const pickers = { ann: { name: 'Ann', at: ts(1000) }, bob: { name: 'Bob', at: 2000 }, cat: { name: 'Cat', at: ts(3000) } };
    S.pickGame = { st: { ready: true, me: { pid: 'bob', name: 'Bob' }, picks: { p1: 'A' }, link: 'x' }, data: { pickers, picks: [{ pid: 'bob', round: 'p1', team: 'A' }] },
      state() { return this.st; }, board() { return this.data; }, async join() {}, async pick() {}, async hide(t, pid, h) { this.data.pickers[pid] = { ...this.data.pickers[pid], hidden: h }; } };
    C.render(); await w(40); q('[data-tab="pick"]').click(); await w(80);
    const chips = () => qa('.pk-board .pk-chip').map(el => txt(el.querySelector('[data-notr]')));
    r.push(`before close: ${txt(q('.pk-sub'))} | ${chips().join(', ')}`);
    r.push('before close own chip: ' + txt(q('.pk-chip.pk-you')));
    r.push('first close line: ' + txt(q('.pk-first')));
    r.push('before close picks hidden: ' + (/Team A|Italy/.test(txt(q('.pk-board'))) ? 'SHOWN ' + txt(q('.pk-board')) : 'ok'));
    r.push('spectator chips tappable: ' + qa('.pk-board button.pk-chip').length);
    // the organiser hides Ann: gone (and not counted) for everyone else, faded for the organiser
    organiser = true; C.render(); await w(40);
    q('.pk-chip[data-pid="ann"]').click(); await w(40);
    r.push('organiser chip: ' + txt(q('.pk-det-box')) + ' | chip height ' + Math.round(q('.pk-chip[data-pid="ann"]').getBoundingClientRect().height));
    q('.pk-det-box [data-act="pk-hide"]').click(); await w(60);
    const orgSees = txt(q('.pk-sub')).split(' ')[0] + ' faded ' + !!q('.pk-chip.pk-hidden[data-pid="ann"]');
    organiser = false; C.render(); await w(40);
    r.push(`before close hidden player: spectator ${txt(q('.pk-sub'))}, organiser ${orgSees.split(' ')[0]}`);
    r.push('hidden: organiser sees it faded ' + orgSees.split(' faded ')[1] + ' | spectator chips ' + chips().join(', '));
    S.pickGame.st = { ready: true, me: { pid: 'ann', name: 'Ann' }, picks: {}, link: 'x' }; C.render(); await w(40);
    r.push('hidden player sees own chip: ' + txt(q('.pk-chip.pk-you')));
    // 45 players, some with 30-character names
    const many = {}; for (let i = 1; i <= 45; i++) many['x' + i] = { name: i % 7 === 0 ? ('Christophersen-Smyth Annabelle' + i).slice(0, 30) : 'Player ' + i, at: i * 1000 };
    S.pickGame.data = { pickers: many, picks: [] }; S.pickGame.st = { ready: true, me: { pid: 'x3', name: 'Player 3' }, picks: {}, link: 'x' }; S.pickUi.allChips = false; S.pickUi.who = null; C.render(); await w(60);
    r.push(`before close 45 players: ${qa('.pk-board .pk-chip').length} shown, ${txt(q('[data-act="pk-all"]'))} | newest first ${chips()[0]}`);
    r.push('phone 390: sideways scroll ' + (document.documentElement.scrollWidth > innerWidth));
    return r;
  });
  console.log(out.join('\n'));
  await p.evaluate(() => document.querySelector('.pk-board').scrollIntoView()); await p.screenshot({ path: process.env.OUT + '/pick-players-390.png', fullPage: true });
  const out2 = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], r = [];
    q('[data-act="pk-all"]').click(); await w(60);
    r.push('show all: ' + qa('.pk-board .pk-chip').length + ' | button gone ' + !q('[data-act="pk-all"]') + ' | own chip ' + q('.pk-chip.pk-you')?.textContent.replace(/\s+/g, ' ').trim());
    const t = JSON.parse(JSON.stringify(C.T())); t.pickClose = { p1: Date.now() - 1000, p2: Date.now() + 864e5 }; S.tournaments[t.id] = t; C.render(); await w(60);
    r.push('after first close: ' + (q('.pk-table') && !q('.pk-chips') ? 'table' : 'chips'));
    S.pickGame.data = { pickers: {}, picks: [] }; S.pickGame.st = { ready: true, me: null, picks: {}, link: '' }; C.render(); await w(40);
    r.push('no players: ' + (q('.pk-board > p')?.textContent || ''));
    return r; });
  console.log(out2.join('\n'));
  await p.setViewportSize({ width: 1100, height: 900 });
  await p.evaluate(async () => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); t.pickClose = { p1: Date.now() + 864e5, p2: Date.now() + 2 * 864e5 }; S.tournaments[t.id] = t;
    const many = {}; for (let i = 1; i <= 45; i++) many['x' + i] = { name: i % 7 === 0 ? ('Christophersen-Smyth Annabelle' + i).slice(0, 30) : 'Player ' + i, at: i * 1000 };
    S.pickGame.data = { pickers: many, picks: [] }; S.pickUi.allChips = false; C.render(); await new Promise(r => setTimeout(r, 80)); document.querySelector('.pk-board').scrollIntoView(); });
  await p.screenshot({ path: process.env.OUT + '/pick-players-desktop.png' });
  console.log('errs', errs); await b.close();
})();
