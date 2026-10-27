// The knockout final is called the final in every language (the stream overlay's "final score" has its own key),
// and a team withdrawn after a barrage or leagues stays out of the afternoon knockouts.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    const mk = async (cfg, n) => { q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, cfg, { checkin: false, wizard: false, teams: Array.from({ length: n }, (_, i) => ({ id: 'e' + i, name: 'Team ' + i, players: [], active: true })) });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(150); q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(300); };
    const lang = async l => { q('[data-act="lang-menu"]').click(); await w(30); q(`[data-lang="${l}"]`).click(); await w(120); };
    // 1. the final's name
    await mk({ system: 'knockout', name: 'Final names' }, 4);
    const names = [];
    for (const l of ['fr', 'de', 'nl', 'th', 'it', 'es', 'pt']) { await lang(l); names.push(l + ' ' + [...document.querySelectorAll('.bk h4')][1].textContent); }
    L.push('final: ' + names.join(' | '));
    await lang('de'); L.push(`overlay de: ${C.trAs('Final score', 'Final')} | round de: ${C.tr('Final')}`);
    await lang('fr'); L.push(`overlay fr: ${C.trAs('Final score', 'Final')} | round fr: ${C.tr('Final')}`);
    await lang('en'); L.push(`overlay en: ${C.trAs('Final score', 'Final')}`);
    // 2. withdrawn after the groups
    for (const [label, cfg] of [['barrage', { system: 'pools', poolStyle: 'rr', poolSize: 4 }], ['leagues', { system: 'leagues', leagueCount: 2 }]]) {
      await mk(Object.assign({ name: label }, cfg), 8);
      for (const m of C.MS().filter(m => m.a && m.b && !m.done)) { const aWins = m.a.includes('e0') || (!m.b.includes('e0') && Math.random() < .5); await C.recordResult(m.id, aWins ? 13 : 5, aWins ? 5 : 13, true); }
      await w(200); const t = C.T(); const br = C.getPlan(t).brackets[0];
      const before = C.koEntrants(t, C.MS(), br).map(x => x.id);
      q('[data-tab="entries"]').click(); await w(80); q('[data-act="toggle-e"][data-id="e0"]').click(); await w(200);
      const after = C.koEntrants(C.T(), C.MS(), br).map(x => x.id);
      L.push(`${label}: e0 in before ${before.includes('e0')} | after ${after.includes('e0')} | same size ${before.length === after.length}`);
      q('[data-tab="draw"]').click(); await w(80); q('[data-act="start-kos"]').click(); await w(300);
      const inBracket = C.MS().filter(m => m.stage === 'ko').some(m => (m.a || []).includes('e0') || (m.b || []).includes('e0'));
      L.push(`${label} bracket has e0: ${inBracket}`);
    }
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
