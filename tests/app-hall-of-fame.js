// Hall of Fame, publishing (PR 1): who counts as winner and runner-up in every format, the publish sheet
// (level, country, region, parts, note), the stored snapshot, Update / Remove, and the sheet in French.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const team = i => ({ id: 'e' + i, name: 'Team ' + i, players: ['P' + i + 'a', 'P' + i + 'b'], active: true });
    const mk = async (cfg, n, draw = true) => { q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { checkin: false, wizard: false, teams: Array.from({ length: n }, (_, i) => team(i)) }, cfg);
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(150);
      if (draw) { q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(300); } };
    // the lower team number wins every game, so the order is known
    const num = side => Math.min(...(side || []).map(id => +String(id).replace(/\D/g, '') || 0));
    const playAll = async () => { for (let k = 0; k < 8; k++) { const open = C.MS().filter(m => m.a && m.b && !m.done); if (!open.length) break;
      for (const m of open) { const aw = num(m.a) < num(m.b); await C.recordResult(m.id, aw ? 13 : 7, aw ? 7 : 13, true); } await w(150); } };
    const res = () => C.hofResult(C.T(), C.MS());
    const show = r => r.parts.map(x => `${x.name}${x.done ? ` ${x.winner?.name}${x.winner?.players?.length ? '(' + x.winner.players.join('+') + ')' : ''} > ${x.runnerUp?.name || '-'}` : ' -'}`).join(' ; ');

    // 1. straight knockout: the final
    await mk({ system: 'knockout', name: 'KO Cup', venue: 'Hitchin', date: '2026-09-20' }, 4);
    L.push(`ko before: ready ${res().ready}`);
    q('[data-tab="standings"]').click(); await w(80); L.push(`panel before result: ${!!q('[data-hof-panel]')}`);
    await playAll(); await w(200);
    L.push(`ko: ready ${res().ready} | ${show(res())}`);
    q('[data-tab="standings"]').click(); await w(150);
    L.push(`standings panel: ${txt(q('[data-hof-panel]'))}`);
    q('[data-tab="setup"]').click(); await w(150); L.push(`setup panel: ${!!q('[data-hof-panel] [data-act="hof-open"]')}`);
    q('[data-tab="draw"]').click(); await w(150);
    { const first = q('main .hof-top-wrap'); const before = !!first && !!(first.compareDocumentPosition(q('main h2')) & Node.DOCUMENT_POSITION_FOLLOWING); L.push(`draw top: ${before} | ${txt(first?.querySelector('[data-act="hof-open"]'))}`); }
    q('[data-tab="standings"]').click(); await w(150);
    q('[data-hof-panel] [data-act="hof-open"]').click(); await w(150);
    const sheet = q('#modal .hof-sheet');
    L.push(`sheet: ${txt(sheet.querySelector('h3'))} | levels ${qa('#modal .hof-pick').map(x => txt(x) + (x.classList.contains('on') ? '*' : '')).join(',')} | country ${q('#modal [data-hof="country"]').value} | first countries ${qa('#modal [data-hof="country"] option').slice(0, 4).map(o => o.textContent).join(',')}`);
    L.push(`sheet parts: ${qa('#modal .hof-part').map(x => txt(x)).join(' ; ')} | public line ${txt(sheet).includes('Team and player names will be public.')}`);
    q('#modal [data-act="hof-level"][data-k="regional"]').click(); await w(60);
    const reg = q('#modal [data-hof="region"]'); reg.value = 'Chiltern'; reg.dispatchEvent(new Event('input', { bubbles: true }));
    const note = q('#modal [data-hof="note"]'); note.value = 'Club day'; note.dispatchEvent(new Event('input', { bubbles: true }));
    L.push(`regional picked: ${q('#modal .hof-pick.hof-regional').classList.contains('on')} | colour ${getComputedStyle(q('#modal .hof-pick.hof-regional')).backgroundColor}`);
    q('#modal [data-act="hof-save"]').click(); await w(250);
    const e1 = S.hof[C.T().id];
    L.push(`saved: modal ${!!q('#modal .modal')} | toast ${txt(q('#toast'))} | ${e1.level} ${e1.country} ${e1.region} | note ${e1.note} | parts ${e1.parts.map(x => x.name + ':' + x.winner.name + '/' + x.runnerUp.name).join(',')} | hidden ${e1.hidden} | ${e1.name} ${e1.date} ${e1.venue} ${e1.system}`);
    L.push(`no nested arrays: ${!JSON.stringify(e1).match(/\[\s*\[/)}`);
    L.push(`panel after: ${txt(q('[data-hof-panel]'))}`);
    q('[data-tab="draw"]').click(); await w(150); L.push(`draw top after publishing: ${!!q('.hof-top')}`); q('[data-tab="standings"]').click(); await w(150);
    // a correction to the final: the organiser is asked to update
    const fin = C.MS().find(m => m.stage === 'ko' && m.round === C.T().brackets[0].rounds && !m.third);
    const ru = e1.parts[0].runnerUp.name; const aW = fin.sa > fin.sb; await C.recordResult(fin.id, aW ? 5 : 13, aW ? 13 : 5, true); await w(200); q('[data-tab="standings"]').click(); await w(100);
    L.push(`changed: ${!!q('.hof-changed')} | ${txt(q('.hof-changed'))}`);
    q('[data-tab="draw"]').click(); await w(150); L.push(`draw top after correction: ${!!q('.hof-top .hof-changed')}`); q('[data-tab="standings"]').click(); await w(150);
    q('.hof-changed [data-act="hof-open"]').click(); await w(150);
    L.push(`update sheet: ${txt(q('#modal h3'))} | level kept ${q('#modal .hof-pick.hof-regional').classList.contains('on')} | region kept ${q('#modal [data-hof="region"]').value}`);
    q('#modal [data-act="hof-save"]').click(); await w(250);
    const e2 = S.hof[C.T().id];
    L.push(`updated: winner is old runner-up ${e2.parts[0].winner.name === ru} | published kept ${e2.publishedAt === e1.publishedAt} | changed gone ${!q('.hof-changed')} | toast ${txt(q('#toast'))}`);
    // admin-set fields stay as they are when the organiser updates
    await S.store.setHof(C.T().id, Object.assign({}, e2, { level: 'open', levelSetBy: 'admin' })); await w(150);
    q('[data-hof-panel] [data-act="hof-open"]').click(); await w(150);
    L.push(`locked level: disabled ${q('#modal .hof-pick').disabled} | note ${txt(q('#modal .hof-levels').parentElement).includes('The site admin set the level.')}`);
    q('#modal [data-act="hof-save"]').click(); await w(250);
    L.push(`after lock update: ${S.hof[C.T().id].level} ${S.hof[C.T().id].levelSetBy}`);
    // remove, with a confirm step
    q('[data-hof-panel] [data-act="hof-remove"]').click(); await w(80);
    L.push(`confirm: ${txt(q('[data-hof-panel] .err'))}`);
    q('[data-act="hof-remove-yes"]').click(); await w(200);
    L.push(`removed: ${S.hof[C.T().id]} | button back ${!!q('[data-hof-panel] [data-act="hof-open"]')} | toast ${txt(q('#toast'))}`);
    // untick everything
    q('[data-hof-panel] [data-act="hof-open"]').click(); await w(150);
    const cb = q('#modal [data-hof="part"]'); cb.checked = false; cb.dispatchEvent(new Event('input', { bubbles: true }));
    q('#modal [data-act="hof-save"]').click(); await w(100); L.push(`nothing ticked: ${txt(q('#modal .err'))}`);
    q('#modal [data-act="close"]').click(); await w(80);

    // 2. Swiss with no knockout: top two once every planned round is played
    await mk({ system: 'swiss', swissRounds: 2, name: 'Swiss day' }, 6);
    await playAll(); L.push(`swiss after round 1: ready ${res().ready}`);
    q('[data-tab="draw"]').click(); await w(80); (q('[data-act="draw-next"]') || q('[data-act="next-round"]') || q('[data-act="draw-round"]'))?.click(); await w(300);
    if (C.MS().filter(m => m.stage === 'swiss').length < 6) { await C.addDraw(C.drawSwissRound(C.T(), C.MS())); await w(200); }
    await playAll(); L.push(`swiss: ready ${res().ready} | ${show(res())}`);
    // a Swiss into Main / Plate knockouts: each final; the Plate not finished yet doesn't block the Main
    const before = C.MS().length;
    await C.savePlan(pl => { pl.brackets = [{ id: 'A', name: 'Main knockout', from: 1, to: 4, third: false }, { id: 'B', name: 'Plate', from: 5, to: 6, third: false }]; }); await w(100);
    await C.startKnockouts(); await w(300);
    L.push(`swiss+ko drawn: ${C.MS().length > before} | ready ${res().ready}`);
    for (let k = 0; k < 4; k++) { const open = C.MS().filter(m => m.a && m.b && !m.done && m.bracket === 'A'); if (!open.length) break; for (const m of open) { const aw = num(m.a) < num(m.b); await C.recordResult(m.id, aw ? 13 : 2, aw ? 2 : 13, true); } await w(150); }
    L.push(`main done: ready ${res().ready} | ${show(res())}`);

    // 3. round robin
    await mk({ system: 'roundrobin', name: 'RR' }, 4); await playAll(); L.push(`round robin: ready ${res().ready} | ${show(res())}`);

    // 4. leagues with no knockout: top two of each league
    await mk({ system: 'leagues', leagueCount: 2, name: 'Leagues' }, 8); await playAll();
    L.push(`leagues: ready ${res().ready} | parts ${res().parts.length} | ${res().parts.map(x => x.done && x.winner && x.runnerUp ? 'ok' : 'no').join(',')}`);

    // 5. mêlée: top two players
    q('[data-act="new-t"]').click(); await w(100);
    { const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Melee', entry: 'melee', format: 'doubles', system: 'swiss', swissRounds: 1, checkin: false, wizard: false,
        players: Array.from({ length: 8 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, active: true })) });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(150); await C.addDraw(C.drawMeleeRound(C.T(), C.MS())); await w(200); await playAll(); }
    const mr = res(); L.push(`melee: ready ${mr.ready} | winner is a player ${/^Player \d$/.test(mr.parts[0].winner?.name)} | players listed ${mr.parts[0].winner?.players.length}`);

    // 6. inter-club: top two clubs
    q('[data-act="new-t"]').click(); await w(100);
    { const t = JSON.parse(JSON.stringify(C.T())); const tm = (i, c) => ({ id: 'e' + i, name: 'T' + i, players: [], club: c, active: true });
      Object.assign(t, { name: 'Clubs', system: 'clubs', clubTeams: 1, checkin: false, wizard: false, teams: [tm(0, 'Hitchin'), tm(1, 'Luton'), tm(2, 'Bedford')],
        clubs: [{ id: 'c1', name: 'Hitchin', teams: ['e0'] }, { id: 'c2', name: 'Luton', teams: ['e1'] }, { id: 'c3', name: 'Bedford', teams: ['e2'] }], draws: [{ id: 'CL', kind: 'schedule', label: 'Fixtures' }] });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(100);
      const g = (id, a, b, ca, cb, sa, sb, done) => ({ id, stage: 'club', group: 'CL', round: 1, order: 0, a: [a], b: [b], ca, cb, sa, sb, done });
      await S.store.setMatch(t.id, g('m1', 'e0', 'e1', 'c1', 'c2', 13, 5, true)); await S.store.setMatch(t.id, g('m2', 'e0', 'e2', 'c1', 'c3', 13, 4, true)); await S.store.setMatch(t.id, g('m3', 'e1', 'e2', 'c2', 'c3', 6, 13, false)); await w(150);
      L.push(`clubs unfinished: ready ${res().ready}`);
      await S.store.setMatch(t.id, g('m3', 'e1', 'e2', 'c2', 'c3', 6, 13, true)); await w(150); }
    L.push(`clubs: ready ${res().ready} | ${show(res())}`);

    // 7. precision shooting final: first and second
    q('[data-act="new-t"]').click(); await w(100);
    { const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Shoot', entry: 'shooting', system: 'knockout', format: 'singles', shootFormat: 'final', checkin: false, wizard: false,
        players: [{ id: 's1', name: 'Ann', active: true }, { id: 's2', name: 'Bob', active: true }, { id: 's3', name: 'Cat', active: true }], draws: [{ id: 'F', kind: 'shoot', label: 'Final' }] });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(100);
      const sh = v => ({ A1: [v, v, v, v], A2: [v, 0, 0, 0], A3: [0, 0, 0, 0], A4: [0, 0, 0, 0], A5: [0, 0, 0, 0] });
      for (const [id, v, i] of [['s1', 3, 0], ['s2', 5, 1], ['s3', 1, 2]]) await S.store.setMatch(t.id, { id: 'F-' + id, stage: 'shoot', phase: 'F', group: 'F', round: 2, order: i, a: [id], b: null, shots: sh(v), done: true });
      await w(150); }
    L.push(`shooting final: ready ${res().ready} | ${show(res())}`);

    // 8. the sheet in French, with the French device default
    await mk({ system: 'knockout', name: 'Coupe' }, 2); await playAll();
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(150);
    q('[data-tab="standings"]').click(); await w(120);
    L.push(`fr panel: ${txt(q('[data-hof-panel] h3'))} | ${txt(q('[data-hof-panel] [data-act="hof-open"]'))}`);
    q('[data-hof-panel] [data-act="hof-open"]').click(); await w(150);
    L.push(`fr sheet: ${txt(q('#modal h3'))} | ${qa('#modal .hof-pick').map(x => txt(x)).join(',')} | ${txt(q('#modal .hof-part'))} | country name ${q('#modal [data-hof="country"] option:checked').textContent}`);
    q('#modal [data-act="close"]').click(); await w(60);
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(100);
    L.push(`names: ${C.hofCountryName('GB-SCT')} | ${C.hofCountryName('FR')} | ${C.hofCountryName('TH')}`);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n'));
  // the country a new entry starts on comes from the device's language region
  for (const loc of ['fr-FR', 'th-TH', 'en-US', 'en-AU', 'de-CH']) { const c2 = await b.newContext({ locale: loc }); const p2 = await c2.newPage(); await p2.goto(process.env.APP_URL);
    console.log(`default ${loc}: ${await p2.evaluate(() => window.__carreau.hofDefaultCountry())}`); await c2.close(); }
  console.log('errs', errs); await b.close();
})();
