// Mêlée when the numbers don't fit: the organiser's choice (everyone plays / fewer mixed teams / byes only), the
// preview in Setup and on the draw page, and fair sharing of byes and of places in odd-sized teams across the rounds.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), L = [];
    const mk = async (cfg, n) => { q('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { entry: 'melee', checkin: false, system: 'swiss' }, cfg);
      t.players = Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, active: true })); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30); };
    // a day of rounds straight from the draw: the shape of each round, and how evenly odd-sized teams and byes were shared
    const day = (n, format, fill, R) => {
      const t = { id: 'x', draws: [], players: Array.from({ length: n }, (_, i) => ({ id: 'q' + i, name: 'Q' + i, active: true })), entry: 'melee', format, meleeFill: fill, byeScore: [13, 7], checkin: false };
      const pref = { doubles: 2, triples: 3 }[format]; let ms = []; const shape = []; const odd = {}, byes = {}; t.players.forEach(x => { odd[x.id] = 0; byes[x.id] = 0; });
      for (let r = 1; r <= R; r++) {
        const d = C.drawMeleeRound(t, ms); if (d.error) return 'ERR ' + d.error; t.draws.push(d.draw); const sizes = {}; let nb = 0;
        d.matches.forEach(m => { m.done = true; if (!m.b) { m.a.forEach(x => byes[x]++); nb += m.a.length; return; } m.sa = 13; m.sb = 5;
          [m.a, m.b].forEach(s => { sizes[s.length] = (sizes[s.length] || 0) + 1; if (s.length !== pref) s.forEach(x => odd[x]++); }); });
        shape.push(Object.entries(sizes).map(([k, v]) => v + 'x' + k).join('+') + (nb ? ' bye' + nb : '')); ms = ms.concat(d.matches);
      }
      const o = Object.values(odd), bb = Object.values(byes);
      return `${[...new Set(shape)].join(' / ')} | odd ${Math.min(...o)}-${Math.max(...o)} | byes ${Math.min(...bb)}-${Math.max(...bb)}`; };
    try {
    L.push('19 doubles mix: ' + day(19, 'doubles', 'mix', 5));
    L.push('19 doubles fewest: ' + day(19, 'doubles', 'fewest', 5));
    L.push('19 doubles byes: ' + day(19, 'doubles', 'byes', 5));
    L.push('18 doubles fewest: ' + day(18, 'doubles', 'fewest', 4));
    L.push('17 doubles mix: ' + day(17, 'doubles', 'mix', 5));
    L.push('22 triples mix: ' + day(22, 'triples', 'mix', 4));
    L.push('22 triples byes: ' + day(22, 'triples', 'byes', 4));
    L.push('25 triples fewest: ' + day(25, 'triples', 'fewest', 4));
    L.push('7 triples fewest: ' + day(7, 'triples', 'fewest', 3));
    // Setup: the chooser and its preview; the draw page shows the same before round 1
    await mk({ name: 'Fill', meleeMode: 'rounds', format: 'doubles', swissRounds: 5 }, 19);
    q('[data-tab="setup"]').click(); await w(60);
    const prev = () => q('[data-set="meleeFill"]')?.closest('.stack').nextElementSibling?.querySelector('b')?.textContent || 'none';
    L.push('setup default: ' + q('[data-set="meleeFill"][aria-pressed="true"]')?.dataset.val + ' | ' + prev());
    q('[data-set="meleeFill"][data-val="fewest"]').click(); await w(120); L.push('fewest: ' + C.T().meleeFill + ' | ' + prev());
    q('[data-set="meleeFill"][data-val="byes"]').click(); await w(120); L.push('byes: ' + prev());
    q('[data-tab="draw"]').click(); await w(60); L.push('draw page: ' + q('main .panel p b')?.textContent + ' | change button ' + !!q('main [data-tab="setup"]'));
    q('[data-act="first-draw"]').click(); await w(300);
    const ms = C.MS(); L.push('round 1: games ' + ms.filter(m => m.b).length + ' byes ' + ms.filter(m => m.bye).length + ' sizes ' + [...new Set(ms.filter(m => m.b).flatMap(m => [m.a.length, m.b.length]))].join(''));
    // teams drawn once play as fixed teams all day, so there's nothing to choose
    await mk({ name: 'Once', meleeMode: 'once', format: 'doubles' }, 19); q('[data-tab="setup"]').click(); await w(60); L.push('once: chooser ' + !!q('[data-set="meleeFill"]'));
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack); }
    return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
