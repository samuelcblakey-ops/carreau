// Standalone streams: a game outside any competition. Menu, set-up page (names, players, format, piste), links, desk and overlay.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = [];
    const set = async (sel, v) => { const el = q(sel); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); await w(60); };
    // 1. entry points
    L.push('welcome link: ' + !!q('a[href="#streams"]'));
    q('[data-act="new-t"]').click(); await w(80);
    L.push('tabs: ' + qa('#tabs [data-tab]').map(e => e.dataset.tab).join(',') + ' | no big screen tab ' + !q('#tabs [data-tab="display"]'));
    q('[data-tab="stream"]').click(); await w(60);
    L.push('stream tab: ' + q('h2').textContent + ' | new stream ' + !!q('[data-act="strm-new"]') + ' | comp games panel ' + !!q('#stream-panel') + ' | big screen button ' + !!q('main [data-tab="display"]'));
    q('main [data-tab="display"]').click(); await w(60); L.push('big screen: ' + !!q('.disp') + ' tab highlighted none ' + !q('#tabs [aria-current="true"]'));
    // 2. menu → new stream
    location.hash = 'streams'; await w(150);
    L.push('home: ' + !!q('[data-act="strm-new"]') + ' picker closed ' + !S.picker + ' | ' + (q('h2')?.textContent));
    q('[data-act="strm-new"]').click(); await w(200);
    const sid = location.hash.split('.')[1]; const st = () => S.streams[sid];
    L.push('created: ' + /^#s\./.test(location.hash) + ' ' + !!st() + ' | title ' + q('h2').textContent + ' | player boxes ' + qa('[data-sfield^="a.p"]').length);
    // 3. set-up fields
    await set('[data-sfield="a.name"]', 'Les Carreaux'); await set('[data-sfield="a.p0"]', 'Marc Dupont'); await set('[data-sfield="a.p1"]', 'Sophie Martin');
    await set('[data-sfield="b.name"]', "Boule d'Or"); await set('[data-sfield="b.p0"]', 'Pierre Lefèvre'); await set('[data-sfield="b.p1"]', 'Aline Rossi');
    await set('[data-sfield="label"]', 'Club friendly'); await set('[data-sfield="piste"]', '3'); await set('[data-sfield="target"]', '11');
    L.push(`saved: ${st().a.name} / ${st().a.players.join('+')} v ${st().b.name} / ${st().b.players.join('+')} | ${st().label} piste ${st().piste} to ${st().target} | title ${q('h2').textContent}`);
    q('[data-set="st-format"][data-val="triples"]').click(); await w(80); L.push('triples: ' + st().format + ' boxes ' + qa('[data-sfield^="a.p"]').length);
    q('[data-set="st-format"][data-val="doubles"]').click(); await w(80);
    L.push('links: ' + qa('#stream-links input').map(i => i.value.split('#')[1]).join(' ') + ' | desk href ' + q('#stream-links a.btn.primary').getAttribute('href').split('#')[1]);
    q(`[data-act="lv-links"]`).click(); await w(60); L.push('more links: ' + qa('#stream-links input').length);
    // 4. the desk
    location.hash = `s.${sid}.desk`; await w(150);
    L.push('desk: ' + document.body.classList.contains('desk') + ' | ' + q('.dk-title').textContent + ' | ' + qa('.dk-team').map(e => e.textContent).join(' v ') + ' | to ' + q('.dk-mid .small').textContent + ' | boules ' + qa('.dk-boule .small').map(e => e.textContent).join(' / '));
    q('[data-act="lv-boule"][data-side="b"]').click(); await w(40); q('[data-act="lv-hold"][data-side="b"]').click(); await w(40);
    q('[data-act="lv-win"][data-side="a"]').click(); await w(40); q('[data-act="lv-pts"][data-n="4"]').click(); await w(80);
    L.push(`end: ${st().live.sa}-${st().live.sb} ends ${st().live.ends.length} | shown ${qa('.dk-num').map(e => e.textContent).join('-')}`);
    q('[data-act="lv-stats"]').click(); await w(40); L.push('players: ' + qa('.dk-player .who b').map(e => e.textContent).join(', '));
    q('[data-act="lv-ev"][data-k="b0"][data-r="carreau"]').click(); await w(60);
    // 5. the overlay
    location.hash = `s.${sid}.stream?o=l`; await w(150);
    L.push(`overlay: ${document.body.classList.contains('stream')} ${qa('.ov-name').map(e => e.textContent.trim()).join(' v ')} ${qa('.ov-score').map(e => e.textContent).join('-')} end ${q('.ov-end').textContent} | line: ${q('.ov-line').textContent.replace(/\s+/g, ' ').trim()} | card ${q('.ov-card')?.textContent.replace(/\s+/g, ' ').trim()}`);
    // 6. finish, then new game keeps the layout
    location.hash = `s.${sid}.desk`; await w(150);
    q('[data-act="lv-layout"]').click(); await w(40);
    const chip = q('[data-lvdrag="line"]'); const box = q('#lay-prev').getBoundingClientRect(); const r0 = chip.getBoundingClientRect();
    const ev = (type, x, y) => chip.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
    ev('pointerdown', r0.left + 5, r0.top + 5); ev('pointermove', box.left + box.width * 0.5, box.top + box.height * 0.1); ev('pointerup', box.left + box.width * 0.5, box.top + box.height * 0.1); await w(80);
    q('[data-act="lv-win"][data-side="a"]').click(); await w(40); L.push('capped at 11: ' + qa('.dk-pts button').length); q('[data-act="lv-pts"][data-n="6"]').click(); await w(80);
    q('[data-act="lv-win"][data-side="b"]').click(); await w(40); q('[data-act="lv-pts"][data-n="1"]').click(); await w(80);
    q('[data-act="lv-win"][data-side="a"]').click(); await w(40); q('[data-act="lv-pts"][data-n="1"]').click(); await w(80);
    L.push('finish: ' + q('[data-act="lv-finish"]').textContent + ' ' + !q('[data-act="lv-finish"]').disabled);
    q('[data-act="lv-finish"]').click(); await w(100);
    L.push(`over: ${st().live.done} | notice ${q('.desk .notice')?.textContent.replace(/\s+/g, ' ').trim()} | new game button ${!!q('[data-act="lv-newgame"]')}`);
    q('[data-act="lv-newgame"]').click(); await w(100);
    L.push(`new game: ${st().live.sa}-${st().live.sb} done ${st().live.done} layout kept ${JSON.stringify(st().live.layout)}`);
    // 7. list, reset and delete
    location.hash = 'streams'; await w(150); L.push('list: ' + qa('.erow .who b').map(e => e.textContent).join(' | '));
    location.hash = `s.${sid}`; await w(150); q('[data-act="strm-del"]').click(); await w(40); q('[data-act="strm-del-yes"]').click(); await w(150);
    L.push('deleted: ' + !S.streams[sid] + ' ' + location.hash);
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
