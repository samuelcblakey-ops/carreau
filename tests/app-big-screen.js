// Big screen: a table for each barrage and each league; mêlée drawn in advance shows the round in play
// and only that round's games under Next up; the competition's name stays exactly as typed in other languages.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const step = async name => p.evaluate(async name => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const tab = async k => { S.tab = k; C.render(); await w(80); };
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    const mk = async (cfg, n, players) => { q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, cfg, { checkin: false, wizard: false }); if (cfg.pistes) t.courts = t.courts.slice(0, cfg.pistes);
      if (players) t.players = Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'Player ' + i, active: true }));
      else for (let i = 0; i < n; i++) t.teams.push({ id: 'e' + i, name: 'Team ' + i, players: ['a'], active: true });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); };
    const draw = async () => { await tab('draw'); q('[data-act="first-draw"]').click(); await w(250); };
    if (name === 'barrage') {
      await mk({ system: 'pools', poolSize: 4, name: 'Barrage day' }, 12); await draw();
      await C.recordResult(C.MS().find(m => m.stage === 'pool').id, 13, 7, true); await tab('display');
      L.push('big screen barrage: tables ' + qa('.disp .disp-pool table').length + ' | ' + qa('.disp .disp-pool h3').map(txt).join(',') + ' | columns ' + qa('.disp .disp-pool:first-child thead th').map(th => th.textContent).join(','));
      L.push('big screen barrage rows: ' + qa('.disp .disp-pool tbody tr').length + ' | font ' + getComputedStyle(q('.disp .disp-pool td')).fontSize);
    }
    if (name === 'leagues') {
      await mk({ system: 'leagues', leagueCount: 2, name: 'League day' }, 8); await draw(); await tab('display');
      L.push('big screen leagues: tables ' + qa('.disp .disp-pool table').length + ' | ' + qa('.disp .disp-pool h3').map(txt).join(','));
    }
    if (name === 'melee') {
      await mk({ entry: 'melee', name: 'Advance', meleeMode: 'advance', format: 'doubles', swissRounds: 4, pistes: 4 }, 32, true); await draw();
      const r1 = C.MS().filter(m => m.round === 1 && m.court).slice(0, 2);
      for (const m of r1) await C.recordResult(m.id, 13, 5, true);
      await tab('display');
      const next = qa('.disp .mlist .match .meta').map(txt), rounds = [...new Set(C.MS().map(m => m.round))];
      const ids = qa('.disp .mlist .match').length, ready = C.MS().filter(m => !m.done && !m.court && m.round === 1).length;
      L.push('big screen melee in advance after 2 results: ' + q('.disp .pill.playing')?.textContent + ' | next up ' + (next.length && next.every(s => /Round 1\b/.test(s)) ? 'round 1 only' : 'mixed: ' + next.join(' / ')) + ' (shown ' + ids + ', round 1 waiting ' + ready + ', rounds drawn ' + rounds.join(',') + ')');
    }
    if (name === 'fr') {
      const nm = 'Swiss · 5 rounds → afternoon knockouts';
      await mk({ system: 'swiss', name: nm, date: '2026-10-26', venue: 'Club house' }, 8); await draw();
      q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(200); await tab('display');
      const h2 = txt(q('.disp h2'));
      L.push('fr big screen name: ' + (h2 === nm ? 'exactly as typed' : 'changed to ' + h2) + ' | date ' + q('.disp .eyebrow').textContent.replace(/^.* · /, ''));
      q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="en"]').click(); await w(200); await tab('display');
      L.push('en big screen date: ' + q('.disp .eyebrow').textContent);
    }
    } catch (e) { L.push('ERR ' + name + ' ' + e.message); }
    return L; }, name);
  const out = [];
  for (const s of ['barrage', 'leagues']) { out.push(...await step(s)); await p.screenshot({ path: process.env.OUT + '/big-screen-' + s + '.png', fullPage: true }); }
  out.push(...await step('melee')); await p.screenshot({ path: process.env.OUT + '/big-screen-melee.png', fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 }); out.push(...await step('barrage')); await p.screenshot({ path: process.env.OUT + '/big-screen-phone.png', fullPage: true });
  out.push('phone sideways scroll: ' + await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
  await p.setViewportSize({ width: 1280, height: 900 }); out.push(...await step('fr')); await p.screenshot({ path: process.env.OUT + '/big-screen-fr.png', fullPage: true });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
