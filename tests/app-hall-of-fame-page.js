// The Hall of Fame page (#halloffame): the links to it (header trophy, footer, start screen), the list for the visitor's
// country grouped by year, hidden entries left out, country / level / format filters, a search that ignores accents and case,
// links to one entry (the organiser's View button), "View the competition" only while the competition can still be opened,
// French, and a phone-width check.
const { chromium } = require('playwright');
const SEED = () => {
  const S = window.__carreau.S;
  const side = (name, players, club) => Object.assign({ name, players }, club ? { club } : {});
  const E = (tid, o) => Object.assign({ tid, name: '', date: '', venue: '', entry: 'teams', fmt: 'triples', system: 'knockout', level: 'open', country: 'GB-ENG', region: '', note: '',
    parts: [], sig: '', lang: 'en', publishedAt: Date.now(), updatedAt: Date.now(), byUid: '', byCode: '', hidden: false }, o);
  return Promise.all([
    E('t1', { name: 'Chiltern Open Triples', date: '2026-09-20', venue: 'Hitchin BC', level: 'regional', region: 'Chiltern', note: 'Played in memory of Steve Noel',
      parts: [{ id: 'ko-A', name: 'Main knockout', winner: side('Luton Lads', ['Gus Hart', 'Hal Pike', 'Ian Shaw'], 'Luton PC'), runnerUp: side('Carreau Kings', ['Ann Ray', 'Bob Fox', 'Cat Moss']) },
              { id: 'ko-B', name: 'Plate', winner: side('Hitchin A', ['Dan Hill', 'Eve Ward', 'Finn Cole']), runnerUp: side('Les Boulistes', ['Sam Blakey', 'Jo Noel', 'Pat Lee']) }] }),
    E('t2', { name: 'English Doubles Championship', date: '2026-07-12', venue: 'Pétanque Park, Leicester', level: 'national', fmt: 'doubles', system: 'swiss',
      parts: [{ id: 'standings', name: 'Standings', winner: side('Les Copains', ['Zoë Brûlé', 'Max Ward']), runnerUp: side('Two Jacks', ['Ray Ford', 'Lee Chan']) }] }),
    E('t3', { name: 'Summer Mêlée', date: '2025-08-02', venue: 'Riverside', entry: 'melee', fmt: 'doubles', system: 'melee',
      parts: [{ id: 'standings', name: 'Standings', winner: side('Nina Shah', []), runnerUp: side('Owen Price', []) }] }),
    E('t4', { name: 'Coupe de Bretagne', date: '2026-06-01', venue: 'Rennes', country: 'FR', level: 'regional', region: 'Bretagne',
      parts: [{ id: 'ko-A', name: 'Main knockout', winner: side('Les Bretons', ['Yann Le Goff', 'Erwan Morvan', 'Loïc Tanguy']), runnerUp: side('Brest PC', ['Alan Kerr', 'Gwen Le Roux', 'Tom Guen']) }] }),
    E('t5', { name: 'Hidden junk', date: '2026-10-01', hidden: true, parts: [{ id: 'ko-A', name: 'Main knockout', winner: side('X', []), runnerUp: side('Y', []) }] }),
    E('t6', { name: 'Bangkok Open Shooting', date: '2026-03-14', venue: 'Lumphini', entry: 'shooting', fmt: 'singles', system: 'shooting', country: 'TH', gone: true,
      parts: [{ id: 'final', name: 'Final', winner: side('Somchai K.', []), runnerUp: side('Malee P.', []) }] }),
  ].map(e => S.store.setHof(e.tid, e)));
};
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, locale: 'en-GB' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  await p.evaluate(`(${SEED})()`); await p.waitForTimeout(150);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const go = async h => { document.activeElement?.blur?.(); location.hash = h; await w(250); };
    const cards = () => qa('#hof-results .hof-card').map(c => txt(c.querySelector('h3')));
    const years = () => qa('#hof-results .hof-year-h').map(txt);
    const change = async (sel, v) => { const el = q(sel); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); await w(200); };
    const search = async v => { const el = q('#hof-q'); el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); await w(80); };
    // 1. the three ways in
    L.push(`links: header ${q('header .hof-btn')?.getAttribute('href')} "${q('header .hof-btn')?.getAttribute('aria-label')}" | footer ${!!q('#foot a[href="#halloffame"]')} | start card ${txt(q('.start-actions a[href="#halloffame"]'))}`);
    // 2. the page, on the visitor's country
    await go('halloffame');
    L.push(`page: ${txt(q('main h2'))} | title ${document.title} | current ${q('header .hof-btn').getAttribute('aria-current')} | country ${q('#hof-country').value} | years ${years().join(',')} | cards ${cards().join(' / ')}`);
    const c1 = q('#hof-t1');
    L.push(`card: ${txt(c1.querySelector('.hof-where'))} | ${txt(c1.querySelector('.hof-meta'))} | parts ${qa('#hof-t1 .hof-part-name').map(txt).join(',')} | ${txt(c1.querySelector('.hof-row'))} | note ${txt(c1.querySelector('.hof-note'))} | view ${c1.querySelector('a.btn')?.getAttribute('href')}`);
    L.push(`one part, no heading: ${!q('#hof-t2 .hof-part-name')} | melee: ${txt(q('#hof-t3 .hof-meta'))}`);
    // 3. all countries; the hidden entry never shows; the deleted competition's entry has no link to it
    await change('#hof-country', 'all');
    L.push(`all: ${cards().join(' / ')} | hidden shown ${cards().includes('Hidden junk')} | gone link ${!!q('#hof-t6 a.btn')} | share ${!!q('#hof-t6 [data-act="hof-share"]')}`);
    // 4. level and format
    q('[data-act="hof-filter-level"][data-k="national"]').click(); await w(150);
    L.push(`national: ${cards().join(' / ')} | pressed ${q('.hof-chip.hof-national').getAttribute('aria-pressed')} | colour ${getComputedStyle(q('.hof-chip.hof-national')).backgroundColor}`);
    q('[data-act="hof-filter-level"][data-k="all"]').click(); await w(150);
    await change('#hof-fmt', 'melee'); L.push(`melee only: ${cards().join(' / ')}`);
    await change('#hof-fmt', 'shooting'); L.push(`shooting only: ${cards().join(' / ')} | ${txt(q('#hof-t6 .hof-meta'))}`);
    await change('#hof-fmt', 'all');
    // 5. search: accents and case ignored; players, clubs, venues and competitions
    await search('zoe brule'); L.push(`search zoe brule: ${cards().join(' / ')} | focus kept ${document.activeElement === q('#hof-q')}`);
    await search('LUTON pc'); L.push(`search club: ${cards().join(' / ')}`);
    await search('petanque park'); L.push(`search venue: ${cards().join(' / ')}`);
    await search('bretagne'); L.push(`search competition: ${cards().join(' / ')}`);
    await search('nobody here'); L.push(`no match: ${txt(q('#hof-results .empty'))}`);
    q('[data-act="hof-clear"]').click(); await w(150); L.push(`cleared: ${cards().length} | box ${q('#hof-q').value === ''}`);
    // 6. a country with nobody yet
    await change('#hof-country', 'GB-SCT'); L.push(`scotland: ${txt(q('#hof-results .empty'))}`);
    q('[data-act="hof-all-countries"]').click(); await w(200); L.push(`show all: ${q('#hof-country').value} | ${cards().length}`);
    // 7. a link to one entry, and to one that's been hidden
    await go('halloffame.t4'); await w(200);
    L.push(`deep link: country ${q('#hof-country').value} | focus ${qa('.hof-focus').map(c => c.id).join(',')} | cards ${cards().join(' / ')}`);
    await go('halloffame.t5'); await w(200); L.push(`hidden link: ${txt(q('main .notice'))}`);
    // 8. share: the native share sheet on phones, otherwise the link is copied
    await go('halloffame'); await w(150); await change('#hof-country', 'all');
    q('#hof-t1 [data-act="hof-share"]').click(); await w(200); L.push(`share: ${txt(q('#toast'))}`);
    // 9. the logo goes home
    document.activeElement?.blur?.(); q('header .brand .home').click(); await w(200); L.push(`logo: start ${!!q('.start-actions')} | route ${S.liveRoute} | hash "${location.hash}"`);

    // 10. an organiser publishes, opens View, follows the link back, then archives the competition
    q('[data-act="new-t"]').click(); await w(100);
    { const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Club Cup', date: '2026-10-10', venue: 'Hitchin', system: 'knockout', checkin: false, wizard: false,
        teams: [0, 1].map(i => ({ id: 'e' + i, name: 'Team ' + i, players: ['P' + i], active: true })) });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(150); q('[data-tab="draw"]').click(); await w(80); q('[data-act="first-draw"]').click(); await w(300);
      for (const m of C.MS().filter(m => m.a && m.b && !m.done)) await C.recordResult(m.id, 13, 4, true); await w(200); }
    const tid = C.T().id;
    q('[data-tab="standings"]').click(); await w(200); q('[data-hof-panel] [data-act="hof-open"]').click(); await w(150); q('#modal [data-act="hof-save"]').click(); await w(250);
    L.push(`view button: ${q('[data-hof-panel] a.btn')?.getAttribute('href') === '#halloffame.' + tid} | ${txt(q('[data-hof-panel] a.btn'))}`);
    q('[data-hof-panel] a.btn').click(); await w(400);
    L.push(`viewed: page ${!!q('.hof-page')} | focus ${q('.hof-focus')?.id === 'hof-' + tid} | tabs still there ${qa('#tabs [data-tab]').length > 0} | back ${txt(q('.hof-hero .btn'))}`);
    q('.hof-focus a.btn').click(); await w(300);
    L.push(`view the competition: page gone ${!q('.hof-page')} | on ${C.T()?.name} | hash ${location.hash === '#' + tid}`);
    q('[data-tab="setup"]').click(); await w(200); q('[data-act="archive"]').click(); await w(100); q('[data-act="archive-yes"]').click(); await w(300);
    L.push(`archived: gone ${S.hof[tid]?.gone}`);
    await go('halloffame.' + tid); await w(200); L.push(`after archive: card ${!!q('#hof-' + tid)} | link ${!!q('#hof-' + tid + ' a.btn')}`);
    q('[data-act="restore"]')?.click(); await w(50);
    // picking the competition in the menu leaves the page
    q('[data-act="picker"]').click(); await w(80); q(`.pick-row[data-id="${tid}"]`)?.click(); await w(250); L.push(`picker leaves: ${!q('.hof-page')}`);

    // 11. in French
    await go('halloffame'); await w(150);
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(250);
    L.push(`fr: ${txt(q('main h2'))} | ${q('#hof-q').placeholder} | ${txt(q('#hof-country option'))} | ${qa('.hof-chip').map(txt).join(',')} | ${txt(q('header .hof-btn'))} | foot ${txt(q('#foot a[href="#halloffame"]'))}`);
    await change('#hof-country', 'all'); L.push(`fr card: ${txt(q('#hof-t1 .hof-meta'))} | ${txt(q('#hof-t1 .hof-row'))} | ${txt(q('#hof-t1 a.btn'))}`);
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(150);
  } catch (e) { L.push('ERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]); } return L; });
  console.log(out.join('\n'));
  // 12. on a phone: the header with the trophy and the page fit the width
  await p.setViewportSize({ width: 375, height: 760 }); await p.evaluate(() => { location.hash = 'halloffame'; }); await p.waitForTimeout(300);
  console.log('phone: ' + JSON.stringify(await p.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, trophy: !!document.querySelector('header .hof-btn'),
    label: getComputedStyle(document.querySelector('header .hof-btn span')).display, picker: Math.round(document.querySelector('.picker-btn')?.getBoundingClientRect().width || 0) }))));
  console.log('errs', errs); await b.close();
})();
