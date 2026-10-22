// Shooting tie-breaks: count-back (most 5s, then 3s) then a shoot-out, or straight to a shoot-out; chosen in Setup.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const AT = ['A1', 'A2', 'A3', 'A4', 'A5'];
    // 20 shots: f fives, th threes, rest misses
    const shots = (f, th) => { const v = Array.from({ length: 20 }, (_, i) => i < f ? 5 : i < f + th ? 3 : 0); return Object.fromEntries(AT.map((k, ai) => [k, v.slice(ai * 4, ai * 4 + 4)])); };
    const mk = async (cfg, n) => { q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, cfg, { checkin: false, wizard: false, entry: 'shooting', system: 'knockout', format: 'singles', seeding: 'entry' });
      for (let i = 0; i < n; i++) t.players.push({ id: 'p' + i, name: 'Shooter ' + i, active: true }); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); };
    const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    const scoreQ = async (ph, list) => { for (const [i, sh] of list.entries()) { const id = `${ph}-p${i}`; await S.store.updateMatch(S.tid, id, { shots: sh, sa: C.shotTotal(sh), sb: 0, done: true }); } await w(60); C.render(); await w(40); };
    const order = ph => C.shootRanking(C.T(), ph).map(r => r.id.slice(1)).join('');

    // 1. count-back, final for the top 2
    await mk({ shootFormat: 'final', shootFinal: 2, name: 'Tie test' }, 4);
    await tab('setup'); const setupTxt = q('.so-setup')?.innerText.replace(/\s+/g, ' ') || '';
    L.push('setup panel: ' + !!q('.so-setup') + ' | default count-back: ' + (q('[data-set="shootTie"][data-val="countback"]').getAttribute('aria-pressed')) + ' | ateliers ' + qa('[data-act="so-at"][aria-pressed="true"]').length + ' | dist ' + q('[data-set="shootOutDist"][aria-pressed="true"]').textContent);
    await tab('draw'); q('[data-act="first-draw"]').click(); await w(120);
    // p0 60 (12 fives) · p1 and p2 50 with ten 5s · p3 50 with seven 5s and five 3s
    await scoreQ('Q', [shots(12, 0), shots(10, 0), shots(10, 0), shots(7, 5)]);
    L.push('order: ' + order('Q') + ' | count-back puts p3 4th: ' + (order('Q')[3] === '3'));
    await tab('draw');
    L.push('alert: ' + (q('.so-alert')?.innerText.replace(/\s+/g, ' ').trim() || 'none') + ' | next blocked: ' + !q('[data-act="shoot-next"]'));
    q('[data-act="so-open"]').click(); await w(60);
    L.push('modal: ' + q('#modal h3').textContent + ' | rows ' + qa('#modal .so-row').length + ' slots ' + qa('#modal .so-row')[0].querySelectorAll('[data-act="so-cell"]').length + ' | first cell picked: ' + !!q('#modal .shotcell.sel'));
    for (let i = 0; i < 10; i++) { q('[data-act="so-pick"][data-v="5"]').click(); await w(10); } // round 1: both 25
    L.push('still level after round 1: ' + q('#modal .so').innerText.includes('Still level') + ' | slots now ' + qa('#modal .so-row')[0].querySelectorAll('[data-act="so-cell"]').length);
    for (let i = 0; i < 10; i++) { q(`[data-act="so-pick"][data-v="${i % 2 ? 1 : 3}"]`).click(); await w(10); } // round 2: p1 15, p2 5
    L.push('decided: ' + q('#modal .so').innerText.replace(/\s+/g, ' ').match(/Decided.*/)?.[0]);
    q('[data-act="so-save"]').click(); await w(120);
    L.push('after shoot-out: ' + order('Q') + ' | alert gone ' + !q('.so-alert') + ' | pill ' + (qa('main .pill').map(x => x.textContent).find(x => x.startsWith('Shoot-out')) || '') + ' | next open ' + !!q('[data-act="shoot-next"]'));
    q('[data-act="shoot-next"]').click(); await w(120);
    L.push('final: ' + C.MS().filter(m => m.phase === 'F').map(m => m.a[0]).join(','));
    // 2. straight to a shoot-out: count-back ignored, p3 is now level with p1 and p2
    await tab('setup'); q('[data-set="shootTie"][data-val="shootout"]').click(); await w(80);
    const r3 = C.shootRanking(C.T(), 'Q').find(r => r.id === 'p3'); L.push('shoot-out mode: p3 level ' + (r3.tieN === 3) + ' open ' + r3.open);
    q('[data-act="so-at"][data-k="A1"]').click(); await w(60); q('[data-set="shootOutDist"][data-val="9"]').click(); await w(60);
    L.push('config: ' + JSON.stringify(C.T().shootOutAt) + ' ' + C.T().shootOutDist + ' | standings note: ' + (await tab('standings'), [...document.querySelectorAll('main p.small')].pop().textContent));

    // 3. knockout duel: count-back, then shoot-out
    await mk({ shootFormat: 'ko8', name: 'Duel test' }, 2); await tab('draw'); q('[data-act="first-draw"]').click(); await w(120);
    await scoreQ('Q', [shots(10, 0), shots(9, 0)]); await tab('draw'); q('[data-act="shoot-next"]').click(); await w(150);
    const duel = C.MS().find(m => m.shoot); q(`[data-match="${duel.id}"]`).click(); await w(60);
    if (S.modal.live) { q('[data-act="shoot-mode"]').click(); await w(40); }
    S.modal.shotsA = shots(7, 5); S.modal.shotsB = shots(10, 0); q('[data-act="shot-cell"]').click(); await w(40);
    L.push('count-back notice: ' + (q('#modal .notice.small')?.innerText.replace(/\s+/g, ' ') || 'none'));
    q('[data-act="shoot-save"][data-final="1"]').click(); await w(120);
    let d = C.MS().find(m => m.id === duel.id); L.push(`duel by count-back: done ${d.done} win ${d.win} ${d.sa}-${d.sb}`);
    q(`[data-match="${duel.id}"]`).click(); await w(60); S.modal.shotsA = shots(10, 0); S.modal.shotsB = shots(10, 0); q('[data-act="shot-cell"]').click(); await w(40);
    L.push('level duel shows shoot-out: ' + !!q('#modal .so'));
    q('[data-act="shoot-save"][data-final="1"]').click(); await w(80); L.push('save refused: ' + q('#modal .err')?.textContent);
    q('[data-act="so-cell"][data-key="a"][data-i="0"]').click(); await w(20);
    for (let i = 0; i < 10; i++) { q(`[data-act="so-pick"][data-v="${i % 2 ? 5 : 0}"]`).click(); await w(10); }
    q('[data-act="shoot-save"][data-final="1"]').click(); await w(120);
    d = C.MS().find(m => m.id === duel.id); L.push(`duel by shoot-out: win ${d.win} so ${d.soA.join('')}/${d.soB.join('')}`);
    // 4. French
    localStorage.setItem('carreau-lang', 'fr'); q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80); await tab('setup');
    L.push('french: ' + q('.so-setup .eyebrow').textContent + ' | ' + q('[data-set="shootTie"][data-val="countback"]').textContent);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
