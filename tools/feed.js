#!/usr/bin/env node
// Results feed: bring a competition up to date from a results file, through its organiser link.
//   node tools/feed.js --link <organiser link> --file <event.json> [--dry-run]
// It only adds what's missing (teams, rounds, brackets, results, shooting totals) and never overwrites:
// anything SN Pétanque already has that differs from the file is printed as CONFLICT and left alone.
// Exit codes: 0 done, 1 couldn't run (bad file, page didn't load), 2 conflicts or unusable items, 3 no organiser access.
// File format and examples: tools/feed.md.
const fs = require('fs');

const USAGE = 'usage: node tools/feed.js --link <organiser link> --file <event.json> [--dry-run]';
function args(argv) {
  const o = { dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') o.dry = true;
    else if (a === '--link' || a === '--file') o[a.slice(2)] = argv[++i];
    else if (a.startsWith('--link=') || a.startsWith('--file=')) o[a.slice(2, 6)] = a.slice(7);
    else if (a === '-h' || a === '--help') { console.log(USAGE); process.exit(0); }
    else { console.error(`feed: unknown option ${a}\n${USAGE}`); process.exit(1); }
  }
  if (!o.link || !o.file) { console.error(USAGE); process.exit(1); }
  return o;
}
const fail = (msg, code = 1) => { console.error('feed: ' + msg); process.exit(code); };

function readFile(path) {
  let f;
  try { f = JSON.parse(fs.readFileSync(path, 'utf8')); } catch (e) { fail(`can't read ${path}: ${e.message}`); }
  if (!f || typeof f !== 'object' || Array.isArray(f)) fail(`${path}: expected a JSON object`);
  if (!['swiss', 'shooting', 'knockout'].includes(f.kind)) fail(`${path}: "kind" must be "swiss", "knockout" or "shooting"`);
  for (const k of ['teams', 'rounds', 'brackets']) if (f[k] != null && !Array.isArray(f[k])) fail(`${path}: "${k}" must be a list`);
  if (f.shooting != null && typeof f.shooting !== 'object') fail(`${path}: "shooting" must be an object`);
  return f;
}

