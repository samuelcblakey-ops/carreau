// Season Calendar 1 (calendar-publish) against the Firestore rules: the organiser lists a competition from Setup; a phone
// with the organiser link can update it; another visitor (even with open testing on) can read a shown listing but can't
// list, change or remove it; an organiser can't hide a listing, list an example or an archived competition, or save a bad
// level. Archiving marks the listing gone; the admin's restore in #admin unmarks it.
// Season Calendar 2 (calendar-page): a visitor's page and listing (Follow the draw once the competition is drawn), and the
// admin's hide from the page: allowed for the admin, refused for anyone else; the organiser's Setup panel says so.
// Season Calendar 3 (calendar-own-events): an event added from the page, its organiser link (join, wrong code), "Your listings"
// (hidden ones marked), and the event rules, with organiser login off and on.
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
  const newComp = async (p, patch) => { await p.click('[data-act="new-t"]'); await w(2500); const id = await p.evaluate(() => location.hash.slice(1));
    if (await p.$('[data-act="wiz-skip"]')) { await p.click('[data-act="wiz-skip"]'); await w(800); }
    await p.evaluate(async patch => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, patch); await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); }, patch); await w(1200);
    return id; };

  const A = await mk('A'); await A.goto(process.env.WEB_URL); await w(3500);
  const tid = await newComp(A, { name: 'Letchworth Open Doubles', venue: 'Letchworth PC', date: day(12), format: 'doubles' });
  await A.click('[data-tab="setup"]'); await w(1500);
  log('web panel owner:', await txt(A, '[data-cal-panel]'));
  await A.click('[data-cal-panel] [data-act="cal-open"]'); await w(400);
  await A.click('#modal [data-act="cal-level"][data-k="regional"]'); await w(100);
  await A.fill('#modal [data-cal="contact"]', 'Jane, 07700 900123');
  await A.click('#modal [data-act="cal-save"]'); await w(2000);
  const L = await A.evaluate(async t => window.__testRaw.get('calendar/' + t), tid);
  log('web listed:', await txt(A, '#toast'), '| read', await raw(A, 'get', 'calendar/' + tid), '|', L.kind, L.level, L.fmt, L.contact, '| byUid mine', L.byUid === await A.evaluate(() => window.__testUid()), '| hidden', L.hidden);
  const editCode = (await A.evaluate(t => window.__testRaw.get('tournaments/' + t + '/private/codes'), tid)).edit; // what the organiser link carries

  // another visitor (open testing on): can run the competition, but not list it
  const B = await mk('B'); await B.goto(process.env.WEB_URL + '#' + tid); await w(3500);
  await B.click('[data-tab="setup"]'); await w(1200);
  const strangerPanel = await B.evaluate(() => !!document.querySelector('[data-cal-panel]'));
  const listed = await B.evaluate(async t => (await window.__carreau.S.store.listCal({ country: 'GB-ENG' })).some(x => x.tid === t), tid);
  const tid2 = await newComp(A, { name: 'Not listed yet', date: day(20) });
  const strangerCreate = await ok(B, 'set', 'calendar/' + tid2, Object.assign({}, L, { tid: tid2, byUid: await B.evaluate(() => window.__testUid()) }));
  const strangerUpdate = await ok(B, 'update', 'calendar/' + tid, { note: 'Junk' });
  const strangerDelete = await ok(B, 'del', 'calendar/' + tid);
  const strangerRead = await ok(B, 'get', 'calendar/' + tid) && listed;

  // a phone with the organiser link
  const O = await mk('organiserLink', 390); await O.goto(process.env.WEB_URL + '#' + tid); await w(3500);
  await O.evaluate(async ([t, code]) => window.__testRaw.set('tournaments/' + t + '/members/' + window.__testUid(), { role: 'edit', code, joinedAt: Date.now() }), [tid, editCode]);
  await O.reload(); await w(3500);
  await O.click('[data-tab="setup"]'); await w(1200);
  const linkPanel = await O.evaluate(() => !!document.querySelector('[data-cal-panel] [data-act="cal-open"]'));
  const linkUpdate = await ok(O, 'update', 'calendar/' + tid, { note: 'Bring your own boules', updatedAt: Date.now() });
  if (process.env.OUT) await O.screenshot({ path: process.env.OUT + '/calendar-organiser-link-390.png' });
  log('rules: owner create', L.kind === 'comp', '| organiser link update', linkUpdate, '| stranger create', strangerCreate, '| stranger update', strangerUpdate, '| stranger reads shown', strangerRead);
  log('rules more: stranger delete', strangerDelete, '| stranger panel', strangerPanel, '| organiser link panel', linkPanel, '| missing listing read', await raw(B, 'get', 'calendar/nothing-here'));

  // what an organiser can't do
  const hide = await ok(A, 'update', 'calendar/' + tid, { hidden: true });
  const hiddenAt = await ok(A, 'update', 'calendar/' + tid, { hiddenAt: Date.now() });
  const byUid = await ok(A, 'update', 'calendar/' + tid, { byUid: 'someone' });
  const badLevel = await ok(A, 'update', 'calendar/' + tid, { level: 'world' });
  const extra = await ok(A, 'update', 'calendar/' + tid, { score: 1 });
  const badDate = await ok(A, 'update', 'calendar/' + tid, { date: 'soon' });
  const badWho = await ok(A, 'update', 'calendar/' + tid, { who: ['open', 'everyone'] });
  const createHidden = await ok(A, 'set', 'calendar/' + tid2, Object.assign({}, L, { tid: tid2, hidden: true }));
  const ownCreate = await ok(A, 'set', 'calendar/' + tid2, Object.assign({}, L, { tid: tid2 }));
  // an example (listed by the admin) and an archived competition
  const AD = await mk('admin'); await AD.goto(process.env.WEB_URL + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  const tid3 = await newComp(A, { name: 'Example comp', date: day(8) });
  await AD.evaluate(t => window.__testRaw.update('tournaments/' + t, { listed: true }), tid3);
  const example = await ok(A, 'set', 'calendar/' + tid3, Object.assign({}, L, { tid: tid3 }));
  const tid4 = await newComp(A, { name: 'Archived comp', date: day(9) });
  await A.evaluate(t => window.__testRaw.update('tournaments/' + t, { archived: true, archivedAt: Date.now() }), tid4);
  const archived = await ok(A, 'set', 'calendar/' + tid4, Object.assign({}, L, { tid: tid4 }));
  log('rules: organiser sets hidden', hide, '| example listed', example, '| archived competition', archived, '| bad level', badLevel);
  log('rules more: hiddenAt', hiddenAt, '| byUid', byUid, '| extra key', extra, '| bad date', badDate, '| bad who', badWho, '| create hidden', createHidden, '| own create', ownCreate);
  const adminHide = await ok(AD, 'update', 'calendar/' + tid2, { hidden: true, hiddenAt: Date.now() });
  log('admin hide:', adminHide, '| stranger reads hidden', await ok(B, 'get', 'calendar/' + tid2), '| owner reads hidden', await ok(A, 'get', 'calendar/' + tid2),
    '| stranger list has it', await B.evaluate(async t => (await window.__carreau.S.store.listCal({})).some(x => x.tid === t), tid2));

  // archiving marks the listing gone; the admin's restore in #admin unmarks it
  const gone = () => AD.evaluate(async t => (await window.__testRaw.get('calendar/' + t))?.gone, tid);
  await A.evaluate(t => { location.hash = t; }, tid); await w(1500); await A.click('[data-tab="setup"]'); await w(800);
  await A.evaluate(() => window.__carreau.archiveCompetition(true)); await w(2500);
  const g1 = await gone();
  await AD.reload(); await w(4000);
  await AD.click(`#adm-comps [data-act="admin-restore"][data-id="${tid}"]`); await w(2500);
  log('web archive marks gone:', g1 === true, '| admin restore unmarks:', await gone() === false);

  // the owner takes it off the calendar
  await A.goto(process.env.WEB_URL + '#' + tid); await w(3500); await A.click('[data-tab="setup"]'); await w(1500);
  await A.click('[data-cal-panel] [data-act="cal-remove"]'); await w(200); await A.click('[data-act="cal-remove-yes"]'); await w(1500);
  log('web remove:', await txt(A, '#toast'), '| read', await raw(A, 'get', 'calendar/' + tid));

  // ---- Season Calendar 2 (calendar-page): the public page, its link to the competition, and the admin's hide ----
  const tid5 = await newComp(A, { name: 'Baldock Autumn Triples', venue: 'Baldock PC', date: day(6), format: 'triples' });
  const L5 = Object.assign({}, L, { tid: tid5, name: 'Baldock Autumn Triples', venue: 'Baldock PC', date: day(6), howTo: 'Enter at the club bar', note: '', updatedAt: Date.now() });
  delete L5.hiddenAt;
  log('web page listing:', await raw(A, 'set', 'calendar/' + tid5, L5));
  const V = await mk('visitor', 390); await V.goto(process.env.WEB_URL + '#calendar'); await w(4500);
  const onPage = p => p.evaluate(t => !!document.querySelector('#cal-' + t), tid5);
  log('web page: title', await txt(V, 'main h2'), '| listed', await onPage(V), '| no competition watched', await V.evaluate(() => !window.__carreau.S.tid), '| wide', await V.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
  await V.click('#cal-' + tid5); await w(2000);
  const fd = () => V.evaluate(t => { const c = document.querySelector('#cal-' + t + '.cal-card'); return { follow: !!c?.querySelector('a.primary[href="#' + t + '"]'), view: !!c?.querySelector('a.btn[href="#' + t + '"]:not(.primary)'), how: c?.querySelector('h4')?.textContent }; }, tid5);
  const before = await fd();
  await A.evaluate(t => window.__testRaw.update('tournaments/' + t, { draws: [{ id: 'R1', kind: 'round', at: Date.now() }] }), tid5); await w(800);
  await V.click(`#cal-${tid5} [data-act="cal-close-entry"]`); await w(200); await V.click('#cal-' + tid5); await w(2000);
  const after = await fd();
  log('web open listing: How to enter', before.how === 'How to enter', '| Follow the draw', before.follow, 'before draw | view', before.view, '| Follow the draw', after.follow, 'after draw');
  if (process.env.OUT) await V.screenshot({ path: process.env.OUT + '/calendar-web-listing-390.png' });
  // Add to calendar on the website: the file is saved as text/calendar (not text/csv), so iPhone Safari offers "Add to Calendar"
  await V.evaluate(() => { const o = URL.createObjectURL; window.__blobTypes = []; URL.createObjectURL = b => { window.__blobTypes.push(b?.type); return o.call(URL, b); }; });
  const [icsDl] = await Promise.all([V.waitForEvent('download', { timeout: 15000 }).catch(() => null), V.click(`#cal-${tid5} [data-act="cal-ics"]`)]); await w(500);
  log('web ics: file ' + (icsDl ? icsDl.suggestedFilename().replace(/^.*\./, '*.') : 'none') + ' | type', (await V.evaluate(() => window.__blobTypes.pop())) || 'none');
  await V.goto(process.env.WEB_URL + '#calendar.' + tid5); await V.reload(); await w(4000);
  log('web deep link: opens', await V.evaluate(t => !!document.querySelector('#cal-' + t + '.cal-card.hof-focus'), tid5), '| strip for visitor', await V.evaluate(() => !!document.querySelector('.cal-admin')));
  // a stranger can't hide it; the admin hides it from the page, and it drops off at once
  const strangerHide = await ok(V, 'update', 'calendar/' + tid5, { hidden: true, hiddenAt: Date.now() });
  await AD.goto(process.env.WEB_URL + '#calendar.' + tid5); await w(4000);
  const strip = await txt(AD, '#cal-' + tid5 + ' .cal-admin');
  await AD.click(`#cal-${tid5} [data-act="cal-hide"]`); await w(2000);
  const H = await AD.evaluate(t => window.__testRaw.get('calendar/' + t), tid5);
  const goneAdmin = !(await onPage(AD));
  await V.goto(process.env.WEB_URL + '#calendar'); await V.reload(); await w(4000); const goneV = !(await onPage(V));
  await V.goto(process.env.WEB_URL + '#calendar.' + tid5); await V.reload(); await w(3500); const notice = await txt(V, 'main .notice');
  await A.goto(process.env.WEB_URL + '#' + tid5); await w(3500); await A.click('[data-tab="setup"]'); await w(1500);
  const panel = await txt(A, '[data-cal-panel]');
  log('admin hide: hidden', H.hidden === true && typeof H.hiddenAt === 'number', '| gone from page', goneAdmin && goneV, '| organiser notice', panel.includes('Hidden from the Season Calendar by the site admin.'), '| stranger hides', strangerHide);
  log('admin hide more: strip', strip, '| visitor link', notice, '| organiser panel', panel);
  log('rules hide: admin bad hiddenAt', await ok(AD, 'update', 'calendar/' + tid5, { hiddenAt: 'yesterday' }), '| organiser unhides', await ok(A, 'update', 'calendar/' + tid5, { hidden: false }), '| stranger unhides', await ok(V, 'update', 'calendar/' + tid5, { hidden: false }));
  // the admin shows it again from its link; the organiser can still remove a listing
  await AD.goto(process.env.WEB_URL + '#calendar.' + tid5); await AD.reload(); await w(4500);
  const showBtn = await txt(AD, `#cal-${tid5} [data-act="cal-hide"]`);
  await AD.click(`#cal-${tid5} [data-act="cal-hide"]`); await w(2000);
  log('admin show again:', showBtn, '| hidden', (await AD.evaluate(t => window.__testRaw.get('calendar/' + t), tid5)).hidden, '| organiser removes', await ok(A, 'del', 'calendar/' + tid5));

  // ---- Season Calendar 3 (calendar-own-events): an event run elsewhere, its organiser link, and its rules ----
  const W = process.env.WEB_URL;
  const toastOf = async (p, re) => { try { await p.waitForFunction(r => new RegExp(r).test(document.querySelector('#toast')?.textContent || ''), re.source, { timeout: 15000 }); } catch {} return txt(p, '#toast'); };
  const evDoc = (id, u, extra) => Object.assign({ kind: 'event', id, name: 'Raw event', date: day(10), checkin: '', start: '', venue: '', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'singles', formatNote: '',
    who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', ownerUid: u, orgCode: '', byUid: u, byCode: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false }, extra);
  const E = await mk('eventOwner', 390); await E.goto(W + '#calendar'); await w(4500);
  await E.click('[data-act="cal-ev-new"]'); await w(400);
  await E.fill('#modal [data-cal="name"]', 'Arlesey Summer Doubles'); await E.click('#modal [data-act="cal-fmt"][data-k="doubles"]');
  await E.fill('#modal [data-cal="formatNote"]', 'Swiss, 4 rounds then knockouts'); await E.fill('#modal [data-cal="date"]', day(15)); await E.fill('#modal [data-cal="venue"]', 'Arlesey PC');
  if (process.env.OUT) await E.screenshot({ path: process.env.OUT + '/calendar-event-sheet-web-390.png' });
  await E.click('#modal [data-act="cal-save"]');
  const added = await toastOf(E, /Season Calendar/); await w(2500);
  const cid = await E.evaluate(() => location.hash.split('.')[1]);
  const EV = await E.evaluate(c => window.__testRaw.get('calendar/' + c), cid), euid = await E.evaluate(() => window.__testUid());
  const code = (await E.evaluate(c => window.__testRaw.get('calendar/' + c + '/private/code'), cid))?.code || '';
  log('web add event: ' + added + ' | kind', EV.kind, '| fmt', EV.fmt, '| on page', await E.evaluate(c => !!document.querySelector('#cal-' + c + '.cal-card'), cid),
    '| ownerUid mine', EV.ownerUid === euid, '| code private', code.length === 8 && !JSON.stringify(EV).includes(code));
  const orgLink = await E.evaluate(c => document.querySelector('#cal-org-' + c)?.value || '', cid);
  const ownerEdit = await E.evaluate(c => !!document.querySelector('#cal-' + c + ' [data-act="cal-ev-edit"]'), cid);
  await E.evaluate(c => document.querySelector('#cal-' + c)?.scrollIntoView(), cid); await w(300);
  if (process.env.OUT) await E.screenshot({ path: process.env.OUT + '/calendar-event-organiser-390.png' });
  await V.goto(W + '#calendar.' + cid); await V.reload(); await w(4500);
  const strangerEdit = await V.evaluate(c => !!document.querySelector('#cal-' + c + ' [data-act="cal-ev-edit"], #cal-' + c + ' [data-act="cal-page-remove"], #cal-org-' + c), cid);
  await V.evaluate(c => document.querySelector('#cal-' + c)?.scrollIntoView(), cid); await w(300);
  if (process.env.OUT) await V.screenshot({ path: process.env.OUT + '/calendar-event-stranger-390.png' });
  log('event organiser: Edit', ownerEdit, '| Organiser link', orgLink.endsWith('#calendar.' + cid + '.org.' + code) && !!code, '| stranger Edit', strangerEdit);
  log('event organiser more: format', await V.evaluate(c => [...document.querySelectorAll('#cal-' + c + ' dt')].find(d => d.textContent === 'Format')?.nextElementSibling.textContent.replace(/\s+/g, ' ').trim(), cid),
    '| live now', await V.evaluate(c => !!document.querySelector('#cal-' + c + ' .cal-live'), cid), '| competition links', await V.evaluate(c => !!document.querySelector('#cal-' + c + ' a.btn:not(.cal-maps)'), cid),
    '| note', await txt(E, '#cal-' + cid + ' .cal-orglink p'));

  // the organiser link joins another device; a wrong code doesn't
  const J = await mk('joiner', 390); await J.goto(W + '#calendar.' + cid + '.org.' + code);
  const joinToast = await toastOf(J, /edit this listing|didn't work/); await w(2500);
  const jUpdate = await ok(J, 'update', 'calendar/' + cid, { note: 'Bring your own boules', updatedAt: Date.now() });
  log('join link: ' + joinToast + ' | second device updates', jUpdate, '| wrong code: ' + await (async () => {
    const D = await mk('wrongCode'); await D.goto(W + '#calendar.' + cid + '.org.WRONG234'); const t = await toastOf(D, /edit this listing|didn't work/); return t; })());
  log('join link more: code stripped', await J.evaluate(c => location.hash === '#calendar.' + c, cid), '| Edit', await J.evaluate(c => !!document.querySelector('#cal-' + c + ' [data-act="cal-ev-edit"]'), cid),
    '| member', await raw(J, 'get', 'calendar/' + cid + '/members/' + await J.evaluate(() => window.__testUid())));
  // the joined device edits it from the sheet
  await J.click('#cal-' + cid + ' [data-act="cal-ev-edit"]'); await w(400); await J.fill('#modal [data-cal="venue"]', 'Arlesey Pétanque Club'); await J.click('#modal [data-act="cal-save"]');
  const jSaved = await toastOf(J, /Listing updated|organisers/); await w(1500);
  log('joined edit: ' + jSaved + ' | venue', (await E.evaluate(c => window.__testRaw.get('calendar/' + c), cid)).venue);

  // the rules for events
  const bUid = await B.evaluate(() => window.__testUid());
  log('rules: stranger updates event', await ok(B, 'update', 'calendar/' + cid, { note: 'Junk' }), '| stranger reads code', await ok(B, 'get', 'calendar/' + cid + '/private/code'),
    '| member reads code', await ok(J, 'get', 'calendar/' + cid + '/private/code'), '| change kind', await ok(E, 'update', 'calendar/' + cid, { kind: 'comp' }),
    '| change ownerUid', await ok(E, 'update', 'calendar/' + cid, { ownerUid: bUid }));
  log('rules more: stranger deletes', await ok(B, 'del', 'calendar/' + cid), '| stranger joins with wrong code', await ok(B, 'set', 'calendar/' + cid + '/members/' + bUid, { role: 'edit', code: 'WRONG234', joinedAt: Date.now() }),
    '| stranger writes code', await ok(B, 'set', 'calendar/' + cid + '/private/code', { code: 'MINEMINE' }), '| owner sets hidden', await ok(E, 'update', 'calendar/' + cid, { hidden: true }),
    '| change orgCode', await ok(E, 'update', 'calendar/' + cid, { orgCode: 'ABCDEFGH' }), '| change createdAt', await ok(E, 'update', 'calendar/' + cid, { createdAt: 5 }));
  log('rules create: own', await ok(B, 'set', 'calendar/cRawB', evDoc('cRawB', bUid)), '| someone else\'s ownerUid', await ok(B, 'set', 'calendar/cRawB2', evDoc('cRawB2', euid, { byUid: bUid })),
    '| at a competition\'s id', await ok(A, 'set', 'calendar/' + tid4, evDoc(tid4, await A.evaluate(() => window.__testUid()))), '| hidden', await ok(B, 'set', 'calendar/cRawB3', evDoc('cRawB3', bUid, { hidden: true })),
    '| other format', await ok(B, 'set', 'calendar/cRawB4', evDoc('cRawB4', bUid, { fmt: 'eurocup' })), '| wrong id', await ok(B, 'set', 'calendar/cRawB5', evDoc('cRawB6', bUid)), '| no name', await ok(B, 'set', 'calendar/cRawB7', evDoc('cRawB7', bUid, { name: '' })));

  // the admin hides it: "Your listings" still shows it (marked) to its organisers; the competition's listing (hidden) too
  await AD.evaluate(c => window.__testRaw.update('calendar/' + c, { hidden: true, hiddenAt: Date.now() }), cid);
  const mineOn = async (p, id) => p.evaluate(id => ({ row: !!document.querySelector('#calmine-' + id), mark: (document.querySelector('#calmine-' + id + ' .cal-hidden-mark')?.textContent || '') }), id);
  await E.goto(W + '#calendar'); await E.reload(); await w(5000); const em = await mineOn(E, cid);
  await J.goto(W + '#calendar'); await J.reload(); await w(5000); const jm = await mineOn(J, cid);
  await A.goto(W + '#calendar'); await A.reload(); await w(6000); const am = await mineOn(A, tid2);
  log('web your listings: event', em.row, '| competition listing', am.row, '| hidden marked', em.mark === 'Hidden by the site admin' && am.mark === 'Hidden by the site admin', '| joined device', jm.row && jm.mark === 'Hidden by the site admin',
    '| stranger reads hidden', await ok(B, 'get', 'calendar/' + cid), '| owner unhides', await ok(E, 'update', 'calendar/' + cid, { hidden: false }));
  if (process.env.OUT) await E.screenshot({ path: process.env.OUT + '/calendar-your-listings-390.png' });

  // organiser login on: a device without a code can't add an event; one logged in with a valid code can
  await AD.evaluate(() => window.__testDoc('orgcodes/EVTCODE7', { label: 'Events', createdAt: new Date(), expiresAt: new Date(Date.now() + 3 * 864e5), revoked: false }));
  await AD.evaluate(() => window.__testSetSite({ organiserLogin: true })); await w(1500);
  const F = await mk('orgLogin'); await F.goto(W); await w(3500); const fUid = await F.evaluate(() => window.__testUid());
  const noCode = await ok(F, 'set', 'calendar/cLogin1', evDoc('cLogin1', fUid));
  const loginWrite = await ok(F, 'set', 'organisers/' + fUid, { code: 'EVTCODE7', at: Date.now() });
  const withCode = await ok(F, 'set', 'calendar/cLogin2', evDoc('cLogin2', fUid, { orgCode: 'EVTCODE7', byCode: 'EVTCODE7' }));
  const ownerNoCode = await ok(E, 'update', 'calendar/' + cid, { note: 'Login on', updatedAt: Date.now() });
  const memberStill = await ok(J, 'update', 'calendar/' + cid, { note: 'Member edit', updatedAt: Date.now() });
  const sameCode = await ok(F, 'update', 'calendar/cLogin2', { note: 'Same code', updatedAt: Date.now() });
  log('rules, organiser login on: device without a code creates event', noCode, '| with a valid code', loginWrite && withCode);
  log('rules, organiser login on more: owner without a code updates', ownerNoCode, '| member updates', memberStill, '| code holder updates', sameCode);
  await AD.evaluate(() => window.__testSetSite({ organiserLogin: false })); await w(1500);

  // the owner takes it off the calendar: the private code goes with it
  await E.goto(W + '#calendar.' + cid); await E.reload(); await w(5000);
  await E.click('#cal-' + cid + ' [data-act="cal-page-remove"]'); await w(300); await E.click('#cal-' + cid + ' [data-act="cal-page-remove-yes"]');
  const removed = await toastOf(E, /Taken off|organisers|didn't save/); await w(1500);
  log('web event remove: ' + removed + ' | read', await raw(AD, 'get', 'calendar/' + cid), '| code', await raw(AD, 'get', 'calendar/' + cid + '/private/code'));
  log('errs', errs); await b.close();
})();
