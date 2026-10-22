// Live streaming: the live desk (boules, holding, ends, player stats, undo, finish) and the transparent overlay it feeds.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = [];
    q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Stream test', system: 'swiss', format: 'doubles', checkin: false, swissRounds: 3, wizard: false });
    [['A', 'Les Carreaux', ['Marc Dupont', 'Sophie Martin']], ['B', "Boule d'Or", ['Pierre Lefèvre', 'Aline Rossi']], ['C', 'Team C', ['Cc', 'Dd']], ['D', 'Team D', ['Ee', 'Ff']]].forEach(([id, name, players]) => t.teams.push({ id, name, players, active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(300);
    // fix the pairings so the names are predictable: A v B, C v D
    const gs = C.MS().filter(m => m.a && m.b && !m.bye).sort((x, y) => x.order - y.order);
    await S.store.setMatch(t.id, Object.assign(gs[0], { a: ['A'], b: ['B'] })); await S.store.setMatch(t.id, Object.assign(gs[1], { a: ['C'], b: ['D'] })); await w(60);
    const g = S.matches[gs[0].id];
    // 1. Setup shows the streaming panel with links for the game
    q('[data-tab="setup"]').click(); await w(60);
    L.push('setup panel: ' + !!q('#stream-panel') + ' | desk link: ' + q('#stream-panel a.btn')?.getAttribute('href').endsWith(`#${t.id}.desk.${g.id}`));
    q(`[data-act="lv-links"][data-id="${g.id}"]`).click(); await w(60);
    L.push('overlay links: ' + qa('.lv-links input').map(i => i.value.split('#')[1]).join(' '));
    // 2. the live desk
    location.hash = `${t.id}.desk.${g.id}`; await w(150);
    L.push('desk: ' + document.body.classList.contains('desk') + ' header hidden: ' + (getComputedStyle(q('header.app')).display === 'none') + ' | ' + q('.dk-title').textContent + ' | nums ' + qa('.dk-num').map(e => e.textContent).join('-'));
    L.push('boules: ' + qa('.dk-boule .small').map(e => e.textContent).join(' / '));
    q('[data-act="lv-boule"][data-side="a"]').click(); await w(40); q('[data-act="lv-boule"][data-side="a"]').click(); await w(40); q('[data-act="lv-boule"][data-side="b"]').click(); await w(40);
    q('[data-act="lv-hold"][data-side="a"]').click(); await w(40);
    let Lv = S.live[g.id];
    L.push(`after boules: thrown ${Lv.thrown.a}-${Lv.thrown.b} holding ${Lv.holding} | dots on ${q('[data-act="lv-boule"][data-side="a"] .dk-dots').querySelectorAll('i.on').length}`);
    // end: Les Carreaux win 2
    L.push('question: ' + q('.desk .small.muted[style]').textContent + ' | pts hidden: ' + !q('.dk-pts'));
    q('[data-act="lv-win"][data-side="a"]').click(); await w(40);
    L.push('after winner: ' + q('.desk .small.muted[style]').textContent + ' | pts: ' + qa('.dk-pts button').length);
    q('[data-act="lv-pts"][data-n="2"]').click(); await w(80);
    Lv = S.live[g.id];
    L.push(`end saved: ${Lv.sa}-${Lv.sb} ends ${Lv.ends.length} thrown ${Lv.thrown.a}-${Lv.thrown.b} holding ${Lv.holding} | shown ${qa('.dk-num').map(e => e.textContent).join('-')} end ${q('.dk-end').textContent} | match live score ${S.matches[g.id].sa}-${S.matches[g.id].sb}`);
    // player stats + carreau card
    q('[data-act="lv-stats"]').click(); await w(40);
    L.push('players: ' + qa('.dk-player .who b').map(e => e.textContent).join(', '));
    q('[data-act="lv-ev"][data-k="a0"][data-r="carreau"]').click(); await w(40); q('[data-act="lv-ev"][data-k="a0"][data-r="miss"]').click(); await w(40); q('[data-act="lv-ev"][data-k="b1"][data-r="holding"]').click(); await w(40);
    Lv = S.live[g.id];
    L.push(`events ${Lv.events.length} card ${Lv.card?.text} ${Lv.card?.sub} | a0 line: ${q('.dk-player .who .small').textContent}`);
    // the overlay shows the card while it's fresh
    location.hash = `${t.id}.stream.${g.id}`; await w(150); L.push(`card on overlay: ${!!q('.ov-card')} ${q('.ov-card')?.textContent.replace(/\s+/g, ' ').trim()}`); location.hash = `${t.id}.desk.${g.id}`; await w(150);
    if (!q('[data-act="lv-undo"]')) L.push('desk lost');
    // undo twice: removes the holding event, then the miss
    q('[data-act="lv-undo"]').click(); await w(40); q('[data-act="lv-undo"]').click(); await w(40);
    Lv = S.live[g.id]; L.push(`undo: events ${Lv.events.length} last ${Lv.events[Lv.events.length - 1].r} score ${Lv.sa}-${Lv.sb}`);
    // layout editor: drag the score bar
    q('[data-act="lv-layout"]').click(); await w(40);
    const chip = q('[data-lvdrag="bar"]'); const box = q('#lay-prev').getBoundingClientRect(); const r0 = chip.getBoundingClientRect();
    const ev = (type, x, y) => chip.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
    ev('pointerdown', r0.left + 5, r0.top + 5); ev('pointermove', box.left + box.width * 0.5, box.top + box.height * 0.2); ev('pointerup', box.left + box.width * 0.5, box.top + box.height * 0.2); await w(80);
    Lv = S.live[g.id]; L.push('layout saved: ' + JSON.stringify(Lv.layout));
    // 3. the overlay
    location.hash = `${t.id}.stream.${g.id}`; await w(150);
    const ov = q('.ov');
    L.push(`overlay: ${document.body.classList.contains('stream')} transparent ${getComputedStyle(document.body).backgroundColor} class ${ov.className} boxes ${qa('.ov-box').length}`);
    L.push(`bar: ${qa('.ov-name').map(e => e.textContent.trim()).join(' v ')} ${qa('.ov-score').map(e => e.textContent).join('-')} end ${q('.ov-end').textContent} dots on ${qa('.ov-team.a .ov-dot.on').length}/${qa('.ov-team.a .ov-dot').length} | bar top ${q('.ov-bar').style.top}`);
    L.push(`line: ${q('.ov-line').textContent.replace(/\s+/g, ' ').trim()} | card ${!!q('.ov-card')} ${q('.ov-card')?.textContent.trim()}`);
    location.hash = `${t.id}.stream.${g.id}?parts=bar&o=p`; await w(150); L.push(`portrait bar only: ${q('.ov').className} boxes ${qa('.ov-box').length} end in line hidden ${!q('.ov-line')}`);
    location.hash = `${t.id}.stream.${g.id}?parts=line&o=p`; await w(150); L.push('portrait line: ' + q('.ov-line').textContent.replace(/\s+/g, ' ').trim());
    // 4. finish the game from the desk (14 more points for A) and the result lands on the board
    location.hash = `${t.id}.desk.${g.id}`; await w(150);
    q('[data-act="lv-win"][data-side="a"]').click(); await w(30); q('[data-act="lv-pts"][data-n="6"]').click(); await w(60);
    L.push('finish enabled at 8: ' + !q('[data-act="lv-finish"]').disabled);
    q('[data-act="lv-win"][data-side="b"]').click(); await w(30); q('[data-act="lv-pts"][data-n="1"]').click(); await w(60);
    q('[data-act="lv-win"][data-side="a"]').click(); await w(30); L.push('points capped at 13: ' + qa('.dk-pts button').length); q('[data-act="lv-pts"][data-n="5"]').click(); await w(60);
    L.push('finish button: ' + q('[data-act="lv-finish"]').textContent + ' enabled ' + !q('[data-act="lv-finish"]').disabled);
    q('[data-act="lv-finish"]').click(); await w(200);
    const m = S.matches[g.id]; L.push(`result: done ${m.done} ${m.sa}-${m.sb} piste freed ${!m.court} | desk over: ${!!q('.desk .notice')} | live done ${S.live[g.id].done}`);
    // 5. French
    location.hash = `${t.id}.stream.${g.id}`; await w(150); q('[data-lang="fr"]')?.click(); C.S.liveRoute && (window.__carreau.S.liveRoute = C.parseLiveHash()); localStorage.setItem('carreau-lang', 'fr');
    return L; });
  // French needs a reload (language is read at start); check the overlay label
  await p.reload(); await p.waitForTimeout(400);
  const fr = await p.evaluate(() => document.querySelector('.ov-lbl')?.textContent + ' | ' + document.querySelector('.ov-line')?.textContent.replace(/\s+/g, ' ').trim());
  console.log(out.join('\n')); console.log('french: ' + fr);
  await p.setViewportSize({ width: 1280, height: 720 }); await p.waitForTimeout(300); await p.screenshot({ path: process.env.OUT + '/overlay-landscape.png' });
  await p.setViewportSize({ width: 540, height: 960 }); await p.waitForTimeout(300); await p.screenshot({ path: process.env.OUT + '/overlay-portrait.png' });
  await p.evaluate(() => { localStorage.setItem('carreau-lang', 'en'); location.hash = location.hash.replace('.stream.', '.desk.'); }); await p.setViewportSize({ width: 400, height: 860 }); await p.waitForTimeout(300); await p.screenshot({ path: process.env.OUT + '/live-desk.png', fullPage: true });
  console.log('errs', errs); await b.close();
})();
