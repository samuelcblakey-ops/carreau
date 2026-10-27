// Theming: light/dark per device, the competition's colour and club logo, and each stream team's colour.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const L = [];
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const accent = () => ev(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  const bg = () => ev(() => getComputedStyle(document.body).backgroundColor);
  // 1. device theme
  await ev(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('[data-act="new-t"]').click(); await w(80); });
  await p.click('[data-act="theme-menu"]'); await p.waitForTimeout(80);
  L.push('menu: ' + await ev(() => [...document.querySelectorAll('[data-theme-pick]')].map(x => x.dataset.themePick + (x.getAttribute('aria-selected') === 'true' ? '*' : '')).join(',')));
  const light = await bg();
  await p.click('[data-theme-pick="dark"]'); await p.waitForTimeout(80);
  L.push(`dark: attr ${await ev(() => document.documentElement.dataset.theme)} | background changed ${light !== await bg()} | saved ${await ev(() => localStorage.getItem('carreau-theme'))}`);
  await p.reload(); await p.waitForTimeout(300);
  L.push('dark after reload: ' + await ev(() => document.documentElement.dataset.theme));
  await p.click('[data-act="theme-menu"]'); await p.click('[data-theme-pick="auto"]'); await p.waitForTimeout(80);
  L.push('auto: attr ' + (await ev(() => document.documentElement.dataset.theme) === undefined));
  // 2. competition colour
  await p.click('[data-tab="setup"]'); await p.waitForTimeout(80);
  L.push('look panel: ' + await ev(() => !!document.querySelector('#look-panel')) + ' swatches ' + await ev(() => document.querySelectorAll('#look-panel .swatch').length));
  const before = await accent();
  await p.click('#look-panel [data-val="#1f5fbf"]'); await p.waitForTimeout(150);
  L.push(`blue: saved ${await ev(() => window.__carreau.T().accent)} | accent ${before} -> ${await accent()} | pressed ${await ev(() => document.querySelector('#look-panel [data-val="#1f5fbf"]').getAttribute('aria-pressed'))}`);
  // a pale colour is darkened so text stays readable on white
  await ev(() => { const el = document.querySelector('#look-panel input[type=color]'); el.value = '#ffe066'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(150);
  L.push(`yellow: saved ${await ev(() => window.__carreau.T().accent)} | readable on white ${await ev(a => window.__carreau.contrastOf(a, '#ffffff') >= 4.5, await accent())}`);
  await p.click('#look-panel [data-set="accent"][data-val=""]'); await p.waitForTimeout(150);
  L.push(`default: saved "${await ev(() => window.__carreau.T().accent)}" | accent ${await accent()}`);
  // 3. club logo
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAQ0lEQVR42u3OMQ0AAAgDIN8/9K3hAyRQ3W1ZgYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMBtB2oCAQGXbiIUAAAAAElFTkSuQmCC', 'base64');
  const f = path.join(process.env.OUT, 'logo-test.png'); fs.writeFileSync(f, png);
  await p.setInputFiles('#logo-file', f); await p.waitForTimeout(800);
  L.push(`logo: preview ${await ev(() => !!document.querySelector('#look-panel .logo-prev'))} | header ${await ev(() => !!document.querySelector('.picker-btn .pb-logo'))} | stored ${await ev(() => /^data:image\/(webp|png);base64,/.test(window.__carreau.S.brand[window.__carreau.S.tid]?.logo || ''))}`);
  await p.click('[data-tab="stream"]'); await p.click('main [data-tab="display"]'); await p.waitForTimeout(100);
  L.push('big screen logo: ' + await ev(() => !!document.querySelector('.disp-logo')));
  await p.click('[data-tab="setup"]'); await p.click('[data-act="logo-remove"]'); await p.waitForTimeout(300);
  L.push('logo removed: ' + await ev(() => !document.querySelector('.pb-logo') && !document.querySelector('.logo-prev')));
  // 4. stream team colours
  await ev(() => { location.hash = 'streams'; }); await p.waitForTimeout(150);
  await p.click('[data-act="strm-new"]'); await p.waitForTimeout(300);
  L.push('stream swatches: ' + await ev(() => document.querySelectorAll('[data-set="st-color"][data-k="a"]').length));
  await p.click('[data-set="st-color"][data-k="a"][data-val="#1D3557"]'); await p.waitForTimeout(150);
  await ev(() => { const el = document.querySelector('[data-sfield="colors.b"]'); el.value = '#ffffff'; el.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(150);
  const sid = await ev(() => location.hash.split('.')[1]);
  L.push('saved colours: ' + await ev(id => JSON.stringify(window.__carreau.S.streams[id].colors), sid));
  await ev(id => { location.hash = `s.${id}.stream?o=l`; }, sid); await p.waitForTimeout(200);
  L.push('overlay: ' + await ev(() => [...document.querySelectorAll('.ov-score')].map(e => getComputedStyle(e).backgroundColor + '/' + getComputedStyle(e).color).join(' | ')));
  await ev(id => { location.hash = `s.${id}.desk`; }, sid); await p.waitForTimeout(200);
  L.push('desk: ' + await ev(() => [...document.querySelectorAll('.dk-team')].map(e => getComputedStyle(e).backgroundColor + '/' + getComputedStyle(e).color).join(' | ')));
  // 5. French
  await ev(() => { location.hash = ''; }); await p.click('[data-act="lang-menu"]'); await p.click('[data-lang="fr"]'); await p.waitForTimeout(80);
  await p.click('[data-act="theme-menu"]'); await p.waitForTimeout(60);
  L.push('french: ' + await ev(() => [document.querySelector('.theme-menu .menu-h').textContent, ...[...document.querySelectorAll('[data-theme-pick] span')].map(e => e.textContent)].join(' / ')));
  console.log(L.join('\n')); console.log('errs', errs); await b.close();
})();
