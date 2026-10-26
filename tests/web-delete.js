// Admin delete: games are removed in batches (a 1,000-game competition clears in a few requests), several competitions
// at a time, and nothing is left behind.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const mk = async n => { const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const REST = 'http://127.0.0.1:8080/v1/projects/demo-carreau/databases/(default)/documents';
  const count = async tid => { let n = 0, tok = ''; do { const r = await fetch(`${REST}/tournaments/${tid}/matches?pageSize=300${tok ? '&pageToken=' + tok : ''}`, { headers: { Authorization: 'Bearer owner' } }); const j = await r.json(); n += (j.documents || []).length; tok = j.nextPageToken; } while (tok); return n; };
  const exists = async tid => (await fetch(`${REST}/tournaments/${tid}`, { headers: { Authorization: 'Bearer owner' } })).status === 200;
  const AD = await mk('admin'); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  await AD.click('[data-act="admin-exit"]'); await w(800);
  // competitions made in the app, then games written straight into the emulator: one with 1,000 games (three batches), four with 15
  const make = name => AD.evaluate(async name => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)); const before = S.tid;
    document.querySelector('[data-act="new-t"]').click(); for (let i = 0; i < 50 && (!S.tid || S.tid === before); i++) await w(100); await w(300);
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name, checkin: false, wizard: false }); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(300); return t.id; }, name);
  const games = async (tid, n) => { for (let i = 0; i < n; i += 400) {
    const writes = Array.from({ length: Math.min(400, n - i) }, (_, k) => ({ update: { name: `projects/demo-carreau/databases/(default)/documents/tournaments/${tid}/matches/g${i + k}`, fields: { id: { stringValue: `g${i + k}` }, round: { integerValue: 1 }, done: { booleanValue: true } } } }));
    await fetch('http://127.0.0.1:8080/v1/projects/demo-carreau/databases/(default)/documents:commit', { method: 'POST', headers: { Authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ writes }) }); } };
  const big = await make('Del big'); await games(big, 1000);
  const small = []; for (let i = 0; i < 4; i++) { const id = await make('Del small ' + i); await games(id, 15); small.push(id); }
  await w(2000);
  log('before: big games', await count(big), '| small games', (await Promise.all(small.map(count))).join(','));
  await AD.goto(base + '#admin'); await w(2500);
  await AD.fill('#adm-q', 'Del '); await AD.dispatchEvent('#adm-q', 'input'); await w(400);
  await AD.click('[data-act="adm-sel-all"]'); await w(200); await AD.click('[data-act="adm-bulk-del"]'); await w(200);
  const t0 = Date.now(); await AD.click('[data-act="adm-bulk-del-yes"]');
  for (let i = 0; i < 300; i++) { await w(200); if (/deleted/.test(await AD.textContent('#toast').catch(() => ''))) break; }
  const secs = (Date.now() - t0) / 1000;
  log('toast:', await AD.textContent('#toast'));
  log('after: big games', await count(big), 'doc', await exists(big), '| small', (await Promise.all(small.map(count))).join(','), 'docs', (await Promise.all(small.map(exists))).some(Boolean));
  log('quick:', secs < 30, `(${secs.toFixed(1)}s)`);
  log('errs', errs); await b.close();
})();
