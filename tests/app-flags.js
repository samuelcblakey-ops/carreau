// Nation flags show on every device, Windows included: the bundled "Twemoji Country Flags" font comes first in every
// font stack, but its unicode-range covers only flag characters, so everything else stays Barlow. A draw with
// "🇮🇹 Italy (ITA)" v "🇨🇦 Canada (CAN)" at 390 px: flags sit on the text line and the row height barely changes.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = [];
    const face = [...document.fonts].find(f => /Twemoji Country Flags/.test(f.family));
    L.push('flag font face: ' + (face ? face.family.replace(/["']/g, '') : 'none') + ' | range ' + (face && face.unicodeRange));
    const stacks = ['--body', '--display'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim());
    L.push('flag font first in stacks: ' + stacks.every(s => /^["']?Twemoji Country Flags/.test(s)));
    await document.fonts.load('16px "Twemoji Country Flags"', '🇮🇹');
    L.push('flag font used for 🇮🇹: ' + (face.status === 'loaded' && document.fonts.check('16px "Twemoji Country Flags"', '🇮🇹')));
    // latin text: the flag face has no Latin in its range, so "Italy" goes on to Barlow (same width as Barlow alone)
    await document.fonts.load('16px Barlow', 'Italy'); const cv = document.createElement('canvas').getContext('2d');
    const wd = f => { cv.font = f; return cv.measureText('Italy (ITA) Canada').width; };
    L.push('latin text still Barlow: ' + (Math.abs(wd('16px "Twemoji Country Flags", Barlow') - wd('16px Barlow')) < 0.01 && Math.abs(wd('16px Barlow') - wd('16px monospace')) > 1));
    // a draw with flags at phone width
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Worlds 2026', system: 'swiss', format: 'triples', checkin: false, swissRounds: 3, wizard: false });
    [['A', 'Italy (ITA)'], ['B', 'Canada (CAN)'], ['C', 'France (FRA)'], ['D', 'Thailand (THA)']].forEach(([id, name]) => t.teams.push({ id, name, players: [], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    // name the first game's teams Italy and Canada so the screenshot shows them together
    const g = C.MS().filter(m => m.a && m.b && !m.bye).sort((x, y) => x.order - y.order); const nm = { [g[0].a]: 'Italy (ITA)', [g[0].b]: 'Canada (CAN)', [g[1].a]: 'France (FRA)', [g[1].b]: 'Thailand (THA)' };
    const fl0 = { 'Italy (ITA)': '🇮🇹', 'Canada (CAN)': '🇨🇦', 'France (FRA)': '🇫🇷', 'Thailand (THA)': '🇹🇭' };
    C.T().teams.forEach(x => { x.name = nm[x.id]; });
    C.render(); await w(100);
    const rowOf = name => { const el = [...document.querySelectorAll('main *')].filter(e => e.children.length === 0 && e.textContent.includes(name))[0]; let r = el; while (r && r.parentElement && r.parentElement.getBoundingClientRect().height < 120 && r.parentElement.tagName !== 'MAIN') r = r.parentElement; return { el, r }; };
    const plain = rowOf('Italy (ITA)'); const h0 = plain.r.getBoundingClientRect().height;
    C.T().teams.forEach(x => { x.name = fl0[x.name] + ' ' + x.name; }); C.render(); await w(100);
    await document.fonts.ready; await w(100);
    const fl = rowOf('🇮🇹 Italy (ITA)'); const h1 = fl.r.getBoundingClientRect().height;
    const tl = fl.el.getBoundingClientRect(); L.push('draw shows flags: ' + !!fl.el + ' | flag font loaded ' + (face.status === 'loaded'));
    L.push(`row height plain ${Math.round(h0)} flags ${Math.round(h1)} | grew ≤4px ${h1 - h0 <= 4} | one line ${tl.height < 30}`);
    fl.r.scrollIntoView({ block: 'center' }); await w(100);
    L.push('no sideways scroll: ' + (document.documentElement.scrollWidth <= innerWidth));
    return L; });
  console.log(out.join('\n'));
  await p.screenshot({ path: process.env.OUT + '/flags-draw-390.png' });
  await p.setViewportSize({ width: 1280, height: 800 }); await p.waitForTimeout(200); await p.screenshot({ path: process.env.OUT + '/flags-draw-desktop.png' });
  console.log('errs', JSON.stringify(errs)); await b.close();
})();
