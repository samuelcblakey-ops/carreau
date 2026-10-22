// Connection light (Live / Offline / waiting to sync), scoring with no signal, reopening offline from the device cache,
// and the offline score reaching another device once the signal is back.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL; const log = (...a) => console.log(...a);
  const w = ms => new Promise(r => setTimeout(r, ms));
  const mk = async (n) => { const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; window.__CARREAU_TEST_SW = true; }); const p = await c.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const dot = p => p.evaluate(() => { const d = document.querySelector('#netdot'); return d && !d.hidden ? d.className.replace('netdot ', '') + ' ' + d.textContent : 'none'; });
  const A = await mk('organiser'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(() => location.hash.slice(1));
  await A.fill('#bulk', 'Club Pins\nCarreau Vents\nGravier Collines\nMistral Lions'); await A.click('#bulk-form button[type=submit]'); await w(1200);
  await A.click('[data-act="checkin-all"]'); await w(800);
  await A.click('[data-tab="draw"]'); await w(500); await A.click('[data-act="first-draw"]'); await w(2500);
  log('online light:', await dot(A));
  // let the service worker take over and cache the page and libraries, then reload once online
  await A.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(r, 8000))])); await A.reload(); await w(4000);
  // lose the signal
  await A.context().setOffline(true); await w(500);
  log('offline light:', await dot(A));
  const mid = await A.evaluate(() => window.__carreau.MS().find(m => m.a && m.b && !m.bye).id);
  await A.click('[data-tab="draw"]'); await w(300); await A.click(`[data-match="${mid}"]`); await w(300);
  const t0 = Date.now(); await A.click('[data-act="qwin"][data-side="a"]'); await w(100); await A.click('[data-act="qlose"][data-k="sb"][data-n="5"]');
  await A.waitForFunction(() => !window.__carreau.S.modal, null, { timeout: 5000 }).catch(() => {});
  log('offline save closes at once:', Date.now() - t0 < 2500, '| score shown:', await A.evaluate(id => { const m = window.__carreau.S.matches[id]; return m.done + ' ' + m.sa + '-' + m.sb; }, mid));
  log('waiting light:', await dot(A));
  // reopen the app with no signal: served from the phone's copy
  await A.reload(); await w(5000);
  log('offline reopen:', await A.evaluate(() => document.querySelector('.picker-btn .pb-name')?.textContent || 'none'), '| score kept:', await A.evaluate(id => { const m = window.__carreau?.S.matches[id]; return m ? m.done + ' ' + m.sa + '-' + m.sb : 'none'; }, mid));
  // signal back: the queued score syncs
  await A.context().setOffline(false); await w(6000);
  log('back online light:', await dot(A));
  const B = await mk('spectator'); await B.goto(base + '#' + tid); await w(5000);
  log('other device sees it:', await B.evaluate(id => { const m = window.__carreau.S.matches[id]; return m ? m.done + ' ' + m.sa + '-' + m.sb : 'none'; }, mid));
  log('errs', JSON.stringify(errs.filter(e => !/net::|Failed to fetch|offline|Could not reach/i.test(e))));
  await b.close();
})();
