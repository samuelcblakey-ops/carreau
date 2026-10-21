const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), L = [];
    const q = s => document.querySelector(s), tap = v => q(`[data-act="shot-pick"][data-v="${v}"]`).click();
    try {
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Live shoot', entry: 'shooting', system: 'knockout', shootFormat: 'ko8', checkin: false });
    t.players = [0, 1, 2].map(i => ({ id: 'p' + i, name: 'Shooter ' + i, active: true })); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(150);
    const first = C.MS().filter(m => m.stage === 'shoot').sort((x, y) => x.order - y.order);
    L.push('next up shown: ' + q('main').innerText.includes('Next up on the piste'));
    q('main .notice [data-shoot]').click(); await w(60);
    L.push('live opens by default: ' + !!q('.shotpad') + ' first prompt: ' + q('.live-shot').innerText.replace(/\s+/g, ' '));
    for (let i = 0; i < 6; i++) { tap([5, 3, 0, 1][i % 4]); await w(15); } window.__shot1 = true; await w(400);
    for (let i = 0; i < 6; i++) { q('[data-act="shot-undo"]').click(); await w(15); }
    for (let i = 0; i < 19; i++) { tap(5); await w(15); }
    tap(3); await w(15); q('[data-act="shot-undo"]').click(); await w(15);
    L.push('after undo, still shot 20: ' + q('.live-shot').innerText.includes('Shot 20 of 20'));
    tap(1); await w(30);
    L.push('progress saved per shot: ' + (C.S.matches[first[0].id].sa === 96));
    q('[data-act="shoot-save"][data-final="1"]').click(); await w(120);
    L.push('first done: ' + C.S.matches[first[0].id].done + ' total ' + C.S.matches[first[0].id].sa);
    L.push('advanced to next: ' + (S.modal?.id === first[1].id) + ' msg: ' + (q('#modal .notice')?.innerText || ''));
    for (const m of first.slice(1)) { if (S.modal?.id !== m.id) { C.S.modal = null; q(`[data-shoot="${m.id}"]`).click(); await w(40); }
      for (let i = 0; i < 20; i++) { tap(m.id === first[1].id ? 3 : 1); await w(10); } q('[data-act="shoot-save"][data-final="1"]').click(); await w(120); }
    L.push('modal closed after last: ' + !S.modal);
    q('[data-act="shoot-next"]').click(); await w(150);
    const duel = C.MS().find(m => m.shoot && m.a && m.b && !m.done);
    q(`[data-match="${duel.id}"]`).click(); await w(60);
    const w1 = q('.live-shot .who').innerText; tap(5); await w(30); const w2 = q('.live-shot .who').innerText; tap(0); await w(30); const w3 = q('.live-shot .who').innerText;
    L.push('duel alternates: ' + (w1 !== w2 && w1 === w3));
    for (let i = 0; i < 38; i++) { tap(i % 2 ? 0 : 3); await w(8); }
    q('[data-act="shoot-save"][data-final="1"]').click(); await w(150);
    const d = C.S.matches[duel.id]; L.push('duel done: ' + d.done + ' ' + d.sa + '-' + d.sb);
    let g = 0; while (g++ < 5) { const x = C.MS().find(m => m.shoot && m.a && m.b && !m.done); if (!x) break; C.S.modal = null; q('[data-tab="draw"]').click(); await w(40);
      q(`[data-match="${x.id}"]`).click(); await w(50); for (let i = 0; i < 40; i++) { tap(i % 2 ? 1 : 5); await w(8); } q('[data-act="shoot-save"][data-final="1"]').click(); await w(150); }
    q('[data-tab="standings"]').click(); await w(60); L.push('winner: ' + /WINNER/i.test(q('main').innerText));
    // run-through template: own copy with same shooters, no results
    const src = JSON.parse(JSON.stringify(C.T())); src.template = true; await S.store.setTournament(src); S.tournaments[src.id] = src; q('[data-tab="draw"]').click(); await w(60);
    q('[data-act="use-template"]').click(); await w(150); const cp = C.T();
    L.push('template copy: ' + (cp.id !== src.id) + ' shooters ' + cp.players.length + ' draws ' + cp.draws.length + ' matches ' + C.MS().length + ' name ' + cp.name + ' template ' + !!cp.template);
    } catch (e) { L.push('ERR ' + e.message); }
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
