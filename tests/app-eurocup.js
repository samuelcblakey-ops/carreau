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
    // bigger clubs: + Add a player adds a place, and nothing typed is lost when the page redraws
    q('[data-act="eu-edit"]').click(); await w(80);
    const typeIn = (i, v, g) => { q('#nt-p' + i).value = v; q('#nt-p' + i).dispatchEvent(new Event('input', { bubbles: true })); q('#nt-g' + i).value = g; q('#nt-g' + i).dispatchEvent(new Event('input', { bubbles: true })); };
    const rows0 = qa('#add-form .sq-row').length; typeIn(8, 'R9', 'm');
    q('[data-act="eu-add-row"]').click(); await w(80);
    L.push('add a player: rows ' + rows0 + ' → ' + qa('#add-form .sq-row').length + ' | typed kept ' + q('#nt-p8').value + ' ' + q('#nt-g8').value + ' | new place focused ' + (document.activeElement?.id === 'nt-p9'));
    C.render(); await w(40); L.push('after a redraw: ' + q('#nt-p8').value + ' | rows ' + qa('#add-form .sq-row').length);
    for (let i = 9; i < 15; i++) { if (!q('#nt-p' + i)) { q('[data-act="eu-add-row"]').click(); await w(60); } typeIn(i, 'R' + (i + 1), 'm'); }
    q('#add-form').requestSubmit(); await w(120);
    L.push('big squad: ' + C.T().teams[0].players.length + ' | last ' + C.T().teams[0].players.slice(-1)[0] + ' | pill ' + txt(q('.erow .pill')));
    q('[data-act="eu-edit"]').click(); await w(80);
    L.push('edit big squad: rows ' + qa('#add-form .sq-row').length + ' | all there ' + (q('#nt-p14').value === 'R15') + ' | eyebrow ' + txt(q('#add-form .eyebrow')));
    q('[data-act="eu-edit-cancel"]').click(); await w(60);
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
    // 4. Line-ups: tap a game, the line-ups open with one club's places and its squad as name buttons
    const f0 = C.T().clubFix.find(f => f.day === 1), g0 = C.MS().filter(m => m.ca === f0.a && m.cb === f0.b);
    const ot = g0.find(m => m.eu === 'ot'), mt = g0.find(m => m.eu === 'mt'), names = () => qa('.modal .lu-p').map(b => b.firstElementChild.textContent);
    const pick = async v => { const b = qa('.modal .lu-p').find(b => b.firstElementChild.textContent === v); if (!b) return false; b.click(); await w(30); return true; };
    // a place by hand: the right club, tap the place (empties it if filled), then the name
    const set = async (mid, side, i, v) => { if (S.modal.side !== side) { q(`.modal .lu-clubs [data-side="${side}"]`).click(); await w(30); }
      q(`.modal [data-act="lu-slot"][data-id="${mid}"][data-i="${i}"]`).click(); await w(30); return v ? pick(v) : true; };
    q(`[data-match="${ot.id}"]`).click(); await w(80);
    L.push('tap opens line-ups: ' + !!q('.modal.lineups') + ' | legs ' + qa('.modal [data-act="lu-leg"]').map(x => x.textContent).join(',') + ' | clubs ' + qa('.modal .lu-clubs button').map(x => x.textContent).join(',') + ' | drop-downs ' + qa('.modal select').length + ' | places ' + qa('.modal .lu-slot').length + ' | names ' + names().length + ' | first place next ' + (q('.modal .lu-slot.on')?.dataset.id === ot.id && q('.modal .lu-slot.on')?.dataset.i === '0'));
    const tmA = C.T().teams.find(x => x.id === ot.a[0]), tmB = C.T().teams.find(x => x.id === ot.b[0]);
    const menA = tmA.players.filter((_, i) => tmA.genders[i] === 'm'), womenA = tmA.players.filter((_, i) => tmA.genders[i] === 'f');
    const menB = tmB.players.filter((_, i) => tmB.genders[i] === 'm'), womenB = tmB.players.filter((_, i) => tmB.genders[i] === 'f');
    // tapping three names in a row fills the open triple and moves on to the mixed triple; picked players leave the names
    for (const n of menA.slice(0, 3)) await pick(n);
    L.push('auto-advance: open triple ' + S.modal.sel[ot.id].a.join(',') + ' | next place mixed 1 ' + (S.modal.cur?.id === mt.id && S.modal.cur?.i === 0) + ' | picked gone ' + !names().some(n => menA.slice(0, 3).includes(n)) + ' | names left ' + names().length + ' | can pick again ' + await pick(menA[0]));
    // three men in the mixed triple: refused
    for (const n of menA.slice(3, 6)) await pick(n);
    L.push('mixed error: ' + qa('.modal .err span').map(x => x.textContent).join(' / ') + ' | save disabled ' + q('[data-act="lu-save"]').disabled + ' | full: ' + txt(q('.modal .lu-squad')).slice(0, 70));
    // tap a filled place: it empties and its player is back in the names
    q(`.modal [data-act="lu-slot"][data-id="${mt.id}"][data-i="0"]`).click(); await w(30);
    L.push('tap a filled place: emptied ' + (S.modal.sel[mt.id].a[0] === '') + ' | highlighted ' + (S.modal.cur?.id === mt.id && S.modal.cur?.i === 0) + ' | back in names ' + names().includes(menA[3]));
    await pick(womenA[0]);
    L.push('fixed: errors ' + qa('.modal .err span').length + ' | save disabled ' + q('[data-act="lu-save"]').disabled + ' | next button ' + txt(q('.modal .lu-squad [data-act="lu-side"]')));
    q('[data-act="lu-save"]').click(); await w(200);
    L.push('one side saved: ' + txt(q('#toast')) + ' | on pistes ' + C.MS().filter(m => m.court).length + ' | card ' + txt(q(`[data-match="${ot.id}"]`)).slice(0, 80));
    // the other club, through the Next button: both triples go to pistes, the doubles wait for theirs
    q(`[data-act="eu-lineup"][data-fx="${f0.id}"][data-leg="1"]`).click(); await w(80);
    L.push('reopen: club ' + S.modal.side + ' full ' + !S.modal.cur + ' | next ' + txt(q('.modal .lu-squad [data-act="lu-side"]')));
    q('.modal .lu-squad [data-act="lu-side"]').click(); await w(40);
    for (const n of [...menB.slice(0, 3), womenB[0], menB[3], menB[4]]) await pick(n);
    L.push('B: errors ' + qa('.modal .err span').length + ' | clubs ' + qa('.modal .lu-clubs button').map(x => x.textContent).join(',') + ' | legs ' + qa('.modal [data-act="lu-leg"]').map(x => x.textContent).join(',') + ' | next ' + txt(q('.modal .lu-squad [data-act="lu-leg"]')));
    q('[data-act="lu-save"]').click(); await w(200);
    L.push('triples on pistes: ' + C.MS().filter(m => m.court && m.ca === f0.a && m.cb === f0.b).map(m => m.eu).sort().join(',') + ' | toast ' + txt(q('#toast')));
    // doubles, both clubs, tapping names in playing order; they wait for the triples to finish
    q(`[data-act="eu-lineup"][data-fx="${f0.id}"][data-leg="2"]`).click(); await w(80);
    for (const n of [menA[0], menA[1], menA[2], menA[3], womenA[0], menA[4]]) await pick(n);
    q('.modal .lu-squad [data-act="lu-side"]').click(); await w(40);
    for (const n of [menB[0], menB[1], menB[2], menB[3], womenB[0], menB[4]]) await pick(n);
    const dbl = g0.filter(m => m.leg === 2);
    L.push('doubles errors: ' + qa('.modal .err span').length + ' | warns ' + qa('.modal .notice span').length + ' | mixed double ' + S.modal.sel[dbl.find(m => m.mixed).id].a.join(',') + ' v ' + S.modal.sel[dbl.find(m => m.mixed).id].b.join(','));
    q('[data-act="lu-save"]').click(); await w(200);
    L.push('doubles wait: ' + C.MS().filter(m => m.court && m.leg === 2).length);
    // Same as last tie: the club's next tie copies its round 1 triples; a player who has left the squad leaves an empty place
    { const tt = T(), r = tt.teams.find(x => x.id === tmA.id), j = r.players.indexOf(menA[1]); r.players.splice(j, 1); r.genders.splice(j, 1); await put(tt); }
    const f1 = C.T().clubFix.find(f => f.day > 1 && (f.a === f0.a || f.b === f0.a)), k1 = f1.a === f0.a ? 'a' : 'b';
    q(`[data-act="eu-lineup"][data-fx="${f1.id}"][data-leg="1"]`).click(); await w(80);
    if (S.modal.side !== k1) { q(`.modal .lu-clubs [data-side="${k1}"]`).click(); await w(30); }
    const otherClub = !!q('.modal [data-act="lu-copy"]');
    q('.modal [data-act="lu-copy"]').click(); await w(60);
    const g1 = C.MS().filter(m => m.ca === f1.a && m.cb === f1.b), ot1 = g1.find(m => m.eu === 'ot'), mt1 = g1.find(m => m.eu === 'mt');
    L.push('same as last tie: button ' + otherClub + ' | open triple ' + S.modal.sel[ot1.id][k1].map(x => x || '_').join(',') + ' | mixed ' + S.modal.sel[mt1.id][k1].join(',') + ' | note ' + txt(q('.modal .lu-squad .notice')) + ' | highlighted the empty place ' + (S.modal.cur?.id === ot1.id && S.modal.cur?.i === 1));
    q('.modal [data-act="close"]').click(); await w(40);
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
    // 7b. Triples & doubles with the organiser's points: 5 and 3 make 19 (first to 10); 6 and 3 make 21 (first to 11)
    q('[data-act="new-t"]').click(); await w(100);
    { const t = T(); Object.assign(t, { wizard: false, checkin: false, system: 'eurocup', name: 'Points' }); t.courts = Array.from({ length: 6 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      t.teams = [Object.assign({ id: 'pa', name: 'North', club: 'North', active: true }, squad('N')), Object.assign({ id: 'pb', name: 'South', club: 'South', active: true }, squad('S'))]; await put(t); }
    await tab('setup'); q('[data-set="euroFormat"][data-val="points"]').click(); await w(120);
    const ptsNote = () => (txt(q('main')).match(/A tie is worth \d+ points: triples \d+ each, doubles \d+ each\. The first club to \d+ wins the tie[^.]*\./) || ['none'])[0];
    L.push('points setup: format ' + C.T().euroFormat + ' | boxes ' + q('#f-euptt').value + ' ' + q('#f-euptd').value + ' | ' + ptsNote() + ' | pills ' + qa('.euro-legs .pill').map(x => x.textContent).join(','));
    const setBox = async (id, v) => { const el = q(id); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); await w(120); };
    await setBox('#f-euptt', '6'); L.push('triples 6: ' + ptsNote() + ' | even note ' + /can end level/.test(txt(q('main'))));
    await setBox('#f-euptt', '4'); await setBox('#f-euptd', '2'); L.push('4 and 2: ' + ptsNote() + ' | even note ' + /With an even total a tie can end level\./.test(txt(q('main'))));
    await setBox('#f-euptt', '6'); await setBox('#f-euptd', '3');
    await tab('draw'); q('[data-act="first-draw"]').click(); await w(250);
    const pg = C.MS().sort((a, b) => a.order - b.order), pf = C.T().clubFix[0];
    L.push('points drawn: ' + pg.map(m => m.eu + ':' + m.pts).join(',') + ' | total ' + pg.reduce((n, m) => n + m.pts, 0) + ' | tag ' + txt(q('.fixture .spread .row')));
    for (const m of pg) { S.matches[m.id].la = Array.from({ length: m.size }, (_, i) => `N P${i + (m.leg === 1 && m.mixed ? 1 : 4)}`); S.matches[m.id].lb = Array.from({ length: m.size }, (_, i) => `S P${i + (m.leg === 1 && m.mixed ? 1 : 4)}`); }
    // North win both triples: 12 of 21 passes 11, so the tie is North's with the doubles still to play
    for (const m of pg.filter(m => m.leg === 1)) await C.recordResult(m.id, 13, 5, true);
    await C.assignCourts(); await w(100); C.render(); await w(40);
    L.push('decided at 12: ' + txt(q('.fixture .fx')) + ' | tag ' + txt(q('.fixture .spread .row')) + ' | doubles still on pistes ' + C.MS().filter(m => m.leg === 2 && m.court).length);
    await tab('standings'); const prow = () => [...qa('main .panel')[0].querySelectorAll('tbody tr')].map(r => txt(r)).join(' / ');
    L.push('table while doubles play: ' + prow());
    for (const m of pg.filter(m => m.leg === 2)) await C.recordResult(m.id, 6, 13, true);
    await w(100); C.render(); await w(40);
    L.push('table at the end: ' + prow() + ' | note ' + (txt(q('main')).match(/GP is game points: 6 for a triples win, 3 for doubles\. A tie counts as won as soon as a club has more than half its points\./) || ['none'])[0]);
    await tab('draw'); L.push('tie at the end: ' + txt(q('.fixture .fx')) + ' | tag ' + txt(q('.fixture .spread .row')));
    // 7c. No club in two ties at once: Inter-club's hidden days don't squash the rounds, and a tie moved into a busy round waits
    q('[data-act="new-t"]').click(); await w(100);
    { const t = T(); Object.assign(t, { wizard: false, checkin: false, system: 'clubs', clubDays: 1, name: 'Busy' }); t.courts = Array.from({ length: 12 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      t.teams = ['Ash', 'Birch', 'Cedar'].map(c => Object.assign({ id: 'b' + c[0], name: c, club: c, active: true }, squad(c))); await put(t); }
    { const t = T(); t.system = 'eurocup'; await put(t); }
    await tab('draw'); q('[data-act="first-draw"]').click(); await w(250);
    L.push('eurocup draw after inter-club days 1: rounds ' + new Set(C.T().clubFix.map(f => f.day)).size);
    const mv = C.T().clubFix.find(f => f.day === 2);
    let dayBtn = q(`[data-act="fx-day"][data-fx="${mv.id}"][data-day="1"]`); if (!dayBtn) { qa('main details').forEach(d => d.open = true); C.render(); await w(60); dayBtn = q(`[data-act="fx-day"][data-fx="${mv.id}"][data-day="1"]`); }
    dayBtn.click(); await w(250);
    { const lu = { ot: [4, 5, 6], mt: [1, 2, 3], od1: [4, 5], od2: [6, 7], md: [1, 8] }, nm = id => C.T().teams.find(x => x.id === id).name;
      for (const m of C.MS()) { const la = lu[m.eu].map(i => `${nm(m.a[0])} P${i}`), lb = lu[m.eu].map(i => `${nm(m.b[0])} P${i}`); Object.assign(S.matches[m.id], { la, lb }); await S.store.updateMatch(S.tid, m.id, { la, lb }); } }
    await C.assignCourts(); await w(150);
    const onPistes = () => C.MS().filter(m => m.court && !m.done);
    const twoTies = () => { const by = {}; for (const m of onPistes()) for (const c of [m.ca, m.cb]) (by[c] = by[c] || new Set()).add(m.ca + 'v' + m.cb); return Object.keys(by).filter(c => by[c].size > 1).map(c => C.T().clubs.find(x => x.id === c).name); };
    const twice = () => { const seen = {}; for (const m of onPistes()) for (const p of [...m.la, ...m.lb]) seen[p] = (seen[p] || 0) + 1; return Object.keys(seen).filter(p => seen[p] > 1); };
    const mvOn = () => onPistes().some(m => m.ca === mv.a && m.cb === mv.b);
    L.push('tie moved into a busy round: moved ' + (C.T().clubFix.find(f => f.id === mv.id).day === 1) + ' | clubs in two ties on pistes ' + (twoTies().join(',') || 'none') + ' | same player on two pistes ' + (twice().join(',') || 'none') + ' | moved tie on pistes ' + mvOn());
    // the tie already playing in round 1 finishes: the moved tie gets its pistes
    const first = C.T().clubFix.find(f => f.id !== mv.id && onPistes().some(m => m.ca === f.a && m.cb === f.b));
    for (const leg of [1, 2]) { for (const m of C.MS().filter(m => m.ca === first.a && m.cb === first.b && m.leg === leg)) await C.recordResult(m.id, 13, 7, true); await w(100); }
    L.push('after the first tie finishes: moved tie on pistes ' + mvOn() + ' | clubs in two ties on pistes ' + (twoTies().join(',') || 'none'));
    // 8. Quick setup offers EuroCup
    q('[data-act="new-t"]').click(); await w(150); q('#wz-name').value = 'Euro'; q('[data-act="wiz-next"]').click(); await w(50);
    q('[data-act="wiz-set"][data-k="kind"][data-v="eurocup"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(50);
    L.push('wizard: ' + qa('[data-k="euroFormat"]').map(x => x.dataset.v).join(','));
    q('[data-act="wiz-set"][data-k="euroFormat"][data-v="final"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(50); q('[data-act="wiz-next"]').click(); await w(120);
    L.push('wizard saved: ' + C.T().system + ' ' + C.T().euroFormat + ' ' + C.T().entry + ' | toast ' + txt(q('#toast')));
    // 9. French
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80); await tab('setup');
    L.push('french: ' + qa('[data-set="euroFormat"]').map(x => x.textContent).join(',') + ' | ' + txt(q('[data-set="system"][data-val="eurocup"]')) + ' | ' + C.tr('Name the line-ups') + ' | ' + C.tr('Riverside: R2 is in two triples games.') + ' | ' + C.tr('6 ties over 3 rounds'));
    L.push('french picker: ' + C.tr('Same as last tie') + ' | ' + C.tr('Next:') + ' | ' + C.tr('Tap a name to fill the next place. Tap a filled place to change it.') + ' | ' + C.tr("Copied from round 2. 1 player isn't in the squad any more, so that place is empty.") + ' | ' + C.tr('+ Add a player'));
    L.push('french points: ' + C.tr('Points for a triples win') + ' | ' + C.tr('A tie is worth 19 points: triples 5 each, doubles 3 each. The first club to 10 wins the tie; the rest of its games are still played and count towards the points.') + ' | ' + C.tr('win the tie') + ' | ' + C.tr('First to 10'));
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
