// Inter-club with a seeded day 2: the 2026 Inter-Regional Championship (Division 1) replayed from its published results.
// Day 1: every region plays every region, like for like. Day 2 is drawn from the day 1 table (seeds 1 and 2 get seeds 3–6
// and meet last; teams crossed 1 v 2, 2 v 1…), and the final table adds both days. Both must match the published tables.
const { chromium } = require('playwright');
const IR = require('./fixtures/ir2026-div1.js');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async IR => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'IR test', system: 'clubs', format: 'triples', clubTeams: 8, clubDays: 7, clubPairing: 'like', checkin: false, wizard: false });
    IR.regions.forEach((r, ri) => { for (let i = 0; i < 8; i++) t.teams.push({ id: `r${ri}t${i + 1}`, name: `${r} ${i + 1}`, players: [], club: r, active: true }); });
    t.courts = Array.from({ length: 32 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    // 1. Setup: the option, its note, and the field renamed
    await tab('setup');
    L.push('option: ' + !!q('[data-check="clubDay2"]') + ' | days label ' + txt(q('#f-clubdays').closest('label').querySelector('span')));
    q('[data-check="clubDay2"]').click(); await w(120);
    L.push('on: saved ' + C.T().clubDay2 + ' | label ' + txt(q('#f-clubdays').closest('label').querySelector('span')) + ' | note ' + /Seeds 1 and 2 get the hardest draw/.test(txt(q('main'))));
    // 2. Day 1 draw, then put each fixture in its 2026 round
    await tab('draw'); q('[data-act="first-draw"]').click(); await w(300);
    const cid = name => C.T().clubs.find(c => c.name === name).id;
    L.push('day 1 drawn: fixtures ' + C.T().clubFix.length + ' | rounds ' + C.T().clubDays + ' | chips ' + qa('.round-bar .rchip').map(b => b.textContent).join(',') + ' | groups ' + qa('.round-bar .rb-group .eyebrow').map(e => e.textContent).join(',') + ' | shown ' + qa('main section.club-round h3').map(h => h.textContent).join(',') + ' | picked ' + q('.rchip[aria-pressed="true"]').textContent);
    const nt = JSON.parse(JSON.stringify(C.T()));
    IR.rounds.slice(0, 7).forEach((rd, r) => rd.forEach(fx => { const A = cid(IR.regions[fx.a]), B = cid(IR.regions[fx.b]); const f = nt.clubFix.find(f => (f.a === A && f.b === B) || (f.a === B && f.b === A)); f.day = r + 1; }));
    await S.store.setTournament(nt); S.tournaments[nt.id] = nt;
    for (const m of C.MS()) { const f = nt.clubFix.find(f => f.a === m.ca && f.b === m.cb); if (m.round !== f.day) { S.matches[m.id].round = f.day; await S.store.updateMatch(S.tid, m.id, { round: f.day }); } }
    const play = async (r, fxGames) => { for (const fx of IR.rounds[r]) { const A = cid(IR.regions[fx.a]), B = cid(IR.regions[fx.b]); const games = fxGames(A, B);
      for (let i = 0; i < 8; i++) { const m = games[i]; const [x, y] = fx.games[i]; const flip = m.ca !== A; await C.recordResult(m.id, flip ? y : x, flip ? x : y, true); } } };
    const day1 = (A, B) => C.MS().filter(m => m.group === 'CL' && ((m.ca === A && m.cb === B) || (m.ca === B && m.cb === A))).sort((x, y) => x.order - y.order);
    // day 2 button waits for day 1
    C.render(); await w(60);
    L.push('before day 1 is done: button ' + (q('[data-act="club-day2"]')?.disabled ? 'disabled' : 'missing/enabled') + ' | ' + txt(q('.day2-panel .small')));
    for (let r = 0; r < 7; r++) await play(r, day1);
    C.render(); await w(80);
    // the app's day 1 club table must match the published one
    await tab('standings');
    const table = () => qa('main .panel')[0].querySelectorAll('tbody tr');
    const rows = tr => [...tr].map(r => [...r.children].map(c => c.textContent.trim())).map(c => `${c[1]} ${c[3]} ${c[5]} ${c[6]} ${c[7].replace('+', '')}`);
    const pub = tbl => tbl.map(r => r.join(' ')).join(' | ');
    L.push('day 1 table matches: ' + (rows(table()).join(' | ') === pub(IR.day1)));
    // 3. Draw day 2
    await tab('draw'); L.push('ready: ' + txt(q('.day2-panel .small')) + ' | enabled ' + !q('[data-act="club-day2"]').disabled);
    q('[data-act="club-day2"]').click(); await w(400);
    const T2 = C.T(); const d2 = T2.clubFix.filter(f => f.d2); const nm = id => T2.clubs.find(c => c.id === id).name;
    const drawn = [8, 9, 10, 11, 12].map(day => d2.filter(f => f.day === day).map(f => nm(f.a) + ' v ' + nm(f.b)).join(', ')).join(' / ');
    const published = IR.rounds.slice(7).map(rd => rd.map(fx => IR.regions[fx.a] + ' v ' + IR.regions[fx.b]).join(', ')).join(' / ');
    L.push('day 2 fixtures match 2026: ' + (drawn === published) + ' | games ' + C.MS().filter(m => m.group === 'CL2').length + ' | rounds ' + T2.clubDays);
    if (drawn !== published) L.push('drawn: ' + drawn + '\npublished: ' + published);
    const g = C.MS().filter(m => m.group === 'CL2' && m.round === 8 && m.ca === cid('Chiltern')).sort((x, y) => x.order - y.order).map(m => m.a[0].split('t')[1] + 'v' + m.b[0].split('t')[1]).join(' ');
    L.push('crossed: ' + g);
    L.push('page: groups ' + qa('.round-bar .rb-group .eyebrow').map(e => e.textContent).join(',') + ' | shown ' + qa('main section.club-round').map(x => txt(x.querySelector('.eyebrow')) + ' ' + txt(x.querySelector('h3'))).join(',') + ' | undo offered ' + !!q('[data-act="undo"][data-id="CL2"]') + ' | panel ' + txt(q('.day2-panel b')));
    L.push('context: ' + C.matchContext(C.T(), C.MS().find(m => m.group === 'CL2' && m.round === 12)));
    // rematches are separate fixtures: day 1 Chiltern v Suffolk Coastal keeps its own 8 games
    const sc = C.T().clubFix.filter(f => [f.a, f.b].includes(cid('Chiltern')) && [f.a, f.b].includes(cid('Suffolk Coastal')));
    L.push('rematch kept apart: ' + sc.length + ' fixtures, games ' + sc.map(f => C.MS().filter(m => f.d2 ? m.fx === f.id : !m.fx && m.ca === f.a && m.cb === f.b).length).join('+'));
    // undo and redraw
    q('[data-act="undo"][data-id="CL2"]').click(); await w(300);
    L.push('undone: games ' + C.MS().filter(m => m.group === 'CL2').length + ' | fixtures ' + C.T().clubFix.length + ' | rounds ' + C.T().clubDays + ' | button back ' + !!q('[data-act="club-day2"]'));
    q('[data-act="club-day2"]').click(); await w(400);
    const day2 = (A, B) => C.MS().filter(m => m.group === 'CL2' && m.ca === A && m.cb === B).sort((x, y) => x.order - y.order);
    for (let r = 7; r < 12; r++) await play(r, day2);
    C.render(); await w(80);
    await tab('standings');
    L.push('final table matches: ' + (rows(table()).join(' | ') === pub(IR.final)) + ' | headings ' + qa('main .panel h3').map(h => h.textContent).slice(0, 3).join(','));
    if (rows(table()).join(' | ') !== pub(IR.final)) L.push('ours: ' + rows(table()).join(' | '));
    L.push('podium: clubs ' + [...qa('main .panel')[0].querySelectorAll('tbody tr')].slice(0, 4).map(r => r.className + ':' + (r.querySelector('.medal')?.className || '-')).join(' ') + ' | day 1 table plain ' + !q('details.day1-table .medal') + ' folded ' + !q('details.day1-table').open + ' | teams top ' + qa('main .panel').find(p => p.querySelector('h3')?.textContent === 'Teams').querySelector('tbody tr').className + ' | facts before teams ' + (qa('main .panel').indexOf(q('.facts-panel')) < qa('main .panel').findIndex(p => p.querySelector('h3')?.textContent === 'Teams')));
    L.push('facts: ' + qa('.facts .fact').map(f => txt(f.querySelector('.eyebrow')) + ' = ' + txt(f.querySelector('.fact-v')) + ' (' + txt(f.querySelector('.small')) + ')').join(' ; '));
    L.push('day 1 panel still matches: ' + (rows(q('details.day1-table').querySelectorAll('tbody tr')).join(' | ') === pub(IR.day1)));
    // results grid on Standings: table order, each cell the row club's games won – lost; Chiltern v Suffolk Coastal met on both days (7–1 twice)
    const grid = q('.results-grid .cgrid');
    L.push('grid: columns ' + [...grid.querySelectorAll('thead th.g-col')].map(th => th.textContent).join(',') + ' | rows ' + [...grid.querySelectorAll('tbody th.g-name')].map(th => th.textContent.trim()).slice(0, 3).join(',') + ' | self cells ' + grid.querySelectorAll('td.g-self').length + ' | results ' + grid.querySelectorAll('.g-res').length);
    const rowOf = n => [...grid.querySelectorAll('tbody tr')].find(tr => tr.querySelector('.g-full').textContent.trim() === n);
    const colOf = n => [...grid.querySelectorAll('thead th')].findIndex(th => th.title === n);
    const cellText = (r, c) => [...rowOf(r).children[colOf(c)].querySelectorAll('.g-res')].map(b => b.textContent + ':' + b.className.replace('g-res ', '')).join(' ');
    L.push('cells: Chiltern v Suffolk Coastal ' + cellText('Chiltern', 'Suffolk Coastal') + ' | Suffolk Coastal v Chiltern ' + cellText('Suffolk Coastal', 'Chiltern') + ' | wins column ' + txt(rowOf('Chiltern').querySelector('.g-tot')));
    // tapping a score opens that fixture on Draw & results, in its round
    rowOf('Chiltern').children[colOf('Suffolk Coastal')].querySelector('.g-res').click(); await w(150);
    const box = q('.fixture.open');
    L.push('jump: tab ' + S.tab + ' | round ' + q('.rchip[aria-pressed="true"]').textContent + ' | open fixture ' + txt(box.querySelector('.fx-sum')).replace(/\s+/g, ' ') + ' | games shown ' + box.querySelectorAll('.match').length + ' | other fixtures closed ' + qa('.fixture.compact:not(.open)').length);
    // finished fixtures are one line each until opened; dots show who won each game
    q('.fixture.open .fx-sum').click(); await w(80);
    L.push('closed again: cards ' + qa('main section.club-round .match').length + ' | dots ' + q('.fixture .fx-dots').children.length + ' (' + [...q('.fixture .fx-dots').children].map(i => i.className.slice(2)).join('') + ')');
    q('[data-act="club-sel"][data-v="grid"]').click(); await w(80);
    L.push('grid chip: ' + !!q('main .results-grid .cgrid') + ' | sections ' + qa('main section.club-round').length);
    q('[data-act="club-sel"][data-v="all"]').click(); await w(80);
    L.push('all chip: sections ' + qa('main section.club-round').length + ' | headings ' + qa('main h2.club-day-h').map(h => h.textContent).join(','));
    q('[data-act="club-sel"][data-v="5"]').click(); await w(80);
    L.push('round 5 chip: ' + qa('main section.club-round h3').map(h => h.textContent).join(',') + ' | fixtures ' + qa('.fixture').length);
    await tab('standings');
    // 4. French
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80); await tab('draw');
    L.push('french: ' + txt(q('.day2-panel')).slice(0, 60) + ' | ' + txt(qa('main section h3').find(h => /5/.test(h.textContent))));
    q('[data-lang="en"]')?.click(); await w(40);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; }, IR);
  console.log(out.join('\n'));
  // screenshots of the finished Standings (light and dark, desktop and phone) for a visual check
  await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('[data-act="lang-menu"]')?.click(); await w(40); document.querySelector('[data-lang="en"]')?.click(); await w(60); document.querySelector('[data-tab="standings"]').click(); await w(200); });
  await p.screenshot({ path: process.env.OUT + '/club-day2-standings.png', fullPage: true });
  await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('[data-tab="draw"]').click(); await w(150); document.querySelector('[data-act="club-sel"][data-v="12"]').click(); await w(150); document.querySelector('.fixture .fx-sum').click(); await w(150); });
  await p.screenshot({ path: process.env.OUT + '/club-day2-draw.png', fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  await p.screenshot({ path: process.env.OUT + '/club-day2-draw-phone.png', fullPage: true });
  await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('[data-tab="standings"]').click(); await w(200); });
  await p.setViewportSize({ width: 1100, height: 900 });
  await p.evaluate(() => { document.documentElement.dataset.theme = 'dark'; }); await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  await p.screenshot({ path: process.env.OUT + '/club-day2-standings-phone-dark.png', fullPage: true });
  console.log('errs', errs); await b.close();
})();
