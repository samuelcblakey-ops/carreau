// Find my game, the new-round alert, and the phone standings (own row highlighted, extra columns behind a toggle).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Find', system: 'swiss', checkin: false, swissRounds: 3 });
    ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'].forEach((n, i) => t.teams.push({ id: 'e' + i, name: n, players: ['Pat ' + n], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    L.push('own draw, no alert: ' + q('#roundalert').hidden);
    L.push('find panel: ' + !!q('#find-q'));
    const inp = q('#find-q'); inp.focus(); inp.value = 'pat char'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(60);
    const row = q('#find-results .find-row'); L.push('result: ' + (row ? row.innerText.replace(/\s+/g, ' ').slice(0, 80) : 'none'));
    L.push('box kept focus: ' + (document.activeElement === inp));
    q('[data-act="find-me"]').click(); await w(80);
    const card = q('.me-card'); L.push('my game card: ' + (card ? /Charlie/.test(card.innerText) && /Piste|waiting/.test(card.innerText) : false));
    // play round 1, then a round drawn "elsewhere"
    for (const m of C.MS().filter(m => m.a && m.b && !m.done && !m.bye)) await C.recordResult(m.id, 13, 5, true);
    await w(60); await C.addDraw(C.drawSwissRound(C.T(), C.MS())); await w(200);
    S.seenDraws[C.T().id] = [1, 0]; S.selfDraw = false; C.render(); await w(60);
    const al = q('#roundalert'); L.push('alert: ' + (!al.hidden) + ' | ' + al.innerText.replace(/\s+/g, ' ').replace('✕', '').trim());
    q('[data-act="alert-close"]')?.click(); await w(30); L.push('alert closed: ' + al.hidden);
    // standings on a phone
    q('[data-tab="standings"]').click(); await w(80);
    const me = q('tr.me b'); L.push('my row: ' + (me ? me.textContent : 'none'));
    const vis = () => [...document.querySelectorAll('main thead th')].filter(th => getComputedStyle(th).display !== 'none').map(th => th.textContent).join(',');
    L.push('phone columns: ' + vis()); L.push('sticky header: ' + getComputedStyle(q('main thead th')).position);
    q('[data-act="st-cols"]').click(); await w(60); L.push('all columns: ' + vis());
    // forget me
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="find-clear"]').click(); await w(80); L.push('cleared: ' + !!q('#find-q'));
    const find = async name => { const i = q('#find-q'); i.value = name; i.dispatchEvent(new Event('input', { bubbles: true })); await w(60); const r = q('#find-results .find-row .who'); return r ? r.innerText.replace(/\s+/g, ' ') : 'none'; };
    // a team with the bye in round 1 (5 teams)
    document.activeElement?.blur(); q('[data-act="new-t"]').click(); await w(60); const t2 = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t2, { name: 'Bye', system: 'swiss', checkin: false, swissRounds: 3 });
    ['Golf', 'Hotel', 'India', 'Juliet', 'Kilo'].forEach((n, i) => t2.teams.push({ id: 'b' + i, name: n, players: ['Sam ' + n], active: true }));
    await S.store.setTournament(t2); S.tournaments[t2.id] = t2; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    const bye = C.MS().find(m => m.bye); const byeName = t2.teams.find(e => e.id === bye.a[0]).name;
    L.push('bye team in round 1: ' + (await find(byeName)).replace(/^.*?(Bye this round\.|No game drawn yet\.).*$/, '$1'));
    // Swiss, 7 teams, 2 rounds, final for the top 2: the round-2 bye team, not in the final
    document.activeElement?.blur(); q('[data-act="new-t"]').click(); await w(60); const t3 = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t3, { name: 'Bye final', system: 'swiss', checkin: false, swissRounds: 2 });
    ['Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo'].forEach((n, i) => t3.teams.push({ id: 'c' + i, name: n, players: ['Lou ' + n], active: true }));
    await S.store.setTournament(t3); S.tournaments[t3.id] = t3; await w(30);
    await C.savePlan(pl => { pl.brackets = [{ id: 'A', name: 'Final', from: 1, to: 2, third: false }]; }); await w(60);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    const playOpen = async () => { for (const m of C.MS().filter(m => m.a && m.b && !m.done && !m.bye)) await C.recordResult(m.id, 13, 6, true); await w(100); };
    await playOpen(); await C.addDraw(C.drawSwissRound(C.T(), C.MS())); await w(200);
    const bye2 = C.MS().find(m => m.bye && m.round === 2); const bye2Name = C.T().teams.find(e => e.id === bye2.a[0]).name;
    // one round-2 game finished, the rest still being played
    const r2open = C.MS().filter(m => m.round === 2 && m.a && m.b && !m.done); await C.recordResult(r2open[0].id, 13, 6, true); await w(60);
    L.push('bye team in its bye round: ' + (await find(bye2Name)).replace(/^.*?(Bye this round\.|No game right now\. Last game: .*|No game drawn yet\.)$/, '$1'));
    await playOpen(); await C.startKnockouts(); await w(300); q('[data-tab="draw"]').click(); await w(60);
    const fin = C.MS().find(m => m.stage === 'ko'); L.push('final drawn: ' + !!(fin?.a && fin?.b) + ' | bye team in it ' + [...(fin?.a || []), ...(fin?.b || [])].includes(bye2.a[0]));
    L.push('bye team during the final: ' + (await find(bye2Name)).replace(/^.*?(Bye this round\.|No game right now\. Last game: .*|No game drawn yet\.)$/, '$1'));
    // last game in French: back on the first competition, round 2 played 13–7, no round 3 yet
    document.activeElement?.blur(); S.tid = t.id; S.matches = {}; C.watchMatches ? C.watchMatches() : 0; C.render(); await w(100); q('[data-tab="draw"]').click(); await w(60);
    for (const m of C.MS().filter(m => m.a && m.b && !m.done && !m.bye)) await C.recordResult(m.id, 13, 7, true);
    await w(60); C.render(); await w(40);
    const r2 = C.MS().find(m => m.round === 2 && !m.bye); const winner = C.T().teams.find(e => e.id === r2.a[0]).name;
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80);
    const fr = await find(winner); L.push('fr last game: ' + (fr.match(/Dernière partie.*/) || [fr])[0]);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); }
    return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/find-game.png' }); console.log('errs', errs); await b.close();
})();
