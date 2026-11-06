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
    await tab('draw'); L.push('ready: ' + txt(q('[data-act="first-draw"]')) + ' | ' + (txt(q('main')).match(/4 clubs entered → 6 ties/) || ['none'])[0]);
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
    // 7d. A squad player renamed after the line-ups are named: the line-ups follow, finished games keep the old name
    q('[data-act="new-t"]').click(); await w(100);
    { const t = T(); Object.assign(t, { wizard: false, checkin: false, system: 'eurocup', name: 'Rename' }); t.courts = Array.from({ length: 6 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
      t.teams = [Object.assign({ id: 'na', name: 'North', club: 'North', active: true }, squad('N')), Object.assign({ id: 'nb', name: 'South', club: 'South', active: true }, squad('S'))]; await put(t); }
    await tab('draw'); q('[data-act="first-draw"]').click(); await w(250);
    { const rg = C.MS(), luA = { ot: [4, 5, 6], mt: [1, 7, 8], od1: [1, 4], od2: [6, 7], md: [2, 8] };
      for (const m of rg) { const ka = m.a[0] === 'na' ? 'la' : 'lb', kb = ka === 'la' ? 'lb' : 'la', nos = luA[m.eu];
        const patch = { [ka]: nos.map(n => 'N P' + n), [kb]: nos.map(n => 'S P' + n) }; Object.assign(S.matches[m.id], patch); await S.store.updateMatch(S.tid, m.id, patch); }
      await C.recordResult(rg.find(m => m.eu === 'od1').id, 13, 7, true); await w(100); }
    await tab('entries'); q('[data-act="eu-edit"][data-id="na"]').click(); await w(80);
    q('#nt-p0').value = 'Alice Long'; q('#add-form').requestSubmit(); await w(200);
    { const rg = C.MS(), side = m => m.a[0] === 'na' ? m.la : m.lb, rmt = rg.find(m => m.eu === 'mt'), rmd = rg.find(m => m.eu === 'od1'), rf = C.T().clubFix[0];
      await tab('draw'); q(`[data-act="eu-lineup"][data-fx="${rf.id}"][data-leg="1"]`).click(); await w(80);
      const ka = rmt.a[0] === 'na' ? 'a' : 'b'; if (S.modal.side !== ka) { q(`.modal .lu-clubs [data-side="${ka}"]`).click(); await w(30); }
      L.push('rename after line-ups: line-up shows ' + (txt(q(`.modal [data-act="lu-slot"][data-id="${rmt.id}"][data-i="0"]`)).match(/Alice Long/) || ['none'])[0] + ' | mixed triple ' + (qa('.modal .err span').some(x => /mixed triple/.test(x.textContent)) ? 'error' : 'ok') + ' | save line-ups ' + (q('[data-act="lu-save"]').disabled ? 'disabled' : 'enabled'));
      L.push('rename keeps: squad ' + C.T().teams.find(x => x.id === 'na').players[0] + ' | mixed triple ' + side(rmt).join(',') + ' | finished open double ' + side(rmd).join(','));
      q('.modal [data-act="close"]').click(); await w(40); }
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
  // 10. Pistes: twelve EuroCup games at once; each tile names its game first and the players under each club
  const pistes = async () => p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim(), tiles = qa('.pgrid .ptile'), ms = C.MS();
    const game = el => ms.find(m => m.id === el.dataset.match);
    const label = tiles.every(el => { const c = el.querySelector('.pt-ctx'), m = game(el); return m && txt(c).startsWith(m.label) && c.scrollHeight <= c.clientHeight + 1; });
    const players = tiles.every(el => { const m = game(el), lu = [...el.querySelectorAll('.pt-lu')].map(txt); return lu.length === 2 && lu[0] === m.la.join(', ') && lu[1] === m.lb.join(', '); });
    return { distinct: new Set(tiles.map(txt)).size, n: tiles.length, label, players, width: document.scrollingElement.scrollWidth, first: txt(tiles[0]) }; });
  const setupPistes = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="en"]').click(); await w(80);
    q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { wizard: false, checkin: false, system: 'eurocup', name: 'Pistes' }); t.courts = Array.from({ length: 12 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
    t.teams = ['Riverside', 'Hillside', 'Lakeside', 'Parkside'].map((c, k) => ({ id: 'pk' + k, name: c, club: c, active: true, players: Array.from({ length: 8 }, (_, i) => `${c[0]}${i + 1}`), genders: Array.from({ length: 8 }, (_, i) => i < 3 ? 'f' : 'm') }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(60);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(250);
    const ms = C.MS().sort((a, b) => a.order - b.order).slice(0, 12), club = id => C.T().teams.find(x => x.id === id[0]);
    ms.forEach((m, i) => { const pl = (tm, off) => Array.from({ length: m.size }, (_, j) => tm.players[(off + j) % 8]);
      Object.assign(S.matches[m.id], { la: pl(club(m.a), i), lb: pl(club(m.b), i), court: 'c' + (i + 1) }); });
    C.render(); q('[data-tab="courts"]').click(); await w(80); return ms.length; });
  const pw = await pistes();
  out.push(`pistes tiles distinct: ${pw.distinct} of ${pw.n} | game label visible ${pw.label} | players shown ${pw.players} | first ${pw.first}`);
  await p.screenshot({ path: process.env.OUT + '/eurocup-pistes.png', fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(150);
  const pn = await pistes();
  out.push(`pistes 390: page width ${pn.width} | game label visible ${pn.label} | players shown ${pn.players}`);
  await p.screenshot({ path: process.env.OUT + '/eurocup-pistes-390.png', fullPage: true });
  // 11. Wording: EuroCup says clubs, ties and rounds, with plurals (never "teams", "1 ties" or "1 rounds")
  const wording = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    const txt = el => (el?.innerText || '').replace(/\s+/g, ' ').trim(), tab = async k => { q(`[data-tab="${k}"]`).click(); await w(60); };
    const put = async t => { await S.store.setTournament(t); S.tournaments[t.id] = t; C.render(); await w(60); };
    const club = (c, k, on) => ({ id: 'wd' + k, name: c, club: c, active: true, checkedIn: on, players: Array.from({ length: 8 }, (_, i) => `${c[0]}${i + 1}`), genders: Array.from({ length: 8 }, (_, i) => i < 3 ? 'f' : 'm') });
    const names = ['Riverside', 'Hillside', 'Lakeside', 'Parkside', 'Seaside', 'Westside'];
    q('[data-act="new-t"]').click(); await w(100); let t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { wizard: false, checkin: true, system: 'eurocup', name: 'Wording' }); t.courts = Array.from({ length: 6 }, (_, i) => ({ id: 'c' + (i + 1), name: String(i + 1), active: true }));
    t.teams = names.map((c, k) => club(c, k, k === 0)); await put(t);
    // Registration and Draw & results (Setup's entry type choice, Fixed teams or Mêlée, is the same for every system)
    const seen = []; await tab('entries'); seen.push(txt(q('main'))); await tab('draw'); const pre = txt(q('main')); seen.push(pre);
    L.push('eurocup checked in: ' + (pre.match(/1 club checked in/) || ['none'])[0] + ' | ' + (pre.match(/\d+ entered clubs? (?:hasn't|haven't) checked in/) || ['none'])[0] + ' | ' + (pre.match(/Check in at least \d+ clubs/) || ['none'])[0]);
    t = JSON.parse(JSON.stringify(C.T())); t.checkin = false; t.teams = t.teams.slice(0, 2); await put(t);
    await tab('entries'); seen.push(txt(q('main'))); await tab('setup'); const setup = txt(q('main')); await tab('draw'); const two = txt(q('main')); seen.push(two);
    // drawn: one tie over 2 rounds, then 6 ties all in round 1
    q('[data-act="first-draw"]').click(); await w(250); q('[data-act="club-add-day"]').click(); await w(120); const added = txt(q('main')); seen.push(added);
    t = JSON.parse(JSON.stringify(C.T())); t.draws = []; t.clubFix = undefined; t.teams = names.slice(0, 4).map((c, k) => club(c, k, true)); await put(t);
    for (const m of C.MS()) await S.store.deleteMatch?.(S.tid, m.id);
    q('[data-act="first-draw"]').click(); await w(250); t = JSON.parse(JSON.stringify(C.T())); t.clubFix.forEach(f => f.day = 1); t.clubDays = 1; await put(t); const one = txt(q('main')); seen.push(one);
    const all = seen.join(' ');
    L.push('eurocup counts: setup ' + (setup.match(/\(\d+ clubs → \d+ ties?\)/) || ['none'])[0] + ' | ' + (added.match(/\d+ ties? over \d+ rounds?\b/) || ['none'])[0]
      + ' | ' + (one.match(/\d+ ties? over \d+ rounds?\b/) || ['none'])[0] + ' | ' + (one.match(/Pistes are filled from any \w+, earliest \w+ first/) || ['none'])[0]);
    L.push('eurocup wording: ' + (two.match(/\d+ clubs entered → \d+ ties?\b/) || ['none'])[0] + ' | ' + (/\bteams?\b/i.test(all) ? 'says teams: ' + all.match(/.{0,40}\bteams?\b.{0,20}/i)[0] : 'no "teams"') + ' | ' + (/\b1 ties\b/.test(all) ? 'says "1 ties"' : 'no "1 ties"') + ' | ' + (/\b1 rounds\b/.test(all) ? 'says "1 rounds"' : 'no "1 rounds"'));
    // French: every new line translated, and the draw page before the draw has no English left
    t = JSON.parse(JSON.stringify(C.T())); t.draws = []; t.clubFix = undefined; t.checkin = true; t.teams = names.map((c, k) => club(c, k, k === 0)); await put(t);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80); await tab('draw');
    const lines = ['2 clubs entered → 1 tie', '4 clubs entered → 6 ties', '1 club checked in', "5 entered clubs haven't checked in and won't be in the draw.", "1 entered club hasn't checked in and won't be in the draw.",
      'Check in at least 2 clubs on Registration before drawing.', 'Every club plays every other club once (2 clubs → 1 tie). Two clubs make a single tie, for a knockout round.', '6 ties over 1 round', '1 tie over 2 rounds', '6 ties over 3 rounds',
      'Ties can be moved at any time, even once results are in. Pistes are filled from any round, earliest round first.', '2/2 clubs have a link', 'Check-in is off, so every entered club goes into the draw.', "Clubs must check in on the day before they're included in the draw"];
    const eng = /\b(entered|checked in|ties?|rounds?|have a link|Check in at least|Pistes are filled|earliest|before drawing|must check in)\b/;
    const left = lines.filter(x => C.tr(x) === x || eng.test(C.tr(x))), page = txt(q('main')), pageEng = (page.match(new RegExp('.{0,30}' + eng.source + '.{0,20}')) || [])[0];
    L.push('fr eurocup wording: ' + (left.length || pageEng ? 'English: ' + [...left, pageEng].filter(Boolean).join(' / ') : 'no English') + ' | ' + C.tr('2 clubs entered → 1 tie') + ' | ' + C.tr('1 tie over 2 rounds'));
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack); } return L; });
  out.push(...wording);
  await p.screenshot({ path: process.env.OUT + '/eurocup-wording-fr-390.png', fullPage: true });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
