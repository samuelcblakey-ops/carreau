// The start screen: a first visit shows what the site does and where to begin (run, follow, stream, the examples)
// instead of dropping people into an example. Returning organisers still open their newest competition, the logo
// always comes back here, and a new competition starts with the quick setup on its own.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  const w = ms => p.waitForTimeout(ms);
  const st = () => p.evaluate(() => { const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    return 'start ' + !!q('.start') + ' | tid ' + (window.__carreau.S.tid || 'none') + ' | tabs ' + qa('#tabs [data-tab]').length
      + ' | actions ' + qa('.start-actions .start-card b').map(txt).join(',') + ' | yours ' + (qa('.start section').find(s => /Your competitions/.test(txt(s.querySelector('h2'))))?.querySelectorAll('.ex-card').length || 0)
      + ' | examples ' + (qa('.start section').find(s => /Examples/.test(txt(s.querySelector('h2'))))?.querySelectorAll('.ex-card').length || 0); });
  // 1. first visit, nothing saved
  console.log('first visit: ' + await st());
  console.log('stream card: ' + await p.getAttribute('.start-actions a.start-card', 'href'));
  // 2. an example exists: still the start screen, the example is a card
  await p.evaluate(async () => { const S = window.__carreau.S; await S.store.setTournament({ id: 'tex1', name: 'Example Swiss', system: 'swiss', format: 'triples', entry: 'teams', teams: [], players: [], draws: [], pools: [], brackets: [], courts: [], archived: false, listed: true, created: 5 }); });
  await p.reload(); await w(400);
  console.log('with an example: ' + await st());
  await p.click('.ex-card[data-id="tex1"]'); await w(200);
  console.log('example opened: ' + await st() + ' | name ' + await p.evaluate(() => window.__carreau.T()?.name));
  // 3. the logo comes back to the start screen
  await p.click('header .brand .home'); await w(200);
  console.log('logo: ' + await st() + ' | saved ' + JSON.stringify(await p.evaluate(() => localStorage.getItem('carreau-tid'))) + ' | label ' + await p.getAttribute('header .brand .home', 'aria-label'));
  // 4. run a competition: the quick setup on its own (no registration list under it)
  await p.click('.start-card.go[data-act="new-t"]'); await w(300);
  const wiz = () => p.evaluate(() => { const q = s => document.querySelector(s); return 'wizard ' + !!q('.wiz-page .wiz') + ' | registration ' + /Registration/.test(q('main h2')?.textContent || '') + ' | tab ' + q('#tabs [aria-current="true"]')?.dataset.tab; });
  console.log('run a competition: ' + await wiz());
  // 5. returning organiser: their newest competition opens, not the start screen
  const own = await p.evaluate(() => window.__carreau.S.tid);
  await p.evaluate(() => localStorage.removeItem('carreau-tid')); await p.reload(); await w(400);
  console.log('returning: ' + (await p.evaluate(() => window.__carreau.S.tid) === own) + ' | ' + await st());
  // 6. skip the quick setup: registration as usual
  await p.click('[data-tab="entries"]'); await w(100); await p.click('[data-act="wiz-skip"]'); await w(200); await p.click('[data-tab="entries"]'); await w(150);
  console.log('after skip: ' + await wiz());
  // 7. the start screen lists your competitions and the examples
  await p.click('header .brand .home'); await w(200);
  console.log('both lists: ' + await st());
  await p.click('.start section .ex-card[data-id="' + own + '"]'); await w(200);
  console.log('own opened: ' + (await p.evaluate(() => window.__carreau.S.tid) === own));
  // 8. French
  await p.click('header .brand .home'); await w(150);
  await p.click('[data-act="lang-menu"]'); await w(60); await p.click('[data-lang="fr"]'); await w(150);
  console.log('french: ' + await p.evaluate(() => [document.querySelector('.start-hero h1'), ...document.querySelectorAll('.start-card b')].map(e => e.textContent.trim()).join(' | ')) + ' | ' + await p.getAttribute('header .brand .home', 'aria-label'));
  await p.click('[data-act="lang-menu"]'); await w(60); await p.click('[data-lang="en"]'); await w(150);
  // 9. phone: "+ New" keeps its word, nothing scrolls sideways
  await p.setViewportSize({ width: 375, height: 800 }); await w(250);
  console.log('phone: new button "' + await p.evaluate(() => document.querySelector('header .new-t').innerText.replace(/\s+/g, ' ').trim()) + '" | overflow ' + await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
  console.log('errs', errs); await b.close();
})();
