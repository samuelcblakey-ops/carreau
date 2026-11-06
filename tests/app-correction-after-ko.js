// Correcting a morning result (Swiss, barrage) after the knockouts were drawn from its standings asks first:
// the notice says the knockouts stay as drawn, nothing saves until "Save anyway", and then the knockouts are unchanged.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const step1 = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    // Swiss, 8 teams, 2 rounds; semi-finals of the top 4
    q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Swiss then semis', system: 'swiss', checkin: false, wizard: false, draws: [{ id: 'R1', kind: 'round', label: 'Round 1', round: 1 }, { id: 'R2', kind: 'round', label: 'Round 2', round: 2 }],
      koPlan: { seeding: 'seeded', brackets: [{ id: 'A', name: 'Semi-finals', from: 1, to: 4, third: false }] } });
    for (let i = 1; i <= 8; i++) t.teams.push({ id: 's' + i, name: 'Team ' + i, players: ['x'], active: true });
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    // round 1: 1, 3, 5, 7 win; round 2: 1 beats 3 13-12 and 5 beats 7 13-0, 2 beats 4 13-5, 6 beats 8 13-0 (so 6 is 4th)
    const g = [['R1', 1, 's1', 's2', 13, 6], ['R1', 1, 's3', 's4', 13, 6], ['R1', 1, 's5', 's6', 13, 6], ['R1', 1, 's7', 's8', 13, 6],
      ['R2', 2, 's1', 's3', 13, 12], ['R2', 2, 's5', 's7', 13, 0], ['R2', 2, 's2', 's4', 13, 5], ['R2', 2, 's6', 's8', 13, 0]];
    for (const [gid, r, a, bb, sa, sb] of g) { const m = { id: `${gid}-${a}`, stage: 'swiss', group: gid, round: r, order: 0, a: [a], b: [bb], sa, sb, done: true }; await S.store.setMatch(t.id, m); S.matches[m.id] = m; }
    await w(50);
    const top = () => C.koEntrants(C.T(), C.MS(), C.getPlan(C.T()).brackets[0]).map(x => x.id);
    const before = top(); L.push('top 4 before: ' + before.join(','));
    await C.startKnockouts(); await w(200);
    const semis = () => JSON.stringify(C.MS().filter(m => m.stage === 'ko' && m.round === 1).sort((x, y) => x.order - y.order).map(m => [m.a, m.b]));
    const semisBefore = semis(); L.push('semis drawn: ' + C.MS().filter(m => m.stage === 'ko').length);
    // the round-2 game 6 v 8 corrected to a loss for 6: 6 (a semi-finalist) drops out of the top 4
    q('[data-tab="draw"]').click(); await w(80); q('[data-act="draw-sel"][data-v="r-R2"]')?.click(); await w(60);
    const btn = q('[data-match="R2-s6"]'); if (!btn) throw new Error('no R2-s6 button');
    btn.click(); await w(60); q('#sc-sa').value = 0; q('#sc-sb').value = 13; q('[data-act="save-final"]').click(); await w(150);
    const box = q('#modal .notice'); const txt = box ? box.innerText.replace(/\s+/g, ' ') : '';
    const m1 = C.MS().find(m => m.id === 'R2-s6');
    L.push(`swiss correction after ko: notice ${/knockouts were drawn from these standings/.test(txt) && !!q('#modal [data-act="override"]')} | saved before confirm ${m1.sa !== 13 || m1.sb !== 0}`);
    L.push('notice: ' + txt + ' | button ' + q('#modal [data-act="override"]')?.textContent);
    window.__t = { before, semisBefore };
    } catch (e) { L.push('ERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]); } return L; });
  await p.screenshot({ path: 'test-results/correction-after-ko-phone.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(100); await p.screenshot({ path: 'test-results/correction-after-ko-desktop.png' });
  const step2 = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    const { before, semisBefore } = window.__t;
    q('#modal [data-act="override"]').click(); await w(200);
    const top = C.koEntrants(C.T(), C.MS(), C.getPlan(C.T()).brackets[0]).map(x => x.id);
    const semis = JSON.stringify(C.MS().filter(m => m.stage === 'ko' && m.round === 1).sort((x, y) => x.order - y.order).map(m => [m.a, m.b]));
    const m1 = C.MS().find(m => m.id === 'R2-s6');
    L.push(`top 4 after: ${top.join(',')} | saved ${m1.sa}-${m1.sb} | modal closed ${!S.modal} | toast ${q('#toast').textContent}`);
    L.push(`save anyway: standings changed ${!top.includes('s6') && before.includes('s6')} | semi-finals unchanged ${semis === semisBefore}`);
    // a correction that changes nothing in the top 4 saves straight away: 7 beat 8 13-5 instead of 13-6 in round 1
    q('[data-act="draw-sel"][data-v="r-R1"]')?.click(); await w(60); q('[data-match="R1-s7"]').click(); await w(60); q('#sc-sa').value = 13; q('#sc-sb').value = 5; q('[data-act="save-final"]').click(); await w(150);
    L.push(`unrelated correction: notice ${!!q('#modal .notice')} | saved ${C.MS().find(m => m.id === 'R1-s7').sb === 5} | top 4 ${C.koEntrants(C.T(), C.MS(), C.getPlan(C.T()).brackets[0]).map(x => x.id)}`);
    S.modal = null; C.render();

    // Barrage (round robin) into knockouts by barrage place
    q('[data-act="new-t"]').click(); await w(80); const t2 = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t2, { system: 'pools', poolStyle: 'rr', poolSize: 4, seeding: 'entry', name: 'Barrage then KO', checkin: false, wizard: false });
    for (let i = 0; i < 8; i++) t2.teams.push({ id: 'e' + i, name: 'Team ' + i, players: ['a'], active: true }); await S.store.setTournament(t2); S.tournaments[t2.id] = t2; await w(40);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(200);
    for (const m of C.MS().filter(m => m.pool)) { const ia = +m.a[0].slice(1), ib = +m.b[0].slice(1); const wi = Math.min(ia, ib); await C.recordResult(m.id, ia === wi ? 13 : 5, ia === wi ? 5 : 13, true); }
    await w(80); await C.startKnockouts(); await w(200);
    L.push('barrage knockouts: ' + (C.T().brackets || []).map(b => b.name).join(','));
    // corrected so the barrage winner loses to its runner-up: places 1 and 2 swap
    const pool = C.T().pools[0]; const [w1, w2] = pool.members;
    const g = C.MS().find(m => m.pool === pool.id && [m.a[0], m.b[0]].includes(w1) && [m.a[0], m.b[0]].includes(w2));
    q('[data-tab="draw"]').click(); await w(80); q(`[data-act="draw-sel"][data-v="p-${pool.id}"]`)?.click(); await w(60);
    const btn = q(`[data-match="${g.id}"]`); if (!btn) throw new Error('no barrage game button ' + [...document.querySelectorAll('[data-act="draw-sel"]')].map(x => x.dataset.v));
    btn.click(); await w(60); const w2a = g.a[0] === w2; q('#sc-sa').value = w2a ? 13 : 5; q('#sc-sb').value = w2a ? 5 : 13; q('[data-act="save-final"]').click(); await w(150);
    const txt = q('#modal .notice')?.innerText || '';
    L.push(`barrage correction after ko: notice ${/knockouts were drawn from these standings/.test(txt)} | saved before confirm ${C.MS().find(m => m.id === g.id).sa === (w2a ? 13 : 5)}`);
    q('#modal [data-act="close"]').click(); await w(60);
    L.push(`cancel: modal closed ${!S.modal} | result kept ${C.MS().find(m => m.id === g.id).sa === (w2a ? 5 : 13)}`);
    } catch (e) { L.push('ERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]); } return L; });
  console.log([...step1, ...step2].join('\n')); console.log('errs', errs); await b.close();
})();
