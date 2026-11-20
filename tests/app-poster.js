// Poster maker (poster-maker): the "Make a poster" button (the listing's organisers only, not on hidden listings), the
// sheet's sizes, layouts, colours (Match the logo), ticks and words, the design remembered on this device, Download (a PNG
// Blob), Print (A4 and A5 only), French words on the poster, and the sheet at 390 px. The QR code needs the website's
// generator, so it's checked in web-poster.js; here (the app on its own) the link is printed in its place.
// Screenshots: each layout at square and A4, a Story, and the sheet at 390 px and on desktop.
// Background picture (poster-background): a picture chosen on the device (Photo layout, Bold's top block, Band ignores
// it), Position, Darken, the ChatGPT prompt, the picture kept in IndexedDB only (nothing to S.store), kept over a
// reload, removed, and old listings' pictures cleaned up. Screenshots: Photo at square and Story, Bold with a picture,
// the ChatGPT fold open at 390 px.
const { chromium } = require('playwright'), fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const pre = `const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\\s+/g, ' ').trim();
    const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const setT = async patch => { const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, patch); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(150); C.render(); await w(60); };
    const go = async h => { document.activeElement?.blur?.(); location.hash = h; await w(250); };
    const card = id => q('#cal-' + id + '.cal-card');
    const open = async id => { await go('calendar'); await go('calendar.' + id); for (let i = 0; i < 40 && !card(id); i++) await w(100); };
    // a draw is due 150 ms after a change; wait for the newest one to finish
    const drawn = async () => { await w(260); for (let i = 0; i < 80 && !(S.modal?.poster && S.modal.drawn && S.modal.drawn === S.modal.seq); i++) await w(100); };
    const tap = async sel => { const el = q(sel); if (!el) throw new Error('missing ' + sel); el.click(); await drawn(); };
    // a copy of the poster for the screenshots, at most 1000 px tall
    const snap = name => { const cv = q('#modal canvas'), k = Math.min(1, 1000 / cv.height), c = document.createElement('canvas'); c.width = Math.round(cv.width * k); c.height = Math.round(cv.height * k);
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, c.width, c.height); (window.__snaps = window.__snaps || []).push([name, c.toDataURL('image/png')]); };
    const mk = (cid, o) => Object.assign({ kind: 'event', id: cid, name: '', date: day(6), checkin: '', start: '', venue: '', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'doubles', formatNote: '',
      who: ['open'], fee: '', prizes: '', howTo: '', contact: '', note: '', status: 'on', statusNote: '', lang: 'en', ownerUid: '', createdAt: Date.now(), updatedAt: Date.now(), hidden: false }, o);`;
  const run = body => p.evaluate(new Function(`return (async () => { ${pre} const L = []; try { ${body} } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\\n')[1]); } return L; })();`));
  const out = [];
  out.push(...await run(`
    q('[data-act="new-t"]').click(); await w(150);
    await setT({ name: 'Spring Triples', venue: 'Hitchin Town Cricket Club', date: day(10), wizard: false, system: 'swiss', format: 'triples', accent: '#1f5fbf' });
    const tid = C.T().id; window.__tid = tid;
    // a club logo: a red boule on white, with a black ring (Match the logo should pick the red)
    const lc = document.createElement('canvas'); lc.width = lc.height = 120; const lx = lc.getContext('2d');
    lx.fillStyle = '#ffffff'; lx.fillRect(0, 0, 120, 120); lx.fillStyle = '#c0392b'; lx.beginPath(); lx.arc(60, 60, 44, 0, 7); lx.fill(); lx.strokeStyle = '#000'; lx.lineWidth = 6; lx.stroke();
    const logo = { logo: lc.toDataURL('image/png'), at: Date.now() }; await S.store.setBrand(tid, logo); S.brand = S.brand || {}; S.brand[tid] = logo;
    await S.store.setCal(tid, Object.assign(mk(tid, { name: 'Spring Triples', date: day(10), checkin: '09:00', start: '10:00', venue: 'Hitchin Town Cricket Club', address: 'Lucas Lane, Hitchin SG5 2JB',
      who: ['open', 'veterans'], fee: '£5 per player', prizes: 'Prize fund £300', howTo: 'Enter at the club bar or call Jane', contact: 'Jane, 07700 900123', fmt: 'triples', system: 'swiss' }), { kind: 'comp', tid, id: undefined }));
    await S.store.setCal('cHid', mk('cHid', { name: 'Hidden Doubles', hidden: true, hiddenAt: Date.now() }));
    await S.store.setCal('cNew', mk('cNew', { name: 'Autumn Doubles', venue: 'Letchworth PC', fee: '£4' }));
    q('[data-tab="setup"]').click(); await w(300);
    const setup = !!q('[data-cal-panel] [data-act="poster-open"]');
    await open(tid); const listing = !!q('#cal-' + tid + ' [data-act="poster-open"]');
    S.canWrite = false; C.render(); await w(150); const player = !!q('#cal-' + tid + ' [data-act="poster-open"]'); S.canWrite = true; C.render(); await w(100);
    await open('cHid'); const hid = !!card('cHid') && !!q('#cal-cHid [data-act="poster-open"]');
    L.push('poster button: listing ' + listing + ' | setup panel ' + setup + ' | player ' + player + ' | hidden listing ' + hid + ' | hidden card shown ' + !!card('cHid'));
    await open(tid); q('#cal-' + tid + ' [data-act="poster-open"]').click(); await drawn();
    L.push('poster sheet: ' + txt(q('#modal h3')) + ' | sizes ' + qa('#modal [data-act="poster-size"]').map(txt).join(',') + ' | layouts ' + qa('#modal [data-act="poster-layout"]').map(txt).join(',')
      + ' | ticks ' + qa('#modal [data-poster="show"]').filter(x => x.checked).map(x => x.dataset.k).join(',') + ' | off ' + qa('#modal [data-poster="show"]').filter(x => !x.checked).map(x => x.dataset.k).join(','));
    const sizes = [];
    for (const k of ['square', 'story', 'a4', 'a5']) { await tap('#modal [data-act="poster-size"][data-k="' + k + '"]'); sizes.push(k + ' ' + q('#modal canvas').width + 'x' + q('#modal canvas').height); }
    L.push('poster sizes: ' + sizes.join(' | '));
    await tap('#modal [data-act="poster-size"][data-k="square"]');
    const md = S.modal, month = new Date(day(10) + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }), words = () => txt(q('#modal [data-poster-words]'));
    const dateShown = md.info.items.includes('date') && words().includes(month);
    const hadPrizes = words().includes('Prize fund £300');
    await tap('#modal [data-poster="show"][data-k="prizes"]');
    L.push('poster words: headline ' + q('#modal [data-poster="headline"]').value + ' | date shown ' + dateShown + ' | prizes hidden after untick ' + (hadPrizes && !S.modal.info.items.includes('prizes') && !words().includes('Prize fund £300')));
    L.push('poster words seen: ' + words());
    const main0 = S.modal.main, ink = S.modal.info.onMain === '#ffffff' ? 'white' : S.modal.info.onMain;
    await tap('#modal [data-act="poster-match"]'); await w(200); await drawn();
    L.push('poster colours: main ' + main0 + ' | text on main ' + ink + ' | match the logo changes main ' + (S.modal.main !== main0) + ' | to ' + S.modal.main);
    await tap('#modal [data-act="poster-main"][data-k="#1f5fbf"]');
    // a headline typed in, and a strapline
    const hb = q('#modal [data-poster="headline"]'); hb.focus(); hb.value = 'Spring Triples'; hb.dispatchEvent(new Event('input', { bubbles: true }));
    const sb = q('#modal [data-poster="strap"]'); sb.value = 'Open triples · £300 prize fund'; sb.dispatchEvent(new Event('input', { bubbles: true })); await drawn();
    await tap('#modal [data-poster="show"][data-k="prizes"]');
    const lay = [];
    for (const k of ['bold', 'band', 'classic']) {
      await tap('#modal [data-act="poster-layout"][data-k="' + k + '"]');
      for (const sz of ['square', 'a4']) { await tap('#modal [data-act="poster-size"][data-k="' + sz + '"]'); snap('poster-' + k + '-' + sz); }
      lay.push(k + ' ' + (S.modal.info.layout === k && q('#modal [data-act="poster-layout"][data-k="' + k + '"]').getAttribute('aria-pressed') === 'true'));
    }
    L.push('poster layouts: ' + lay.join(' | '));
    await tap('#modal [data-act="poster-size"][data-k="story"]'); await tap('#modal [data-act="poster-layout"][data-k="bold"]'); snap('poster-bold-story');
    await tap('#modal [data-act="poster-layout"][data-k="band"]'); snap('poster-band-story');
    await tap('#modal [data-act="poster-size"][data-k="square"]');
    L.push('poster link printed (no QR generator): ' + (S.modal.info.qr === false && S.modal.info.link.endsWith('#calendar.' + tid)) + ' | label ' + S.modal.info.label);
    // remembered on this device: this listing's design, and the last design for a listing with none
    q('#modal [data-act="close"]').click(); await w(150);
    const saved = JSON.parse(localStorage.getItem('carreau-poster:' + tid) || '{}');
    q('#cal-' + tid + ' [data-act="poster-open"]').click(); await drawn();
    const again = S.modal.layout === 'band' && q('#modal [data-poster="strap"]').value === 'Open triples · £300 prize fund';
    q('#modal [data-act="close"]').click(); await w(150);
    await open('cNew'); q('#cal-cNew [data-act="poster-open"]').click(); await drawn();
    L.push('poster remembered: layout band after reopen ' + again + ' | new listing starts band ' + (S.modal.layout === 'band') + ' | new listing headline ' + q('#modal [data-poster="headline"]').value
      + ' | stored ' + Object.keys(saved).sort().join(','));
    L.push('poster ticks offered for a short listing: ' + qa('#modal [data-poster="show"]').map(x => x.dataset.k).join(',') + ' | logo tick ' + !!q('#modal [data-poster="logo"]'));
    q('#modal [data-act="close"]').click(); await w(150);
    // Download: a PNG Blob, named after the headline
    window.__file = null; S.downloads = { save: async f => { window.__file = f; } };
    await open(tid); q('#cal-' + tid + ' [data-act="poster-open"]').click(); await drawn();
    q('#modal [data-act="poster-download"]').click(); for (let i = 0; i < 60 && !window.__file; i++) await w(100);
    const f = window.__file || {}, head = f.data instanceof Blob ? new Uint8Array(await f.data.slice(0, 4).arrayBuffer()) : [];
    L.push('poster download: png ' + (f.data instanceof Blob && f.data.type === 'image/png' && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) + ' | name ' + f.filename);
    // Print: A4 on one A4 page; no Print button for a square post
    await tap('#modal [data-act="poster-size"][data-k="a4"]');
    window.__printed = null; window.print = () => { window.__printed = { css: q('#poster-print-css')?.textContent || '', img: q('#poster-print img') }; };
    q('#modal [data-act="poster-print"]').click(); for (let i = 0; i < 60 && !window.__printed; i++) await w(100);
    const pr = window.__printed || {}; window.dispatchEvent(new Event('afterprint')); await w(50);
    await tap('#modal [data-act="poster-size"][data-k="square"]');
    L.push('poster print: a4 page ' + (pr.css.includes('@page{size:A4 portrait;margin:0}') && !!pr.img && pr.img.naturalWidth === 2480) + ' | square print button ' + !!q('#modal [data-act="poster-print"]'));
    L.push('poster print cleared: ' + (!q('#poster-print') && !q('#poster-print-css')));
    // nothing went to the store: the listing is as it was
    L.push('poster store: listing unchanged ' + ((await S.store.getCal(tid)).prizes === 'Prize fund £300') + ' | carreau-poster keys ' + Object.keys(localStorage).filter(k => k.startsWith('carreau-poster')).sort().join(','));
  `));
  // the background picture
  out.push(...await run(`
    // anything written to the store (Firestore on the website, the local store here) is counted
    window.__writes = 0;
    for (const k of Object.keys(S.store)) if (typeof S.store[k] === 'function' && /^(set|save|add|put|del|remove|update|write|archive|clear)/i.test(k)) { const f = S.store[k]; S.store[k] = function (...a) { window.__writes++; return f.apply(this, a); }; }
    // a test picture: a terrain at sunset, landscape, so it's cropped on every size
    const file = await new Promise(res => { const c = document.createElement('canvas'); c.width = 1600; c.height = 1100; const x = c.getContext('2d');
      const sky = x.createLinearGradient(0, 0, 0, 660); sky.addColorStop(0, '#24406e'); sky.addColorStop(.6, '#d9805a'); sky.addColorStop(1, '#f6c37b'); x.fillStyle = sky; x.fillRect(0, 0, 1600, 660);
      const sun = x.createRadialGradient(1120, 560, 10, 1120, 560, 260); sun.addColorStop(0, 'rgba(255,240,190,1)'); sun.addColorStop(.3, 'rgba(255,214,140,.8)'); sun.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = sun; x.fillRect(800, 250, 640, 640);
      x.fillStyle = '#2c3424'; for (let i = 0; i < 9; i++) { const tx = 60 + i * 190 + (i % 2) * 40, th = 230 + (i % 3) * 50; x.fillRect(tx + 50, 650 - th * .45, 16, th * .45); x.beginPath(); x.ellipse(tx + 58, 650 - th * .55, 120, th * .32, 0, 0, 7); x.fill(); }
      const g = x.createLinearGradient(0, 640, 0, 1100); g.addColorStop(0, '#c99f74'); g.addColorStop(1, '#7d5c3e'); x.fillStyle = g; x.fillRect(0, 640, 1600, 460);
      for (let i = 0; i < 9000; i++) { x.fillStyle = 'rgba(' + (i % 2 ? '255,240,220' : '60,40,25') + ',' + (.12 + (i % 5) * .04) + ')'; const yy = 645 + Math.random() * 455; x.fillRect(Math.random() * 1600, yy, 2 + (yy - 640) / 140, 2 + (yy - 640) / 160); }
      const ball = (bx, by, r, c0, c1) => { x.fillStyle = 'rgba(40,25,10,.35)'; x.beginPath(); x.ellipse(bx + r * .3, by + r * .9, r * 1.05, r * .25, 0, 0, 7); x.fill(); const b = x.createRadialGradient(bx - r * .35, by - r * .4, r * .08, bx, by, r); b.addColorStop(0, c0); b.addColorStop(1, c1); x.fillStyle = b; x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill(); };
      ball(560, 900, 62, '#f4f6f7', '#4a5157'); ball(720, 860, 58, '#eef1f3', '#565e65'); ball(880, 950, 66, '#f4f6f7', '#41484e'); ball(690, 960, 18, '#ffd88a', '#b7791f');
      c.toBlob(b => res(new File([b], 'terrain.jpg', { type: 'image/jpeg' })), 'image/jpeg', .9); });
    const choose = async (f, done) => { const inp = q('#modal [data-poster="pic"]'), dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('input', { bubbles: true }));
      for (let i = 0; i < 60 && !done(); i++) await w(100); await drawn(); };
    if (!S.modal?.poster) { await open(window.__tid); q('#cal-' + window.__tid + ' [data-act="poster-open"]').click(); await drawn(); }
    await tap('#modal [data-act="poster-size"][data-k="square"]'); await tap('#modal [data-act="poster-layout"][data-k="bold"]');
    L.push('poster picture section: ' + txt(q('#modal .poster-pic .eyebrow')) + ' | ' + txt(q('#modal .poster-pic p')) + ' | layouts ' + qa('#modal [data-act="poster-layout"]').map(txt).join(',') + ' | remove shown ' + !!q('#modal [data-act="poster-pic-remove"]') + ' | fold open ' + q('#modal .poster-fold').open);
    await choose(file, () => S.modal.pic);
    const photo = S.modal.layout === 'photo' && S.modal.info.layout === 'photo' && S.modal.info.pic && !!q('#modal [data-act="poster-pic-remove"]') && q('#modal [data-act="poster-layout"][data-k="photo"]').getAttribute('aria-pressed') === 'true';
    snap('poster-photo-square');
    await tap('#modal [data-act="poster-size"][data-k="story"]'); snap('poster-photo-story');
    await tap('#modal [data-act="poster-size"][data-k="a4"]'); snap('poster-photo-a4');
    await tap('#modal [data-act="poster-size"][data-k="square"]');
    await tap('#modal [data-act="poster-layout"][data-k="bold"]'); const bold = S.modal.info.layout === 'bold' && S.modal.info.pic; snap('poster-bold-picture');
    await tap('#modal [data-act="poster-size"][data-k="story"]'); snap('poster-bold-picture-story'); await tap('#modal [data-act="poster-size"][data-k="square"]');
    await tap('#modal [data-act="poster-layout"][data-k="band"]'); const band = S.modal.info.layout === 'band' && S.modal.info.pic === false;
    L.push('poster picture: photo layout ' + photo + ' | bold uses picture ' + bold + ' | band ignores picture ' + band);
    await tap('#modal [data-act="poster-layout"][data-k="photo"]');
    // Position: which part of the picture shows
    const pos0 = S.modal.pos; await tap('#modal [data-act="poster-pos"][data-k="top"]'); const top = S.modal.info.pos === 'top';
    await tap('#modal [data-act="poster-pos"][data-k="center"]');
    L.push('poster position: ' + pos0 + ' default | chips ' + qa('#modal [data-act="poster-pos"]').map(txt).join(',') + ' | top drawn ' + top);
    // Darken: 40% to start; 0 and 80 both draw, and 80 is darker
    const slider = q('#modal [data-poster="dark"]'), def = S.modal.dark + ' ' + slider.value;
    const lum = () => { const c = q('#modal canvas'), d = c.getContext('2d').getImageData(c.width * .3, c.height * .45, c.width * .4, c.height * .1).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / d.length; };
    const setDark = async v => { const r = q('#modal [data-poster="dark"]'); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); await drawn(); };
    await setDark(0); const l0 = lum(), d0 = S.modal.info.dark === 0 && txt(q('#modal [data-poster-dark]')) === '0%';
    await setDark(80); const l80 = lum(), d80 = S.modal.info.dark === 80;
    await setDark(40);
    L.push('poster darken: ' + def.split(' ')[0] + ' default | 0 and 80 draw ' + (d0 && d80 && l80 < l0 * .6) + ' | slider ' + def.split(' ')[1]);
    // the ChatGPT prompt (always English)
    q('#modal .poster-fold > summary').click(); await w(80);
    L.push('poster fold: open ' + q('#modal .poster-fold').open + ' | styles ' + qa('#modal [data-act="poster-style"]').map(txt).join(',') + ' | open chatgpt ' + q('#modal .poster-fold a.btn').href + ' ' + q('#modal .poster-fold a.btn').target
      + ' | steps ' + qa('#modal .poster-steps li').length);
    const toastNow = () => txt(q('#toast'));
    const copy = async () => { S.modal.copied = ''; q('#toast').hidden = true; q('#modal [data-act="poster-prompt"]').click(); for (let i = 0; i < 40 && !(S.modal.copied && !q('#toast').hidden); i++) await w(50); return S.modal.copied; };
    let pr = await copy(); const copied = toastNow();
    L.push('poster prompt: square (1:1) ' + pr.includes('Shape: square (1:1).') + ' | no words rule ' + pr.includes('Do not include any words, letters, numbers, logos, watermarks or QR codes.')
      + ' | royal blue (#1f5fbf) ' + pr.includes('Use royal blue (#1f5fbf) and gold (#d4a72c) as the main colours.') + ' | sunny terrain style ' + pr.includes('Style: a sunny gravel pétanque terrain under plane trees')
      + ' | calm ' + (pr.match(/Keep the (.+?) calm/) || [])[1]);
    L.push('prompt copied: ' + copied);
    L.push('poster prompt seen: ' + pr);
    await tap('#modal [data-act="poster-size"][data-k="story"]'); await tap('#modal [data-act="poster-style"][data-k="evening"]');
    pr = await copy();
    L.push('poster prompt story: tall portrait (9:16) ' + pr.includes('Shape: tall portrait (9:16).') + ' | evening style ' + pr.includes('under floodlights') + ' | fold still open ' + q('#modal .poster-fold').open);
    await tap('#modal [data-act="poster-layout"][data-k="bold"]'); pr = await copy(); const boldCalm = (pr.match(/Keep the (.+?) calm/) || [])[1];
    await tap('#modal [data-act="poster-size"][data-k="a5"]'); pr = await copy();
    L.push('poster prompt bold a5: ' + boldCalm + ' | ' + pr.split('Shape: ')[1].split('. Style')[0]);
    await tap('#modal [data-act="poster-layout"][data-k="photo"]'); await tap('#modal [data-act="poster-size"][data-k="story"]');
    // a file that isn't a picture
    const before = S.modal.pic; q('#toast').hidden = true;
    await choose(new File(['not a picture'], 'notes.jpg', { type: 'image/jpeg' }), () => !q('#toast').hidden);
    L.push('poster picture unreadable: ' + toastNow() + ' | picture kept ' + (S.modal.pic === before));
    await S.modal.picSaved;
    window.__picWrites = window.__writes;
  `));
  const snaps = await p.evaluate(() => window.__snaps || []);
  for (const [name, url] of snaps) fs.writeFileSync(`test-results/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  await p.screenshot({ path: 'test-results/poster-sheet-desktop.png' });
  // the sheet at phone width
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
  out.push('phone 390: poster sheet no sideways scroll ' + await p.evaluate(() => { const m = document.querySelector('#modal .poster-sheet'); return document.documentElement.scrollWidth <= 390 && m.scrollWidth <= m.clientWidth + 1; })
    + ' | preview full width ' + await p.evaluate(() => { const m = document.querySelector('#modal .poster-sheet'), pv = document.querySelector('#modal .poster-prev'); return Math.round(pv.getBoundingClientRect().width) >= m.clientWidth - 34; }));
  out.push('poster sheet 390: controls under 44 ' + await p.evaluate(() => [...document.querySelectorAll('#modal .poster-sheet button, #modal .poster-sheet input, #modal .poster-sheet .swatch')].filter(x => {
    const r = (x.closest('label.chk') || x.closest('.swatch') || x).getBoundingClientRect(); return r.width && r.height < 44; }).map(x => x.dataset.act || x.dataset.poster || x.className).join(',') || 'none')
    + ' | text box font ' + await p.evaluate(() => getComputedStyle(document.querySelector('#modal [data-poster="headline"]')).fontSize));
  await p.screenshot({ path: 'test-results/poster-sheet-390.png' });
  await p.evaluate(() => { const m = document.querySelector('#modal .poster-sheet'); m.scrollTop = m.scrollHeight; }); await p.waitForTimeout(100);
  await p.screenshot({ path: 'test-results/poster-sheet-390-end.png' });
  await p.evaluate(() => { document.querySelector('#toast').hidden = true; const m = document.querySelector('#modal .poster-sheet'), f = document.querySelector('#modal .poster-pic');
    m.scrollTop += f.getBoundingClientRect().top - m.getBoundingClientRect().top - 12; }); await p.waitForTimeout(150);
  await p.screenshot({ path: 'test-results/poster-fold-390.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(200);
  // the poster's words in French
  out.push(...await run(`
    q('[data-act="close"]')?.click(); await w(100);
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="fr"]').click(); await w(200);
    const tid = window.__tid; await open(tid); q('#cal-' + tid + ' [data-act="poster-open"]').click(); await drawn();
    await tap('#modal [data-act="poster-size"][data-k="a4"]'); await tap('#modal [data-act="poster-layout"][data-k="classic"]'); await tap('#modal [data-poster="show"][data-k="howTo"]');
    const words = txt(q('#modal [data-poster-words]'));
    L.push('poster fr: ' + txt(q('#modal h3')) + ' | ' + ['Pointage à partir de 09:00', 'Début des parties à 10:00', "Droit d'engagement", 'Prix', 'Comment s\\'engager', 'Spring Triples', 'Scannez pour en savoir plus'].map(x => words.includes(x)).join(',')
      + ' | buttons ' + qa('#modal .poster-btns .btn').map(txt).join(','));
    snap('poster-classic-a4-fr');
    q('[data-act="close"]').click(); await w(100);
    q('[data-act="lang-menu"]').click(); await w(30); q('[data-lang="en"]').click(); await w(150);
  `));
  for (const [name, url] of (await p.evaluate(() => window.__snaps || [])).slice(snaps.length)) fs.writeFileSync(`test-results/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  // the picture is still there after a reload (IndexedDB), nothing went to the store; then removed; old pictures cleaned up
  const tid = await p.evaluate(() => window.__tid), writes = await p.evaluate(() => window.__picWrites);
  await p.reload(); await p.waitForTimeout(400);
  out.push(...await run(`
    const tid = ${JSON.stringify(tid)};
    const idb = (mode, fn) => new Promise((res, rej) => { const r = indexedDB.open('carreau-poster'); r.onerror = () => rej(r.error);
      r.onsuccess = () => { const db = r.result, tx = db.transaction('pictures', mode), rq = fn(tx.objectStore('pictures')); tx.oncomplete = () => { db.close(); res(rq?.result); }; tx.onerror = () => rej(tx.error); }; });
    const keys = () => idb('readonly', os => os.getAllKeys());
    const sheet = async () => { await open(tid); q('#cal-' + tid + ' [data-act="poster-open"]').click(); await S.modal?.picReady; await drawn(); };
    await sheet();
    L.push('poster picture stays on device: store writes ${writes} | after reload ' + (!!S.modal.pic && !!q('#modal [data-act="poster-pic-remove"]') && (await keys()).includes(tid)) + ' | designs small ' + Object.keys(localStorage).filter(k => k.startsWith('carreau-poster')).every(k => localStorage.getItem(k).length < 3000));
    await tap('#modal [data-act="poster-layout"][data-k="photo"]');
    await tap('#modal [data-act="poster-pic-remove"]'); await S.modal.picSaved;
    L.push('poster picture removed: layout back to bold ' + (S.modal.layout === 'bold' && !S.modal.pic && S.modal.info.pic === false && !q('#modal [data-act="poster-pic-remove"]')) + ' | gone from device ' + !(await keys()).includes(tid)
      + ' | position and darken hidden ' + (!q('#modal [data-act="poster-pos"]') && !q('#modal [data-poster="dark"]')));
    q('#modal [data-act="close"]').click(); await w(100);
    // pictures of listings over 30 days past are deleted when the sheet opens; a picture with no date (kept per device) stays
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    await idb('readwrite', os => { os.put({ blob, date: day(-40) }, 'cOld'); os.put({ blob, date: day(-10) }, 'cRecent'); os.put({ blob }, 'device:test'); });
    await sheet(); const k = await keys();
    L.push('poster picture cleanup: 40 days past gone ' + !k.includes('cOld') + ' | 10 days past kept ' + k.includes('cRecent') + ' | per-device kept ' + k.includes('device:test') + ' | photo with no picture opens as ' + S.modal.layout);
    q('#modal [data-act="close"]').click(); await w(100);
  `));
  console.log(out.join('\n'));
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
