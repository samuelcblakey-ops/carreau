// Find my game, the new-round alert, and the phone standings (own row highlighted, extra columns behind a toggle).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Find', system: 'swiss', checkin: false, swissRounds: 3 });
    ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'].forEach((n, i) => t.teams.push({ id: 'e' + i, name: n, players: ['Pat ' + n], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    L.push('own draw, no alert: ' + q('#roundalert').hidden);
    L.push('find panel: ' + !!q('#find-q'));
    const inp = q('#find-q'); inp.focus(); inp.value = 'pat char'; inp.dispatchEvent(new Event('input', { bubbles: true })); await w(60);
    const row = q('#find-results .find-row'); L.push('result: ' + (row ? row.innerText.replace(/\s+/g, ' ').slice(0, 80) : 'none'));
    L.push('box kept focus: ' + (document.activeElement === inp));
    q('[data-act="find-me"]').click(); await w(80);
    const card = q('.me-card'); L.push('my game card: ' + (card ? /Charlie/.test(card.innerText) && /Piste|waiting/.test(card.innerText) : false));
    // play round 1, then a round drawn "elsewhere"
    for (const m of C.MS().filter(m => m.a && m.b && !m.done && !m.bye)) await C.recordResult(m.id, 13, 5, true);
    await w(60); await C.addDraw(C.drawSwissRound(C.T(), C.MS())); await w(200);
    S.seenDraws[C.T().id] = [1, 0]; S.selfDraw = false; C.render(); await w(60);
    const al = q('#roundalert'); L.push('alert: ' + (!al.hidden) + ' | ' + al.innerText.replace(/\s+/g, ' ').replace('✕', '').trim());
    q('[data-act="alert-close"]')?.click(); await w(30); L.push('alert closed: ' + al.hidden);
    // standings on a phone
    q('[data-tab="standings"]').click(); await w(80);
    const me = q('tr.me b'); L.push('my row: ' + (me ? me.textContent : 'none'));
    const vis = () => [...document.querySelectorAll('main thead th')].filter(th => getComputedStyle(th).display !== 'none').map(th => th.textContent).join(',');
    L.push('phone columns: ' + vis()); L.push('sticky header: ' + getComputedStyle(q('main thead th')).position);
    q('[data-act="st-cols"]').click(); await w(60); L.push('all columns: ' + vis());
    // forget me
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="find-clear"]').click(); await w(80); L.push('cleared: ' + !!q('#find-q'));
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); }
    return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/find-game.png' }); console.log('errs', errs); await b.close();
})();
