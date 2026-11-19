// Season Calendar 6 (calendar-cancel) against the Firestore rules: the organiser postpones a listing, then cancels it, from
// the listing sheet's Status section, and sets it back to going ahead. The row's pill (struck through when cancelled), the
// full listing's notice, the "Entries open" chip, the paused or closed entries (refused by the rules for both values), an
// entrant's "Your entries" notice and Withdraw, and the rules on status and statusNote. Kept apart from web-calendar.js,
// web-calendar-entry.js and web-calendar-desk.js, which are near the test runner's limit a file. A new competition each run,
// so a retry starts clean.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (n, width = 1100) => { const c = await b.newContext({ viewport: { width, height: 900 }, locale: 'en-GB' }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const raw = (p, op, path, data) => p.evaluate(async ([op, path, data]) => { try { const r = await window.__testRaw[op](path, data); return op === 'get' ? (r ? 'read' : 'none') : 'ok'; } catch (e) { return 'denied ' + (e.code || e.message); } }, [op, path, data]);
  const ok = async (...a) => { const r = await raw(...a); return r === 'ok' || r === 'read'; };
  const okB = (p, ops) => p.evaluate(async ops => { try { await window.__testRaw.batch(ops); return true; } catch (e) { return false; } }, ops);
  const txt = (p, s) => p.evaluate(s => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim(), s);
  const waitFor = async (p, fn, arg, ms = 15000) => { try { await p.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const entOps = (c, eid, uid) => [['set', `calendar/${c}/entries/${eid}`, { uid, at: '__now', status: 'in', queuedAt: '__now' }],
    ['set', `calendar/${c}/teams/${eid}`, { name: '', players: ['Raw One'], club: '' }], ['set', `calendar/${c}/contacts/${eid}`, { contact: '07700 900000' }]];
  const W = process.env.WEB_URL;
  const AD = await mk('admin'); await AD.goto(W + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  // online entry on, for the emulator only (the site's switch stays Off; this turns it off again at the end)
  await AD.evaluate(() => window.__testSetSite({ calendarEntry: true })); await w(800);

  // the organiser's competition (singles) and its listing, taking entries online
  const O = await mk('organiser'); await O.goto(W); await w(3500);
  await O.click('[data-act="new-t"]'); await w(2500); const tid = await O.evaluate(() => location.hash.slice(1));
  if (await O.$('[data-act="wiz-skip"]')) { await O.click('[data-act="wiz-skip"]'); await w(800); }
  await O.evaluate(async date => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Rainy Singles', format: 'singles', system: 'swiss', date }); await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); }, day(7)); await w(1200);
  const oUid = await O.evaluate(() => window.__testUid());
  const L = { kind: 'comp', tid, name: 'Rainy Singles', date: day(7), checkin: '', start: '', venue: 'Henlow PC', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'singles', system: 'swiss',
    who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', byUid: oUid, byCode: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false, gone: false,
    online: true, places: 8, closesAt: Date.now() + 2 * 864e5, approve: false, showEntrants: false };
  log('cancel listing:', await raw(O, 'set', 'calendar/' + tid, L));
  const card = '#cal-' + tid;
  const openCard = async p => { await p.goto(W + '#calendar.' + tid); await p.reload(); await waitFor(p, s => !!document.querySelector(s + '.cal-card .cal-ent h4'), card); await w(1500); };
  // the row: the full listing closed again
  const toRow = async p => { await openCard(p); await p.click(card + ' [data-act="cal-close-entry"]'); await waitFor(p, s => !!document.querySelector(s + '.cal-row'), card); await w(300); };
  // the organiser changes the status in the listing sheet (Setup › Update)
  const setStatus = async (k, note) => {
    await O.goto(W + '#' + tid); await O.reload(); await waitFor(O, () => !!document.querySelector('[data-tab="setup"]')); await w(1200);
    await O.click('[data-tab="setup"]'); await waitFor(O, () => !!document.querySelector('[data-cal-panel] [data-act="cal-open"]'));
    await O.click('[data-cal-panel] [data-act="cal-open"]'); await waitFor(O, () => !!document.querySelector('#modal [data-act="cal-status"]'));
    await O.click(`#modal [data-act="cal-status"][data-k="${k}"]`); await w(200);
    if (note !== undefined) await O.fill('#modal [data-cal="statusNote"]', note);
    const reason = await O.evaluate(() => !!document.querySelector('#modal [data-cal="statusNote"]'));
    if (k === 'postponed' && process.env.OUT) { await O.evaluate(() => document.querySelector('#modal .cal-status-set')?.scrollIntoView({ block: 'center' })); await w(200); await O.screenshot({ path: process.env.OUT + '/calendar-status-sheet.png' }); }
    await O.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.textContent = ''; });
    await O.click('#modal [data-act="cal-save"]'); await waitFor(O, () => /Listing updated|didn't save|Only/.test(document.querySelector('#toast')?.textContent || '')); await w(800);
    return reason;
  };

  // a player enters while it's going ahead
  const P = await mk('player', 390); await openCard(P); const pUid = await P.evaluate(() => window.__testUid());
  await P.click(card + ' [data-act="cal-ent-new"]'); await w(400);
  await P.fill('#modal [data-calent="p0"]', 'Ann Lee'); await P.fill('#modal [data-calent="contact"]', '07700 900111');
  await P.click('#modal [data-act="cal-ent-send"]'); await waitFor(P, () => /Entry sent/.test(document.querySelector('#toast')?.textContent || '')); await w(1000);

  // postponed, with a reason
  const reasonOn = await setStatus('postponed', 'Rained off');
  const saved1 = await O.evaluate(id => window.__testRaw.get('calendar/' + id), tid);
  log('sheet: reason box ' + reasonOn + ' | saved ' + saved1?.status + ' "' + saved1?.statusNote + '" | ' + await txt(O, '[data-cal-panel] .cal-st'));
  const B = await mk('stranger', 390); const bUid = await (async () => { await openCard(B); return B.evaluate(() => window.__testUid()); })();
  const notice1 = await txt(B, card + ' .cal-status-note b'), more1 = await txt(B, card + ' .cal-status-note .small');
  const shown1 = await B.evaluate(s => !!document.querySelector(s + ' [data-act="cal-ent-new"]'), card), places1 = await txt(B, card + ' .cal-places');
  const refused1 = !(await okB(B, entOps(tid, bUid + '_1', bUid)));
  await toRow(B);
  log('postponed: row pill ' + await txt(B, card + ' .cal-st') + ' | notice ' + notice1 + ' | Enter online shown ' + shown1 + ' | entry refused ' + refused1);
  log('postponed more: ' + more1 + ' | places ' + places1 + ' | row line ' + await txt(B, card + ' .cal-ent-line') + ' | entrant sees: ' + await (async () => { await openCard(P); return txt(P, card + ' .cal-ent-st'); })());

  // cancelled
  await setStatus('cancelled', 'Rained off');
  await toRow(B);
  const struck = await B.evaluate(s => getComputedStyle(document.querySelector(s + ' .cal-name b')).textDecorationLine.includes('line-through'), card);
  const red = await B.evaluate(s => getComputedStyle(document.querySelector(s + ' .cal-st')).color, card);
  if (process.env.OUT) await B.screenshot({ path: process.env.OUT + '/calendar-cancelled-row-390.png' });
  await B.click('[data-act="cal-filter-open"]'); await w(500);
  const excluded = await B.evaluate(s => !document.querySelector(s) && document.querySelector('[data-act="cal-filter-open"]')?.getAttribute('aria-pressed') === 'true', card);
  await B.click('[data-act="cal-filter-open"]'); await w(300);
  const rowPill = await txt(B, card + ' .cal-st');
  await openCard(B);
  const notice2 = await txt(B, card + ' .cal-status-note'), places2 = await txt(B, card + ' .cal-places');
  const refused2 = !(await okB(B, entOps(tid, bUid + '_1', bUid)));
  const editRefused = !(await okB(P, [['set', `calendar/${tid}/teams/${pUid}_1`, { name: '', players: ['Ann Lea'], club: '' }]]));
  await openCard(P); await waitFor(P, s => !!document.querySelector(s + ' .cal-ent-st'), card);
  const seen = await txt(P, card + ' .cal-ent-st'), editShown = await P.evaluate(s => !!document.querySelector(s + ' [data-act="cal-ent-edit"]'), card);
  await P.evaluate(s => document.querySelector(s + ' .cal-status-note')?.scrollIntoView({ block: 'start' }), card); await w(300);
  if (process.env.OUT) await P.screenshot({ path: process.env.OUT + '/calendar-cancelled-listing-390.png' });
  const noSideways = await P.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  await P.click(`${card} [data-act="cal-ent-withdraw"]`); await w(200);
  await P.click(`${card} [data-act="cal-ent-withdraw-yes"]`); await waitFor(P, () => /withdrawn/i.test(document.querySelector('#toast')?.textContent || '')); await w(1000);
  const withdrawn = (await raw(AD, 'get', `calendar/${tid}/entries/${pUid}_1`)) === 'none';
  log('cancelled: row pill ' + rowPill + ' | struck ' + struck + ' | entries chip excludes ' + excluded + ' | entrant sees: ' + seen + ' | withdraw works ' + withdrawn);
  log('cancelled more: notice ' + notice2 + ' | places ' + places2 + ' | entry refused ' + refused2 + ' | team edit refused ' + editRefused + ' | Edit shown ' + editShown + ' | pill red ' + /^rgb\((1[6-9]\d|2\d\d), \d{1,2}, \d{1,2}\)$/.test(red) + ' | no sideways scroll ' + noSideways);

  // back to going ahead: the reason box goes, the note is cleared, entries reopen (they haven't closed)
  const reasonOff = await setStatus('on');
  const saved3 = await O.evaluate(id => window.__testRaw.get('calendar/' + id), tid);
  await openCard(B);
  log('back on: entry allowed ' + await okB(B, entOps(tid, bUid + '_1', bUid)));
  log('back on more: reason box ' + reasonOff + ' | saved ' + saved3?.status + ' "' + saved3?.statusNote + '" | pill ' + await B.evaluate(s => !!document.querySelector(s + ' .cal-st'), card) + ' | notice ' + await B.evaluate(s => !!document.querySelector(s + ' .cal-status-note'), card));

  // the rules on status and statusNote
  const upd = patch => ok(O, 'update', 'calendar/' + tid, Object.assign({ updatedAt: Date.now() }, patch));
  log('rules: status bogus ' + await upd({ status: 'bogus' }) + ' | statusNote 200 chars ' + await upd({ status: 'postponed', statusNote: 'x'.repeat(200) }));
  log('rules more: statusNote 120 chars ' + await upd({ status: 'postponed', statusNote: 'x'.repeat(120) }) + ' | statusNote a number ' + await upd({ statusNote: 5 })
    + ' | stranger cancels ' + await ok(B, 'update', 'calendar/' + tid, { status: 'cancelled' }) + ' | admin back on ' + await ok(AD, 'update', 'calendar/' + tid, { status: 'on', statusNote: '' }));
  await AD.evaluate(() => window.__testSetSite({ calendarEntry: false }));
  log('errs', errs); await b.close();
})();
