// EuroCup: clubs enter a squad; every tie is triples, then doubles (and singles at the final stage), each game worth
// game points; line-ups are named from the squad before a game can go to a piste.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)]; const L = []; try {
    const tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim();
    const put = async t => { await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(50); };
    const T = () => JSON.parse(JSON.stringify(C.T()));
    const squad = (c, n = 8) => ({ players: Array.from({ length: n }, (_, i) => `${c} P${i + 1}`), genders: Array.from({ length: n }, (_, i) => i < 3 ? 'f' : 'm') });
    // 1. Setup: EuroCup is a system; the tie format replaces singles/doubles/triples
    q('[data-act="new-t"]').click(); await w(100); { const t = T(); t.wizard = false; t.checkin = false; t.courts = Array.from({ length: 12 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true })); await put(t); }
    await tab('setup'); q('[data-set="system"][data-val="eurocup"]').click(); await w(120);
    L.push('setup: system ' + C.T().system + ' | tie formats ' + qa('[data-set="euroFormat"]').map(x => x.textContent).join(',') + ' | format hidden ' + !q('[data-set="format"]') + ' | seeding hidden ' + !q('[data-set="seeding"]') + ' | pairing hidden ' + !q('[data-set="clubPairing"]'));
    L.push('setup note: ' + (txt(q('main')).match(/Each game won is worth 1 game point, so a tie ends 5–0, 4–1 or 3–2\./) || ['none'])[0]);
    // 2. Registration: a club and its squad from the form
    await tab('entries');
    L.push('form: ' + txt(q('#add-form h3')) + ' | player rows ' + qa('#add-form .sq-row').length + ' | list heading ' + qa('main h3').map(h => h.textContent).filter(h => /Clubs|Teams/.test(h)).join(','));
    q('#nt-name').value = 'Riverside'; for (let i = 0; i < 5; i++) { q('#nt-p' + i).value = 'R' + (i + 1); q('#nt-g' + i).value = i ? 'm' : 'f'; }
    q('#add-form').requestSubmit(); await w(120);
    L.push('added: ' + C.T().teams.map(x => x.name + ' ' + x.players.length + ' ' + x.genders.join('')).join(',') + ' | row ' + txt(q('.erow')).slice(0, 60));
    q('#nt-name').value = 'riverside'; q('#nt-p0').value = 'X'; q('#add-form').requestSubmit(); await w(80); L.push('twice: ' + txt(q('#toast')) + ' | clubs ' + C.T().teams.length);
    // edit the squad: three more players
    q('[data-act="eu-edit"]').click(); await w(80);
    L.push('edit form: ' + txt(q('#add-form h3')) + ' | filled ' + q('#nt-p4').value + ' ' + q('#nt-g4').value);
    for (let i = 5; i < 8; i++) { q('#nt-p' + i).value = 'R' + (i + 1); q('#nt-g' + i).value = i === 5 ? 'f' : 'm'; } q('#add-form').requestSubmit(); await w(120);
    L.push('edited: ' + C.T().teams[0].players.length + ' ' + C.T().teams[0].genders.join('') + ' | pill ' + txt(q('.erow .pill')));
    // paste a list with genders
    q('#bulk').value = 'Hillside: H1 (W), H2 (M), H3 M, H4 (M), H5 (W), H6 (M)\nLakeside: L1 (M), L2 (M), L3 (M), L4 (M), L5 (M), L6 (M)'; q('#bulk-form').requestSubmit(); await w(120);
    L.push('pasted: ' + C.T().teams.slice(1).map(x => x.name + ' ' + x.genders.join('')).join(','));
    await tab('draw'); L.push('blocked: ' + !q('[data-act="first-draw"]') + ' | ' + txt(q('main .notice')).slice(0, 120));
    { const t = T(); t.teams[2].genders[0] = 'f'; t.teams.push(Object.assign({ id: 'e4', name: 'Parkside', club: 'Parkside', active: true }, squad('PK'))); await put(t); }
    await tab('draw'); L.push('ready: ' + txt(q('[data-act="first-draw"]')) + ' | ' + (txt(q('main')).match(/4 clubs → 6 fixtures/) || ['none'])[0]);
    // 3. Draw: 6 ties over 3 rounds, 5 games each; nothing goes to a piste before the line-ups
    q('[data-act="first-draw"]').click(); await w(250);
    let ms = C.MS(); const t1 = C.T();
    L.push('drawn: ties ' + t1.clubFix.length + ' | rounds ' + [...new Set(t1.clubFix.map(f => f.day))].join(',') + ' | games ' + ms.length + ' | per tie ' + ms.filter(m => m.ca === t1.clubFix[0].a && m.cb === t1.clubFix[0].b).map(m => m.label + ':' + m.pts).join(',') + ' | on pistes ' + ms.filter(m => m.court).length);
    L.push('page: ' + txt(q('main .rp-live')).slice(0, 60) + ' | leg heads ' + qa('.eu-leg .eyebrow').slice(0, 2).map(x => x.textContent).join(',') + ' | first card ' + txt(q('.fixture .match')).slice(0, 60));
    L.push('context: ' + C.matchContext(C.T(), ms.find(m => m.eu === 'mt' && m.round === 1)));
    // 4. Line-ups: tap a game, the line-ups open
    const f0 = C.T().clubFix.find(f => f.day === 1), g0 = C.MS().filter(m => m.ca === f0.a && m.cb === f0.b);
    q(`[data-match="${g0[0].id}"]`).click(); await w(80);
    L.push('tap opens line-ups: ' + !!q('.modal.lineups') + ' | legs ' + qa('.modal [data-act="lu-leg"]').map(x => x.textContent).join(',') + ' | selects ' + qa('.modal select').length + ' | options ' + q('.modal select').options.length);
    const sqA = C.T().teams.find(x => x.id === g0[0].a[0]).players, sqB = C.T().teams.find(x => x.id === g0[0].b[0]).players;
    const set = async (mid, side, i, v) => { const el = q(`.modal select[data-lu="${mid}"][data-side="${side}"][data-i="${i}"]`); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); await w(30); };
    const ot = g0.find(m => m.eu === 'ot'), mt = g0.find(m => m.eu === 'mt');
    // A: open triple the three men, mixed triple all men too (not allowed), and a player twice
    const menA = sqA.filter((_, i) => C.T().teams.find(x => x.id === g0[0].a[0]).genders[i] === 'm'), womenA = sqA.filter((_, i) => C.T().teams.find(x => x.id === g0[0].a[0]).genders[i] === 'f');
    for (let i = 0; i < 3; i++) await set(ot.id, 'a', i, menA[i]);
    await set(mt.id, 'a', 0, menA[0]); await set(mt.id, 'a', 1, menA[3]); await set(mt.id, 'a', 2, menA[4] || menA[1]);
    L.push('errors: ' + qa('.modal .err span').map(x => x.textContent).join(' / ') + ' | save disabled ' + q('[data-act="lu-save"]').disabled);
    await set(mt.id, 'a', 0, womenA[0]); await set(mt.id, 'a', 2, womenA[1]);
    L.push('fixed: errors ' + qa('.modal .err span').length + ' | save disabled ' + q('[data-act="lu-save"]').disabled);
    q('[data-act="lu-save"]').click(); await w(200);
    L.push('one side saved: ' + txt(q('#toast')) + ' | on pistes ' + C.MS().filter(m => m.court).length + ' | card ' + txt(q(`[data-match="${ot.id}"]`)).slice(0, 80));
    // B names its triples: both triples go to pistes, the doubles wait for theirs
    q(`[data-act="eu-lineup"][data-fx="${f0.id}"][data-leg="1"]`).click(); await w(80);
    const gB = C.T().teams.find(x => x.id === g0[0].b[0]).genders, menB = sqB.filter((_, i) => gB[i] === 'm'), womenB = sqB.filter((_, i) => gB[i] === 'f');
    for (let i = 0; i < 3; i++) await set(ot.id, 'b', i, menB[i]); await set(mt.id, 'b', 0, womenB[0]); await set(mt.id, 'b', 1, menB[3] || womenB[1]); await set(mt.id, 'b', 2, menB[4] || womenB[2] || menB[0]);
    L.push('B errors: ' + qa('.modal .err span').map(x => x.textContent).join(' / '));
    q('[data-act="lu-save"]').click(); await w(200);
    L.push('triples on pistes: ' + C.MS().filter(m => m.court && m.ca === f0.a && m.cb === f0.b).map(m => m.eu).join(',') + ' | toast ' + txt(q('#toast')));
    // doubles line-ups now (both clubs), they wait for the triples to finish
    q(`[data-act="eu-lineup"][data-fx="${f0.id}"][data-leg="2"]`).click(); await w(80);
    const dbl = g0.filter(m => m.leg === 2); let k = 0; for (const m of dbl) { for (let i = 0; i < 2; i++) { await set(m.id, 'a', i, m.mixed ? (i ? menA[4] : womenA[0]) : menA[(k + i) % menA.length]); await set(m.id, 'b', i, m.mixed ? (i ? menB[4] || womenB[1] : womenB[0]) : menB[(k + i) % menB.length]); } k += 2; }
    L.push('doubles errors: ' + qa('.modal .err span').length + ' | warns ' + qa('.modal .notice span').length);
    q('[data-act="lu-save"]').click(); await w(200);
    L.push('doubles wait: ' + C.MS().filter(m => m.court && m.leg === 2).length);
    await C.recordResult(ot.id, 13, 4, true); await C.recordResult(mt.id, 9, 13, true); await w(150);
    L.push('after triples: doubles on pistes ' + C.MS().filter(m => m.court && m.leg === 2 && m.ca === f0.a).length + ' | fixture ' + txt(q(`[data-fx-box="${f0.id}"] .fx`)));
    for (const [i, m] of dbl.entries()) await C.recordResult(m.id, i === 2 ? 5 : 13, i === 2 ? 13 : 7, true); await w(150);
    L.push('tie done: ' + txt(q(`[data-fx-box="${f0.id}"] .fx`)) + ' | card players ' + txt(q(`[data-match="${ot.id}"] .lu`)));
    // score dialog shows the line-up and offers a change
    q(`[data-match="${ot.id}"]`).click(); await w(80); L.push('score dialog: ' + txt(q('.modal .who')).slice(0, 40) + ' | change button ' + !!q('.modal [data-act="lu-open"]')); q('.modal [data-act="close"]').click(); await w(40);
    // 5. Standings: club table and players
    await tab('standings');
    L.push('standings: ' + qa('main h3').map(h => h.textContent).join(',') + ' | cols ' + qa('main .panel')[0].querySelectorAll('thead th').length + ' | top ' + txt(qa('main .panel')[0].querySelector('tbody tr')) + ' | grid ' + qa('.results-grid .g-res').map(x => x.textContent).filter(x => /–/.test(x)).join(','));
    L.push('players top: ' + txt(qa('main .panel').find(x => x.querySelector('h3')?.textContent === 'Players')?.querySelector('tbody tr')));
    // 6. Ranking: level on ties won and game points → the tie between them decides
    q('[data-act="new-t"]').click(); await w(100);
    { const t = T(); Object.assign(t, { wizard: false, checkin: false, system: 'eurocup', name: 'Ranking' }); t.teams = ['Alpha', 'Bravo', 'Charlie', 'Delta'].map(c => Object.assign({ id: 'r' + c[0], name: c, club: c, active: true }, squad(c[0]))); await put(t); }
    await tab('draw'); q('[data-act="first-draw"]').click(); await w(250);
    const cid = n => C.T().clubs.find(c => c.name === n).id;
    // A beat B 3–2 (close games), lost to C 2–3, beat D 3–2; B lost to A 2–3, beat C and D 3–2 (big wins): both 2 ties, 8 game points
    const play = async (x, y, gx, big) => { const X = cid(x), Y = cid(y); const gs = C.MS().filter(m => (m.ca === X && m.cb === Y) || (m.ca === Y && m.cb === X)).sort((a, b) => a.order - b.order);
      for (const [i, m] of gs.entries()) { const xWins = i < gx, xa = m.ca === X; const w1 = 13, l1 = big ? 0 : 12; await C.recordResult(m.id, xa === xWins ? w1 : l1, xa === xWins ? l1 : w1, true); } };
    await play('Alpha', 'Bravo', 3); await play('Alpha', 'Charlie', 2); await play('Alpha', 'Delta', 3); await play('Bravo', 'Charlie', 3, true); await play('Bravo', 'Delta', 3, true); await play('Charlie', 'Delta', 2);
    await w(100); await tab('standings');
    L.push('ranking: ' + qa('main .panel')[0].querySelectorAll('tbody tr').length + ' | ' + [...qa('main .panel')[0].querySelectorAll('tbody tr')].map(r => txt(r.querySelector('.wrap')) + ' ' + r.children[3].textContent + '/' + r.children[5].textContent).join(', '));
    // 7. Final format: 2 clubs, 11 games worth 31 points; the singles reminder
    q('[data-act="new-t"]').click(); await w(100);
    { const t = T(); Object.assign(t, { wizard: false, checkin: false, system: 'eurocup', euroFormat: 'final', name: 'Final' }); t.courts = Array.from({ length: 6 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      t.teams = [Object.assign({ id: 'fa', name: 'North', club: 'North', active: true }, squad('N')), Object.assign({ id: 'fb', name: 'South', club: 'South', active: true }, squad('S'))]; await put(t); }
    await tab('setup'); L.push('final setup: ' + (txt(q('main')).match(/A tie is worth 31 game points[^.]*\./) || ['none'])[0] + ' | legs ' + qa('.euro-legs b').map(x => x.textContent).join(','));
    await tab('draw'); q('[data-act="first-draw"]').click(); await w(250);
    ms = C.MS(); L.push('final drawn: games ' + ms.length + ' | points ' + ms.reduce((n, m) => n + m.pts, 0) + ' | legs ' + [1, 2, 3].map(l => ms.filter(m => m.leg === l).length).join(','));
    const ff = C.T().clubFix[0]; q(`[data-act="eu-lineup"][data-fx="${ff.id}"][data-leg="3"]`).click(); await w(80);
    const sg = ms.filter(m => m.leg === 3).sort((x, y) => x.order - y.order);
    const nOrd = ['N P1', 'N P4', 'N P5', 'N P6', 'N P7', 'N P8'], sOrd = ['S P4', 'S P5', 'S P6', 'S P7', 'S P8', 'S P1'];
    for (const [i, m] of sg.entries()) { await set(m.id, 'a', 0, nOrd[i]); await set(m.id, 'b', 0, sOrd[i]); }
    L.push('singles: ' + qa('.modal .err span').map(x => x.textContent).join(' / ') + ' | warn ' + qa('.modal .notice span').map(x => x.textContent).join(' / '));
    await set(sg[0].id, 'a', 0, 'N P2'); await set(sg[0].id, 'b', 0, 'S P2');
    L.push('woman v woman: warns ' + qa('.modal .notice span').map(x => x.textContent).filter(x => /singles/.test(x)).length);
    q('[data-act="lu-save"]').click(); await w(200);
    L.push('singles saved, not on pistes before the doubles: ' + C.MS().filter(m => m.court).length);
    // all games played: North win both triples (10) and one double (3) = 13; South 2 doubles (6) + 6 singles (12) = 18
    const all = C.MS(); for (const m of all) { const lu = Array.from({ length: m.size }, (_, i) => 'x' + i); S.matches[m.id].la = m.la?.filter(Boolean).length === m.size ? m.la : lu.map((_, i) => `N P${i + 1}`); S.matches[m.id].lb = m.lb?.filter(Boolean).length === m.size ? m.lb : lu.map((_, i) => `S P${i + 1}`); }
    for (const m of all.sort((x, y) => x.order - y.order)) { const nWin = m.leg === 1 || m.eu === 'od1'; await C.recordResult(m.id, nWin ? 13 : 6, nWin ? 6 : 13, true); }
    await w(150); C.render(); await w(40);
    L.push('final tie: ' + txt(q('.fixture .fx')));
    await tab('standings'); L.push('final table: ' + txt(qa('main .panel')[0].querySelector('tbody tr')));
    // 8. Quick setup offers EuroCup
    q('[data-act="new-t"]').click(); await w(150); q('#wz-name').value = 'Euro'; q('[data-act="wiz-next"]').click(); await w(50);
    q('[data-act="wiz-set"][data-k="kind"][data-v="eurocup"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(50);
    L.push('wizard: ' + qa('[data-k="euroFormat"]').map(x => x.dataset.v).join(','));
    q('[data-act="wiz-set"][data-k="euroFormat"][data-v="final"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(50); q('[data-act="wiz-next"]').click(); await w(120);
    L.push('wizard saved: ' + C.T().system + ' ' + C.T().euroFormat + ' ' + C.T().entry + ' | toast ' + txt(q('#toast')));
    // 9. French
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80); await tab('setup');
    L.push('french: ' + qa('[data-set="euroFormat"]').map(x => x.textContent).join(',') + ' | ' + txt(q('[data-set="system"][data-val="eurocup"]')) + ' | ' + C.tr('Name the line-ups') + ' | ' + C.tr('Riverside: R2 is in two triples games.') + ' | ' + C.tr('6 ties over 3 rounds'));
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
