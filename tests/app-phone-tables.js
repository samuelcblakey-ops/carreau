// Phones: standings show one line per team (tap a team to see its players, headings stay pinned) and Pistes is a
// compact grid of tiles (game and live score on each piste) with the games next in line underneath.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], L = [];
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim(); const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    try {
    const make = async (format, n, courts) => { q('[data-act="new-t"]').click(); await w(120); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: format, system: 'swiss', format, checkin: false, wizard: false, swissRounds: 4, seeding: 'entry' });
      t.courts = courts.map((on, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: on }));
      t.teams = Array.from({ length: n }, (_, i) => ({ id: 'e' + i, name: 'Team ' + 'ABCDEFGHIJKLMNOP'[i], players: format === 'singles' ? ['Team ' + 'ABCDEFGHIJKLMNOP'[i]] : ['Ann ' + i, 'Bob ' + i, 'Cy ' + i].slice(0, format === 'doubles' ? 2 : 3), active: true }));
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); await tab('draw'); q('[data-act="first-draw"]').click(); await w(250); };
    const play = async (max) => { let n = 0; for (let k = 0; k < 40 && n < max; k++) { const m = C.MS().filter(m => m.a && m.b && !m.done && !m.bye).sort((x, y) => x.round - y.round || x.order - y.order)[0]; if (!m) break;
      const lo = +m.a[0].slice(1) < +m.b[0].slice(1); await C.recordResult(m.id, lo ? 13 : 5, lo ? 5 : 13, true); n++; await w(20); } };
    // triples, 16 teams, pistes 1-5 in use and 6 not: round 3 has 5 games on pistes and 3 waiting
    await make('triples', 16, [true, true, true, true, true, false]);
    await play(8); await tab('draw'); q('[data-act="next-round"]').click(); await w(250); await play(8); await tab('draw'); q('[data-act="next-round"]').click(); await w(250);
    const liveG = C.MS().filter(m => m.round === 3 && m.court && !m.done).sort((x, y) => x.order - y.order)[0]; await C.recordResult(liveG.id, 9, 6, false); await w(80);
    // 1. Pistes
    await tab('courts');
    const tiles = qa('.pgrid .ptile');
    L.push('pistes: tiles ' + tiles.length + ' | playing ' + qa('.pgrid .ptile:not(.free)').length + ' | free ' + qa('.pgrid .ptile.free').length + ' | columns ' + getComputedStyle(q('.pgrid')).gridTemplateColumns.split(' ').length + ' | ' + txt(q('main p.small')));
    const lt = tiles.find(x => x.dataset.match === liveG.id);
    L.push('live tile: ' + txt(lt) + ' | button ' + (lt?.tagName === 'BUTTON'));
    L.push('next up: ' + qa('.rlist .nxrow').length + ' | first ' + txt(q('.rlist .nxrow')) + ' | header ' + txt(q('main .spread .small')));
    L.push('page height ' + document.documentElement.scrollHeight + ' | overflow ' + (document.documentElement.scrollWidth > innerWidth + 1));
    lt.click(); await w(80); L.push('tile opens the score: ' + !!q('#modal .modal')); q('#modal .scrim').click(); await w(60); L.push('closed: ' + !q('#modal .modal'));
    // a player who has picked their team: its tile stands out
    localStorage.setItem('carreau-me-' + C.T().id, liveG.a[0]); C.render(); await w(40);
    L.push('my tile: ' + qa('.pgrid .ptile.me').map(x => x.dataset.match === liveG.id).join(',')); localStorage.removeItem('carreau-me-' + C.T().id); C.render(); await w(40);
    // 2. Standings: one line per team, tap for players
    await tab('standings');
    const rows = qa('main .tw.st tbody tr'); const r0 = rows[0];
    L.push('standings: rows ' + rows.length + ' | tappable ' + qa('main .tw.st tr[data-st]').length + ' | players shown ' + rows.filter(r => getComputedStyle(r.querySelector('.st-sub')).display !== 'none').length + ' | row height ' + Math.round(r0.getBoundingClientRect().height) + ' | hint ' + txt(q('.st-hint')));
    r0.click(); await w(40);
    L.push('tap: open ' + r0.classList.contains('open') + ' | players ' + txt(r0.querySelector('.st-sub')) + ' | shown ' + (getComputedStyle(r0.querySelector('.st-sub')).display !== 'none') + ' | expanded ' + r0.querySelector('.st-name').getAttribute('aria-expanded'));
    C.render(); await w(40); const r0b = q('main .tw.st tbody tr');
    L.push('kept after render: ' + r0b.classList.contains('open'));
    r0b.querySelector('.st-name').click(); await w(40); L.push('tap again: open ' + q('main .tw.st tbody tr').classList.contains('open'));
    // pinned headings
    const th = q('main .tw.st thead th'); window.scrollTo(0, 400); await w(60);
    L.push('heading pinned: ' + getComputedStyle(th).position + ' top ' + Math.round(th.getBoundingClientRect().top)); window.scrollTo(0, 0);
    // all columns: players back under every team, no hint
    q('[data-act="st-cols"]').click(); await w(60);
    L.push('all columns: players shown ' + qa('main .tw.st tbody tr').filter(r => getComputedStyle(r.querySelector('.st-sub')).display !== 'none').length + ' | hint ' + !!q('.st-hint'));
    q('[data-act="st-cols"]').click(); await w(60);
    // 3. singles: nothing to open
    await make('singles', 8, [true, true, true, true, true, true]); await tab('courts');
    L.push('free pistes: ' + txt(q('.pfree')) + ' | tiles ' + qa('.pgrid .ptile.free').length + ' | playing ' + qa('.pgrid .ptile:not(.free)').length + ' | next up ' + txt(q('main section .empty')));
    await play(4); await tab('standings');
    L.push('singles: tappable ' + qa('main .tw.st tr[data-st]').length + ' | hint ' + !!q('.st-hint'));
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n'));
  // 4. desktop: players under every team as before, several tiles per row
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(150);
  await p.evaluate(async () => { const q = s => document.querySelector(s); const ids = Object.keys(window.__carreau.S.tournaments); const t = Object.values(window.__carreau.S.tournaments).find(t => t.format === 'triples');
    q('[data-act="picker"]').click(); await new Promise(r => setTimeout(r, 60)); q(`[data-act="pick-t"][data-id="${t.id}"]`).click(); await new Promise(r => setTimeout(r, 200)); q('[data-tab="standings"]').click(); await new Promise(r => setTimeout(r, 80)); });
  console.log('desktop: players shown ' + await p.evaluate(() => [...document.querySelectorAll('main .tw.st tbody tr')].filter(r => getComputedStyle(r.querySelector('.st-sub')).display !== 'none').length) + ' | hint ' + await p.evaluate(() => !!document.querySelector('.st-hint') && getComputedStyle(document.querySelector('.st-more')).display !== 'none'));
  await p.click('[data-tab="courts"]'); await p.waitForTimeout(100);
  console.log('desktop pistes: columns ' + await p.evaluate(() => getComputedStyle(document.querySelector('.pgrid')).gridTemplateColumns.split(' ').length));
  // 5. French
  await p.click('[data-act="lang-menu"]'); await p.waitForTimeout(60); await p.click('[data-lang="fr"]'); await p.waitForTimeout(150);
  console.log('french: ' + await p.evaluate(() => [document.querySelector('main section h3')?.textContent, document.querySelector('main p.small span')?.textContent].join(' | ')));
  await p.click('[data-tab="standings"]'); await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(150);
  console.log('french hint: ' + await p.evaluate(() => document.querySelector('.st-hint')?.textContent));
  console.log('errs', errs); await b.close();
})();
