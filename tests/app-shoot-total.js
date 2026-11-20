// Precision shooting: a result entered as a total only (mirroring published results without the 20 shots).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.exposeFunction('snap', async n => { await p.setViewportSize({ width: 390, height: 900 }); await p.waitForTimeout(100); await p.screenshot({ path: (process.env.OUT || 'test-results') + '/' + n + '.png', fullPage: true }); await p.setViewportSize({ width: 1100, height: 900 }); });
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const AT = ['A1', 'A2', 'A3', 'A4', 'A5'];
    const shots = (f, th) => { const v = Array.from({ length: 20 }, (_, i) => i < f ? 5 : i < f + th ? 3 : 0); return Object.fromEntries(AT.map((k, ai) => [k, v.slice(ai * 4, ai * 4 + 4)])); };
    const mk = async (cfg, names) => { q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, cfg, { checkin: false, wizard: false, entry: 'shooting', system: 'knockout', format: 'singles', seeding: 'entry' });
      names.forEach((n, i) => t.players.push({ id: 'p' + i, name: n, active: true })); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); };
    const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    const name = id => C.T().players.find(x => x.id === id).name;
    const totIn = async (vals) => { qa('#modal [data-tot]').forEach((i, k) => { i.value = vals[k]; }); };
    const save = async () => { q('#modal [data-act="shoot-save"][data-final="1"]').click(); await w(150); };

    // 1. qualifying, final for the top 2
    await mk({ shootFormat: 'final', shootFinal: 2, name: 'Totals' }, ['Ann', 'Bob', 'Cat', 'Dan']);
    await tab('draw'); q('[data-act="first-draw"]').click(); await w(120);
    q('[data-shoot="Q-p0"]').click(); await w(80); L.push('opens live: ' + !!S.modal.live); q('#modal [data-act="shoot-mode"]').click(); await w(60);
    L.push('link: ' + q('#modal [data-act="tot-mode"]')?.textContent);
    q('#modal [data-act="tot-mode"]').click(); await w(60);
    L.push('total box: ' + qa('#modal [data-tot]').length + ' | label ' + q('#modal [data-tot]').closest('label').querySelector('span').textContent + ' | grid ' + !!q('#modal table.shots') + ' | back ' + q('#modal [data-act="tot-mode"]').textContent + ' | save ' + q('#modal [data-act="shoot-save"]').textContent);
    await window.snap('shoot-total-box');
    await totIn(['64']); await save();
    let m = C.MS().find(x => x.id === 'Q-p0'); L.push(`stored: shotTotal ${m.shotTotal} sa ${m.sa} done ${m.done} shots ${JSON.stringify(m.shots)}`);
    L.push('next opens in total mode: ' + !!q('#modal [data-tot]') + ' | ' + (q('#modal .notice.small')?.textContent || ''));
    await totIn(['71']); await save(); await totIn(['58']); await save();
    for (const v of ['101', '64.5', '', '-3']) { await totIn([v]); await save(); L.push('bad total: ' + (q('#modal .err')?.textContent || 'none') + ' [' + v + ']'); }
    q('#modal [data-act="close"]').click(); await w(60); C.render(); await w(40);
    const qPanel = () => qa('main .panel').find(x => x.querySelector('h3')?.textContent === 'Qualifying round');
    const annRow = [...qPanel().querySelectorAll('tbody tr')].find(tr => tr.innerText.includes('Ann'));
    L.push('total only qualifying: Ann ' + annRow.querySelectorAll('td')[7].innerText.replace(/\s+/g, ' ').trim());
    L.push('ranking with totals: ' + C.shootRanking(C.T(), 'Q').filter(r => r.done).map(r => `${name(r.id)} ${r.total}`).join(', '));
    // 2. Dan's 64 is level with Ann's total-only 64: no count-back, shoot-out
    q('[data-shoot="Q-p3"]').click(); await w(80); if (!q('#modal [data-tot]')) { if (S.modal.live) { q('#modal [data-act="shoot-mode"]').click(); await w(60); } q('#modal [data-act="tot-mode"]').click(); await w(60); }
    await totIn(['64']); await save(); q('#modal [data-act="close"]')?.click(); await w(60); C.render(); await w(40);
    L.push('total-only tie: ' + (q('.so-alert') ? 'shoot-out needed' : 'no alert') + ' | ' + (q('.so-alert')?.innerText.replace(/\s+/g, ' ').match(/· (\w+, \w+) ·/)?.[1] || '') + ' | next blocked ' + !q('[data-act="shoot-next"]') + ' | ' + (q('.so-alert')?.innerText.match(/Level on[^.]*\./)?.[0] || ''));
    q('[data-act="so-open"]').click(); await w(60); L.push('shoot-out box: ' + q('#modal p.small.muted').textContent); q('#modal [data-act="close"]').click(); await w(60);
    // mixed: Dan by shots (64: twelve 5s, four 1s) is still level with Ann's total: no count-back
    { const sh = shots(12, 0); sh.A5 = [1, 1, 1, 1]; await S.store.updateMatch(S.tid, 'Q-p3', { shots: sh, sa: C.shotTotal(sh), shotTotal: null, done: true }); await w(60); C.render(); await w(40); }
    L.push('mixed tie: Dan ' + C.shotTotal(C.MS().find(x => x.id === 'Q-p3').shots) + ' | ' + (q('.so-alert') ? 'shoot-out needed' : 'no alert'));
    await window.snap('shoot-total-draw');
    // 3. back to shot by shot replaces a saved total
    q('[data-shoot="Q-p2"]').click(); await w(80);
    L.push('reopen: total box ' + (q('#modal [data-tot]')?.value || 'none'));
    q('#modal [data-act="tot-mode"]').click(); await w(60); S.modal.shotsA = shots(10, 0); q('#modal [data-act="shot-cell"]').click(); await w(40); await save();
    m = C.MS().find(x => x.id === 'Q-p2'); L.push(`shots replace total: shotTotal ${m.shotTotal} sa ${m.sa} | ranked ${C.shootRanking(C.T(), 'Q').find(r => r.id === 'p2').total}`);
    // 4. spectators see the total
    const pf = S.permFn; S.permFn = () => ({ edit: false, score: false }); C.render(); await w(40);
    const sRow = [...qPanel().querySelectorAll('tbody tr')].find(tr => tr.innerText.includes('Ann'));
    L.push('spectator: ' + sRow.querySelectorAll('td')[7].innerText.replace(/\s+/g, ' ').trim() + ' | buttons ' + qa('main [data-shoot]').length);
    await tab('standings'); const st = [...q('main .panel table').querySelectorAll('tbody tr')].find(tr => tr.innerText.includes('Ann'));
    L.push('standings: ' + st.innerText.replace(/\s+/g, ' ').trim());
    await window.snap('shoot-total-standings');
    S.permFn = pf; await tab('draw');
    // resolve the shoot-out, then a level final entered as totals: no Hall of Fame result yet
    await S.store.updateMatch(S.tid, 'Q-p0', { so: [5, 5, 5, 5, 5] }); await S.store.updateMatch(S.tid, 'Q-p3', { so: [0, 0, 0, 0, 0] }); await w(60); C.render(); await w(40);
    q('[data-act="shoot-next"]').click(); await w(150);
    for (const id of ['F-p1', 'F-p0']) { q(`[data-shoot="${id}"]`).click(); await w(80); if (!q('#modal [data-tot]')) { if (S.modal.live) { q('#modal [data-act="shoot-mode"]').click(); await w(60); } q('#modal [data-act="tot-mode"]').click(); await w(60); } await totIn(['60']); await save(); q('#modal [data-act="close"]')?.click(); await w(60); }
    C.render(); await w(40);
    L.push('final tie: hof ready ' + C.hofResult(C.T()).ready + ' | alert ' + !!q('.so-alert'));

    // 5. knockout duel entered as totals
    await mk({ shootFormat: 'ko8', name: 'Duel totals' }, ['Ann', 'Bob']); await tab('draw'); q('[data-act="first-draw"]').click(); await w(120);
    for (const [i, sh] of [shots(10, 0), shots(9, 0)].entries()) await S.store.updateMatch(S.tid, `Q-p${i}`, { shots: sh, sa: C.shotTotal(sh), sb: 0, done: true });
    await w(60); C.render(); await w(40); q('[data-act="shoot-next"]').click(); await w(150);
    const duel = C.MS().find(x => x.shoot); q(`[data-match="${duel.id}"]`).click(); await w(80); if (S.modal.live) { q('#modal [data-act="shoot-mode"]').click(); await w(60); }
    q('#modal [data-act="tot-mode"]').click(); await w(60);
    L.push('duel boxes: ' + qa('#modal [data-tot]').length);
    await window.snap('shoot-total-duel');
    const [sa, sb] = duel.a[0] === 'p0' ? ['61', '66'] : ['66', '61'];
    await totIn(['60', '60']); await save();
    L.push('level duel: ' + (q('#modal .err')?.textContent || 'saved') + ' | shoot-out shown ' + !!q('#modal .so'));
    await totIn([sa, sb]); await save();
    const d = C.MS().find(x => x.id === duel.id); const ws = d.win || (d.sa > d.sb ? 'a' : 'b');
    L.push(`duel totals: winner ${name(d[ws][0])} ${Math.max(d.sa, d.sb)}-${Math.min(d.sa, d.sb)} | stored ${d.shotTotal}/${d.shotTotalB} done ${d.done}`);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
