// The Hall of Fame page against the Firestore rules: a visitor lists the shown entries for their country (the query the rules
// allow), follows a link to one entry, sees no link to a competition once it's archived (the organiser's archive marks the entry
// before the competition goes), and a hidden entry drops off the page and its link says so.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async n => { const c = await b.newContext({ viewport: { width: 1100, height: 900 }, locale: 'en-GB' }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const txt = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' / '), sel);
  // organiser A: a two-team knockout, played and published
  const A = await mk('A'); await A.goto(process.env.WEB_URL); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(() => location.hash.slice(1));
  await A.click('[data-act="wiz-skip"]'); await w(800); await A.click('[data-tab="entries"]'); await w(400);
  await A.fill('#bulk', 'Hitchin A\nLuton B'); await A.click('#bulk-form button[type=submit]'); await w(1000);
  await A.click('[data-act="checkin-all"]'); await w(800);
  await A.evaluate(async () => { const C = window.__carreau, S = C.S; const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { system: 'knockout', name: 'Hitchin Autumn Cup', date: '2026-10-18', venue: 'Hitchin' }); await S.store.setTournament(t); S.tournaments[t.id] = t; }); await w(1200);
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="first-draw"]'); await w(1500);
  await A.evaluate(async () => { const C = window.__carreau; for (const m of C.MS().filter(m => m.a && m.b && !m.done)) await C.recordResult(m.id, 13, 9, true); }); await w(1500);
  await A.click('[data-tab="standings"]'); await w(1500);
  await A.click('[data-hof-panel] [data-act="hof-open"]'); await w(400); await A.click('#modal [data-act="hof-save"]'); await w(2000);
  log('published:', await A.evaluate(() => document.querySelector('#toast')?.textContent), '| view link', await A.evaluate(t => document.querySelector('[data-hof-panel] a.btn')?.getAttribute('href') === '#halloffame.' + t, tid));

  // visitor B: the links in, then the page for England
  const B = await mk('B'); await B.goto(process.env.WEB_URL); await w(3500);
  log('links:', await B.evaluate(() => [!!document.querySelector('header .hof-btn[href="#halloffame"]'), !!document.querySelector('#foot a[href="#halloffame"]'), !!document.querySelector('.start-actions a[href="#halloffame"]')].join(' ')));
  await B.click('header .hof-btn'); await w(2500);
  log('page:', await txt(B, 'main h2'), '| country', await B.evaluate(() => document.querySelector('#hof-country')?.value), '| has the card', (await txt(B, '#hof-results .hof-card h3')).split(' / ').includes('Hitchin Autumn Cup'),
    '| view link', await B.evaluate(t => !!document.querySelector(`#hof-${t} a.btn[href="#${t}"]`), tid), '| no competition watched', await B.evaluate(() => !window.__carreau.S.tid || window.__carreau.S.tid !== 'halloffame'));
  await B.selectOption('#hof-country', 'all'); await w(2000); log('all countries: has the card', (await txt(B, '#hof-results .hof-card h3')).split(' / ').includes('Hitchin Autumn Cup'));
  // a link to the entry, opened fresh
  const B2 = await mk('B2'); await B2.goto(process.env.WEB_URL + '#halloffame.' + tid); await w(4000);
  log('deep link:', await B2.evaluate(t => document.querySelector('.hof-focus')?.id === 'hof-' + t, tid), '| tid not taken as a competition', await B2.evaluate(() => window.__carreau.S.tid !== 'halloffame'));
  // a visitor can't mark someone else's entry
  log('visitor marks gone:', await B.evaluate(async t => { try { await window.__testRaw.update('hallOfFame/' + t, { gone: true }); return 'ok'; } catch (e) { return 'denied ' + e.code; } }, tid));

  // the organiser archives: the entry stays, without the link
  await A.click('[data-tab="setup"]'); await w(1000); await A.click('[data-act="archive"]'); await w(300); await A.click('[data-act="archive-yes"]'); await w(2500);
  log('archived entry:', await B.evaluate(async t => { const e = await window.__testRaw.get('hallOfFame/' + t); return e ? 'gone ' + e.gone : 'missing'; }, tid));
  await B.goto(process.env.WEB_URL + '#halloffame'); await B.reload(); await w(3500);
  log('after archive:', await B.evaluate(t => [!!document.querySelector('#hof-' + t), !!document.querySelector(`#hof-${t} a.btn`)].join(' '), tid));

  // the admin hides it: off the page, and its link says so
  const AD = await mk('admin'); await AD.goto(process.env.WEB_URL + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  log('admin hide:', await AD.evaluate(async t => { try { await window.__testRaw.update('hallOfFame/' + t, { hidden: true, hiddenAt: Date.now() }); return 'ok'; } catch (e) { return 'denied ' + e.code; } }, tid));
  await B.reload(); await w(3500);
  log('hidden: card shown', await B.evaluate(t => !!document.querySelector('#hof-' + t), tid), '| list still loads', await B.evaluate(() => !!document.querySelector('#hof-results .hof-card, #hof-results .empty')));
  await B2.goto(process.env.WEB_URL + '#halloffame.' + tid); await B2.reload(); await w(3500);
  log('hidden link:', await txt(B2, 'main .notice'));
  log('errs', errs); await b.close();
})();
