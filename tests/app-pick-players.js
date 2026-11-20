// Pick the Winner: the leaderboard table from the first join (pick-game-table-always, which replaced the players-so-far
// chips). Before the first close: "{n} players so far", when places start, Place "–", 0 / 0, alphabetical; the stage strip
// (R1 … F) and each player's fixed strip of pick slots; hidden players (spectator v organiser); 45 players with Show all;
// places once a round has closed. The web layer (S.pickGame) and spectator/organiser (S.permFn) are stood in for here.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = 'swiss'; t.swissRounds = 5;
    [['fr', '🇫🇷 France (FRA)'], ['it', '🇮🇹 Italy (ITA)'], ['es', '🇪🇸 Spain (ESP)'], ['tw', 'Chinese Taipei (TPE)']].forEach(([id, name]) => t.teams.push({ id, name, players: ['x'], active: true }));
    const now = Date.now(), h = 36e5;
    const names = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Cadrage', 'Last 16', 'Quarter-finals', 'Semi-finals', 'Final'];
    t.pick = { on: true, rounds: names.map((name, i) => ({ id: 'p' + (i + 1), name, src: i < 5 ? 'swiss:' + (i + 1) : 'ko:A:' + (i - 4) })) };
    t.pickClose = Object.fromEntries(t.pick.rounds.map((x, i) => [x.id, now + (i + 1) * h]));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    const perm = S.permFn; let organiser = false; S.permFn = x => organiser ? perm(x) : { edit: false, score: false };
    const ts = ms => ({ toMillis: () => ms });
    const pickers = { ann: { name: 'Ann', at: ts(1000) }, bob: { name: 'Bob', at: 2000 }, cat: { name: 'Cat', at: ts(3000) } };
    // Bob skipped round 2 and picked round 3
    S.pickGame = { st: { ready: true, me: { pid: 'bob', name: 'Bob' }, picks: { p1: 'it', p3: 'tw' }, link: 'x' },
      data: { pickers, picks: [{ pid: 'ann', round: 'p1', team: 'fr' }, { pid: 'bob', round: 'p1', team: 'it' }, { pid: 'bob', round: 'p3', team: 'tw' }] },
      state() { return this.st; }, board() { return this.data; }, async join() {}, async pick() {}, async hide(t, pid, h) { this.data.pickers[pid] = { ...this.data.pickers[pid], hidden: h }; } };
    C.render(); await w(40); q('[data-tab="pick"]').click(); await w(80);
    const rows = () => qa('.pk-table tr.pk-main').map(tr => { const c = [...tr.cells].map(txt); return `${tr.querySelector('.pk-who [data-notr]').textContent} ${c[0]} ${c[2]} ${c[3]}`; });
    r.push(`before close: ${q('.pk-table') ? 'table' : 'no table'} | ${txt(q('.pk-sub'))} | ${rows().join(', ')}`);
    r.push('first close line: ' + txt(q('.pk-first')));
    const strip = pid => [...q(`.pk-strip-row[data-pid="${pid}"]`).querySelectorAll('.pk-slot')];
    r.push('before close flags under names: Ann ' + strip('ann').map(s => s.textContent).filter(x => x !== '·').join(' '));
    r.push('before close no chips: ' + !q('.pk-chip, .pk-plist, .pk-pc'));
    r.push('own row: ' + txt(q('tr.pk-main.pk-you .pk-who')));
    r.push('stage header: ' + qa('.pk-stages .pk-slot').map(s => s.textContent).join(' ') + ' | titles ' + qa('.pk-stages .pk-slot').map(s => s.title).slice(5, 8).join(','));
    const bob = strip('bob');
    r.push(`slots fixed: Bob skipped R2 -> R3 flag in slot ${bob.findIndex(s => s.textContent === 'TPE') + 1} | slot 2 empty ${bob[1].classList.contains('pk-empty')} | slots per row ${qa('.pk-strip-row').map(x => x.querySelectorAll('.pk-slot').length).join(',')}`);
    r.push('slot label: ' + bob[2].getAttribute('aria-label') + ' | title same ' + (bob[2].title === bob[2].getAttribute('aria-label')));
    // columns line up: each row's slot 3 sits under the stage header's slot 3
    const x3 = el => Math.round(el.getBoundingClientRect().left);
    r.push('slots line up: ' + (new Set([x3(qa('.pk-stages .pk-slot')[2]), x3(strip('ann')[2]), x3(bob[2]), x3(strip('cat')[2])]).size === 1));
    const tw = q('.pk-board .tw');
    r.push('390 px, 10 slots: ' + (document.documentElement.scrollWidth > innerWidth || tw.scrollWidth > tw.clientWidth ? 'SIDEWAYS SCROLL' : 'no sideways scroll'));
    // the detail on tap: every saved pick, open rounds included
    q('.pk-who[data-pid="bob"]').click(); await w(40);
    r.push('detail before close: ' + qa('.pk-det .pk-line').map(txt).join(' | '));
    // hidden players: gone (and not counted) for everyone else, faded for the organiser
    organiser = true; S.pickUi.who = 'ann'; C.render(); await w(40);
    q('.pk-det [data-act="pk-hide"]').click(); await w(60);
    const orgN = txt(q('.pk-sub')).split(' ')[0], faded = !!q('tr.pk-main.pk-hidden[data-pid="ann"]');
    organiser = false; C.render(); await w(40);
    r.push(`before close hidden player: spectator ${txt(q('.pk-sub'))}, organiser ${orgN} | faded for organiser ${faded} | spectator rows ${rows().map(x => x.split(' ')[0]).join(',')}`);
    // 45 players, one with a 30-character name
    const many = {}, picks = []; for (let i = 1; i <= 45; i++) { many['x' + i] = { name: i === 7 ? 'Annabelle Christophersen-Smyth' : 'Player ' + String(i).padStart(2, '0'), at: i };
      for (let k = 1; k <= 10; k++) if ((i + k) % 3) picks.push({ pid: 'x' + i, round: 'p' + k, team: ['fr', 'it', 'es', 'tw'][(i + k) % 4] }); }
    S.pickGame.data = { pickers: many, picks }; S.pickGame.st = { ready: true, me: { pid: 'x7', name: 'Annabelle Christophersen-Smyth' }, picks: {}, link: 'x' }; S.pickUi.allChips = false; S.pickUi.who = null; C.render(); await w(60);
    r.push(`45 players: ${qa('.pk-table tr.pk-main').length} rows, ${txt(q('[data-act="pk-all"]'))} | 390 px ${document.documentElement.scrollWidth > innerWidth || q('.pk-board .tw').scrollWidth > q('.pk-board .tw').clientWidth ? 'SIDEWAYS SCROLL' : 'no sideways scroll'}`);
    return r;
  });
  console.log(out.join('\n'));
  await p.evaluate(() => document.querySelector('.pk-board').scrollIntoView()); await p.screenshot({ path: process.env.OUT + '/pick-table-before-390.png' });
  const out2 = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], r = [];
    q('[data-act="pk-all"]').click(); await w(60);
    r.push('show all: ' + qa('.pk-table tr.pk-main').length + ' | button gone ' + !q('[data-act="pk-all"]'));
    const t = JSON.parse(JSON.stringify(C.T())); t.pickClose.p1 = Date.now() - 1000; S.tournaments[t.id] = t;
    S.matches = { m1: { id: 'm1', stage: 'swiss', group: 'R1', round: 1, order: 0, a: ['fr'], b: ['it'], sa: 13, sb: 6, done: true } }; C.render(); await w(60);
    const places = qa('.pk-table tr.pk-main td:first-child').map(td => td.textContent);
    r.push('after first close: ' + (places.every(x => /^=?\d+$/.test(x)) ? 'places shown' : 'places ' + places.slice(0, 3).join(',')) + ' | ' + q('.pk-sub').textContent + ' | first close line gone ' + !q('.pk-first'));
    r.push('ticks after close: ' + qa('.pk-slot.ok i, .pk-slot.no i').length + ' | 390 px ' + (document.documentElement.scrollWidth > innerWidth || q('.pk-board .tw').scrollWidth > q('.pk-board .tw').clientWidth ? 'SIDEWAYS SCROLL' : 'no sideways scroll'));
    S.pickGame.data = { pickers: {}, picks: [] }; S.pickGame.st = { ready: true, me: null, picks: {}, link: '' }; C.render(); await w(40);
    r.push('no players: ' + (q('.pk-board > p')?.textContent || ''));
    return r; });
  console.log(out2.join('\n'));
  await p.evaluate(async () => { const C = window.__carreau, S = C.S; const many = {}, picks = []; for (let i = 1; i <= 12; i++) { many['x' + i] = { name: i === 3 ? 'Annabelle Christophersen-Smyth' : 'Player ' + i, at: i };
      for (let k = 1; k <= 10; k++) if ((i + k) % 3) picks.push({ pid: 'x' + i, round: 'p' + k, team: ['fr', 'it', 'es', 'tw'][(i + k) % 4] }); }
    S.pickGame.data = { pickers: many, picks }; S.pickGame.st = { ready: true, me: { pid: 'x3', name: 'Annabelle Christophersen-Smyth' }, picks: {}, link: 'x' }; C.render(); await new Promise(r => setTimeout(r, 80)); document.querySelector('.pk-board').scrollIntoView(); });
  await p.screenshot({ path: process.env.OUT + '/pick-table-after-390.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(100);
  await p.evaluate(() => document.querySelector('.pk-board').scrollIntoView()); await p.screenshot({ path: process.env.OUT + '/pick-table-desktop.png' });
  console.log('errs', errs); await b.close();
})();
