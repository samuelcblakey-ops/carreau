const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const mk = async (n, vw = 1100) => { const c = await b.newContext({ viewport: { width: vw, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const has = (p, sel) => p.evaluate(s => !!document.querySelector(s), sel);
  const A = await mk('organiser'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(() => location.hash.slice(1));
  await A.click('[data-act="wiz-skip"]'); await w(800); await A.click('[data-tab="entries"]'); await w(400); // a new competition opens on the quick setup
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
  log('score entry guide link:', await AD.evaluate(() => document.querySelector('[data-set="scoreMode"]')?.closest('.panel')?.querySelector('[data-act="guide-play"]')?.dataset.id));
  await AD.click('[data-set="scoreMode"][data-val="teams"]'); await w(2500);
  log('competition registered:', await A.evaluate(() => window.__carreau.S.teamScoringOn(window.__carreau.T())), '| organiser still no choice:', !(await has(A, '[data-set="scoreMode"]')));
  await AD.click('[data-act="team-links-make"]'); await w(1500);
  const links = await AD.evaluate(() => Object.fromEntries([...document.querySelectorAll('#team-links input[id^="tl-"]')].map(i => [i.id.slice(3), i.value])));
  await A.click('[data-tab="draw"]'); await w(200); await A.click('[data-tab="setup"]'); await w(500);
  const editLink = await A.inputValue('#share-edit');
  log('team links:', Object.keys(links).length);
  // per-team QR code: shown on its own, encodes that team's link, hides again
  const firstTeam = Object.keys(links)[0];
  await AD.click(`[data-act="team-qr"][data-id="${firstTeam}"]`); await w(1500);
  const qr = await AD.evaluate(() => { const c = document.querySelector('.qr-card'); return c ? { cards: document.querySelectorAll('.qr-card').length, name: c.querySelector('.qr-name').textContent, svg: c.querySelector('svg')?.outerHTML || '' } : null; });
  let decoded = '';
  if (qr && qr.svg) { try { const sharp = require('sharp'); const jsQR = require('jsqr'); const png = await sharp(Buffer.from(qr.svg.replace('<svg ', '<svg width="400" height="400" '))).png().toBuffer(); const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); decoded = jsQR(new Uint8ClampedArray(data.buffer), info.width, info.height)?.data || ''; } catch (e) { decoded = 'decode unavailable: ' + e.message; } }
  log('qr shown alone:', qr && qr.cards === 1 && qr.svg.length > 500, '| decodes to team link:', decoded === links[firstTeam] ? true : decoded);
  await AD.click(`[data-act="team-qr"][data-id="${firstTeam}"]`); await w(300); log('qr hidden again:', await AD.evaluate(() => !document.querySelector('.qr-card')));
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="first-draw"]'); await w(2500);
  const games = await A.evaluate(() => window.__carreau.MS().filter(m => m.a && m.b).sort((x, y) => x.order - y.order).map(m => ({ id: m.id, a: m.a[0], b: m.b[0] })));
  const [g1, g2] = games;
  const T1 = await mk('teamA', 390); await T1.goto(links[g1.a]); await w(4500);
  log('team panel:', await has(T1, '.team-panel [data-act="team-score"]'), '| team has no organiser tools:', !(await has(T1, '[data-act="assign"]')));
  await T1.click('.team-panel [data-act="team-score"]'); await w(300);
  await T1.click('[data-act="qlose"][data-k="sb"][data-n="7"]'); await w(1500);
  log('proposal pending:', await T1.evaluate(id => JSON.stringify((({ sa, sb, status }) => ({ sa, sb, status }))(window.__carreau.S.matches[id].proposal || {})), g1.id));
  // the owner taps a team's link on their own phone: it stays the organiser's phone
  const roleOf = p => p.evaluate(() => { const C = window.__carreau, t = C.T(); return C.S.permFn(t).edit && !C.S.myTeam(t) ? 'organiser' : C.S.myTeam(t) ? 'team' : 'viewer'; });
  const NOTICE = "You run this competition, so this phone stays an organiser. Open the team link on the team's phone.";
  await A.goto(links[g1.b]); await w(1500);
  const aToast = await A.textContent('#toast'); await A.click('[data-tab="draw"]'); await w(500);
  log('owner opens team link: role', await roleOf(A), '| to check shown', await has(A, '.check-panel'), '| notice shown', aToast.includes(NOTICE));
  if (process.env.OUT) await A.screenshot({ path: process.env.OUT + '/owner-team-link.png' });
  await AD.evaluate(() => { location.hash = 'admin'; }); await w(1500); // only the owner's phone is left to publish
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
  log("team proposes, other team confirms: published by the owner's phone", await A.evaluate(id => { const m = window.__carreau.S.matches[id]; return m.done === true && m.proposal.status === 'applied'; }, g1.id));
  await AD.evaluate(id => { location.hash = id; }, tid); await w(2000);
  await w(1500); log('team sees result:', (await T1.textContent('.team-panel')).replace(/\s+/g, ' ').includes('Won 13–7'));
  // a phone with the organiser link opens a team link: it can still edit
  const O = await mk('organiserLink', 390); await O.goto(editLink); await w(4500);
  await O.goto(links[g2.b]); await w(1500);
  const oToast = await O.textContent('#toast');
  if (process.env.OUT) await O.screenshot({ path: process.env.OUT + '/organiser-link-team-link.png' });
  await O.click('[data-tab="draw"]'); await w(500);
  log('organiser-link phone opens team link: can still edit', (await roleOf(O)) === 'organiser' && await has(O, '[data-tab="setup"]'), '| notice', oToast.includes(NOTICE));
  await O.context().close();
  // dispute on game 2
  const T3 = await mk('teamC', 390); await T3.goto(links[g2.a]); await w(4500);
  await T3.click('.team-panel [data-act="team-score"]'); await w(300);
  await T3.click('[data-act="mode"][data-mode="full"]'); await w(100); await T3.click('[data-act="pick"][data-k="sa"][data-n="13"]'); await w(100); await T3.click('[data-act="pick"][data-k="sb"][data-n="2"]'); await w(100); await T3.click('[data-act="save-final"]'); await w(1500);
  const T4 = await mk('teamD', 390); await T4.goto(links[g2.b]); await w(4500);
  await T4.click('[data-act="team-dispute"]'); await w(2500);
  log('organiser sees dispute:', (await A.textContent('.check-panel')).includes('Disputed'), '| not published:', await A.evaluate(id => !window.__carreau.S.matches[id].done, g2.id));
  log('dispute views:', JSON.stringify({ desk: (await A.textContent('.check-panel')).replace(/\s+/g, ' ').trim(), sender: (await T3.textContent('.team-panel')).replace(/\s+/g, ' ').trim(), disputer: (await T4.textContent('.team-panel')).replace(/\s+/g, ' ').trim() }));
  if (process.env.OUT) { await A.click('[data-tab="draw"]').catch(() => {}); await w(500); await A.screenshot({ path: process.env.OUT + '/dispute-desk.png' }); await T3.screenshot({ path: process.env.OUT + '/dispute-sender.png' }); await T4.screenshot({ path: process.env.OUT + '/dispute-other.png' }); }
  await A.click(`[data-act="check-accept"][data-id="${g2.id}"]`); await w(2000);
  log('organiser settled:', await A.evaluate(id => { const m = window.__carreau.S.matches[id]; return m.done + ' ' + m.sa + '-' + m.sb; }, g2.id));
  // registration gate: the field alone isn't enough, the admin must have switched this competition on
  const setReg = (on) => AD.evaluate(on => window.__testSetSite({ teamScoringComps: { [location.hash.slice(1)]: on } }), on);
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="next-round"]'); await w(2500);
  await setReg(false); await w(2000);
  const tryPropose = () => T1.evaluate(async () => { const C = window.__carreau, S = C.S, t = C.T(); const me = S.myTeam(t); const m = C.MS().find(m => !m.done && m.a && m.b && (m.a.includes(me) || m.b.includes(me)));
    try { await S.teamPropose(t, m, 13, 3); return 'WROTE'; } catch (e) { return e.code; } });
  log('unregistered comp, team propose:', await tryPropose());
  await setReg(true); await w(2000);
  log('re-registered, team propose:', await tryPropose());
  // a team phone's console can't send a score the dialog wouldn't: the rules check the numbers and the server's clock
  const consoleTry = (how) => T1.evaluate(async how => { const C = window.__carreau, S = C.S, t = C.T(); const me = S.myTeam(t); const m = C.MS().find(m => !m.done && m.a && m.b && (m.a.includes(me) || m.b.includes(me)));
    try { if (how.at0) await S.store.updateMatch(t.id, m.id, { proposal: { sa: 13, sb: 7, by: me, at: 0, status: 'pending' } }); else await S.teamPropose(t, m, how.sa, how.sb, how.time); return 'accepted'; }
    catch (e) { return e.code === 'permission-denied' ? 'refused' : e.code; } }, how);
  log('console at 0', await consoleTry({ at0: true }));
  log('console 99-0', await consoleTry({ sa: 99, sb: 0 }));
  log('console 7-7 time', await consoleTry({ sa: 7, sb: 7, time: true }));
  log('console 13-14', await consoleTry({ sa: 13, sb: 14 }));
  log('valid 13-7', await consoleTry({ sa: 13, sb: 7 }));
  log('valid ended on time 9-7', await consoleTry({ sa: 9, sb: 7, time: true }));
  // a bad proposal that got in anyway (written here by the admin) is left for the organiser to check, not published
  const bad = await AD.evaluate(async () => { const C = window.__carreau, t = C.T(); const m = C.MS().find(m => !m.done && m.a && m.b && m.proposal);
    await C.S.store.updateMatch(t.id, m.id, { proposal: { sa: 99, sb: 0, by: m.a[0], at: Date.now(), status: 'confirmed', confirmedBy: m.b[0] } }); return m.id; });
  await w(4000);
  log("organiser's phone skips an invalid proposal:", await A.evaluate(id => { const m = window.__carreau.S.matches[id]; return !m.done && m.proposal.sa === 99 && m.proposal.status === 'confirmed' && !!document.querySelector(`.check-panel [data-act="check-accept"][data-id="${id}"]`); }, bad));
  // auto-confirm runs on the server's time: not published at once, published once the wait (3 s here) is over
  await AD.evaluate(async id => { const C = window.__carreau, t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { scoreMode: 'teams-auto', autoConfirmMin: 0.05 });
    await C.S.store.setTournament(t); await C.S.store.updateMatch(t.id, id, { proposal: null }); }, bad); await w(2000);
  await consoleTry({ sa: 13, sb: 5 }); await w(500);
  const early = await A.evaluate(id => !!window.__carreau.S.matches[id].done, bad); await w(5000);
  log('auto-confirm on server time: early', early, '| after the wait', await A.evaluate(id => { const m = window.__carreau.S.matches[id]; return m.done + ' ' + m.sa + '-' + m.sb + ' ' + m.proposal.status; }, bad));
  await AD.evaluate(async () => { const C = window.__carreau, t = JSON.parse(JSON.stringify(C.T())); t.scoreMode = 'teams'; delete t.autoConfirmMin; await C.S.store.setTournament(t); }); await w(1500);
  // EuroCup: a club plays both triples of a tie at once, so its link lists every game on a piste
  const eid = await AD.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="new-t"]').click(); await w(2500);
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'EuroCup teams', system: 'eurocup', euroFormat: 'rounds', checkin: false, wizard: false, scoreMode: 'teams' });
    ['North', 'South'].forEach((cl, ci) => t.teams.push({ id: `e${ci}`, name: cl, club: cl, players: Array.from({ length: 7 }, (_, i) => `${cl[0]}${i + 1}`), genders: ['f', 'f', 'm', 'm', 'm', 'm', 'm'], active: true }));
    await S.store.setTournament(t); await window.__testSetSite({ teamScoringComps: { [t.id]: true } }); await w(1500); return t.id; });
  await AD.click('[data-tab="setup"]'); await w(800); await AD.click('[data-act="team-links-make"]'); await w(1500);
  const elinks = await AD.evaluate(() => Object.fromEntries([...document.querySelectorAll('#team-links input[id^="tl-"]')].map(i => [i.id.slice(3), i.value])));
  await AD.evaluate(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-tab="draw"]').click(); await w(400); q('[data-act="first-draw"]').click(); await w(3000);
    const f = C.T().clubFix[0]; q(`[data-act="eu-lineup"][data-fx="${f.id}"][data-leg="1"]`).click(); await w(300);
    const pick = async v => { [...document.querySelectorAll('.modal .lu-p')].find(b => b.firstElementChild.textContent === v).click(); await w(40); };
    for (const n of ['N3', 'N4', 'N5', 'N1', 'N2', 'N6']) await pick(n);
    q('.modal .lu-squad [data-act="lu-side"]').click(); await w(60);
    for (const n of ['S3', 'S4', 'S5', 'S1', 'S2', 'S6']) await pick(n);
    q('[data-act="lu-save"]').click(); await w(2500); });
  const E1 = await mk('euroClub', 390); await E1.goto(elinks.e0); await w(4500);
  const ep = await E1.evaluate(() => { const C = window.__carreau, mt = C.MS().find(m => m.eu === 'mt'); return { games: document.querySelectorAll('.team-panel .team-game').length, mixed: !!document.querySelector(`.team-panel [data-act="team-score"][data-id="${mt.id}"]`), mt: mt.id }; });
  log('eurocup team panel: games', ep.games, '| can enter mixed triple', ep.mixed);
  if (process.env.OUT) await E1.screenshot({ path: process.env.OUT + '/eurocup-team-panel.png', fullPage: true });
  await E1.click(`.team-panel [data-act="team-score"][data-id="${ep.mt}"]`); await w(300);
  await E1.click('[data-act="qlose"][data-k="sb"][data-n="9"]'); await w(1500);
  log('eurocup mixed triple sent:', await E1.evaluate(id => window.__carreau.S.matches[id].proposal?.status, ep.mt));
  await AD.evaluate(id => { location.hash = id; }, tid); await w(2000);
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
