// Poster maker (poster-maker) on the website: the QR code drawn with the site's generator (S.qrMatrix, from web-boot.js),
// opening the listing (#calendar.<id>), at least 22% of the poster's width with a 4-module quiet zone; Download saves the
// PNG Blob as it is (S.downloads.save takes a Blob); with "Show the QR code" unticked there's no code.
// Screenshots: each layout with its QR code (square), and Band as a Story.
const { chromium } = require('playwright'), fs = require('fs');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const c = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'en-GB', acceptDownloads: true }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
  const A = await c.newPage(); A.on('pageerror', e => errs.push(e.message));
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const txt = (p, s) => p.evaluate(s => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim(), s);
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const drawn = () => A.evaluate(async () => { const S = window.__carreau.S; await new Promise(r => setTimeout(r, 260));
    for (let i = 0; i < 80 && !(S.modal?.poster && S.modal.drawn && S.modal.drawn === S.modal.seq); i++) await new Promise(r => setTimeout(r, 100)); });
  const tap = async sel => { await A.click(sel); await drawn(); };
  const snap = async name => { if (!process.env.OUT) return; const url = await A.evaluate(() => { const cv = document.querySelector('#modal canvas'), k = Math.min(1, 1000 / cv.height), x = document.createElement('canvas');
    x.width = Math.round(cv.width * k); x.height = Math.round(cv.height * k); x.getContext('2d').drawImage(cv, 0, 0, x.width, x.height); return x.toDataURL('image/png'); });
    fs.writeFileSync(`${process.env.OUT}/${name}.png`, Buffer.from(url.split(',')[1], 'base64')); };

  await A.goto(process.env.WEB_URL); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500); const tid = await A.evaluate(() => location.hash.slice(1));
  if (await A.$('[data-act="wiz-skip"]')) { await A.click('[data-act="wiz-skip"]'); await w(800); }
  await A.evaluate(async patch => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, patch); await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); },
    { name: 'Letchworth Open Doubles', venue: 'Letchworth PC', date: day(12), format: 'doubles', accent: '#8a1c4a' }); await w(1200);
  await A.click('[data-tab="setup"]'); await w(1500);
  await A.click('[data-cal-panel] [data-act="cal-open"]'); await w(400);
  await A.fill('#modal [data-cal="checkin"]', '09:30'); await A.fill('#modal [data-cal="start"]', '10:15');
  await A.fill('#modal [data-cal="fee"]', '£6 per team'); await A.fill('#modal [data-cal="prizes"]', 'Trophies and £200 prize fund'); await A.fill('#modal [data-cal="contact"]', 'Jane, 07700 900123');
  await A.click('#modal [data-act="cal-save"]'); await w(2000);
  log('poster listed:', await txt(A, '#toast'));

  // the sheet from Setup: the QR code opens the listing
  await A.click('[data-cal-panel] [data-act="poster-open"]'); await drawn();
  const qr = await A.evaluate(async () => { const S = window.__carreau.S, md = S.modal, m = await S.qrMatrix(md.info.link), cv = md.cv;
    const n = m.n + 8, qs = Math.ceil(23.5 * cv.width / 100 / n) * n, mod = qs / n;
    // the bottom-right QR box (Bold): its quiet zone is white and its finder pattern's corner module is dark
    const x = d => cv.getContext('2d').getImageData(d[0], d[1], 1, 1).data; const left = Math.round(cv.width - 7 * cv.width / 100 - qs);
    const boxes = [...Array(cv.height).keys()].filter(y => { const p = x([left + 4 * mod + mod / 2, y]); return p[0] < 40 && p[1] < 40 && p[2] < 40; });
    const top = boxes.length ? boxes[0] - 4 * mod : -1, quiet = top >= 0 && [1, 2, 3].every(k => { const p = x([left + 4 * mod + mod / 2, top + k * mod]); return p[0] > 240 && p[1] > 240 && p[2] > 240; });
    return { drawn: md.info.qr, link: md.info.link, label: md.info.label, n: m.n, pct: qs / cv.width * 100, quiet }; });
  log(`poster qr: drawn ${qr.drawn} | link ends #calendar.<id> ${qr.link.endsWith('#calendar.' + tid)} | label ${qr.label}`);
  log(`poster qr modules: ${qr.n} | box ${Math.round(qr.pct)}% of the width ${qr.pct >= 22} | quiet zone 4 ${qr.quiet}`);
  for (const k of ['bold', 'band', 'classic']) { await tap(`#modal [data-act="poster-layout"][data-k="${k}"]`); await snap(`poster-web-${k}-square`); }
  await tap('#modal [data-act="poster-size"][data-k="story"]'); await tap('#modal [data-act="poster-layout"][data-k="band"]'); await snap('poster-web-band-story');
  await tap('#modal [data-act="poster-size"][data-k="a4"]'); await tap('#modal [data-act="poster-layout"][data-k="bold"]'); await snap('poster-web-bold-a4');
  await tap('#modal [data-act="poster-size"][data-k="square"]');

  // Download through the website's S.downloads: the PNG as it is
  const [dl] = await Promise.all([A.waitForEvent('download', { timeout: 15000 }), A.click('#modal [data-act="poster-download"]')]);
  const buf = fs.readFileSync(await dl.path());
  log('poster web download:', dl.suggestedFilename(), '| png', buf.slice(1, 4).toString() === 'PNG' && buf.length > 10000);

  await A.click('#modal [data-poster="qr"]'); await drawn();
  log('poster qr without the code: drawn', await A.evaluate(() => window.__carreau.S.modal.info.qr));
  await A.click('#modal [data-act="close"]'); await w(200);
  // tidy up: take the listing off the calendar
  await A.evaluate(async t => { try { await window.__carreau.S.store.deleteCal(t); } catch {} }, tid);
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
