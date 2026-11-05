// The grey subtitle beside the Registration heading: precision shooting shows "Precision shooting",
// not "Singles (tête-à-tête) · Mêlée"; mêlée and Swiss competitions are unchanged.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const make = async (name, fields) => p.evaluate(async ([name, fields]) => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name, checkin: false, wizard: false }, fields);
    ['Ann', 'Bob', 'Cat', 'Dan'].forEach((n, i) => { t.players.push({ id: 'p' + i, name: n, active: true }); t.teams.push({ id: 't' + i, name: 'Team ' + n, players: [n], active: true }); });
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="entries"]').click(); await w(60);
    const h = [...document.querySelectorAll('main h2')].find(x => /Registration|Inscription/.test(x.textContent));
    return h ? h.parentElement.querySelector('span.muted').textContent.trim() : 'no Registration heading'; }, [name, fields]);
  const L = [];
  L.push(`subtitle shooting: ${await make('Shoot', { entry: 'shooting', system: 'shooting', format: 'singles' })}`);
  await p.screenshot({ path: 'test-results/entries-subtitle-shooting.png' });
  L.push(`subtitle melee: ${await make('Melee', { entry: 'melee', system: 'melee', format: 'doubles' })}`);
  L.push(`subtitle swiss: ${await make('Swiss', { entry: 'teams', system: 'swiss', format: 'doubles' })}`);
  await p.screenshot({ path: 'test-results/entries-subtitle-doubles.png' });
  await make('Shoot FR', { entry: 'shooting', system: 'shooting', format: 'singles' });
  await p.evaluate(async () => { document.querySelector('[data-lang="fr"]').click(); await new Promise(r => setTimeout(r, 200)); });
  L.push(`subtitle shooting fr: ${await p.evaluate(() => { const h = [...document.querySelectorAll('main h2')].find(x => /Inscription|Registration/.test(x.textContent)); return h ? h.parentElement.querySelector('span.muted').textContent.trim() : 'none'; })}`);
  console.log(L.join('\n')); console.log('errs', errs); await b.close();
})();
