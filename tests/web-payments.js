// Payments (payments-registration) on the website: organisers tick teams as paid in Registration; the ticks live in
// tournaments/{tid}/private/payments, which only the competition's organisers (and the admin) can read or change, in the
// shape { paid: { id: { at, by } } }. Two organisers ticking different teams both keep theirs; the admin's delete removes it.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const ADMIN = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8').match(/token\.email in \['([^']+)'/)[1];
  const mk = async (n, width = 1100) => { const c = await b.newContext({ viewport: { width, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const raw = (p, op, pth, data) => p.evaluate(async ([op, pth, data]) => { try { const r = await window.__testRaw[op](pth, data); return op === 'get' ? r : 'ok'; } catch (e) { return 'denied ' + (e.code || e.message); } }, [op, pth, data]);
  const ok = r => r === 'ok' || (r && typeof r === 'object');

  // the admin: open testing off, so a visitor can't edit someone else's competition
  const AD = await mk('admin'); await AD.goto(base + '#admin'); await AD.waitForFunction(() => !!window.__testGoogle, null, { timeout: 30000 }); await w(1500);
  await AD.evaluate(e => window.__testGoogle(e), ADMIN); await w(3500);
  await AD.evaluate(() => window.__testSetSite({ openTesting: false })); await w(500);

  // the owner makes a competition with three teams and ticks one as paid
  const A = await mk('A'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500); const tid = await A.evaluate(() => location.hash.slice(1));
  await A.click('[data-act="wiz-skip"]'); await w(800); await A.click('[data-tab="entries"]'); await w(400);
  await A.fill('#bulk', 'Hitchin A\nLuton B\nStevenage C'); await A.click('#bulk-form button[type=submit]'); await w(1500);
  const ids = await A.evaluate(() => window.__carreau.T().teams.map(x => x.id));
  const organiser = (await A.$$('[data-act="pay"]')).length === 3;
  await A.click(`[data-act="pay"][data-id="${ids[0]}"]`); await w(1500);
  const doc0 = await raw(A, 'get', `tournaments/${tid}/private/payments`);
  const saved = !!doc0?.paid?.[ids[0]] && typeof doc0.paid[ids[0]].at === 'number' && doc0.paid[ids[0]].by === await A.evaluate(() => window.__testUid());
  const summary = await A.textContent('#pay-count');

  // a visitor (spectator): no buttons, never reads the payments, and the rules refuse them either way
  const V = await mk('V', 390); await V.goto(base + '#' + tid); await w(4000);
  const spectator = await V.evaluate(() => !!document.querySelector('[data-act="pay"], #pay-count') || !!window.__carreau.S.payW);
  log(`paid button: organiser ${organiser} | spectator ${spectator}`);
  log(`one tap saved: ${saved} | summary ${summary.trim()}`);
  const vRead = await raw(V, 'get', `tournaments/${tid}/private/payments`);
  const vWrite = await raw(V, 'set', `tournaments/${tid}/private/payments`, { paid: { [ids[1]]: { at: 1, by: 'x' } } });

  // a second organiser, from the organiser link
  const codes = await raw(A, 'get', `tournaments/${tid}/private/codes`);
  const B = await mk('B', 390); await B.goto(`${base}#${tid}.${codes.edit}`); await w(5000);
  await B.evaluate(() => { const S = window.__carreau.S; S.tab = 'entries'; window.__carreau.render(); }); await w(1500);
  const bSees = await B.evaluate(() => document.querySelectorAll('[data-act="pay"]').length);
  // both tick a different team at the same moment
  const setP = (p, id) => p.evaluate(async ([tid, id]) => { try { await window.__carreau.S.store.setPayment(tid, id, { at: Date.now(), by: window.__testUid() }); return 'ok'; } catch (e) { return 'denied ' + e.code; } }, [tid, id]);
  const [aW, bW] = await Promise.all([setP(A, ids[2]), setP(B, ids[1])]); await w(1000);
  const both = await raw(A, 'get', `tournaments/${tid}/private/payments`);
  const bad1 = await raw(A, 'set', `tournaments/${tid}/private/payments`, { paid: both.paid, extra: 1 });
  const bad2 = await raw(A, 'set', `tournaments/${tid}/private/payments`, { paid: 'all' });
  log(`rules: owner writes ${ok(aW)} | organiser link writes ${ok(bW) && bSees === 3} | stranger reads ${ok(vRead)} | stranger writes ${ok(vWrite)} | bad shape ${ok(bad1) || ok(bad2)}`);
  log(`two organisers: both ticks kept ${!!(both?.paid?.[ids[0]] && both.paid[ids[1]] && both.paid[ids[2]])}`);
  // untick: the key goes (a field delete, not null)
  await A.evaluate(() => { window.__carreau.render(); }); await w(300);
  await A.click(`[data-act="pay"][data-id="${ids[2]}"]`); await w(1500);
  const after = await raw(A, 'get', `tournaments/${tid}/private/payments`);
  log(`untick removes the key: ${!(ids[2] in (after?.paid || {})) && !!after?.paid?.[ids[1]]}`);
  await A.screenshot({ path: process.env.OUT + '/web-payments.png' });

  // the admin deletes the competition: the payments go with it
  await AD.evaluate(() => { location.hash = 'admin'; }); await w(2500);
  await AD.evaluate(id => document.querySelector(`[data-act="admin-del"][data-id="${id}"]`).click(), tid); await w(300);
  await AD.evaluate(id => document.querySelector(`[data-act="admin-del-yes"][data-id="${id}"]`).click(), tid); await w(3000);
  log(`admin delete removes payments: ${(await raw(AD, 'get', `tournaments/${tid}/private/payments`)) === null}`);
  await AD.evaluate(() => window.__testSetSite({ openTesting: true })); await w(500); // leave the site as the other tests expect it
  log('errs', errs); await b.close();
})();