// Runs inside the page, with the app's own functions (window.__carreau). Returns the plan lines and the counts.
async function feedInPage({ file, dry }) {
  const C = window.__carreau, S = C.S;
  const out = [], n = { teams: 0, rounds: 0, brackets: 0, results: 0, conflicts: 0, bad: 0 };
  const say = s => out.push(s);
  const conflict = (what, site, fileV) => { n.conflicts++; say(`CONFLICT ${what}: site ${site}, file ${fileV}`); };
  const bad = (what, why) => { n.bad++; say(`BAD ${what}: ${why}`); };
  if (dry) { // the same steps, with every write to the server turned into nothing: the page's own copy shows what would change
    for (const k of Object.keys(S.store)) if (typeof S.store[k] === 'function' && !/^(watch|get|list|uid$)/.test(k)) S.store[k] = async () => {};
  }
  const T = () => C.T(), MS = () => C.MS();
  const key = (x, y) => [x || 'bye', y || 'bye'].sort().join('|');
  const flagless = s => String(s || '').replace(/(?:[\u{1F1E6}-\u{1F1FF}]|\u{1F3F4}[\u{E0020}-\u{E007F}]*)️?\s*/gu, '').trim();
  const short = id => { if (!id) return 'bye'; const nm = flagless(C.entName(T(), id)); const m = nm.match(/\(([^()]+)\)\s*$/); return m ? m[1].trim() : nm; };
  const shoot = C.sysOf(T()) === 'shooting';
  const entered = () => (shoot ? T().players : T().teams).filter(e => e.active !== false).map(e => e.id);
  const find = (s, ids = entered()) => { if (/^bye$/i.test(String(s).trim())) return { bye: true }; const h = C.ownFind(C.ownTeams(T(), ids), s); return h.length === 1 ? { id: h[0].id } : { none: !h.length, many: h.length > 1 }; };
  const idOf = (s, what) => { const r = find(s); if (r.id) return r.id; bad(what, r.many ? `"${s}" matches more than one team` : `no team called "${s}"`); return null; };
  const num = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
  const sc = (a, b) => `${a ?? '–'}-${b ?? '–'}`;

  // 1. teams (or shooters) in the file but not registered
  const list = shoot ? T().players : T().teams;
  const all = list.map(e => e.id);
  const add = [];
  for (const raw of file.teams || []) {
    const name = String(raw || '').trim(); if (!name) continue;
    const r = find(name, all); if (r.many) { bad(`team ${name}`, 'matches more than one registered team'); continue; }
    if (r.id) continue;
    if (add.some(x => C.ownFind(C.ownTeams({ ...T(), teams: [x], players: [x] }, [x.id]), name).length)) continue;
    const e = shoot ? { id: 'p' + Math.random().toString(36).slice(2, 9), name, active: true } : { id: 'e' + Math.random().toString(36).slice(2, 9), name, players: [], club: '', active: true };
    if (T().checkin) e.checkedIn = true; // on the official draw, so they're here
    add.push(e); say(`+ team ${name}`);
  }
  if (add.length) {
    const t = C.clone(T()); (shoot ? t.players : t.teams).push(...add);
    await C.saveT(t); n.teams += add.length;
  }

  const recordGame = async (what, m, fa, g) => { // a finished game from the file against the game on the site
    const flip = m.a?.[0] !== fa; const fs_ = flip ? [g.sb, g.sa] : [g.sa, g.sb]; // the file's score, in the site's order
    const target = T().target || 13;
    if (m.done) { if (m.sa !== fs_[0] || m.sb !== fs_[1]) conflict(what, flip ? sc(m.sb, m.sa) : sc(m.sa, m.sb), sc(g.sa, g.sb)); return; }
    if (!num(g.sa, target) || !num(g.sb, target) || g.sa === g.sb) { bad(what, `${sc(g.sa, g.sb)} isn't a finished score to ${target}`); return; }
    const time = Math.max(g.sa, g.sb) < target; // Winner to 13, or Ended on time
    say(`+ ${what} ${sc(g.sa, g.sb)}${time ? ' (ended on time)' : ''}`);
    const r = await C.recordResult(m.id, fs_[0], fs_[1], true, { time });
    if (r === true) n.results++; else bad(what, r && r.blocked ? 'saving it would change later games' : 'not saved');
  };

  // 2. Swiss rounds in the file but not in the competition, in order
  const rounds = file.rounds || [];
  if (rounds.length && !shoot && T().system !== 'swiss') bad('rounds', 'this competition is not a Swiss');
  else if (rounds.length && shoot) bad('rounds', 'a shooting competition has no rounds');
  else for (let i = 0; i < rounds.length; i++) {
    const R = rounds[i] || {}, rn = i + 1, gid = 'R' + rn, games = (R.games || []).filter(g => g && g.a != null && g.b != null);
    const have = T().draws.filter(d => d.kind === 'round');
    if (have.some(d => d.round === rn)) {
      const site = MS().filter(m => m.stage === 'swiss' && m.group === gid && !m.bye);
      const ids = games.map(g => [find(g.a), find(g.b)]);
      const siteKeys = site.map(m => key(m.a?.[0], m.b?.[0])).sort().join(' ');
      const fileKeys = ids.map(([a, b]) => key(a.id || ('?' + Math.random()), b.id || ('?' + Math.random()))).sort().join(' ');
      if (siteKeys !== fileKeys) conflict(`round ${gid}`, site.map(m => `${short(m.a?.[0])}-${short(m.b?.[0])}`).join(' ') || 'no games', games.map(g => `${g.a}-${g.b}`).join(' ') || 'no games');
      continue;
    }
    if (have.length !== rn - 1) { bad(`round ${gid}`, `round ${have.length + 1} has to be in first`); break; }
    if (!games.length) break; // listed but not drawn yet
    const name = String(R.name || '').trim() || `Round ${rn}`;
    const res = C.ownSwissRound(T(), MS(), games.map(g => `${g.a} v ${g.b}`).join('\n'), name);
    if (res.error) { bad(`round ${gid}`, (res.errs || [res.error]).join(' ')); break; }
    say(`+ round ${gid} "${name}": ${res.matches.length} games`);
    await C.addDraw(res);
    if (!T().draws.some(d => d.kind === 'round' && d.round === rn)) { bad(`round ${gid}`, 'not saved'); break; }
    n.rounds++;
  }
  // shooting: the qualifying scorecards, once there are totals to put on them
  if (shoot && !T().draws.some(d => d.id === 'Q') && (file.shooting?.qualifying || []).length) {
    say('+ round Q "Qualifying round"');
    await C.addDraw(C.drawShootQualifying(T()));
    if (T().draws.some(d => d.id === 'Q')) n.rounds++; else bad('round Q', 'not saved');
  }

  // 3. brackets in the file but not drawn: set them by hand, as "Set the bracket yourself" does
  const plan = () => { const t = T();
    if (shoot) { if (t.shootFormat === 'final') return []; const k = t.shootFormat === 'ko16' ? 16 : 8; return [{ id: 'A', name: `Shooting knockout (top ${k})`, third: !!t.koThird, shoot: true }]; }
    if (t.system === 'knockout') return [{ id: 'A', name: 'Main knockout', third: t.koThird }];
    return C.getPlan(t).brackets.map(b => ({ id: b.id, name: b.name, third: b.third })); };
  const fileBrackets = shoot ? (file.shooting?.knockout ? [{ name: 'Shooting knockout', ...file.shooting.knockout }] : []) : (file.brackets || []);
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const bracketFor = (fb, i) => { const p = plan(); return p.find(b => norm(b.name) === norm(fb.name)) || (T().brackets || []).find(b => norm(b.name) === norm(fb.name)) || p[i] || null; };
  for (let i = 0; i < fileBrackets.length; i++) {
    const fb = fileBrackets[i] || {}, label = fb.name || `bracket ${i + 1}`, lines = (fb.lines || []).map(l => String(l).trim()).filter(Boolean);
    const br = bracketFor(fb, i); fb._bid = br?.id;
    if (!br) { bad(`bracket ${label}`, 'no knockout in this competition to set it in'); continue; }
    if (!lines.length) continue;
    const drawn = (T().brackets || []).find(b => b.id === br.id);
    if (drawn) {
      const site = MS().filter(m => m.bracket === br.id && m.round === 1 && !m.third);
      const r = C.ownLines(T(), lines.join('\n'), entered(), { bye: true });
      const fileKeys = r.errs.length ? '?' : r.games.map(g => key(g.a, g.b)).sort().join(' ');
      const siteKeys = site.map(m => key(m.a?.[0], m.b?.[0])).sort().join(' ');
      if (fileKeys !== siteKeys) conflict(`bracket ${label}`, site.sort((x, y) => x.order - y.order).map(m => `${short(m.a?.[0])} v ${short(m.b?.[0])}`).join(', '), lines.join(', '));
      continue;
    }
    const res = C.ownBracket(T(), br.id, br.name, lines.join('\n'), { third: !!br.third, shoot: !!br.shoot });
    if (res.error) { bad(`bracket ${label}`, (res.errs || [res.error]).join(' ')); continue; }
    say(`+ bracket ${label}${norm(label) !== norm(br.name) ? ` (${br.name})` : ''}: set ${lines.length} lines`);
    await C.addDraw(res);
    if ((T().brackets || []).some(b => b.id === br.id)) n.brackets++; else bad(`bracket ${label}`, 'not saved');
  }

  // 4. finished games whose game on the site has no result
  if (!shoot) for (let i = 0; i < rounds.length; i++) {
    const gid = 'R' + (i + 1); if (!T().draws.some(d => d.kind === 'round' && d.round === i + 1)) continue;
    for (const g of (rounds[i]?.games || [])) {
      if (!g || g.sa == null || g.sb == null) continue;
      const what = `${gid} ${g.a}-${g.b}`; const a = idOf(g.a, `result ${what}`), b = idOf(g.b, `result ${what}`); if (!a || !b) continue;
      const m = MS().find(m => m.group === gid && m.stage === 'swiss' && key(m.a?.[0], m.b?.[0]) === key(a, b));
      if (!m) { conflict(`result ${what}`, 'no such game', sc(g.sa, g.sb)); continue; }
      await recordGame(`result ${what}`, m, a, g);
    }
  }
  // knockout results: winners move on as each is saved, so go round until nothing more can be placed
  const koResult = async (what, m, a, g) => {
    if (!shoot) return recordGame(what, m, a, g);
    const flip = m.a?.[0] !== a; const ta = flip ? g.tb : g.ta, tb = flip ? g.ta : g.tb;
    if (m.done) { if (m.sa !== ta || m.sb !== tb) conflict(what, flip ? sc(m.sb, m.sa) : sc(m.sa, m.sb), sc(g.ta, g.tb)); return; }
    if (!num(g.ta, 100) || !num(g.tb, 100)) { bad(what, `${sc(g.ta, g.tb)}: totals are whole numbers from 0 to 100`); return; }
    if (g.ta === g.tb) { bad(what, `level at ${g.ta}: the shoot-out has to be entered by hand`); return; }
    say(`+ ${what} ${sc(g.ta, g.tb)}`);
    S.modal = { id: m.id, totMode: true, totA: String(ta), totB: String(tb), soVals: { a: [], b: [] }, err: '' };
    await C.saveShootTotal(); const md = S.modal; S.modal = null;
    const after = S.matches[m.id]; if (after?.done && after.sa === ta && after.sb === tb) n.results++; else bad(what, md?.err || 'not saved');
  };
  for (const fb of fileBrackets) {
    if (!fb?._bid || !(T().brackets || []).some(b => b.id === fb._bid)) continue;
    let todo = (fb.results || []).filter(g => g && (shoot ? g.ta != null && g.tb != null : g.sa != null && g.sb != null)), moved = true;
    while (todo.length && moved) {
      moved = false; const later = [];
      for (const g of todo) {
        const what = `${fb.name || 'Shooting knockout'} ${g.a}-${g.b}`; const a = find(g.a).id, b = find(g.b).id;
        if (!a || !b) { idOf(g.a, `result ${what}`) && idOf(g.b, `result ${what}`); continue; }
        const m = MS().find(m => m.bracket === fb._bid && m.a && m.b && key(m.a[0], m.b[0]) === key(a, b));
        if (!m) { later.push(g); continue; }
        moved = true; await koResult(`result ${what}`, m, a, g);
      }
      todo = later;
    }
    for (const g of todo) conflict(`result ${fb.name || 'Shooting knockout'} ${g.a}-${g.b}`, 'no such game', shoot ? sc(g.ta, g.tb) : sc(g.sa, g.sb));
  }

  // 5. shooting: qualifying totals, through the total-only entry
  if (shoot) for (const q of (file.shooting?.qualifying || [])) {
    if (!q || q.total == null) continue;
    const what = `total ${q.name}`; const id = idOf(q.name, what); if (!id) continue;
    const m = MS().find(m => m.stage === 'shoot' && m.phase === 'Q' && m.a?.[0] === id);
    if (!m) { conflict(what, 'no scorecard', q.total); continue; }
    if (m.done) { if (m.sa !== q.total) conflict(what, m.sa, q.total); continue; }
    if (!num(q.total, 100)) { bad(what, `${q.total}: a total is a whole number from 0 to 100`); continue; }
    say(`+ ${what} ${q.total}`);
    S.modal = { id: m.id, totMode: true, totA: String(q.total), soVals: { a: [], b: [] }, err: '' };
    await C.saveShootTotal(); const md = S.modal; S.modal = null;
    const after = S.matches[m.id]; if (after?.done && after.sa === q.total) n.results++; else bad(what, md?.err || 'not saved');
  }
  C.render();
  return { out, n };
}

