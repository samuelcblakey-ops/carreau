// Faster first load: a competition link starts loading before the anonymous sign-in finishes (competitions are public
// to read), and nothing that depends on who you are runs early: an organiser who reloads on Setup stays on Setup, and
// opening the site with no link still lands on your own newest competition. Sign-in is slowed down on purpose here.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const slowAuth = async (c, ms) => c.route(/127\.0\.0\.1:9099\/.*(signUp|lookup)/, async r => { await w(ms); await r.continue(); });
  const mk = async (n, ctx) => { const c = ctx || await b.newContext({ viewport: { width: 1100, height: 900 } }); if (!ctx) await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return [p, c]; };
  // the organiser makes a competition
  const [A, ac] = await mk('organiser'); await A.goto(process.env.WEB_URL); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500); const tid = await A.evaluate(() => location.hash.slice(1).split('.')[0]);
  await A.evaluate(async () => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name = 'Early Bird Open'; await S.store.setTournament(t); }); await w(1500);

  // a spectator opens the link with a slow sign-in: the competition shows before the device has signed in
  const [V, vc] = await mk('spectator'); await slowAuth(vc, 4000);
  await V.goto(process.env.WEB_URL + '#' + tid);
  const seen = await V.evaluate(async () => { const t0 = performance.now(); while (performance.now() - t0 < 15000) { const C = window.__carreau; const name = C?.T?.()?.name; if (name) return { name, signedIn: !!window.__testUid?.() }; await new Promise(r => setTimeout(r, 50)); } return null; });
  log(`spectator before sign-in: ${seen?.name} | signed in yet ${seen?.signedIn}`);
  await w(10000); log('spectator after sign-in:', await V.evaluate(() => !!window.__testUid() + ' ' + window.__carreau.T()?.name));

  // the organiser reloads on Setup with a slow sign-in: still on Setup afterwards, with the organiser tabs
  await A.evaluate(() => document.querySelector('[data-tab="setup"]').click()); await w(500);
  await slowAuth(ac, 3000); await A.reload(); await w(1500);
  log('organiser during sign-in tab:', await A.evaluate(() => window.__carreau.S.tab));
  await w(5000);
  log('organiser after sign-in:', await A.evaluate(() => window.__carreau.S.tab + ' | ' + window.__carreau.T()?.name + ' | setup tab ' + !!document.querySelector('[data-tab="setup"]')));

  // no link: the organiser still lands on their own newest competition, not the start screen
  await A.goto(process.env.WEB_URL + '#'); await A.evaluate(() => history.replaceState(null, '', location.pathname)); await A.reload(); await w(6000);
  log('no link lands on:', await A.evaluate(() => window.__carreau.T()?.name + ' | home ' + !!window.__carreau.S.home));
  log('errs', JSON.stringify(errs)); await b.close();
})();
