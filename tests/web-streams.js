// Streaming site switch (Off / Admin only / Everyone) and standalone streams on the website: who can see, create, and write.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const base = process.env.WEB_URL;
  const mk = async (n, vw = 1100, vh = 900) => { const c = await b.newContext({ viewport: { width: vw, height: vh } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log = (...a) => console.log(...a);
  const has = (p, sel) => p.evaluate(s => !!document.querySelector(s), sel);
  const setSite = (p, data) => p.evaluate(d => window.__testSetSite(d), data);
  const AD = await mk('admin'); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  log('admin switch default off:', await AD.evaluate(() => document.querySelector('[data-act="streaming-mode"][data-mode="off"]')?.getAttribute('aria-pressed') === 'true'));
  // off: nothing shows and nothing can be written: no start-screen card, no Stream tab (the Big screen takes its place), no streams page
  const V = await mk('visitor'); await V.goto(base); await w(3500);
  log('off: start card hidden:', !(await has(V, '.start-card[href="#streams"]')), '| other cards:', await V.$$eval('.start-actions .start-card b', e => e.map(x => x.textContent.replace('↗', '').trim()).join(',')));
  await V.screenshot({ path: process.env.OUT + '/web-streams-off-start.png' });
  await V.evaluate(() => { location.hash = 'streams'; }); await w(800);
  log('off: streams page:', await V.evaluate(() => document.querySelector('#streaming-off h3')?.textContent + ' | new button ' + !!document.querySelector('[data-act="strm-new"]')));
  log('off: new stream denied:', await V.evaluate(async () => { try { await window.__testRaw.set('streams/soff1', { id: 'soff1', ownerUid: window.__testUid(), a: { name: 'X' }, b: { name: 'Y' } }); return 'WROTE'; } catch (e) { return e.code; } }));
  await V.click('#streaming-off [data-tab]'); await w(800);
  await V.click('[data-act="new-t"]'); await w(2500); const tid = await V.evaluate(() => location.hash.slice(1));
  await V.click('[data-act="wiz-skip"]'); await w(800); await V.click('[data-tab="entries"]'); await w(400); // a new competition opens on the quick setup
  await V.fill('#bulk', 'Club Pins\nCarreau Vents\nGravier Collines\nMistral Lions'); await V.click('#bulk-form button[type=submit]'); await w(1200);
  await V.click('[data-act="checkin-all"]'); await w(800); await V.click('[data-tab="draw"]'); await w(300); await V.click('[data-act="first-draw"]'); await w(2500);
  const tabs = p => p.$$eval('#tabs button', e => e.map(x => x.dataset.tab).join(','));
  log('off: tabs:', await tabs(V), '| stream tab:', await has(V, '#tabs [data-tab="stream"]'));
  await V.click('#tabs [data-tab="display"]'); await w(800);
  log('off: big screen tab opens:', await V.evaluate(() => window.__carreau.S.tab === 'display' && !!document.querySelector('main').innerText.trim()));
  await V.screenshot({ path: process.env.OUT + '/web-streams-off-tabs.png' });
  const g = await V.evaluate(() => window.__carreau.MS().filter(m => m.a && m.b)[0].id);
  log('off: live write denied:', await V.evaluate(async id => { try { await window.__carreau.S.store.setLive(window.__carreau.S.tid, id, { sa: 1, sb: 0 }); return 'WROTE'; } catch (e) { return e.code; } }, g));
  await V.evaluate(id => { location.hash = window.__carreau.S.tid + '.desk.' + id; }, g); await w(1000);
  log('off: competition desk:', await V.evaluate(() => document.querySelector('#streaming-off h3')?.textContent + ' | back ' + document.querySelector('#streaming-off a')?.getAttribute('href')));
  await V.click('#streaming-off a'); await w(1000);
  // admin only: still hidden from everyone else
  await AD.click('[data-act="streaming-mode"][data-mode="admin"]'); await w(2000);
  log('admin only: visitor still hidden:', !(await has(V, '#tabs [data-tab="stream"]')), '| new stream denied:', await V.evaluate(async () => { try { await window.__testRaw.set('streams/soff2', { id: 'soff2', ownerUid: window.__testUid() }); return 'WROTE'; } catch (e) { return e.code; } }));
  // everyone: the tab and the card come back; a visitor sets up a stream, a helper joins with the desk code, a viewer can only watch
  await AD.click('[data-act="streaming-mode"][data-mode="all"]'); await w(2000);
  log('everyone: tabs:', await tabs(V));
  await V.click('[data-tab="draw"]'); await w(300); await V.click('[data-tab="stream"]'); await w(800);
  log('everyone: competition games shown:', await has(V, '#stream-panel'), '| new stream button:', await has(V, '[data-act="strm-new"]'));
  await V.click('[data-act="strm-new"]'); await w(3000);
  const sid = await V.evaluate(() => location.hash.split('.')[1]);
  const set = async (sel, v) => { await V.fill(sel, v); await V.dispatchEvent(sel, 'change'); await w(600); };
  await set('[data-sfield="a.name"]', 'Les Carreaux'); await set('[data-sfield="b.name"]', "Boule d'Or"); await set('[data-sfield="label"]', 'Club friendly');
  await w(2500); // the desk code is created after the first save
  await V.click('#stream-links [data-act="lv-links"]'); await w(500);
  const links = await V.evaluate(() => Object.fromEntries([...document.querySelectorAll('#stream-links input')].map(i => [i.getAttribute('aria-label'), i.value])));
  log('stream links:', /\.desk\.[A-Z2-9]{8}$/.test(links['Live desk link']), /#s\.\S+\.stream$/.test(links['Overlay (everything)']));
  const W = await mk('viewer', 1280, 720); await W.goto(links['Overlay (everything)']); await w(4000);
  log('viewer overlay:', await W.evaluate(() => [...document.querySelectorAll('.ov-name')].map(e => e.textContent.trim()).join(' v ') + ' ' + [...document.querySelectorAll('.ov-score')].map(e => e.textContent).join('-')));
  log('viewer write:', await W.evaluate(async id => { const C = window.__carreau; const st = JSON.parse(JSON.stringify(C.S.streams[id])); st.live = { sa: 9 }; try { await C.S.store.setStream(st); return 'WROTE'; } catch (e) { return e.code; } }, sid));
  const H = await mk('helper', 390, 844); await H.goto(links['Live desk link']); await w(5000);
  log('helper joined:', await H.evaluate(() => location.hash + ' can ' + !!window.__carreau.liveCtx()?.can));
  await H.click('[data-act="lv-win"][data-side="a"]'); await w(200); await H.click('[data-act="lv-pts"][data-n="3"]'); await w(2500);
  log('helper end:', await H.evaluate(id => { const L = window.__carreau.S.streams[id].live; return `${L.sa}-${L.sb} ends ${L.ends.length}`; }, sid));
  log('helper rename denied:', await H.evaluate(async id => { const C = window.__carreau; const st = JSON.parse(JSON.stringify(C.S.streams[id])); st.a.name = 'Hacked'; try { await C.S.store.setStream(st); return 'WROTE'; } catch (e) { return e.code; } }, sid));
  await w(1500); log('overlay follows:', await W.evaluate(() => [...document.querySelectorAll('.ov-score')].map(e => e.textContent).join('-') + ' | ' + document.querySelector('.ov-line')?.textContent.replace(/\s+/g, ' ').trim()));
  await W.screenshot({ path: process.env.OUT + '/web-stream-standalone.png' });
  log('owner list:', await V.evaluate(() => { location.hash = 'streams'; return new Promise(r => setTimeout(() => r([...document.querySelectorAll('.erow .who b')].map(e => e.textContent).join('|')), 1500)); }));
  await V.click('#tabs [data-tab="draw"]'); await w(800); await V.click('header .brand .home'); await w(800); // the logo: the start screen
  log('everyone: start card shown:', await has(V, '.start-card[href="#streams"]'));
  // switched off again: everything stops. The desk and overlay already open go quiet, and the rules refuse their writes
  await AD.click('[data-act="streaming-mode"][data-mode="off"]'); await w(2500);
  log('off again: start card hidden:', !(await has(V, '.start-card[href="#streams"]')), '| desk:', await H.evaluate(() => document.querySelector('#streaming-off h3')?.textContent + ' | buttons ' + document.querySelectorAll('[data-act="lv-win"]').length),
    '| overlay blank:', await W.evaluate(() => !document.querySelector('.ov-score') && !document.querySelector('main').innerText.trim()));
  log('off again: desk write:', await H.evaluate(async id => { try { await window.__carreau.S.store.changeStream(id, prev => Object.assign({}, prev, { sa: 9 })); return 'WROTE'; } catch (e) { return e.code; } }, sid),
    '| owner write:', await V.evaluate(async id => { const C = window.__carreau; const st = JSON.parse(JSON.stringify(C.S.streams[id])); st.label = 'x'; try { await C.S.store.setStream(st); return 'WROTE'; } catch (e) { return e.code; } }, sid),
    '| competition live write:', await V.evaluate(async a => { try { await window.__carreau.S.store.setLive(a.tid, a.id, { sa: 1, sb: 0 }); return 'WROTE'; } catch (e) { return e.code; } }, { tid, id: g }),
    '| owner delete:', await V.evaluate(async id => { try { await window.__carreau.S.store.deleteStream(id); return 'deleted'; } catch (e) { return e.code; } }, sid));
  log('errs', errs); await b.close();
})();
