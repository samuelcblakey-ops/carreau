// Phones, small things: free pistes on one line and tile labels that wrap; shooting tables that show the total first;
// one "Show all columns" bar per page; no tab lit up on pages that aren't tabs (and a tab tap leaves them); the add
// forms folded once teams exist; Setup leading with the competition itself; a toast that never covers a dialog.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  const ev = (fn, a) => p.evaluate(fn, a), w = ms => p.waitForTimeout(ms);
  const txt = s => ev(s => (document.querySelector(s)?.innerText || '').replace(/\s+/g, ' ').trim(), s);
  const make = (cfg, n) => ev(async ([cfg, n]) => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { checkin: false, wizard: false, seeding: 'entry' }, cfg);
    t.courts = Array.from({ length: cfg.pistes || 8 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
    const indiv = cfg.entry === 'shooting' || cfg.format === 'singles';
    const ents = Array.from({ length: n }, (_, i) => indiv ? { id: 'p' + i, name: 'Shooter ' + i, active: true } : { id: 'e' + i, name: 'Team ' + String.fromCharCode(65 + i), players: ['Ann ' + i, 'Bob ' + i], active: true });
    if (indiv && cfg.entry === 'shooting') { t.players = ents; t.teams = []; } else if (indiv) { t.teams = ents.map(e => ({ ...e, players: [e.name] })); } else t.teams = ents;
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(60); C.render(); }, [cfg, n]);
  const play = max => ev(async max => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)); let k = 0;
    for (let i = 0; i < 60 && k < max; i++) { const m = C.MS().filter(m => m.a && m.b && !m.done && !m.bye).sort((x, y) => x.round - y.round || x.order - y.order)[0]; if (!m) break; await C.recordResult(m.id, 13, 7, true); k++; await w(15); } C.render(); await w(50); }, max);
  const tab = async k => { await p.click(`[data-tab="${k}"]`); await w(120); };
  // 1. Pistes: a 16-team knockout on 16 pistes, quarter-finals under way
  await make({ name: 'KO day', system: 'knockout', format: 'doubles', pistes: 16, koThird: false }, 16);
  await tab('draw'); await p.click('[data-act="first-draw"]'); await w(400); await play(10);
  await ev(async () => { const C = window.__carreau; const m = C.MS().find(m => m.court && !m.done); await C.recordResult(m.id, 5, 4, false); });
  await tab('courts');
  console.log('pistes: tiles ' + await ev(() => document.querySelectorAll('.pgrid .ptile').length) + ' | free line "' + await txt('.pfree') + '" | free tiles ' + await ev(() => document.querySelectorAll('.ptile.free').length));
  console.log('tile label: ' + await ev(() => { const c = document.querySelector('.pgrid .pt-ctx'); return c.textContent + ' | cut off ' + (c.scrollHeight > c.clientHeight + 1 || getComputedStyle(c).textOverflow === 'ellipsis') + ' | lines ' + Math.round(c.getBoundingClientRect().height / parseFloat(getComputedStyle(c).lineHeight)); }));
  console.log('page fits: ' + await ev(() => document.documentElement.scrollWidth <= innerWidth + 1));
  // ranges: pistes 1, 3, 4 and 6-9 free on a 9-piste ground
  console.log('ranges: ' + await ev(() => { const R = window.__carreau.pisteRuns, c = (...n) => n.map(x => ({ name: String(x) }));
    return [R(c(1, 3, 4, 6, 7, 8, 9)), R(c(...Array.from({ length: 16 }, (_, i) => i + 1))), R(c('A', 'B', 'C')), R(c(7))].join(' / '); }));
  // 2. precision shooting: the total is on screen, the ateliers come with "Show all columns"
  await make({ name: 'Shoot', entry: 'shooting', system: 'knockout', shootFormat: 'ko8', format: 'singles', pistes: 4 }, 10);
  await tab('draw'); await p.click('[data-act="first-draw"]'); await w(400);
  await ev(async () => { const C = window.__carreau, S = C.S; const m = C.MS().find(m => m.stage === 'shoot'); const shots = {}; ['a1', 'a2', 'a3', 'a4', 'a5'].forEach(k => shots[k] = [5, 3, 0, 5]);
    Object.assign(S.matches[m.id], { shots }); C.render(); });
  const shootCols = () => ev(() => { const tb = document.querySelector('main .tw table'); const th = [...tb.querySelectorAll('thead th')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent.trim() || '·');
    const tot = [...tb.querySelectorAll('thead th')].find(x => x.textContent.trim() === 'Total'); return th.join(',') + ' | total on screen ' + (tot.getBoundingClientRect().right <= innerWidth) + ' | bars ' + document.querySelectorAll('main .st-more').length; });
  console.log('shooting draw: ' + await shootCols());
  await p.click('main [data-act="st-cols"]'); await w(100);
  console.log('all columns: ' + await ev(() => [...document.querySelectorAll('main .tw thead th')].filter(x => getComputedStyle(x).display !== 'none').length) + ' | button ' + await txt('main [data-act="st-cols"]'));
  await p.click('main [data-act="st-cols"]'); await w(100);
  await tab('standings'); console.log('shooting standings: ' + await shootCols());
  // 3. barrage standings: the bar once, above the tables
  await make({ name: 'Barrage', system: 'pools', format: 'doubles', poolSize: 4, poolStyle: 'rr', pistes: 8 }, 16);
  await tab('draw'); await p.click('[data-act="first-draw"]'); await w(400); await play(6);
  await tab('standings');
  console.log('barrage: tables ' + await ev(() => document.querySelectorAll('main .tw.st').length) + ' | bars ' + await ev(() => document.querySelectorAll('main .st-more').length) + ' | bar first ' + await ev(() => { const bar = document.querySelector('main .st-more'), tb = document.querySelector('main .tw.st'); return !!(bar.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING); }) + ' | hint ' + await txt('main .st-hint'));
  // 4. pages that aren't tabs: nothing lit up, and a tab tap goes back to the competition
  await ev(() => { const C = window.__carreau; C.S.overlayView = () => '<div class="stack"><h2>Guides</h2></div>'; C.render(); });
  console.log('guides page: lit ' + await ev(() => document.querySelectorAll('#tabs [aria-current="true"]').length) + ' | ' + await txt('main h2'));
  await tab('draw');
  console.log('tab from guides: overlay ' + await ev(() => !!window.__carreau.S.overlayView) + ' | lit ' + await ev(() => document.querySelector('#tabs [aria-current="true"]')?.dataset.tab) + ' | ' + await txt('main h2'));
  await ev(() => { location.hash = 'streams'; }); await w(300);
  console.log('streams page: lit ' + await ev(() => document.querySelectorAll('#tabs [aria-current="true"]').length));
  await tab('standings'); console.log('tab from streams: ' + await ev(() => document.querySelector('#tabs [aria-current="true"]')?.dataset.tab + ' ' + !window.__carreau.S.liveRoute));
  // 5. registration: the list first, adding more folded into one line once teams exist
  await tab('entries');
  const reg = () => ev(() => { const d = document.querySelector('main details.add-more'), list = [...document.querySelectorAll('main h3')].find(h => /^Teams|^Players/.test(h.textContent));
    return 'fold ' + (d ? (d.open ? 'open' : 'closed') : 'none') + ' | forms shown ' + !!document.querySelector('#add-form')?.checkVisibility() + ' | list on screen ' + (list ? Math.round(list.getBoundingClientRect().top) < innerHeight : false); });
  console.log('with teams: ' + await reg() + ' | summary ' + await txt('main details.add-more > summary'));
  await p.click('main details.add-more > summary'); await w(100); await ev(() => window.__carreau.render()); await w(60);
  console.log('opened, after a redraw: ' + await reg());
  await p.click('main details.add-more > summary'); await w(100);
  await ev(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('[data-act="new-t"]').click(); await w(200); document.querySelector('[data-act="wiz-skip"]').click(); await w(200); document.querySelector('[data-tab="entries"]').click(); await w(150); });
  console.log('empty: ' + await reg());
  await p.fill('#nt-p0', 'Zoe'); await p.fill('#nt-p1', 'Max'); await p.click('#add-form [type="submit"]'); await w(300);
  console.log('first team added: ' + await reg());
  // 6. Setup leads with the competition itself; colours and logo come later
  await tab('setup');
  console.log('setup order: ' + await ev(() => [...document.querySelectorAll('main .panel')].map(x => x.querySelector('h3')?.textContent.trim() || (x.querySelector('#f-name') ? 'Details' : '?')).join(' > ')));
  // 7. a toast while a dialog is open stays clear of it
  await ev(async () => { const C = window.__carreau, q = s => document.querySelector(s), w = ms => new Promise(r => setTimeout(r, ms)); const id = Object.values(C.S.tournaments).find(t => t.name === 'KO day').id;
    q('[data-act="picker"]').click(); await w(80); q(`[data-act="pick-t"][data-id="${id}"]`).click(); await w(300); q('[data-tab="draw"]').click(); await w(150); });
  await ev(() => document.querySelector('main [data-match]:not([disabled])')?.click()); await w(150);
  await ev(() => window.__carreau.toast('Result saved.', async () => {})); await w(150);
  console.log('toast and dialog: ' + await ev(() => { const a = document.querySelector('#toast').getBoundingClientRect(), d = document.querySelector('#modal .modal').getBoundingClientRect(); return 'overlap ' + (a.top < d.bottom && a.bottom > d.top && a.left < d.right && a.right > d.left) + ' | toast at bottom ' + (innerHeight - a.bottom < 40); }));
  await ev(() => document.querySelector('#modal [data-act="close"]').click()); await w(100);
  console.log('no dialog: toast back above the tab bar ' + await ev(() => { const a = document.querySelector('#toast').getBoundingClientRect(), n = document.querySelector('nav.tabs').getBoundingClientRect(); return a.bottom <= n.top; }));
  // 8. French
  await p.click('[data-act="lang-menu"]'); await w(60); await p.click('[data-lang="fr"]'); await w(200); await tab('courts');
  console.log('french: ' + await txt('.pfree'));
  console.log('errs', errs); await b.close();
})();
