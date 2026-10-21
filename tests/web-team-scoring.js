const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const mk = async (n, vw = 1100) => { const c = await b.newContext({ viewport: { width: vw, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const has = (p, sel) => p.evaluate(s => !!document.querySelector(s), sel);
  const A = await mk('organiser'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(() => location.hash.slice(1));
  await A.fill('#bulk', 'Club Pins\nCarreau Vents\nGravier Collines\nMistral Lions'); await A.click('#bulk-form button[type=submit]'); await w(1200);
  await A.click('[data-act="checkin-all"]'); await w(800);
  await A.click('[data-tab="setup"]'); await w(500);
  log('flag off, no score entry choice:', !(await has(A, '[data-set="scoreMode"]')));
  const AD = await mk('admin'); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  log('admin switch shows off:', await AD.evaluate(() => document.querySelector('[data-act="team-scoring"][data-mode="off"]')?.getAttribute('aria-pressed') === 'true'));
  await AD.click('[data-act="team-scoring"][data-mode="admin"]'); await w(1500);
  await AD.click('[data-act="open-testing"]'); await w(2500); // strict mode: rules decide who can do what
  await A.click('[data-tab="setup"]'); await w(800);
  log('admin mode, organiser sees no choice:', !(await has(A, '[data-set="scoreMode"]')));
  await AD.evaluate(id => { location.hash = id; }, tid); await w(2500); await AD.click('[data-tab="setup"]'); await w(800);
  log('admin mode, admin sees choice:', await has(AD, '[data-set="scoreMode"]'));
  await AD.click('[data-set="scoreMode"][data-val="teams"]'); await w(2500);
  log('competition registered:', await A.evaluate(() => window.__carreau.S.teamScoringOn(window.__carreau.T())), '| organiser still no choice:', !(await has(A, '[data-set="scoreMode"]')));
  await AD.click('[data-act="team-links-make"]'); await w(1500);
  const links = await AD.evaluate(() => Object.fromEntries([...document.querySelectorAll('#team-links input[id^="tl-"]')].map(i => [i.id.slice(3), i.value])));
  log('team links:', Object.keys(links).length);
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="first-draw"]'); await w(2500);
  const games = await A.evaluate(() => window.__carreau.MS().filter(m => m.a && m.b).sort((x, y) => x.order - y.order).map(m => ({ id: m.id, a: m.a[0], b: m.b[0] })));
  const [g1, g2] = games;
  const T1 = await mk('teamA', 390); await T1.goto(links[g1.a]); await w(4500);
  log('team panel:', await has(T1, '.team-panel [data-act="team-score"]'), '| team has no organiser tools:', !(await has(T1, '[data-act="assign"]')));
  await T1.click('.team-panel [data-act="team-score"]'); await w(300);
  await T1.click('[data-act="pick"][data-k="sa"][data-n="13"]'); await w(100); await T1.click('[data-act="pick"][data-k="sb"][data-n="7"]'); await w(100);
  await T1.click('[data-act="save-final"]'); await w(1500);
  log('proposal pending:', await T1.evaluate(id => JSON.stringify((({ sa, sb, status }) => ({ sa, sb, status }))(window.__carreau.S.matches[id].proposal || {})), g1.id));
  const sec = await T1.evaluate(async ([g1, g2]) => { const C = window.__carreau, S = C.S, t = C.T(); const out = [];
    try { await S.store.updateMatch(t.id, g1, { sa: 13, sb: 0, done: true }); out.push('result WROTE'); } catch (e) { out.push('result ' + e.code); }
    try { await S.teamRespond(t, S.matches[g1], 'confirmed'); out.push('self-confirm WROTE'); } catch (e) { out.push('self-confirm ' + e.code); }
    try { await S.teamPropose(t, S.matches[g2], 13, 1); out.push('other game WROTE'); } catch (e) { out.push('other game ' + e.code); }
    return out.join(' | '); }, [g1.id, g2.id]);
  log('team security:', sec);
  const T2 = await mk('teamB', 390); await T2.goto(links[g1.b]); await w(4500);
  log('opponent asked to confirm:', (await T2.textContent('.team-panel')).replace(/\s+/g, ' ').includes('entered 7–13'));
  await T2.screenshot({ path: process.env.OUT + '/team-confirm.png' });
  await T2.click('[data-act="team-confirm"]'); await w(4000);
  log('organiser screen published:', await A.evaluate(id => { const m = window.__carreau.S.matches[id]; return m.done + ' ' + m.sa + '-' + m.sb + ' ' + m.proposal.status; }, g1.id));
  await w(1500); log('team sees result:', (await T1.textContent('.team-panel')).replace(/\s+/g, ' ').includes('Won 13–7'));
  // dispute on game 2
  const T3 = await mk('teamC', 390); await T3.goto(links[g2.a]); await w(4500);
  await T3.click('.team-panel [data-act="team-score"]'); await w(300);
  await T3.click('[data-act="pick"][data-k="sa"][data-n="13"]'); await w(100); await T3.click('[data-act="pick"][data-k="sb"][data-n="2"]'); await w(100); await T3.click('[data-act="save-final"]'); await w(1500);
  const T4 = await mk('teamD', 390); await T4.goto(links[g2.b]); await w(4500);
  await T4.click('[data-act="team-dispute"]'); await w(2500);
  log('organiser sees dispute:', (await A.textContent('.check-panel')).includes('Disputed'), '| not published:', await A.evaluate(id => !window.__carreau.S.matches[id].done, g2.id));
  await A.click(`[data-act="check-accept"][data-id="${g2.id}"]`); await w(2000);
  log('organiser settled:', await A.evaluate(id => { const m = window.__carreau.S.matches[id]; return m.done + ' ' + m.sa + '-' + m.sb; }, g2.id));
  // registration gate: the field alone isn't enough, the admin must have switched this competition on
  const setReg = (on) => AD.evaluate(async on => { const { getFirestore, doc, setDoc } = await import('/fb/firebase-firestore.js'); const { getApp } = await import('/fb/firebase-app.js');
    await setDoc(doc(getFirestore(getApp()), 'config', 'site'), { teamScoringComps: { [location.hash.slice(1)]: on } }, { merge: true }); }, on);
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="next-round"]'); await w(2500);
  await setReg(false); await w(2000);
  const tryPropose = () => T1.evaluate(async () => { const C = window.__carreau, S = C.S, t = C.T(); const me = S.myTeam(t); const m = C.MS().find(m => !m.done && m.a && m.b && (m.a.includes(me) || m.b.includes(me)));
    try { await S.teamPropose(t, m, 13, 3); return 'WROTE'; } catch (e) { return e.code; } });
  log('unregistered comp, team propose:', await tryPropose());
  await setReg(true); await w(2000);
  log('re-registered, team propose:', await tryPropose());
  // everyone mode: organisers see the choice; off: hidden everywhere
  await AD.evaluate(() => { location.hash = 'admin'; }); await w(1500);
  await AD.click('[data-act="team-scoring"][data-mode="all"]'); await w(2000);
  await A.click('[data-tab="setup"]'); await w(500); log('everyone mode, organiser sees choice:', await has(A, '[data-set="scoreMode"]'));
  await AD.click('[data-act="team-scoring"][data-mode="off"]'); await w(2000);
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-tab="setup"]'); await w(500);
  log('switched off hides it:', !(await has(A, '[data-set="scoreMode"]')) && !(await has(A, '#team-links')), '| team panel gone:', !(await has(T1, '.team-panel')));
  await AD.click('[data-act="open-testing"]'); await w(1500); // back to the beta default for later tests
  log('errs', errs); await b.close();
})();
