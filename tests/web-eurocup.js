// EuroCup on the real database (emulator): squads with men and women save, the ties draw, line-ups save on each game
// (lists of names, no lists inside lists), the games go to pistes, and it all reads back after a reload.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(process.env.WEB_URL); await new Promise(r => setTimeout(r, 3500));
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    q('[data-act="new-t"]').click(); await w(2500);
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'EuroCup web', system: 'eurocup', euroFormat: 'rounds', checkin: false, wizard: false });
    ['North', 'South'].forEach((cl, ci) => t.teams.push({ id: `e${ci}`, name: cl, club: cl, players: Array.from({ length: 7 }, (_, i) => `${cl[0]}${i + 1}`), genders: ['f', 'f', 'm', 'm', 'm', 'm', 'm'], active: true }));
    await S.store.setTournament(t); await w(1500);
    q('[data-tab="draw"]').click(); await w(400); q('[data-act="first-draw"]').click(); await w(3000);
    const ms = C.MS(); L.push(`saved: games ${ms.length} | ties ${C.T().clubFix.length} | toast ${q('#toast').textContent}`);
    const f = C.T().clubFix[0]; q(`[data-act="eu-lineup"][data-fx="${f.id}"][data-leg="1"]`).click(); await w(300);
    const set = async (mid, side, i, v) => { const el = q(`.modal select[data-lu="${mid}"][data-side="${side}"][data-i="${i}"]`); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); await w(40); };
    const ot = ms.find(m => m.eu === 'ot'), mt = ms.find(m => m.eu === 'mt');
    for (const [k, X] of [['a', 'N'], ['b', 'S']]) { for (let i = 0; i < 3; i++) await set(ot.id, k, i, `${X}${i + 3}`); await set(mt.id, k, 0, `${X}1`); await set(mt.id, k, 1, `${X}2`); await set(mt.id, k, 2, `${X}6`); }
    q('[data-act="lu-save"]').click(); await w(2500);
    L.push(`line-ups: ${C.MS().find(m => m.id === ot.id).la.join(',')} v ${C.MS().find(m => m.id === ot.id).lb.join(',')} | on pistes ${C.MS().filter(m => m.court).map(m => m.eu).sort().join(',')} | toast ${q('#toast').textContent}`);
    q(`[data-match="${ot.id}"]`).click(); await w(300); q('[data-act="qlose"][data-k="sb"][data-n="7"]').click(); await w(1500);
    L.push(`scored: ${C.MS().find(m => m.id === ot.id).sa}-${C.MS().find(m => m.id === ot.id).sb} | tie ${q('.fixture .fx').innerText.replace(/\s+/g, ' ')}`);
    location.reload();
    } catch (e) { L.push('ERR ' + e.message); } return L; }).catch(() => null);
  await new Promise(r => setTimeout(r, 4000));
  const back = await p.evaluate(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)); await w(1500);
    const ot = C.MS().find(m => m.eu === 'ot'), mt = C.MS().find(m => m.eu === 'mt');
    return `after reload: games ${C.MS().length} | genders ${C.T().teams.map(x => x.genders.join('')).join(' ')} | open triple ${ot.la.join(',')} v ${ot.lb.join(',')} done ${ot.done} | mixed ${mt.la.join(',')} on piste ${!!mt.court}`; });
  console.log((out || ['(page reloaded)']).join('\n')); console.log(back); console.log('errs', errs); await b.close();
})();
