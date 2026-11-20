// Swiss: a round drawn by someone else (a federation), typed in by the organiser one game per line.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const width of [390, 1100]) {
    const p = await b.newPage({ viewport: { width, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    const out = await p.evaluate(async full => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = [];
      window.__toasts = []; new MutationObserver(() => window.__toasts.push(q('#toast').textContent)).observe(q('#toast'), { childList: true, subtree: true, characterData: true });
      const NAMES = ['Italy (ITA)', 'Canada (CAN)', 'France (FRA)', 'China (CHN)', 'Spain (ESP)', 'Japan (JPN)', 'Mali (MLI)', 'Benin (BEN)'];
      const make = async name => { q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
        Object.assign(t, { name, system: 'swiss', checkin: false, swissRounds: 3 });
        NAMES.forEach((n, i) => t.teams.push({ id: 'T' + i, name: n, players: ['x'], active: true }));
        await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); q('[data-tab="draw"]').click(); await w(60); return t; };
      const open = async () => { const o = q('[data-act="own-round"]'); if (!o) { L.push("no own button: " + (q("main .panel.rp-live, main .panel.rp-ready")?.textContent || "")); return L; } o.click(); await w(80); };
      const fill = async (name, text) => { const n = q('#own-name'), x = q('#own-text');
        if (name != null) { n.value = name; n.dispatchEvent(new Event('input', { bubbles: true })); }
        x.value = text; x.dispatchEvent(new Event('input', { bubbles: true })); q('[data-act="own-save"]').click(); await w(300); };
      const code = id => C.T().teams.find(x => x.id === id).name.match(/\((\w+)\)/)[1];
      const games = gid => C.MS().filter(m => m.group === gid && !m.bye).sort((a, b) => a.order - b.order);
      const t = await make('Worlds mirror');
      L.push(`box: ${!!q('[data-act="own-round"]')} | modal font ${(await (async () => { await open(); const f = getComputedStyle(q('#own-text')).fontSize; return f; })())}`);
      L.push(`own box title: ${q('#modal h3').textContent} | name prefilled ${q('#own-name').value}`);
      // checks: nothing saved until they pass
      await fill(null, 'ITA v CAN\nNarnia v FRA\nCHN - ESP');
      L.push(`unknown team: ${q('.own-errs div')?.textContent}`);
      await fill(null, 'ITA v CAN\nItaly (ITA) vs FRA');
      L.push(`twice: ${q('.own-errs div')?.textContent}`);
      await fill(null, 'ita v Italy');
      L.push(`itself: ${q('.own-errs div')?.textContent}`);
      await fill(null, '\n  \n');
      L.push(`empty: ${q('.own-errs div')?.textContent} | rounds ${C.T().draws.length}`);
      if (full) { // 1100 px: the screenshot with errors at desktop width
      }
      await fill(null, 'ITA v CAN\nfrance vs China (CHN)\nESP-JPN\nMLI - Bénin');
      L.push(`own round 1: ${games('R1').map(m => code(m.a[0]) + '-' + code(m.b[0])).join(' ')}`);
      const d1 = C.T().draws.find(d => d.id === 'R1'); L.push(`own round name: ${d1.label} | own ${d1.own}`);
      L.push(`modal closed: ${!q('#modal .modal')}`);
      // score round 1: Mali win 13-0, the others 13-11
      for (const m of games('R1')) await C.recordResult(m.id, 13, m.a[0] === 'T6' ? 0 : 11, true);
      await w(150); q('[data-tab="standings"]').click(); await w(80);
      L.push(`after scores standings top: ${(q('main table tbody tr')?.textContent.match(/[A-Z][a-z]+ \(\w+\)/) || [''])[0]}`);
      q('[data-tab="draw"]').click(); await w(60);
      q('[data-act="next-round"]').click(); await w(400);
      L.push(`draw round 2 after own round: ${games('R2').length} games`);
      L.push(`round 2 label: ${C.T().draws.find(d => d.id === 'R2').label} own ${!!C.T().draws.find(d => d.id === 'R2').own}`);
      // round 3 by hand with a name and two teams left out and a rematch
      for (const m of games('R2')) await C.recordResult(m.id, 13, 7, true); await w(150); q('[data-tab="draw"]').click(); await w(60);
      const prev = games('R1')[0]; window.__toasts = [];
      await open(); if (!q("#own-text")) return L; await fill('Cadrage', `${code(prev.a[0])} v ${code(prev.b[0])}\nFRA v ESP\nCHN v JPN`);
      L.push(`left out: ${window.__toasts.join(' / ')}`);
      q('[data-act="draw-sel"][data-v="r-R3"]')?.click(); await w(80);
      L.push(`own round renamed: ${[...document.querySelectorAll('.draw-round h3')].map(h => h.textContent).find(x => x === 'Cadrage') || 'missing'}`);
      L.push(`context: ${C.MS().filter(m => m.group === 'R3').length} games | undo shown ${!!q('[data-act="undo"][data-id="R3"]')}`);
      // French: the round name stays as typed, the pre-filled name is translated
      q('[data-lang="fr"]').click(); await w(80);
      L.push(`french heading: ${[...document.querySelectorAll('.draw-round h3')].map(h => h.textContent).join(',')}`);
      await w(1600); q('[data-act="undo"][data-id="R3"]').click(); await w(300);
      L.push(`undo own round: rounds ${C.T().draws.filter(d => d.kind === 'round').length}`);
      q('[data-lang="en"]').click(); await w(80);
      // World Championship names have a flag first: typed sides match without it, messages show the name with its flag
      const fl = JSON.parse(JSON.stringify(C.T())); fl.id += 'f'; fl.name = 'Flags'; fl.draws = []; fl.teams = ['🇮🇹 Italy (ITA)', '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England (ENG)', 'Chinese Taipei (TPE)', '🇨🇦 Canada (CAN)'].map((n, i) => ({ id: 'F' + i, name: n, players: ['x'], active: true }));
      await S.store.setTournament(fl); S.tournaments[fl.id] = fl; S.tid = fl.id; S.matches = {}; C.render?.(); await w(60); q('[data-tab="draw"]').click(); await w(60);
      await open(); await fill(null, 'ITA v ENG\nItaly (ITA) v TPE');
      L.push(`flag name match: ITA, Italy (ITA) -> ${(q('.own-errs div')?.textContent || '').replace(' is in more than one game.', '')}`);
      await fill(null, 'italy v england\nchinese taipei - 🇨🇦 Canada (CAN)');
      L.push(`flag round: ${games('R1').map(m => C.T().teams.find(x => x.id === m.a[0]).name + ' v ' + C.T().teams.find(x => x.id === m.b[0]).name).join(' | ')}`);
      S.tid = t.id; S.matches = {}; C.render?.(); await w(100);
      await open(); return L; }, width > 400);
    out.forEach(l => console.log(width === 390 ? l : `desktop: ${l}`));
    await p.screenshot({ path: `test-results/own-round-box-${width}.png` });
    await p.evaluate(() => document.querySelector('[data-act="close"]').click()); await p.waitForTimeout(100);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: `test-results/own-round-draw-${width}.png`, fullPage: false });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth); console.log(`${width === 390 ? '' : 'desktop: '}no sideways scroll: ${sw <= width}`);
    await p.close();
  }
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