(async () => {
  const o = args(process.argv.slice(2));
  const file = readFile(o.file);
  let url; try { url = new URL(o.link); } catch { fail('the organiser link is not a web address'); }
  const tid = decodeURIComponent(url.hash.slice(1)).split('.')[0];
  if (!tid) fail('no organiser access', 3);
  const WAIT = +process.env.FEED_WAIT_MS || 45000;
  let chromium; try { ({ chromium } = require('playwright')); } catch { fail('Playwright is not installed (npm install)'); }
  let b;
  try { b = await chromium.launch(); } catch { b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(e => fail('could not start Chromium: ' + e.message)); }
  const done = async code => { await b.close().catch(() => {}); process.exit(code); };
  try {
    const ctx = await b.newContext({ locale: 'en-GB', viewport: { width: 1100, height: 900 }, serviceWorkers: 'block' });
    if (process.env.CARREAU_EMULATOR) await ctx.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(o.link, { timeout: WAIT });
    // the competition, with organiser rights
    const ok = await page.waitForFunction(tid => { const C = window.__carreau; if (!C) return false; const S = C.S, t = C.T();
      return !!(S.loaded && (!S.roleKnown || S.roleKnown()) && t && t.id === tid && S.permFn(t).edit); }, tid, { timeout: WAIT, polling: 250 }).then(() => true, () => false);
    if (!ok) { console.log('feed: no organiser access'); return done(3); }
    // and its games: every draw has its games in
    const loaded = await page.waitForFunction(() => { const C = window.__carreau, t = C.T(), ms = C.MS();
      return (t.draws || []).every(d => ms.some(m => m.group === d.id || m.bracket === d.id)); }, null, { timeout: WAIT, polling: 250 }).then(() => true, () => false);
    if (!loaded) fail("the competition's games didn't load");
    await page.waitForTimeout(1000); // let any snapshot already on its way land first
    const r = await page.evaluate(feedInPage, { file, dry: o.dry }).catch(e => ({ error: e.message }));
    if (r.error) { console.error('feed: stopped: ' + r.error); return done(1); }
    r.out.forEach(l => console.log(l));
    if (errs.length) console.error('feed: page errors: ' + errs.join(' | '));
    const N = r.n;
    console.log(`feed: +${N.teams} teams, +${N.rounds} rounds, +${N.brackets} brackets, +${N.results} results, ${N.conflicts} conflicts${N.bad ? `, ${N.bad} not usable` : ''}${o.dry ? ' (dry run, nothing saved)' : ''}`);
    return done(N.conflicts || N.bad ? 2 : 0);
  } catch (e) { console.error('feed: ' + e.message.split('\n')[0]); return done(1); }
})();
