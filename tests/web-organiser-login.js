// Organiser login: off by default (nothing changes); the admin makes codes and switches it live; then only devices logged in
// with a valid code can create competitions, every device with the same code can run them, others only follow / view examples;
// expired or revoked codes stop working.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const W = process.env.WEB_URL;
  const mk = async (n) => { const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const newBtn = p => p.$('[data-act="new-t"]').then(Boolean);
  const text = (p, s) => p.evaluate(sel => (document.querySelector(sel)?.innerText || '').replace(/\s+/g, ' ').trim(), s);

  // admin
  const AD = await mk('admin'); await AD.goto(W + '#admin'); await w(2500); await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3000);
  log('admin panel:', (await text(AD, '#adm-org')).slice(0, 60));
  // an example competition, made by the admin
  await AD.goto(W); await w(2000); await AD.click('[data-act="new-t"]'); await w(2500);
  const ex = await AD.evaluate(() => location.hash.slice(1));
  await AD.evaluate(async id => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[id])); t.name = 'Example comp'; t.listed = true; await S.store.setTournament(t); }, ex); await w(800);

  // visitor while login is off: can create as before
  const V = await mk('visitor'); await V.goto(W); await w(3000);
  log('off: visitor new button', await newBtn(V));
  // the login page exists but isn't live
  await V.goto(W + '#login'); await w(1200); log('off: login page:', (await text(V, 'main')).slice(0, 90));

  // admin makes codes: one valid, one already expired
  await AD.goto(W + '#admin'); await w(2500);
  await AD.fill('#org-label', 'Bristol PC'); await AD.click('[data-act="org-make"]'); await w(1500);
  const code = await AD.evaluate(() => document.querySelector('#adm-org .notice b span').textContent.trim());
  log('code made:', /^[A-Z0-9]{8}$/.test(code), '| link:', (await AD.inputValue('#org-link')).endsWith('#login.' + code));
  await AD.evaluate(() => window.__testDoc('orgcodes/OLDCODE1', { label: 'Old', createdAt: new Date(Date.now() - 5 * 864e5), expiresAt: new Date(Date.now() - 2 * 864e5), revoked: false })); await w(800);
  log('codes listed:', (await text(AD, '#adm-org')).includes('Bristol PC') && /expired/i.test(await text(AD, '#adm-org')));
  // go live
  await AD.click('[data-act="organiser-login"]'); await w(2000); log('live pill:', await text(AD, '#adm-org .pill'));

  // visitor once live: no create, examples still there, can't write
  await V.goto(W); await w(3000);
  log('live: visitor new button', await newBtn(V), '| header login button', !!(await V.$('[data-act="org-page"]')), '| sees example', await V.evaluate(id => !!window.__carreau.S.tournaments[id], ex));
  log('live: visitor create via store:', await V.evaluate(async () => { const S = window.__carreau.S; const id = 'tz' + Date.now(); try { await S.store.setTournament({ id, name: 'x', ownerUid: window.__testUid(), archived: false, listed: false, _new: true }); return 'WROTE'; } catch (e) { return 'blocked ' + e.code; } }));

  // organiser: wrong code, expired code, then the real one via the link
  const O = await mk('organiser'); await O.goto(W + '#login'); await w(3000);
  await O.fill('#org-code', 'NOPE1234'); await O.click('[data-act="org-login"]'); await w(1500); log('wrong code:', await text(O, 'main .notice'));
  await O.fill('#org-code', 'OLDCODE1'); await O.click('[data-act="org-login"]'); await w(1500); log('expired code:', (await text(O, 'main .notice')).slice(0, 40));
  await O.goto(W + '#login.' + code); await w(3000);
  log('logged in:', (await text(O, 'main .panel')).slice(0, 60), '| org', JSON.stringify(await O.evaluate(() => window.__testOrg())));
  await O.click('[data-act="org-new"]'); await w(2500);
  const tid = await O.evaluate(() => location.hash.slice(1));
  log('organiser created:', await O.evaluate(id => window.__carreau.S.tournaments[id]?.orgCode, tid) === code, '| on registration', await O.evaluate(() => !!document.querySelector('[data-tab="entries"][aria-current="true"]')));
  await O.evaluate(async id => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[id])); t.name = 'Spring Triples'; await S.store.setTournament(t); }, tid); await w(800);

  // the same code on a second device sees and runs it
  const O2 = await mk('organiser 2'); await O2.goto(W + '#login'); await w(3000); await O2.fill('#org-code', code.toLowerCase()); await O2.click('[data-act="org-login"]'); await w(2500);
  log('second device: lists it', (await text(O2, 'main')).includes('Spring Triples'));
  await O2.goto(W + '#' + tid); await w(2500);
  log('second device edit:', await O2.evaluate(async () => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.venue = 'Clifton'; try { await S.store.setTournament(t); return 'ok'; } catch (e) { return 'blocked ' + e.code; } }));
  log('organiser cannot move it to another code:', await O2.evaluate(async () => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.orgCode = 'OLDCODE1'; try { await S.store.setTournament(t); return 'WROTE'; } catch (e) { return 'blocked ' + e.code; } }));

  // visitor: can follow it, can't change it
  await V.goto(W + '#' + tid); await w(2500);
  log('visitor tabs:', await V.$$eval('#tabs button', e => e.map(x => x.getAttribute('aria-label')).join('|')));
  log('visitor edit:', await V.evaluate(async () => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name = 'hacked'; try { await S.store.setTournament(t); return 'WROTE'; } catch (e) { return 'blocked ' + e.code; } }));

  // the admin revokes the code: organisers can't change it any more
  await AD.goto(W + '#admin'); await w(2500); await AD.click(`[data-act="org-revoke"][data-code="${code}"]`); await w(1500);
  await O.goto(W + '#' + tid); await w(2500);
  log('after revoke edit:', await O.evaluate(async () => { const S = window.__carreau.S; const t = JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name = 'after'; try { await S.store.setTournament(t); return 'WROTE'; } catch (e) { return 'blocked ' + e.code; } }), '| new button', await newBtn(O));
  await O.goto(W + '#login'); await w(1500); log('after revoke page:', (await text(O, 'main .panel')).includes('switched off by the admin'));

  // switch it off again: back to open testing for everyone
  await AD.goto(W + '#admin'); await w(2500); await AD.click('[data-act="organiser-login"]'); await w(2000);
  await V.goto(W); await w(3000); log('off again: visitor new button', await newBtn(V));
  log('errs', errs); await b.close();
})();
