// Example competitions: a "Try it yourself" template copies cleanly (name, final size, tie-break settings), and a drawn
// inter-club competition shows "Fixtures drawn" in the competition picker.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Try it yourself · Precision shooting', entry: 'shooting', system: 'knockout', format: 'singles', shootFormat: 'final', shootFinal: 2, shootTie: 'shootout', template: true, wizard: false });
    for (let i = 1; i <= 4; i++) t.players.push({ id: 'p' + i, name: 'Shooter ' + i, active: true, checkedIn: true });
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(60); C.render(); await w(60);
    q('[data-act="use-template"]').click(); await w(200); const c = C.T();
    L.push(`copy: ${c.id !== t.id} | ${c.name} | final ${c.shootFormat} top ${c.shootFinal} | tie ${c.shootTie} | shooters ${c.players.length} | template ${!!c.template}`);
    q('[data-act="new-t"]').click(); await w(100); const k = JSON.parse(JSON.stringify(C.T()));
    Object.assign(k, { name: 'Clubs', system: 'clubs', format: 'triples', clubTeams: 2, clubPairing: 'like', wizard: false });
    ['Chiltern', 'Anglia'].forEach((cl, ci) => { for (let i = 0; i < 2; i++) k.teams.push({ id: `e${ci}${i}`, name: `${cl} ${i + 1}`, players: ['a', 'b', 'c'], club: cl, active: true, checkedIn: true }); });
    await S.store.setTournament(k); S.tournaments[k.id] = k; await w(60);
    q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(300);
    q('[data-act="picker"]').click(); await w(80); L.push('picker: ' + q('.pick-row.on')?.innerText.replace(/\s+/g, ' ').trim());
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
