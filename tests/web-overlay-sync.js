// A freshly opened stand-alone stream overlay follows the desk from the moment it opens, with no reload: desk changes
// made 0.5 s to 10 s after it loads all reach it within 2 s, even with a slow sign-in, and a spectator's overlay logs
// no errors (no "Missing or insufficient permissions" from a read it isn't allowed to make).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const mk = async (n, vw = 1100, vh = 900) => { const c = await b.newContext({ viewport: { width: vw, height: vh } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return [p, c]; };
  // the organiser sets up a stand-alone stream and runs its desk
  const [D] = await mk('desk'); await D.goto(base); await w(3500);
  await D.click('[data-act="new-t"]'); await w(2500);
  await D.click('#tabs [data-tab="stream"]'); await w(800); await D.click('[data-act="strm-new"]'); await w(3000);
  const sid = await D.evaluate(() => location.hash.split('.')[1]);
  const set = async (sel, v) => { await D.fill(sel, v); await D.dispatchEvent(sel, 'change'); await w(600); };
  await set('[data-sfield="a.name"]', 'Les Carreaux'); await set('[data-sfield="b.name"]', "Boule d'Or"); await w(1500);
  let score = 0;
  const deskChange = () => { score++; const n = score; return D.evaluate(async ([id, n]) => { await window.__carreau.S.store.changeStream(id, prev => Object.assign({}, prev || {}, { sa: n, sb: 0, ends: [], events: [], hist: [] })); }, [sid, n]).then(() => n); };
  const shown = p => p.evaluate(() => document.querySelector('.ov-score')?.textContent || '');
  const waitFor = async (p, want, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await shown(p) === String(want)) return Date.now() - t0; await w(100); } return -1; };
  // spectators open the overlay fresh, with the anonymous sign-in slowed down, and the desk changes the score after a while
  const delays = [500, 1000, 2000, 5000, 10000]; const res = []; const consoleErrs = [];
  for (const ms of delays) {
    const [V, vc] = await mk('overlay ' + ms, 1280, 720);
    V.on('console', m => { if (m.type() === 'error' || /insufficient permissions/i.test(m.text())) consoleErrs.push(ms + ': ' + m.text().slice(0, 160)); });
    await vc.route(/127\.0\.0\.1:9099\/.*(signUp|lookup)/, async r => { await w(3000); await r.continue(); });
    await V.goto(base + '#s.' + sid + '.stream'); await V.waitForSelector('.ov-score', { timeout: 15000 }).catch(() => {});
    await w(ms); const n = await deskChange(); const t = await waitFor(V, n, 2000);
    res.push(`${ms / 1000}s ${t >= 0 ? 'ok' : 'MISSED (shows ' + await shown(V) + ', desk ' + n + ')'}`);
    await vc.close();
  }
  log('overlay follows desk: ' + res.join(' | '));
  log('overlay matches desk within 2 s every time:', res.every(r => / ok$/.test(r)));
  log('console errors', consoleErrs.length ? JSON.stringify(consoleErrs) : 'none');
  log('errs', JSON.stringify(errs)); await b.close();
})();
