// Knockout seeding after a barrage/leagues: pairings 1 v 8, 4 v 5, 3 v 6, 2 v 7, laid out so the two best seeds of every part of
// the bracket sit at opposite edges (1 top line, 2 bottom line; 1/4 in the top half, 3/2 in the bottom half), with same-group clashes fixed by the nearest swap.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { system: 'pools', name: 'Seeding', checkin: false, wizard: false });
    for (let i = 1; i <= 16; i++) t.teams.push({ id: 's' + i, name: 'Seed ' + i, players: ['a'], active: true }); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    const ents = n => Array.from({ length: n }, (_, i) => 's' + (i + 1));
    const r1 = res => res.matches.filter(m => m.round === 1).sort((x, y) => x.order - y.order).map(m => `${(m.a || ['bye'])[0].slice(1)}v${(m.b || ['bye'])[0].slice(1)}`).join(' ');
    // no clashes: straight seed order
    L.push('plain 8: ' + r1(C.createBracket(C.T(), 'A', 'A', ents(8), { groupOf: id => id })));
    // Sam's case: seeds 3 and 6 from the same barrage (winner C and runner-up C): 6 swaps with the nearest lower seed, 5
    const grp = { s1: 'A', s2: 'B', s3: 'C', s4: 'D', s5: 'D', s6: 'C', s7: 'A', s8: 'B' };
    L.push('3 and 6 together: ' + r1(C.createBracket(C.T(), 'A', 'A', ents(8), { groupOf: id => grp[id] })));
    // every game a clash: fixed with nearest swaps, top seeds first
    const all = { s1: 'A', s8: 'A', s2: 'B', s7: 'B', s3: 'C', s6: 'C', s4: 'D', s5: 'D' };
    L.push('all clash: ' + r1(C.createBracket(C.T(), 'A', 'A', ents(8), { groupOf: id => all[id] })));
    // seed 1's runner-up is seed 8: swapped with 7, not with a neighbour game's 5
    const one = { s1: 'A', s8: 'A', s2: 'B', s3: 'C', s4: 'D', s5: 'D', s6: 'C', s7: 'B' };
    L.push('1 and 8 together: ' + r1(C.createBracket(C.T(), 'A', 'A', ents(8), { groupOf: id => one[id] })));
    // 16: 1 v 16 … and byes for 12 entrants
    L.push('plain 16: ' + r1(C.createBracket(C.T(), 'A', 'A', ents(16), { groupOf: id => id })));
    L.push('12 with byes: ' + r1(C.createBracket(C.T(), 'A', 'A', ents(12), { groupOf: id => id })));
    // end to end: 16 teams, 4 barrages of 4 (round robin, entry-order seeding); the lower index always wins, margins
    // arranged so the runners-up rank D, C, B, A — every seeded game would be a same-barrage clash
    q('[data-act="new-t"]').click(); await w(80); const t2 = JSON.parse(JSON.stringify(C.T())); Object.assign(t2, { system: 'pools', poolStyle: 'rr', poolSize: 4, seeding: 'entry', name: 'E2E', checkin: false, wizard: false });
    for (let i = 0; i < 16; i++) t2.teams.push({ id: 'e' + i, name: 'Team ' + i, players: ['a'], active: true }); await S.store.setTournament(t2); S.tournaments[t2.id] = t2; await w(40);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(200);
    L.push('barrages: ' + C.T().pools.map(p => p.members.map(x => x.slice(1)).join('')).join(' '));
    for (const m of C.MS().filter(m => m.pool)) { const ia = +m.a[0].slice(1), ib = +m.b[0].slice(1); const wi = Math.min(ia, ib); const lose = wi % 13; await C.recordResult(m.id, ia === wi ? 13 : lose, ia === wi ? lose : 13, true); }
    await w(80); await C.startKnockouts(); await w(200);
    const A = C.T().brackets.find(b => b.id === 'A'); const sd = id => A.seeds.indexOf(id) + 1; const pl = id => C.T().pools.find(p => p.members.includes(id)).id.slice(1);
    const games = C.MS().filter(m => m.bracket === 'A' && m.round === 1).sort((x, y) => x.order - y.order);
    L.push('seeds: ' + A.seeds.map(id => id.slice(1)).join(','));
    L.push('round 1: ' + games.map(m => `${sd(m.a[0])}v${sd(m.b[0])}`).join(' ') + ' | same barrage: ' + games.filter(m => pl(m.a[0]) === pl(m.b[0])).length + ' | pools: ' + games.map(m => pl(m.a[0]) + pl(m.b[0])).join(' '));
    // the top seed of every game wins: seed 1 stays along the top edge, seed 2 along the bottom, and they meet in the final
    const pair = m => `${sd(m.a[0])}v${sd(m.b[0])}`;
    for (let r = 1; r <= A.rounds; r++) for (const m of C.MS().filter(m => m.bracket === 'A' && m.round === r && !m.third && m.a && m.b)) { const aw = sd(m.a[0]) < sd(m.b[0]); await C.recordResult(m.id, aw ? 13 : 5, aw ? 5 : 13, true); await w(30); }
    const rd = r => C.MS().filter(m => m.bracket === 'A' && m.round === r && !m.third).sort((x, y) => x.order - y.order).map(pair).join(' ');
    L.push(`favourites win: semis ${rd(2)} | final ${rd(3)}`);
    q('[data-tab="draw"]').click(); await w(80); q('[data-act="draw-sel"][data-v="ko-A"]')?.click(); await w(60);
    const col = [...document.querySelectorAll('.bk .bk-col')][0], rows = col ? [...col.querySelectorAll('.bkm-row')] : [];
    const line = r => r ? [...r.children].map(c => c.textContent.trim()).filter(Boolean).join(' ') : '';
    L.push(`drawn: top line ${line(rows[0])} | bottom line ${line(rows[rows.length - 1])}`);
    // knockout plan names: the default names show translated in the editor and save back in English; no "Semi-finals · Semi-finals"
    q('[data-act="new-t"]').click(); await w(80); const t3 = JSON.parse(JSON.stringify(C.T())); Object.assign(t3, { system: 'swiss', name: 'Plan names', checkin: false, wizard: false });
    for (let i = 1; i <= 8; i++) t3.teams.push({ id: 'n' + i, name: 'Name ' + i, players: ['a'], active: true }); await S.store.setTournament(t3); S.tournaments[t3.id] = t3; await w(40);
    const preset = async label => { q('[data-tab="setup"]').click(); await w(60); const btn = [...document.querySelectorAll('[data-act="plan-preset"]')].find(x => x.textContent.trim() === label) || document.querySelectorAll('[data-act="plan-preset"]')[{ 'Semi-finals (top 4)': 1, 'Top 8 + Plate (9–16)': 3 }[label]]; btn.click(); await w(80); };
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80);
    await preset('Top 8 + Plate (9–16)'); q('[data-tab="setup"]').click(); await w(60);
    L.push(`fr plan editor names: ${q('#pl-name-0').value} | ${q('#pl-name-1').value}`);
    for (const i of [0, 1]) { q('#pl-name-' + i).dispatchEvent(new Event('change', { bubbles: true })); await w(60); }
    q('#pl-name-1').value = 'Coupe des amis'; q('#pl-name-1').dispatchEvent(new Event('change', { bubbles: true })); await w(60);
    L.push(`fr saved back: ${C.getPlan(C.T()).brackets.map(b => b.name).join(' | ')}`);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="en"]').click(); await w(80);
    await preset('Semi-finals (top 4)');
    const pn = C.getPlan(C.T()).brackets[0].name; await C.addDraw(C.createBracket(C.T(), 'A', pn, ['n1', 'n2', 'n3', 'n4'])); await w(80);
    const lab = bid => C.MS().filter(m => m.bracket === bid && !m.third).sort((x, y) => x.round - y.round).map(m => C.matchContext(C.T(), m)).filter((v, i, a) => a.indexOf(v) === i);
    L.push(`preset top 4 game labels: ${lab('A').join(' | ')}`);
    await C.addDraw(C.createBracket(C.T(), 'B', 'Semi-finals', ['n5', 'n6', 'n7', 'n8'])); await w(80);
    const old = lab('B'); L.push(`existing semi-finals named bracket: ${old[0]} | ${old.some(x => /Semi-finals · Semi-finals/.test(x)) ? 'doubled' : 'no doubling'} | ${old.join(' / ')}`);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
