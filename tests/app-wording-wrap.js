// Phrases ending in ? or : translate, the mêlée "teams drawn once" subtitle translates,
// and long labels (a long winner's name, the precision-shooting "Available once…") wrap on a phone instead of widening the page.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    const lang = async l => { q('[data-act="lang-menu"]').click(); await w(30); q(`[data-lang="${l}"]`).click(); await w(120); };
    const mk = async (cfg, ents) => { q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { checkin: false, wizard: false }, cfg, ents); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(150); };
    const wide = () => document.documentElement.scrollWidth;
    q('[data-act="new-t"]').click(); await w(100);
    // phrases with ? and : (translated in the header, which is localised on every render)
    const words = ['Who won the end?', 'How many points?', 'Not playing:', 'Not you?', 'Just filming one game?', 'Choose the winner (for example after a shoot-off):'];
    for (const l of ['fr', 'de']) { await lang(l); const probe = document.createElement('div'); probe.id = 'probe'; probe.innerHTML = words.map(x => `<span>${x}</span>`).join('|');
      q('header.app').appendChild(probe); C.render(); await w(60); L.push(`${l}: ${[...q('#probe').children].map(x => x.textContent).join(' | ')}`); probe.remove(); }
    await lang('en');
    // mêlée teams drawn once subtitle
    await mk({ entry: 'melee', format: 'doubles', meleeDrawn: true, system: 'swiss', name: 'Melee once' }, { players: Array.from({ length: 8 }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, active: true })) });
    q('[data-tab="entries"]').click(); await w(80); await lang('fr'); L.push('melee subtitle fr: ' + q('main .spread .muted.small').textContent); await lang('en');
    // long winner name
    const long = 'Pétanque Club de Villeneuve-lès-Avignon ';
    await mk({ system: 'knockout', name: 'Long names' }, { teams: Array.from({ length: 4 }, (_, i) => ({ id: 'e' + i, name: long + (i + 1), players: [], active: true })) });
    q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(300);
    for (const m of C.MS().filter(m => m.stage === 'ko' && m.round === 1)) await C.recordResult(m.id, 13, 4, true);
    await w(150); for (const m of C.MS().filter(m => m.stage === 'ko' && m.round === 2 && m.a && m.b)) await C.recordResult(m.id, 13, 9, true);
    await w(300); L.push(`winner shown: ${!!q('.pill.done.wrap')} | page width ${wide()}`);
    // precision shooting "Available once…"
    await mk({ entry: 'shooting', system: 'knockout', shootFormat: 'ko8', format: 'singles', name: 'Shoot' }, { players: Array.from({ length: 9 }, (_, i) => ({ id: 'p' + i, name: 'Shooter ' + (i + 1), active: true })) });
    q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(300);
    L.push(`shooting pill wraps: ${!!q('.pill.wrap')} | page width ${wide()}`);
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/wording-wrap.png' }); console.log('errs', errs); await b.close();
})();
