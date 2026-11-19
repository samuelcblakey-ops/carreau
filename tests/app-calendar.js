// Season Calendar 1 (calendar-publish): the organiser lists a competition from Setup, the sheet is pre-filled from the
// competition, the saved listing, the "changed since it was listed" notice, Remove, archiving marks the listing gone,
// and no panel for spectators, examples or a competition more than a day past. Screenshots of the sheet at 390 px and desktop.
// Season Calendar 2 (calendar-page): the links in, the page (soonest first, grouped by week then month), filters, search,
// the full listing in place (Follow the draw once drawn), deep links, the organiser's Edit and Remove, the admin's hide
// (stood in for here; the rules are in web-calendar.js), French, and the page and a listing at 390 px.
// Season Calendar 3 (calendar-own-events): an event run elsewhere added from the page (the sheet in event mode at 390 px),
// its full listing (no Live now, no competition links), Edit, "Your listings" (a hidden one marked), Remove, French.
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
    L.push('open listing: How to enter ' + (txt(card?.querySelector('h4')) === 'How to enter') + ' | Follow the draw ' + !!card?.querySelector('a[href="#' + tid + '"].primary') + ' before draw | view ' + txt(card?.querySelector('a.btn')));
    L.push('listing: ' + txt(card.querySelector('.hof-where')) + ' | ' + qa('#cal-' + tid + ' dt').map(d => d.textContent + '=' + txt(d.nextElementSibling)).join(' ; '));
    L.push('listing buttons: ' + qa('#cal-' + tid + ' .row .btn').map(txt).join(',') + ' | close focused ' + (document.activeElement?.dataset?.act === 'cal-close-entry') + ' | other rows ' + qa('#cal-results .cal-row').length);
    q('#cal-' + tid + ' [data-act="cal-close-entry"]').click(); await w(150);
    L.push('closed: ' + !!q('#cal-' + tid + '.cal-row') + ' | focus back ' + (document.activeElement?.id === 'cal-' + tid));
    // a listing whose competition isn't on this device: no organiser buttons, no link (there's no competition to read)
    q('#cal-c2').click(); await w(200); L.push('stranger listing: buttons ' + qa('#cal-c2 .row .btn').map(txt).join(','));
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
    L.push('event card: format ' + txt(fmtDd) + ' | buttons ' + qa('#cal-' + id + ' .row .btn').map(txt).join(',') + ' | live now ' + !!card.querySelector('.cal-live') + ' | competition links ' + !!card.querySelector('a.btn'));
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
    L.push('mine opens hidden: ' + location.hash + ' | card ' + !!q('#cal-cHid.cal-card') + ' | mark ' + txt(q('#cal-cHid .cal-hidden-mark')) + ' | buttons ' + qa('#cal-cHid .row .btn').map(txt).join(','));
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
  console.log(out.join('\n'));
  console.log('errs', errs); await b.close();
})();
