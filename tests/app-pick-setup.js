// Pick the Winner (pick-game): Setup's pick rounds (from the plan, the missing-field check) and the player's round cards
// (which teams a round lists before and after its draw, a team used in another round disabled). The website's storage and
// rules are in web-pick-rules.js; here the web layer (S.pickGame) is stood in for by a small fake on this device.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    S.pickGame = { st: { ready: true, me: null, picks: {}, link: location.href.split('#')[0] + '#x.pk-P1-KEY' },
      state() { return this.st; }, async join(t, name) { this.st.me = { pid: 'P1', name }; }, async pick(t, rid, team) { this.st.picks[rid] = team; } };
    const NAMES = ['Italy (ITA)', 'France (FRA)', 'Thailand (THA)', 'Spain (ESP)', 'Belgium (BEL)', 'Madagascar (MAD)', 'Tunisia (TUN)', 'Benin (BEN)',
      'England (ENG)', 'Germany (GER)', 'Monaco (MON)', 'Switzerland (SUI)', 'Netherlands (NED)', 'Portugal (POR)', 'Cambodia (CAM)', 'Laos (LAO)'];
    const make = async (n, sys, extra) => {
      document.querySelector('[data-act="new-t"]').click(); await w(80);
      const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = sys; t.format = 'triples'; Object.assign(t, extra);
      for (let i = 0; i < n; i++) t.teams.push({ id: 'e' + i, name: NAMES[i], players: ['a', 'b', 'c'], active: true });
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); return t.id;
    };
    // a Swiss of 3 rounds, then a main knockout of 16
    await make(16, 'swiss', { swissRounds: 3, koPlan: { seeding: 'seeded', brackets: [{ id: 'A', name: 'Main knockout', from: 1, to: 16, third: false }] } });
    q('[data-tab="setup"]').click(); await w(60);
    r.push('setup panel: ' + !!q('#pick-setup') + ' | rows shown ' + !!q('.pk-rows'));
    const on = q('#pick-on'); on.checked = true; on.dispatchEvent(new Event('change', { bubbles: true })); await w(120);
    r.push('game on: ' + !!C.T().pick?.on + ' | tab ' + !!q('[data-tab="pick"]'));
    q('[data-act="pk-from-plan"]').click(); await w(60);
    r.push('pick setup rows from plan: ' + qa('.pk-row [data-pk="name"]').map(i => i.value).join(', '));
    r.push('games options: ' + qa('#pk-src-0 option').map(o => o.textContent).filter(Boolean).join(', '));
    q('[data-act="pk-rows-save"]').click(); await w(60);
    r.push('pick setup missing time: ' + txt(q('#pick-setup .err')));
    // close times: round 1 in a day, the rest later; set the way a person would, through the boxes
    const day = n => { const d = new Date(Date.now() + n * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
    qa('.pk-row').forEach((row, i) => { set(row.querySelector('[data-pk="date"]'), day(i + 1)); set(row.querySelector('[data-pk="time"]'), '02:00'); });
    await w(40); q('[data-act="pk-rows-save"]').click(); await w(150);
    const t1 = C.T();
    r.push('saved: rounds ' + t1.pick.rounds.length + ' | srcs ' + t1.pick.rounds.map(x => x.src).join(',') + ' | closes ' + Object.keys(t1.pickClose).length + ' at 02:00 ' + Object.values(t1.pickClose).every(ms => new Date(ms).getHours() === 2));
    r.push('zone shown: ' + txt(q('.pk-zone')));
    // the player's tab: join, then the round cards
    q('[data-tab="pick"]').click(); await w(60);
    r.push('intro: ' + txt(q('.pick-page .panel p')));
    q('[data-act="pk-join"]').click(); await w(60);
    r.push('join empty name: ' + txt(q('.pick-page .err')));
    window.__shot1 = true; return r;
  });
  console.log(out.join('\n'));
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(150);
  await p.screenshot({ path: process.env.OUT + '/pick-join-390.png', fullPage: true });
  const out2 = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    q('#pk-you').value = 'Sam'; q('[data-act="pk-join"]').click(); await w(80);
    r.push('joined: ' + txt(q('.pk-me span')) + ' | link box ' + txt(q('.pk-link > span')));
    const opts = id => qa(`#pk-sel-${id} option`).filter(o => o.value);
    const t = C.T(), r1 = t.pick.rounds[0].id, r2 = t.pick.rounds[1].id;
    r.push(`pick list round 1: ${opts(r1).length} teams`);
    q(`#pk-sel-${r1}`).value = 'e0'; q(`#pk-sel-${r1}`).dispatchEvent(new Event('change', { bubbles: true })); q(`[data-act="pk-save"][data-r="${r1}"]`).click(); await w(80);
    r.push('after save: ' + txt(q(`.pk-card[data-round="${r1}"] .pk-mine`)));
    const used = opts(r2).find(o => o.value === 'e0');
    r.push(`used team disabled: ${used.textContent}` + (used.disabled ? '' : ' (NOT DISABLED)'));
    r.push('cards: ' + qa('.pk-card h3').map(txt).join(', '));
    r.push('phone sideways scroll: ' + (document.documentElement.scrollWidth > innerWidth));
    const small = qa('.pick-page button, .pick-page select, .pick-page input').filter(el => el.offsetParent && el.getBoundingClientRect().height < 44).length;
    r.push('pick page controls under 44: ' + small);
    return r;
  });
  console.log(out2.join('\n'));
  await p.screenshot({ path: process.env.OUT + '/pick-cards-390.png', fullPage: true });
  await p.evaluate(() => { document.querySelector('[data-tab="setup"]').click(); }); await p.waitForTimeout(150);
  await p.evaluate(() => document.querySelector('#pick-setup').scrollIntoView());
  console.log('setup sideways scroll 390: ' + await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await p.screenshot({ path: process.env.OUT + '/pick-setup-390.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(150);
  await p.evaluate(() => document.querySelector('#pick-setup').scrollIntoView());
  await p.screenshot({ path: process.env.OUT + '/pick-setup-desktop.png' });
  // a knockout of 6: round 1 has two byes, which aren't games to pick
  const out3 = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], r = [];
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = 'knockout'; t.format = 'triples';
    for (let i = 0; i < 6; i++) t.teams.push({ id: 'k' + i, name: 'Team ' + i, players: ['a'], active: true });
    t.pick = { on: true, rounds: [{ id: 'p1', name: 'Quarter-finals', src: 'ko:A:1' }] }; t.pickClose = { p1: Date.now() + 864e5 };
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    S.pickGame.st.picks = {};
    q('[data-tab="pick"]').click(); await w(60);
    const before = qa('#pk-sel-p1 option').filter(o => o.value).length;
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(200);
    const byes = C.MS().filter(m => m.bye).flatMap(m => m.a || []);
    q('[data-tab="pick"]').click(); await w(60);
    const after = qa('#pk-sel-p1 option').filter(o => o.value).map(o => o.value);
    r.push(`pick list before draw: ${before} teams`);
    r.push(after.length === 4 && byes.length === 2 && !after.some(id => byes.includes(id)) ? 'pick list after draw: only teams with a game' : `pick list after draw: ${after.length} listed, byes ${byes.join(',')}`);
    // a round past its close: the select is gone, and a save from a page left open is refused
    q('#pk-sel-p1').value = after[0]; C.T().pickClose = { p1: Date.now() - 1000 }; q('[data-act="pk-save"][data-r="p1"]').click(); await w(60);
    r.push('save after close: ' + (q('.pk-card .err')?.textContent || '') + ' | saved ' + !!S.pickGame.st.picks.p1);
    r.push('closed round: ' + (q('.pk-card .pill')?.textContent || '') + ' | ' + (q('.pk-card .pk-mine')?.textContent || '') + ' | select ' + !!q('#pk-sel-p1'));
    return r;
  });
  console.log(out3.join('\n'));
  console.log('errs', errs); await b.close();
})();
