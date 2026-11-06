// "Show on the front page" features a competition (featured) without making it an Example: it's listed under Featured,
// stays an ordinary competition (organisers run it and can publish it to the Hall of Fame; spectators get the usual tabs;
// visitors can't change it unless open testing applies). Only the admin makes examples; only organisers feature.
// Also the one-off move of Inter Regionals 2026 (tai2wt9p) from Examples to Featured, leaving its games untouched.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (n, width = 1100) => { const c = await b.newContext({ viewport: { width, height: 900 }, locale: 'en-GB' }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const raw = (p, op, path, data) => p.evaluate(async ([op, path, data]) => { try { const r = await window.__testRaw[op](path, data); return op === 'get' ? r : 'ok'; } catch (e) { return 'denied ' + (e.code || e.message); } }, [op, path, data]);
  const tabs = p => p.$$eval('#tabs button', e => e.map(x => x.dataset.tab).join(','));
  const groups = p => p.evaluate(() => [...document.querySelectorAll('.pick-group')].map(g => g.querySelector('.eyebrow').firstChild.textContent.trim() + ':' + [...g.querySelectorAll('[data-notr]')].map(x => x.textContent).join('/')).join(' | '));

  // the admin: open testing off, and an example
  const AD = await mk('admin'); await AD.goto(process.env.WEB_URL + '#admin'); await AD.waitForFunction(() => !!window.__testGoogle, null, { timeout: 30000 }); await w(1500);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  await AD.evaluate(() => window.__testSetSite({ openTesting: false })); await w(500);
  await AD.evaluate(() => { location.hash = ''; }); await w(500);
  await AD.click('[data-act="new-t"]'); await w(2500); const ex = await AD.evaluate(() => location.hash.slice(1));
  await AD.evaluate(async () => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name = 'Admin example'; t.listed = true; await S.store.setTournament(t); }); await w(1000);

  // one-off move: tai2wt9p was listed by its organiser; it becomes featured, games and results untouched, and only once
  const IR = 'tai2wt9p';
  await raw(AD, 'set', 'tournaments/' + IR, { id: IR, name: 'Inter Regionals 2026', ownerUid: await AD.evaluate(() => window.__testUid()), listed: true, archived: false, entry: 'teams', system: 'clubs', format: 'triples',
    teams: [{ id: 'k1', name: 'Kent', players: ['a', 'b', 'c'] }, { id: 'c1', name: 'Chiltern', players: ['d', 'e', 'f'] }], players: [], created: 1793023218066, updated: 1793039940000, device: 'Mac · Chrome' });
  await raw(AD, 'set', `tournaments/${IR}/matches/m1`, { id: 'm1', stage: 'club', a: ['k1'], b: ['c1'], sa: 13, sb: 9, done: true, round: 1 });
  const before = JSON.stringify([await raw(AD, 'get', 'tournaments/' + IR), await raw(AD, 'get', `tournaments/${IR}/matches/m1`)]);
  await AD.evaluate(() => window.__testSetSite({ featuredMoved: null })); await w(4000); // as on the live site: not yet run
  const irAfter = await raw(AD, 'get', 'tournaments/' + IR), mAfter = await raw(AD, 'get', `tournaments/${IR}/matches/m1`);
  const site = await raw(AD, 'get', 'config/site');
  const strip = o => { const c = Object.assign({}, o); delete c.listed; delete c.featured; return JSON.stringify(Object.keys(c).sort().map(k => [k, c[k]])); };
  const b0 = JSON.parse(before);
  log(`move: moved ${(site.featuredMoved?.ids || []).join(',')} | listed ${irAfter.listed} featured ${irAfter.featured} | other fields untouched ${strip(irAfter) === strip(b0[0])} | games untouched ${JSON.stringify(mAfter) === JSON.stringify(b0[1])}`);
  // the admin makes it an example again on purpose: the move doesn't run a second time
  await raw(AD, 'update', 'tournaments/' + IR, { listed: true, featured: false });
  await AD.reload(); await w(4000);
  log('move runs once:', (await raw(AD, 'get', 'tournaments/' + IR)).listed === true);
  await raw(AD, 'update', 'tournaments/' + IR, { listed: false, featured: true });

  // an organiser features their competition from Setup → Sharing
  const A = await mk('A'); await A.goto(process.env.WEB_URL); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500); const tid = await A.evaluate(() => location.hash.slice(1));
  await A.click('[data-act="wiz-skip"]'); await w(800); await A.click('[data-tab="entries"]'); await w(400);
  await A.fill('#bulk', 'Hitchin A\nLuton B'); await A.click('#bulk-form button[type=submit]'); await w(1000);
  await A.click('[data-act="checkin-all"]'); await w(800);
  await A.evaluate(async () => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); t.system = 'knockout'; t.name = 'Featured Open'; await S.store.setTournament(t); S.tournaments[t.id] = t; }); await w(1200);
  await A.click('[data-tab="setup"]'); await w(1500);
  log('sharing option:', await A.evaluate(() => { const c = document.querySelector('[data-check="featured"]'); return !!c && !document.querySelector('[data-check="listed"]') && c.closest('.panel').innerText.includes('listed under Featured'); }));
  await A.click('[data-check="featured"]'); await w(1500);
  const saved = await raw(A, 'get', 'tournaments/' + tid);
  log('organiser ticks it: featured', saved.featured, '| listed', saved.listed);
  await (await A.$('[data-check="featured"]')).evaluate(e => e.closest('.panel').scrollIntoView()); await A.screenshot({ path: process.env.OUT + '/web-featured-sharing.png' });
  log('organiser picker:', await (async () => { await A.click('[data-act="picker"]'); await w(300); const g = await groups(A); await A.click('[data-act="picker"]'); return g; })());

  // a new visitor: on the front page and in the picker under Featured, above Examples; not an example
  const V = await mk('V', 390); await V.goto(process.env.WEB_URL); await w(4000);
  const front = await V.evaluate(() => [...document.querySelectorAll('.start h2')].map(h => h.textContent).join(','));
  const inFeat = await V.evaluate(() => [...document.querySelectorAll('[data-featured] [data-notr]')].map(x => x.textContent).join('/'));
  await V.screenshot({ path: process.env.OUT + '/web-featured-front-phone.png', fullPage: true });
  await V.click('[data-act="picker"]'); await w(300); const vg = await groups(V);
  await V.screenshot({ path: process.env.OUT + '/web-featured-picker-phone.png' }); await V.click('[data-act="picker"]');
  log('front page sections:', front, '| featured:', inFeat);
  log('visitor picker:', vg);
  const featGroup = vg.split(' | ').find(g => g.includes('Featured Open'))?.split(':')[0];
  log(`featured: on front page ${inFeat.includes('Featured Open')} | group ${featGroup} | not an example ${!vg.split(' | ').find(g => g.startsWith('Examples'))?.includes('Featured Open')}`);
  await V.evaluate(id => { location.hash = id; }, tid); await w(2500);
  const vt = await tabs(V); await V.click('[data-tab="stream"]'); await w(500);
  await V.click('main [data-tab="display"]'); await w(800);
  const big = await V.evaluate(() => window.__carreau.S.tab === 'display' && !!document.querySelector('main').innerText.trim());
  log('featured, spectator tabs:', vt.split(',').join(', '), '| big screen', big, '| header', (await V.textContent('#tsel')).includes('Example') ? 'Example' : 'no example pill');
  await V.evaluate(() => { window.__carreau.S.tab = 'draw'; window.__carreau.render(); });
  const vRename = await V.evaluate(async () => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name = 'x'; try { await S.store.setTournament(t); return 'WROTE'; } catch (e) { return 'denied ' + e.code; } });
  const vUnfeat = await raw(V, 'update', 'tournaments/' + tid, { featured: false });
  log(`featured, visitor writes refused (open testing off): ${vRename.startsWith('denied') && vUnfeat.startsWith('denied')} | rename ${vRename} | unfeature ${vUnfeat}`);

  // open testing on: a visitor can run it, as any competition, but can't (un)feature it or make it an example
  await AD.evaluate(() => window.__testSetSite({ openTesting: true })); await w(2500);
  log('open testing: visitor edits', await raw(V, 'update', 'tournaments/' + tid, { name: 'Featured Open' }), '| unfeature', await raw(V, 'update', 'tournaments/' + tid, { featured: false }),
    '| make example', await raw(V, 'update', 'tournaments/' + tid, { listed: true }), '| feature another', await raw(V, 'update', 'tournaments/' + ex, { featured: true }));
  await AD.evaluate(() => window.__testSetSite({ openTesting: false })); await w(2000);

  // the organiser runs it and publishes it to the Hall of Fame
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="first-draw"]'); await w(1500);
  await A.evaluate(async () => { const C = window.__carreau; for (const m of C.MS().filter(m => m.a && m.b && !m.done)) await C.recordResult(m.id, 13, 9, true); }); await w(1500);
  await A.click('[data-tab="standings"]'); await w(1500);
  const can = await A.evaluate(() => window.__carreau.S.hofCanPublish(window.__carreau.T()));
  await A.click('[data-hof-panel] [data-act="hof-open"]'); await w(400);
  await A.click('#modal [data-act="hof-level"][data-k="national"]'); await w(100);
  await A.click('#modal [data-act="hof-save"]'); await w(2000);
  const hof = await raw(A, 'get', 'hallOfFame/' + tid);
  log(`featured, organiser publishes to the Hall of Fame: ${can && !!hof && hof.level === 'national'}`);
  log('organiser rules: make example', await raw(A, 'update', 'tournaments/' + tid, { listed: true }), '| unfeature', await raw(A, 'update', 'tournaments/' + tid, { featured: false }),
    '| feature again', await raw(A, 'update', 'tournaments/' + tid, { featured: true }), '| not a bool', await raw(A, 'update', 'tournaments/' + tid, { featured: 'yes' }));
  log('new competition listed by a visitor:', await raw(V, 'set', 'tournaments/zz' + Date.now(), { id: 'zz', name: 'x', ownerUid: await V.evaluate(() => window.__testUid()), listed: true, archived: false }));

  // examples: unchanged, view-only
  await V.evaluate(id => { location.hash = id; }, ex); await w(2500);
  const exTabs = await tabs(V);
  const exEdit = await V.evaluate(async () => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name = 'hacked'; try { await S.store.setTournament(t); return 'WROTE'; } catch (e) { return 'denied ' + e.code; } });
  await AD.evaluate(() => window.__testSetSite({ openTesting: true })); await w(2500);
  const exEditOpen = await raw(V, 'update', 'tournaments/' + ex, { name: 'hacked' });
  log(`example still view-only: ${exEdit.startsWith('denied') && exEditOpen.startsWith('denied')} | tabs ${exTabs} | hof ${await V.evaluate(() => window.__carreau.S.hofCanPublish(window.__carreau.T()))}`);
  await AD.evaluate(() => { location.hash = 'admin'; }); await w(2000);
  log('admin example button:', await AD.evaluate(id => document.querySelector(`[data-act="admin-example"][data-id="${id}"]`)?.textContent, ex));
  await AD.evaluate(() => window.__testSetSite({ openTesting: true })); await w(500); // leave the site as the other tests expect it
  log('errs', errs); await b.close();
})();
