// Hall of Fame, publishing (PR 1) against the Firestore rules: the organiser publishes from Standings; another visitor
// (even with open testing on) can read a shown entry but can't publish, change or remove it; only the admin can hide an
// entry or lock its level, and an organiser's update must leave those alone; hidden entries are for the admin and organiser only.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async n => { const c = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'en-GB' }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const raw = (p, op, path, data) => p.evaluate(async ([op, path, data]) => { try { const r = await window.__testRaw[op](path, data); return op === 'get' ? (r ? 'read ' + (r.level || 'doc') : 'none') : Array.isArray(r) ? r.join(',') : 'ok'; } catch (e) { return 'denied ' + (e.code || e.message); } }, [op, path, data]);
  const A = await mk('A'); await A.goto(process.env.WEB_URL); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(() => location.hash.slice(1));
  await A.click('[data-act="wiz-skip"]'); await w(800); await A.click('[data-tab="entries"]'); await w(400);
  await A.fill('#bulk', 'Hitchin A\nLuton B'); await A.click('#bulk-form button[type=submit]'); await w(1000);
  await A.click('[data-act="checkin-all"]'); await w(800);
  await A.evaluate(async () => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); t.system = 'knockout'; await S.store.setTournament(t); S.tournaments[t.id] = t; }); await w(1200);
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="first-draw"]'); await w(1500);
  await A.evaluate(async () => { const C = window.__carreau; for (const m of C.MS().filter(m => m.a && m.b && !m.done)) await C.recordResult(m.id, 13, 9, true); }); await w(1500);
  await A.click('[data-tab="standings"]'); await w(1500);
  log('owner panel:', await A.evaluate(() => document.querySelector('[data-hof-panel]')?.textContent.replace(/\s+/g, ' ').trim()));
  await A.click('[data-hof-panel] [data-act="hof-open"]'); await w(400);
  await A.click('#modal [data-act="hof-level"][data-k="national"]'); await w(100);
  await A.click('#modal [data-act="hof-save"]'); await w(2000);
  log('published:', await A.evaluate(() => document.querySelector('#toast')?.textContent), '|', await raw(A, 'get', 'hallOfFame/' + tid));
  const entry = await A.evaluate(t => window.__carreau.S.hof[t], tid);
  log('entry:', entry.level, entry.country, entry.hidden, entry.byUid === await A.evaluate(() => window.__testUid()), entry.parts.length, entry.parts[0].winner.name);

  // another visitor, open testing on (the default): can run the competition, but not publish it
  const B = await mk('B'); await B.goto(process.env.WEB_URL + '#' + tid); await w(3500);
  await B.click('[data-tab="standings"]'); await w(1200);
  log('visitor panel:', await B.evaluate(() => !!document.querySelector('[data-hof-panel]')));
  log('visitor read shown:', await raw(B, 'get', 'hallOfFame/' + tid), '| list shown has it:', (await raw(B, 'hofShown')).split(',').includes(tid), '| list all:', await raw(B, 'hofAll'));
  const bad = Object.assign({}, entry, { name: 'Junk' });
  log('visitor writes:', await raw(B, 'set', 'hallOfFame/' + tid, bad), '|', await raw(B, 'update', 'hallOfFame/' + tid, { note: 'x' }), '|', await raw(B, 'del', 'hallOfFame/' + tid));
  log('visitor missing entry:', await raw(B, 'get', 'hallOfFame/nothing-here'));

  // the organiser can't hide its own entry or lock fields, or publish nonsense
  log('owner hide:', await raw(A, 'update', 'hallOfFame/' + tid, { hidden: true }), '| lock:', await raw(A, 'update', 'hallOfFame/' + tid, { levelSetBy: 'admin' }));
  log('owner bad level:', await raw(A, 'update', 'hallOfFame/' + tid, { level: 'world' }), '| extra key:', await raw(A, 'update', 'hallOfFame/' + tid, { score: 1 }),
    '| byUid:', await raw(A, 'update', 'hallOfFame/' + tid, { byUid: 'someone' }), '| note ok:', await raw(A, 'update', 'hallOfFame/' + tid, { note: 'Great day' }));
  log('owner other tid:', await raw(A, 'set', 'hallOfFame/xyz', Object.assign({}, entry, { tid: 'xyz' })), '| wrong tid field:', await raw(A, 'set', 'hallOfFame/' + tid, Object.assign({}, entry, { tid: 'other' })));

  // B's own competition: A can't publish it
  await B.click('[data-act="new-t"]'); await w(2500); const tidB = await B.evaluate(() => location.hash.slice(1));
  log('publish someone else\'s:', await raw(A, 'set', 'hallOfFame/' + tidB, Object.assign({}, entry, { tid: tidB })), '| own create hidden:', await raw(B, 'set', 'hallOfFame/' + tidB, Object.assign({}, entry, { tid: tidB, byUid: await B.evaluate(() => window.__testUid()), hidden: true })),
    '| own create:', await raw(B, 'set', 'hallOfFame/' + tidB, Object.assign({}, entry, { tid: tidB, byUid: await B.evaluate(() => window.__testUid()) })));

  // the admin hides the entry and sets the level, with a reason
  const AD = await mk('admin'); await AD.goto(process.env.WEB_URL + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  log('admin hide:', await raw(AD, 'update', 'hallOfFame/' + tid, { hidden: true, hiddenAt: Date.now(), level: 'open', levelSetBy: 'admin' }), '| reason:', await raw(AD, 'set', 'hallOfFame/' + tid + '/private/admin', { reason: 'Test entry' }));
  log('hidden: visitor read', await raw(B, 'get', 'hallOfFame/' + tid), '| visitor list has it', (await raw(B, 'hofShown')).split(',').includes(tid), '| owner read', await raw(A, 'get', 'hallOfFame/' + tid), '| admin list', (await raw(AD, 'hofAll')).split(',').includes(tid));
  log('reason: owner', await raw(A, 'get', 'hallOfFame/' + tid + '/private/admin'), '| visitor', await raw(B, 'get', 'hallOfFame/' + tid + '/private/admin'), '| owner write', await raw(A, 'set', 'hallOfFame/' + tid + '/private/admin', { reason: '' }));
  log('owner unhide:', await raw(A, 'update', 'hallOfFame/' + tid, { hidden: false }), '| relevel:', await raw(A, 'update', 'hallOfFame/' + tid, { level: 'national' }), '| keep level:', await raw(A, 'update', 'hallOfFame/' + tid, { note: 'Still mine', level: 'open' }));
  // #admin: bulk "Archive selected" marks the entry gone (no link to the competition); the list's Restore links it again
  const gone = () => AD.evaluate(async t => (await window.__testRaw.get('hallOfFame/' + t))?.gone, tid);
  await AD.click(`#adm-comps [data-act="adm-sel"][data-id="${tid}"]`); await w(300); await AD.click('#adm-comps [data-act="adm-bulk-arch"]'); await w(2500);
  log('admin bulk archive: entry link hidden', await gone() === true, '| archived', await AD.evaluate(t => window.__carreau.S.tournaments[t]?.archived, tid));
  await AD.click(`#adm-comps [data-act="admin-restore"][data-id="${tid}"]`); await w(2500);
  log('admin list restore: entry link shown', await gone() === false, '| archived', await AD.evaluate(t => window.__carreau.S.tournaments[t]?.archived, tid));
  await A.reload(); await w(3500); await A.click('[data-tab="standings"]'); await w(1500);
  log('owner panel hidden:', await A.evaluate(() => document.querySelector('[data-hof-panel]')?.textContent.replace(/\s+/g, ' ').trim()));
  await A.click('[data-hof-panel] [data-act="hof-remove"]'); await w(200); await A.click('[data-act="hof-remove-yes"]'); await w(1500);
  log('owner removed:', await raw(A, 'get', 'hallOfFame/' + tid), '| toast', await A.evaluate(() => document.querySelector('#toast')?.textContent));
  log('errs', errs); await b.close();
})();
