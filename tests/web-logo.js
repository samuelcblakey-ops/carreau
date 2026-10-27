// Club logo on the website: added straight after creating a competition it shows at once (the logo listener used to be
// refused for a brand-new competition and never retried), a redraw while the file picker is open doesn't lose the file,
// SVGs are accepted, another device sees the logo, and Remove takes it away.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = []; const w = ms => new Promise(r => setTimeout(r, ms));
  const mk = async n => { const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const fx = f => path.join(__dirname, 'fixtures', f);
  const A = await mk('organiser'); await A.goto(process.env.WEB_URL); await w(3500);
  await A.click('[data-act="new-t"]'); await w(300); // straight in, before the new competition has settled on the server
  await A.evaluate(() => document.querySelector('[data-act="wiz-skip"]')?.click()); await w(200);
  await A.click('[data-tab="setup"]'); await w(200);
  const pick = async (file, redraw) => { const [fc] = await Promise.all([A.waitForEvent('filechooser'), A.click('[data-act="logo-pick"]')]);
    if (redraw) await A.evaluate(() => window.__carreau.render()); await fc.setFiles(fx(file)); await w(2500); };
  const state = () => A.evaluate(() => `toast ${document.querySelector('#toast')?.textContent} | preview ${!!document.querySelector('.logo-prev')} | menu logo ${!!document.querySelector('.pb-logo')}`);
  const clearToast = () => A.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.textContent = ''; });
  await pick('logo.png'); console.log('new competition: ' + await state());
  await A.evaluate(() => document.querySelector('[data-act="logo-remove"]')?.click()); await w(1500); console.log('removed: ' + await state()); await clearToast();
  await pick('logo.png', true); console.log('redraw while picking: ' + await state()); await clearToast();
  await pick('logo.svg'); console.log('svg: ' + await state() + ' | ' + await A.evaluate(() => (document.querySelector('.logo-prev')?.src || '').slice(0, 22)));
  console.log('accepts any image: ' + await A.evaluate(() => document.querySelector('#logo-file').accept));
  const tid = await A.evaluate(() => window.__carreau.S.tid);
  const B = await mk('other device'); await B.goto(process.env.WEB_URL + '#' + tid); await w(4500);
  console.log('other device sees it: ' + await B.evaluate(() => !!document.querySelector('.pb-logo')));
  console.log('errs', JSON.stringify(errs)); await b.close();
})();
