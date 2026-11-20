// Your own flyer (poster-flyer) against the Firestore rules: the organiser adds a flyer from the poster sheet (shrunk on the
// device, saved in calendar/{cid}/media/flyer), a stranger sees it on the full listing (not while the listing is hidden),
// the rules (only the listing's organisers and the admin write it; a JPEG or WebP data URL under 700,000 characters; only
// while the listing exists), the admin's Remove the flyer, and removing the listing deletes its flyer.
// The QR stamp is drawn with the site's generator here. Screenshots: the listing with its flyer at 390 px and on desktop,
// the stamped download in the bottom-right corner, and the sheet's "Your own flyer" section at 390 px.
const { chromium } = require('playwright'), fs = require('fs');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (n, width = 1100) => { const c = await b.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, locale: 'en-GB', acceptDownloads: true }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const raw = (p, op, path, data) => p.evaluate(async ([op, path, data]) => { try { const r = await window.__testRaw[op](path, data); return op === 'get' ? (r ? 'read' : 'none') : 'ok'; } catch (e) { return 'denied ' + (e.code || e.message); } }, [op, path, data]);
  const ok = async (...a) => { const r = await raw(...a); return r === 'ok' || r === 'read'; };
  const txt = (p, s) => p.evaluate(s => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim(), s);
  const waitFor = async (p, fn, arg, ms = 15000) => { try { await p.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const W = process.env.WEB_URL, OUT = process.env.OUT || 'test-results';
  const REST = 'http://127.0.0.1:8080/v1/projects/demo-carreau/databases/(default)/documents', H = { Authorization: 'Bearer owner' };
  const has = async path => (await fetch(`${REST}/${path}`, { headers: H })).status === 200;
  const AD = await mk('admin'); await AD.goto(W + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);

  // the organiser's competition and its listing
  const O = await mk('organiser'); await O.goto(W); await w(3500);
  await O.click('[data-act="new-t"]'); await w(2500); const tid = await O.evaluate(() => location.hash.slice(1));
  if (await O.$('[data-act="wiz-skip"]')) { await O.click('[data-act="wiz-skip"]'); await w(800); }
  await O.evaluate(async () => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Flyer Doubles', format: 'doubles', system: 'swiss' }); await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); }); await w(1200);
  const oUid = await O.evaluate(() => window.__testUid());
  const L = { kind: 'comp', tid, name: 'Flyer Doubles', date: day(9), checkin: '09:30', start: '10:00', venue: 'Stotfold PC', address: 'Hitchin Road, Stotfold', country: 'GB-ENG', region: '', level: 'open', fmt: 'doubles', system: 'swiss',
    who: ['open'], fee: '£8 per team', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', byUid: oUid, byCode: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false, gone: false };
  log('flyer listing:', await raw(O, 'set', 'calendar/' + tid, L));
  const card = '#cal-' + tid, flyerPath = `calendar/${tid}/media/flyer`;
  const openCard = async (p, id = tid) => { await p.goto(W + '#calendar.' + id); await p.reload(); await waitFor(p, s => !!document.querySelector(s + '.cal-card'), '#cal-' + id); await w(1200); };

  // the organiser adds a flyer from the poster sheet: a busy picture, bigger than the 1600 px it's shrunk to
  await openCard(O); await O.click(card + ' [data-act="poster-open"]'); await waitFor(O, () => !!document.querySelector('#modal [data-act="poster-flyer"]:not([disabled])'));
  await O.evaluate(async () => { const c = document.createElement('canvas'); c.width = 2400; c.height = 3394; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, '#0f4c81'); g.addColorStop(1, '#a3203f'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 400; i++) { x.fillStyle = `hsla(${i * 47 % 360},65%,${35 + i % 5 * 9}%,.5)`; x.beginPath(); x.arc((i * 733) % c.width, (i * 1291) % c.height, 15 + (i * 17) % 120, 0, 7); x.fill(); }
    x.fillStyle = '#ffd34d'; x.font = 'bold 260px sans-serif'; x.fillText('FLYER', 200, 700); x.font = '90px sans-serif'; for (let i = 0; i < 16; i++) x.fillText('Doubles · Stotfold · £8 per team ' + i, 120, 1000 + i * 140);
    const f = await new Promise(r => c.toBlob(bl => r(new File([bl], 'flyer.png', { type: 'image/png' })), 'image/png'));
    const inp = document.querySelector('#modal [data-poster="flyer"]'), dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('input', { bubbles: true })); });
  await waitFor(O, () => /Flyer added|couldn't|didn't|Only/.test(document.querySelector('#toast')?.textContent || ''), null, 30000);
  const addToast = await txt(O, '#toast'); await w(800);
  const saved = await O.evaluate(p => window.__testRaw.get(p), flyerPath);
  // a stranger opens the full listing (one read of the flyer) and sees it
  const B = await mk('stranger'); await openCard(B); await waitFor(B, s => !!document.querySelector(s + ' .cal-flyer img'), card);
  const shown = await B.evaluate(s => { const i = document.querySelector(s + ' .cal-flyer img'); return !!i && i.alt === 'Flyer for Flyer Doubles' && i.src.startsWith('data:image/'); }, card);
  log(`flyer: organiser adds ${addToast === 'Flyer added. It shows on your listing.' && !!saved} | shown on listing ${shown} | under 700000 ${!!saved && saved.flyer.length < 700000}`);
  log(`flyer saved: ${(saved?.flyer || '').slice(0, 15)} | ${saved?.w}x${saved?.h} | keys ${Object.keys(saved || {}).sort().join(',')}`);

  // the stamped download, with the site's QR code, in the bottom-right corner
  await O.screenshot({ path: OUT + '/flyer-sheet-desktop.png' });
  const [dl] = await Promise.all([O.waitForEvent('download', { timeout: 15000 }), O.click('#modal [data-act="poster-flyer-download"]')]);
  fs.copyFileSync(await dl.path(), OUT + '/flyer-web-stamp-br.jpg');
  const stamp = await O.evaluate(async () => { const S = window.__carreau.S, i = S.modal.flyerInfo, m = await S.qrMatrix(i.link); return { qr: i.qr, label: i.label, corner: i.corner, pct: i.box.w / i.w, link: i.link, n: m.n }; });
  log(`flyer web stamp: ${dl.suggestedFilename()} | qr ${stamp.qr} | corner ${stamp.corner} | box ${Math.round(stamp.pct * 100)}% | link ends #calendar.<id> ${stamp.link.endsWith('#calendar.' + tid)} | label ${stamp.label}`);
  await O.setViewportSize({ width: 390, height: 844 }); await w(300);
  await O.evaluate(() => document.querySelector('#modal .poster-flyer')?.scrollIntoView({ block: 'start' })); await w(200);
  log('flyer sheet 390: no sideways scroll', await O.evaluate(() => { const s = document.querySelector('#modal .poster-sheet'); return s.scrollWidth <= s.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1; }),
    '| controls under 44', await O.evaluate(() => [...document.querySelectorAll('#modal .poster-flyer button')].filter(x => x.getBoundingClientRect().height < 44).length));
  await O.screenshot({ path: OUT + '/flyer-sheet-390.png' });
  await O.click('#modal [data-act="close"]'); await O.setViewportSize({ width: 1100, height: 900 }); await w(200);

  // the listing with its flyer at 390 px and on desktop
  const P = await mk('phone', 390); await openCard(P); await waitFor(P, s => document.querySelector(s + ' .cal-flyer img')?.complete, card);
  await P.evaluate(s => { document.querySelector(s + ' .cal-flyer')?.scrollIntoView({ block: 'start' }); scrollBy(0, -70); }, card); await w(300);
  log('phone 390: listing with flyer no sideways scroll', await P.evaluate(s => !!document.querySelector(s + ' .cal-flyer') && document.documentElement.scrollWidth <= innerWidth + 1, card));
  await P.screenshot({ path: OUT + '/flyer-web-listing-390.png' });
  await B.evaluate(s => { document.querySelector(s + ' .cal-flyer')?.scrollIntoView({ block: 'start' }); scrollBy(0, -70); }, card); await w(300);
  log('desktop: flyer width', await B.evaluate(s => Math.round(document.querySelector(s + ' .cal-flyer').getBoundingClientRect().width), card));
  await B.screenshot({ path: OUT + '/flyer-web-listing-desktop.png' });

  // the rules
  const f = n => ({ flyer: 'data:image/jpeg;base64,' + 'A'.repeat(n), w: 400, h: 566, at: Date.now() });
  const strangerAdds = await ok(B, 'set', flyerPath, f(100));
  const readShown = await ok(B, 'get', flyerPath);
  await raw(AD, 'update', 'calendar/' + tid, { hidden: true, hiddenAt: Date.now() });
  const readHidden = await ok(B, 'get', flyerPath), orgHidden = await ok(O, 'get', flyerPath);
  await raw(AD, 'update', 'calendar/' + tid, { hidden: false });
  const png = await ok(O, 'set', flyerPath, { ...f(100), flyer: 'data:image/png;base64,' + 'A'.repeat(100) });
  const big = await ok(O, 'set', flyerPath, f(800000));
  const noListing = await ok(AD, 'set', `calendar/nolisting${Date.now()}/media/flyer`, f(100));
  log(`flyer rules: stranger adds ${strangerAdds} | stranger reads (listing shown) ${readShown} | stranger reads (listing hidden) ${readHidden} | png data refused ${png} | 800000 chars refused ${big} | without listing ${noListing}`);
  const t0 = Date.now(), nearLimit = await ok(O, 'set', flyerPath, f(699000)), ms = Date.now() - t0;
  log(`flyer rules more: organiser reads hidden ${orgHidden} | 699000 chars allowed ${nearLimit} | other name ${await ok(O, 'set', `calendar/${tid}/media/other`, f(100))} | extra field ${await ok(O, 'set', flyerPath, { ...f(100), by: 'x' })} | w 2001 ${await ok(O, 'set', flyerPath, { ...f(100), w: 2001 })} | list ${await B.evaluate(async p => { try { await window.__testRaw.list(p); return true; } catch { return false; } }, `calendar/${tid}/media`)}`);
  if (ms > 8000) log('flyer rules: near-limit write took', ms, 'ms');

  // the admin's strip on the full listing: Remove the flyer, no question asked; the stranger can't remove it, the organiser can
  await ok(O, 'set', flyerPath, saved);
  const strangerRemoves = await ok(B, 'del', flyerPath);
  await openCard(AD); await waitFor(AD, s => !!document.querySelector(s + ' [data-act="cal-flyer-admin-remove"]'), card);
  const strip = await txt(AD, card + ' .cal-admin');
  await AD.click(card + ' [data-act="cal-flyer-admin-remove"]'); await waitFor(AD, () => /Flyer removed/.test(document.querySelector('#toast')?.textContent || '')); await w(500);
  const adminRemoves = !(await has(flyerPath)) && !(await AD.$(card + ' .cal-flyer'));
  await ok(O, 'set', flyerPath, saved);
  const orgRemoves = await ok(O, 'del', flyerPath) && !(await has(flyerPath));
  log(`flyer admin: removes ${adminRemoves} | organiser removes ${orgRemoves} | stranger removes ${strangerRemoves}`);
  log('flyer admin strip:', strip);

  // removing the listing (from the full listing) deletes its flyer first
  await ok(O, 'set', flyerPath, saved);
  await openCard(O); await O.click(card + ' [data-act="cal-page-remove"]'); await waitFor(O, s => !!document.querySelector(s + ' [data-act="cal-page-remove-yes"]'), card);
  await O.click(card + ' [data-act="cal-page-remove-yes"]'); await waitFor(O, () => /Taken off/.test(document.querySelector('#toast')?.textContent || '')); await w(800);
  log(`flyer with listing: removing the listing deletes flyer ${!(await has(flyerPath)) && !(await has('calendar/' + tid))}`);

  // tidy up (also when something above failed part-way)
  for (const p of [flyerPath, `calendar/${tid}/media/other`, 'calendar/' + tid]) await fetch(`${REST}/${p}`, { method: 'DELETE', headers: H });
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
