// Season Calendar 1 (calendar-publish) against the Firestore rules: the organiser lists a competition from Setup; a phone
// with the organiser link can update it; another visitor (even with open testing on) can read a shown listing but can't
// list, change or remove it; an organiser can't hide a listing, list an example or an archived competition, or save a bad
// level. Archiving marks the listing gone; the admin's restore in #admin unmarks it.
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
  log('errs', errs); await b.close();
})();
