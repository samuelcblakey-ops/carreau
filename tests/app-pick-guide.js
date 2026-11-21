// Pick the Winner guide video (pick-game-guide-video): the artifact version has no guide player, so the game page shows
// no "Watch how to play" button there (the website test, web-event-page.js, covers the button and the player).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms));
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.wizard = false;
    ['France (FRA)', 'Italy (ITA)'].forEach((name, i) => t.teams.push({ id: 'e' + i, name, players: ['x'], active: true }));
    t.pick = { on: true, rounds: [{ id: 'p1', name: 'Round 1', src: 'swiss:1' }] }; t.pickClose = { p1: Date.now() + 864e5 };
    await S.store.setTournament(t); S.tournaments[t.id] = t;
    S.pickGame = { state() { return { ready: true, me: null, picks: {}, link: '' }; }, board() { return { pickers: {}, picks: [] }; }, async join() {}, async pick() {} };
    S.tab = 'pick'; C.render(); await w(60);
    return [`pick page shown: ${!!document.querySelector('main .pick-page .pk-how')}`,
      `artifact version: no watch button: ${!document.querySelector('main .pk-watch, main [data-act="guide-play"]') && !S.guideLink}`,
      `390 px: ${document.documentElement.scrollWidth > innerWidth ? 'sideways scroll' : 'no sideways scroll'}`].join('\n');
  });
  console.log(out); console.log('errs ' + JSON.stringify(errs)); await b.close();
})();
