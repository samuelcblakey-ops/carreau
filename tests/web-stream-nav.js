// Website: from a stream's set-up page and the streams list, the tabs and back buttons return to the competition
// without reloading the page, and the browser's back button returns to the stream.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const w = ms => new Promise(r => setTimeout(r, ms));
  await p.goto(process.env.WEB_URL); await w(3500);
  await p.click('[data-act="new-t"]'); await w(2500); const tid = await p.evaluate(() => location.hash.slice(1));
  await p.evaluate(() => { window.__noReload = true; });
  const where = () => p.evaluate(() => `${location.hash} | ${document.querySelector('main h2')?.textContent.trim()} | stream page ${!!window.__carreau.S.liveRoute} | same page ${!!window.__noReload}`);
  await p.click('#tabs [data-tab="stream"]'); await w(800); await p.click('[data-act="strm-new"]'); await w(2500);
  const sh = await p.evaluate(() => location.hash); console.log('stream set-up: ' + /^#s\./.test(sh));
  await p.click('#tabs [data-tab="setup"]'); await w(800); console.log('setup tab: ' + (await where()).replace('#' + tid, '#COMP'));
  await p.goBack(); await w(1200); console.log('browser back: ' + ((await where()).startsWith(sh + ' |')));
  await p.click('main button:has-text("‹ Streams")'); await w(800); console.log('streams button: ' + (await where()).replace('#' + tid, '#COMP'));
  await p.evaluate(() => { location.hash = 'streams'; }); await w(1200); await p.click('main button:has-text("‹ Competitions")'); await w(800);
  console.log('streams list back: ' + (await where()).replace('#' + tid, '#COMP'));
  console.log('errs', errs); await b.close();
})();
