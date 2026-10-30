// Admin clean-up: competitions with no teams/players, nothing drawn and no changes for 7 days are deleted from #admin
// (button, or automatically each time #admin opens). Examples, templates, recent and filled-in ones are kept, and a
// stale copy on the admin's screen can't delete a competition that has since been filled in on the server.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const mk = async n => { const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const REST = 'http://127.0.0.1:8080/v1/projects/demo-carreau/databases/(default)/documents';
  const H = { Authorization: 'Bearer owner', 'content-type': 'application/json' };
  const val = v => Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(v) }
    : v && typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, val(x)])) } } : { stringValue: String(v) };
  const DAY = 864e5, now = Date.now();
  const put = (id, f) => fetch(`${REST}/tournaments/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, val(v)])) }) });
  const seed = (id, name, days, extra = {}) => put(id, { id, name, ownerUid: 'visitor-x', entry: 'teams', teams: [], players: [], archived: false, listed: false, created: now - days * DAY - 1000, updated: now - days * DAY, ...extra });
  const exists = async id => (await fetch(`${REST}/tournaments/${id}`, { headers: H })).status === 200;
  const team = i => ({ id: 'e' + i, name: 'Team ' + i, players: ['a'], active: true });
  await seed('cuOld', 'CU old empty', 10);
  await seed('cuMelee', 'CU old empty melee', 30, { entry: 'melee' });
  await seed('cuArch', 'CU old empty archived', 12, { archived: true });
  await seed('cuNew', 'CU new empty', 2);
  await seed('cuFull', 'CU old full', 20, { teams: [team(1), team(2), team(3)] });
  await seed('cuPlayers', 'CU old melee players', 20, { entry: 'melee', players: [{ id: 'p1', name: 'Ann' }] });
  await seed('cuEx', 'CU old example', 40, { listed: true });
  await seed('cuTpl', 'CU old template', 40, { template: true });
  await seed('cuDrawn', 'CU old drawn', 15, { brackets: [{ id: 'k1', name: 'Main' }] });
  await seed('cuStale', 'CU stale copy', 9);

  const AD = await mk('admin'); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(4000);
  const txt = async sel => ((await AD.textContent(sel).catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  log('panel:', await txt('#adm-clean .spread'), '|', /Manual/.test(await txt('#adm-clean [aria-pressed="true"]')));
  log('ready:', await txt('#adm-clean-now'));
  await AD.click('[data-act="adm-clean-list"]'); await w(300);
  const list = await txt('#adm-clean-list');
  log('list:', ['CU old empty ·', 'CU old empty melee', 'CU old empty archived', 'CU stale copy'].every(n => list.includes(n)),
    '| keeps:', !['CU new', 'CU old full', 'CU old melee players', 'CU old example', 'CU old template', 'CU old drawn'].some(n => list.includes(n)), '| age shown:', /untouched 30 days/.test(list));
  // someone fills in "CU stale copy" on the server; the admin's screen still holds the old empty copy
  await put('cuStale', { id: 'cuStale', name: 'CU stale copy', ownerUid: 'visitor-x', entry: 'teams', teams: [team(1)], players: [], archived: false, listed: false, created: now - 9 * DAY, updated: Date.now() });
  await w(1000);
  await AD.evaluate(() => { const S = window.__carreau.S; S.tournaments.cuStale = { ...S.tournaments.cuStale, teams: [], updated: Date.now() - 9 * 864e5 }; });
  await AD.click('[data-act="adm-clean"]'); await w(200);
  log('confirm:', await txt('#adm-clean-now'));
  await AD.click('[data-act="adm-clean-yes"]');
  for (let i = 0; i < 100; i++) { await w(200); if (/deleted/.test(await AD.textContent('#toast').catch(() => ''))) break; }
  log('toast:', await AD.textContent('#toast'));
  const st = {}; for (const id of ['cuOld', 'cuMelee', 'cuArch', 'cuNew', 'cuFull', 'cuPlayers', 'cuEx', 'cuTpl', 'cuDrawn', 'cuStale']) st[id] = await exists(id);
  log('deleted:', !st.cuOld && !st.cuMelee && !st.cuArch, '| kept:', st.cuNew && st.cuFull && st.cuPlayers && st.cuEx && st.cuTpl && st.cuDrawn && st.cuStale);
  await w(800);
  log('after:', await txt('#adm-clean-now'), '|', await txt('#adm-clean-last'));
  // automatic: switch on, then a new abandoned competition is tidied the next time #admin opens
  await AD.click('[data-act="adm-clean-auto"][data-on="1"]'); await w(1200);
  log('auto on:', await txt('#adm-clean .spread'));
  await seed('cuLater', 'CU later empty', 8); await w(1500);
  await AD.evaluate(() => { location.hash = ''; }); await w(800);
  await AD.evaluate(() => { location.hash = 'admin'; });
  for (let i = 0; i < 50; i++) { await w(200); if (!(await exists('cuLater'))) break; }
  await w(800);
  log('auto:', !(await exists('cuLater')), '|', await AD.textContent('#toast'), '|', await txt('#adm-clean-last'));
  const site = await (await fetch(`${REST}/config/site`, { headers: H })).json();
  log('saved:', site.fields?.cleanupAuto?.booleanValue, site.fields?.cleanupLast?.mapValue?.fields?.auto?.booleanValue);
  // a visitor can't switch it
  const V = await mk('visitor'); await V.goto(base); await w(3500);
  log('visitor switch:', (await fetch(`${REST}/config/site?updateMask.fieldPaths=cleanupAuto`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: { cleanupAuto: { booleanValue: false } } }) })).status);
  await AD.screenshot({ path: process.env.OUT + '/admin-cleanup.png', fullPage: true });
  // leave the switch off for the other tests
  await AD.click('[data-act="adm-clean-auto"][data-on="0"]'); await w(800);
  log('errs', errs); await b.close();
})();
