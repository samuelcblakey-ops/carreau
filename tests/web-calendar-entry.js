// Season Calendar 4 (calendar-entry-form) against the Firestore rules: the #admin site switch (Off by default), the entry
// form at 390 px, "Your entries" (a place, the waiting list, approval, removed by the organiser), "Who's entered", and the
// rules for entries, teams and contacts (written together in one batch, checked with existsAfter). Kept apart from
// web-calendar.js, which is already close to the test runner's four minutes a file.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (n, width = 1100) => { const c = await b.newContext({ viewport: { width, height: 900 }, locale: 'en-GB' }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const raw = (p, op, path, data) => p.evaluate(async ([op, path, data]) => { try { const r = await window.__testRaw[op](path, data); return op === 'get' ? (r ? 'read' : 'none') : 'ok'; } catch (e) { return 'denied ' + (e.code || e.message); } }, [op, path, data]);
  const ok = async (...a) => { const r = await raw(...a); return r === 'ok' || r === 'read'; };
  const txt = (p, s) => p.evaluate(s => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim(), s);
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const toastOf = async (p, re) => { try { await p.waitForFunction(r => new RegExp(r).test(document.querySelector('#toast')?.textContent || ''), re.source, { timeout: 15000 }); } catch {} return txt(p, '#toast'); };
  const newComp = async (p, patch) => { await p.click('[data-act="new-t"]'); await w(2500); const id = await p.evaluate(() => location.hash.slice(1));
    if (await p.$('[data-act="wiz-skip"]')) { await p.click('[data-act="wiz-skip"]'); await w(800); }
    await p.evaluate(async patch => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, patch); await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); }, patch); await w(1200);
    return id; };
  const W = process.env.WEB_URL;
  const evDoc = (id, u, extra) => Object.assign({ kind: 'event', id, name: 'Raw event', date: day(10), checkin: '', start: '', venue: '', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'singles', formatNote: '',
    who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', ownerUid: u, orgCode: '', byUid: u, byCode: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false }, extra);
  const AD = await mk('admin'); await AD.goto(W + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  const B = await mk('stranger'); await B.goto(W); await w(3000);
  // a retry runs on the same emulator: start from the switch Off and no listing
  await AD.evaluate(async () => { const R = window.__testRaw;
    for (const k of ['entries', 'teams', 'contacts']) { try { for (const id of await R.list('calendar/cEnt1/' + k)) await R.del('calendar/cEnt1/' + k + '/' + id); } catch {} }
    try { await R.del('calendar/cEnt1'); } catch {} await window.__testSetSite({ calendarEntry: false }); }); await w(1000);

  const okB = (p, ops) => p.evaluate(async ops => { try { await window.__testRaw.batch(ops); return true; } catch (e) { return false; } }, ops);
  const entOps = (c, eid, uid, status, players = ['Raw One', 'Raw Two']) => [['set', `calendar/${c}/entries/${eid}`, Object.assign({ uid, at: '__now', status }, status === 'in' ? { queuedAt: '__now' } : {})],
    ['set', `calendar/${c}/teams/${eid}`, { name: '', players, club: '' }], ['set', `calendar/${c}/contacts/${eid}`, { contact: '07700 900000' }]];
  const entFields = { online: true, places: 2, closesAt: Date.now() + 2 * 864e5, approve: false, showEntrants: false };
  const EO = await mk('entryOrganiser'); await EO.goto(W + '#calendar'); await w(3500); const eoUid = await EO.evaluate(() => window.__testUid());
  log('entry listing:', await raw(EO, 'set', 'calendar/cEnt1', evDoc('cEnt1', eoUid, Object.assign({ name: 'Henlow Entry Doubles', fmt: 'doubles' }, entFields))));
  const P1 = await mk('player1', 390); const p1Uid = await (async () => { await P1.goto(W + '#calendar.cEnt1'); await w(4500); return P1.evaluate(() => window.__testUid()); })();
  const shown = p => p.evaluate(() => !!document.querySelector('#cal-cEnt1 [data-act="cal-ent-new"]'));
  log('switch off: Enter online shown', await shown(P1), '| create refused', !(await okB(P1, entOps('cEnt1', p1Uid + '_1', p1Uid, 'in'))));
  // the admin turns it on in #admin (Off until then)
  await AD.goto(W + '#admin'); await AD.reload(); await w(4500);
  const swOff = await txt(AD, '#adm-cal-entry .pill');
  await AD.click('#adm-cal-entry [data-act="cal-entry-mode"][data-mode="all"]'); const swToast = await toastOf(AD, /online entry/); await w(1000);
  log('admin switch: default ' + swOff + ' | ' + swToast + ' | saved', (await AD.evaluate(() => window.__testRaw.get('config/site'))).calendarEntry, '| pill', await txt(AD, '#adm-cal-entry .pill'));
  const openCard = async p => { await p.goto(W + '#calendar.cEnt1'); await p.reload(); await w(4500); };
  const enter = async (p, players, team) => {
    await p.click('#cal-cEnt1 [data-act="cal-ent-new"]'); await w(400);
    if (team) await p.fill('#modal [data-calent="name"]', team);
    for (let i = 0; i < players.length; i++) await p.fill(`#modal [data-calent="p${i}"]`, players[i]);
    await p.fill('#modal [data-calent="contact"]', 'player@example.com');
    await p.click('#modal [data-act="cal-ent-send"]'); const t = await toastOf(p, /Entry sent|closed|didn't save|already/); await w(1500); return t; };
  const states = p => p.evaluate(() => [...document.querySelectorAll('#cal-cEnt1 .cal-ent-row')].map(r => r.dataset.eid.split('_').pop() + ' ' + r.querySelector('.cal-ent-state').textContent.trim()));
  await openCard(P1);
  await P1.click('#cal-cEnt1 [data-act="cal-ent-new"]'); await w(400);
  await P1.fill('#modal [data-calent="name"]', 'Les Boulistes'); await P1.fill('#modal [data-calent="p0"]', 'Ann Lee'); await P1.fill('#modal [data-calent="p1"]', 'Bob Fox'); await P1.fill('#modal [data-calent="contact"]', '07700 900111');
  const wide = await P1.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (process.env.OUT) await P1.screenshot({ path: process.env.OUT + '/calendar-entry-form-web-390.png' });
  await P1.click('#modal [data-act="cal-ent-send"]'); const sent = await toastOf(P1, /Entry sent|closed|didn't save/); await w(2000);
  const e1 = await P1.evaluate(id => window.__testRaw.get('calendar/cEnt1/entries/' + id), p1Uid + '_1');
  log('entry: ' + sent + ' | status ' + e1?.status + ' | place ' + ((await states(P1))[0] || '').replace(/^1 You have a place \((\d+) of (\d+)\)$/, '$1 of $2'));
  log('entry more: at server time', typeof e1?.at?.toMillis === 'function' || typeof e1?.at?.seconds === 'number', '| listing has no contact', !JSON.stringify(await raw(P1, 'get', 'calendar/cEnt1')).includes('07700'),
    '| team', JSON.stringify(await P1.evaluate(id => window.__testRaw.get('calendar/cEnt1/teams/' + id), p1Uid + '_1')));
  log('phone 390: form no sideways scroll', !wide);
  await enter(P1, ['Cat Ray', 'Dan Oak']); await enter(P1, ['Eve Ash', 'Fay Elm'], 'Third Team');
  const third = (await states(P1)).find(x => x.startsWith('3 ')) || '';
  await P1.evaluate(() => document.querySelector('#cal-cEnt1 .cal-mine-ent')?.scrollIntoView()); await w(300);
  if (process.env.OUT) await P1.screenshot({ path: process.env.OUT + '/calendar-your-entries-web-390.png' });
  await P1.click(`#cal-cEnt1 [data-act="cal-ent-withdraw"][data-eid="${p1Uid}_1"]`); await w(200); await P1.click('#cal-cEnt1 [data-act="cal-ent-withdraw-yes"]');
  const wd = await toastOf(P1, /withdrawn|didn't save/); await w(2000);
  log('queue: third entry ' + third.slice(2) + ' | first withdraws: third has a place', (await states(P1)).includes('3 You have a place (2 of 2)'), '| ' + wd + ' | docs gone',
    await raw(P1, 'get', `calendar/cEnt1/entries/${p1Uid}_1`), await raw(P1, 'get', `calendar/cEnt1/teams/${p1Uid}_1`), await raw(P1, 'get', `calendar/cEnt1/contacts/${p1Uid}_1`));
  // privacy (names not shown yet)
  const bTeamOff = await ok(B, 'get', `calendar/cEnt1/teams/${p1Uid}_2`);
  // approval on: a new entry waits until the organiser accepts it
  log('approve on listing:', await ok(EO, 'update', 'calendar/cEnt1', { approve: true, updatedAt: Date.now() }));
  const P2 = await mk('player2', 390); await openCard(P2); const p2Uid = await P2.evaluate(() => window.__testUid());
  await enter(P2, ['Gus Hay', 'Hal Ivy'], 'Waiting Team');
  const pend = (await P2.evaluate(id => window.__testRaw.get('calendar/cEnt1/entries/' + id), p2Uid + '_1'))?.status;
  const pendState = ((await states(P2))[0] || '').slice(2);
  const selfIn = await okB(P2, [['update', `calendar/cEnt1/entries/${p2Uid}_1`, { status: 'in', queuedAt: '__now' }]]);
  const accept = await okB(EO, [['update', `calendar/cEnt1/entries/${p2Uid}_1`, { status: 'in', queuedAt: '__now' }]]);
  log('approve on: status ' + pend + ' | ' + pendState + ' | organiser accepts: ' + (accept ? (await EO.evaluate(id => window.__testRaw.get('calendar/cEnt1/entries/' + id), p2Uid + '_1'))?.status : 'refused') + ' | entrant sets in itself', selfIn);
  // another pending entry, then names shown on the listing
  const P3 = await mk('player3', 390); await openCard(P3); const p3Uid = await P3.evaluate(() => window.__testUid());
  await enter(P3, ['Ida Jay', 'Jon Kim'], 'Pending Team');
  await ok(EO, 'update', 'calendar/cEnt1', { showEntrants: true, updatedAt: Date.now() });
  log('privacy: stranger reads contact', await ok(B, 'get', `calendar/cEnt1/contacts/${p1Uid}_2`), '| stranger reads team (shown off)', bTeamOff, '| stranger reads team (shown on)', await ok(B, 'get', `calendar/cEnt1/teams/${p1Uid}_2`),
    '| organiser reads contact', await ok(EO, 'get', `calendar/cEnt1/contacts/${p1Uid}_2`), '| entrant reads own contact', await ok(P1, 'get', `calendar/cEnt1/contacts/${p1Uid}_2`));
  log('privacy more: stranger lists contacts', await B.evaluate(async () => { try { await window.__testRaw.list('calendar/cEnt1/contacts'); return true; } catch { return false; } }),
    '| organiser lists contacts', await EO.evaluate(async () => { try { return (await window.__testRaw.list('calendar/cEnt1/contacts')).length; } catch { return 'refused'; } }),
    '| entrant reads another contact', await ok(P2, 'get', `calendar/cEnt1/contacts/${p1Uid}_2`));
  await openCard(B); await B.click('#cal-cEnt1 .cal-who-list summary'); await w(500);
  const who = await B.evaluate(() => { const l = document.querySelector('#cal-cEnt1 .cal-who-list'); return { n: l?.querySelector('.cal-who-ol')?.children.length || 0, wait: !!l?.querySelector('.cal-wait-h'), text: (l?.textContent || '') }; });
  log("who's entered: " + who.n + ' listed | waiting list heading ' + who.wait + ' | pending not listed ' + (!who.text.includes('Pending Team') && who.text.includes('Waiting Team')));
  await B.evaluate(() => document.querySelector('#cal-cEnt1 .cal-who-list')?.scrollIntoView()); await w(300);
  if (process.env.OUT) await B.screenshot({ path: process.env.OUT + '/calendar-whos-entered-web.png' });
  // limits
  const sixth = await okB(P1, entOps('cEnt1', p1Uid + '_6', p1Uid, 'pending'));
  const otherUid = await okB(P1, entOps('cEnt1', p2Uid + '_4', p1Uid, 'pending'));
  await ok(AD, 'update', 'calendar/cEnt1', { hidden: true, hiddenAt: Date.now() });
  const onHidden = await okB(P2, entOps('cEnt1', p2Uid + '_2', p2Uid, 'pending'));
  await ok(AD, 'update', 'calendar/cEnt1', { hidden: false });
  await ok(EO, 'update', 'calendar/cEnt1', { closesAt: Date.now() - 1000, updatedAt: Date.now() });
  const afterClose = await okB(P2, entOps('cEnt1', p2Uid + '_2', p2Uid, 'pending'));
  const editClosed = await okB(P1, [['set', `calendar/cEnt1/teams/${p1Uid}_2`, { name: 'Late', players: ['Cat Ray', 'Dan Oak'], club: '' }]]);
  const withdrawClosed = await okB(P3, [['del', `calendar/cEnt1/entries/${p3Uid}_1`], ['del', `calendar/cEnt1/teams/${p3Uid}_1`], ['del', `calendar/cEnt1/contacts/${p3Uid}_1`]]);
  await ok(EO, 'update', 'calendar/cEnt1', { closesAt: Date.now() + 2 * 864e5, updatedAt: Date.now() });
  // a EuroCup competition's listing can't take entries online
  const A = await mk('compOwner'); await A.goto(W); await w(3500); const tid7 = await newComp(A, { name: 'EuroCup listing', date: day(14) }); const aUid = await A.evaluate(() => window.__testUid());
  const Leu = Object.assign({ kind: 'comp', tid: tid7, name: 'EuroCup listing', date: day(14), checkin: '', start: '', venue: '', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'eurocup', system: 'swiss',
    who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', byUid: aUid, byCode: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false, gone: false }, entFields);
  const euOn = await ok(A, 'set', 'calendar/' + tid7, Leu), euOff = await ok(A, 'set', 'calendar/' + tid7, Object.assign({}, Leu, { online: false }));
  log('limits: sixth entry from one device', sixth, '| entry after close', afterClose, '| entry on hidden listing', onHidden, '| eurocup listing online', euOn);
  log('limits more: eurocup listing without online entry', euOff, '| another device\'s id', otherUid, '| withdraw after close', withdrawClosed,
    '| entry without a contact', await okB(P2, entOps('cEnt1', p2Uid + '_3', p2Uid, 'pending').slice(0, 2)), '| team with 4 players', await okB(P2, entOps('cEnt1', p2Uid + '_3', p2Uid, 'pending', ['a', 'b', 'c', 'd'])),
    '| status in on an approve listing', await okB(P2, entOps('cEnt1', p2Uid + '_3', p2Uid, 'in')));
  log('entrant edits after close', editClosed, '| entrant changes status', await okB(P1, [['update', `calendar/cEnt1/entries/${p1Uid}_2`, { status: 'pending' }]]),
    '| stranger deletes another entry', await ok(B, 'del', `calendar/cEnt1/entries/${p1Uid}_2`));
  log('organiser removes an entry', await okB(EO, [['del', `calendar/cEnt1/entries/${p1Uid}_2`], ['del', `calendar/cEnt1/teams/${p1Uid}_2`], ['del', `calendar/cEnt1/contacts/${p1Uid}_2`]]),
    '| entrant sees: ' + await (async () => { await openCard(P1); try { await P1.waitForSelector('#cal-cEnt1 .cal-ent-gone', { timeout: 10000 }); } catch {} return txt(P1, '#cal-cEnt1 .cal-ent-gone'); })());
  log('errs', errs); await b.close();
})();
