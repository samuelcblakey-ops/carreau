// The live desk's Overlay layout editor on a 390 px phone: in the default landscape and portrait layouts no two chips
// overlap (the score bar used to sit under the info line), and dragging each chip moves its box on the overlay.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = [];
    try {
    location.hash = 'streams'; await w(150); q('[data-act="strm-new"]').click(); await w(200); const sid = location.hash.split('.')[1];
    const set = async (sel, v) => { const el = q(sel); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); await w(60); };
    await set('[data-sfield="a.name"]', 'Les Carreaux'); await set('[data-sfield="b.name"]', "Boule d'Or"); await set('[data-sfield="label"]', 'Club friendly');
    location.hash = `s.${sid}.desk`; await w(150); q('[data-act="lv-layout"]').click(); await w(60);
    const overlaps = () => { const cs = qa('.lay-chip').map(c => ({ k: c.dataset.lvdrag, r: c.getBoundingClientRect() })); const hit = [];
      cs.forEach((a, i) => cs.slice(i + 1).forEach(b => { if (a.r.left < b.r.right && b.r.left < a.r.right && a.r.top < b.r.bottom && b.r.top < a.r.bottom) hit.push(a.k + '+' + b.k); })); return hit; };
    const sizes = () => qa('.lay-chip').map(c => { const r = c.getBoundingClientRect(); return `${c.dataset.lvdrag} ${Math.round(r.width)}x${Math.round(r.height)}`; }).join(', ');
    for (const lo of ['l', 'p']) {
      q(`[data-act="lv-lo"][data-lo="${lo}"]`).click(); await w(80);
      const hit = overlaps(); L.push(`${lo === 'l' ? 'landscape' : 'portrait'} default at 390: overlaps ${hit.length ? hit.join(', ') : 'none'} | ${sizes()} | preview ${Math.round(q('#lay-prev').getBoundingClientRect().width)}`);
    }
    // drag each chip somewhere new, then the overlay puts that box there
    const res = [];
    for (const lo of ['l', 'p']) for (const [k, to] of [['bar', [50, 20]], ['line', [30, 40]], ['card', [70, 60]]]) {
      location.hash = `s.${sid}.desk`; await w(150); if (!q('#lay-prev')) { q('[data-act="lv-layout"]').click(); await w(60); }
      q(`[data-act="lv-lo"][data-lo="${lo}"]`).click(); await w(80);
      const chip = q(`[data-lvdrag="${k}"]`), box = q('#lay-prev').getBoundingClientRect(), r0 = chip.getBoundingClientRect();
      const ev = (type, x, y) => chip.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
      const x = box.left + box.width * to[0] / 100, y = box.top + box.height * to[1] / 100;
      ev('pointerdown', r0.left + r0.width / 2, r0.top + r0.height / 2); ev('pointermove', x, y); ev('pointerup', x, y); await w(120);
      const saved = S.streams[sid].live.layout?.[lo]?.[k];
      // the overlay (with a card showing, so all three boxes are there)
      S.streams[sid].live.card = { k: 'a0', text: 'Carreau', sub: 'Marc', at: Date.now() };
      location.hash = `s.${sid}.stream?o=${lo}`; await w(150);
      const el = q(`.ov-${k}`); const at = el ? [parseFloat(el.style.left), parseFloat(el.style.top)] : null;
      res.push(`${lo} ${k} ${at && Math.abs(at[0] - to[0]) < 1.5 && Math.abs(at[1] - to[1]) < 1.5 && saved ? 'moved' : 'NOT MOVED ' + JSON.stringify({ saved, at })}`);
    }
    L.push('drag moves box: ' + res.join(' | '));
    location.hash = `s.${sid}.desk`; await w(150); if (!q('#lay-prev')) { q('[data-act="lv-layout"]').click(); await w(60); }
    for (const lo of ['p', 'l']) { q(`[data-act="lv-lo"][data-lo="${lo}"]`).click(); await w(80); q('[data-act="lv-lay-reset"]').click(); await w(150); }
    L.push('after reset: landscape overlaps ' + (overlaps().join(', ') || 'none')); q('#lay-prev').scrollIntoView({ block: 'center' });
    } catch (e) { L.push('ERR ' + e.message); }
    return L; });
  await p.screenshot({ path: process.env.OUT + '/overlay-layout-landscape-390.png' });
  await p.evaluate(async () => { document.querySelector('[data-act="lv-lo"][data-lo="p"]').click(); await new Promise(r => setTimeout(r, 100)); document.querySelector('#lay-prev').scrollIntoView({ block: 'center' }); });
  await p.screenshot({ path: process.env.OUT + '/overlay-layout-portrait-390.png' });
  console.log(out.join('\n')); console.log('errs', JSON.stringify(errs)); await b.close();
})();
