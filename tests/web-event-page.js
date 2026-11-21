// Event pages (event-page): snpetanque.com/worlds2026 on the built site, with the three competitions in the emulators.
// Its own header and tabs, Pick the Winner first, the results tabs read-only even for their organiser, the way back to
// the main site, private links that point at the event page, the preview tags, and the assets loading from /worlds2026/.
const { chromium } = require('playwright'), http = require('http');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL; const OUT = process.env.OUT;
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const mk = async (n, vw = 1100, sw = false) => { const c = await b.newContext({ viewport: { width: vw, height: vw < 500 ? 844 : 900 } });
    await c.addInitScript(sw => { window.__CARREAU_EMULATOR = true; if (sw) window.__CARREAU_TEST_SW = true; }, sw);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const get = u => new Promise(res => http.get(u, r => { let d = ''; r.on('data', x => d += x); r.on('end', () => res({ status: r.statusCode, body: d, location: r.headers.location })); }));

  // the organiser makes the three competitions with the event's ids: Triples with Pick the Winner, Nations Cup, Shooting
  const A = await mk('organiser'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  await A.evaluate(async () => { const C = window.__carreau, S = C.S, made = C.T();
    const comp = (id, name) => { const t = JSON.parse(JSON.stringify(made)); Object.assign(t, { id, name, checkin: false, wizard: false, system: 'swiss', swissRounds: 3, _new: true, created: Date.now() });
      t.teams = ['Italy (ITA)', 'France (FRA)', 'Thailand (THA)', 'Spain (ESP)'].map((name, i) => ({ id: 'e' + i, name, players: ['a', 'b', 'c'], active: true })); return t; };
    const tri = comp('tkpo1655', "Men's Triples"); tri.pick = { on: true, rounds: [{ id: 'p1', name: 'Round 1', src: 'swiss:1' }, { id: 'p2', name: 'Round 2', src: 'swiss:2' }] };
    tri.pickClose = { p1: Date.now() - 6e4, p2: Date.now() + 72e5 }; // round 1 closed: the leaderboard is the table
    for (const t of [tri, Object.assign(comp('tefa7z63', 'Nations Cup'), { teams: [] }), comp('td9rqc9j', 'Precision Shooting')]) { await S.store.setTournament(t); S.tournaments[t.id] = t; } });
  await w(2000);
  await A.goto(base + '#tkpo1655'); await w(3000);
  await A.click('[data-tab="draw"]'); await w(400); await A.click('[data-act="first-draw"]'); await w(3000);
  // what an organiser could change on Draw & results: the score dialog behind a game, the draw's own buttons and fields
  const editProbe = p => p.evaluate(async () => { document.querySelector('main [data-match]')?.click(); await new Promise(r => setTimeout(r, 600));
    const dialog = !!document.querySelector('#modal [role="dialog"]'); document.querySelector('#modal [data-act="close-bg"]')?.click();
    const ctl = [...document.querySelectorAll('main [data-act="undo"], main [data-act="assign"], main [data-act^="plan-"], main [data-act="first-draw"], main input:not(#find-q), main select')].length;
    return { dialog, ctl, games: document.querySelectorAll('main .match').length }; });
  const own = await editProbe(A); const ownerCanScore = own.dialog && own.ctl > 0;
  log('organiser scores on the main site: ' + ownerCanScore);

  // a visitor opens the event page (the address without its slash, as shared), with the service worker on
  const E = await mk('event desktop', 1100, true); const bad = [], fonts = new Set();
  E.on('response', r => { const u = new URL(r.url()); if (r.status() >= 400) bad.push(r.status() + ' ' + u.pathname); if (/\/fonts\/.*\.woff2$/.test(u.pathname) && r.ok()) fonts.add(u.pathname); });
  E.on('requestfailed', r => { if (!/firestore|googleapis|gstatic/.test(r.url())) bad.push('failed ' + r.url()); });
  await E.goto(base + 'worlds2026'); await w(5000);
  log('no slash: ' + new URL(E.url()).pathname);
  log('event page title: ' + await E.evaluate(() => document.querySelector('.ev-title')?.textContent + ' | ' + document.querySelector('.ev-sub')?.textContent));
  log('event tabs: ' + (await E.$$eval('#tabs [data-evtab] .t-short', els => els.map(e => e.textContent))).join(' | '));
  log('event tabs, desktop labels: ' + (await E.$$eval('#tabs [data-evtab] .t-long', els => els.map(e => e.textContent))).join(', '));
  log('event opens on: ' + await E.evaluate(() => document.querySelector('#tabs [aria-current="true"] .t-long')?.textContent + (document.querySelector('main h2')?.textContent === 'Pick the Winner' ? '' : ' (page: ' + document.querySelector('main h2')?.textContent + ')')));
  log('event header hides: ' + await E.evaluate(() => { const h = document.querySelector('header.app'), gone = [['picker', '.picker-btn'], ['new', '[data-act="new-t"]'], ['calendar', '.cal-btn'], ['hall of fame', '.hof-btn'], ['organiser key', '.code-btn, [data-act="enter-code"], [data-act="org-page"], .pill']];
    return gone.map(([n, sel]) => h.querySelector(sel) ? n + ' SHOWN' : n).join(', '); }));
  log('event header keeps: ' + await E.evaluate(() => ['.brand .home', '.lang-btn', '.theme-btn'].map(s => !!document.querySelector('header ' + s)).join(' ') + ' | logo ' + new URL(document.querySelector('.brand .home').href).pathname));
  log('event browser title: ' + await E.title());
  await E.screenshot({ path: OUT + '/web-event-page-desktop.png' });

  // the results tabs, as the competitions' own organiser: nothing can be changed
  const O = await A.context().newPage(); O.on('pageerror', e => errs.push('owner on event: ' + e.message));
  await O.goto(base + 'worlds2026/'); await w(4500);
  await O.click('[data-evtab="triples"]'); await w(1500);
  const on = await O.evaluate(() => document.querySelector('.ev-views [aria-pressed="true"]')?.textContent), ev = await editProbe(O);
  const tri = `${on} shown${ev.games ? '' : ' (no games!)'}, ${ev.dialog || ev.ctl ? `EDITABLE (dialog ${ev.dialog}, controls ${ev.ctl})` : 'read-only'}`;
  log('triples tab: ' + tri);
  await O.click('[data-evview="standings"]'); await w(800);
  log('triples standings: ' + await O.evaluate(() => document.querySelector('.ev-views [aria-pressed="true"]')?.textContent + ' | table ' + !!document.querySelector('main .ev-view table')));
  await O.click('[data-evtab="nations"]'); await w(2000);
  log('nations tab switches competition: ' + await O.evaluate(() => window.__carreau.S.tid) + ' | games listened to ' + await O.evaluate(() => Object.values(window.__carreau.S.matches).every(m => !m.tid || m.tid === 'tefa7z63')) + ' | address ' + new URL(O.url()).pathname + new URL(O.url()).hash);
  await O.click('[data-evview="draw"]'); await w(600);
  log('event nations tab: ' + await O.evaluate(() => document.querySelector('main .ev-view .panel')?.textContent.trim()));
  log('event nations tab no "Registration": ' + await O.evaluate(() => !document.querySelector('main').textContent.includes('Registration')));
  log('go to main: ' + await O.evaluate(() => new URL(document.querySelector('a.ev-main').href).pathname));
  await O.click('.ev-cta a'); await w(6000);
  log('start a competition: ' + await O.evaluate(() => { const txt = document.querySelector('main').innerText; const m = /step (\d) of (\d)/i.exec(txt);
    return `${m ? `quick setup step ${m[1]} of ${m[2]}` : 'no quick setup'} (${document.body.classList.contains('ev') || location.pathname !== '/' ? 'event mode' : 'normal mode'})`; }));

  // a player joins on their phone at the event page: the private link points at the event page
  const P = await mk('player', 390); await P.goto(base + 'worlds2026/'); await w(5000);
  await P.screenshot({ path: OUT + '/web-event-page-390.png', fullPage: true });
  await P.fill('#pk-you', 'Ann'); await P.click('[data-act="pk-join"]'); await w(2500);
  const link = await P.evaluate(() => document.querySelector('#pk-link')?.value || '');
  log('event private link: ' + (/^http:\/\/127\.0\.0\.1:\d+\/worlds2026#tkpo1655\.pk-[A-Z0-9]{8}-[A-Z0-9]{16}$/.test(link) ? '/worlds2026#…' : link));
  log('390 px, 5 tabs: ' + (await P.evaluate(() => document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('#tabs [data-evtab]')].some(b => b.getBoundingClientRect().right > innerWidth + 0.5)) ? 'sideways scroll' : 'no sideways scroll'));
  // the Picks tab leaves the board to its own tab, with a link to it
  await P.evaluate(() => { document.querySelector('#pk-link')?.blur(); }); await w(300);
  log('picks tab has no board: ' + await P.evaluate(() => !document.querySelector('main .pk-board')) + ' | See the leaderboard -> board tab: ' + await P.evaluate(async () => {
    const a = document.querySelector('.ev-to-board a'); if (!a || a.textContent.trim() !== 'See the leaderboard') return false; a.click(); await new Promise(r => setTimeout(r, 800));
    return document.querySelector('#tabs [aria-current="true"]')?.dataset.evtab === 'board' && !!document.querySelector('main .ev-board .pk-board') && location.hash === '#leaderboard'; }));
  log('leaderboard tab: table with Place Name Right Diff: ' + await P.evaluate(() => [...document.querySelectorAll('main .ev-board .pk-table th')].map(th => th.textContent).join(' ') === 'Place Name Right Diff')
    + ' | you ' + await P.evaluate(() => /Ann\s*\(you\)/.test(document.querySelector('main .ev-board .pk-table')?.textContent || '')));
  log('visitor on board tab, Delete player: ' + await P.evaluate(async () => { document.querySelector('main .ev-board [data-act="pk-who"]')?.click(); await new Promise(r => setTimeout(r, 400)); return document.querySelector('main').textContent.includes('Delete player'); }));
  await P.screenshot({ path: OUT + '/web-event-page-390-board.png', fullPage: true });
  await P.click('[data-evtab="triples"]'); await w(1500); await P.screenshot({ path: OUT + '/web-event-page-390-triples.png', fullPage: true });
  await P.click('[data-evtab="nations"]'); await w(1500); await P.screenshot({ path: OUT + '/web-event-page-390-nations.png', fullPage: true });
  await P.click('[data-evtab="shoot"]'); await w(1500);
  log('390 px shooting tab: ' + (await P.evaluate(() => document.documentElement.scrollWidth > innerWidth) ? 'sideways scroll' : 'no sideways scroll') + ' | bottom bar ' + await P.evaluate(() => getComputedStyle(document.querySelector('nav.tabs')).position));
  await P.screenshot({ path: OUT + '/web-event-page-390-shoot.png', fullPage: true });
  const D = await mk('second phone', 390); await D.goto(link); await w(6000);
  log('private link opens: ' + await D.evaluate(() => document.querySelector('#tabs [aria-current="true"] .t-long')?.textContent + ' | ' + document.querySelector('.pk-me span')?.textContent + ' | address ' + location.pathname + location.hash));
  log('private link still opens Picks as the player: ' + await D.evaluate(() => document.querySelector('#tabs [aria-current="true"]')?.dataset.evtab === 'pick' && /Ann/.test(document.querySelector('.pk-me span')?.textContent || '')));
  // a link straight to a tab; tapping a tab names it in the address
  const V = await mk('visitor link', 390); await V.goto(base + 'worlds2026/#leaderboard'); await w(5000);
  log('#leaderboard opens board: ' + await V.evaluate(() => document.querySelector('#tabs [aria-current="true"]')?.dataset.evtab === 'board' && !!document.querySelector('main .ev-board') && location.hash === '#leaderboard'));
  const hl = await V.evaluate(() => history.length); await V.click('[data-evtab="triples"]'); await w(1200);
  log('tap Triples -> hash #triples: ' + await V.evaluate(n => location.hash === '#triples' && history.length === n, hl)); // replaced, no new history entry
  // fresh loads (a new page each, as when a link is opened)
  const fresh = async h => { const x = await mk('link ' + h, 390); await x.goto(base + 'worlds2026/' + h); await w(4500); return x.evaluate(() => document.querySelector('#tabs [aria-current="true"]')?.dataset.evtab); };
  log('#nations opens: ' + await fresh('#nations') + ' | unknown hash: ' + await fresh('#nope'));
  // the guide video (pick-game-guide-video): /worlds2026#guide opens it on the Picks tab; closing it leaves #pick; the
  // button above How to play opens it too
  const G = await mk('guide link', 390); await G.goto(base + 'worlds2026/#guide'); await w(5500);
  log('#guide opens the player on the Picks tab: ' + await G.evaluate(() => document.querySelector('#tabs [aria-current="true"]')?.dataset.evtab === 'pick' && /pick-the-winner\.mp4$/.test(document.querySelector('#guide-modal video')?.getAttribute('src') || '')));
  await G.click('#guide-modal [data-act="guide-close"]'); await w(500);
  log('closing the guide -> #pick: ' + await G.evaluate(() => location.hash === '#pick' && !document.getElementById('guide-modal') && document.querySelector('#tabs [aria-current="true"]')?.dataset.evtab === 'pick'));
  log('picks tab: Watch how to play -> guide player: ' + await G.evaluate(async () => { const b = document.querySelector('main .pick-page > .pk-watch');
    const above = !!b && !!(b.compareDocumentPosition(document.querySelector('main .pick-page .pk-how, main .pick-page details, main .pick-page form')) & Node.DOCUMENT_POSITION_FOLLOWING);
    b?.click(); await new Promise(r => setTimeout(r, 600)); const ok = /pick-the-winner\.mp4$/.test(document.querySelector('#guide-modal video')?.getAttribute('src') || '');
    document.querySelector('#guide-modal [data-act="guide-close"]')?.click(); const words = b?.textContent || ''; return above && ok && words.includes('Watch how to play') && words.includes('A 1½-minute video guide') || `above ${above} | opens ${ok} | ${words}`; }));
  log('390 px with the watch button: ' + (await G.evaluate(() => document.documentElement.scrollWidth > innerWidth) ? 'sideways scroll' : 'no sideways scroll'));
  await G.screenshot({ path: OUT + '/web-event-page-390-guide.png', fullPage: true });
  // the main site's Pick the Winner tab keeps its leaderboard
  const M = await mk('main site', 390); await M.goto(base + '#tkpo1655'); await w(5000); await M.click('[data-tab="pick"]'); await w(1500);
  log('main site pick tab still has the board: ' + await M.evaluate(() => !!document.querySelector('main .pk-board') && !document.querySelector('.ev-to-board')));
  // the admin on the Leaderboard tab keeps the admin-only controls (Hide / Delete player); a visitor gets none
  const AD = await mk('admin', 390); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  await AD.goto(base + 'worlds2026/#leaderboard'); await w(5000);
  const adminDel = await AD.evaluate(async () => { document.querySelector('main .ev-board [data-act="pk-who"]')?.click(); await new Promise(r => setTimeout(r, 600)); return [...document.querySelectorAll('main button')].some(x => x.textContent.trim() === 'Delete player'); });
  log('admin on board tab: Delete player shown: ' + adminDel + ' | visitor: ' + await P.evaluate(() => [...document.querySelectorAll('main button')].some(x => x.textContent.trim() === 'Delete player')));
  // 360 px in French: five tabs still fit
  const F = await mk('french 360', 360); await F.goto(base + 'worlds2026/#leaderboard'); await w(4000);
  await F.click('[data-act="lang-menu"]'); await w(300); await F.click('[data-lang="fr"]'); await w(1500);
  log('360 px fr tabs: ' + (await F.$$eval('#tabs [data-evtab] .t-short', els => els.map(e => e.textContent))).join(' | ') + ' | ' + (await F.evaluate(() => document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('#tabs [data-evtab]')].some(b => b.getBoundingClientRect().right > innerWidth + 0.5)) ? 'sideways scroll' : 'no sideways scroll'));
  await F.screenshot({ path: OUT + '/web-event-page-360-fr-board.png' });

  // preview tags in the HTML at that address; unknown addresses stay 404; the main page is the normal app
  const html = (await get(base + 'worlds2026/')).body, og = n => (new RegExp(`<meta property="og:${n}" content="([^"]*)"`).exec(html) || [])[1];
  log('og:title on /worlds2026: ' + og('title'));
  log('og tags: ' + ['description', 'image', 'url'].map(n => n + ' ' + og(n)).join(' | ') + ' | twitter ' + (/<meta name="twitter:card" content="summary_large_image">/.test(html)));
  log('unknown slug: ' + (await get(base + 'something-else/')).status + ' | main page event: ' + /window\.SN_EVENT=/.test((await get(base)).body));

  // assets from /worlds2026/: fonts, the service worker (registered at the site's root), the language files
  await E.click('[data-act="lang-menu"]'); await w(300); await E.click('[data-lang="fr"]'); await w(1500);
  log('event fr tabs: ' + (await E.$$eval('#tabs [data-evtab] .t-long', els => els.map(e => e.textContent))).join(', ') + ' | ' + await E.evaluate(() => document.querySelector('a.ev-main')?.textContent));
  const sw = await E.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r ? new URL(r.scope).pathname + ' ' + new URL((r.active || r.installing || r.waiting).scriptURL).pathname : 'none'; });
  log(`assets load from /worlds2026/: ${fonts.size ? 'fonts ok' : 'NO FONTS'}, ${sw === '/ /sw.js' ? 'sw ok' : 'sw ' + sw}, ${bad.filter(x => !/worlds2026-share\.png/.test(x)).length ? 'errors ' + bad.join(' ; ') : 'no 404s'}`);
  await E.reload(); await w(4000);
  log('reload with service worker: ' + await E.evaluate(() => document.querySelector('.ev-title')?.textContent + ' | ' + location.pathname));
  log('errs ' + JSON.stringify(errs));
  await b.close();
})();
