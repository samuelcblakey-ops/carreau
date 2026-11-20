// Event pages, from the rest of the site (event-page-share): the front page's banner while the event is live (UK dates),
// the notice on one of its competitions for spectators but not organisers, and the share image's size.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const errs = []; const root = path.join(__dirname, '..');
  const ev = JSON.parse(fs.readFileSync(path.join(root, 'src', 'events', 'worlds2026.json'), 'utf8'));
  const open = async (when, vw = 390) => { const p = await b.newPage({ viewport: { width: vw, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
    await p.clock.setFixedTime(new Date(when)); await p.addInitScript(e => { window.SN_EVENTS = [e]; }, ev);
    await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400); return p; };
  const banner = p => p.evaluate(() => { const c = [...document.querySelectorAll('.ev-banner')]; return c.length ? c.map(x => x.querySelector('h2').textContent + ' → ' + x.querySelector('a').getAttribute('href')).join(' ; ') : 'none'; });

  // Sat 21 Nov, UK afternoon: the banner sits at the top of the start screen, above "Run a competition"
  const P = await open('2026-11-21T15:00:00Z');
  console.log('front banner during event: ' + await banner(P));
  console.log('banner above run a competition: ' + await P.evaluate(() => { const a = document.querySelector('.ev-banner'), r = document.querySelector('.start-hero'); return !!(a && r && (a.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING)); }));
  console.log('390 px: ' + (await P.evaluate(() => document.documentElement.scrollWidth > innerWidth) ? 'sideways scroll' : 'no sideways scroll') + ' | open button ' + await P.evaluate(() => { const r = document.querySelector('.ev-banner a').getBoundingClientRect(); return r.height >= 44 && r.width >= 44; }));
  await P.screenshot({ path: process.env.OUT + '/app-event-share-front-390.png' });
  // the last day ends at midnight UK time: 23:30 UK on the 24th still shows it; 00:30 UK on the 25th doesn't
  const L = await open('2026-11-24T23:30:00Z'); console.log('last evening (UK): ' + await banner(L));
  const O = await open('2026-11-25T00:30:00Z'); console.log('front banner outside dates: ' + await banner(O));
  const E = await open('2026-11-19T12:00:00Z'); console.log('day before: ' + await banner(E));

  // a competition that's one of the event's tabs, opened by a spectator, then by its organiser
  const note = await P.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), txt = el => (el?.textContent || 'none').replace(/\s+/g, ' ').trim(), out = {};
    document.querySelector('[data-act="new-t"]').click(); await w(80);
    const t = JSON.parse(JSON.stringify(C.T())); t.id = 'tkpo1655'; t.name = "Men's Triples"; t.wizard = false; await S.store.setTournament(t); S.tournaments[t.id] = t;
    S.tid = 'tkpo1655'; S.tab = 'draw';
    const perm = S.permFn; S.permFn = () => ({ edit: false, score: false }); C.render(); await w(60);
    out.spec = txt(document.querySelector('.ev-notice')); out.href = document.querySelector('.ev-notice a')?.getAttribute('href');
    out.first = document.querySelector('main > :not(h1.sr-only)')?.classList.contains('ev-notice'); // under the header (the page's hidden heading aside)
    S.tab = 'standings'; C.render(); await w(40); out.standings = !!document.querySelector('.ev-notice');
    S.permFn = perm; S.tab = 'draw'; C.render(); await w(60); out.org = txt(document.querySelector('.ev-notice'));
    return out; });
  console.log('competition notice for spectator: ' + note.spec + ' | link ' + note.href + ' | first ' + note.first + ' | on standings ' + note.standings);
  console.log('competition notice for organiser: ' + note.org);
  await P.evaluate(async () => { const C = window.__carreau; C.S.permFn = () => ({ edit: false, score: false }); C.render(); await new Promise(r => setTimeout(r, 60)); });
  await P.screenshot({ path: process.env.OUT + '/app-event-share-notice-390.png' });
  // a competition that isn't in an event, and the event's competition after the event
  console.log('other competition: ' + await P.evaluate(async () => { const C = window.__carreau, S = C.S; const id = Object.keys(S.tournaments).find(k => k !== 'tkpo1655'); S.tid = id; C.render(); await new Promise(r => setTimeout(r, 40)); return document.querySelector('.ev-notice') ? 'notice' : 'none'; }));

  const png = fs.readFileSync(path.join(root, 'public', ev.share.image));
  console.log('share image: ' + png.readUInt32BE(16) + 'x' + png.readUInt32BE(20) + ' | named in the event ' + (ev.share.image === 'worlds2026-share.png'));
  console.log('errs ' + JSON.stringify(errs));
  await b.close();
})();
