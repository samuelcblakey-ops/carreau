// Long team names on the stream overlay stay whole while a team holds the point: the holding dot has its room and a
// name too long for its box is shrunk to fit, not cut off. Landscape (1280x720) and portrait (720x1280), 13 to 16 letters.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const pairs = [['Les Pointeurs', 'Boule Lyonnaise'], ['Pétanque Royale', "Les Tireurs d'Or"], ['Carreau du Midi', 'Les Bouchonnes']];
  const sid = await p.evaluate(async () => { const S = window.__carreau.S, w = ms => new Promise(r => setTimeout(r, ms));
    location.hash = 'streams'; await w(150); document.querySelector('[data-act="strm-new"]').click(); await w(200); return location.hash.split('.')[1]; });
  // every name whole (not cut, not ellipsed), and the dot shown next to the holding team's name
  const look = (names, hold) => p.evaluate(async ([sid, names, hold]) => { const S = window.__carreau.S, w = ms => new Promise(r => setTimeout(r, ms));
    const st = S.streams[sid]; st.a.name = names[0]; st.b.name = names[1]; st.live = Object.assign(st.live || {}, { sa: 7, sb: 12, ends: [], events: [], hist: [], thrown: { a: 1, b: 0 }, holding: hold, layout: {} });
    window.__carreau.render(); await w(150);
    const spans = [...document.querySelectorAll('.ov-name>span')];
    const inside = s => { const r = s.getBoundingClientRect(), box = s.closest('.ov-tinfo').getBoundingClientRect(); return r.left >= box.left - 1 && r.right <= box.right + 1; };
    const cut = spans.filter(s => s.scrollWidth > s.clientWidth + 1 || !inside(s)).map(s => s.textContent);
    const dot = [...document.querySelectorAll('.ov-team')].map(t => { const j = t.querySelector('.ov-jack'); return j && getComputedStyle(j).visibility !== 'hidden' && j.getBoundingClientRect().width > 0 ? t.classList[1] : ''; }).join('');
    return { cut, dot, sizes: spans.map(s => Math.round(parseFloat(getComputedStyle(s).fontSize))) }; }, [sid, names, hold]);
  for (const [o, vw, vh] of [['l', 1280, 720], ['p', 720, 1280]]) {
    await p.setViewportSize({ width: vw, height: vh }); await p.evaluate(([sid, o]) => { location.hash = `s.${sid}.stream?o=${o}`; }, [sid, o]); await p.waitForTimeout(200);
    const res = []; let cut = [], dots = true;
    for (const names of pairs) for (const hold of ['a', 'b', null]) { const r = await look(names, hold); cut = cut.concat(r.cut); if (r.dot !== (hold || '')) dots = false; res.push(r.sizes.join('/')); }
    console.log(`${o === 'l' ? 'landscape 1280x720' : 'portrait 720x1280'}: truncated ${cut.length ? cut.join(', ') : 'none'} | holding dot visible ${dots}`);
    await look(pairs[0], 'a'); await p.screenshot({ path: process.env.OUT + `/overlay-long-names-${o}.png` });
    await look(pairs[1], 'b'); await p.screenshot({ path: process.env.OUT + `/overlay-long-names-${o}-b.png` });
  }
  console.log('errs', JSON.stringify(errs)); await b.close();
})();
