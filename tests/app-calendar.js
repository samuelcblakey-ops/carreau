// Season Calendar 1 (calendar-publish): the organiser lists a competition from Setup, the sheet is pre-filled from the
// competition, the saved listing, the "changed since it was listed" notice, Remove, archiving marks the listing gone,
// and no panel for spectators, examples or a competition more than a day past. Screenshots of the sheet at 390 px and desktop.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const step = fn => p.evaluate(fn);
  const pre = `const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\\s+/g, ' ').trim();
    const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const setT = async patch => { const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, patch); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(150); C.render(); await w(60); };
    const type = (sel, v) => { const el = q(sel); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };`;
  const run = body => p.evaluate(new Function(`return (async () => { ${pre} const L = []; try { ${body} } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\\n')[1]); } return L; })();`));
  const out = [];
  out.push(...await run(`
    q('[data-act="new-t"]').click(); await w(150);
    await setT({ name: 'Hitchin Summer Triples', venue: 'Hitchin Town Cricket Club', date: day(10), wizard: false, system: 'swiss' });
    q('[data-tab="setup"]').click(); await w(200);
    const hofAt = q('[data-hof-panel]'), calAt = q('[data-cal-panel]');
    L.push('panel owner: ' + txt(q('[data-cal-panel] [data-act="cal-open"]')) + (hofAt ? ' | above hall of fame ' + !!(calAt.compareDocumentPosition(hofAt) & Node.DOCUMENT_POSITION_FOLLOWING) : ''));
    q('[data-cal-panel] [data-act="cal-open"]').click(); await w(150);
    L.push('sheet prefill: ' + [txt(q('#modal .cal-comp b')), q('#modal [data-cal="date"]').value, q('#modal [data-cal="venue"]').value, q('#modal [data-cal="country"]').value, q('#modal .hof-pick.on')?.dataset.k].join(' | '));
    L.push('sheet: ' + txt(q('#modal h3')) + ' | format ' + txt(q('#modal .cal-comp span:not(.eyebrow)')) + ' | who ' + qa('#modal .cal-who [aria-pressed="true"]').map(x => x.dataset.k).join(',') + ' | public line ' + txt(q('#modal .cal-sheet')).includes('Everything here will be public.'));
  `));
  // the sheet at phone width and on desktop
  await p.screenshot({ path: 'test-results/calendar-sheet-desktop.png' });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  out.push('sheet 390: page width ' + await p.evaluate(() => document.documentElement.scrollWidth) + ' | one field a row ' + await p.evaluate(() => getComputedStyle(document.querySelector('#modal .cal-grid')).gridTemplateColumns.split(' ').length === 1)
    + ' | chips under 44 ' + await p.evaluate(() => [...document.querySelectorAll('#modal .cal-who button, #modal .hof-pick')].filter(x => x.getBoundingClientRect().height < 44).length)
    + ' | box font ' + await p.evaluate(() => getComputedStyle(document.querySelector('#modal [data-cal="fee"]')).fontSize));
  await p.screenshot({ path: 'test-results/calendar-sheet-390.png' });
  await p.evaluate(() => { const m = document.querySelector('#modal .modal'); m.scrollTop = m.scrollHeight; }); await p.waitForTimeout(100);
  await p.screenshot({ path: 'test-results/calendar-sheet-390-end.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(200);
  out.push(...await run(`
    type('#modal [data-cal="date"]', day(-3)); q('#modal [data-act="cal-save"]').click(); await w(150);
    L.push('past date: ' + txt(q('#modal .err')) + ' | saved ' + !!(await S.store.getCal(C.T().id)));
    type('#modal [data-cal="date"]', C.T().date);
    q('#modal [data-act="cal-level"][data-k="regional"]').click(); await w(60);
    q('#modal [data-act="cal-who"][data-k="veterans"]').click(); await w(60);
    type('#modal [data-cal="checkin"]', '09:00'); type('#modal [data-cal="start"]', '10:00');
    type('#modal [data-cal="address"]', 'Lucas Lane, Hitchin SG5 2JB'); type('#modal [data-cal="fee"]', '£5 per player'); type('#modal [data-cal="howTo"]', 'Enter at the club bar');
    q('#modal [data-act="cal-save"]').click(); await w(250);
    const e = await S.store.getCal(C.T().id);
    L.push('listed: ' + txt(q('#toast')) + ' | kind ' + e.kind + ' | level ' + e.level + ' | who ' + e.who.join(','));
    L.push('listing: ' + [e.tid === C.T().id, e.name, e.date === C.T().date, e.checkin, e.start, e.venue, e.address, e.country, e.fmt, e.system, e.fee, e.howTo, e.status, e.hidden, e.gone].join(' | '));
    L.push('panel listed: ' + txt(q('[data-cal-panel]')) + ' | changed ' + !!q('.cal-changed'));
    await setT({ name: 'Hitchin Summer Triples 2026' }); q('[data-tab="setup"]').click(); await w(150);
    L.push('changed notice after rename: ' + !!q('.cal-changed') + ' | ' + txt(q('.cal-changed')));
    q('.cal-changed [data-act="cal-open"]').click(); await w(150);
    L.push('update sheet: ' + txt(q('#modal h3')) + ' | level kept ' + q('#modal .hof-pick.hof-regional').classList.contains('on') + ' | fee kept ' + q('#modal [data-cal="fee"]').value + ' | name ' + txt(q('#modal .cal-comp b')));
    q('#modal [data-act="cal-save"]').click(); await w(250);
    const e2 = await S.store.getCal(C.T().id);
    L.push('updated: ' + txt(q('#toast')) + ' | name ' + e2.name + ' | created kept ' + (e2.createdAt === e.createdAt) + ' | notice gone ' + !q('.cal-changed'));
    q('[data-cal-panel] [data-act="cal-remove"]').click(); await w(100);
    L.push('confirm: ' + txt(q('[data-cal-panel] .err')) + ' | ' + qa('[data-cal-panel] .row .btn').map(txt).join(','));
    q('[data-act="cal-remove-yes"]').click(); await w(250);
    L.push('remove: ' + txt(q('#toast')) + ' | gone from store ' + (await S.store.getCal(C.T().id) === null) + ' | button back ' + !!q('[data-cal-panel] [data-act="cal-open"]'));
    // archive and restore: the listing is marked gone, then not
    q('[data-cal-panel] [data-act="cal-open"]').click(); await w(150); q('#modal [data-act="cal-save"]').click(); await w(250);
    await C.archiveCompetition(true); await w(250); const g1 = (await S.store.getCal(C.T().id))?.gone;
    q('[data-tab="setup"]').click(); await w(100); const archivedPanel = !!q('[data-cal-panel]');
    await C.archiveCompetition(false); await w(250); const g2 = (await S.store.getCal(C.T().id))?.gone;
    L.push('archive marks gone: ' + (g1 === true) + ' | restore unmarks: ' + (g2 === false) + ' | panel while archived ' + archivedPanel);
    // the date more than a day past: no panel; yesterday still shows it
    await setT({ date: day(-1) }); q('[data-tab="setup"]').click(); await w(100); const y = !!q('[data-cal-panel]');
    await setT({ date: day(-2) }); q('[data-tab="setup"]').click(); await w(100);
    L.push('past competition: yesterday ' + y + ' | two days ago ' + !!q('[data-cal-panel]'));
    await setT({ date: day(5) });
    // a spectator, and an example
    S.canWrite = false; C.render(); await w(100); const spec = !q('[data-cal-panel]'); S.canWrite = true; C.render(); await w(60);
    await setT({ listed: true }); q('[data-tab="setup"]').click(); await w(100); const ex = !q('[data-cal-panel]'); await setT({ listed: false });
    L.push('no panel: spectator ' + spec + ' | example ' + ex);
    // in French
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(150); q('[data-tab="setup"]').click(); await w(100);
    q('[data-cal-panel] [data-act="cal-open"]').click(); await w(150);
    L.push('fr: ' + txt(q('[data-cal-panel] h3')) + ' | ' + txt(q('#modal h3')) + ' | ' + qa('#modal .cal-who button').slice(0, 3).map(txt).join(',') + ' | ' + txt(q('#modal [data-act="cal-save"]')));
    q('#modal [data-act="close"]').click(); await w(60);
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(100);
  `));
  await p.evaluate(() => { document.querySelector('[data-tab="setup"]').click(); }); await p.waitForTimeout(150);
  await p.evaluate(() => document.querySelector('[data-cal-panel]')?.scrollIntoView()); await p.screenshot({ path: 'test-results/calendar-panel-desktop.png' });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('[data-cal-panel]')?.scrollIntoView()); await p.screenshot({ path: 'test-results/calendar-panel-390.png' });
  console.log(out.join('\n'));
  console.log('errs', errs); await b.close();
})();
