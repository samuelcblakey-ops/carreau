// Mêlée drawn in advance: rounds listed 1 first; "Print the draw" opens a print-ready page with one round per page
// and no results table; if no new page can be opened it prints this page, where the print styles hide the table.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const L = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), L = [];
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Print test', entry: 'melee', checkin: false, meleeMode: 'advance', format: 'doubles', swissRounds: 3 });
    t.players = Array.from({ length: 18 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, active: true })); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(250);
    for (const m of C.MS().filter(m => m.round === 1 && !m.bye).slice(0, 2)) await C.recordResult(m.id, 13, 7, true); await w(100);
    L.push('order on screen: ' + [...document.querySelectorAll('section.draw-round h3')].map(h => h.textContent).join(' | '));
    L.push('table on page: ' + !!q('.draw-table'));
    return L; });
  // print opens a new page
  const [pop] = await Promise.all([c.waitForEvent('page'), p.evaluate(() => { window.__printed = 0; document.querySelector('[data-act="print-draw"]').click(); })]);
  await pop.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; }).catch(() => {});
  await pop.waitForLoadState(); await pop.waitForTimeout(600);
  const pr = await pop.evaluate(() => ({ pages: document.querySelectorAll('section.pg').length, titles: [...document.querySelectorAll('section.pg h1')].map(h => h.textContent).join(' | '),
    table: /Wins|Buchholz|Pts|\+\/-/.test(document.body.innerText) && !!document.querySelector('.draw-table'),
    breaks: [...document.styleSheets[0].cssRules].some(r => r.media && /print/.test(r.media.mediaText) && /break-before:\s*page/.test(r.cssText)),
    firstRows: document.querySelectorAll('section.pg')[0].querySelectorAll('tbody tr').length, piste: document.querySelector('section.pg tbody td.pi').textContent.trim() !== '',
    names: /Player \d+ · Player \d+/.test(document.querySelector('section.pg tbody').innerText), bye: /Bye/.test(document.body.innerText) }));
  L.push(`print page: pages ${pr.pages} | ${pr.titles} | table ${pr.table} | page breaks ${pr.breaks} | round 1 rows ${pr.firstRows} | piste shown ${pr.piste} | team names ${pr.names}`);
  await pop.close();
  // pop-ups blocked: falls back to printing this page; print styles hide the table and break per round
  const fb = await p.evaluate(async () => { window.open = () => null; let printed = 0; window.print = () => { printed++; }; document.querySelector('[data-act="print-draw"]').click(); await new Promise(r => setTimeout(r, 50));
    const rule = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } }).find(r => r.media && /print/.test(r.media.mediaText) && /draw-table/.test(r.cssText));
    return { printed, hidesTable: !!rule && /\.draw-table[^{]*\{\s*display:\s*none/.test(rule.cssText), perRound: !!rule && /draw-round\s*~\s*\.draw-round\s*\{\s*break-before:\s*page/.test(rule.cssText) }; });
  L.push(`fallback: printed ${fb.printed} | hides table ${fb.hidesTable} | round per page ${fb.perRound}`);
  // round by round (Swiss) keeps newest first
  const sw = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Swiss', system: 'swiss', checkin: false, swissRounds: 3 });
    for (let i = 0; i < 8; i++) t.teams.push({ id: 't' + i, name: 'Team ' + i, players: ['x'], active: true }); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(200);
    for (const m of C.MS().filter(m => !m.bye)) await C.recordResult(m.id, 13, 5, true); await w(100); q('[data-act="next-round"]').click(); await w(250);
    return [...document.querySelectorAll('section.draw-round h3')].map(h => h.textContent).join(' | '); });
  L.push('swiss order: ' + sw);
  console.log(L.join('\n')); console.log('errs', errs); await b.close();
})();
