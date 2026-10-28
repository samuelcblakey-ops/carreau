// Sun/moon button in the header: light, dark or automatic for this device, one tap away on phones.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    q('[data-act="new-t"]').click(); await w(150);
    const btn = () => q('.theme-btn'), r = el => el.getBoundingClientRect();
    const lang = q('.lang-btn');
    L.push(`button: ${!!btn()} | label ${btn().getAttribute('aria-label')} | beside language ${Math.abs(r(btn()).top - r(lang).top) < 4 && r(btn()).right <= r(lang).left} | same height as language ${Math.round(r(btn()).height) === Math.round(r(lang).height) && r(btn()).height >= 36} | header fits ${document.documentElement.scrollWidth <= innerWidth}`);
    L.push('language menu has no theme options: ' + !q('.lang-menu [data-theme-pick]'));
    const icon = () => btn().querySelector('path')?.getAttribute('d')?.slice(0, 6);
    const autoIcon = icon();
    btn().click(); await w(60);
    const m = q('.theme-menu'); L.push(`menu open: ${!m.hidden} | options ${qa('.theme-menu [data-theme-pick]').map(x => x.dataset.themePick + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(',')} | on screen ${r(m).left >= 0 && r(m).right <= innerWidth}`);
    q('[data-act="lang-menu"]').click(); await w(60); L.push(`one menu at a time: theme ${q('.theme-menu').hidden} lang ${!q('.lang-menu').hidden}`);
    btn().click(); await w(60); L.push(`and back: theme ${!q('.theme-menu').hidden} lang ${q('.lang-menu').hidden}`);
    q('[data-theme-pick="dark"]').click(); await w(80);
    L.push(`dark: ${document.documentElement.dataset.theme} | menu closed ${q('.theme-menu').hidden} | icon changed ${icon() !== autoIcon} | saved ${localStorage.getItem('carreau-theme')}`);
    btn().click(); await w(60); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await w(60);
    L.push(`escape closes: ${q('.theme-menu').hidden} | focus back ${document.activeElement === btn()}`);
    btn().click(); await w(60); document.body.click(); await w(60); L.push('outside click closes: ' + q('.theme-menu').hidden);
    btn().click(); await w(60); q('[data-theme-pick="light"]').click(); await w(80); L.push('light: ' + document.documentElement.dataset.theme);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80);
    L.push(`french: ${btn().getAttribute('aria-label')} | ${q('.lang-btn').getAttribute('title')}`);
    q('[data-tab="setup"]').click(); await w(80);
    L.push('setup points to it: ' + (q('#look-panel p')?.textContent.includes('soleil et lune') || false));
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/sun-moon.png' }); console.log('errs', errs); await b.close();
})();
