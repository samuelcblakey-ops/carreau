const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.WEB_URL); await new Promise(r => setTimeout(r, 3500));
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)); const L = [];
    document.querySelector('[data-act="new-t"]').click(); await w(2500);
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Shoot web', entry: 'shooting', system: 'knockout', shootFormat: 'ko8', koThird: true, checkin: false });
    t.players = Array.from({ length: 10 }, (_, i) => ({ id: 'p' + i, name: 'Shooter ' + i, active: true })); await S.store.setTournament(t); await w(1500);
    const fill = (pre, base) => { const side = pre === 'sa' ? 'a' : 'b'; const n = document.querySelectorAll(`[data-act="shot-cell"][data-side="${side}"]`).length;
      for (let i = 0; i < n; i++) { document.querySelectorAll(`[data-act="shot-cell"][data-side="${side}"]`)[i].click(); document.querySelector(`[data-act="cell-pick"][data-v="${[0, 1, 3, 5][(i + base) % 4]}"]`).click(); } };
    document.querySelector('[data-tab="draw"]').click(); await w(300); document.querySelector('[data-act="first-draw"]').click(); await w(2500);
    for (const m of C.MS().filter(m => m.stage === 'shoot')) { document.querySelector('[data-tab="draw"]').click(); await w(150); document.querySelector(`[data-shoot="${m.id}"]`).click(); await w(200); document.querySelector('[data-act=\"shoot-mode\"]')?.click(); await w(60); fill('sa', +m.a[0].slice(1)); document.querySelector('[data-act="shoot-save"][data-final="1"]').click(); await w(700); }
    document.querySelector('[data-tab="draw"]').click(); await w(300); document.querySelector('[data-act="shoot-next"]').click(); await w(2500);
    let g = 0; while (g++ < 20) { const live = C.MS().filter(m => m.shoot && !m.done && m.a && m.b); if (!live.length) break; const m = live[0];
      document.querySelector('[data-tab="draw"]').click(); await w(150); document.querySelector(`[data-match="${m.id}"]`).click(); await w(250); document.querySelector('[data-act=\"shoot-mode\"]')?.click(); await w(60);
      fill('sa', 1); fill('sb', 2); document.querySelector('[data-act="shoot-save"][data-final="1"]').click(); await w(700);
      if (document.querySelector('input[name="sw"]')) { document.querySelector('input[name="sw"][value="a"]').checked = true; document.querySelector('[data-act="shoot-save"][data-final="1"]').click(); await w(700); } }
    await w(1500);
    const bk = C.T().brackets[0]; const fin = C.MS().find(m => m.shoot && m.round === bk.rounds && !m.third); const third = C.MS().find(m => m.shoot && m.third);
    L.push('final sides ' + !!(fin.a && fin.b) + ' done ' + fin.done); L.push('third sides ' + !!(third.a && third.b) + ' done ' + third.done);
    L.push(C.MS().filter(m => m.shoot).map(m => `${m.id}:${m.a}/${m.b}:${m.done}`).join(' '));
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
