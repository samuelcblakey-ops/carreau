// The results feed (tools/feed.js) against the emulators: a Swiss competition brought up to date from a results file
// through its organiser link, run again (nothing to do), a conflicting result (left alone), a dry run, a bracket,
// and a shooting competition's totals.
const { chromium } = require('playwright');
const { execFile } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'feed-'));
const feed = (link, fixture, extra = []) => new Promise(res => {
  const f = path.join(dir, 'f' + Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(f, JSON.stringify(fixture));
  execFile('node', [path.join(__dirname, '..', 'tools', 'feed.js'), '--link', link, '--file', f, ...extra],
    { env: { ...process.env, CARREAU_EMULATOR: '1', FEED_WAIT_MS: '20000' }, timeout: 120000 },
    (err, stdout, stderr) => res({ code: err ? err.code : 0, out: stdout.trim(), err: stderr.trim(), last: stdout.trim().split('\n').pop().replace(/^feed: /, '') }));
});
const TEAMS = ['🇮🇹 Italy (ITA)', '🇨🇦 Canada (CAN)', '🇫🇷 France (FRA)', '🇨🇳 China (CHN)', '🇪🇸 Spain (ESP)', '🇯🇵 Japan (JPN)', '🇲🇱 Mali (MLI)', '🇧🇯 Benin (BEN)'];
const R1 = { name: 'Round 1', games: [{ a: 'ITA', b: 'CAN', sa: 13, sb: 7 }, { a: 'FRA', b: 'CHN', sa: 13, sb: 10 }, { a: 'ESP', b: 'JPN', sa: 8, sb: 13 }, { a: 'MLI', b: 'BEN', sa: 11, sb: 9, timed: true }] };
const R2 = { name: 'Round 2', games: [{ a: 'ITA', b: 'FRA', sa: 13, sb: 5 }, { a: 'JPN', b: 'MLI', sa: 13, sb: 6 }, { a: 'CAN', b: 'CHN', sa: 12, sb: 13 }, { a: 'ESP', b: 'BEN', sa: 13, sb: 3 }] };
const R3 = { name: 'Round 3', games: [{ a: 'ITA', b: 'JPN', sa: 13, sb: 1 }, { a: 'FRA', b: 'MLI', sa: 13, sb: 2 }, { a: 'CHN', b: 'ESP', sa: 13, sb: 3 }, { a: 'CAN', b: 'BEN', sa: 13, sb: 4 }] };
const SWISS = { kind: 'swiss', teams: TEAMS.map(n => n.replace(/^\S+ /, '')), rounds: [R1, R2] };
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const mk = async n => { const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  // the admin: open testing off, so only an organiser link gives organiser rights
  const ADMIN = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8').match(/token\.email in \['([^']+)'/)[1];
  const AD = await mk('admin'); await AD.goto(base + '#admin'); await AD.waitForFunction(() => !!window.__testGoogle, null, { timeout: 30000 }); await w(1500);
  await AD.evaluate(e => window.__testGoogle(e), ADMIN); await w(3500);
  await AD.evaluate(() => window.__testSetSite({ openTesting: false })); await w(500); await AD.close();
  const A = await mk('organiser');
  await A.goto(base); await w(3500);
  const make = async (extra, entries) => {
    await A.evaluate(() => document.querySelector('[data-act="new-t"]').click()); await w(2500);
    await A.evaluate(async ([extra, entries]) => { const C = window.__carreau; const t = JSON.parse(JSON.stringify(C.T()));
      Object.assign(t, extra, { checkin: false }); t[extra.entry === 'shooting' ? 'players' : 'teams'] = entries.map((name, i) => ({ id: 'e' + i, name, players: [], active: true }));
      await C.S.store.setTournament(t); }, [extra, entries]); await w(2000);
    if (await A.$('[data-act="wiz-skip"]')) { await A.click('[data-act="wiz-skip"]'); await w(800); }
    await A.click('[data-tab="setup"]'); await w(1200);
    return { tid: await A.evaluate(() => window.__carreau.T().id), link: await A.inputValue('#share-edit') };
  };
  const site = () => A.evaluate(() => { const C = window.__carreau, t = C.T(), nm = id => (C.entName(t, id).match(/\((\w+)\)/) || [])[1];
    return { rounds: t.draws.filter(d => d.kind === 'round').length, brackets: (t.brackets || []).length, updated: t.updated, games: C.MS().length,
      res: Object.fromEntries(C.MS().filter(m => m.a && m.b).map(m => [`${m.group}:${nm(m.a[0])}-${nm(m.b[0])}`, m.done ? `${m.sa}-${m.sb}${m.time ? 't' : ''}` : '']))
    }; });

  const sw = await make({ name: 'Feed Swiss', system: 'swiss', format: 'triples' }, TEAMS);
  let r = await feed(sw.link, SWISS); await w(2500);
  log('feed first run:', r.last, '| exit', r.code);
  let s = await site();
  log('saved on the server:', s.rounds, 'rounds |', Object.entries(s.res).filter(([k, v]) => v).map(([k, v]) => `${k} ${v}`).join(', '));
  log('round name and own:', await A.evaluate(() => window.__carreau.T().draws.filter(d => d.kind === 'round').map(d => `${d.label} ${!!d.own}`).join(', ')));
  log('plan lines:', r.out.split('\n').filter(l => l.startsWith('+')).length, '| first', r.out.split('\n')[0]);
  if (r.err) log('stderr:', r.err);
  r = await feed(sw.link, SWISS);
  log('feed second run:', r.last, '| exit', r.code, '| lines', r.out.split('\n').length);

  const wrong = JSON.parse(JSON.stringify(SWISS)); wrong.rounds[0].games[0].sb = 9;
  r = await feed(sw.link, wrong); await w(1500);
  log('feed conflict:', r.out.split('\n').find(l => l.startsWith('CONFLICT')), '| exit', r.code, '| site', (await site()).res['R1:ITA-CAN']);

  const before = await site();
  r = await feed(sw.link, { ...SWISS, rounds: [R1, R2, R3] }, ['--dry-run']); await w(2500);
  const after = await site();
  log('feed dry run:', JSON.stringify(before) === JSON.stringify(after) ? 'no writes' : 'WROTE', '|', r.last, '| exit', r.code);
  log('dry run plan:', r.out.split('\n').filter(l => l.startsWith('+')).join(' / '));

  const BR = { name: 'World Championship', lines: ['ITA v CAN', 'FRA v CHN', 'ESP v JPN', 'MLI v BEN'], results: [{ a: 'ITA', b: 'CAN', sa: 13, sb: 2 }, { a: 'CHN', b: 'FRA', sa: 4, sb: 13 }] };
  r = await feed(sw.link, { ...SWISS, brackets: [BR] }); await w(2500);
  const set = (r.out.match(/^\+ bracket .*: (set \d+ lines)$/m) || [])[1];
  log('feed bracket:', `${set}, +${(r.last.match(/\+(\d+) results/) || [])[1]} results`, '|', r.last, '| exit', r.code);
  s = await site();
  log('bracket on the server:', await A.evaluate(() => { const C = window.__carreau, t = C.T(); const b = t.brackets[0]; const nm = id => (C.entName(t, id).match(/\((\w+)\)/) || [])[1];
    return `${b.name} own ${!!b.own} | ` + C.MS().filter(m => m.bracket === b.id && m.a && m.b).sort((x, y) => x.round - y.round || x.order - y.order).map(m => `r${m.round} ${nm(m.a[0])}-${nm(m.b[0])} ${m.done ? m.sa + '-' + m.sb : ''}`.trim()).join(', '); }));
  r = await feed(sw.link, { ...SWISS, brackets: [{ ...BR, lines: ['ITA v FRA', 'CAN v CHN', 'ESP v JPN', 'MLI v BEN'] }] });
  log('bracket conflict:', r.out.split('\n').find(l => l.startsWith('CONFLICT')), '| exit', r.code);
  await A.click('[data-tab="draw"]'); await w(800); await A.screenshot({ path: path.join(process.env.OUT || 'test-results', 'feed-draw.png'), fullPage: true });

  r = await feed(base + '#' + sw.tid, SWISS);
  log('feed no access:', r.out, '| exit', r.code);

  const SH = ['🇸🇳 Senegal (SEN)', '🇫🇷 France (FRA)', '🇹🇭 Thailand (THA)', '🇧🇪 Belgium (BEL)'];
  const sh = await make({ name: 'Feed Shooting', entry: 'shooting', system: 'knockout', shootFormat: 'ko8', koThird: false }, SH.slice(0, 3)); // Belgium isn't registered yet
  const SHOOT = { kind: 'shooting', teams: SH, shooting: { qualifying: [{ name: 'SEN', total: 64 }, { name: 'FRA', total: 71 }, { name: 'THA', total: 55 }, { name: 'Belgium', total: 60 }] } };
  r = await feed(sh.link, SHOOT); await w(2500);
  log('feed shooting totals:', `+${(r.last.match(/\+(\d+) results/) || [])[1]} results`, '|', r.last, '| exit', r.code);
  log('shooting plan:', r.out.split('\n').filter(l => l.startsWith('+')).join(' / '));
  log('totals on the server:', await A.evaluate(() => { const C = window.__carreau, t = C.T(); return C.MS().filter(m => m.phase === 'Q').map(m => `${(C.entName(t, m.a[0]).match(/\((\w+)\)/) || [])[1]} ${m.shotTotal} ${m.done}`).sort().join(', '); }));
  r = await feed(sh.link, { ...SHOOT, shooting: { ...SHOOT.shooting, knockout: { lines: ['FRA v THA', 'SEN v BEL'], results: [{ a: 'THA', b: 'FRA', ta: 58, tb: 70 }, { a: 'SEN', b: 'BEL', ta: 66, tb: 61 }] } } }); await w(2500);
  log('feed shooting knockout:', r.last, '| exit', r.code);
  log('final on the server:', await A.evaluate(() => { const C = window.__carreau, t = C.T(); const nm = id => (C.entName(t, id).match(/\((\w+)\)/) || [])[1]; const f = C.MS().find(m => m.shoot && m.round === t.brackets[0].rounds && !m.third); return f && f.a && f.b ? `${nm(f.a[0])} v ${nm(f.b[0])}` : 'not set'; }));
  console.log('errs', errs); await b.close(); fs.rmSync(dir, { recursive: true, force: true });
})();
