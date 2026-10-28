// Guides: the walk-through videos are served from the site, listed on #guides, linked from the welcome card, quick setup
// (the shooting one only once shooting is picked) and the footer, and play in a pop-up that Escape closes.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const c = await b.newContext({ viewport: { width: 1200, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
  const w = ms => p.waitForTimeout(ms); const log = (...a) => console.log(...a);
  await p.goto(process.env.WEB_URL); await p.waitForFunction(() => window.__carreau && window.__carreau.S.loaded, null, { timeout: 20000 }); await w(1500);
  // the welcome card shows when there's nothing to follow; earlier tests may have left competitions, so show it directly
  log('welcome link:', await p.evaluate(() => { const C = window.__carreau, S = C.S; const keep = [S.tournaments, S.tid]; S.tournaments = {}; S.tid = null; C.render();
    const t = document.querySelector('#main [data-act="guide-play"][data-id="first"]')?.innerText.replace(/\s+/g, ' ').trim() || ('NONE ' + document.querySelector('#main').innerText.slice(0, 200) + ' ' + !!S.guideLink); [S.tournaments, S.tid] = keep; C.render(); return t; }));
  log('footer link:', await p.evaluate(() => !!document.querySelector('#foot a[href="#guides"]')));
  await p.click('#foot a[href="#guides"]'); await w(800);
  const page = await p.evaluate(async () => { const cards = [...document.querySelectorAll('.guide-card')];
    await Promise.all([...document.querySelectorAll('.guide-card img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    return { h: document.querySelector('main h2')?.textContent, cards: cards.map(c => c.querySelector('b').textContent), imgs: [...document.querySelectorAll('.guide-card img')].every(i => i.naturalWidth > 0) }; });
  log(`guides page: ${page.h} | ${page.cards.join(' / ')} | posters ${page.imgs}`);
  const files = await p.evaluate(async () => Promise.all(['videos/first-competition.mp4', 'videos/shooting-competition.mp4', 'videos/team-scores.mp4'].map(async u => { const r = await fetch(u); const n = (await r.arrayBuffer()).byteLength; return `${r.status} ${r.headers.get('content-type')} ${n > 1e6}`; })));
  log('video files:', files.join(' | '));
  await p.click('.guide-card [data-act="guide-play"][data-id="shooting"]'); await w(800);
  const modal = await p.evaluate(async () => { const v = document.querySelector('#guide-modal video'); if (!v) return null;
    const can = !!v.canPlayType('video/mp4; codecs="avc1.4d401f"'); let dur = 'n/a';
    if (can) { await new Promise(r => { if (v.readyState >= 1) r(); else { v.onloadedmetadata = r; setTimeout(r, 8000); } }); dur = Math.round(v.duration) > 60; }
    return { title: document.querySelector('#guide-modal h3').textContent, src: v.getAttribute('src'), controls: v.controls, long: dur }; });
  log(`player: ${modal?.title} | ${modal?.src} | controls ${modal?.controls} | long ${modal?.long}`);
  log('player focus: inside ' + await p.evaluate(() => !!document.activeElement?.closest('#guide-modal')) + ' | page behind inert ' + await p.evaluate(() => document.querySelector('#main').inert && document.querySelector('header.app').inert));
  await p.keyboard.press('Escape'); await w(300); log('escape closes:', await p.evaluate(() => !document.getElementById('guide-modal')));
  log('after the player: focus back ' + await p.evaluate(() => document.activeElement?.matches('[data-act="guide-play"][data-id="shooting"]')) + ' | page inert ' + await p.evaluate(() => document.querySelector('#main').inert));
  await p.click('.guide-card [data-act="guide-play"][data-id="first"]'); await w(500);
  await p.mouse.click(15, 450); await w(300); log('click outside closes:', await p.evaluate(() => !document.getElementById('guide-modal')));
  await p.click('[data-act="org-back"]'); await w(500);
  // quick setup
  await p.click('[data-act="new-t"]'); await w(2500);
  const ids = () => p.evaluate(() => [...document.querySelectorAll('.wiz [data-act="guide-play"]')].map(x => x.dataset.id).join(',') || '-');
  log('wizard step 1:', await ids());
  await p.fill('#wz-name', 'Guides test'); await p.click('[data-act="wiz-next"]'); await w(400); log('step 2 triples:', await ids());
  await p.click('[data-act="wiz-set"][data-k="kind"][data-v="shooting"]'); await w(300); log('step 2 shooting:', await ids());
  await p.click('[data-act="wiz-next"]'); await w(400); log('step 3 shooting:', await ids());
  await p.click('.wiz [data-act="guide-play"]'); await w(500); log('wizard opens:', await p.evaluate(() => document.querySelector('#guide-modal video')?.getAttribute('src')), '| wizard kept:', await p.evaluate(() => !!document.querySelector('.wiz')));
  await p.click('#guide-modal [data-act="guide-close"]'); await w(300);
  // French
  await p.evaluate(() => { location.hash = 'guides'; }); await w(500);
  await p.click('[data-act="lang-menu"]').catch(() => {}); await w(200); await p.click('[data-lang="fr"]').catch(() => {}); await w(600);
  log('french:', await p.evaluate(() => document.querySelector('main h2')?.textContent + ' | ' + document.querySelector('main p.muted')?.textContent + ' | ' + [...document.querySelectorAll('main p.small')].pop()?.textContent));
  log('errs', errs); await b.close();
})();
