// Season Calendar 5 (calendar-entries-desk) against the Firestore rules: the organiser's "Online entries" on the full listing
// (contacts as links, Accept, Remove, the CSV file), the rules behind them (organisers read teams and contacts, accept pending
// entries and delete entries; strangers can't), Registration's "Entered online" (Add to Registration, Add everyone with a
// place, never twice, no contact in the competition, "Withdrew online"), and removing a listing with its entries. Kept apart
// from web-calendar.js and web-calendar-entry.js, which are near the test runner's limit a file.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (n, width = 1100) => { const c = await b.newContext({ viewport: { width, height: 900 }, locale: 'en-GB' }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const raw = (p, op, path, data) => p.evaluate(async ([op, path, data]) => { try { const r = await window.__testRaw[op](path, data); return op === 'get' ? (r ? 'read' : 'none') : 'ok'; } catch (e) { return 'denied ' + (e.code || e.message); } }, [op, path, data]);
  const ok = async (...a) => { const r = await raw(...a); return r === 'ok' || r === 'read'; };
  const okB = (p, ops) => p.evaluate(async ops => { try { await window.__testRaw.batch(ops); return true; } catch (e) { return false; } }, ops);
  const listN = (p, path) => p.evaluate(async path => { try { return (await window.__testRaw.list(path)).length; } catch { return false; } }, path);
  const txt = (p, s) => p.evaluate(s => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim(), s);
  const waitFor = async (p, fn, arg, ms = 15000) => { try { await p.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const W = process.env.WEB_URL;
  const AD = await mk('admin'); await AD.goto(W + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  // online entry on, for the emulator only (the site's switch stays Off; this turns it off again at the end)
  await AD.evaluate(() => window.__testSetSite({ calendarEntry: true })); await w(800);

  // the organiser's competition (doubles) and its listing, taking entries online: 2 places
  const O = await mk('organiser'); await O.goto(W); await w(3500);
  await O.click('[data-act="new-t"]'); await w(2500); const tid = await O.evaluate(() => location.hash.slice(1));
  if (await O.$('[data-act="wiz-skip"]')) { await O.click('[data-act="wiz-skip"]'); await w(800); }
  await O.evaluate(async () => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Desk Doubles', format: 'doubles', system: 'swiss' }); await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); }); await w(1200);
  const oUid = await O.evaluate(() => window.__testUid());
  const L = { kind: 'comp', tid, name: 'Desk Doubles', date: day(7), checkin: '', start: '', venue: 'Henlow PC', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'doubles', system: 'swiss',
    who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', byUid: oUid, byCode: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false, gone: false,
    online: true, places: 2, closesAt: Date.now() + 2 * 864e5, approve: false, showEntrants: false };
  log('desk listing:', await raw(O, 'set', 'calendar/' + tid, L));
  const card = '#cal-' + tid;
  const openCard = async p => { await p.goto(W + '#calendar.' + tid); await p.reload(); await waitFor(p, s => !!document.querySelector(s + '.cal-card .cal-ent h4'), card); await w(1500); };
  const enter = async (p, players, team, contact) => {
    await p.click(card + ' [data-act="cal-ent-new"]'); await w(400);
    if (team) await p.fill('#modal [data-calent="name"]', team);
    for (let i = 0; i < players.length; i++) await p.fill(`#modal [data-calent="p${i}"]`, players[i]);
    await p.fill('#modal [data-calent="contact"]', contact);
    await p.click('#modal [data-act="cal-ent-send"]'); await waitFor(p, () => /Entry sent|closed|didn't save/.test(document.querySelector('#toast')?.textContent || '')); await w(1500); };
  // three entries: one with a place, then (approval on) two waiting for the organiser
  const P1 = await mk('player1', 390); await openCard(P1); const p1Uid = await P1.evaluate(() => window.__testUid());
  await enter(P1, ['Ann Lee', 'Bob Fox'], 'Les Boulistes', '07700 900111');
  await ok(O, 'update', 'calendar/' + tid, { approve: true, updatedAt: Date.now() });
  const P2 = await mk('player2', 390); await openCard(P2); const p2Uid = await P2.evaluate(() => window.__testUid());
  await enter(P2, ['Cat Ray', 'Dan Oak'], 'Waiting Team', 'cat@example.com');
  const P3 = await mk('player3', 390); await openCard(P3); const p3Uid = await P3.evaluate(() => window.__testUid());
  await enter(P3, ['Eve Ash', 'Fay Elm'], '=Third', '+44 7700 900333');

  // the organiser's panel
  await O.setViewportSize({ width: 390, height: 844 }); await openCard(O);
  await waitFor(O, s => document.querySelectorAll(s + ' .cal-desk-row').length === 3 && !!document.querySelector(s + ' .cal-desk-row a'), card);
  const B = await mk('stranger'); await openCard(B);
  log('desk: rows ' + await O.evaluate(s => document.querySelectorAll(s + ' .cal-desk-row').length, card) + ' | contact link tel ' + await O.evaluate(s => /^tel:07700900111$/.test(document.querySelector(s + ' .cal-desk-row a')?.getAttribute('href') || ''), card)
    + ' | stranger sees panel ' + await B.evaluate(s => !!document.querySelector(s + ' .cal-desk'), card) + ' | entrant sees panel ' + await P1.evaluate(s => !!document.querySelector(s + ' .cal-desk'), card));
  log('desk more: ' + await txt(O, card + ' .cal-desk-sum') + ' | ' + await O.evaluate(s => [...document.querySelectorAll(s + ' .cal-desk-n')].map(x => x.textContent.trim()).join(','), card)
    + ' | no sideways scroll ' + await O.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await O.evaluate(s => document.querySelector(s + ' .cal-desk')?.scrollIntoView(), card); await w(300);
  if (process.env.OUT) await O.screenshot({ path: process.env.OUT + '/calendar-desk-web-390.png' });
  // the rules behind it
  log('desk rules: organiser lists teams ' + await listN(O, `calendar/${tid}/teams`) + ' | contacts ' + await listN(O, `calendar/${tid}/contacts`) + ' | stranger lists teams ' + await listN(B, `calendar/${tid}/teams`)
    + ' | stranger lists contacts ' + await listN(B, `calendar/${tid}/contacts`) + ' | stranger accepts ' + await okB(B, [['update', `calendar/${tid}/entries/${p3Uid}_1`, { status: 'in', queuedAt: '__now' }]])
    + ' | entrant accepts own ' + await okB(P3, [['update', `calendar/${tid}/entries/${p3Uid}_1`, { status: 'in', queuedAt: '__now' }]])
    + ' | organiser sets queuedAt itself ' + await okB(O, [['update', `calendar/${tid}/entries/${p3Uid}_1`, { status: 'in', queuedAt: 1 }]])
    + ' | stranger removes ' + await ok(B, 'del', `calendar/${tid}/entries/${p1Uid}_1`));
  // Accept
  const before = await O.evaluate(([s, e]) => document.querySelector(`${s} .cal-desk-row[data-eid="${e}"] .cal-desk-n`)?.textContent.trim(), [card, p2Uid + '_1']);
  await O.click(`${card} [data-act="cal-desk-accept"][data-eid="${p2Uid}_1"]`);
  await waitFor(O, ([s, e]) => document.querySelector(`${s} .cal-desk-row[data-eid="${e}"] .cal-desk-n`)?.textContent.trim() === '2', [card, p2Uid + '_1']);
  await waitFor(P2, s => /You have a place/.test(document.querySelector(s + ' .cal-ent-state')?.textContent || ''), card);
  log('accept: ' + before + ' → place ' + await O.evaluate(([s, e]) => document.querySelector(`${s} .cal-desk-row[data-eid="${e}"] .cal-desk-n`)?.textContent.trim(), [card, p2Uid + '_1'])
    + ' | entrant view ' + await txt(P2, card + ' .cal-ent-state'));
  // the CSV file
  await O.evaluate(() => { window.__csv = null; window.__carreau.S.downloads = { save: async f => { window.__csv = f; } }; window.__carreau.render(); });
  await O.click(card + ' [data-act="cal-desk-csv"]'); await waitFor(O, () => !!window.__csv);
  const csv = await O.evaluate(() => window.__csv?.data || ''); const lines = csv.replace(/^﻿/, '').split('\n');
  log('csv: header ' + lines[0].replace(/"/g, '') + ' | rows ' + (lines.length - 1));
  log('csv more: bom ' + csv.startsWith('﻿') + ' | phone kept ' + csv.includes('"+44 7700 900333"') + ' | formula guarded ' + csv.includes(`"'=Third"`) + ' | tel ' + csv.includes('"07700 900111"'));

  // Registration: "Entered online"
  await O.setViewportSize({ width: 1100, height: 900 });
  await O.goto(W + '#' + tid); await O.reload(); await waitFor(O, () => !!document.querySelector('[data-tab="entries"]')); await w(1500);
  await O.click('[data-tab="entries"]'); await waitFor(O, () => document.querySelectorAll('.cal-reg .cal-reg-row').length === 3);
  const teamsN = () => O.evaluate(() => window.__carreau.T().teams.length);
  const regRows = await O.evaluate(() => document.querySelectorAll('.cal-reg .cal-reg-row').length);
  const n0 = await teamsN();
  await O.click(`.cal-reg-row[data-eid="${p1Uid}_1"] [data-act="cal-reg-add"]`); await waitFor(O, e => !!document.querySelector(`.cal-reg-row[data-eid="${e}"] .cal-reg-in`), p1Uid + '_1'); await w(1500);
  const n1 = await teamsN(), t1 = await O.evaluate(e => window.__carreau.T().teams.find(x => x.calEntry === e), p1Uid + '_1');
  await O.click('[data-act="cal-reg-all"]'); await waitFor(O, () => !document.querySelector('[data-act="cal-reg-all"]')); await w(1500);
  const n2 = await teamsN();
  await O.evaluate(e => document.querySelector(`.cal-reg-row[data-eid="${e}"] [data-act="cal-reg-add"]`)?.click(), p1Uid + '_1'); await w(1000);
  const saved = await O.evaluate(id => window.__testRaw.get('tournaments/' + id), tid);
  const ids = (saved?.teams || []).map(x => x.calEntry || '');
  log('registration: Entered online ' + regRows + ' | add one: teams +' + (n1 - n0) + ', calEntry ' + (t1?.calEntry === p1Uid + '_1' ? 'set' : 'missing') + ' | add everyone with a place: +' + (n2 - n1)
    + ' | twice: ' + (ids.length === new Set(ids).size && ids.length === 2 ? 'no duplicate' : 'duplicate ' + ids.join(',')));
  log('registration more: saved ' + JSON.stringify((saved?.teams || []).map(x => [x.name, x.players, x.club, !!x.checkedIn, x.active])) + ' | pending row ' + await txt(O, `.cal-reg-row[data-eid="${p3Uid}_1"] .btn`));
  log('registration: contact in tournament doc ' + /07700|example\.com|\+44/.test(JSON.stringify(saved)));
  await O.evaluate(() => document.querySelector('.cal-reg')?.scrollIntoView()); await w(300);
  if (process.env.OUT) await O.screenshot({ path: process.env.OUT + '/calendar-registration-web.png' });

  // the organiser removes the first entry (on the listing): all three documents go, and the entrant is told
  await openCard(O);
  await O.click(`${card} [data-act="cal-desk-remove"][data-eid="${p1Uid}_1"]`); await w(200);
  const ask = await txt(O, `${card} .cal-desk-row[data-eid="${p1Uid}_1"] .err`);
  await O.click(`${card} [data-act="cal-desk-remove-yes"]`); await waitFor(O, ([s, e]) => !document.querySelector(`${s} .cal-desk-row[data-eid="${e}"]`), [card, p1Uid + '_1']);
  await waitFor(P1, s => !!document.querySelector(s + ' .cal-ent-gone'), card, 10000); await w(1000);
  const gone = await Promise.all(['entries', 'teams', 'contacts'].map(k => raw(AD, 'get', `calendar/${tid}/${k}/${p1Uid}_1`)));
  log('remove: ' + ask + ' | entry gone ' + (gone[0] === 'none') + ' | team gone ' + (gone[1] === 'none') + ' | contact gone ' + (gone[2] === 'none') + ' | entrant sees: ' + await txt(P1, card + ' .cal-ent-gone') + (gone.every(x => x === 'none') ? '' : ' | ' + gone.join(',')));
  // back in Registration, the team stays with a pill
  await O.goto(W + '#' + tid); await O.reload(); await waitFor(O, () => !!document.querySelector('[data-tab="entries"]')); await w(1500);
  await O.click('[data-tab="entries"]'); await waitFor(O, () => !!document.querySelector('.cal-withdrew'));
  log('withdrew online pill: ' + await O.evaluate(id => !!document.querySelector(`[data-row="${id}"] .cal-withdrew`), t1?.id) + ' | pills ' + await O.evaluate(() => document.querySelectorAll('.cal-withdrew').length)
    + ' | entered online now ' + await O.evaluate(() => document.querySelectorAll('.cal-reg .cal-reg-row').length));

  // removing the listing takes its entries, teams and contacts with it
  await O.click('[data-tab="setup"]'); await waitFor(O, () => !!document.querySelector('[data-cal-panel] [data-act="cal-remove"]'));
  await O.click('[data-cal-panel] [data-act="cal-remove"]'); await waitFor(O, () => /online entries/.test(document.querySelector('[data-cal-panel] .err')?.textContent || ''));
  const ask2 = await txt(O, '[data-cal-panel] .err');
  await O.click('[data-cal-panel] [data-act="cal-remove-yes"]'); await waitFor(O, () => /Taken off/.test(document.querySelector('#toast')?.textContent || '')); await w(1000);
  log('remove listing ask: ' + ask2);
  log('remove listing with entries: listing gone ' + (await raw(AD, 'get', 'calendar/' + tid) === 'none') + ' | contacts left ' + await listN(AD, `calendar/${tid}/contacts`)
    + ' | teams left ' + await listN(AD, `calendar/${tid}/teams`) + ' | entries left ' + await listN(AD, `calendar/${tid}/entries`));
  await AD.evaluate(() => window.__testSetSite({ calendarEntry: false }));
  log('errs', errs); await b.close();
})();
