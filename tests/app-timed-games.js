// Timed games: how many mènes follow the time limit (Setup and Quick setup), and the "Ended on time" wording in the score box.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const L = [];
  const ev = async fn => { const r = await p.evaluate(fn); L.push(...r); };
  const helpers = `const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), L = [];
    const noScroll = () => document.documentElement.scrollWidth <= innerWidth;`;
  // 1. Setup: hidden at 0, shown once a limit is set, +2 by default
  await ev(new Function(`return (async () => { ${helpers} try {
    q('[data-act="new-t"]').click(); await w(150); q('[data-act="wiz-skip"]').click(); await w(150);
    L.push('setup time 0: extra mènes shown ' + !!q('.time-extra'));
    const f = q('#f-timelimit'); f.value = '60'; f.dispatchEvent(new Event('change', { bubbles: true })); await w(150);
    L.push('setup time 60: ' + q('.time-extra .eyebrow').textContent + ' | ' + [...document.querySelectorAll('[data-set="timeExtra"]')].map(x => x.textContent).join(' / ') + ' | pressed ' + q('[data-set="timeExtra"][aria-pressed="true"]').textContent);
    L.push('help +2: ' + q('.time-extra p').textContent);
    q('.time-extra').scrollIntoView({ block: 'center' });
    } catch (e) { L.push('ERR ' + e.message); } return L; })()`));
  await p.waitForTimeout(100); await p.screenshot({ path: process.env.OUT + '/timed-setup-390.png' });
  await ev(new Function(`return (async () => { ${helpers} try {
    q('[data-set="timeExtra"][data-val="1"]').click(); await w(150);
    L.push('tap +1: saved ' + C.T().timeExtra + ' ' + typeof C.T().timeExtra + ' | help ' + q('.time-extra p').textContent);
    // French: the label and both buttons are translated
    q('[data-lang="fr"]').click(); await w(100);
    const fr = [q('.time-extra .eyebrow').textContent, ...[...document.querySelectorAll('[data-set="timeExtra"]')].map(x => x.textContent)];
    L.push('fr setup: translated ' + (fr[0] !== 'When time is up' && fr[1] !== '+1 mène' && fr[2] !== '+2 mènes'));
    q('[data-lang="en"]').click(); await w(100);
    L.push('phone 390: no sideways scroll ' + noScroll());
    // a run-through copies the choice
    const src = JSON.parse(JSON.stringify(C.T())); src.template = true; await S.store.setTournament(src); S.tournaments[src.id] = src; q('[data-tab="draw"]').click(); await w(80);
    q('[data-act="use-template"]').click(); await w(200);
    L.push('run-through keeps +1: ' + (C.T().id !== src.id && C.T().timeExtra === 1));
    // Quick setup up to its last step
    q('[data-act="new-t"]').click(); await w(150); q('#wz-name').value = 'Timed'; q('[data-act="wiz-next"]').click(); await w(60);
    q('[data-act="wiz-set"][data-k="kind"][data-v="triples"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(60); q('[data-act="wiz-next"]').click(); await w(60);
    L.push('quick setup time 0: when time is up shown ' + !!(q('#wz-extra') && !q('#wz-extra').hidden));
    } catch (e) { L.push('ERR ' + e.message); } return L; })()`));
  // typed for real, so the cursor has to stay in the box
  await p.locator('#wz-time').tap(); await p.keyboard.press('Control+A'); await p.keyboard.type('45'); await p.waitForTimeout(100);
  await ev(new Function(`return (async () => { ${helpers} try {
    const x = q('#wz-extra');
    L.push('quick setup time 45 typed: ' + x.querySelector('.eyebrow').textContent + ' | ' + [...x.querySelectorAll('.wiz-opt')].map(o => o.textContent).join(' / ') + ' | on ' + x.querySelector('.wiz-opt.on').textContent + ' | cursor still in the box ' + (document.activeElement && document.activeElement.id === 'wz-time' && x.hidden === false));
    x.scrollIntoView({ block: 'center' });
    } catch (e) { L.push('ERR ' + e.message); } return L; })()`));
  await p.waitForTimeout(100); await p.screenshot({ path: process.env.OUT + '/timed-wizard-390.png' });
  await p.locator('[data-act="wiz-set"][data-k="timeExtra"][data-v="1"]').tap(); await p.waitForTimeout(150);
  await ev(new Function(`return (async () => { ${helpers} try {
    const opts = [...document.querySelectorAll('[data-k="timeExtra"]')];
    L.push('quick setup phone 390: options 44+ px ' + opts.every(o => o.getBoundingClientRect().height >= 44) + ' | no sideways scroll ' + noScroll());
    L.push('quick setup help +1: ' + q('#wz-extra p').textContent + ' | time kept ' + q('#wz-time').value);
    q('[data-act="wiz-next"]').click(); await w(200);
    L.push('quick setup +1 finished: time ' + C.T().timeLimit + ' | extra ' + C.T().timeExtra + ' ' + typeof C.T().timeExtra);
    q('[data-tab="setup"]').click(); await w(80); q('[data-act="wiz-again"]').click(); await w(150);
    for (let i = 0; i < 3; i++) { q('[data-act="wiz-next"]').click(); await w(60); }
    L.push('quick setup again: on ' + q('.wiz-opt.on[data-k="timeExtra"]').textContent);
    q('[data-act="wiz-skip"]').click(); await w(100);
    // shooting has no time limit, so no choice
    q('[data-act="new-t"]').click(); await w(150); q('#wz-name').value = 'Shoot'; q('[data-act="wiz-next"]').click(); await w(60);
    q('[data-act="wiz-set"][data-k="kind"][data-v="shooting"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(60); q('[data-act="wiz-next"]').click(); await w(60);
    L.push('quick setup shooting: when time is up shown ' + !!(q('#wz-extra') && !q('#wz-extra').hidden));
    q('[data-act="wiz-skip"]').click(); await w(100);
    // the score box when a game ended on time
    q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Timed score', system: 'swiss', checkin: false, swissRounds: 3, timeLimit: 50, wizard: false });
    ['A', 'B', 'C', 'D'].forEach(n => t.teams.push({ id: n, name: 'Team ' + n, players: ['x'], active: true }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(30);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(300);
    const g = C.MS().find(m => m.a && m.b && !m.bye); q('[data-match="' + g.id + '"]').click(); await w(80);
    q('[data-act="mode"][data-mode="time"]').click(); await w(40);
    L.push('ended on time notice: ' + q('#modal .notice').textContent);
    q('[data-act="pick"][data-k="sa"][data-n="9"]').click(); await w(30); q('[data-act="pick"][data-k="sb"][data-n="9"]').click(); await w(30);
    q('[data-act="save-final"]').click(); await w(100);
    L.push('level refused: ' + (q('#modal .err')?.textContent || ''));
    q('[data-act="close"]').click(); await w(60);
    } catch (e) { L.push('ERR ' + e.message); } return L; })()`));
  console.log(L.join('\n')); console.log('errs', errs); await b.close();
})();
