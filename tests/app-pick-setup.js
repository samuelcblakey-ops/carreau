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
  // a team can't be saved in two rounds; an old repeat is flagged; a remembered choice saved elsewhere since resets
  const out4 = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), r = [];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), redraw = async () => { q('[data-tab="pick"]').click(); await w(60); };
    const [r1, r2, r3] = C.T().pick.rounds.map(x => x.id), card = id => `.pk-card[data-round="${id}"]`;
    const set = (id, v) => { const s = q('#pk-sel-' + id); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); };
    S.pickGame.st.picks = {}; await redraw();
    set(r1, 'e0'); set(r2, 'e0'); q(`[data-act="pk-save"][data-r="${r1}"]`).click(); await w(80);
    const r2After = q('#pk-sel-' + r2).value;
    q('#pk-sel-' + r2).value = 'e0'; // a page that still has it chosen
    q(`[data-act="pk-save"][data-r="${r2}"]`).click(); await w(80);
    r.push(`same team two selects: ${S.pickGame.st.picks[r2] ? 'SAVED' : 'second save refused'} | ${txt(q(card(r2) + ' .err'))}` + (r2After ? ' (round 2 select kept ' + r2After + ')' : ''));
    set(r3, 'e0'); await redraw();
    r.push('remembered choice reset: ' + txt(q('#pk-sel-' + r3).selectedOptions[0]));
    S.pickGame.st.picks[r2] = 'e0'; await redraw();
    r.push('old repeat warning: ' + txt(q(card(r2) + ' .pk-dup')) + (q(card(r1) + ' .pk-dup') ? ' (ALSO ON ROUND 1)' : ''));
    q(card(r2)).scrollIntoView(); return r;
  });
  console.log(out4.join('\n'));
  await p.screenshot({ path: process.env.OUT + '/pick-repeat-390.png' });
  // joining: Enter in the name box, and a tap on Join while a render waits for the box to lose focus (a phone blurs it as the tap starts)
  await p.evaluate(async () => { const S = window.__carreau.S; S.pickGame.st.me = null; S.pickGame.st.picks = {}; document.querySelector('[data-tab="pick"]').click(); await new Promise(r => setTimeout(r, 60)); });
  await p.click('#pk-you'); await p.keyboard.type('Ann'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  console.log('join with Enter: ' + await p.evaluate(() => window.__carreau.S.pickGame.st.me?.name === 'Ann' && document.querySelector('.pk-me') ? 'joined' : 'not joined'));
  const tapTest = async (open, inSel, btnSel, after, check) => p.evaluate(async ([open, inSel, btnSel, after, check]) => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    await (0, eval)(open)(); await w(60);
    const inp = q(inSel); inp.focus(); inp.value = after; inp.dispatchEvent(new Event('input', { bubbles: true }));
    C.render(); const pending = S.pendingRender, btn = q(btnSel);
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' })); inp.blur(); inp.dispatchEvent(new Event('change', { bubbles: true }));
    await w(120); const kept = btn.isConnected; btn.click(); await w(200);
    return { pending, kept, ok: (0, eval)(check)() };
  }, [open, inSel, btnSel, after, check]);
  let tp = await tapTest(`async () => { const S = window.__carreau.S; S.pickGame.st.me = null; document.querySelector('[data-tab="pick"]').click(); }`, '#pk-you', '[data-act="pk-join"]', 'Bea',
    `() => window.__carreau.S.pickGame.st.me?.name === 'Bea' && !!document.querySelector('.pk-me')`);
  console.log('join tap with pending render: ' + (tp.pending && tp.kept && tp.ok ? 'joined first tap' : JSON.stringify(tp)));
  // a slow join: the button says Joining… and is disabled, and more taps (or Enter) don't start another (pick-game-join-once)
  console.log((await p.evaluate(async () => {
    const S = window.__carreau.S, G = S.pickGame, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), r = [];
    const realJoin = G.join; let made = 0; G.join = async function (t, name) { made++; await w(300); return realJoin.call(this, t, name); };
    G.st.me = null; q('[data-tab="pick"]').click(); await w(60);
    q('#pk-you').value = 'Teat';
    for (let i = 0; i < 4; i++) { (q('[data-act="pk-join"]') || {}).click?.(); await w(10); }
    q('#pk-join-form')?.requestSubmit(); await w(10);
    const btn = q('[data-act="pk-join"]');
    r.push('join button while joining: ' + (btn?.textContent.trim() || 'none') + (btn?.disabled ? ' (disabled)' : ' (enabled)'));
    await w(400);
    r.push(`join tapped 4 times fast: ${made} player${made === 1 ? '' : 's'}` + (q('.pk-me') ? '' : ' (not joined)'));
    G.join = realJoin; return r;
  })).join('\n'));
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
  // the same for an organiser form (the tap change is global): rename a pick round in Setup, then tap Save rounds straight away
  tp = await tapTest(`async () => { const c = window.__carreau.T(); c.pickClose = { p1: Date.now() + 864e5 }; document.querySelector('[data-tab="setup"]').click(); }`, '#pk-name-0', '[data-act="pk-rows-save"]', 'Round One',
    `() => window.__carreau.T().pick.rounds[0].name === 'Round One'`);
  console.log('tap after typing elsewhere: ' + (tp.pending && tp.kept && tp.ok ? 'Save rounds still works first tap' : JSON.stringify(tp)));
  // How to play (pick-game-how-to-play): rounds 1-3 close together, the Final a day later
  await p.setViewportSize({ width: 390, height: 844 });
  console.log((await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], r = [];
    const txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.system = 'swiss'; t.swissRounds = 3;
    for (let i = 0; i < 4; i++) t.teams.push({ id: 'h' + i, name: 'Team ' + i, players: ['a'], active: true });
    const d1 = Date.now() + 864e5, d2 = d1 + 864e5;
    t.pick = { on: true, rounds: [{ id: 'q1', name: 'Round 1', src: 'swiss:1' }, { id: 'q2', name: 'Round 2', src: 'swiss:2' }, { id: 'q3', name: 'Round 3', src: 'swiss:3' }, { id: 'q4', name: 'Final', src: 'swiss:3' }] };
    t.pickClose = { q4: d2, q1: d1, q2: d1, q3: d1 };
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40);
    S.pickGame.st.me = null; S.pickGame.st.picks = {}; q('[data-tab="pick"]').click(); await w(60);
    r.push('how to play open before joining: ' + !!q('.pk-how')?.open + (q('.pk-how + #pk-join-form') ? '' : ' (join form not below it)'));
    r.push('when to pick: ' + qa('.pk-when li').map(txt).join(' | '));
    q('#pk-you').value = 'Cy'; q('[data-act="pk-join"]').click(); await w(80);
    r.push('how to play closed after joining: ' + (!!q('.pk-me') && !q('.pk-how').open));
    window.__howShot = true; return r;
  })).join('\n'));
  await p.evaluate(() => { document.querySelector('.pk-how').open = true; window.scrollTo(0, 0); }); await p.waitForTimeout(100);
  await p.screenshot({ path: process.env.OUT + '/pick-howto-390.png', fullPage: true });
  console.log('390 px: ' + (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth) ? 'sideways scroll' : 'no sideways scroll'));
  console.log((await p.evaluate(async () => {
    const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), r = [];
    const c = C.T(); c.pickClose = { ...c.pickClose, q1: Date.now() - 1000, q2: Date.now() - 1000, q3: Date.now() - 1000 }; q('[data-tab="pick"]').click(); await w(60);
    r.push('closed group marked: ' + (q('.pk-when li .muted')?.textContent || 'none') + (q('.pk-when li:nth-child(2) .muted') ? ' (FINAL ALSO MARKED)' : ''));
    q('[data-lang="fr"]').click(); await w(150);
    r.push('french list format: ' + (q('.pk-when li span[data-notr]')?.textContent || '') + ' | ' + (q('.pk-how summary')?.textContent || ''));
    return r;
  })).join('\n'));
  await p.evaluate(() => { document.querySelector('.pk-how').open = true; window.scrollTo(0, 0); }); await p.waitForTimeout(100);
  await p.screenshot({ path: process.env.OUT + '/pick-howto-fr-390.png', fullPage: true });
  await p.evaluate(() => { document.querySelector('.pk-how').open = false; }); await p.waitForTimeout(100);
  await p.screenshot({ path: process.env.OUT + '/pick-howto-closed-390.png' });
  console.log('errs', errs); await b.close();
})();
