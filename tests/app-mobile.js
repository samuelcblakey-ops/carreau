const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const L = [];
  for (const [wd, label] of [[375, 'phone'], [1100, 'desktop']]) {
    const p = await b.newPage({ viewport: { width: wd, height: 812 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    const r = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('[data-act="new-t"]').click(); await w(80); { const t = JSON.parse(JSON.stringify(C.T())); t.name = 'TEST 1 · Swiss → Top 16 + Silver competition (triples)'; await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(40); } const res = {};
      for (const tab of ['entries', 'setup', 'draw', 'courts', 'standings']) { q(`[data-tab="${tab}"]`).click(); await w(40); res[tab] = document.documentElement.scrollWidth; }
      q('[data-tab="entries"]').click(); await w(40);
      const nav = q('nav.tabs'), cs = getComputedStyle(nav);
      return { overflow: Math.max(...Object.values(res)) > innerWidth, navFixed: cs.position === 'fixed', navBottom: Math.round(nav.getBoundingClientRect().bottom) === innerHeight,
        icons: getComputedStyle(q('nav.tabs .t-ic')).display !== 'none', header: Math.round(q('header.app').getBoundingClientRect().height),
        langOneRow: getComputedStyle(q('header .seg')).flexWrap === 'nowrap' && getComputedStyle(q('header .seg')).flexShrink === '0', inputFont: getComputedStyle(q('main input[type=text], main input:not([type])')).fontSize };
    });
    L.push(`${label}: ${JSON.stringify(r)}`); await p.close();
  }
  // Wide content stays in its own scroll box: the knockout plan on Setup and on Draw & results once the morning is
  // finished, and the EuroCup "<club> win the tie" pill. The page has no doctype, so the page width is the body's
  // (document.scrollingElement), not the <html> element's.
  const fresh = async wd => { const p = await b.newPage({ viewport: { width: wd, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
    await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300); return p; };
  const pageW = 'document.scrollingElement.scrollWidth';
  for (const wd of [390, 320]) {
    const p = await fresh(wd);
    const r = await p.evaluate(async ({ wd, pageW }) => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), L = [];
      const width = () => eval(pageW);
      q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: 'Plan', system: 'swiss', swissRounds: 1, format: 'doubles', checkin: false, wizard: false });
      t.courts = Array.from({ length: 12 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      t.teams = Array.from({ length: 24 }, (_, i) => ({ id: 'e' + i, name: 'Team ' + (i + 1), players: ['a' + i, 'b' + i], active: true }));
      await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(60);
      q('[data-tab="setup"]').click(); await w(80);
      L.push(`setup with knockout plan ${wd}: page width ${width()} | tab bar width ${Math.round(q('nav.tabs').getBoundingClientRect().width)} | plan ${!!q('table.plan')}`);
      if (wd === 390) {
        q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(300);
        for (const m of C.MS().filter(m => m.a && m.b && !m.done && !m.bye)) await C.recordResult(m.id, 13, 6, true);
        C.render(); await w(100);
        L.push(`draw & results with plan open ${wd}: page width ${width()} | plan open ${!!q('.ko-plan[open] table.plan')} | draw button ${!!q('[data-act="start-kos"]')}`);
      }
      return L; }, { wd, pageW });
    L.push(...r); await p.screenshot({ path: `test-results/mobile-plan-${wd}.png` }); await p.close();
  }
  { const p = await fresh(320);
    const r = await p.evaluate(async ({ pageW }) => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T()));
      const sq = c => ({ players: Array.from({ length: 8 }, (_, i) => c + ' P' + (i + 1)), genders: Array.from({ length: 8 }, (_, i) => i < 3 ? 'f' : 'm') });
      Object.assign(t, { name: 'EU', system: 'eurocup', checkin: false, wizard: false });
      t.courts = Array.from({ length: 12 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      t.teams = ['Riverside Boules Club', 'Hillside Pétanque', 'Lakeside', 'Parkside'].map((n, i) => Object.assign({ id: 'e' + i, name: n, club: n, active: true }, sq(n)));
      await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(60);
      q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(300);
      for (const f of C.T().clubFix.filter(f => f.day === 1)) for (const m of C.MS().filter(m => m.ca === f.a && m.cb === f.b)) await C.recordResult(m.id, 13, 2, true);
      q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="de"]').click(); await w(100); q('[data-tab="draw"]').click(); await w(100);
      const pills = [...document.querySelectorAll('.fixture .pill.done')].filter(x => x.querySelector('[data-notr]'));
      pills[0]?.scrollIntoView({ block: 'center' });
      return `eurocup tie pill 320 de: page width ${eval(pageW)} | pills ${pills.length} | ${(pills[0]?.innerText || '').replace(/\s+/g, ' ')}`; }, { pageW });
    L.push(r); await p.screenshot({ path: 'test-results/mobile-eurocup-pill-320-de.png' }); await p.close(); }
  console.log(L.join('\n')); console.log('errs', errs); await b.close();
})();
