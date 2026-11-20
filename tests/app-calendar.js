// Season Calendar 1 (calendar-publish): the organiser lists a competition from Setup, the sheet is pre-filled from the
// competition, the saved listing, the "changed since it was listed" notice, Remove, archiving marks the listing gone,
// and no panel for spectators, examples or a competition more than a day past. Screenshots of the sheet at 390 px and desktop.
// Season Calendar 2 (calendar-page): the links in, the page (soonest first, grouped by week then month), filters, search,
// the full listing in place (Follow the draw once drawn), deep links, the organiser's Edit and Remove, the admin's hide
// (stood in for here; the rules are in web-calendar.js), French, and the page and a listing at 390 px.
// Season Calendar 3 (calendar-own-events): an event run elsewhere added from the page (the sheet in event mode at 390 px),
// its full listing (no Live now, no competition links), Edit, "Your listings" (a hidden one marked), Remove, French.
// Season Calendar 4 (calendar-entry-form): the sheet's Entries section, the row line and "Entries open" chip, the queue maths,
// the entry form (its checks, at 390 px), "Your entries" (a place, the waiting list, approval, Edit, Withdraw, removed by
// the organiser), "Who's entered", five entries a device, closing, and French. On one device (the app on its own) online
// entry is offered; the website's site switch and rules are in web-calendar-entry.js.
// Season Calendar 7 (calendar-share): Add to calendar (the .ics file), Open in Maps and Share on the full listing and in
// "Your entries", a cancelled listing without Add to calendar, French, and the listing with its buttons at 390 px and desktop.
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
    // a date and venue changed in the sheet go to the competition too: no "changed" notice, and the next Update shows them
    q('[data-cal-panel] [data-act="cal-open"]').click(); await w(150);
    type('#modal [data-cal="date"]', day(10)); type('#modal [data-cal="venue"]', 'Hitchin Bowls Club');
    q('#modal [data-act="cal-save"]').click(); await w(300);
    const e3 = await S.store.getCal(C.T().id);
    L.push('sheet date and venue: competition ' + (C.T().date === day(10)) + ' ' + C.T().venue + ' | listing ' + (e3.date === day(10)) + ' ' + e3.venue + ' | notice ' + !!q('.cal-changed'));
    q('[data-cal-panel] [data-act="cal-open"]').click(); await w(150);
    L.push('update sheet again: date ' + (q('#modal [data-cal="date"]').value === day(10)) + ' | venue ' + q('#modal [data-cal="venue"]').value);
    q('#modal [data-act="close"]').click(); await w(100);
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

  // ---- Season Calendar 2 (calendar-page): the public page, #calendar and #calendar.<id> ----
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('page: ' + e.message));
  await p2.setViewportSize({ width: 1100, height: 900 });
  await p2.goto(process.env.APP_URL); await p2.evaluate(() => localStorage.clear()); await p2.reload(); await p2.waitForTimeout(300);
  const run2 = body => p2.evaluate(new Function(`return (async () => { ${pre}
    const go = async h => { document.activeElement?.blur?.(); location.hash = h; await w(250); };
    const rows = () => qa('#cal-results .cal-row .cal-name b, #cal-results .cal-card h3').map(txt);
    const change = async (sel, v) => { const el = q(sel); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); await w(200); };
    const search = async v => { const el = q('#cal-q'); el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); await w(80); };
    const toSun = (7 - new Date().getDay()) % 7;
    const setC = async patch => { const t = JSON.parse(JSON.stringify(S.tournaments[window.__tid])); Object.assign(t, patch); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(150); C.render(); await w(60); };
    const L = []; try { ${body} } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\\n')[1]); } return L; })();`));
  out.push(...await run2(`
    q('[data-act="new-t"]').click(); await w(150);
    await setT({ name: 'Hitchin Summer Triples', venue: 'Hitchin Town Cricket Club', date: day(0), wizard: false, system: 'swiss', format: 'triples' });
    const tid = C.T().id; window.__tid = tid;
    const mk = (cid, o) => Object.assign({ kind: 'comp', tid: cid, name: '', date: day(1), checkin: '', start: '', venue: '', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'triples', system: 'swiss',
      who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', byUid: '', byCode: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false, gone: false }, o);
    await Promise.all([
      mk(tid, { name: 'Hitchin Summer Triples', date: day(0), checkin: '09:00', start: '10:00', venue: 'Hitchin Town Cricket Club', address: 'Lucas Lane, Hitchin SG5 2JB', region: 'Chiltern', level: 'regional',
        who: ['open', 'veterans'], fee: '£5 per player', prizes: 'Prize fund £300', howTo: 'Enter at the club bar', contact: 'Jane, 07700 900123', note: 'Bring your own boules' }),
      mk('c2', { name: 'English Doubles Championship', date: day(toSun + 3), start: '09:30', venue: 'Pétanque Park, Leicester', level: 'national', fmt: 'doubles' }),
      mk('c3', { name: 'Coupe de Bretagne', date: day(45), venue: 'Rennes', country: 'FR', region: 'Bretagne', fmt: 'melee', system: 'melee' }),
      mk('c4', { name: 'Last Week Open', date: day(-2) }),
      mk('c5', { name: 'Hidden junk', date: day(3), hidden: true, hiddenAt: Date.now() }),
    ].map(e => S.store.setCal(e.tid, e)));
    // the three ways in: header (between the picker and the Hall of Fame), footer (before the Hall of Fame), start screen
    const hb = q('header a.cal-btn[href="#calendar"]'), fl = q('#foot a[href="#calendar"]');
    L.push('links: header before hall of fame ' + !!(hb && hb.compareDocumentPosition(q('header .hof-btn:not(.cal-btn)')) & Node.DOCUMENT_POSITION_FOLLOWING) + ' | after picker ' + !!(hb && q('.picker-btn')?.compareDocumentPosition(hb) & Node.DOCUMENT_POSITION_FOLLOWING)
      + ' | footer before hall of fame ' + !!(fl && fl.compareDocumentPosition(q('#foot a[href="#halloffame"]')) & Node.DOCUMENT_POSITION_FOLLOWING));
    document.activeElement?.blur?.(); q('header .brand .home').click(); await w(200);
    const sc = q('.start-actions a[href="#calendar"]');
    L.push('start card: ' + txt(sc) + ' | before hall of fame ' + !!(sc && sc.compareDocumentPosition(q('.start-actions a[href="#halloffame"]')) & Node.DOCUMENT_POSITION_FOLLOWING));
    const startCard = !!sc;
    await go('calendar');
    L.push('page: title ' + txt(q('main h2')) + ' | header button ' + !!hb + ' | footer link ' + !!fl + ' | start card ' + startCard);
    L.push('page more: ' + txt(q('.cal-page .hof-hero p')) + ' | back ' + txt(q('.cal-page .hof-hero .btn')) + ' | current ' + q('header .cal-btn').getAttribute('aria-current') + ' | tab title ' + document.title + ' | search ' + q('#cal-q').placeholder);
    const eng = rows().length;
    await change('#cal-country', 'all');
    const g = qa('.cal-group-h').map(txt), month = new Date(day(45) + 'T12:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    L.push('rows: ' + rows()[0] + ' first | past listing shown ' + rows().includes('Last Week Open') + ' | groups ' + g.join(','));
    L.push('groups month ok: ' + (g[2] === month) + ' | hidden shown ' + rows().includes('Hidden junk') + ' | order ' + rows().join(' / '));
    L.push('row: ' + txt(q('#cal-' + tid)) + ' | live pill ' + !!q('#cal-' + tid + ' .cal-live') + ' | others live ' + qa('#cal-results .cal-live').length);
    L.push('row c3: ' + txt(q('#cal-c3')));
    const all = rows().length;
    q('[data-act="cal-filter-level"][data-k="national"]').click(); await w(150); const nat = rows().length + ' ' + rows().join(',');
    q('[data-act="cal-filter-level"][data-k="all"]').click(); await w(150);
    await change('#cal-fmt', 'melee'); const mel = rows().join(','); await change('#cal-fmt', 'all');
    await search('PETANQUE park'); const acc = rows().length + ' | focus kept ' + (document.activeElement === q('#cal-q'));
    await search('chiltern'); const reg = rows().join(',');
    L.push('filters: country GB-ENG ' + eng + ' | all countries ' + all + ' | level national ' + nat.split(' ')[0] + ' | search accents ' + acc);
    L.push('filters more: national ' + nat + ' | melee ' + mel + ' | region search ' + reg);
    await search('nobody here'); L.push('no match: ' + txt(q('#cal-results .empty')));
    q('[data-act="cal-clear"]').click(); await w(150); L.push('cleared: ' + rows().length + ' | box ' + (q('#cal-q').value === ''));
    await change('#cal-country', 'GB-SCT'); L.push('scotland: ' + txt(q('#cal-results .empty')));
    q('[data-act="cal-all-countries"]').click(); await w(200); L.push('show all: ' + q('#cal-country').value + ' | ' + rows().length);
    // the full listing, opened in place
    q('#cal-' + tid).click(); await w(150);
    const card = q('#cal-' + tid + '.cal-card');
    L.push('open listing: How to enter ' + (txt(card?.querySelector('h4')) === 'How to enter') + ' | Follow the draw ' + !!card?.querySelector('a[href="#' + tid + '"].primary') + ' before draw | view ' + txt(card?.querySelector('a.btn:not(.cal-maps)')));
    L.push('listing: ' + txt(card.querySelector('.hof-where')) + ' | ' + qa('#cal-' + tid + ' dt').map(d => d.textContent + '=' + txt(d.nextElementSibling)).join(' ; '));
    L.push('listing buttons: ' + qa('#cal-' + tid + ' .row:not(.cal-share) .btn').map(txt).join(',') + ' | close focused ' + (document.activeElement?.dataset?.act === 'cal-close-entry') + ' | other rows ' + qa('#cal-results .cal-row').length);
    q('#cal-' + tid + ' [data-act="cal-close-entry"]').click(); await w(150);
    L.push('closed: ' + !!q('#cal-' + tid + '.cal-row') + ' | focus back ' + (document.activeElement?.id === 'cal-' + tid));
    // a listing whose competition isn't on this device: no organiser buttons, no link (there's no competition to read)
    q('#cal-c2').click(); await w(200); L.push('stranger listing: buttons ' + qa('#cal-c2 .row:not(.cal-share) .btn').map(txt).join(','));
    q('#cal-c2 [data-act="cal-close-entry"]').click(); await w(100);
    // the competition is drawn: Follow the draw
    await setC({ draws: [{ id: 'R1', kind: 'round', at: Date.now() }] });
    q('#cal-' + tid).click(); await w(150);
    const fd = q('#cal-' + tid + ' a.primary');
    L.push('after draw: Follow the draw ' + (txt(fd) === 'Follow the draw' && fd.getAttribute('href') === '#' + tid) + ' after draw');
    await setC({ draws: [] });
  `));
  await p2.screenshot({ path: 'test-results/calendar-listing-desktop.png' });
  out.push(...await run2(`
    const tid = window.__tid;
    q('#cal-' + tid + ' [data-act="cal-close-entry"]')?.click(); await w(150);
  `));
  await p2.evaluate(() => scrollTo(0, 0)); await p2.screenshot({ path: 'test-results/calendar-page-desktop.png' });
  out.push(...await run2(`
    const tid = window.__tid;
    // deep links: one listing opens on its country; a missing, hidden or past one says it's gone
    await go('calendar.c3'); await w(200);
    L.push('deep link: #calendar.<id> opens ' + !!q('#cal-c3.cal-card.hof-focus') + ' | country ' + q('#cal-country').value + ' | missing shows notice ' + (await (async () => { await go('calendar.nothing-here'); await w(200); return txt(q('main .notice')) === "That listing isn't on the Season Calendar any more."; })()));
    await go('calendar.c5'); await w(200); const hid = txt(q('main .notice')); await go('calendar.c4'); await w(200);
    L.push('deep link more: hidden ' + hid + ' | past ' + txt(q('main .notice')));
    // the organiser's Edit: the competition's Setup with the sheet open
    await go('calendar'); await change('#cal-country', 'all'); q('#cal-' + tid).click(); await w(150);
    q('#cal-' + tid + ' [data-act="cal-edit"]').click(); await w(300);
    L.push('edit: sheet ' + txt(q('#modal h3')) + ' | tab ' + S.tab + ' | page left ' + !q('.cal-page') + ' | fee ' + q('#modal [data-cal="fee"]')?.value);
    q('#modal [data-act="close"]').click(); await w(100);
    // the admin (website only; stood in for here): hide, the organiser's notice, show again
    S.calAdmin = () => true;
    await go('calendar'); await change('#cal-country', 'all'); q('#cal-' + tid).click(); await w(150);
    L.push('admin strip: ' + txt(q('#cal-' + tid + ' .cal-admin')));
    q('#cal-' + tid + ' [data-act="cal-hide"]').click(); await w(250);
    const st = await S.store.getCal(tid);
    const goneFromPage = !q('#cal-' + tid) && !rows().includes('Hitchin Summer Triples');
    q('[data-act="picker"]').click(); await w(80); q('.pick-row[data-id="' + tid + '"]').click(); await w(200); q('[data-tab="setup"]').click(); await w(250);
    const panel = txt(q('[data-cal-panel]'));
    L.push('admin hide: hidden ' + (st.hidden === true && typeof st.hiddenAt === 'number') + ' | gone from page ' + goneFromPage + ' | organiser notice ' + panel.includes('Hidden from the Season Calendar by the site admin.'));
    L.push('organiser panel hidden: ' + panel);
    await go('calendar.' + tid); await w(250);
    L.push('admin deep link to hidden: ' + !!q('#cal-' + tid + '.cal-card') + ' | ' + txt(q('#cal-' + tid + ' [data-act="cal-hide"]')));
    q('#cal-' + tid + ' [data-act="cal-hide"]').click(); await w(250);
    L.push('show again: hidden ' + (await S.store.getCal(tid)).hidden + ' | ' + txt(q('#cal-' + tid + ' [data-act="cal-hide"]')));
    S.calAdmin = null; C.render(); await w(100);
    L.push('no strip for others: ' + !q('.cal-admin'));
    // the organiser removes it from the page
    q('#cal-' + tid + ' [data-act="cal-page-remove"]').click(); await w(100);
    L.push('page remove confirm: ' + txt(q('#cal-' + tid + ' .err')));
    q('#cal-' + tid + ' [data-act="cal-page-remove-yes"]').click(); await w(300);
    L.push('page remove: ' + txt(q('#toast')) + ' | store ' + (await S.store.getCal(tid)) + ' | on page ' + !!q('#cal-' + tid));
    // empty everywhere
    for (const c of ['c2', 'c3', 'c4']) await S.store.deleteCal(c);
    S.calPage.cache = {}; await go('calendar.x'); await go('calendar'); await w(200); await change('#cal-country', 'all');
    L.push('empty: ' + txt(q('#cal-results .empty')));
    // in French
    await S.store.setCal('c2', Object.assign(await (async () => ({ kind: 'comp', tid: 'c2', name: 'English Doubles Championship', date: day(toSun + 3), checkin: '', start: '', venue: 'Leicester', address: '', country: 'GB-ENG', region: '', level: 'national', fmt: 'doubles', system: 'swiss',
      who: ['open', 'ladies'], fee: '', prizes: '', howTo: 'Online', contact: '', note: '', status: 'on', lang: 'en', byUid: '', byCode: '', createdAt: 1, updatedAt: 1, hidden: false, gone: false }))()));
    S.calPage.cache = {};
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(250);
    L.push('fr: ' + txt(q('main h2')) + ' | ' + q('#cal-q').placeholder + ' | ' + qa('.cal-group-h').map(txt).join(',') + ' | ' + txt(q('#cal-c2 .cal-main')) + ' | header ' + txt(q('header .cal-btn')) + ' | foot ' + txt(q('#foot a[href="#calendar"]')));
    q('#cal-c2').click(); await w(150); L.push('fr listing: ' + qa('#cal-c2 dt, #cal-c2 h4').map(txt).join(','));
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(150);
  `));
  // phones: the page and an open listing at 390 px, with no sideways scrolling
  await p2.evaluate(async () => { const S = window.__carreau.S; const t = window.__tid; const d = new Date(); const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    await S.store.setCal(t, { kind: 'comp', tid: t, name: 'Hitchin Summer Triples', date: day, checkin: '09:00', start: '10:00', venue: 'Hitchin Town Cricket Club', address: 'Lucas Lane, Hitchin SG5 2JB', country: 'GB-ENG', region: 'Chiltern', level: 'regional', fmt: 'triples', system: 'swiss',
      who: ['open', 'veterans'], fee: '£5 per player', prizes: 'Prize fund £300', howTo: 'Enter at the club bar, or call Jane on 07700 900123 before Friday', contact: 'Jane, 07700 900123', note: 'Bring your own boules', status: 'on', lang: 'en', byUid: '', byCode: '', createdAt: 1, updatedAt: 1, hidden: false, gone: false });
    S.calPage.cache = {}; S.calPage.open = null; location.hash = 'calendar'; await new Promise(r => setTimeout(r, 300)); });
  await p2.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.hidden = true; }); // the toast from Remove would cover the rows
  await p2.setViewportSize({ width: 390, height: 844 }); await p2.waitForTimeout(300);
  const wide = () => p2.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  const pageWide = await wide(); const rowH = await p2.evaluate(() => Math.round(document.querySelector('.cal-row')?.getBoundingClientRect().height || 0));
  await p2.screenshot({ path: 'test-results/calendar-page-390.png' });
  await p2.evaluate(async () => { document.querySelector('#cal-' + window.__tid).click(); await new Promise(r => setTimeout(r, 200)); document.querySelector('#cal-' + window.__tid).scrollIntoView(); });
  const listingWide = await wide();
  await p2.screenshot({ path: 'test-results/calendar-listing-390.png' });
  out.push('phone 390: no sideways scroll ' + (!pageWide && !listingWide) + ' | row height ' + rowH + ' | header label ' + await p2.evaluate(() => getComputedStyle(document.querySelector('header .cal-btn span')).display)
    + ' | targets under 44 ' + await p2.evaluate(() => [...document.querySelectorAll('.cal-page .hof-chip, .cal-page .cal-row, header .cal-btn')].filter(x => x.getBoundingClientRect().height < 40).map(x => x.className + ' ' + Math.round(x.getBoundingClientRect().height)).join(',') || 0));

  // ---- Season Calendar 3 (calendar-own-events): an event run elsewhere, added from the page (at 390 px) ----
  await p2.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.hidden = false; });
  out.push(...await run2(`
    await go('calendar'); await w(200);
    L.push('add button: ' + txt(q('[data-act="cal-ev-new"]')) + ' | ' + txt(q('.cal-add .muted')));
    q('[data-act="cal-ev-new"]').click(); await w(150);
    L.push('event sheet: ' + txt(q('#modal h3')) + ' | name box ' + !!q('#modal [data-cal="name"]') + ' | formats ' + qa('#modal [data-act="cal-fmt"]').map(txt).join(',') + ' | picked ' + qa('#modal [data-act="cal-fmt"][aria-pressed="true"]').length
      + ' | date "' + q('#modal [data-cal="date"]').value + '" | venue "' + q('#modal [data-cal="venue"]').value + '" | level ' + q('#modal .hof-pick.on')?.dataset.k + ' | who ' + qa('#modal [data-act="cal-who"][aria-pressed="true"]').map(x => x.dataset.k).join(',') + ' | country ' + q('#modal [data-cal="country"]').value);
    L.push('event sheet more: ' + q('#modal [data-cal="formatNote"]').placeholder + ' | ' + txt(q('#modal [data-act="cal-save"]')) + ' | no competition line ' + !q('#modal .cal-comp'));
  `));
  out.push('event sheet 390: no sideways scroll ' + await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
    + ' | chips under 44 ' + await p2.evaluate(() => [...document.querySelectorAll('#modal .cal-who button, #modal .hof-pick')].filter(x => x.getBoundingClientRect().height < 44).length)
    + ' | box font ' + await p2.evaluate(() => getComputedStyle(document.querySelector('#modal [data-cal="name"]')).fontSize));
  await p2.screenshot({ path: 'test-results/calendar-event-sheet-390.png' });
  out.push(...await run2(`
    q('#modal [data-act="cal-save"]').click(); await w(100); const e1 = txt(q('#modal .err'));
    type('#modal [data-cal="name"]', 'Stotfold Charity Doubles'); q('#modal [data-act="cal-save"]').click(); await w(100); const e2 = txt(q('#modal .err'));
    q('#modal [data-act="cal-fmt"][data-k="doubles"]').click(); await w(60); q('#modal [data-act="cal-save"]').click(); await w(100); const e3 = txt(q('#modal .err'));
    L.push('event checks: ' + e1 + ' | ' + e2 + ' | ' + e3);
    type('#modal [data-cal="formatNote"]', 'Swiss, 4 rounds then knockouts'); type('#modal [data-cal="date"]', day(0)); type('#modal [data-cal="start"]', '10:00');
    type('#modal [data-cal="venue"]', 'Stotfold Pétanque Club'); type('#modal [data-cal="howTo"]', 'Call Sue on 07700 900456');
    q('#modal [data-act="cal-level"][data-k="regional"]').click(); await w(60);
    q('#modal [data-act="cal-save"]').click(); await w(400);
    const id = location.hash.split('.')[1]; window.__ev = id; const e = await S.store.getCal(id);
    L.push('add event: ' + txt(q('#toast')) + ' | kind ' + e.kind + ' | fmt ' + e.fmt + ' | on page ' + !!q('#cal-' + id + '.cal-card'));
    L.push('event listing: id ' + (e.id === id && /^c[a-z0-9]+$/.test(id)) + ' | tid ' + ('tid' in e) + ' | ' + e.formatNote + ' | ' + e.level + ' | ' + e.who.join(',') + ' | hidden ' + e.hidden + ' | orgCode "' + e.orgCode + '" | sheet closed ' + !q('#modal .modal'));
    const card = q('#cal-' + id + '.cal-card'), fmtDd = qa('#cal-' + id + ' dt').find(d => d.textContent === 'Format')?.nextElementSibling;
    L.push('event card: format ' + txt(fmtDd) + ' | buttons ' + qa('#cal-' + id + ' .row:not(.cal-share) .btn').map(txt).join(',') + ' | live now ' + !!card.querySelector('.cal-live') + ' | competition links ' + !!card.querySelector('a.btn:not(.cal-maps)'));
    q('#cal-' + id + ' [data-act="cal-close-entry"]').click(); await w(150);
    L.push('event row: ' + txt(q('#cal-' + id + ' .cal-main')) + ' | live now ' + !!q('#cal-' + id + ' .cal-live'));
    q('#cal-' + id).click(); await w(150); q('#cal-' + id + ' [data-act="cal-ev-edit"]').click(); await w(150);
    L.push('edit event: ' + txt(q('#modal h3')) + ' | name ' + q('#modal [data-cal="name"]').value + ' | doubles picked ' + q('#modal [data-act="cal-fmt"][data-k="doubles"]').getAttribute('aria-pressed') + ' | regional kept ' + q('#modal .hof-pick.hof-regional').classList.contains('on') + ' | ' + txt(q('#modal [data-act="cal-save"]')));
    type('#modal [data-cal="venue"]', 'Stotfold PC'); q('#modal [data-act="cal-save"]').click(); await w(400);
    const e4 = await S.store.getCal(id);
    L.push('event updated: ' + txt(q('#toast')) + ' | venue ' + e4.venue + ' | created kept ' + (e4.createdAt === e.createdAt) + ' | open ' + !!q('#cal-' + id + '.cal-card'));
  `));
  await p2.evaluate(() => document.querySelector('#cal-' + window.__ev)?.scrollIntoView()); await p2.screenshot({ path: 'test-results/calendar-event-open-390.png' });
  out.push(...await run2(`
    const id = window.__ev, tid = window.__tid;
    // "Your listings": this device's event, its competition's listing, and a hidden event (marked)
    await S.store.setCal('cHid', { kind: 'event', id: 'cHid', name: 'Hidden event', date: day(4), checkin: '', start: '', venue: '', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'other', formatNote: '',
      who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', ownerUid: '', orgCode: '', byUid: '', byCode: '', createdAt: 1, updatedAt: 1, hidden: true, hiddenAt: 2 });
    S.calPage.mine = null; await go('calendar'); await w(300);
    const mine = q('#cal-mine .cal-mine');
    L.push('your listings: event ' + !!q('#calmine-' + id) + ' | competition listing ' + !!q('#calmine-' + tid) + ' | hidden marked ' + (txt(q('#calmine-cHid .cal-hidden-mark')) === 'Hidden by the site admin'));
    L.push('your listings more: ' + txt(mine?.querySelector('h3')) + ' | before tools ' + !!(mine && mine.compareDocumentPosition(q('.hof-tools')) & Node.DOCUMENT_POSITION_FOLLOWING) + ' | hidden in main list ' + !!q('#cal-cHid'));
    q('#calmine-cHid').click(); await w(300);
    L.push('mine opens hidden: ' + location.hash + ' | card ' + !!q('#cal-cHid.cal-card') + ' | mark ' + txt(q('#cal-cHid .cal-hidden-mark')) + ' | buttons ' + qa('#cal-cHid .row:not(.cal-share) .btn').map(txt).join(','));
    // someone who isn't one of its organisers (the website's S.calCanEdit, stood in for here)
    await go('calendar.' + id); await w(250); S.calCanEdit = () => false; C.render(); await w(100);
    L.push('stranger stand-in: Edit ' + !!q('#cal-' + id + ' [data-act="cal-ev-edit"]') + ' | Remove ' + !!q('#cal-' + id + ' [data-act="cal-page-remove"]'));
    S.calCanEdit = null; C.render(); await w(100);
    q('#cal-' + id + ' [data-act="cal-page-remove"]').click(); await w(100);
    L.push('event remove confirm: ' + txt(q('#cal-' + id + ' .err')));
    q('#cal-' + id + ' [data-act="cal-page-remove-yes"]').click(); await w(300);
    L.push('event remove: ' + txt(q('#toast')) + ' | store ' + (await S.store.getCal(id)) + ' | mine ' + !!q('#calmine-' + id));
    // in French
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(200);
    const add = txt(q('[data-act="cal-ev-new"]')); q('[data-act="cal-ev-new"]').click(); await w(150);
    L.push('fr event: ' + add + ' | ' + txt(q('#modal h3')) + ' | ' + qa('#modal [data-act="cal-fmt"]').map(txt).slice(-2).join(',') + ' | ' + txt(q('#modal [data-act="cal-save"]')) + ' | ' + txt(q('#cal-mine h3')));
    q('#modal [data-act="close"]').click(); await w(60);
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(150);
  `));

  // ---- Season Calendar 4 (calendar-entry-form) ----
  out.push(...await run2(`
    const Q = C.calQueue, st = C.calEntState, E = (id, status, queuedAt, at) => ({ id, status, queuedAt, at });
    const list = [E('b_1', 'in', 20, 20), E('a_1', 'in', 10, 10), E('c_1', 'pending', 0, 5), E('d_1', 'in', 20, 20), E('e_1', 'in', 15, 30)];
    const qq = Q({ places: 2 }, list);
    L.push('queue maths: order ' + qq.ins.map(x => x.id).join(',') + ' | ' + qq.ins.concat(list.filter(x => x.status === 'pending')).map(x => st(x, qq)).join(' / ') + ' | wait ' + qq.wait);
    const q0 = Q({ places: 0 }, list), q1 = Q({ places: 2 }, list.filter(x => x.id !== 'a_1'));
    L.push('queue maths more: no limit ' + st(list[0], q0) + ' | withdraw moves up ' + st(list[0], q1) + ' / ' + st(list[3], q1));
    const open = { online: true, fmt: 'doubles', status: 'on', closesAt: Date.now() + 864e5, places: 32 };
    L.push('places line: ' + [C.calPlacesLine(open, Q(open, Array.from({ length: 20 }, (_, i) => E('x_' + i, 'in', i, i)))).replace(/close .*/, 'close <day>'),
      ...[{ places: 2 }, { places: 0 }, { closesAt: Date.now() - 1 }].map(x => { const o = Object.assign({}, open, x); return C.calPlacesLine(o, Q(o, list)); })].join(' / '));
    // an event taking entries online: doubles, 2 places, closing tomorrow, names shown
    const ev = (id, extra) => Object.assign({ kind: 'event', id, name: 'Sandy Spring Doubles', date: day(6), checkin: '', start: '10:00', venue: 'Sandy PC', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'doubles', formatNote: '',
      who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', ownerUid: '', orgCode: '', byUid: '', byCode: '', createdAt: 1, updatedAt: 1, hidden: false,
      online: true, places: 2, closesAt: new Date(day(1) + 'T23:59:59.999').getTime(), approve: false, showEntrants: true }, extra);
    await S.store.setCal('cEnt', ev('cEnt')); await S.store.setCal('cEnt2', ev('cEnt2', { name: 'Biggleswade Singles', fmt: 'singles', online: false }));
    S.calPage.cache = {}; await go('calendar'); await w(300);
    L.push('row line: ' + txt(q('#cal-cEnt .cal-ent-line')).replace(/closes .*/, 'closes <day>') + ' | day ' + /closes [A-Z][a-z]{2} \\d{1,2} [A-Z][a-z]{2}$/.test(txt(q('#cal-cEnt .cal-ent-line'))) + ' | other row ' + !!q('#cal-cEnt2 .cal-ent-line'));
    const rowsN = () => qa('#cal-results .cal-row').length, n0 = rowsN();
    q('[data-act="cal-filter-open"]').click(); await w(150);
    L.push('chip: ' + txt(q('[data-act="cal-filter-open"]')) + ' | pressed ' + q('[data-act="cal-filter-open"]').getAttribute('aria-pressed') + ' | rows ' + n0 + ' -> ' + rowsN() + ' | only ' + qa('#cal-results .cal-row').map(r => r.id).join(','));
    q('[data-act="cal-filter-open"]').click(); await w(100);
    await go('calendar.cEnt'); await w(300);
    const card = () => q('#cal-cEnt.cal-card');
    L.push('listing: ' + txt(card().querySelector('.cal-places')).replace(/close .*/, 'close <day>') + ' | meter ' + !!card().querySelector('.cal-ent .meter') + ' | button ' + txt(card().querySelector('[data-act="cal-ent-new"]')) + ' | your entries ' + !!card().querySelector('.cal-mine-ent'));
    card().querySelector('[data-act="cal-ent-new"]').click(); await w(150);
    L.push('form: ' + txt(q('#modal h3')) + ' | ' + qa('#modal label.f > span').map(txt).join(',') + ' | ' + txt(q('#modal .cal-ent-privacy')) + ' | ' + qa('#modal .row .btn').map(txt).join(','));
    q('#modal [data-act="cal-ent-send"]').click(); await w(100); const e1 = txt(q('#modal .err'));
    type('#modal [data-calent="p0"]', 'Ann Lee'); q('#modal [data-act="cal-ent-send"]').click(); await w(100); const e2 = txt(q('#modal .err'));
    type('#modal [data-calent="p1"]', 'Bob Fox'); q('#modal [data-act="cal-ent-send"]').click(); await w(100); const e3 = txt(q('#modal .err'));
    L.push('form checks: ' + e1 + ' | ' + e2 + ' | ' + e3);
    type('#modal [data-calent="name"]', 'Les Copains'); type('#modal [data-calent="club"]', 'Sandy PC'); type('#modal [data-calent="contact"]', '07700 900111');
  `));
  out.push('form 390: no sideways scroll ' + await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1) + ' | box font ' + await p2.evaluate(() => getComputedStyle(document.querySelector('#modal [data-calent="contact"]')).fontSize)
    + ' | boxes under 44 ' + await p2.evaluate(() => [...document.querySelectorAll('#modal [data-calent]')].filter(x => x.getBoundingClientRect().height < 44).length));
  await p2.screenshot({ path: 'test-results/calendar-entry-form-390.png' });
  out.push(...await run2(`
    const card = () => q('#cal-cEnt.cal-card'), mineT = () => qa('#cal-cEnt .cal-ent-row').map(r => txt(r.querySelector('b')) + ': ' + txt(r.querySelector('.cal-ent-state'))).join(' / ');
    const enter = async (players, team) => { card().querySelector('[data-act="cal-ent-new"]').click(); await w(150); if (team) type('#modal [data-calent="name"]', team);
      players.forEach((v, i) => type('#modal [data-calent="p' + i + '"]', v)); type('#modal [data-calent="contact"]', 'me@example.com'); q('#modal [data-act="cal-ent-send"]').click(); await w(250); };
    q('#modal [data-act="cal-ent-send"]').click(); await w(300);
    const c = JSON.parse(localStorage.getItem('carreau-local-v1')).ce.cEnt;
    L.push('sent: ' + txt(q('#toast')) + ' | modal closed ' + !q('#modal .modal') + ' | ids ' + Object.keys(c.entries).join(',') + ' | status ' + c.entries.local_1.status + ' | team ' + JSON.stringify(c.teams.local_1) + ' | contact ' + c.contacts.local_1.contact
      + ' | listing untouched ' + !JSON.stringify(await S.store.getCal('cEnt')).includes('07700'));
    L.push('your entries: ' + mineT() + ' | places ' + txt(card().querySelector('.cal-places')).replace(/close .*/, 'close <day>'));
    await enter(['Cat Ray', 'Dan Oak']); await enter(['Eve Ash', 'Fay Elm'], 'Third Team');
    L.push('waiting list: ' + mineT() + ' | places ' + txt(card().querySelector('.cal-places')) + ' | meter ' + card().querySelector('.meter span').style.width);
    window.__ent = 1;
  `));
  await p2.evaluate(() => document.querySelector('#cal-cEnt .cal-mine-ent')?.scrollIntoView()); await p2.screenshot({ path: 'test-results/calendar-your-entries-390.png' });
  out.push(...await run2(`
    const card = () => q('#cal-cEnt.cal-card'), mineT = () => qa('#cal-cEnt .cal-ent-row').map(r => txt(r.querySelector('b')) + ': ' + txt(r.querySelector('.cal-ent-state'))).join(' / ');
    const who = () => ({ inn: qa('#cal-cEnt .cal-who-list .cal-who-ol')[0] ? qa('#cal-cEnt .cal-who-list .cal-who-ol')[0].querySelectorAll('li').length : 0, wait: !!q('#cal-cEnt .cal-wait-h'),
      text: txt(q('#cal-cEnt .cal-who-list')) });
    q('#cal-cEnt .cal-who-list summary').click(); await w(100);
    const w1 = who(); q('#cal-cEnt .cal-who-list').scrollIntoView(); await w(100); L.push("who's entered: " + w1.inn + ' listed | waiting list heading ' + w1.wait + ' | ' + w1.text);
  `));
  await p2.screenshot({ path: 'test-results/calendar-whos-entered-390.png' });
  out.push(...await run2(`
    const card = () => q('#cal-cEnt.cal-card'), mineT = () => qa('#cal-cEnt .cal-ent-row').map(r => txt(r.querySelector('b')) + ': ' + txt(r.querySelector('.cal-ent-state'))).join(' / ');
    // Edit (names and contact read back), then Withdraw the first
    q('#cal-cEnt [data-act="cal-ent-edit"][data-eid="local_1"]').click(); await w(200);
    L.push('edit: ' + [q('#modal [data-calent="name"]').value, q('#modal [data-calent="p0"]').value, q('#modal [data-calent="p1"]').value, q('#modal [data-calent="club"]').value, q('#modal [data-calent="contact"]').value].join(' | '));
    type('#modal [data-calent="club"]', 'Sandy Pétanque Club'); q('#modal [data-act="cal-ent-send"]').click(); await w(300);
    L.push('edited: ' + txt(q('#toast')) + ' | club ' + JSON.parse(localStorage.getItem('carreau-local-v1')).ce.cEnt.teams.local_1.club + ' | ids ' + Object.keys(JSON.parse(localStorage.getItem('carreau-local-v1')).ce.cEnt.entries).join(','));
    q('#cal-cEnt [data-act="cal-ent-withdraw"][data-eid="local_1"]').click(); await w(100);
    L.push('withdraw confirm: ' + txt(q('#cal-cEnt .cal-ent-row .err')) + ' | ' + qa('#cal-cEnt .cal-ent-row[data-eid="local_1"] .btn').map(txt).join(','));
    q('#cal-cEnt [data-act="cal-ent-withdraw-yes"]').click(); await w(300);
    L.push('withdrawn: ' + txt(q('#toast')) + ' | ' + mineT() + ' | gone notice ' + !!q('#cal-cEnt .cal-ent-gone'));
    // five a device
    await (async () => { for (let i = 0; i < 4; i++) { card().querySelector('[data-act="cal-ent-new"]').click(); await w(150); type('#modal [data-calent="p0"]', 'P' + i); type('#modal [data-calent="p1"]', 'Q' + i);
      type('#modal [data-calent="contact"]', '0' + i); q('#modal [data-act="cal-ent-send"]').click(); await w(250); } })();
    L.push('sixth: ' + txt(q('#modal .err')) + ' | entries ' + qa('#cal-cEnt .cal-ent-row').length);
    q('#modal [data-act="close"]').click(); await w(100);
    // the organiser removes one: shown once
    await S.store.withdrawCalEntry('cEnt', 'local_2'); await w(250);
    const gone1 = txt(q('#cal-cEnt .cal-ent-gone'));
    q('#cal-cEnt [data-act="cal-close-entry"]').click(); await w(150); q('#cal-cEnt').click(); await w(250);
    L.push('removed by organiser: ' + gone1 + ' | shown again ' + !!q('#cal-cEnt .cal-ent-gone'));
    // approval on: a new entry waits
    await S.store.setCal('cEnt', Object.assign(await S.store.getCal('cEnt'), { approve: true })); await w(100);
    await S.store.withdrawCalEntry('cEnt', 'local_3'); await w(200); q('#cal-cEnt [data-act="cal-close-entry"]').click(); await w(150); q('#cal-cEnt').click(); await w(250);
    card().querySelector('[data-act="cal-ent-new"]').click(); await w(150); type('#modal [data-calent="p0"]', 'Gus'); type('#modal [data-calent="p1"]', 'Hal'); type('#modal [data-calent="contact"]', '01');
    q('#modal [data-act="cal-ent-send"]').click(); await w(300);
    const pend = qa('#cal-cEnt .cal-ent-row').find(r => txt(r.querySelector('b')) === 'Gus & Hal');
    L.push('approve on: ' + txt(pend?.querySelector('.cal-ent-state')) + ' | status ' + JSON.parse(localStorage.getItem('carreau-local-v1')).ce.cEnt.entries[pend?.dataset.eid]?.status + ' | not in who\\'s entered ' + !txt(q('#cal-cEnt .cal-who-list')).includes('Gus'));
    // closed: no form, no Edit; Withdraw stays
    await S.store.setCal('cEnt', Object.assign(await S.store.getCal('cEnt'), { closesAt: Date.now() - 1000 })); S.calPage.cache = {}; S.calPage.deepFor = null; S.calPage.deepItem = null; S.calPage.open = null; await go('calendar'); await w(200);
    const rowClosed = txt(q('#cal-cEnt .cal-ent-line')); q('#cal-cEnt').click(); await w(250);
    L.push('closed: row ' + rowClosed + ' | places ' + txt(card().querySelector('.cal-places')) + ' | Enter online ' + !!card().querySelector('[data-act="cal-ent-new"]') + ' | Edit ' + !!card().querySelector('[data-act="cal-ent-edit"]') + ' | Withdraw ' + !!card().querySelector('[data-act="cal-ent-withdraw"]'));
  `));
  out.push(...await run2(`
    // the sheet: the event's Entries section as saved; another format has none
    await S.store.setCal('cEnt', Object.assign(await S.store.getCal('cEnt'), { closesAt: new Date(day(1) + 'T23:59:59.999').getTime() }));
    S.calPage.cache = {}; S.calPage.deepFor = null; await go('calendar'); await go('calendar.cEnt'); await w(250);
    q('#cal-cEnt [data-act="cal-ev-edit"]').click(); await w(150);
    L.push('sheet entries: ' + txt(q('#modal .cal-ent-set .eyebrow')) + ' | ticks ' + qa('#modal .cal-ent-set input[type="checkbox"]').map(x => txt(x.parentElement) + '=' + x.checked).join(',') + ' | places ' + q('#modal [data-cal="places"]').value
      + ' | closes ' + (q('#modal [data-cal="closes"]').value === day(1)) + ' | max ' + (q('#modal [data-cal="closes"]').max === day(6)) + ' | placeholder ' + q('#modal [data-cal="places"]').placeholder);
    q('#modal [data-cal="closes"]').value = day(9); q('#modal [data-cal="closes"]').dispatchEvent(new Event('input', { bubbles: true }));
    type('#modal [data-cal="places"]', '');
    q('#modal [data-act="cal-save"]').click(); await w(300);
    const e5 = await S.store.getCal('cEnt');
    L.push('sheet saved: places ' + e5.places + ' | closes clamped to the event ' + (calYmd => calYmd === day(6))((d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(new Date(e5.closesAt))) + ' | approve ' + e5.approve + ' | shown ' + e5.showEntrants);
    S.calPage.deepFor = null; await go('calendar'); await go('calendar.cEnt'); await w(250);
    L.push('no limit: ' + txt(q('#cal-cEnt .cal-places')) + ' | meter ' + !!q('#cal-cEnt .cal-ent .meter'));
    q('#cal-cEnt [data-act="cal-ev-edit"]').click(); await w(150); q('#modal [data-act="cal-fmt"][data-k="other"]').click(); await w(100);
    L.push('other format: ' + txt(q('#modal .cal-ent-set')) + ' | tick ' + !!q('#modal [data-cal="online"]'));
    q('#modal [data-act="close"]').click(); await w(60);
    // a new event: unticked; ticking it shows the rest, closing the day before
    q('[data-act="cal-ev-new"]').click(); await w(150); q('#modal [data-act="cal-fmt"][data-k="triples"]').click(); await w(60); type('#modal [data-cal="date"]', day(8));
    const before = !!q('#modal [data-cal="places"]'); q('#modal [data-cal="online"]').click(); await w(100);
    L.push('new event sheet: online ' + q('#modal [data-cal="online"]').checked + ' | fields before tick ' + before + ' | closes default ' + (q('#modal [data-cal="closes"]').value === day(7)));
    q('#modal [data-act="close"]').click(); await w(60);
    // French
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(200);
    L.push('fr entries: ' + txt(q('#cal-cEnt .cal-places')) + ' | ' + txt(q('#cal-cEnt [data-act="cal-ent-new"]')) + ' | ' + txt(q('#cal-cEnt .cal-mine-ent h4')) + ' | ' + qa('#cal-cEnt .cal-ent-state').map(txt).join(' / '));
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(150);
  `));
  // ---- Season Calendar 5 (calendar-entries-desk): the organiser's "Online entries", CSV, Registration's "Entered online" ----
  const p3 = await ctx.newPage(); p3.on('pageerror', e => errs.push('desk: ' + e.message));
  await p3.setViewportSize({ width: 1100, height: 900 });
  await p3.goto(process.env.APP_URL); await p3.evaluate(() => localStorage.clear()); await p3.reload(); await p3.waitForTimeout(300);
  const run3 = body => p3.evaluate(new Function(`return (async () => { ${pre}
    const go = async h => { document.activeElement?.blur?.(); location.hash = h; await w(250); };
    const tid = window.__dtid, card = () => q('#cal-' + window.__dtid + '.cal-card'), rowsT = () => qa('#cal-' + window.__dtid + ' .cal-desk-row');
    const L = []; try { ${body} } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\\n')[1]); } return L; })();`));
  out.push(...await run3(`
    q('[data-act="new-t"]').click(); await w(150);
    await setT({ name: 'Arlesey Autumn Doubles', venue: 'Arlesey PC', date: day(5), wizard: false, system: 'swiss', format: 'doubles' });
    const tid = C.T().id; window.__dtid = tid;
    await S.store.setCal(tid, { kind: 'comp', tid, name: 'Arlesey Autumn Doubles', date: day(5), checkin: '', start: '10:00', venue: 'Arlesey PC', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'doubles', system: 'swiss',
      who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', byUid: '', byCode: '', createdAt: 1, updatedAt: 1, hidden: false, gone: false,
      online: true, places: 2, closesAt: Date.now() + 2 * 864e5, approve: false, showEntrants: false });
    const add = async (eid, status, players, contact, name = '', club = '') => { await S.store.addCalEntry(tid, eid, { uid: eid.split('_')[0], status }, { name, players, club }, contact); await w(5); };
    await add('u1_1', 'in', ['Ann Lee', 'Bob Fox'], '+44 7700 900123', 'Les Copains', 'Arlesey PC'); await add('u2_1', 'in', ['Cat Ray', 'Dan Oak'], 'cat@example.com');
    await add('u3_1', 'in', ['Eve Ash', 'Fay Elm'], '=HYPERLINK("x")', '@Third', '-Club'); await add('u4_1', 'pending', ['Gus Hay', 'Hal Ivy'], '07700 900444', 'Waiting Team');
    window.__csv = null; S.downloads = { save: async f => { window.__csv = f; } };
    await go('calendar.' + tid); for (let i = 0; i < 40 && !(card() && rowsT().length); i++) await w(100);
    const labels = () => rowsT().map(r => txt(r.querySelector('.cal-desk-n'))).join(',');
    L.push('desk: ' + txt(card().querySelector('.cal-desk h4')) + ' | ' + txt(card().querySelector('.cal-desk-sum')) + ' | ' + labels() + ' | names ' + rowsT().map(r => txt(r.querySelector('b'))).join(',')
      + ' | tel ' + (card().querySelector('.cal-desk-row[data-eid="u1_1"] a')?.getAttribute('href') || '') + ' | mailto ' + (card().querySelector('.cal-desk-row[data-eid="u2_1"] a')?.getAttribute('href') || '')
      + ' | formula plain ' + !card().querySelector('.cal-desk-row[data-eid="u3_1"] a') + ' | sent ' + /\\d{1,2} [A-Z][a-z]{2},? \\d{2}:\\d{2}/.test(txt(card().querySelector('.cal-desk-row .cal-desk-meta'))));
    L.push('desk buttons: ' + rowsT().map(r => qa.call(null, '#cal-' + tid + ' .cal-desk-row[data-eid="' + r.dataset.eid + '"] .btn').map(txt).join('+')).join(' / ') + ' | your entries ' + !!card().querySelector('.cal-mine-ent'));
  `));
  await p3.setViewportSize({ width: 390, height: 844 }); await p3.waitForTimeout(250);
  out.push('desk 390: no sideways scroll ' + await p3.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1) + ' | buttons under 44 ' + await p3.evaluate(() => [...document.querySelectorAll('.cal-desk .btn')].filter(x => x.getBoundingClientRect().height < 44).length));
  await p3.evaluate(() => document.querySelector('.cal-desk')?.scrollIntoView()); await p3.screenshot({ path: 'test-results/calendar-desk-390.png' });
  await p3.setViewportSize({ width: 1100, height: 900 }); await p3.waitForTimeout(150);
  out.push(...await run3(`
    const labels = () => rowsT().map(r => txt(r.querySelector('.cal-desk-n'))).join(',');
    q('#cal-' + tid + ' [data-act="cal-desk-accept"][data-eid="u4_1"]').click(); await w(300);
    L.push('accept: ' + JSON.parse(localStorage.getItem('carreau-local-v1')).ce[tid].entries.u4_1.status + ' | ' + labels() + ' | ' + txt(card().querySelector('.cal-desk-sum')));
    q('#cal-' + tid + ' [data-act="cal-desk-csv"]').click(); await w(200);
    const f = window.__csv, lines = (f?.data || '').replace(/^\\uFEFF/, '').split('\\n');
    L.push('csv: ' + (f?.filename || '') + ' | bom ' + (f?.data || '').startsWith('\\uFEFF') + ' | ' + lines[0] + ' | rows ' + (lines.length - 1));
    L.push('csv rows: ' + lines.slice(1).join(' / ').replace(/\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}/g, '<sent>'));
    L.push('csv guard: ' + C.csvText([['=1+2', '@x', '+44 7700 900123', '+1-2', '-3', 'ok', 'a"b']], true).slice(1) + ' | export unguarded ' + C.csvText([['=1']]).slice(1));
    q('#cal-' + tid + ' [data-act="cal-desk-remove"][data-eid="u2_1"]').click(); await w(100);
    L.push('remove confirm: ' + txt(q('#cal-' + tid + ' .cal-desk-row[data-eid="u2_1"] .err')) + ' | ' + qa('#cal-' + tid + ' .cal-desk-row[data-eid="u2_1"] .btn').map(txt).join(','));
    q('#cal-' + tid + ' [data-act="cal-desk-remove-yes"]').click(); await w(300);
    const ce = JSON.parse(localStorage.getItem('carreau-local-v1')).ce[tid];
    L.push('removed: entry ' + !!ce.entries.u2_1 + ' | team ' + !!ce.teams.u2_1 + ' | contact ' + !!ce.contacts.u2_1 + ' | ' + labels());
    // put the removed one back (for Registration), last in the queue
    await S.store.addCalEntry(tid, 'u2_1', { uid: 'u2', status: 'in' }, { name: '', players: ['Cat Ray', 'Dan Oak'], club: '' }, 'cat@example.com'); await w(100);
    // Registration
    await go(tid); await w(200); q('[data-tab="entries"]').click(); await w(400);
    const panel = () => q('.cal-reg'), regRows = () => qa('.cal-reg .cal-reg-row'), teams = () => C.T().teams;
    const next = q('.cal-reg')?.nextElementSibling;
    L.push('registration: ' + txt(panel()?.querySelector('h3')) + ' ' + regRows().length + ' | above the list ' + /Teams/.test(txt(next?.querySelector('h3'))) + ' | rows ' + regRows().map(r => txt(r)).join(' / '));
    const n0 = teams().length;
    q('.cal-reg-row[data-eid="u1_1"] [data-act="cal-reg-add"]').click(); await w(300);
    const t1 = teams().find(x => x.calEntry === 'u1_1');
    L.push('add one: teams +' + (teams().length - n0) + ' | ' + JSON.stringify(t1 && { name: t1.name, players: t1.players, club: t1.club, active: t1.active, checkedIn: !!t1.checkedIn, calEntry: t1.calEntry }) + ' | row ' + txt(q('.cal-reg-row[data-eid="u1_1"] .cal-reg-in')));
    const n1 = teams().length; q('[data-act="cal-reg-all"]').click(); await w(300);
    const n2 = teams().length; await C.render(); await w(50);
    const allBtn = !!q('[data-act="cal-reg-all"]');
    q('.cal-reg-row[data-eid="u1_1"] [data-act="cal-reg-add"]')?.click(); await w(200);
    L.push('add everyone with a place: +' + (n2 - n1) + ' | button after ' + allBtn + ' | twice: teams ' + teams().length + ' | ids ' + teams().map(x => x.calEntry || '').join(','));
    L.push('registration contact in tournament: ' + /07700|example\\.com|HYPERLINK/.test(JSON.stringify(C.T())));
    await setT({ checkin: true });
    L.push('not checked in: ' + teams().filter(x => x.calEntry).map(x => !!x.checkedIn).join(','));
    await S.store.withdrawCalEntry(tid, 'u1_1'); await w(300);
    L.push('withdrew online pill: ' + txt(q('[data-row="' + t1.id + '"] .cal-withdrew')) + ' | row kept ' + !!q('[data-row="' + t1.id + '"]') + ' | others ' + qa('.cal-withdrew').length);
    window.__dt1 = t1.id;
  `));
  await p3.evaluate(() => document.querySelector('.cal-reg')?.scrollIntoView()); await p3.screenshot({ path: 'test-results/calendar-registration-desktop.png' });
  await p3.setViewportSize({ width: 390, height: 844 }); await p3.waitForTimeout(250);
  out.push('registration 390: no sideways scroll ' + await p3.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1) + ' | buttons under 44 ' + await p3.evaluate(() => [...document.querySelectorAll('.cal-reg .btn')].filter(x => x.getBoundingClientRect().height < 44).length));
  await p3.evaluate(() => document.querySelector('.cal-reg')?.scrollIntoView()); await p3.screenshot({ path: 'test-results/calendar-registration-390.png' });
  await p3.setViewportSize({ width: 1100, height: 900 }); await p3.waitForTimeout(150);
  out.push(...await run3(`
    // mêlée: an entry becomes a player
    await setT({ entry: 'melee' }); await w(200);
    const p0 = C.T().players.length; q('.cal-reg-row[data-eid="u3_1"] [data-act="cal-reg-add"]')?.click(); await w(300);
    const pl = C.T().players.find(x => x.calEntry === 'u3_1');
    L.push('melee: players +' + (C.T().players.length - p0) + ' | ' + JSON.stringify(pl && { name: pl.name, club: pl.club, calEntry: pl.calEntry }));
    await setT({ entry: 'team' });
    // French
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(200);
    L.push('fr registration: ' + txt(q('.cal-reg h3')) + ' | ' + qa('.cal-reg .btn, .cal-reg .pill').map(txt).join(',') + ' | ' + txt(q('.cal-withdrew')));
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(150);
    // removing the listing takes its entries with it
    q('[data-tab="setup"]').click(); await w(200);
    q('[data-cal-panel] [data-act="cal-remove"]').click(); await w(300);
    L.push('remove listing ask: ' + txt(q('[data-cal-panel] .err')));
    q('[data-cal-panel] [data-act="cal-remove-yes"]').click(); await w(300);
    L.push('remove listing with entries: listing gone ' + ((await S.store.getCal(tid)) === null) + ' | entries left ' + !!JSON.parse(localStorage.getItem('carreau-local-v1')).ce?.[tid] + ' | ' + txt(q('#toast')));
  `));
  // ---- Season Calendar 7 (calendar-share): Add to calendar, Open in Maps, Share ----
  const p4 = await ctx.newPage(); p4.on('pageerror', e => errs.push('share: ' + e.message));
  await p4.setViewportSize({ width: 1100, height: 900 });
  await p4.goto(process.env.APP_URL); await p4.evaluate(() => localStorage.clear()); await p4.reload(); await p4.waitForTimeout(300);
  const run4 = body => p4.evaluate(new Function(`return (async () => { ${pre}
    const go = async h => { document.activeElement?.blur?.(); location.hash = h; await w(250); };
    const card = id => q('#cal-' + id + '.cal-card'), btns = id => qa('#cal-' + id + ' .cal-share .btn').map(txt).join(',');
    const open = async id => { await go('calendar'); await go('calendar.' + id); for (let i = 0; i < 40 && !card(id); i++) await w(100); };
    const mk = (cid, o) => Object.assign({ kind: 'event', id: cid, name: '', date: day(6), checkin: '', start: '', venue: '', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'doubles', formatNote: '',
      who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', statusNote: '', lang: 'en', ownerUid: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false }, o);
    const L = []; try { ${body} } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\\n')[1]); } return L; })();`));
  out.push(...await run4(`
    window.__file = null; S.downloads = { save: async f => { window.__file = f; } };
    window.__copied = null; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async v => { window.__copied = v; } } });
    await S.store.setCal('cShare', mk('cShare', { name: 'Letchworth Spring Open', checkin: '09:15', start: '10:00', venue: 'Letchworth PC', address: 'Norton Common, Letchworth SG6 1AA', region: 'Chiltern',
      howTo: 'Enter by text; pay on the day\\nDoors open at 8:30, bring a packed lunch and your own boules, and please arrive early to check in with the desk', contact: 'Ann, 07700 900222' }));
    await S.store.setCal('cDay', mk('cDay', { name: 'Hitchin Club Day', venue: 'Hitchin PC', region: 'Chiltern' }));
    await S.store.setCal('cNone', mk('cNone', { name: 'Somewhere TBC' }));
    await open('cShare');
    L.push('share buttons: ' + btns('cShare') + ' | under the details ' + !!(card('cShare').querySelector('.cal-how')?.compareDocumentPosition(card('cShare').querySelector('.cal-share')) & Node.DOCUMENT_POSITION_FOLLOWING));
    q('#cal-cShare [data-act="cal-ics"]').click(); await w(200);
    const f = window.__file || {}, ics = f.data || '', lines = ics.split('\\r\\n'), un = ics.replace(/\\r\\n /g, ''), ul = un.split('\\r\\n');
    const pick = k => ul.find(l => l.startsWith(k)) || '';
    L.push('ics: ' + [lines[0], pick('SUMMARY:'), pick('DTSTART'), pick('LOCATION:'), pick('URL:').replace(/^URL:.*(#calendar\\.)/, 'URL:...$1')].join(' | '));
    L.push('ics file: ' + f.filename + ' | crlf ' + (!/[^\\r]\\n/.test(ics) && ics.endsWith('\\r\\n')) + ' | longest ' + Math.max(...lines.map(l => new TextEncoder().encode(l).length)) + ' | folded ' + lines.some(l => l.startsWith(' '))
      + ' | ' + pick('UID:') + ' | stamp ' + /^DTSTAMP:\\d{8}T\\d{6}Z$/.test(pick('DTSTAMP:')) + ' | ' + pick('DTEND') + ' | floating ' + !/^DT(START|END).*Z$/m.test(un) + ' | ends ' + ul[ul.length - 2]);
    L.push('ics description: ' + pick('DESCRIPTION:').replace(/^DESCRIPTION:\\S*(#calendar\\.)/, 'DESCRIPTION:...$1').slice(0, 120));
    const e = await S.store.getCal('cShare');
    L.push('ics start: ' + [C.calIcs(Object.assign({}, e, { checkin: '' })), C.calIcs(Object.assign({}, e, { checkin: '', start: '19:30' }))].map(x => x.split('\\r\\n').filter(l => /^DT(START|END)/.test(l)).join(' ')).join(' / '));
    const allDay = C.calIcs(await S.store.getCal('cDay')).split('\\r\\n');
    L.push('ics all day: ' + allDay.filter(l => /^DT(START|END)/.test(l)).join(' | ') + ' | location ' + allDay.find(l => l.startsWith('LOCATION:')));
    L.push('maps: ' + q('#cal-cShare a.cal-maps')?.getAttribute('href') + ' | new tab ' + q('#cal-cShare a.cal-maps')?.target);
    L.push('share desktop: ' + (q('#cal-cShare [data-act="cal-share"]').click(), await w(150), txt(q('#toast'))) + ' | copied ' + (window.__copied || '').replace(/^.*(#calendar\\.)/, '...$1'));
    window.__shared = null; const mm = window.matchMedia; Object.defineProperty(navigator, 'share', { configurable: true, value: async o => { window.__shared = o; } });
    window.matchMedia = x => /coarse/.test(x) ? { matches: true } : mm.call(window, x);
    q('#cal-cShare [data-act="cal-share"]').click(); await w(150);
    L.push('share phone: ' + (window.__shared?.title || '') + ' | ' + (window.__shared?.url || '').replace(/^.*(#calendar\\.)/, '...$1'));
    window.matchMedia = mm; delete navigator.share;
    await open('cDay'); L.push('venue only: ' + btns('cDay') + ' | ' + q('#cal-cDay a.cal-maps')?.getAttribute('href'));
    await open('cNone'); L.push('no venue or address: ' + btns('cNone'));
    // "Your entries": Add to calendar next to each entry
    await S.store.setCal('cShare', Object.assign(e, { online: true, places: 8, closesAt: Date.now() + 2 * 864e5, approve: false, showEntrants: false }));
    await S.store.addCalEntry('cShare', 'local_1', { uid: 'local', status: 'in' }, { name: 'Les Boulistes', players: ['Ann Lee', 'Bob Fox'], club: '' }, '07700 900222');
    { const P = S.calPage; if (P) P.cache = {}; } await open('cShare'); for (let i = 0; i < 30 && !q('#cal-cShare .cal-ent-row'); i++) await w(100);
    L.push('your entries: ' + qa('#cal-cShare .cal-ent-row .btn').map(txt).join(','));
    window.__file = null; q('#cal-cShare .cal-ent-row [data-act="cal-ics"]')?.click(); await w(200);
    L.push('your entries file: ' + (window.__file?.filename || ''));
    window.__shot = 'cShare';
  `));
  for (const [wd, h, nm] of [[1100, 900, 'desktop'], [390, 844, '390']]) {
    await p4.setViewportSize({ width: wd, height: h }); await p4.waitForTimeout(250);
    out.push(`share ${nm}: no sideways scroll ` + await p4.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1) + ' | buttons under 44 ' + await p4.evaluate(() => [...document.querySelectorAll('#cal-cShare .cal-share .btn, #cal-cShare .cal-ent-row .btn')].filter(x => x.getBoundingClientRect().height < 44).length));
    await p4.evaluate(() => document.querySelector('#cal-cShare .cal-facts')?.scrollIntoView()); await p4.screenshot({ path: `test-results/calendar-share-${nm}.png` });
  }
  await p4.setViewportSize({ width: 1100, height: 900 }); await p4.waitForTimeout(150);
  out.push(...await run4(`
    const e = await S.store.getCal('cShare'); await S.store.setCal('cShare', Object.assign(e, { status: 'cancelled', statusNote: 'Rained off', updatedAt: Date.now() }));
    { const P = S.calPage; if (P) P.cache = {}; } await go('calendar'); await go('calendar.cShare'); for (let i = 0; i < 40 && !q('#cal-cShare .cal-status-note'); i++) await w(100);
    L.push('cancelled: Add to calendar shown ' + !!q('#cal-cShare [data-act="cal-ics"]') + ' | buttons ' + qa('#cal-cShare .cal-share .btn').map(txt).join(','));
    await S.store.setCal('cShare', Object.assign(e, { status: 'on', statusNote: '' }));
    { const P = S.calPage; if (P) P.cache = {}; } await go('calendar'); await go('calendar.cShare'); for (let i = 0; i < 40 && !q('#cal-cShare .cal-share'); i++) await w(100);
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(200);
    L.push('fr share: ' + qa('#cal-cShare .cal-share .btn').map(txt).join(','));
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(150);
  `));
  console.log(out.join('\n'));
  console.log('errs', errs); await b.close();
})();
