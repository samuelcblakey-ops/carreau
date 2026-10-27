// Draw & results in parts: chips for each knockout, the table and each round (or barrage), opening on the part being
// played; finished rounds as one line per game; "All" shows everything. Keeps phones from scrolling through every round.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const chips = () => qa('.draw-bar .rchip').map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(',');
    const groups = () => qa('.draw-bar .rb-group .eyebrow').map(e => e.textContent).join(',');
    const shown = () => qa('main section.draw-round h3, main .bk-wrap h3, main .draw-table h3, main .pools .panel h3').map(h => h.textContent).join(' | ');
    const make = async (system, n, extra = {}) => { q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, { name: system, system, format: 'singles', checkin: false, wizard: false, swissRounds: 3, seeding: 'entry' }, extra);
      for (let i = 0; i < n; i++) t.teams.push({ id: 'e' + i, name: 'Team ' + 'ABCDEFGHIJKLMNOP'[i], players: ['x'], active: true });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); q('[data-tab="draw"]').click(); await w(40); q('[data-act="first-draw"]').click(); await w(250); };
    const playAll = async pred => { for (let k = 0; k < 80; k++) { const m = C.MS().filter(m => m.a && m.b && !m.done && !m.bye && pred(m)).sort((x, y) => x.round - y.round || x.order - y.order)[0]; if (!m) break;
      const lo = +m.a[0].slice(1) < +m.b[0].slice(1); await C.recordResult(m.id, lo ? 13 : 6, lo ? 6 : 13, true); await w(15); } C.render(); await w(60); };
    // 1. Swiss: round 1 in play
    await make('swiss', 8);
    L.push('swiss round 1: chips ' + chips() + ' | shown ' + shown() + ' | cards ' + qa('main .match').length);
    await playAll(m => m.round === 1); q('[data-act="next-round"]').click(); await w(250);
    L.push('round 2 drawn: chips ' + chips() + ' | shown ' + shown());
    q('[data-act="draw-sel"][data-v="r-R1"]').click(); await w(60);
    L.push('round 1 picked: shown ' + shown() + ' | one line per game ' + qa('main .rlist .rrow').length + ' | cards ' + qa('main section.draw-round .match').length + ' | row ' + q('.rrow').innerText.replace(/\s+/g, ' '));
    // a finished game can still be corrected from its line
    q('.rrow[data-match]').click(); await w(60); L.push('row opens the score: ' + !!q('#modal .modal')); S.modal = null; C.render(); await w(40);
    await playAll(m => m.round === 2); q('[data-act="next-round"]').click(); await w(250); await playAll(m => m.round === 3);
    L.push('new round resets the pick: ' + chips());
    q('[data-act="start-kos"]').click(); await w(300);
    L.push('knockouts drawn: chips ' + chips() + ' | groups ' + groups() + ' | bracket shown ' + !!q('main .bk') + ' | rounds shown ' + qa('main section.draw-round').length);
    const h0 = document.documentElement.scrollHeight;
    q('[data-act="draw-sel"][data-v="all"]').click(); await w(80);
    L.push('all: shown ' + shown() + ' | page ' + (document.documentElement.scrollHeight > h0 + 600 ? 'much longer' : 'similar ' + h0 + ' ' + document.documentElement.scrollHeight));
    q('[data-act="draw-sel"][data-v="table"]').click(); await w(60); L.push('table chip: ' + shown() + ' | rows ' + qa('.draw-table tbody tr').length);
    // 2. Round robin: the first round with games left
    await make('roundrobin', 4); await playAll(m => m.round === 1);
    L.push('round robin: chips ' + chips() + ' | shown ' + shown());
    // 3. Barrage: one chip per barrage
    await make('pools', 12, { poolSize: 4, poolStyle: 'rr' });
    L.push('barrage: chips ' + chips() + ' | groups ' + groups() + ' | shown ' + shown());
    // 4. A knockout on its own has nothing to pick
    await make('knockout', 8); L.push('knockout only: chips ' + (chips() || 'none'));
    // 5. French
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80); await make('swiss', 6);
    L.push('french: ' + chips() + ' | ' + groups());
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n'));
  await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); document.querySelector('[data-act="lang-menu"]').click(); await w(40); document.querySelector('[data-lang="en"]').click(); await w(60); });
  await p.screenshot({ path: process.env.OUT + '/draw-parts-phone.png', fullPage: true });
  console.log('errs', errs); await b.close();
})();
