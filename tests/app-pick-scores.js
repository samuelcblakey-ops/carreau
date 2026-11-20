// Pick the Winner leaderboard (pick-game-leaderboard): scores from the games and the picks (right picks, then points
// difference, shared places), a wrong pick's diff, a repeated team, a bye, a corrected result, and the tab: the board, the
// viewer's own row, a player's closed picks (open rounds left out), the organiser's hide, the player's own result lines,
// the empty states, and the board at 390 px with 30-character names. The web layer (S.pickGame) is a fake here.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = 'swiss'; t.swissRounds = 3; t.format = 'triples';
    ['A', 'B', 'C', 'D'].forEach(id => t.teams.push({ id, name: 'Team ' + id, players: ['x'], active: true }));
    const past = Date.now() - 864e5;
    t.pick = { on: true, rounds: [{ id: 'p1', name: 'Round 1', src: 'swiss:1' }, { id: 'p2', name: 'Round 2', src: 'swiss:2' }, { id: 'p3', name: 'Round 3', src: 'swiss:3' }] };
    t.pickClose = { p1: past, p2: past + 36e5, p3: Date.now() + 864e5 };
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    const g = (id, round, a, sa, b, sb) => ({ id, stage: 'swiss', group: 'R' + round, round, order: 0, a: [a], b: [b], sa, sb, done: true });
    const ms = [g('m1', 1, 'A', 13, 'B', 5), g('m2', 1, 'C', 13, 'D', 11), g('m3', 2, 'A', 13, 'C', 9), g('m4', 2, 'B', 13, 'D', 2)];
    const pickers = { ann: { name: 'Ann' }, bob: { name: 'Bob' }, fay: { name: 'Fay' }, cat: { name: 'Cat' }, dan: { name: 'Dan' }, eve: { name: 'Eve' } };
    const P = { ann: ['A', 'B'], bob: ['C', 'A'], fay: ['C', 'A'], cat: ['B', 'A'], dan: ['D', 'C'], eve: ['A', 'A'] };
    const picks = Object.entries(P).flatMap(([pid, [x, y]]) => [{ pid, round: 'p1', team: x }, { pid, round: 'p2', team: y }]);
    picks.push({ pid: 'ann', round: 'p3', team: 'C' }); // an open round: never scored, never shown to others
    const sgn = n => n > 0 ? '+' + n : String(n);
    const line = rows => rows.map(x => `${x.name} ${x.right} ${sgn(x.diff)}`).join(', ');
    const rows = C.pickScores(C.T(), ms, pickers, picks);
    r.push('scores: ' + line(rows));
    r.push('places: ' + rows.map(x => `${x.place} ${x.name}`).join(', '));
    const cat = rows.find(x => x.pid === 'cat').list.find(l => l.round.id === 'p1'); r.push(`wrong pick diff: Cat round 1 ${cat.diff}${cat.st === 'wrong' ? '' : ' (' + cat.st + ')'}`);
    const eve = rows.find(x => x.pid === 'eve').list.find(l => l.round.id === 'p2'); r.push(`repeat team: Eve round 2 counts ${eve.diff}${eve.st === 'repeat' ? '' : ' (' + eve.st + ')'}`);
    // a bye: team E sits out round 1
    const t5 = JSON.parse(JSON.stringify(C.T())); t5.teams.push({ id: 'E', name: 'Team E', players: ['x'], active: true });
    const bye = { id: 'by', stage: 'swiss', group: 'R1', round: 1, order: 9, a: ['E'], b: null, bye: true, done: true, sa: 13, sb: 7 };
    const br = C.pickScores(t5, [...ms, bye], { zed: { name: 'Zed' } }, [{ pid: 'zed', round: 'p1', team: 'E' }])[0];
    r.push(`bye pick: ${br.right} right ${br.diff} diff`);
    // the tab, with the fake web layer: the viewer is Ann
    S.matches = Object.fromEntries(ms.map(m => [m.id, m]));
    const st = { ready: true, me: { pid: 'ann', name: 'Ann' }, picks: { p1: 'A', p2: 'B', p3: 'C' }, link: 'x' };
    S.pickGame = { st, hidden: [],
      state() { return this.st; }, board(t) { return this.boardData; }, async join() {}, async pick() {}, async hide(t, pid, h) { this.boardData.pickers[pid] = { ...this.boardData.pickers[pid], hidden: h }; this.hidden.push(pid + ':' + h); } };
    S.pickGame.boardData = { pickers: JSON.parse(JSON.stringify(pickers)), picks: picks.filter(x => x.pid !== 'ann' || x.round !== 'p3') };
    C.render(); await w(40); q('[data-tab="pick"]').click(); await w(80);
    r.push('board: ' + txt(q('.pk-board h3')) + ' | ' + txt(q('.pk-board h3 + p')) + ' | columns ' + qa('.pk-table th').map(txt).join(','));
    r.push('board rows: ' + qa('.pk-table tbody tr:not(.pk-det)').map(tr => [...tr.cells].map(txt).join(' ')).join(' / '));
    r.push('own row: ' + txt(q('.pk-table tr.pk-you')));
    r.push('own cards: ' + qa('.pk-card .pk-res').map(txt).join(' | '));
    // Bob's closed picks; Ann sees her own row's picks without round 3 too
    q('[data-act="pk-who"][data-pid="bob"]').click(); await w(60);
    r.push('bob picks: ' + qa('.pk-det .pk-line').map(txt).join(' | '));
    S.pickGame.st = { ...st, me: { pid: 'bob', name: 'Bob' }, picks: { p1: 'C', p2: 'A' } };
    S.pickUi.who = 'ann'; C.render(); await w(60);
    const annLines = qa('.pk-det .pk-line').map(txt);
    r.push('open round not shown: ' + (annLines.length === 2 && !annLines.some(l => l.includes('Round 3')) ? 'ok' : annLines.join(' | ')));
    // a corrected result: round 1 becomes B 13–12 A
    S.matches.m1 = { ...S.matches.m1, sa: 12, sb: 13 };
    const rows2 = C.pickScores(C.T(), Object.values(S.matches), pickers, picks);
    const f = id => rows2.find(x => x.pid === id);
    r.push(`corrected result updates: Ann ${f('ann').right} ${sgn(f('ann').diff)}, Eve ${f('eve').right} ${sgn(f('eve').diff)}`);
    C.render(); await w(60);
    r.push('board after correction: ' + txt(q('.pk-table tbody tr')));
    return r;
  });
  console.log(out.join('\n'));
  // the organiser hides a name (the local app is an organiser of its own competitions)
  const out2 = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    S.pickGame.st = { ready: true, me: null, picks: {}, link: '' }; S.pickUi.who = 'dan'; C.render(); await w(60);
    q('[data-act="pk-hide"][data-pid="dan"]').click(); await w(80);
    r.push('organiser hides: ' + S.pickGame.hidden.join(',') + ' | row still shown to organiser ' + !!q('tr.pk-hidden[data-pid="dan"]') + ' | button ' + txt(q('[data-act="pk-hide"][data-pid="dan"]')));
    // long names at 390 px
    const L = S.pickGame.boardData.pickers; L.ann.name = 'Annabelle Christophersen-Smyth'; L.bob.name = 'Wwwwwwwwwwwwwwwwwwwwwwwwwwwwww'; S.pickUi.who = null; C.render(); await w(60);
    r.push('board 390: sideways scroll ' + (document.documentElement.scrollWidth > innerWidth) + ' | name buttons under 44 ' + qa('.pk-who').filter(el => el.getBoundingClientRect().height < 44).length);
    // the empty states
    S.pickGame.boardData = { pickers: {}, picks: [] }; C.render(); await w(40);
    r.push('no players: ' + txt(q('.pk-board > p')));
    const t = JSON.parse(JSON.stringify(C.T())); t.pickClose = { p1: Date.now() + 1e6, p2: Date.now() + 2e6, p3: Date.now() + 3e6 }; S.tournaments[t.id] = t;
    S.pickGame.boardData = { pickers: { ann: { name: 'Ann' } }, picks: [] }; C.render(); await w(40);
    r.push('before close: ' + txt(q('.pk-board > p')));
    return r;
  });
  console.log(out2.join('\n'));
  await p.evaluate(async () => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); t.pickClose = { p1: Date.now() - 864e5, p2: Date.now() - 8e7, p3: Date.now() + 864e5 }; S.tournaments[t.id] = t;
    S.pickGame.boardData = { pickers: { ann: { name: 'Annabelle Christophersen-Smyth' }, bob: { name: 'Wwwwwwwwwwwwwwwwwwwwwwwwwwwwww' }, cat: { name: 'Cat' } }, picks: [{ pid: 'ann', round: 'p1', team: 'A' }, { pid: 'bob', round: 'p1', team: 'B' }, { pid: 'cat', round: 'p1', team: 'C' }] };
    S.pickGame.st = { ready: true, me: { pid: 'ann', name: 'Annabelle Christophersen-Smyth' }, picks: { p1: 'A' }, link: 'x' }; S.pickUi.who = 'bob'; C.render(); await new Promise(r => setTimeout(r, 80)); document.querySelector('.pk-board').scrollIntoView(); });
  await p.screenshot({ path: process.env.OUT + '/pick-board-390.png', fullPage: true });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(150);
  await p.screenshot({ path: process.env.OUT + '/pick-board-desktop.png', fullPage: true });
  // pick-game-own-competition: the invitation under the leaderboard (stands in for the website's "runs this competition")
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(100);
  const cta = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), r = [];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    S.isMine = () => true; C.render(); await w(50);
    r.push('pick cta organiser: ' + (q('.pk-cta') ? 'shown' : 'hidden'));
    S.isMine = () => false; C.render(); await w(50);
    const box = q('.pk-cta'); box.scrollIntoView();
    const btn = box.querySelector('[data-act="new-t"]'), link = box.querySelector('a');
    r.push('pick cta spectator: ' + txt(box.querySelector('h3')) + ' | ' + txt(box.querySelector('p')) + ' | button ' + txt(btn) + ' ' + Math.round(btn.getBoundingClientRect().height) + 'px | link ' + txt(link) + ' ' + link.getAttribute('href'));
    r.push('pick cta below the leaderboard: ' + !!(q('.pk-board').compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING));
    return r; });
  await p.screenshot({ path: process.env.OUT + '/pick-cta-390.png' });
  const before = await p.evaluate(() => Object.keys(window.__carreau.S.tournaments).length);
  await p.click('.pk-cta [data-act="new-t"]'); await p.waitForTimeout(300);
  cta.push('pick cta opens quick setup: ' + await p.evaluate(() => (document.querySelector('.wiz')?.textContent || document.querySelector('#main')?.textContent || '').match(/step \d of \d/)?.[0]) + ' | new competition ' + (await p.evaluate(() => Object.keys(window.__carreau.S.tournaments).length) === before + 1) + ' | tab ' + await p.evaluate(() => window.__carreau.S.tab));
  console.log(cta.join('\n'));
  console.log('errs', errs); await b.close();
})();
