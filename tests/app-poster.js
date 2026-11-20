// Poster maker (poster-maker): the "Make a poster" button (the listing's organisers only, not on hidden listings), the
// sheet's sizes, layouts, colours (Match the logo), ticks and words, the design remembered on this device, Download (a PNG
// Blob), Print (A4 and A5 only), French words on the poster, and the sheet at 390 px. The QR code needs the website's
// generator, so it's checked in web-poster.js; here (the app on its own) the link is printed in its place.
// Screenshots: each layout at square and A4, a Story, and the sheet at 390 px and on desktop.
// Background picture (poster-background): a picture chosen on the device (Photo layout, Bold's top block, Band ignores
// it), Position, Darken, the ChatGPT prompt, the picture kept in IndexedDB only (nothing to S.store), kept over a
// reload, removed, and old listings' pictures cleaned up. Screenshots: Photo at square and Story, Bold with a picture,
// the ChatGPT fold open at 390 px.
// Logos (poster-sponsors): sponsor logos (up to 4, kept per device, their ticks per listing) in a strip along the foot,
// "Your logo" for an event run elsewhere (kept per listing), nothing to the store. Screenshots: each layout with
// sponsors (Band square with 3, Photo A4 with 4 on the white bar), an event's own logo, the Logos section at 390 px.
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
  // logos (poster-sponsors): sponsor logos kept per device (up to 4) in a strip along the foot, their ticks per listing,
  // and "Your logo" for an event run elsewhere (kept per listing); all in IndexedDB, nothing to the store
  out.push(...await run(`
    const tid = window.__tid;
    // test logos, PNG with transparency: a round badge, a wide word mark, a tall shield, a wide one on white, and a fifth
    const png = (w, h, name, draw) => new Promise(res => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); c.toBlob(b => res(new File([b], name, { type: 'image/png' })), 'image/png'); });
    const word = (x, t, px, col, cx, cy, wt = 800) => { x.font = wt + ' ' + px + 'px Arial, sans-serif'; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, cx, cy); };
    const logos = await Promise.all([
      png(400, 400, 'badge.png', (x, w) => { x.fillStyle = '#c0392b'; x.beginPath(); x.arc(200, 200, 190, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(200, 200, 150, 0, 7); x.fill(); word(x, 'ACME', 92, '#c0392b', 200, 185); word(x, 'BOULANGERIE', 30, '#333', 200, 262, 700); }),
      png(640, 300, 'wordmark.png', (x) => { x.fillStyle = '#1f5fbf'; x.beginPath(); x.roundRect(10, 40, 220, 220, 40); x.fill(); word(x, 'H', 170, '#fff', 120, 158); word(x, 'Hitchin', 104, '#1f5fbf', 440, 120); word(x, 'MOTORS', 64, '#222', 440, 222, 700); }),
      png(300, 420, 'shield.png', (x) => { x.fillStyle = '#1e7a46'; x.beginPath(); x.moveTo(20, 20); x.lineTo(280, 20); x.lineTo(280, 230); x.quadraticCurveTo(280, 360, 150, 410); x.quadraticCurveTo(20, 360, 20, 230); x.closePath(); x.fill(); word(x, 'GT', 120, '#ffd166', 150, 160); word(x, 'GARDEN', 44, '#fff', 150, 270, 700); }),
      png(560, 240, 'cafe.png', (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 560, 240); x.strokeStyle = '#7a4b2a'; x.lineWidth = 8; x.strokeRect(12, 12, 536, 216); word(x, 'Café du Port', 76, '#7a4b2a', 280, 104, 700); word(x, 'BAR · BRASSERIE', 34, '#555', 280, 172, 600); }),
      png(300, 300, 'fifth.png', (x) => { x.fillStyle = '#8e44ad'; x.fillRect(0, 0, 300, 300); })]);
    const count = () => (S.modal.sponsorList || []).length;
    const add = async f => { const n0 = count(), inp = q('#modal [data-poster="sponsor"]'), dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('input', { bubbles: true }));
      for (let i = 0; i < 60 && count() === n0; i++) await w(100); await drawn(); };
    const sheet = async id => { q('#modal [data-act="close"]')?.click(); await w(100); await open(id); q('#cal-' + id + ' [data-act="poster-open"]').click(); await S.modal?.picReady; await drawn(); };
    const idbKeys = () => new Promise((res, rej) => { const r = indexedDB.open('carreau-poster'); r.onerror = () => rej(r.error); r.onsuccess = () => { const db = r.result, rq = db.transaction('pictures').objectStore('pictures').getAllKeys(); rq.onsuccess = () => { db.close(); res(rq.result); }; }; });
    await sheet(tid);
    L.push('poster logos section: ' + txt(q('#modal .poster-logos .eyebrow')) + ' | ' + qa('#modal .poster-logos .poster-sub').map(txt).join(',') + ' | add ' + txt(q('#modal [data-act="poster-sponsor"]'))
      + ' | ticks before any ' + qa('#modal [data-poster="sponsors"], #modal [data-poster="thanks"]').length + ' | club logo tick ' + !!q('#modal .poster-logos [data-poster="logo"]'));
    const compOwn = !!q('#modal [data-act="poster-own"]');
    await tap('#modal [data-act="poster-size"][data-k="square"]'); await tap('#modal [data-act="poster-layout"][data-k="band"]');
    for (const f of logos.slice(0, 3)) await add(f);
    const ticksOn = q('#modal [data-poster="sponsors"]')?.checked && q('#modal [data-poster="thanks"]')?.checked;
    snap('poster-sponsors-band-square'); const band3 = S.modal.info.sponsors.length;
    await tap('#modal [data-act="poster-layout"][data-k="bold"]'); snap('poster-sponsors-bold-square');
    await tap('#modal [data-act="poster-layout"][data-k="classic"]'); snap('poster-sponsors-classic-square');
    await add(logos[3]);
    await tap('#modal [data-act="poster-layout"][data-k="classic"]'); await tap('#modal [data-act="poster-size"][data-k="a4"]'); snap('poster-sponsors-classic-a4');
    await tap('#modal [data-act="poster-layout"][data-k="photo"]'); snap('poster-sponsors-photo-a4');
    const cv = q('#modal canvas'), r = S.modal.info.sponsors[0], px = cv.getContext('2d').getImageData(Math.round(cv.width * .03), r.y + Math.round(r.h / 2), 1, 1).data;
    const panel = S.modal.info.layout === 'photo' && S.modal.info.pic && px[0] === 255 && px[1] === 255 && px[2] === 255;
    await tap('#modal [data-act="poster-size"][data-k="square"]'); snap('poster-sponsors-photo-square');
    await tap('#modal [data-act="poster-size"][data-k="story"]'); snap('poster-sponsors-photo-story');
    await tap('#modal [data-act="poster-layout"][data-k="band"]'); snap('poster-sponsors-band-story');
    L.push('poster sponsors strip: band ' + band3 + ' | photo a4 ' + S.modal.sponsorList.length + ' | white panel ' + panel + ' | ticks on by default ' + ticksOn);
    // a fifth: refused, from the button and from a file
    q('#toast').hidden = true; q('#modal [data-act="poster-sponsor"]').click(); await w(150); const refused = txt(q('#toast'));
    q('#toast').hidden = true; const inp = q('#modal [data-poster="sponsor"]'), dt = new DataTransfer(); dt.items.add(logos[4]); inp.files = dt.files; inp.dispatchEvent(new Event('input', { bubbles: true }));
    for (let i = 0; i < 40 && q('#toast').hidden; i++) await w(100); const still4 = count() === 4 && txt(q('#toast')) === refused;
    // remove two: two left, drawn at one height, with the thanks line
    await tap('#modal [data-act="poster-size"][data-k="square"]');
    for (let i = 0; i < 2; i++) { await tap('#modal [data-act="poster-sponsor-remove"]'); await S.modal.picSaved; }
    const sp = S.modal.info.sponsors, same = sp.length === 2 && sp.every(x => Math.abs(x.h - sp[0].h) <= 1) && Math.abs(sp[0].h - .07 * S.modal.info.h) <= 1;
    const thanks = S.modal.info.thanks && txt(q('#modal [data-poster-words]')).includes('With thanks to our sponsors');
    L.push('poster sponsors: ' + sp.length + ' drawn | same height ' + same + ' | thanks line ' + thanks + ' | fifth refused ' + refused + (still4 ? '' : ' (file not refused)'));
    const kept = (await idbKeys()).filter(k => String(k).startsWith('sponsor:')).length;
    // the ticks are this listing's: untick the thanks line here, then a second listing still has it
    q('#modal [data-poster="thanks"]').click(); await drawn(); const off = S.modal.info.thanks === false && S.modal.info.sponsors.length === 2;
    await sheet('cNew');
    const second = S.modal.sponsorList.length === 2 && S.modal.info.sponsors.length === 2 && kept === 2;
    const otherOn = S.modal.thanks === true && S.modal.info.thanks === true;
    q('#modal [data-poster="sponsors"]').click(); await drawn(); const hidden = S.modal.info.sponsors.length === 0; q('#modal [data-poster="sponsors"]').click(); await drawn();
    // Your logo: only for an event run elsewhere
    const ownBtn = !!q('#modal [data-act="poster-own"]') && txt(q('#modal [data-act="poster-own"]')) === 'Choose a logo' && !q('#modal [data-poster="logo"]');
    L.push('poster own-event logo: button shown ' + ownBtn + ' | comp listing button shown ' + compOwn);
    const oi = q('#modal [data-poster="own"]'), od = new DataTransfer(); od.items.add(logos[0]); oi.files = od.files; oi.dispatchEvent(new Event('input', { bubbles: true }));
    for (let i = 0; i < 60 && !S.modal.own; i++) await w(100); await drawn(); await S.modal.picSaved;
    const ownDrawn = S.modal.info.logo && !!q('#modal [data-poster="logo"]') && !!q('#modal [data-act="poster-own-remove"]') && (await idbKeys()).includes('logo:cNew');
    await tap('#modal [data-act="poster-layout"][data-k="bold"]'); snap('poster-own-logo-bold-square');
    await sheet(tid);
    const back = S.modal.thanks === false && !q('#modal [data-poster="thanks"]').checked && S.modal.info.thanks === false && !q('#modal [data-act="poster-own"]');
    L.push('poster sponsors kept: on a second listing 2 ' + second + ' | ticks per listing ' + (off && otherOn && back) + ' | untick hides ' + hidden);
    q('#modal [data-poster="thanks"]').click(); await drawn();
    await sheet('cNew'); const ownKept = !!S.modal.own && S.modal.info.logo;
    await tap('#modal [data-act="poster-own-remove"]'); await S.modal.picSaved; const ownGone = !S.modal.own && !S.modal.info.logo && !(await idbKeys()).includes('logo:cNew') && !q('#modal [data-poster="logo"]');
    L.push('poster own logo: drawn ' + ownDrawn + ' | kept for the listing ' + ownKept + ' | removed ' + ownGone);
    const oi2 = q('#modal [data-poster="own"]'), od2 = new DataTransfer(); od2.items.add(logos[0]); oi2.files = od2.files; oi2.dispatchEvent(new Event('input', { bubbles: true }));
    for (let i = 0; i < 60 && !S.modal.own; i++) await w(100); await drawn(); await S.modal.picSaved;
    L.push('poster logos stay on device: store writes ' + window.__writes);
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
  await p.evaluate(() => { const m = document.querySelector('#modal .poster-sheet'), f = document.querySelector('#modal .poster-logos');
    m.scrollTop += f.getBoundingClientRect().top - m.getBoundingClientRect().top - 12; }); await p.waitForTimeout(150);
  await p.screenshot({ path: 'test-results/poster-logos-390.png' });
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
  // Your own flyer (poster-flyer): added from the poster sheet (shrunk on the device, kept in the store), shown on the full
  // listing, stamped with the QR code's box (here the link, the app has no generator) in the chosen corner, the full-flyer
  // prompt, removed (and with the listing, and by the admin). Screenshots: the stamped download in each corner, the listing
  // with its flyer at 390 px and on desktop.
  const fpre = `const tid = ${JSON.stringify(tid)};
    const sheet = async id => { await open(id); q('#cal-' + id + ' [data-act="poster-open"]').click(); await S.modal?.picReady; await drawn(); for (let i = 0; i < 40 && S.calFlyer?.[id] === 'loading'; i++) await w(50); await w(50); };
    const toastTxt = () => txt(q('#toast'));
    const until = async (f, n = 100) => { for (let i = 0; i < n && !f(); i++) await w(100); return !!f(); };
    // a flyer made elsewhere: a portrait picture with gradients, shapes and words (dark in every corner)
    const flyerFile = (W, H, type = 'image/png', name = 'flyer.png') => new Promise(res => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#123a6b'); g.addColorStop(.5, '#7a1f3d'); g.addColorStop(1, '#0d3b2a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { x.fillStyle = 'hsla(' + (i * 37 % 360) + ',70%,' + (30 + i % 4 * 8) + '%,.55)'; x.beginPath(); x.arc((i * 211) % W, (i * 397) % H, 20 + (i * 13) % 90, 0, 7); x.fill(); }
      x.fillStyle = '#f2c45a'; x.font = 'bold ' + Math.round(W / 9) + 'px sans-serif'; x.fillText('GRAND', W * .1, H * .25); x.fillText('CONCOURS', W * .1, H * .38);
      x.fillStyle = '#000'; [[0, 0], [W - W * .3, 0], [0, H - W * .3], [W - W * .3, H - W * .3]].forEach(([a, b2]) => x.fillRect(a, b2, W * .3, W * .3));
      c.toBlob(b => res(new File([b], name, { type })), 'image/png'); });
    const pick = async f => { const inp = q('#modal [data-poster="flyer"]'), dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('input', { bubbles: true })); };
    const px = (cv, x, y) => cv.getContext('2d').getImageData(Math.round(x), Math.round(y), 1, 1).data;
    const white = p => p[0] > 235 && p[1] > 235 && p[2] > 235;
    const blobCv = async b => { const img = await createImageBitmap(b), c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c; };`;
  out.push(...await run(`${fpre}
    await sheet(tid);
    const sec = q('#modal .poster-flyer');
    L.push('flyer section: ' + txt(sec?.querySelector('.eyebrow')) + ' | add ' + txt(q('#modal [data-act="poster-flyer"]')) + ' | prompt ' + txt(q('#modal [data-act="poster-flyer-prompt"]'))
      + ' | last ' + (q('#modal .poster-ctl').lastElementChild === sec) + ' | note ' + txt(sec?.querySelector('p.small')));
    // a picture that isn't a JPEG, PNG or WebP
    await pick(new File(['GIF89a'], 'a.gif', { type: 'image/gif' })); await until(() => /couldn't be used/.test(toastTxt()), 30);
    const t1 = toastTxt(); q('#toast').innerHTML = '';
    await pick(new File(['not a picture'], 'b.png', { type: 'image/png' })); await w(300); await until(() => !S.modal.flyerBusy, 50);
    L.push('flyer unreadable: ' + t1 + ' | broken png refused ' + (!S.calFlyer[tid] && /couldn't be used/.test(toastTxt())));
    await pick(await flyerFile(2000, 2828)); await until(() => S.calFlyer[tid] && typeof S.calFlyer[tid] === 'object' && !S.modal.flyerBusy);
    const saved = await S.store.getCalFlyer(tid);
    L.push('flyer added: ' + toastTxt() + ' | ' + (saved?.flyer || '').slice(0, 15) + ' | ' + saved.w + 'x' + saved.h + ' | under 700000 ' + (saved.flyer.length < 700000) + ' | thumbnail ' + !!q('#modal .poster-flyer-thumb img')
      + ' | buttons ' + qa('#modal .poster-flyer .btn').map(txt).join(','));
    L.push('flyer corners offered: ' + qa('#modal [data-act="poster-corner"]').map(txt).join(',') + ' | default ' + txt(q('#modal [data-act="poster-corner"][aria-pressed="true"]')));
    // Download with our QR code: the stamped JPEG; the box in the chosen corner, 22% of the width; the saved flyer as it was
    window.__file = null; S.downloads = { save: async f => { window.__file = f; } };
    const shots = {}, boxes = {};
    for (const k of ['br', 'bl', 'tr', 'tl']) {
      q('#modal [data-act="poster-corner"][data-k="' + k + '"]').click(); await w(80); window.__file = null;
      q('#modal [data-act="poster-flyer-download"]').click(); await until(() => window.__file, 60);
      const cv = await blobCv(window.__file.data), i = S.modal.flyerInfo, b2 = i.box, m = Math.round(i.w * .03);
      const inBox = white(px(cv, b2.x + 3, b2.y + b2.h / 2)) && white(px(cv, b2.x + b2.w - 4, b2.y + b2.h / 2));
      const others = [[m + 3, m + 3], [i.w - m - 4, m + 3], [m + 3, i.h - m - 4], [i.w - m - 4, i.h - m - 4]].filter(([x, y]) => !(x >= b2.x && x <= b2.x + b2.w && y >= b2.y && y <= b2.y + b2.h)).every(([x, y]) => !white(px(cv, x, y)));
      boxes[k] = { right: Math.abs(b2.x + b2.w - (i.w - m)) <= 1, left: b2.x === m, bottom: Math.abs(b2.y + b2.h - (i.h - m)) <= 1, top: b2.y === m, pct: b2.w / i.w, inBox, others, type: window.__file.data.type, name: window.__file.filename, label: i.label };
      const k2 = Math.min(1, 1000 / cv.height), c2 = document.createElement('canvas'); c2.width = Math.round(cv.width * k2); c2.height = Math.round(cv.height * k2); c2.getContext('2d').drawImage(cv, 0, 0, c2.width, c2.height);
      (window.__snaps = window.__snaps || []).push(['flyer-stamp-' + k, c2.toDataURL('image/png')]);
    }
    const after = await S.store.getCalFlyer(tid), br = boxes.br;
    L.push('flyer qr: corner bottom right ' + (br.right && br.bottom && br.inBox && br.others) + ' | box 22% ' + (Math.abs(br.pct - .22) < .002) + ' | saved flyer unchanged ' + (after.flyer === saved.flyer && after.at === saved.at && S.calFlyer[tid].flyer === saved.flyer) + ' | label ' + br.label);
    L.push('flyer corners: bottom left ' + (boxes.bl.left && boxes.bl.bottom && boxes.bl.others) + ' | top right ' + (boxes.tr.right && boxes.tr.top && boxes.tr.others) + ' | top left ' + (boxes.tl.left && boxes.tl.top && boxes.tl.others)
      + ' | file ' + br.type + ' ' + br.name + ' | thumbnail corner ' + (q('#modal .poster-flyer-qr')?.classList.contains('tl')));
    q('#modal [data-act="poster-corner"][data-k="br"]').click(); await w(50);
    // the full-flyer prompt (in English)
    q('#modal [data-act="poster-flyer-prompt"]').click(); await until(() => /Prompt copied/.test(toastTxt()) || S.modal.copied, 30);
    const pr = S.modal.copied || '';
    L.push('flyer prompt full: ' + pr.replace(/Date: \\w+ \\d+ \\w+ \\d{4}\\./, 'Date: <date>.'));
    q('#modal [data-act="close"]').click(); await w(100);
    await S.store.setCal('cFly', mk('cFly', { name: 'Summer Singles', venue: 'Baldock Green', fmt: 'singles', date: '2026-12-06' }));
    await sheet('cFly'); q('#modal [data-act="poster-flyer-prompt"]').click(); await w(200);
    const p2 = S.modal.copied || '';
    L.push('flyer prompt: name ' + pr.includes('Title: Spring Triples. ') + ' | Leave the bottom-right corner empty ' + pr.includes('Leave the bottom-right corner empty, a plain square about a fifth') + ' | fee left out when empty ' + (!p2.includes('Entry fee') && pr.includes('Entry fee: £5 per player. ')));
    L.push('flyer prompt short: ' + p2.slice(p2.indexOf('Title:'), p2.indexOf(' Leave')));
    q('#modal [data-act="close"]').click(); await w(100);
  `));
  // the full listing with its flyer, on desktop and at 390 px
  const card = async (width, shot) => { await p.setViewportSize({ width, height: width < 500 ? 844 : 900 }); await p.waitForTimeout(250);
    const r = await run(`${fpre} await open(tid); await until(() => q('#cal-' + tid + ' .cal-flyer img')?.complete); await w(200);
      const fl = q('#cal-' + tid + ' .cal-flyer'), cardEl = card(tid), dl = q('#cal-' + tid + ' .cal-facts');
      fl.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); await w(150);
      L.push('listing flyer ' + ${width} + ': shown ' + !!fl + ' | alt ' + fl?.querySelector('img').alt + ' | above the details ' + !!(fl && dl && (fl.compareDocumentPosition(dl) & 4))
        + ' | width ' + (Math.abs(fl.getBoundingClientRect().width - (cardEl.clientWidth - parseFloat(getComputedStyle(cardEl).paddingLeft) - parseFloat(getComputedStyle(cardEl).paddingRight))) < 2 ? 'full' : fl.getBoundingClientRect().width <= 360.5 ? 'at most 360' : fl.getBoundingClientRect().width)
        + ' | no sideways scroll ' + (document.documentElement.scrollWidth <= innerWidth + 1) + ' | rows show flyers ' + qa('.cal-row img').length);`);
    await p.screenshot({ path: `test-results/${shot}.png` }); return r; };
  out.push(...await card(1100, 'flyer-listing-desktop'), ...await card(390, 'flyer-listing-390'));
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(200);
  out.push(...await run(`${fpre}
    // tapping it opens it full size in a new tab
    const opened = []; const wo = window.open; window.open = (u, t) => { opened.push([u, t]); return null; };
    await open(tid); q('#cal-' + tid + ' .cal-flyer').click(); await w(50); window.open = wo;
    L.push('flyer tapped: new tab ' + (opened.length === 1 && /^blob:/.test(opened[0][0]) && opened[0][1] === '_blank'));
    // Remove, after the question
    await sheet(tid); q('#modal [data-act="poster-flyer-remove"]').click(); await w(80);
    const ask = txt(q('#modal .poster-flyer-ask .err')) + ' | ' + qa('#modal .poster-flyer-ask .btn').map(txt).join(',');
    q('#modal [data-act="poster-flyer-remove-no"]').click(); await w(80); const kept = !!(await S.store.getCalFlyer(tid));
    q('#modal [data-act="poster-flyer-remove"]').click(); await w(80); q('#modal [data-act="poster-flyer-remove-yes"]').click(); await until(() => S.calFlyer[tid] === null);
    L.push('flyer remove: ask ' + ask + ' | keep it kept ' + kept + ' | removed ' + ((await S.store.getCalFlyer(tid)) === null) + ' | toast ' + toastTxt() + ' | add again ' + txt(q('#modal [data-act="poster-flyer"]')));
    q('#modal [data-act="close"]').click(); await w(100);
    // the admin's strip: Remove the flyer, no question asked
    const f0 = { flyer: 'data:image/jpeg;base64,' + (await flyerFile(300, 420).then(f => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(f); }))), w: 300, h: 420, at: Date.now() };
    await S.store.setCalFlyer(tid, f0); delete S.calFlyer[tid];
    const adm = S.calAdmin; S.calAdmin = () => true; await open(tid); await until(() => q('#cal-' + tid + ' .cal-flyer'));
    const strip = txt(q('#cal-' + tid + ' .cal-admin'));
    q('#cal-' + tid + ' [data-act="cal-flyer-admin-remove"]').click(); await until(() => S.calFlyer[tid] === null, 30); await w(100);
    L.push('flyer admin strip: ' + strip + ' | removed ' + ((await S.store.getCalFlyer(tid)) === null) + ' | toast ' + toastTxt() + ' | gone from listing ' + !q('#cal-' + tid + ' .cal-flyer') + ' | button gone ' + !q('[data-act="cal-flyer-admin-remove"]'));
    S.calAdmin = adm;
    // removing the listing deletes its flyer first
    await S.store.setCalFlyer('cFly', f0); delete S.calFlyer.cFly; await open('cFly');
    q('#cal-cFly [data-act="cal-page-remove"]').click(); await w(150); q('#cal-cFly [data-act="cal-page-remove-yes"]').click(); await until(() => !card('cFly'), 30); await w(100);
    L.push('flyer with listing (app): listing gone ' + !(await S.store.getCal('cFly')) + ' | flyer gone ' + ((await S.store.getCalFlyer('cFly')) === null));
    // a listing that isn't on the calendar can't take a flyer
    let err = ''; try { await S.store.setCalFlyer('nope', f0); } catch (e) { err = e.code; }
    L.push('flyer without listing (app): ' + err);
  `));
  for (const [name, url] of (await p.evaluate(() => window.__snaps || [])).filter(([n]) => n.startsWith('flyer-'))) fs.writeFileSync(`test-results/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out.join('\n'));
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
