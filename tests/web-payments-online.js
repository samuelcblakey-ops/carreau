// Payments on online entries (payments-online-entries) against the Firestore rules: the organiser ticks an entry as paid on the
// "Online entries" panel (calendar/{cid}/payments/{eid}: { at, by, team }), the player sees "Payment received" on their own entry
// (reading only their own payment), a paid entry that withdraws shows under "Withdrew after paying", Add to Registration
// carries the payment and a tap in Registration keeps the entry in step, and removing the listing's entries removes payments.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ADMIN = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8').match(/token\.email in \['([^']+)'/)[1];
  const mk = async (n, width = 1100) => { const c = await b.newContext({ viewport: { width, height: 900 }, locale: 'en-GB' }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const raw = (p, op, pth, data) => p.evaluate(async ([op, pth, data]) => { try { const r = await window.__testRaw[op](pth, data); return op === 'get' ? (r ? 'read' : 'none') : 'ok'; } catch (e) { return 'denied ' + (e.code || e.message); } }, [op, pth, data]);
  const ok = async (...a) => { const r = await raw(...a); return r === 'ok' || r === 'read' || r === 'none'; };
  const txt = (p, s) => p.evaluate(s => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim(), s);
  const waitFor = async (p, fn, arg, ms = 15000) => { try { await p.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const W = process.env.WEB_URL;
  const AD = await mk('admin'); await AD.goto(W + '#admin'); await AD.waitForFunction(() => !!window.__testGoogle, null, { timeout: 30000 }); await w(1500);
  await AD.evaluate(e => window.__testGoogle(e), ADMIN); await w(3500);
  await AD.evaluate(() => window.__testSetSite({ calendarEntry: true })); await w(800); // off again at the end

  // the organiser's competition and its listing, taking entries online
  const O = await mk('organiser'); await O.goto(W); await w(3500);
  await O.click('[data-act="new-t"]'); await w(2500); const tid = await O.evaluate(() => location.hash.slice(1));
  if (await O.$('[data-act="wiz-skip"]')) { await O.click('[data-act="wiz-skip"]'); await w(800); }
  await O.evaluate(async () => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Paid Doubles', format: 'doubles', system: 'swiss', checkin: false }); await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); }); await w(1200);
  const oUid = await O.evaluate(() => window.__testUid());
  const L = { kind: 'comp', tid, name: 'Paid Doubles', date: day(7), checkin: '', start: '', venue: 'Henlow PC', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'doubles', system: 'swiss',
    who: ['open'], fee: '£10 a pair', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', byUid: oUid, byCode: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false, gone: false,
    online: true, places: 8, closesAt: Date.now() + 2 * 864e5, approve: false, showEntrants: false };
  log('listing:', await raw(O, 'set', 'calendar/' + tid, L));
  const card = '#cal-' + tid;
  const openCard = async p => { await p.goto(W + '#calendar.' + tid); await p.reload(); await waitFor(p, s => !!document.querySelector(s + '.cal-card .cal-ent h4'), card); await w(1500); };
  const enter = async (p, players, team, contact) => {
    await p.click(card + ' [data-act="cal-ent-new"]'); await w(400);
    await p.fill('#modal [data-calent="name"]', team);
    for (let i = 0; i < players.length; i++) await p.fill(`#modal [data-calent="p${i}"]`, players[i]);
    await p.fill('#modal [data-calent="contact"]', contact);
    await p.click('#modal [data-act="cal-ent-send"]'); await waitFor(p, () => /Entry sent|closed|didn't save/.test(document.querySelector('#toast')?.textContent || '')); await w(1500); };
  const P1 = await mk('player1', 390); await openCard(P1); const e1 = (await P1.evaluate(() => window.__testUid())) + '_1';
  await enter(P1, ['Ann Lee', 'Bob Fox'], 'Pair A', '07700 900111');
  const P2 = await mk('player2', 390); await openCard(P2); const e2 = (await P2.evaluate(() => window.__testUid())) + '_1';
  await enter(P2, ['Cat Ray', 'Dan Oak'], 'Pair B', '07700 900222');

  // the organiser's panel: one tap, the count, Undo
  await openCard(O); await waitFor(O, ([s, e]) => !!document.querySelector(`${s} [data-act="cal-pay"][data-eid="${e}"]`), [card, e1]);
  const payB = e => `${card} [data-act="cal-pay"][data-eid="${e}"]`;
  await O.click(payB(e1)); await w(1500);
  const one = await txt(O, payB(e1)), sum = (await txt(O, card + ' .cal-desk-sum')).match(/\d+ of \d+ paid/)?.[0], saved1 = await raw(O, 'get', `calendar/${tid}/payments/${e1}`);
  await O.click('[data-act="toast-undo"]'); await w(1500);
  const undone = (await txt(O, payB(e1))) === 'Not paid' && (await raw(O, 'get', `calendar/${tid}/payments/${e1}`)) === 'none';
  log(`desk paid: one tap ${one} | summary ${sum} | undo ${undone && saved1 === 'read'}`);
  await O.click(payB(e1)); await w(1500);

  // the rules
  const rec = { at: Date.now(), by: oUid, team: 'Pair B' };
  const oW = await ok(O, 'set', `calendar/${tid}/payments/${e2}`, rec);
  const p1R = (await raw(P1, 'get', `calendar/${tid}/payments/${e1}`)) === 'read';
  const p1W = await ok(P1, 'set', `calendar/${tid}/payments/${e1}`, { at: 1, by: 'x', team: 'Pair A' });
  const p1Del = await ok(P1, 'del', `calendar/${tid}/payments/${e1}`);
  const p1Other = await ok(P1, 'get', `calendar/${tid}/payments/${e2}`);
  const X = await mk('stranger', 390); await openCard(X);
  const xR = await ok(X, 'get', `calendar/${tid}/payments/${e1}`);
  const xList = await X.evaluate(async t => { try { await window.__testRaw.list(`calendar/${t}/payments`); return true; } catch { return false; } }, tid).catch(() => false);
  const adDel = await ok(AD, 'del', `calendar/${tid}/payments/${e2}`);
  const bad = (await ok(O, 'set', `calendar/${tid}/payments/${e2}`, { ...rec, method: 'cash' })) || (await ok(O, 'set', `calendar/${tid}/payments/${e2}`, { ...rec, at: 'today' }))
    || (await ok(O, 'set', `calendar/${tid}/payments/${e2}`, { ...rec, team: 'x'.repeat(61) }));
  log(`rules: organiser writes ${oW} | entrant reads own ${p1R} | entrant writes own ${p1W || p1Del} | entrant reads other ${p1Other} | stranger reads ${xR || xList} | admin deletes ${adDel} | bad shape ${bad}`);

  // the players: "Payment received" on their own entry only when paid
  await openCard(P1); await openCard(P2);
  const p1Paid = await txt(P1, card + ' .cal-mine-ent .cal-ent-paid'), p2Shows = await P2.evaluate(s => { const r = document.querySelector(s + ' .cal-mine-ent'); return !!r && !r.querySelector('.cal-ent-paid') && !/pa(id|yment)/i.test(r.textContent); }, card);
  log(`entrant: Payment received ${p1Paid === 'Payment received'} | unpaid shows nothing ${p2Shows}`);
  await P1.evaluate(s => document.querySelector(s + ' .cal-mine-ent')?.scrollIntoView(), card); await P1.screenshot({ path: process.env.OUT + '/web-payments-online-entrant.png' });

  // Pair B pays, then withdraws: the organiser sees it under "Withdrew after paying", and clears it
  await O.click(payB(e2)); await w(1500);
  await P2.click(`${card} [data-act="cal-ent-withdraw"]`); await w(200);
  await P2.click(`${card} [data-act="cal-ent-withdraw-yes"]`); const wd = await waitFor(P2, () => /withdrawn/i.test(document.querySelector('#toast')?.textContent || '')); await w(1500);
  await waitFor(O, s => !!document.querySelector(s + ' .cal-pay-gone-row'), card);
  const goneName = await O.evaluate(s => [...document.querySelectorAll(s + ' .cal-pay-gone-row b')].map(x => x.textContent).join(','), card);
  await O.setViewportSize({ width: 390, height: 844 }); await O.evaluate(s => document.querySelector(s + ' .cal-desk')?.scrollIntoView(), card); await w(300);
  await O.screenshot({ path: process.env.OUT + '/web-payments-online-desk.png' }); await O.setViewportSize({ width: 1100, height: 900 });
  await O.click(`${card} [data-act="cal-pay-clear"][data-eid="${e2}"]`); await w(1500);
  log(`withdrew after paying: ${goneName} | clear removes ${!(await O.$(card + ' .cal-pay-gone')) && (await raw(O, 'get', `calendar/${tid}/payments/${e2}`)) === 'none'} | withdrawal worked ${wd}`);

  // Registration: the paid entry arrives paid; a tap there keeps the entry in step
  await O.goto(W + '#' + tid); await w(3000); await O.click('[data-tab="entries"]'); await w(1500);
  await waitFor(O, e => !!document.querySelector(`.cal-reg-row[data-eid="${e}"] [data-act="cal-reg-add"]`), e1);
  await O.click(`.cal-reg-row[data-eid="${e1}"] [data-act="cal-reg-add"]`); await w(2500);
  const teamId = await O.evaluate(e => window.__carreau.T().teams.find(x => x.calEntry === e)?.id, e1);
  const regB = `[data-act="pay"][data-id="${teamId}"]`;
  log(`add to registration carries paid: ${await txt(O, regB)}`);
  await O.click(regB); await w(1500); const cleared = (await raw(O, 'get', `calendar/${tid}/payments/${e1}`)) === 'none';
  await openCard(P1); const p1After = !(await P1.$(card + ' .cal-mine-ent .cal-ent-paid'));
  await O.click(regB); await w(1500);
  await openCard(P1); const p1Again = (await txt(P1, card + ' .cal-mine-ent .cal-ent-paid')) === 'Payment received';
  log(`registration tap updates entry: entrant sees Payment received ${p1Again} | not paid clears it ${cleared && p1After}`);

  // removing the listing's entries (as removing the listing does) removes the payments too
  await O.evaluate(t => window.__carreau.S.store.deleteCalEntries(t), tid); await w(1500);
  log(`remove listing deletes payments: ${(await raw(AD, 'get', `calendar/${tid}/payments/${e1}`)) === 'none'}`);
  await AD.evaluate(() => window.__testSetSite({ calendarEntry: false })); await w(500);
  log('errs', errs); await b.close();
})();
