// Competition colour and club logo on the website: the organiser sets them, followers see them, the rules stop anyone else.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const mk = async (n, vw = 1100) => { const c = await b.newContext({ viewport: { width: vw, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const AD = await mk('admin'); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  await AD.click('[data-act="open-testing"]'); await w(2500); // strict mode: the rules decide
  const A = await mk('organiser'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500); const tid = await A.evaluate(() => location.hash.slice(1));
  await A.click('[data-tab="setup"]'); await w(500);
  await A.click('#look-panel [data-val="#b3261e"]'); await w(1500);
  log('organiser colour:', await A.evaluate(() => window.__carreau.T().accent));
  log('organiser logo:', await A.evaluate(async logo => { try { await window.__carreau.S.store.setBrand(window.__carreau.S.tid, { logo, at: Date.now() }); return 'WROTE'; } catch (e) { return e.code; } }, LOGO));
  log('bad logo refused:', await A.evaluate(async () => { try { await window.__carreau.S.store.setBrand(window.__carreau.S.tid, { logo: 'javascript:alert(1)', at: 1 }); return 'WROTE'; } catch (e) { return e.code; } }));
  await w(1500);
  const V = await mk('follower', 390); await V.goto(base + '#' + tid); await w(5000);
  log('follower sees:', await V.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() + ' | logo ' + !!document.querySelector('.pb-logo')));
  log('follower writes logo:', await V.evaluate(async logo => { try { await window.__carreau.S.store.setBrand(window.__carreau.S.tid, { logo, at: 1 }); return 'WROTE'; } catch (e) { return e.code; } }, LOGO));
  log('follower has no look panel:', await V.evaluate(() => !document.querySelector('#look-panel')));
  await AD.click('[data-act="open-testing"]'); await w(1500); // back to the beta default
  log('errs', errs); await b.close();
})();
