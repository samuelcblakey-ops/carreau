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
  // the hero: run (and, on the website, watch how it works) up top, the follow hint, three ticks and a made-up round as a preview
  const hero = () => p.evaluate(() => { const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    return 'buttons ' + qa('.start-hero .start-card b').map(txt).join(',') + ' | follow ' + txt(q('.sh-follow')) + ' | ticks ' + qa('.sh-points li').map(txt).join(',')
      + ' | preview hidden ' + (q('.sh-demo')?.getAttribute('aria-hidden') === 'true') + ' inert ' + !!q('.sh-demo')?.inert + ' games ' + qa('.sh-demo .shd-g').length
      + ' | ' + [q('.shd-bar'), ...qa('.shd-gh'), q('.shd-table .eyebrow')].map(txt).join(' / ') + ' | first focusable ' + q('#main button, #main a')?.dataset.act; });
  console.log('hero: ' + await hero());
  // support the site: a tile and a footer line, both opening Sam's Ko-fi page in a new tab
  const support = () => p.evaluate(() => { const t = document.querySelector('.start-actions a.ext'), f = document.querySelector('#foot .foot-support a'), txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    return 'tile ' + txt(t) + ' | ' + t?.getAttribute('href') + ' ' + t?.target + ' ' + t?.rel + ' | footer ' + txt(f.closest('.foot-support')) + ' | ' + f?.getAttribute('href') + ' ' + f?.target + ' ' + f?.rel; });
  console.log('support: ' + await support());
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
  // 7b. long lists: the six newest, then "Show all (n)", which opens the rest and moves focus to the first card that was hidden
  await p.evaluate(async () => { const S = window.__carreau.S; for (let i = 2; i <= 8; i++) await S.store.setTournament({ id: 'tex' + i, name: 'Example ' + i, system: 'swiss', format: 'triples', entry: 'teams', teams: [], players: [], draws: [], pools: [], brackets: [], courts: [], archived: false, listed: true, created: 5 + i }); });
  await p.click('header .brand .home'); await w(200);
  const exs = () => p.evaluate(() => { const sec = [...document.querySelectorAll('.start section')].find(s => /Examples|Exemples/.test(s.querySelector('h2')?.textContent)), cards = [...sec.querySelectorAll('.ex-card')];
    return 'examples ' + cards.length + ' | newest first ' + (cards[0]?.dataset.id) + ' | button ' + (sec.querySelector('[data-act="start-all"]')?.textContent.trim() || 'none') + ' | focus ' + (cards.indexOf(document.activeElement) + 1 || 'none'); });
  console.log('long list: ' + await exs());
  await p.click('[data-act="start-all"][data-k="ex"]'); await w(200);
  console.log('show all: ' + await exs());
  await p.evaluate(() => { window.__carreau.S.startAll = null; });
  // 8. French
  await p.click('header .brand .home'); await w(150);
  await p.click('[data-act="lang-menu"]'); await w(60); await p.click('[data-lang="fr"]'); await w(150);
  console.log('french: ' + await p.evaluate(() => [document.querySelector('.start-hero h1'), ...document.querySelectorAll('.start-card b')].map(e => e.textContent.trim()).join(' | ')) + ' | ' + await p.getAttribute('header .brand .home', 'aria-label'));
  console.log('french support: ' + await support());
  console.log('french hero: ' + await hero() + ' | ' + (await exs()).replace(/ \| focus.*/, ''));
  await p.click('[data-act="lang-menu"]'); await w(60); await p.click('[data-lang="en"]'); await w(150);
  // 9. phone: "+ New" keeps its word, nothing scrolls sideways
  await p.setViewportSize({ width: 375, height: 800 }); await w(250);
  console.log("phone ticks rows: " + await p.evaluate(() => new Set([...document.querySelectorAll(".sh-points li")].map(l => Math.round(l.getBoundingClientRect().top))).size) + " | preview games shown " + await p.evaluate(() => [...document.querySelectorAll(".sh-demo .shd-g")].filter(g => g.offsetParent).length));
  console.log('phone: new button "' + await p.evaluate(() => document.querySelector('header .new-t').innerText.replace(/\s+/g, ' ').trim()) + '" | overflow ' + await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
  console.log('errs', errs); await b.close();
})();
