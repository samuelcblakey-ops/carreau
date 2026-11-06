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
  // Touch screens (spec phone-touch-targets): every chip, cell and small control is at least 44×44, tab labels fit
  // their tab in every language, the picker shows a word at 320, EuroCup rows keep room for the name, and the dark
  // piste badge is readable.
  const touch = async wd => { const ctx = await b.newContext({ viewport: { width: wd, height: 844 }, hasTouch: true }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300); return p; };
  const small = [];
  for (const wd of [390, 320]) {
    const p = await touch(wd);
    const r = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], bad = [], seen = {};
      const check = (name, sel) => { const els = qa(sel).filter(e => e.getClientRects().length); seen[name] = els.length;
        els.forEach(e => { const r = e.getBoundingClientRect(); if (r.width < 43.5 || r.height < 43.5) bad.push(`${name} ${Math.round(r.width)}x${Math.round(r.height)}`); }); };
      const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
      const put = async t => { await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(60); };
      const fresh = () => { q('[data-act="new-t"]').click(); return w(100).then(() => JSON.parse(JSON.stringify(C.T()))); };
      const pistes = n => Array.from({ length: n }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      // Swiss: logo, ranking-order switches, the plan's third-place box and ✕, round chips, quick score pad
      let t = await fresh(); Object.assign(t, { name: 'Swiss', system: 'swiss', swissRounds: 3, format: 'doubles', checkin: false, wizard: false, courts: pistes(12),
        teams: Array.from({ length: 24 }, (_, i) => ({ id: 'e' + i, name: 'Team ' + (i + 1), players: ['a' + i, 'b' + i], active: true })) }); await put(t);
      check('logo', 'header .brand .home');
      await tab('setup'); check('ranking switch', '.tb-sw'); q('[data-act="plan-add"]').click(); await w(80);
      check('plan third-place', 'table.plan [data-plan="third"]'); check('plan remove', 'table.plan [data-act="plan-del"]');
      await tab('draw'); q('[data-act="first-draw"]').click(); await w(300); check('round chip', '.round-bar .rchip');
      q(`[data-match="${C.MS().find(m => m.a && m.b && !m.bye).id}"]`).click(); await w(80); check('quick score', '.qpad button'); q('#modal [data-act="close"], #modal .x')?.click(); S.modal = null; C.render(); await w(40);
      // Knockout: number chips, bracket zoom
      t = await fresh(); Object.assign(t, { name: 'KO', system: 'knockout', format: 'doubles', checkin: false, wizard: false, koThird: true, seeding: 'entry', courts: pistes(8),
        teams: Array.from({ length: 16 }, (_, i) => ({ id: 'k' + i, name: 'Team ' + 'ABCDEFGHIJKLMNOP'[i], players: ['a' + i, 'b' + i], active: true })) }); await put(t);
      await tab('draw'); q('[data-act="first-draw"]').click(); await w(400); check('knockout chip', '.bk-bar .rchip');
      q('.bk-bar .rchip[data-v="grid"]').click(); await w(150); check('bracket zoom', '.bk-tools .btn');
      // Inter-club: day chips and the results grid
      t = await fresh(); Object.assign(t, { name: 'Clubs', system: 'clubs', clubTeams: 2, checkin: false, wizard: false, courts: pistes(20), teams: [] });
      ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'].forEach((c, ci) => { for (let i = 0; i < 2; i++) t.teams.push({ id: `c${ci}${i}`, name: `${c} ${i + 1}`, players: ['a'], club: c, active: true }); }); await put(t);
      await tab('draw'); q('[data-act="first-draw"]').click(); await w(400); check('day chip', '[data-act="club-sel"]');
      await tab('standings'); check('results grid', '.cgrid .g-res');
      return { bad, seen }; });
    small.push(...r.bad.map(x => wd + ' ' + x)); L.push(`touch controls seen ${wd}: ${Object.entries(r.seen).map(([k, v]) => k + ' ' + v).join(', ')}`);
    await p.screenshot({ path: `test-results/mobile-touch-${wd}.png` }); await p.context().close();
  }
  L.push('touch targets under 44: ' + (small.length ? small.join(', ') : 'none'));
  { const p = await touch(320);
    const r = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], L = [];
      q('[data-act="new-t"]').click(); await w(100); let t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Riverside Spring Open', checkin: false, wizard: false }); await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(60);
      // the first word of the competition's name fits in the picker
      const nm = q('.picker-btn .pb-name'), rg = document.createRange(); rg.setStart(nm.firstChild, 0); rg.setEnd(nm.firstChild, nm.textContent.indexOf(' '));
      L.push(`picker 320 shows a word: ${rg.getBoundingClientRect().width <= nm.clientWidth}`);
      const fits = () => qa('nav.tabs button').every(bt => { const s = bt.querySelector('.t-short'), r = bt.getBoundingClientRect(), sr = s.getBoundingClientRect();
        return s.scrollWidth <= s.clientWidth + 1 && sr.left >= r.left - 1 && sr.right <= r.right + 1 && r.right <= innerWidth + 1; });
      let ok = true; for (const lg of ['nl', 'pt', 'de']) { q('[data-act="lang-menu"]').click(); await w(40); q(`[data-lang="${lg}"]`).click(); await w(100); ok = ok && fits(); }
      L.push(`tab labels fit 320 nl pt de: ${ok}`);
      q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="en"]').click(); await w(100);
      // EuroCup Registration: the squad badge goes under the name
      q('[data-act="new-t"]').click(); await w(100); t = JSON.parse(JSON.stringify(C.T()));
      const sq = () => ({ players: Array.from({ length: 8 }, (_, i) => ['Marie-Christine Dubois', 'Jean Pierre', 'Alexandrina Konstantinou'][i % 3] + ' ' + (i + 1)), genders: Array.from({ length: 8 }, (_, i) => i < 3 ? 'f' : 'm') });
      Object.assign(t, { name: 'EuroCup', system: 'eurocup', checkin: false, wizard: false, courts: Array.from({ length: 12 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true })) });
      t.teams = ['Club Bouliste Riverside', 'Hillside Pétanque', 'Lakeside', 'Parkside'].map((n, i) => Object.assign({ id: 'u' + i, name: n, club: n, active: true }, sq()));
      await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(60); q('[data-tab="entries"]').click(); await w(80);
      const nw = Math.min(...qa('.erow .who').map(e => e.getBoundingClientRect().width));
      q('[data-act="eu-edit"]').click(); await w(100); const dd = Math.min(...qa('#add-form .sq-row select').map(e => e.getBoundingClientRect().height));
      L.push(`eurocup registration 320: name column ${nw >= 120 ? '120+' : Math.round(nw)} px | man/woman drop-downs ${dd >= 43.5 ? '44+' : Math.round(dd)} px`);
      q('.elist').scrollIntoView(); return L; });
    L.push(...r); await p.screenshot({ path: 'test-results/mobile-eurocup-320.png' }); await p.context().close(); }
  // dark mode: the knockout "PISTE N" badge
  { const p = await touch(390);
    const r = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
      document.documentElement.dataset.theme = 'dark';
      q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: 'KO', system: 'knockout', format: 'doubles', checkin: false, wizard: false, seeding: 'entry', courts: Array.from({ length: 8 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true })),
        teams: Array.from({ length: 8 }, (_, i) => ({ id: 'k' + i, name: 'Team ' + 'ABCDEFGH'[i], players: ['a' + i], active: true })) });
      await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(60); q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(400);
      q('.bk-bar .rchip[data-v="grid"]')?.click(); await w(150);
      const el = q('.bkm-pst'); if (!el) return 'dark piste badge contrast 4.5+: no badge';
      const rgb = c => c.match(/[\d.]+/g).slice(0, 3).map(Number), lum = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
      const cs = getComputedStyle(el), a = lum(cs.color), bg = lum(cs.backgroundColor), ratio = (Math.max(a, bg) + .05) / (Math.min(a, bg) + .05);
      return `dark piste badge contrast 4.5+: ${ratio >= 4.5} (${ratio.toFixed(1)}:1)`; });
    L.push(r); await p.screenshot({ path: 'test-results/mobile-dark-piste-390.png' }); await p.context().close(); }
  console.log(L.join('\n')); console.log('errs', errs); await b.close();
})();
