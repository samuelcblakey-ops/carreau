// Taps on things that have gone: another phone removes a team or undoes a draw while this screen still shows it
// (the page waits to redraw while someone is typing). Nothing crashes, nothing is saved, and an open score dialog
// closes with a message instead of saving into nothing.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  const ev = (fn, a) => p.evaluate(fn, a), w = ms => p.waitForTimeout(ms);
  const make = cfg => ev(async cfg => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { checkin: true, wizard: false, seeding: 'entry' }, cfg);
    if (cfg.entry === 'shooting') { t.players = Array.from({ length: 6 }, (_, i) => ({ id: 'p' + i, name: 'Shooter ' + i, active: true, checkedIn: true })); t.teams = []; }
    else t.teams = Array.from({ length: 8 }, (_, i) => ({ id: 'e' + i, name: 'Team ' + 'ABCDEFGH'[i], players: ['a' + i, 'b' + i], active: true, checkedIn: i < 6 }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(60); C.render(); }, cfg);
  // 1. registration: the row is still on screen, the team has gone
  await make({ name: 'Stale rows', system: 'swiss', format: 'doubles' });
  await p.click('[data-tab="entries"]'); await w(100);
  const saves = () => ev(() => window.__saves || 0);
  await ev(() => { const S = window.__carreau.S, set = S.store.setTournament.bind(S.store); window.__saves = 0; S.store.setTournament = t => { window.__saves++; return set(t); }; });
  const gone = id => ev(id => { const t = window.__carreau.T(); t.teams = t.teams.filter(x => x.id !== id); }, id); // as if another phone removed it; this screen hasn't redrawn
  await gone('e7'); await ev(() => document.querySelector('[data-act="checkin"][data-id="e7"]').click()); await w(150);
  console.log('check in a team that has gone: errors ' + errs.length + ' | saved ' + await saves());
  await gone('e6'); await ev(() => document.querySelector('[data-act="toggle-e"][data-id="e6"]').click()); await w(150);
  console.log('withdraw a team that has gone: errors ' + errs.length + ' | saved ' + await saves());
  await gone('e5'); await ev(() => document.querySelector('[data-act="del-e"][data-id="e5"]').click()); await w(150);
  console.log('remove a team that has gone: errors ' + errs.length + ' | saved ' + await saves());
  await ev(() => document.querySelector('[data-act="checkin"][data-id="e0"]').click()); await w(150);
  console.log('a team still there: saved ' + await saves() + ' | checked in ' + await ev(() => window.__carreau.T().teams.find(x => x.id === 'e0').checkedIn));
  // 2. a score dialog whose game has gone (the draw undone on another phone)
  await ev(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const t = JSON.parse(JSON.stringify(C.T()));
    t.teams.forEach(x => { x.checkedIn = true; }); await C.S.store.setTournament(t); C.S.tournaments[t.id] = t; q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(400); });
  const dialogGone = async (label, act) => {
    await ev(() => document.querySelector('main [data-match]').click()); await w(120);
    await ev(() => { const S = window.__carreau.S; delete S.matches[S.modal.id]; });
    await ev(sel => document.querySelector(sel)?.click(), act); await w(150);
    console.log(label + ': errors ' + errs.length + ' | dialog open ' + await ev(() => !!document.querySelector('#modal .modal')) + ' | toast ' + await ev(() => document.querySelector('#toast:not([hidden])')?.textContent.trim()));
    await ev(() => window.__carreau.watchMatches()); await w(200);
  };
  await dialogGone('quick score on a game that has gone', '#modal [data-act="qlose"][data-k="sb"][data-n="5"]');
  await ev(() => document.querySelector('main [data-match]').click()); await w(120); await ev(() => document.querySelector('#modal [data-act="mode"][data-mode="full"]').click()); await w(80);
  await ev(() => { const S = window.__carreau.S; delete S.matches[S.modal.id]; });
  await ev(() => document.querySelector('#modal [data-act="save-live"]').click()); await w(150);
  console.log('save live score on a game that has gone: errors ' + errs.length + ' | dialog open ' + await ev(() => !!document.querySelector('#modal .modal')));
  await ev(() => window.__carreau.watchMatches()); await w(200);
  // 3. precision shooting: the live scorer on a scorecard that has gone
  await make({ name: 'Stale shooting', entry: 'shooting', system: 'knockout', shootFormat: 'ko8', format: 'singles' });
  await ev(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(400); });
  await ev(() => document.querySelector('main [data-shoot]').click()); await w(120);
  console.log('live scorer open: ' + await ev(() => !!document.querySelector('#modal [data-act="shot-pick"]')));
  await ev(() => { const S = window.__carreau.S; delete S.matches[S.modal.id]; });
  await ev(() => document.querySelector('#modal [data-act="shot-pick"]').click()); await w(150);
  console.log('shot on a scorecard that has gone: errors ' + errs.length + ' | dialog open ' + await ev(() => !!document.querySelector('#modal .modal')));
  // 4. French
  await p.click('[data-act="lang-menu"]'); await w(60); await p.click('[data-lang="fr"]'); await w(200);
  await ev(() => window.__carreau.toast("That game isn't in the draw any more.")); await w(80);
  console.log('french: ' + await ev(() => document.querySelector('#toast').textContent.trim()));
  console.log('errs', errs); await b.close();
})();
