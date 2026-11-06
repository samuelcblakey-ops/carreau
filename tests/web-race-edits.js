// Two organisers changing different things at the same moment both keep their change (race-comp-fields):
// a Setup choice and a check-in together, a check-in during the draw, and an offline Setup change.
const { open, together, w } = require('./two-organisers');
(async () => {
  const log = (...a) => console.log(...a);
  const o = await open({ teams: 12, checkin: true }); const { A, B, tid, errs } = o;
  const comp = p => p.evaluate(id => JSON.parse(JSON.stringify(window.__carreau.S.tournaments[id])), tid);
  const teamIds = (await comp(A)).teams.map(x => x.id);
  const setTarget = (p, v) => p.evaluate(v => { const el = document.querySelector('#f-target'); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  const checkIn = (p, id) => p.evaluate(id => document.querySelector(`[data-act="checkin"][data-id="${id}"]`).click(), id);
  const kept = async (v, id) => { let ok = true; for (const p of [A, B]) { const t = await comp(p); ok = ok && t.target === v && !!t.teams.find(x => x.id === id).checkedIn; } return ok; };
  await A.click('[data-tab="setup"]'); await w(600);
  // 1. a Setup choice on A and a check-in on B, at the same moment
  let both = 0;
  for (let i = 0; i < 5; i++) {
    const v = 14 + i, id = teamIds[i];
    await together(() => setTarget(A, v), () => checkIn(B, id));
    await w(2500);
    if (await kept(v, id)) both++;
  }
  log(`setup and check-in together, 5 tries: both kept ${both} of 5`);
  await A.screenshot({ path: process.env.OUT + '/race-edits-a-setup.png' });
  // 2. A draws round 1 while B checks in the last team (11 checked in, so round 1 has 6 games either way)
  for (const id of teamIds.slice(5, 11)) { await checkIn(B, id); await w(700); }
  await w(1500);
  await A.click('[data-tab="draw"]'); await w(800);
  const late = teamIds[11];
  await together(() => A.evaluate(() => document.querySelector('[data-act="first-draw"]').click()), () => checkIn(B, late));
  await w(4000);
  const t2 = await comp(A), t2b = await comp(B);
  const r1 = await A.evaluate(() => window.__carreau.MS().filter(m => m.group === 'R1').length);
  log(`late check-in during the draw: kept ${!!t2.teams.find(x => x.id === late).checkedIn && !!t2b.teams.find(x => x.id === late).checkedIn && t2.draws.length === 1 && t2b.draws.length === 1} | round 1 games ${r1}`);
  // 3. A changes Setup offline, B checks a team in meanwhile, then A is back online
  // B checks a team out first (online), so there is something to check in; both phones see it out before A goes offline
  const x = (await comp(B)).teams.find(e => e.checkedIn).id;
  await checkIn(B, x); await w(2500);
  const out = !(await comp(A)).teams.find(e => e.id === x).checkedIn;
  await A.click('[data-tab="setup"]'); await w(600);
  await A.context().setOffline(true); await w(500);
  await setTarget(A, 11); await w(800);
  await checkIn(B, x); await w(2500);
  await A.context().setOffline(false); await w(7000);
  const t3 = await comp(B), t3a = await comp(A);
  log(`offline setup change after sync: kept ${t3.target === 11 && t3a.target === 11} | B's check-in kept ${out && !!t3.teams.find(e => e.id === x).checkedIn && !!t3a.teams.find(e => e.id === x).checkedIn}`);
  await A.click('[data-tab="entries"]'); await B.click('[data-tab="entries"]'); await w(800);
  await A.screenshot({ path: process.env.OUT + '/race-edits-a-entries.png', fullPage: true });
  await B.screenshot({ path: process.env.OUT + '/race-edits-b-entries.png', fullPage: true });
  log('errs', JSON.stringify(errs.filter(e => !/net::|Failed to fetch|offline|Could not reach/i.test(e))));
  await o.close();
})().catch(e => { console.log('crashed:', e.message); process.exit(1); });
