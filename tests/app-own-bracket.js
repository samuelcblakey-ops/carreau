// Knockouts: a bracket published by someone else (the World Championships, say), set by hand one first-round game per line.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const width of [390, 1100]) {
    const p = await b.newPage({ viewport: { width, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = [];
      const NATIONS = ['🇮🇹 Italy (ITA)', 'Canada (CAN)', '🇫🇷 France (FRA)', 'China (CHN)', 'Spain (ESP)', 'Japan (JPN)', 'Mali (MLI)', 'Benin (BEN)', 'Thailand (THA)', 'Madagascar (MAD)',
        'Belgium (BEL)', 'Germany (GER)', 'Netherlands (NED)', 'Portugal (POR)', 'Tunisia (TUN)', 'Morocco (MAR)', 'Algeria (ALG)', 'Senegal (SEN)', 'Chinese Taipei (TPE)', 'Laos (LAO)',
        'Cambodia (CAM)', 'Vietnam (VIE)', 'Switzerland (SUI)', 'Denmark (DEN)'];
      const make = async (cfg, names, indiv) => { q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
        Object.assign(t, cfg, { checkin: false });
        names.forEach((n, i) => indiv ? t.players.push({ id: 'p' + i, name: n, active: true }) : t.teams.push({ id: 'T' + i, name: n, players: ['x'], active: true }));
        await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); q('[data-tab="draw"]').click(); await w(60); return t; };
      const fill = async text => { const x = q('#own-text'); x.value = text; x.dispatchEvent(new Event('input', { bubbles: true })); q('[data-act="own-save"]').click(); await w(300); };
      const name = id => C.T().teams.find(x => x.id === id)?.name || C.T().players.find(x => x.id === id)?.name;
      const code = id => name(id).match(/\((\w+)\)/)[1];
      // a knockout-only competition: 8 teams with byes and 8 games, typed in mixed order
      await make({ name: 'Worlds bracket', system: 'knockout', koThird: false }, NATIONS);
      q('[data-act="own-bracket"]').click(); await w(80);
      L.push(`own bracket box: ${q('#modal h3')?.textContent} | font ${getComputedStyle(q('#own-text')).fontSize}`);
      await fill('ITA v CAN\nFRA v bye\nCHN v ESP');
      L.push(`wrong count: ${q('.own-errs div')?.textContent}`);
      await fill('ITA v bye\nFRA v Narnia');
      L.push(`unknown team: ${q('.own-errs div:nth-child(1)')?.textContent}`);
      await fill('ITA v bye\nbye v bye');
      L.push(`two byes: ${q('.own-errs div')?.textContent}`);
      await fill('ITA v bye\nItaly v CAN');
      L.push(`twice: ${q('.own-errs div')?.textContent}`);
      const C3 = NATIONS.map(n => n.match(/\((\w+)\)/)[1]);
      const lines = ['Italy (ITA) v bye', 'CAN v CHN', 'france vs bye', 'ESP - JPN', 'bye v MLI', 'BEN v THA', 'MAD v bye', 'BEL v GER', 'NED v bye', 'POR v TUN', 'MAR v bye', 'ALG v SEN', 'TPE v bye', 'LAO v CAM', 'VIE v bye', 'SUI v DEN'];
      await fill(lines.join('\n'));
      const r1 = C.MS().filter(m => m.bracket === 'A' && m.round === 1).sort((a, b) => a.order - b.order), br = C.T().brackets[0];
      L.push(`own bracket 16 lines: r1 games ${r1.filter(m => !m.bye).length}, byes ${r1.filter(m => m.bye).length} | size ${br.size} own ${br.own} draw own ${C.T().draws.find(d => d.id === 'A').own}`);
      L.push(`own bracket order kept: line 1 top = ${name(r1[0].a[0])} | line 2 ${code(r1[1].a[0])} v ${code(r1[1].b[0])} | line 5 ${code(r1[4].a[0])} | line 4 ${code(r1[3].a[0])}-${code(r1[3].b[0])}`);
      const r2 = () => C.MS().filter(m => m.bracket === 'A' && m.round === 2).sort((a, b) => a.order - b.order);
      L.push(`bye advanced: ${name(r2()[0].a[0])} in r2`);
      await C.recordResult(r1[1].id, 13, 6, true); await w(150);
      L.push(`winner moves on: r2 has ${name(r2()[0].b?.[0]) || 'nobody'}`);
      q('[data-tab="draw"]').click(); await w(80);
      // Swiss with a plan of two brackets: main set by hand, the plate drawn by SN Pétanque
      await make({ name: 'Plan', system: 'swiss', swissRounds: 1, koPlan: { seeding: 'seeded', brackets: [{ id: 'A', name: 'Main knockout', from: 1, to: 4, third: false }, { id: 'B', name: 'Plate', from: 5, to: 8, third: false }] } }, NATIONS.slice(0, 8));
      q('[data-act="first-draw"]').click(); await w(300);
      for (const m of C.MS().filter(m => m.stage === 'swiss' && !m.done)) await C.recordResult(m.id, 13, 5, true);
      await w(150); q('[data-tab="draw"]').click(); await w(80);
      L.push(`plan buttons: ${[...document.querySelectorAll('[data-act="own-bracket"]')].map(x => x.textContent).join(' | ')}`);
      q('[data-act="own-bracket"][data-k="A"]').click(); await w(80);
      L.push(`plan box: ${q('#modal h3')?.textContent}`);
      await fill('ITA v FRA\nESP v MLI');
      L.push(`after main: plate button ${!!q('[data-act="own-bracket"][data-k="B"]')} | main button ${!!q('[data-act="own-bracket"][data-k="A"]')} | draw ${!!q('[data-act="start-kos"]')}`);
      q('[data-act="start-kos"]').click(); await w(400);
      const bs = C.T().brackets; const A = bs.find(x => x.id === 'A'), B = bs.find(x => x.id === 'B');
      const Bms = C.MS().filter(m => m.bracket === 'B' && m.round === 1);
      L.push(`second bracket drawn normally while main set by hand: ${A?.own && B && !B.own && Bms.length === 2 && Bms.every(m => m.a && m.b) ? 'ok' : JSON.stringify(bs)}`);
      L.push(`main kept: ${C.MS().filter(m => m.bracket === 'A' && m.round === 1).sort((a, b) => a.order - b.order).map(m => code(m.a[0]) + '-' + code(m.b[0])).join(' ')} | panel gone ${!q('[data-act="start-kos"]')}`);
      // undo the hand-set bracket while no game has finished
      q('[data-act="undo"][data-id="A"]')?.click(); await w(300);
      L.push(`undo main: brackets ${C.T().brackets.map(x => x.id).join(',')} | main can be set again ${!!q('[data-act="own-bracket"][data-k="A"]')}`);
      // precision shooting: the knockout set by hand
      const SH = ['Ana Silva (POR)', 'Kim Lee (KOR)', 'Tom Hart (ENG)', 'Joe Bell (USA)', 'Mia Rossi (ITA)', 'Lea Petit (FRA)', 'Somchai (THA)', 'Aiko Sato (JPN)'];
      await make({ entry: 'shooting', system: 'knockout', shootFormat: 'ko8', name: 'Shooting', koThird: true }, SH, true);
      q('[data-act="first-draw"]').click(); await w(150);
      const cells = (side, k) => { const n = document.querySelectorAll(`[data-act="shot-cell"][data-side="${side}"]`).length;
        for (let i = 0; i < n; i++) { document.querySelectorAll(`[data-act="shot-cell"][data-side="${side}"]`)[i].click(); q(`[data-act="cell-pick"][data-v="${i < k ? 5 : 0}"]`).click(); } };
      for (const m of C.MS().filter(m => m.stage === 'shoot')) { q('[data-tab="draw"]').click(); await w(30); q(`[data-shoot="${m.id}"]`).click(); await w(40); q('[data-act="shoot-mode"]')?.click(); await w(60);
        cells('a', m.order + 1); q('[data-act="shoot-save"][data-final="1"]').click(); await w(60); }
      q('[data-tab="draw"]').click(); await w(60);
      q('[data-act="own-bracket"]').click(); await w(80);
      L.push(`shooting box: ${q('#modal h3')?.textContent} | button ${[...document.querySelectorAll('#main [data-act="own-bracket"]')].map(x => x.textContent).join()}`);
      await fill('POR v KOR\nana silva v THA\nENG v USA\nITA v FRA\nTHA v JPN');
      L.push(`shooting errors: ${q('.own-errs div')?.textContent}`);
      await fill('Kim Lee v ana silva\nENG v USA\nITA v FRA\nTHA v JPN');
      const sk = C.MS().filter(m => m.shoot && m.round === 1).sort((a, b) => a.order - b.order);
      L.push(`shooting knockout set by hand: ${sk.length} duels | first ${name(sk[0].a[0])} v ${name(sk[0].b[0])} | all shoot ${C.MS().filter(m => m.bracket === 'A').every(m => m.shoot)} | third ${!!C.MS().find(m => m.bracket === 'A' && m.third)}`);
      return L; });
    out.forEach(l => console.log(width === 390 ? l : `desktop: ${l}`));
    await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: `test-results/own-bracket-shoot-${width}.png`, fullPage: true });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth); console.log(`${width === 390 ? '' : 'desktop: '}no sideways scroll: ${sw <= width}`);
    await p.close();
  }
  // the bracket view and the box, for the screenshots
  for (const width of [390, 1100]) {
    const p = await b.newPage({ viewport: { width, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Nations Cup', system: 'knockout', checkin: false });
      ['🇮🇹 Italy (ITA)', '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England (ENG)', '🇫🇷 France (FRA)', 'Chinese Taipei (TPE)', 'Spain (ESP)', 'Japan (JPN)'].forEach((n, i) => t.teams.push({ id: 'T' + i, name: n, players: ['x'], active: true }));
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); q('[data-tab="draw"]').click(); await w(60);
      q('[data-act="own-bracket"]').click(); await w(80); q('#own-text').value = 'Italy v bye\nENG v TPE\nFRA v ESP\nbye v JPN'; q('#own-text').dispatchEvent(new Event('input', { bubbles: true })); });
    await p.screenshot({ path: `test-results/own-bracket-box-${width}.png` });
    await p.evaluate(async () => { document.querySelector('[data-act="own-save"]').click(); await new Promise(r => setTimeout(r, 400)); window.scrollTo(0, 0); });
    await p.screenshot({ path: `test-results/own-bracket-view-${width}.png`, fullPage: true });
    console.log(`${width === 390 ? '' : 'desktop: '}bracket view sideways scroll: ${await p.evaluate(() => document.documentElement.scrollWidth) > width}`);
    await p.close();
  }
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
