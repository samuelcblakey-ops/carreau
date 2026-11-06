// Language menu: eight languages, chosen from a menu in the header and remembered on the device.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(150);
    L.push('menu closed: ' + q('.lang-menu').hidden);
    q('[data-act="lang-menu"]').click(); await w(60); L.push('menu open: ' + !q('.lang-menu').hidden + ' options ' + document.querySelectorAll('.lang-menu [data-lang]').length);
    document.body.click(); await w(60); L.push('outside click closes: ' + q('.lang-menu').hidden);
    for (const l of ['fr', 'es', 'it', 'de', 'nl', 'pt', 'th']) {
      q('[data-act="lang-menu"]').click(); await w(40); q(`[data-lang="${l}"]`).click(); await w(80);
      L.push(`${l}: ${q('.lang-btn').textContent.trim().slice(0, 2)} | ${q('.memorial').textContent} | ${q('[data-tab="entries"]').textContent.trim()} | ${q('.wiz h2')?.textContent} | html lang ${document.documentElement.lang}`);
    }
    L.push('footer fr: ' + (q('[data-act="lang-menu"]').click(), await w(40), q('[data-lang="fr"]').click(), await w(80), q('#foot').textContent.replace(/\s+/g, ' ').trim()) + ' | link ' + q('#foot a').getAttribute('href'));
    L.push('dedication in the footer: ' + !!q('#foot .memorial') + ' | not in the header: ' + !q('header .memorial'));
    L.push('remembered: ' + localStorage.getItem('carreau-lang'));
    // the header and tabs stay translated after the menus and on the pages that only redraw the main area
    const hdrOk = () => q('.brand-name small').textContent !== 'Competition desk' && q('[data-tab="entries"] .t-long').textContent !== 'Registration' && !!q('.new-t') && !/New/.test(q('.new-t').textContent);
    q('[data-act="lang-menu"]').click(); await w(60);
    L.push(`fr after language menu: header ${q('.brand-name small').textContent} | tabs ${q('[data-tab="entries"] .t-long').textContent}`);
    q('[data-act="lang-menu"]').click(); await w(60);
    q('[data-act="theme-menu"]').click(); await w(60); document.body.click(); await w(60);
    L.push('fr after sun/moon menu closed by an outside tap: header translated ' + hdrOk());
    location.hash = '#halloffame'; await w(300); L.push('fr hall of fame: header translated ' + hdrOk());
    location.hash = '#streams'; await w(300); L.push('fr stream a game: header translated ' + hdrOk());
    location.hash = ''; await w(200);
    // a summary line of " · " parts translates part by part ({x} drawn mustn't swallow the whole line)
    const S = C.S, txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { id: 'sum-line', name: 'Summary line', system: 'clubs', format: 'triples', date: '2026-11-04', checkin: false, wizard: false,
      teams: Array.from({ length: 4 }, (_, i) => ({ id: 's' + i, name: 'Team ' + 'ABCD'[i], players: ['a'], active: true })), draws: [{ id: 'CL', kind: 'club' }] });
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(60);
    const english = /\b(Triples|teams|Fixtures|drawn|Nov)\b/;
    const summary = async () => { C.render(); await w(60); q('[data-act="picker"]').click(); await w(80); const s = txt(q('.pick-row[data-id="sum-line"] .small')); q('[data-act="picker"]').click(); await w(60); return s; };
    let line = await summary(); L.push(`fr summary line: ${line} | english parts ${english.test(line) ? line.match(english)[0] : 'none'}`);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="th"]').click(); await w(80);
    line = await summary(); L.push(`th summary line: ${line} | english parts ${english.test(line) ? line.match(english)[0] : 'none'}`);
    q('[data-act="lang-menu"]').click(); await w(40); q('[data-lang="fr"]').click(); await w(80);
    // the override box names the stage and game in French, the teams as they are
    q('[data-act="new-t"]').click(); await w(150); const k = JSON.parse(JSON.stringify(C.T())); Object.assign(k, { name: 'KO override', system: 'knockout', format: 'doubles', checkin: false, wizard: false, koThird: true, seeding: 'entry', draws: [], date: '',
      teams: Array.from({ length: 4 }, (_, i) => ({ id: 'k' + i, name: 'Team ' + 'ABCD'[i], players: ['a'], active: true })) });
    await S.store.setTournament(k); S.tournaments[k.id] = k; await w(60);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(300);
    for (let g = 0; g < 10; g++) { const m = C.MS().filter(m => m.a && m.b && !m.done).sort((x, y) => x.round - y.round)[0]; if (!m) break; await C.recordResult(m.id, 13, 4, true); await w(20); }
    const sf = C.MS().find(m => m.round === 1 && !m.third); C.render(); await w(60);
    q(".bk-bar .rchip[data-v=\"1\"]")?.click(); await w(80); q(`[data-match="${sf.id}"]`).click(); await w(60); q('#sc-sa').value = 4; q('#sc-sb').value = 13; q('[data-act="save-final"]').click(); await w(150);
    const items = [...document.querySelectorAll('#modal li')].map(txt);
    L.push(`fr override box: ${items.join(' ; ')} | team names kept ${items.every(x => /Team [A-D]/.test(x))}`);
    q('#modal [data-act="close"]')?.click(); await w(60);
    q('[data-lang="en"]').click(); await w(60); L.push('back to english: ' + q('.memorial').textContent);
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
