// Builds the site's example competitions (one per format) and plays them, inside the live app page.
// Run it on snpetanque.com signed in as the admin (#admin → Google), from the browser console or an automation tool.
// Progress and results are in window.__seed (log, links, done). Set window.__seedOnly = ["swiss", …] to build only some.
// Every competition is created as the admin, marked as an example (listed: true) and ordered for the picker.
window.__seed = { log: [], done: false, links: {} };
(async () => {
  const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms));
  const L = m => { window.__seed.log.push(new Date().toISOString().slice(11, 19) + " " + m); };
  const today = new Date().toISOString().slice(0, 10);

  // invented names: places + nicknames for teams, common first and last names for players
  const PLACES = ["Oakfield", "Millbrook", "Ashcombe", "Riverside", "Kingsmead", "Hollybank", "Larkhill", "Westbury", "Elmstead", "Fernhill", "Brookside", "Thornbury",
    "Hawthorn", "Stonebridge", "Willowdale", "Marston", "Redhill", "Greenway", "Bramley", "Castleton", "Foxley", "Hilltop", "Lyndale", "Northgate", "Parkside",
    "Southmere", "Ambleside", "Beckford", "Cranfield", "Dunmore", "Eastwood", "Fairhaven"];
  const NICKS = ["Boules", "Pointers", "Shooters", "Jacks", "Carreaux", "Rollers", "Cochonnets", "Petanque", "Bouleurs", "Tireurs"];
  const FIRST = ["Alice", "Ben", "Chloe", "Dan", "Emma", "Frank", "Grace", "Harry", "Isla", "Jack", "Kate", "Liam", "Maya", "Noah", "Olivia", "Paul", "Ruby", "Sam",
    "Tara", "Tom", "Uma", "Vic", "Will", "Zoe", "Amir", "Bea", "Carl", "Dina", "Eric", "Faye", "Gus", "Hana", "Ivan", "Jade", "Ken", "Lena", "Marc", "Nina", "Owen", "Pia"];
  const LAST = ["Adams", "Baker", "Clarke", "Davies", "Evans", "Fisher", "Green", "Hughes", "Irving", "Jones", "King", "Lewis", "Morgan", "Norris", "Owens", "Patel",
    "Quinn", "Reid", "Shaw", "Turner", "Usher", "Vaughan", "Walker", "Young", "Barnes", "Cole", "Dixon", "Ellis", "Foster", "Grant", "Hall", "Lloyd", "Marsh", "Price"];
  let pk = 0; const player = () => { const k = pk++; return `${FIRST[k % FIRST.length]} ${LAST[(k * 7 + Math.floor(k / FIRST.length)) % LAST.length]}`; };
  const teamName = i => `${PLACES[i % PLACES.length]} ${NICKS[(i * 3 + Math.floor(i / PLACES.length)) % NICKS.length]}`;

  // results: stronger teams win more often; losers score 0–12
  const strength = {};
  const result = m => {
    const sa = (m.a || []).reduce((x, id) => x + (strength[id] ?? 0.5), 0) / m.a.length;
    const sb = (m.b || []).reduce((x, id) => x + (strength[id] ?? 0.5), 0) / m.b.length;
    const aWins = Math.random() < 0.5 + (sa - sb) * 0.8; const lose = Math.floor(Math.random() * 13);
    return aWins ? [13, lose] : [lose, 13];
  };
  // play every game that is ready, except those `stop` holds back (left on their pistes to show games in play)
  const play = async (stop) => {
    for (let g = 0; g < 5000; g++) {
      const live = C.MS().filter(m => !m.done && m.a && m.b && !m.shoot && !(stop && stop(m)));
      if (!live.length) return;
      const m = live.find(x => x.court) || live[0]; const [a, b] = result(m);
      await C.recordResult(m.id, a, b, true);
    }
  };

  let order = 0; const base = Date.now();
  const newComp = async (cfg, entries) => {
    for (let i = 0; i < 100 && !document.querySelector('[data-act="new-t"]'); i++) await w(200);
    const prev = C.T()?.id; document.querySelector('[data-act="new-t"]').click();
    for (let i = 0; i < 50 && !(C.T() && C.T().id !== prev && C.T().ownerUid); i++) await w(100);
    await w(800);
    const t = C.clone(C.T());
    Object.assign(t, { venue: "SN Pétanque example", date: today, listed: true, checkin: true, seeding: "seeded", wizard: false, target: 13,
      created: base - (order++) * 60000 }, cfg);
    t.courts = Array.from({ length: cfg.pistes || 16 }, (_, i) => ({ id: "c" + (i + 1), name: String(i + 1), active: true }));
    delete t.pistes; t.teams = []; t.players = [];
    entries(t);
    delete t._new;
    S.tournaments[t.id] = t; await S.store.setTournament(t); await w(1500);
    document.querySelector('[data-tab="draw"]')?.click(); await w(300);
    return t.id;
  };
  const teams = (n, size, club) => t => { for (let i = 0; i < n; i++) { const id = "e" + (i + 1); t.teams.push({ id, name: club ? `${club(i).name}` : teamName(i), players: Array.from({ length: size }, player), club: club ? club(i).club : "", active: true, checkedIn: true }); strength[id] = Math.random(); } };
  const players = n => t => { for (let i = 0; i < n; i++) { const id = "p" + (i + 1); t.players.push({ id, name: player(), active: true, checkedIn: true }); strength[id] = Math.random(); } };
  const click = async (sel) => { for (let i = 0; i < 30 && !document.querySelector(sel); i++) { C.render(); await w(200); } const el = document.querySelector(sel); if (!el) throw new Error("no button " + sel); el.click(); await w(1500); };

  const nameOf = id => { const t = C.T(); return (t.teams.find(x => x.id === id) || t.players.find(x => x.id === id) || {}).name || id; };
  const winnerOf = b => { const f = C.MS().find(m => m.bracket === b.id && m.round === b.rounds && !m.third); if (!f || !f.done) return "in play"; const ids = f.win ? f[f.win] : f.sa > f.sb ? f.a : f.b; return ids.map(nameOf).join(" + "); };
  const finish = async (key) => {
    await w(1500); const t = C.T(); const ms = C.MS();
    const winners = (t.brackets || []).map(b => `${b.name}: ${winnerOf(b)}`);
    window.__seed.links[key] = { id: t.id, name: t.name, games: ms.length, done: ms.filter(m => m.done).length, playing: ms.filter(m => !m.done && m.court && m.a && m.b).length, winners };
    L(`${key} done: ${t.name} · ${ms.filter(m => m.done).length}/${ms.length} games · ${winners.join(" | ")}`);
  };
  const KO = (...b) => ({ seeding: "seeded", brackets: b });

  // precision shooting: 20 shots each (5 ateliers × 4 distances), values 0/1/3/5; totals kept distinct so nobody ties at the cut
  const ATS = ["A1", "A2", "A3", "A4", "A5"];
  const card = skill => { const sh = {}; ATS.forEach(k => { sh[k] = [0, 1, 2, 3].map(() => { const r = Math.random(); return r < skill * 0.55 ? 5 : r < skill * 0.75 ? 3 : r < 0.85 ? 1 : 0; }); }); return sh; };
  const total = sh => ATS.reduce((s, k) => s + sh[k].reduce((a, v) => a + v, 0), 0);
  const bump = sh => { for (const k of ATS) for (let i = 0; i < 4; i++) if (sh[k][i] === 0) { sh[k][i] = 1; return true; } for (const k of ATS) for (let i = 0; i < 4; i++) if (sh[k][i] === 1) { sh[k][i] = 3; return true; } return false; };

  const runs = {
    swiss: { name: "Swiss · 5 rounds → afternoon knockouts", cfg: { entry: "teams", system: "swiss", format: "triples", swissRounds: 5, koPlan: KO({ id: "A", name: "Main knockout", from: 1, to: 16, third: false }, { id: "B", name: "Plate", from: 17, to: 32, third: false }) },
      entries: teams(32, 3),
      go: async () => { for (let r = 0; r < 5; r++) { await C.addDraw(C.drawSwissRound(C.T(), C.MS())); await w(500); await play(); }
        await C.startKnockouts(); await w(1000); const R = C.T().brackets.find(b => b.id === "A").rounds;
        await play(m => m.bracket === "A" && m.round >= R - 1); } }, // main knockout semi-finals left on their pistes
    snake: { name: "Snake · 5 rounds → afternoon knockouts", cfg: { entry: "teams", system: "snake", format: "doubles", snakeRounds: 5, koPlan: KO({ id: "A", name: "Main knockout", from: 1, to: 8, third: true }, { id: "B", name: "Plate", from: 9, to: 16, third: false }) },
      entries: teams(24, 2),
      go: async () => { await C.addDraw(C.genSnake(C.T())); await w(800); await play(); await C.startKnockouts(); await w(1000); await play(); } },
    poules: { name: "Barrage · French poules → Championnat & Consolante", cfg: { entry: "teams", system: "pools", format: "triples", poolSize: 4, poolStyle: "french", koPlan: KO({ id: "A", name: "Championnat", from: 1, to: 2, third: false }, { id: "B", name: "Consolante", from: 3, to: 4, third: false }) },
      entries: teams(32, 3),
      go: async () => { await C.addDraw(C.drawPools(C.T())); await w(800); await play(); await w(800); await play(); await C.startKnockouts(); await w(1000); await play(); } },
    rrpools: { name: "Barrage · round robin → A & B knockouts", cfg: { entry: "teams", system: "pools", format: "doubles", poolSize: 6, poolStyle: "rr", koPlan: KO({ id: "A", name: "A knockout", from: 1, to: 2, third: true }, { id: "B", name: "B knockout", from: 3, to: 4, third: false }) },
      entries: teams(24, 2),
      go: async () => { await C.addDraw(C.drawPools(C.T())); await w(800); await play(); await C.startKnockouts(); await w(1000); await play(); } },
    leagues: { name: "Leagues · 4 leagues → afternoon knockouts", cfg: { entry: "teams", system: "leagues", format: "triples", leagueCount: 4, koPlan: KO({ id: "A", name: "Main knockout", from: 1, to: 2, third: false }, { id: "B", name: "Plate", from: 3, to: 4, third: false }) },
      entries: teams(24, 3),
      go: async () => { await C.addDraw(C.drawPools(C.T())); await w(800); await play(); await C.startKnockouts(); await w(1000);
        await play(m => m.bracket === "A"); } }, // main knockout quarter-finals left on their pistes
    roundrobin: { name: "Round robin · everyone plays everyone → semi-finals", cfg: { entry: "teams", system: "roundrobin", format: "triples", pistes: 6, koPlan: KO({ id: "A", name: "Semi-finals & final", from: 1, to: 4, third: true }) },
      entries: teams(8, 3),
      go: async () => { await C.addDraw(C.genRoundRobin(C.T())); await w(1500); await play(); await C.startKnockouts(); await w(1000); await play(); } },
    knockout: { name: "Knockout · with consolante", cfg: { entry: "teams", system: "knockout", format: "doubles", consolante: true, koThird: true, seeding: "random" },
      entries: teams(32, 2),
      go: async () => {
        const ids = C.T().teams.map(x => x.id).sort(() => Math.random() - 0.5);
        await C.addDraw(C.createBracket(C.T(), "A", "Main knockout", ids, { third: true })); await w(800);
        await play(m => m.bracket === "A" && m.round > 1);
        const losers = C.MS().filter(m => m.bracket === "A" && m.round === 1 && !m.bye && m.done).sort((x, y) => x.order - y.order).map(m => (m.sa > m.sb ? m.b : m.a)[0]);
        await C.addDraw(C.createBracket(C.T(), "B", "Consolante", losers, { third: true })); await w(800); await play(); } },
    melee: { name: "Mêlée · new teams every round", cfg: { entry: "melee", meleeMode: "rounds", system: "swiss", format: "triples", swissRounds: 5 },
      entries: players(36),
      go: async () => { for (let r = 0; r < 5; r++) { await C.addDraw(C.drawMeleeRound(C.T(), C.MS())); await w(500); await play(); } } },
    meleeonce: { name: "Mêlée · teams drawn once → Swiss → knockouts", cfg: { entry: "melee", meleeMode: "once", system: "swiss", format: "triples", swissRounds: 4, koPlan: KO({ id: "A", name: "Main knockout", from: 1, to: 8, third: false }, { id: "B", name: "Plate", from: 9, to: 16, third: false }) },
      entries: players(48),
      go: async () => {
        // the "Draw the teams" step: random teams of three from the players, as the app does
        const t = C.clone(C.T()); const ids = t.players.map(p => p.id).sort(() => Math.random() - 0.5);
        t.teams = []; for (let i = 0; i < ids.length / 3; i++) { const ps = ids.slice(i * 3, i * 3 + 3); const id = "e" + (i + 1); t.teams.push({ id, name: `Team ${i + 1}`, players: ps.map(p => t.players.find(x => x.id === p).name), club: "", active: true, checkedIn: true }); strength[id] = ps.reduce((s, p) => s + strength[p], 0) / 3; }
        t.entry = "teams"; t.meleeDrawn = true; S.tournaments[t.id] = t; await S.store.setTournament(t); await w(1500);
        for (let r = 0; r < 4; r++) { await C.addDraw(C.drawSwissRound(C.T(), C.MS())); await w(500); await play(); }
        await C.startKnockouts(); await w(1000); await play(); } },
    clubs: { name: "Inter-club · Chiltern, East Midlands, Anglia", cfg: { entry: "teams", system: "clubs", format: "triples", clubTeams: 6, clubPairing: "rotation", clubDays: 3, seeding: "entry" },
      entries: teams(18, 3, i => { const club = ["Chiltern", "East Midlands", "Anglia"][Math.floor(i / 6)]; return { club, name: `${club} ${(i % 6) + 1}` }; }),
      go: async () => { await click('[data-act="first-draw"]'); await w(1500); if (!C.MS().length) throw new Error("inter-club draw failed"); await play(); } },
    shooting: { name: "Precision shooting · qualifying → top 8 knockout", cfg: { entry: "shooting", system: "knockout", format: "singles", shootFormat: "ko8", koThird: true, seeding: "random", pistes: 8 },
      entries: players(16),
      go: async () => {
        await click('[data-act="first-draw"]'); await w(1000);
        const used = new Set();
        for (const m of C.MS().filter(m => m.phase === "Q")) {
          const sh = card(strength[m.a[0]]); while (used.has(total(sh)) && bump(sh)); used.add(total(sh));
          const patch = { shots: sh, sa: total(sh), sb: 0, done: true, finishedAt: Date.now() }; Object.assign(S.matches[m.id], patch); await S.store.updateMatch(S.tid, m.id, patch);
        }
        await w(1500); C.render(); await click('[data-act="shoot-next"]'); await w(1000);
        for (let g = 0; g < 50; g++) {
          const m = C.MS().find(x => x.shoot && !x.done && x.a && x.b); if (!m) break;
          let shA = card(strength[m.a[0]]), shB = card(strength[m.b[0]]); while (total(shA) === total(shB) && bump(shA));
          const tA = total(shA), tB = total(shB);
          await C.recordResult(m.id, tA, tB, true, { win: tA > tB ? "a" : "b", shots: { shotsA: shA, shotsB: shB, soA: null, soB: null } }); await w(300);
        } } },
    tryit: { name: "Try it yourself · Precision shooting", cfg: { entry: "shooting", system: "knockout", format: "singles", shootFormat: "final", shootFinal: 2, template: true, seeding: "random", pistes: 4 },
      entries: players(4), go: async () => {} },
  };
  const only = window.__seedOnly;
  for (const [key, r] of Object.entries(runs)) {
    if (only && !only.includes(key)) continue;
    try { L("start " + key); await newComp(Object.assign({ name: r.name }, r.cfg), r.entries); await r.go(); await finish(key); }
    catch (e) { L("ERROR " + key + ": " + (e && (e.message || e.code) || e)); }
  }
  window.__seed.done = true; L("all done");
})();
