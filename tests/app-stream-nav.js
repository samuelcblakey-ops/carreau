// Leaving the stream pages: from a stream's set-up page or the streams list, the tabs, the back buttons, the competition
// picker and "+ New competition" all take you back to a competition (they used to leave you stuck on the stream page).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    const where = () => `${location.hash || '(none)'} | ${q('main .wiz') ? 'Quick setup' : q('main h2')?.textContent.trim() || ''} | stream page ${!!S.liveRoute}`;
    q('[data-act="new-t"]').click(); await w(100); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Club day', wizard: false }); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(60);
    const tid = t.id;
    // into a new stream from the competition's Stream tab
    q('#tabs [data-tab="stream"]').click(); await w(80); q('[data-act="strm-new"]').click(); await w(250);
    L.push('on stream set-up: ' + /^#s\./.test(location.hash) + ' | tabs still shown ' + !!q('#tabs [data-tab="setup"]'));
    const sid = location.hash.split('.')[1];
    // a tab goes back to the competition
    q('#tabs [data-tab="setup"]').click(); await w(150);
    L.push('setup tab: ' + (location.hash === '#' + tid) + ' | ' + where());
    // back button on the set-up page returns to the competition's Stream tab
    location.hash = 's.' + sid; await w(150); const back = [...document.querySelectorAll('main .btn')].find(x => /Streams/.test(x.textContent));
    L.push('back button: ' + back?.textContent.trim()); back.click(); await w(150);
    L.push('after back: ' + (location.hash === '#' + tid) + ' | ' + where() + ' | stream tab current ' + (q('#tabs [aria-current="true"]')?.dataset.tab));
    // the streams list: its back button returns to the competition
    location.hash = 'streams'; await w(150); const back2 = [...document.querySelectorAll('main .btn')].find(x => /‹/.test(x.textContent));
    L.push('streams list back: ' + back2?.textContent.trim()); back2.click(); await w(150);
    L.push('after list back: ' + (location.hash === '#' + tid) + ' | stream page ' + !!S.liveRoute);
    // the browser's back button returns to the stream page
    history.back(); await w(250); L.push('browser back: ' + location.hash + ' | stream page ' + !!S.liveRoute);
    // picking a competition from the picker while on a stream page
    q('[data-act="new-t"]').click(); await w(100); const t2 = C.T(); L.push('new competition from stream page: ' + !S.liveRoute + ' | ' + (location.hash === '#' + t2.id) + ' | ' + where());
    location.hash = 's.' + sid; await w(150);
    q('[data-act="picker"]').click(); await w(60); q(`[data-act="pick-t"][data-id="${tid}"]`).click(); await w(150);
    L.push('picker from stream page: ' + !S.liveRoute + ' | ' + (C.T().id === tid) + ' | ' + where());
    } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\n')[1]); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
