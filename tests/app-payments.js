// Payments (payments-registration): organisers tick each team (or player) as paid in Registration with one tap either
// way, with Undo; a summary line and a "Not paid" chip; withdrawn teams keep their payment but don't count; the draw
// ignores payments; players and spectators never see any of it.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    q('[data-act="new-t"]').click(); await w(150); q('[data-act="wiz-skip"]').click(); await w(100);
    q('[data-tab="entries"]').click(); await w(80);
    q('#bulk').value = 'Les Pointeurs: A, B, C\nBoule d\'Or: D, E, F\nMistral: G, H, I\nGravier: J, K, L'; q('#bulk-form button[type=submit]').click(); await w(250);
    const ids = C.T().teams.map(x => x.id), btn = id => q(`[data-act="pay"][data-id="${id}"]`), txt = el => el ? el.textContent.trim() : 'none';
    const sum = () => txt(q('#pay-count')), toastTxt = () => q('#toast').hidden ? '' : txt(q('#toast span'));
    const organiser = qa('[data-act="pay"]').length === 4;
    S.canWrite = false; C.render(); await w(60); const spectator = qa('[data-act="pay"]').length > 0 || !!q('#pay-count'); S.canWrite = true; C.render(); await w(60); q('[data-tab="entries"]').click(); await w(80);
    L.push(`paid button: organiser ${organiser} | spectator ${spectator}`);
    const h = Math.round(btn(ids[0]).getBoundingClientRect().height);
    btn(ids[0]).click(); await w(150);
    L.push(`one tap: ${txt(btn(ids[0]))} | toast ${toastTxt()} | summary ${sum()}`);
    btn(ids[0]).click(); await w(150);
    L.push(`tap again: ${txt(btn(ids[0]))} | summary ${sum()}`);
    btn(ids[1]).click(); await w(150); const before = txt(btn(ids[1]));
    q('[data-act="toast-undo"]').click(); await w(200); const after = txt(btn(ids[1]));
    L.push(`undo: ${before} → ${after} ${before === 'Paid' && after === 'Not paid'}`);
    L.push(`button height 44+: ${h >= 44}`);
    btn(ids[0]).click(); await w(150);
    const shown = () => qa('[data-row]').filter(r => !r.hidden).length;
    q('[data-act="pay-only"]').click(); await w(80); const n1 = shown(); q('[data-act="pay-only"]').click(); await w(80);
    L.push(`not paid chip: ${n1} shown | again: ${shown()} shown`);
    // two paid, then one of them withdraws: it stays paid (for a refund) but leaves the count
    btn(ids[1]).click(); await w(150);
    q(`[data-act="toggle-e"][data-id="${ids[0]}"]`).click(); await w(150);
    L.push(`withdrawn keeps paid: ${txt(btn(ids[0])) === 'Paid'} | not counted: ${sum()}`);
    // the draw ignores payments: an unpaid team is drawn like any other
    q(`[data-act="toggle-e"][data-id="${ids[0]}"]`).click(); await w(150);
    q('[data-act="checkin-all"]').click(); await w(150);
    q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(400);
    L.push(`draw unaffected: unpaid team drawn ${JSON.stringify(S.matches).includes('"' + ids[2] + '"')}`);
    q('[data-tab="entries"]').click(); await w(100);
    L.push(`phone 390: no sideways scroll ${document.documentElement.scrollWidth <= innerWidth}`);
    // mêlée: one button per player
    q('[data-act="new-t"]').click(); await w(150); q('[data-act="wiz-skip"]')?.click(); await w(100);
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Mêlée', entry: 'melee', checkin: false, wizard: false });
    t.players = Array.from({ length: 6 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, active: true })); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(60);
    q('[data-tab="entries"]').click(); await w(100);
    L.push(`melee: player row has Paid ${!!q('[data-row="p0"] [data-act="pay"]')}`);
    // back to the first competition, with a mix of paid and unpaid, for the screenshots
    S.tid = Object.values(S.tournaments).find(x => x.name !== 'Mêlée').id; S.matches = {}; C.render(); await w(150);
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  console.log(out.join('\n'));
  await p.evaluate(() => { const r = document.querySelector('.pay-sum'); r && r.scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(100);
  await p.screenshot({ path: process.env.OUT + '/payments-phone.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(150);
  await p.evaluate(() => { const r = document.querySelector('.pay-sum'); r && r.scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(100);
  await p.screenshot({ path: process.env.OUT + '/payments-desktop.png' });
  console.log('errs', errs); await b.close();
})();
