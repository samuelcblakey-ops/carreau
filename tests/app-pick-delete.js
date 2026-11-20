// Pick the Winner: the admin deletes a player (pick-game-admin-delete). Delete player for the admin only (not other
// organisers), on the tapped table row's detail, its confirm, Keep, the player gone from the count and the table, and the deleted player's
// own device back at the join form. The web layer (S.pickGame, whose deletePicker and pickdev listener are stood in for here)
// and the rules are in web-pick-rules.js.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = 'swiss'; t.swissRounds = 2;
    ['A', 'B'].forEach(id => t.teams.push({ id, name: 'Team ' + id, players: ['x'], active: true }));
    t.pick = { on: true, rounds: [{ id: 'p1', name: 'Round 1', src: 'swiss:1' }, { id: 'p2', name: 'Round 2', src: 'swiss:2' }] };
    t.pickClose = { p1: Date.now() + 864e5, p2: Date.now() + 2 * 864e5 };
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    let admin = true; const deleted = [];
    const pickers = { ann: { name: 'Ann', at: 1 }, bob: { name: 'Bob', at: 2 }, t1: { name: 'Teat', at: 3 }, t2: { name: 'Teat', at: 4 }, cat: { name: 'Cat', at: 5 }, dan: { name: 'Dan', at: 6 } };
    S.pickGame = { st: { ready: true, me: null, picks: {}, link: '' }, data: { pickers, picks: [{ pid: 't1', round: 'p1', team: 'A' }, { pid: 'ann', round: 'p1', team: 'B' }] },
      state() { return this.st; }, board() { return this.data; }, canDelete: () => admin, async join() {}, async pick() {}, async hide() {},
      async deletePicker(t, pid) { deleted.push(pid); delete this.data.pickers[pid]; this.data.picks = this.data.picks.filter(x => x.pid !== pid); } };
    C.render(); await w(40); q('[data-tab="pick"]').click(); await w(80);
    r.push('before: ' + txt(q('.pk-sub')));
    q('.pk-who[data-pid="t1"]').click(); await w(40);
    r.push('admin sees Delete player: ' + !!q('[data-act="pk-del"][data-pid="t1"]') + ' | next to ' + txt(q('[data-act="pk-hide"][data-pid="t1"]')));
    admin = false; C.render(); await w(40);
    r.push('organiser sees Delete player: ' + !!q('[data-act="pk-del"]') + ' | hide still ' + !!q('[data-act="pk-hide"][data-pid="t1"]'));
    admin = true; C.render(); await w(40);
    q('[data-act="pk-del"][data-pid="t1"]').click(); await w(40);
    const tw = q('.pk-board .tw'); r.push('confirm fits 390: ' + (tw.scrollWidth <= tw.clientWidth && document.documentElement.scrollWidth <= innerWidth));
    r.push('confirm text: ' + txt(q('.pk-del-ask .err')) + ' | buttons ' + [...document.querySelectorAll('.pk-del-ask button')].map(txt).join(','));
    q('[data-act="pk-del-no"]').click(); await w(40);
    r.push('keep: deleted ' + deleted.length + ' | confirm gone ' + !q('.pk-del-ask'));
    q('[data-act="pk-del"][data-pid="t1"]').click(); await w(40); q('[data-act="pk-del-yes"]').click(); await w(80);
    r.push('after delete: ' + txt(q('.pk-sub')) + ' | deleted ' + deleted.join(',') + ' | row gone ' + !q('tr.pk-main[data-pid="t1"]'));
    // after the first close: the same, in the table with places
    const t2 = JSON.parse(JSON.stringify(C.T())); t2.pickClose = { p1: Date.now() - 1000, p2: Date.now() + 864e5 }; S.tournaments[t2.id] = t2; S.pickUi.who = 't2'; C.render(); await w(60);
    r.push('table: Delete player in the detail ' + !!q('.pk-det [data-act="pk-del"][data-pid="t2"]'));
    q('.pk-det [data-act="pk-del"]').click(); await w(30); q('[data-act="pk-del-yes"]').click(); await w(60);
    r.push('table after delete: rows ' + qa('.pk-table tbody tr.pk-main[data-pid]').length + ' | t2 gone ' + !q('tr[data-pid="t2"]'));
    // the deleted player's own phone: its pickdev doc goes, so the web layer reports no player and the join form is back
    S.pickGame.st = { ready: true, me: { pid: 'dan', name: 'Dan' }, picks: {}, link: 'x' }; C.render(); await w(40);
    const before = !!q('.pk-me');
    S.pickGame.st = { ready: true, me: null, picks: {}, link: '' }; C.render(); await w(40);
    r.push("deleted player's device: " + (before && q('#pk-you') && !q('.pk-me') ? 'join form shown' : 'not shown'));
    return r;
  });
  console.log(out.join('\n'));
  await p.screenshot({ path: process.env.OUT + '/pick-delete-390.png', fullPage: true });
  console.log('errs', errs); await b.close();
})();
