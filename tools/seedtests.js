// Builds 48-entry test competitions for every format and plays each one to a winner.
// Runs inside the live app page; progress in window.__seed.
window.__seed = { log: [], done: false, links: {} };
(async () => {
  const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms));
  const L = m => { window.__seed.log.push(new Date().toISOString().slice(11, 19) + " " + m); };
  const A = ["Les", "Club", "Boule", "Carreau", "Tir", "Point", "Cochonnet", "Mistral", "Soleil", "Platane", "Gravier", "Fanny"];
  const B = ["Pointeurs", "Tireurs", "Amis", "Lions", "Rapides", "Étoiles", "Copains", "Moulins", "Rivières", "Pins", "Collines", "Vents", "Jacks", "Riverside", "Oaks", "Kings"];
  const first = ["Marie", "Tom", "Ana", "Jo", "Raj", "Lee", "Sam", "Kim", "Luc", "Eva", "Ben", "Noor", "Ines", "Paul", "Hana", "Dev", "Ola", "Max", "Zoe", "Ivo", "Rui", "Mia", "Ted", "Lou"];
  const last = ["Dubois", "Hart", "Silva", "Bell", "Patel", "Chen", "Moreau", "Okafor", "Novak", "Reid", "Costa", "Ahmed", "Martin", "Leroy", "Faure", "Blanc"];
  const teamName = i => `${A[i % 12]} ${B[Math.floor(i / 12) * 4 + (i % 4)]}`;
  const player = k => `${first[k % first.length]} ${last[(k * 7 + Math.floor(k / first.length)) % last.length]}`;
  const strength = {};
  const result = (m) => {
    const sa = (m.a || []).reduce((x, id) => x + (strength[id] ?? 0.5), 0) / m.a.length;
    const sb = (m.b || []).reduce((x, id) => x + (strength[id] ?? 0.5), 0) / m.b.length;
    const aWins = Math.random() < 0.5 + (sa - sb) * 0.8;
    const lose = Math.floor(Math.random() * 13);
    return aWins ? [13, lose] : [lose, 13];
  };
  const play = async (stop) => {
    for (let g = 0; g < 5000; g++) {
      const live = C.MS().filter(m => !m.done && m.a && m.b && !(stop && stop(m)));
      if (!live.length) return;
      const m = live.find(x => x.court) || live[0];
      const [a, b] = result(m);
      await C.recordResult(m.id, a, b, true);
    }
  };
  const newComp = async (cfg) => {
    for (let i = 0; i < 100 && !document.querySelector('[data-act="new-t"]'); i++) await w(200);
    document.querySelector('[data-act="new-t"]').click();
    for (let i = 0; i < 50 && !(C.T() && C.T().ownerUid); i++) await w(100);
    await w(800);
    const t = C.clone(C.T());
    Object.assign(t, { venue: "Test data", date: "2026-10-21", listed: true, checkin: true, seeding: "random" }, cfg.t);
    t.courts = Array.from({ length: 24 }, (_, i) => ({ id: "c" + (i + 1), name: String(i + 1), active: true }));
    t.teams = []; t.players = [];
    let k = 0;
    for (let i = 0; i < 48; i++) {
      if (t.entry === "melee") { const id = "p" + i; t.players.push({ id, name: player(i), active: true, checkedIn: true }); strength[id] = Math.random(); }
      else { const id = "e" + i; const size = { singles: 1, doubles: 2, triples: 3 }[t.format]; t.teams.push({ id, name: teamName(i), players: Array.from({ length: size }, () => player(k++)), club: "", active: true, checkedIn: true }); strength[id] = Math.random(); }
    }
    delete t._new;
    S.tournaments[t.id] = t; await S.store.setTournament(t);
    await w(1500);
    return t.id;
  };
  const winnerOf = (b) => { const f = C.MS().find(m => m.bracket === b.id && m.round === b.rounds && !m.third); if (!f || !f.done) return "?"; const ids = f.sa > f.sb ? f.a : f.b; const t = C.T(); return ids.map(id => (t.teams.find(x => x.id === id) || t.players.find(x => x.id === id) || {}).name).join(" · "); };
  const finish = async (label) => {
    await w(1500);
    const t = C.T();
    const winners = (t.brackets || []).map(b => `${b.name}: ${winnerOf(b)}`);
    if (!winners.length) {
      const wins = {}; C.MS().forEach(m => { if (!m.done) return; const W = !m.b || m.sa > m.sb ? m.a : m.b; W.forEach(id => wins[id] = (wins[id] || 0) + 1); });
      const top = Object.entries(wins).sort((x, y) => y[1] - x[1])[0];
      winners.push(`Top of the table: ${(t.players.find(x => x.id === top[0]) || t.teams.find(x => x.id === top[0]) || {}).name} (${top[1]} wins)`);
    }
    document.querySelector('[data-tab="setup"]')?.click(); await w(2500);
    window.__seed.links[label] = { id: t.id, organiser: document.querySelector("#share-edit")?.value || "", watch: document.querySelector("#share-watch")?.value || "", games: C.MS().length, winners };
    L(`${label} done: ${C.MS().length} games; ${winners.join(" | ")}`);
  };

  const runs = [
    { label: "TEST 1 · Swiss → Top 16 + Silver (triples)", t: { system: "swiss", format: "triples", swissRounds: 5,
      koPlan: { seeding: "seeded", brackets: [{ id: "A", name: "Main knockout", from: 1, to: 16, third: true }, { id: "S", name: "Silver", silver: true, from: 17, to: 9999, third: false }] } },
      go: async () => { for (let r = 0; r < 5; r++) { await C.addDraw(C.drawSwissRound(C.T(), C.MS())); await w(500); await play(); } await C.startKnockouts(); await w(800); await play(); } },
    { label: "TEST 2 · Snake → Top 8 + Plate + Silver (doubles)", t: { system: "snake", format: "doubles", snakeRounds: 5,
      koPlan: { seeding: "seeded", brackets: [{ id: "A", name: "Main knockout", from: 1, to: 8, third: true }, { id: "B", name: "Plate", from: 9, to: 16, third: false }, { id: "S", name: "Silver", silver: true, from: 17, to: 9999, third: false }] } },
      go: async () => { await C.addDraw(C.genSnake(C.T())); await w(800); await play(); await C.startKnockouts(); await w(800); await play(); } },
    { label: "TEST 3 · French poules → A and B (triples)", t: { system: "pools", format: "triples", poolSize: 4, poolStyle: "french",
      koPlan: { seeding: "seeded", brackets: [{ id: "A", name: "A knockout (Championnat)", from: 1, to: 2, third: false }, { id: "B", name: "B knockout (Consolante)", from: 3, to: 4, third: false }] } },
      go: async () => { await C.addDraw(C.drawPools(C.T())); await w(800); await play(); await w(500); await play(); await C.startKnockouts(); await w(800); await play(); } },
    { label: "TEST 4 · Round-robin pools of 6 → A, B, C (doubles)", t: { system: "pools", format: "doubles", poolSize: 6, poolStyle: "rr",
      koPlan: { seeding: "seeded", brackets: [{ id: "A", name: "A knockout", from: 1, to: 2, third: true }, { id: "B", name: "B knockout", from: 3, to: 4, third: false }, { id: "C", name: "C knockout", from: 5, to: 6, third: false }] } },
      go: async () => { await C.addDraw(C.drawPools(C.T())); await w(800); await play(); await C.startKnockouts(); await w(800); await play(); } },
    { label: "TEST 5 · Straight knockout + consolante (singles)", t: { system: "knockout", format: "singles", consolante: true, koThird: true },
      go: async () => {
        const ids = C.T().teams.map(x => x.id).sort(() => Math.random() - 0.5);
        await C.addDraw(C.createBracket(C.T(), "A", "Main knockout", ids, { third: true })); await w(800);
        await play(m => m.bracket === "A" && m.round > 1);
        const losers = C.MS().filter(m => m.bracket === "A" && m.round === 1 && !m.bye && m.done).sort((x, y) => x.order - y.order).map(m => (m.sa > m.sb ? m.b : m.a)[0]);
        await C.addDraw(C.createBracket(C.T(), "B", "Consolante", losers, { third: true })); await w(800);
        await play();
      } },
    { label: "TEST 6 · Round robin (everyone plays everyone) → Final (triples)", t: { system: "roundrobin", format: "triples",
      koPlan: { seeding: "seeded", brackets: [{ id: "A", name: "Final", from: 1, to: 2, third: false }] } },
      go: async () => { await C.addDraw(C.genRoundRobin(C.T())); await w(1500); await play(); await C.startKnockouts(); await w(800); await play(); } },
    { label: "TEST 7 · Mêlée, 48 players, 5 rounds (triples)", t: { entry: "melee", system: "swiss", format: "triples", swissRounds: 5 },
      go: async () => { for (let r = 0; r < 5; r++) { await C.addDraw(C.drawMeleeRound(C.T(), C.MS())); await w(500); await play(); } } },
  ];
  const only = window.__seedOnly;
  for (const r of runs) {
    if (only && !only.includes(r.label.slice(0, 6))) continue;
    try {
      L("start " + r.label);
      await newComp({ t: Object.assign({ name: r.label }, r.t) });
      document.querySelector('[data-tab="draw"]')?.click();
      await r.go();
      await finish(r.label);
    } catch (e) { L("ERROR " + r.label + ": " + (e && (e.message || e.code) || e)); }
  }
  window.__seed.done = true; L("all done");
})();
