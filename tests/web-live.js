// Live streaming on the website: overlay readable by anyone, live desk writable by organisers and by a phone with the stream code only.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const mk = async (n, vw = 1100, vh = 900) => { const c = await b.newContext({ viewport: { width: vw, height: vh } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const has = (p, sel) => p.evaluate(s => !!document.querySelector(s), sel);
  const AD = await mk('admin'); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  await AD.evaluate(() => window.__testSetSite({ streaming: true })); await w(1500); // streaming is off by default
  const A = await mk('organiser'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(() => location.hash.slice(1));
  await A.click('[data-act="wiz-skip"]'); await w(800); await A.click('[data-tab="entries"]'); await w(400); // a new competition opens on the quick setup
  await A.fill('#bulk', 'Les Carreaux: Marc Dupont, Sophie Martin\nBoule d\'Or: Pierre Lefèvre, Aline Rossi\nGravier Collines: Cc, Dd\nMistral Lions: Ee, Ff'); await A.click('#bulk-form button[type=submit]'); await w(1200);
  await A.click('[data-act="checkin-all"]'); await w(800);
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="first-draw"]'); await w(2500);
  const g = await A.evaluate(() => window.__carreau.MS().filter(m => m.a && m.b).sort((x, y) => x.order - y.order)[0].id);
  await A.click('[data-tab="setup"]'); await w(1500); await A.click('[data-tab="stream"]'); await w(2000); // the stream code is created the first time Setup opens
  await A.click(`[data-act="lv-links"][data-id="${g}"]`); await w(500);
  const links = await A.evaluate(() => Object.fromEntries([...document.querySelectorAll('.lv-links input')].map(i => [i.getAttribute('aria-label'), i.value])));
  log('streaming panel:', await has(A, '#stream-panel'), '| desk link has code:', /\.desk\.[^.]+\.[A-Z2-9]{8}$/.test(links['Live desk link']), '| overlay link:', /\.stream\./.test(links['Overlay (everything)']));
  await AD.click('[data-act="open-testing"]'); await w(2500); // strict mode: the rules decide who can write
  // a spectator's phone loads the overlay: transparent page, score bar, no account needed; it can't write the live doc
  const V = await mk('viewer', 1280, 720); await V.goto(links['Overlay (everything)']); await w(4000);
  log('overlay:', await V.evaluate(() => document.body.classList.contains('stream') + ' ' + getComputedStyle(document.body).backgroundColor + ' ' + [...document.querySelectorAll('.ov-name')].map(e => e.textContent.trim()).join(' v ') + ' ' + [...document.querySelectorAll('.ov-score')].map(e => e.textContent).join('-')));
  log('viewer write:', await V.evaluate(async id => { try { await window.__carreau.S.store.setLive(window.__carreau.S.tid, id, { sa: 9, sb: 9 }); return 'WROTE'; } catch (e) { return e.code; } }, g));
  // a helper opens the live desk link: joins with the stream code, runs the desk, but has no organiser rights
  const H = await mk('helper', 390, 844); await H.goto(links['Live desk link']); await w(5000);
  log('helper joined:', await H.evaluate(() => location.hash + ' ' + window.__carreau.S.liveRole(window.__carreau.T()) + ' canScore ' + window.__carreau.S.permFn(window.__carreau.T()).score));
  await H.click('[data-act="lv-boule"][data-side="a"]'); await w(300); await H.click('[data-act="lv-win"][data-side="a"]'); await w(200); await H.click('[data-act="lv-pts"][data-n="2"]'); await w(2500);
  log('helper end:', await H.evaluate(id => { const L = window.__carreau.S.live[id]; return `${L.sa}-${L.sb} ends ${L.ends.length}`; }, g), '| no finish button:', !(await has(H, '[data-act="lv-finish"]')));
  log('helper match write:', await H.evaluate(async id => { try { await window.__carreau.S.store.updateMatch(window.__carreau.S.tid, id, { sa: 13, sb: 0, done: true }); return 'WROTE'; } catch (e) { return e.code; } }, g));
  await w(1500);
  log('overlay follows:', await V.evaluate(() => [...document.querySelectorAll('.ov-score')].map(e => e.textContent).join('-') + ' end ' + document.querySelector('.ov-end').textContent + ' dots ' + document.querySelectorAll('.ov-team.a .ov-dot.on').length));
  await V.screenshot({ path: process.env.OUT + '/web-overlay.png' });
  // the organiser's desk: finish the game and the result lands on the board
  await A.goto(base + '#' + tid + '.desk.' + g); await w(3000);
  log('organiser desk:', await A.evaluate(() => document.body.classList.contains('desk') + ' ' + [...document.querySelectorAll('.dk-num')].map(e => e.textContent).join('-')));
  for (const n of [6, 5]) { await A.click('[data-act="lv-win"][data-side="a"]'); await w(150); await A.click(`[data-act="lv-pts"][data-n="${n}"]`); await w(800); }
  log('organiser finish:', await A.textContent('[data-act="lv-finish"]'));
  await A.click('[data-act="lv-finish"]'); await w(3000);
  log('result:', await A.evaluate(id => { const m = window.__carreau.S.matches[id]; return `${m.done} ${m.sa}-${m.sb}`; }, g), '| overlay final:', await V.evaluate(() => document.querySelector('.ov-lbl').textContent + ' ' + [...document.querySelectorAll('.ov-score')].map(e => e.textContent).join('-')));
  await AD.click('[data-act="open-testing"]'); await w(1000); await AD.evaluate(() => window.__testSetSite({ streaming: false })); await w(1000); // back to the defaults
  log('errs', errs); await b.close();
})();
