// Phones: a knockout shows one round at a time (chips for each round, the third-place game and the whole bracket),
// opening on the round being played. Laptops keep the bracket.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  const ev = fn => p.evaluate(fn);
  const state = () => ev(() => { const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    return 'chips ' + qa('.bk-bar .rchip').map(c => c.textContent.trim() + (c.getAttribute('aria-pressed') === 'true' ? '*' : '') + (c.classList.contains('now') ? '^' : '') + (c.classList.contains('done') ? '.' : '')).join(',')
      + ' | heading ' + txt(q('.bk-list h4')) + ' | games ' + qa('.bk-list .bk-li').length + ' | labels ' + qa('.bk-list .bk-no').map(txt).join(',') + ' | grid ' + !!q('.bk[data-bk]'); });
  await ev(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'KO', system: 'knockout', format: 'doubles', checkin: false, wizard: false, koThird: true, seeding: 'entry' });
    t.courts = Array.from({ length: 8 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
    t.teams = Array.from({ length: 16 }, (_, i) => ({ id: 'e' + i, name: 'Team ' + 'ABCDEFGHIJKLMNOP'[i], players: ['a' + i, 'b' + i], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(60);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(400);
    window.__play = async max => { let n = 0; for (let k = 0; k < 40 && n < max; k++) { const m = C.MS().filter(m => m.a && m.b && !m.done && !m.bye).sort((x, y) => x.round - y.round || x.order - y.order)[0]; if (!m) break;
      const lo = +m.a[0].slice(1) < +m.b[0].slice(1); await C.recordResult(m.id, lo ? 13 : 6, lo ? 6 : 13, true); n++; await w(20); } C.render(); await w(60); };
    await window.__play(10); });
  // 1. opens on the quarter-finals (two played, two to go)
  console.log('phone: ' + await state());
  // 2. look at the semi-finals; the choice stays while the quarter-finals are still going
  await p.click('.bk-bar .rchip[data-v="3"]'); await p.waitForTimeout(100);
  console.log('semis picked: ' + await state());
  await ev(() => window.__play(1)); console.log('still semis: ' + await state());
  // 3. quarter-finals finished: back on the round being played
  await ev(() => window.__play(1)); console.log('moves on: ' + await state());
  // 4. a game opens the score sheet
  await p.click('.bk-list .bk-li button.bkm'); await p.waitForTimeout(100);
  console.log('game opens the score: ' + await ev(() => !!document.querySelector('#modal .modal')));
  await p.click('#modal .scrim', { position: { x: 5, y: 5 } }); await p.waitForTimeout(100);
  // 5. third place and the whole bracket
  await p.click('.bk-bar .rchip[data-v="third"]'); await p.waitForTimeout(100); console.log('third place: ' + await state());
  await p.click('.bk-bar .rchip[data-v="grid"]'); await p.waitForTimeout(150); console.log('whole bracket: ' + await state() + ' | zoom tools ' + await ev(() => !!document.querySelector('.bk-tools [data-act="bk-zoom"]')));
  console.log('phone overflow: ' + await ev(() => document.documentElement.scrollWidth > innerWidth + 1));
  // 6. laptop: the bracket as before; back to a phone: the rounds again
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(250);
  console.log('laptop: chips ' + await ev(() => document.querySelectorAll('.bk-bar').length) + ' | grid ' + await ev(() => !!document.querySelector('.bk[data-bk]')));
  await p.click('[data-tab="draw"]'); await ev(() => { window.__carreau.S.bkRound = {}; window.__carreau.render(); });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
  console.log('phone again: ' + await state());
  // 7. French
  await p.click('[data-act="lang-menu"]'); await p.waitForTimeout(60); await p.click('[data-lang="fr"]'); await p.waitForTimeout(150);
  console.log('french: ' + await state());
  console.log('errs', errs); await b.close();
})();
