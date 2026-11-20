// Draw & results for someone who can't edit (event-page-visitor-polish): no organiser wording before the draw, a plain
// round box (no red, no "games still to finish"), and no "Waiting for piste" when every piste is switched off.
// Organisers see what they saw before.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), txt = el => (el?.textContent || '').replace(/\s+/g, ' ').trim(), r = [];
    const org = S.permFn, viewer = () => ({ edit: false, score: false });
    const save = async f => { const t = JSON.parse(JSON.stringify(C.T())); f(t); await S.store.setTournament(t); S.tournaments[t.id] = t; await w(40); C.render(); await w(40); };
    q('[data-act="new-t"]').click(); await w(80);
    await save(t => { t.checkin = false; t.wizard = false; t.system = 'swiss'; t.swissRounds = 5; });
    S.tab = 'draw'; C.render(); await w(40);
    r.push('organiser empty draw unchanged: ' + txt(q('main .panel p.muted')));
    S.permFn = viewer; C.render(); await w(40);
    r.push('spectator empty draw: ' + txt(q('main .panel')) + ' | "Registration" ' + q('main').textContent.includes('Registration'));
    S.permFn = org; await save(t => t.courts.forEach(c => { c.active = false; }));
    r.push('organiser empty line with no pistes: ' + txt(q('main .panel p')));
    // 4 teams, one piste in use: round 1 has one game on the piste and one ready, waiting for it
    await save(t => { ['Italy (ITA)', 'France (FRA)', 'Thailand (THA)', 'Spain (ESP)'].forEach((name, i) => t.teams.push({ id: 'e' + i, name, players: ['a', 'b', 'c'], active: true })); t.courts[0].active = true; });
    q('[data-act="first-draw"]').click(); await w(400);
    const panel = () => [...document.querySelectorAll('main .panel')].find(x => /planned/.test(x.textContent));
    const ready = () => document.querySelector('main .match.ready .meta > span:first-child');
    r.push('organiser round panel: ' + [...panel().classList].filter(c => c.startsWith('rp-')).join(' ') + ' | ' + txt(panel().querySelector('.rp-state')));
    r.push('one piste on, ready game label: ' + txt(ready()));
    S.permFn = viewer; C.render(); await w(40);
    r.push(`spectator round panel: plain, no rp-live: ${!/rp-(live|ready)/.test(panel().className)} | no "still to finish": ${!/still to finish/.test(panel().textContent)} | ${txt(panel().firstElementChild)}`);
    r.push('spectator, one piste on, ready game label: ' + txt(ready()));
    S.permFn = org; await save(t => t.courts.forEach(c => { c.active = false; }));
    r.push('pistes all off, ready game label: "' + txt(ready()) + '" | Ready pill ' + !!q('main .match.ready .pill.ready'));
    S.permFn = viewer; C.render(); await w(40);
    r.push('spectator, pistes all off, ready game label: "' + txt(ready()) + '"');
    r.push('390 px: ' + (document.documentElement.scrollWidth > innerWidth ? 'sideways scroll' : 'no sideways scroll'));
    return r.join('\n');
  });
  console.log(out);
  await p.screenshot({ path: process.env.OUT + '/app-visitor-draw-390.png', fullPage: true });
  console.log('errs ' + JSON.stringify(errs));
  await b.close();
})();
