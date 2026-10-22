// Quick setup for a new competition, thumb-sized controls on touch screens, and readable amber text.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const L = []; try {
    q('[data-act="new-t"]').click(); await w(150);
    L.push('wizard shown: ' + !!q('.wiz') + ' | step: ' + q('.wiz .eyebrow').textContent);
    q('[data-act="wiz-next"]').click(); await w(60); L.push('name required: ' + q('#toast').textContent);
    q('#wz-name').value = 'Spring Doubles'; q('#wz-venue').value = 'Riverside'; q('[data-act="wiz-next"]').click(); await w(60);
    L.push('step 2: ' + q('.wiz h3').textContent + ' options ' + document.querySelectorAll('.wiz-opt').length);
    q('[data-act="wiz-set"][data-k="kind"][data-v="doubles"]').click(); await w(40); q('[data-act="wiz-next"]').click(); await w(60);
    q('[data-act="wiz-set"][data-k="system"][data-v="pools"]').click(); await w(40);
    L.push('swiss rounds hidden for pools: ' + !q('#wz-rounds'));
    q('[data-act="wiz-back"]').click(); await w(40); L.push('back keeps choice: ' + !!q('.wiz-opt.on[data-v="doubles"]')); q('[data-act="wiz-next"]').click(); await w(40);
    q('[data-act="wiz-next"]').click(); await w(60);
    q('#wz-courts').value = '5'; q('#wz-time').value = '45'; q('[data-act="wiz-next"]').click(); await w(200);
    const t = C.T(); L.push(`saved: ${t.name} | ${t.venue} | ${t.entry} ${t.format} ${t.system} | pistes ${t.courts.length} | time ${t.timeLimit} | wizard ${t.wizard}`);
    L.push('wizard gone: ' + !q('.wiz') + ' | toast: ' + q('#toast').textContent + ' | on registration: ' + (S.tab === 'entries'));
    q('[data-tab="setup"]').click(); await w(60); L.push('setup offers quick setup: ' + !!q('[data-act="wiz-again"]'));
    // skip path
    q('[data-act="new-t"]').click(); await w(150); q('[data-act="wiz-skip"]').click(); await w(150);
    L.push('skip goes to setup: ' + (S.tab === 'setup') + ' wizard ' + C.T().wizard);
    // touch targets
    const h = sel => Math.round(q(sel).getBoundingClientRect().height);
    L.push(`touch sizes: btn ${h('main .btn:not(.sm)') >= 44} small ${h('main .btn.sm') >= 40} seg ${h('main .seg button') >= 44}`);
    // amber text contrast
    const sp = document.createElement('span'); sp.className = 'pill playing'; document.body.appendChild(sp); L.push('playing pill text: ' + getComputedStyle(sp).color); sp.remove();
    } catch (e) { L.push('ERR ' + e.message); } return L; });
  console.log(out.join('\n')); await p.screenshot({ path: process.env.OUT + '/wizard.png' }); console.log('errs', errs); await b.close();
})();
