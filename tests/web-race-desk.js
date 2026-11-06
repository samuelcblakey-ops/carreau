// Two phones on one live desk (a competition game's, and a standalone stream's): taps recorded at the same moment both count,
// except a mène: two phones recording one within a couple of seconds is the same mène entered twice (the first is kept).
const { open, together, w } = require('./two-organisers');
(async () => {
  const o = await open({ teams: 4 }); const { A, B, AD, tid, base, errs } = o; const log = (...a) => console.log(...a);
  await AD.evaluate(() => window.__testSetSite({ streaming: true })); await w(1500); // streaming is off by default
  await A.click('[data-tab="draw"]'); await w(1500); await A.click('[data-act="checkin-all"]'); await w(1200); await A.click('[data-act="first-draw"]'); await w(2500);
  const g = await A.evaluate(() => window.__carreau.MS().filter(m => m.a && m.b).sort((x, y) => x.order - y.order)[0].id);
  await A.click('[data-tab="setup"]'); await w(1500); await A.click('[data-tab="stream"]'); await w(2000); // the stream code is created the first time Setup opens
  await A.click(`[data-act="lv-links"][data-id="${g}"]`); await w(500);
  const links = await A.evaluate(() => Object.fromEntries([...document.querySelectorAll('.lv-links input')].map(i => [i.getAttribute('aria-label'), i.value])));

  // what a desk shows, and the notice it's showing (if any)
  const score = p => p.evaluate(() => { const L = window.__carreau.liveCtx()?.L; return L ? { sa: L.sa, sb: L.sb, ends: L.ends.length, thrown: { ...L.thrown } } : null; });
  const notice = p => p.evaluate(() => { const t = document.querySelector('#toast'); return !!t && !t.hidden && /Another phone just recorded this mène/.test(t.textContent); });
  const pts = (p, side, n) => async () => { await p.click(`[data-act="lv-win"][data-side="${side}"]`); await p.click(`[data-act="lv-pts"][data-n="${n}"]`); };
  const ready = async (...ps) => { for (const p of ps) await p.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.hidden = true; }); };
  // the same mène entered on both phones at once: one counts, and the phone whose mène didn't count is told
  const menesTogether = async (P, Q, label, overlay) => {
    const s0 = await score(P); let kept = 0, told = 0, same = true, ov = true;
    for (let i = 0; i < 3; i++) {
      await ready(P, Q); const before = await score(P);
      // ready both phones on "who won", then the points at the same moment
      await together(() => P.click('[data-act="lv-win"][data-side="a"]'), () => Q.click('[data-act="lv-win"][data-side="b"]'));
      await together(() => P.click('[data-act="lv-pts"][data-n="2"]'), () => Q.click('[data-act="lv-pts"][data-n="1"]'));
      // the phone that loses the race retries its write against the other's mène, which can take a second or so
      for (let k = 0; k < 25 && !(await notice(P)) && !(await notice(Q)); k++) await w(200);
      await w(400);
      const [sp, sq, np, nq] = [await score(P), await score(Q), await notice(P), await notice(Q)];
      kept += sp.ends - before.ends;
      const aWon = sp.sa > before.sa, bWon = sp.sb > before.sb; // P's mène (team A) or Q's (team B)
      if ((aWon && !bWon && nq && !np) || (bWon && !aWon && np && !nq)) told++;
      if (i === 0 && (np || nq)) await (np ? P : Q).screenshot({ path: `${process.env.OUT}/web-race-desk-notice-${label.split(' ')[0]}.png` });
      if (sp.sa !== sq.sa || sp.sb !== sq.sb || sp.ends !== sq.ends) same = false;
      if (overlay) { const o = await overlay(); if (o !== `${sp.sa}-${sp.sb}`) ov = false; }
      await w(2500); // the next mène, well after this one
    }
    log(`${label}, mènes together, 3 tries: mènes kept ${kept} of 6 | notice on the other phone ${told} of 3 | same score on both ${same}${overlay ? ' | overlay matches ' + ov : ''}`);
    return s0;
  };
  const menesInTurn = async (P, Q, label, overlay) => {
    const s0 = await score(P); let notices = 0;
    for (let i = 0; i < 3; i++) {
      await ready(P, Q); await pts(P, 'a', 2)(); await w(3000); notices += (await notice(Q)) ? 1 : 0;
      await ready(P, Q); await pts(Q, 'b', 1)(); await w(3000); notices += (await notice(P)) ? 1 : 0;
    }
    const s1 = await score(P); let ov = true;
    if (overlay) ov = (await overlay()) === `${s1.sa}-${s1.sb}`;
    log(`${label}, one after the other, 3 tries: mènes kept ${s1.ends - s0.ends} of 6 | notices ${notices} | added ${s1.sa - s0.sa}-${s1.sb - s0.sb}${overlay ? ' | overlay matches ' + ov : ''}`);
  };

  // the competition desk: A on the organiser's desk, B with the live desk link, a spectator on the overlay
  await B.goto(links['Live desk link']); await w(5000);
  await A.goto(base + '#' + tid + '.desk.' + g); await w(3000);
  const V = await o.mk('viewer', 1280); await V.goto(links['Overlay (everything)']); await w(4000);
  const ovScore = () => V.evaluate(() => [...document.querySelectorAll('.ov-score')].map(e => e.textContent).join('-'));
  await menesTogether(A, B, 'competition desk', ovScore);
  await menesInTurn(A, B, 'competition desk', ovScore);
  const u0 = await score(A); await B.click('[data-act="lv-undo"]'); await w(2000); const u1 = await score(A);
  log(`undo on B: mènes ${u1.ends} | took back ${u0.sa - u1.sa}-${u0.sb - u1.sb}`);
  for (let i = 0; i < 3; i++) { await together(() => A.click('[data-act="lv-boule"][data-side="a"]'), () => B.click('[data-act="lv-boule"][data-side="b"]')); await w(800); }
  await w(1000); const th = (await score(A)).thrown;
  log(`boules together, 3 tries: thrown a ${th.a} b ${th.b}`);
  await A.screenshot({ path: process.env.OUT + '/web-race-desk-comp-a.png' }); await B.screenshot({ path: process.env.OUT + '/web-race-desk-comp-b.png' });

  // a standalone stream: A owns it, B opens its desk link
  await A.goto(base + '#streams'); await w(1500); await A.click('[data-tab="stream"]').catch(() => {}); await w(800);
  await A.click('[data-act="strm-new"]'); await w(3000);
  const sid = await A.evaluate(() => location.hash.split('.')[1]);
  const set = async (sel, v) => { await A.fill(sel, v); await A.dispatchEvent(sel, 'change'); await w(600); };
  await set('[data-sfield="a.name"]', 'Les Carreaux'); await set('[data-sfield="b.name"]', "Boule d'Or"); await w(2500); // the desk code is created after the first save
  await A.click('#stream-links [data-act="lv-links"]'); await w(500);
  const sLinks = await A.evaluate(() => Object.fromEntries([...document.querySelectorAll('#stream-links input')].map(i => [i.getAttribute('aria-label'), i.value])));
  await B.goto(sLinks['Live desk link']); await w(5000);
  await A.goto(base + '#s.' + sid + '.desk'); await w(3000);
  await menesTogether(A, B, 'stream desk');
  await menesInTurn(A, B, 'stream desk');
  await A.screenshot({ path: process.env.OUT + '/web-race-desk-stream-a.png' }); await B.screenshot({ path: process.env.OUT + '/web-race-desk-stream-b.png' });
  await AD.evaluate(() => window.__testSetSite({ streaming: false })); await w(1000); // back to the default
  log('errs', errs); await o.close();
})();
