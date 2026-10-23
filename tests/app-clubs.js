// Inter-club: clubs enter several teams each; each day pairs the clubs off and their teams play each other (never their own club).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    const mk = async (cfg, clubs, per) => { q('[data-act="new-t"]').click(); await w(80); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { system: 'clubs', clubTeams: per, checkin: false, wizard: false }, cfg);
      clubs.forEach((c, ci) => { for (let i = 0; i < per; i++) t.teams.push({ id: `e${ci}${i}`, name: `${c} ${i + 1}`, players: ['a'], club: c, active: true }); });
      t.courts = Array.from({ length: 20 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); };
    // 1. Setup
    await mk({ name: 'Clubs' }, ['Alpha', 'Bravo', 'Charlie'], 2); await tab('setup');
    L.push('system options: ' + qa('[data-set="system"]').map(b => b.textContent).join(','));
    L.push('fields: teams per club ' + q('#f-clubteams').value + ' | pairings ' + qa('[data-set="clubPairing"]').map(b => b.textContent).join(',') + ' | default ' + q('[data-set="clubPairing"][aria-pressed="true"]').textContent + ' | seeding hidden ' + !q('[data-set="seeding"]') + ' | knockouts hidden ' + !q('table.plan'));
    L.push('days note: ' + (txt(q('main')).match(/3 clubs → 3 days/) || ['none'])[0]);
    // 2. Registration: clubs panel, club required
    await tab('entries');
    L.push('clubs panel: ' + qa('.elist.clubs .erow').map(r => txt(r)).join(' | '));
    L.push('club input required: ' + q('#nt-club').required + ' | datalist ' + qa('#club-list option').length + ' | bulk club field ' + !!q('#bulk-club') + ' | reorder buttons ' + qa('[data-act="up"]').length);
    // 3. Draw blocked while a club is short
    const t0 = JSON.parse(JSON.stringify(C.T())); t0.teams.push({ id: 'x1', name: 'Delta 1', players: ['a'], club: 'Delta', active: true }); await S.store.setTournament(t0); S.tournaments[t0.id] = t0; await w(40);
    await tab('draw'); L.push('blocked: ' + !q('[data-act="first-draw"]') + ' | ' + txt(q('main .notice')).slice(0, 80));
    const t1 = JSON.parse(JSON.stringify(C.T())); t1.teams = t1.teams.filter(x => x.id !== 'x1'); await S.store.setTournament(t1); S.tournaments[t1.id] = t1; await w(40); await tab('draw');
    L.push('ready: ' + txt(q('[data-act="first-draw"]')) + ' | ' + (txt(q('main')).match(/3 clubs → 3 days/) || ['none'])[0]);
    // 4. Like for like, 3 clubs × 2 teams: 3 days, one club rests each day, 2 games per fixture
    q('[data-act="first-draw"]').click(); await w(250);
    const t = C.T(); const ms = C.MS();
    L.push('drawn: clubs ' + t.clubs.map(c => c.name).join(',') + ' | days ' + t.clubSched.length + ' | games ' + ms.length + ' | rests ' + t.clubSched.map(d => d.rest ? t.clubs.find(c => c.id === d.rest).name : '-').join(','));
    L.push('fixtures: ' + t.clubSched.map(d => d.fixtures.map(([A, B]) => C.T().clubs.find(c => c.id === A).name[0] + 'v' + C.T().clubs.find(c => c.id === B).name[0]).join('+')).join(' | '));
    L.push('own club never: ' + ms.every(m => C.T().teams.find(x => x.id === m.a[0]).club !== C.T().teams.find(x => x.id === m.b[0]).club) + ' | like for like: ' + ms.every(m => m.a[0].slice(-1) === m.b[0].slice(-1)));
    L.push('pistes day 1 only: ' + (ms.filter(m => m.court).map(m => m.round).join(',')) + ' | page: ' + txt(q('main .rp-live')).slice(0, 60));
    L.push('day pills: ' + qa('main section h3 + .pill').map(x => x.textContent).join(' / ') + ' | fixture: ' + txt(q('.fixture .fx')));
    // play day 1 → day 2 gets pistes
    for (const m of ms.filter(m => m.round === 1)) await C.recordResult(m.id, 13, 5, true);
    await w(80); await C.assignCourts?.(); C.render(); await w(60);
    L.push('after day 1: pistes on ' + [...new Set(C.MS().filter(m => m.court && !m.done).map(m => m.round))].join(',') + ' | day 1 pill ' + qa('main section h3 + .pill')[0].textContent + ' | fixture score ' + txt(q('.fixture .fx')));
    // 5. Standings: club table + team table
    await tab('standings');
    L.push('standings: ' + qa('main h3').map(h => h.textContent).join(',') + ' | club cols ' + qa('main .panel')[0].querySelectorAll('thead th').length + ' | top club ' + txt(qa('main .panel')[0].querySelector('tbody tr')) + ' | team row ' + txt(qa('main .panel')[1].querySelector('tbody tr')));
    // 6. Rotation, 4 clubs × 3 teams: 3 days, 2 fixtures a day, 9 games each with Game 1–3
    await mk({ name: 'Rotation', clubPairing: 'rotation' }, ['Alpha', 'Bravo', 'Charlie', 'Delta'], 3); await tab('draw'); q('[data-act="first-draw"]').click(); await w(250);
    const r = C.T(), rm = C.MS();
    const meets = rm.filter(m => m.round === 1 && m.ca === 'c1').map(m => m.a[0] + '-' + m.b[0]);
    L.push('rotation: days ' + r.clubSched.length + ' | fixtures/day ' + r.clubSched.map(d => d.fixtures.length).join(',') + ' | games ' + rm.length + ' | labels ' + [...new Set(rm.map(m => m.label))].join(',') + ' | each meets each: ' + (new Set(meets).size === 9) + ' | game headings ' + qa('main .fixture .eyebrow').length);
    L.push('game 1 like for like: ' + rm.filter(m => m.game === 1).every(m => m.a[0].slice(-1) === m.b[0].slice(-1)) + ' | own club never: ' + rm.every(m => m.ca !== m.cb));
    // 7. Everyone plays everyone: same games, no game headings
    await mk({ name: 'All', clubPairing: 'all' }, ['Alpha', 'Bravo'], 3); await tab('draw'); q('[data-act="first-draw"]').click(); await w(250);
    L.push('all: days ' + C.T().clubSched.length + ' | games ' + C.MS().length + ' | labels ' + C.MS().every(m => !m.label) + ' | headings ' + qa('main .fixture .eyebrow').length);
    // 8. French and the wizard
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80); await tab('setup');
    L.push('french: ' + qa('[data-set="system"]').map(b => b.textContent).join(',') + ' | ' + qa('[data-set="clubPairing"]').map(b => b.textContent).join(','));
    await tab('draw'); L.push('french day: ' + txt(q('main section h3')) + ' | ' + txt(q('main .rp-live .eyebrow')));
    q('[data-lang="en"]').click(); await w(60);
    q('[data-act="new-t"]').click(); await w(150); q('#wz-name').value = 'Wiz clubs'; q('[data-act="wiz-next"]').click(); await w(60); q('[data-act="wiz-next"]').click(); await w(60);
    q('[data-act="wiz-set"][data-k="system"][data-v="clubs"]').click(); await w(60); q('#wz-clubteams').value = '4'; q('[data-act="wiz-next"]').click(); await w(60); q('[data-act="wiz-next"]').click(); await w(200);
    L.push('wizard saved: ' + C.T().system + ' ' + C.T().clubTeams);
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/clubs.png', fullPage: true }); console.log('errs', errs); await b.close();
})();
