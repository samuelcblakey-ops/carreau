// Payments on online entries (payments-online-entries), on one device: the organiser's "Online entries" panel gets the same
// Paid button as Registration (one tap, Undo) and a paid count, the CSV a Paid column, the player's own entry shows
// "Payment received", a paid entry that withdraws is listed under "Withdrew after paying" with Clear, and Registration and
// the entry stay in step both ways.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const pre = `const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    const txt = el => el ? el.textContent.replace(/\\s+/g, ' ').trim() : 'none';
    const go = async h => { document.activeElement?.blur?.(); location.hash = h; await w(250); };
    const tid = window.__tid, card = () => q('#cal-' + window.__tid + '.cal-card'), btn = eid => card()?.querySelector('[data-act="cal-pay"][data-eid="' + eid + '"]');
    const sum = () => txt(card()?.querySelector('.cal-desk-sum')), store = eid => S.store.getCalPayment(window.__tid, eid);`;
  const run = body => p.evaluate(new Function(`return (async () => { ${pre} const L = []; try { ${body} } catch (e) { L.push('ERR ' + e.message + ' ' + e.stack.split('\\n')[1]); } return L; })();`));
  const out = [];
  out.push(...await run(`
    const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    q('[data-act="new-t"]').click(); await w(150); q('[data-act="wiz-skip"]')?.click(); await w(100);
    const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, { name: 'Arlesey Pairs', venue: 'Arlesey PC', date: day(5), wizard: false, system: 'swiss', format: 'doubles', checkin: false });
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(100); const tid = t.id; window.__tid = tid;
    await S.store.setCal(tid, { kind: 'comp', tid, name: 'Arlesey Pairs', date: day(5), checkin: '', start: '10:00', venue: 'Arlesey PC', address: '', country: 'GB-ENG', region: '', level: 'open', fmt: 'doubles', system: 'swiss',
      who: ['open'], fee: '£10 a pair', prizes: '', howTo: '', contact: '', note: '', status: 'on', lang: 'en', byUid: '', byCode: '', createdAt: 1, updatedAt: 1, hidden: false, gone: false,
      online: true, places: 8, closesAt: Date.now() + 2 * 864e5, approve: false, showEntrants: false });
    const add = async (eid, players, name) => { await S.store.addCalEntry(tid, eid, { uid: eid.split('_')[0], status: 'in' }, { name, players, club: '' }, '07700 900' + eid.length); await w(5); };
    await add('local_1', ['Ann Lee', 'Bob Fox'], 'Pair A'); await add('u2_1', ['Cat Ray', 'Dan Oak'], 'Pair B'); await add('u3_1', ['Eve Ash', 'Fay Elm'], 'Pair C');
    window.__csv = null; S.downloads = { save: async f => { window.__csv = f; } };
    await go('calendar.' + tid); for (let i = 0; i < 40 && !btn('u2_1'); i++) await w(100);
    L.push('desk start: ' + sum() + ' | buttons ' + qa('#cal-' + tid + ' [data-act="cal-pay"]').map(txt).join(','));
    btn('u2_1').click(); await w(200);
    const one = txt(btn('u2_1')), s1 = sum(), toast1 = txt(q('#toast span'));
    q('[data-act="toast-undo"]').click(); await w(250);
    const undone = txt(btn('u2_1')) === 'Not paid' && !(await store('u2_1'));
    L.push('desk paid: one tap ' + one + ' | summary ' + (s1.match(/\\d+ of \\d+ paid/) || [''])[0] + ' | undo ' + undone + ' | toast ' + toast1);
    btn('u2_1').click(); await w(200);
    const saved = await store('u2_1'); L.push('saved: team ' + saved?.team + ' | at ' + (typeof saved?.at === 'number') + ' | keys ' + Object.keys(saved || {}).sort().join(','));
    q('#cal-' + tid + ' [data-act="cal-desk-csv"]').click(); await w(200);
    const lines = (window.__csv?.data || '').replace(/^\\uFEFF/, '').split('\\n'), cells = l => l.split('","').map(x => x.replace(/^"|"$/g, ''));
    const row = lines.slice(1).find(l => l.includes('Pair B')), rowC = lines.slice(1).find(l => l.includes('Pair C'));
    L.push('csv: header ' + cells(lines[0]).join(',') + ' | row ' + cells(row).pop() + ' | unpaid row ' + JSON.stringify(cells(rowC).pop()));
    // this device's own entry (Pair A): nothing about payment until it's paid
    const mine = () => card().querySelector('.cal-mine-ent .cal-ent-row[data-eid="local_1"]');
    const unpaidNothing = !!mine() && !mine().querySelector('.cal-ent-paid') && !/pa(id|yment)/i.test(txt(mine()));
    btn('local_1').click(); await w(200);
    L.push('entrant: Payment received ' + (txt(mine()?.querySelector('.cal-ent-paid')) === 'Payment received') + ' | unpaid shows nothing ' + unpaidNothing);
    // a player who isn't one of the organisers reads only their own entry's payment
    await go('calendar'); S.canWrite = false; await go('calendar.' + tid); for (let i = 0; i < 30 && !mine()?.querySelector('.cal-ent-paid'); i++) await w(100);
    L.push('entrant view: Payment received ' + !!mine()?.querySelector('.cal-ent-paid') + ' | desk shown ' + !!card().querySelector('.cal-desk'));
    window.__entrantShot = true;
  `));
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('.cal-mine-ent')?.scrollIntoView()); await p.screenshot({ path: process.env.OUT + '/payments-online-entrant-390.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(150);
  out.push(...await run(`
    await go('calendar'); S.canWrite = true; await go('calendar.' + tid); for (let i = 0; i < 40 && !btn('u2_1'); i++) await w(100);
    // Pair B withdraws after paying
    await S.store.withdrawCalEntry(tid, 'u2_1'); await w(300);
    const gone = () => card().querySelector('.cal-pay-gone');
    L.push('withdrew after paying: ' + qa('#cal-' + tid + ' .cal-pay-gone-row b').map(txt).join(',') + ' | heading ' + txt(gone()?.querySelector('h4')) + ' | summary ' + (sum().match(/\\d+ of \\d+ paid/) || [''])[0]);
  `));
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
  out.push('desk 390: no sideways scroll ' + await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1) + ' | pay buttons under 44 ' + await p.evaluate(() => [...document.querySelectorAll('.cal-desk .btn.pay, .cal-pay-gone .btn')].filter(x => x.getBoundingClientRect().height < 44).length));
  await p.evaluate(() => document.querySelector('.cal-desk')?.scrollIntoView()); await p.screenshot({ path: process.env.OUT + '/payments-online-desk-390.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(150);
  out.push(...await run(`
    q('#cal-' + tid + ' [data-act="cal-pay-clear"][data-eid="u2_1"]').click(); await w(300);
    L.push('withdrew after paying: clear removes ' + (!card().querySelector('.cal-pay-gone') && !(await store('u2_1'))));
    // Registration: Pair C paid online arrives paid; Pair A too
    btn('u3_1').click(); await w(200);
    await go(tid); await w(200); q('[data-tab="entries"]').click(); await w(400);
    q('.cal-reg-row[data-eid="u3_1"] [data-act="cal-reg-add"]').click(); await w(500);
    const team = eid => C.T().teams.find(x => x.calEntry === eid), regBtn = eid => q('[data-act="pay"][data-id="' + team(eid)?.id + '"]');
    L.push('add to registration carries paid: ' + txt(regBtn('u3_1')));
    q('.cal-reg-row[data-eid="local_1"] [data-act="cal-reg-add"]').click(); await w(500);
    regBtn('local_1').click(); await w(300); const offEntry = await store('local_1');
    regBtn('local_1').click(); await w(300); const onEntry = await store('local_1');
    L.push('registration untap clears entry: ' + (offEntry === null) + ' | tap sets it again ' + (onEntry?.team === 'Pair A'));
    // back on the listing as the player: their entry says so
    await go('calendar'); S.canWrite = false; await go('calendar.' + tid); for (let i = 0; i < 30 && !card()?.querySelector('.cal-mine-ent .cal-ent-paid'); i++) await w(100);
    L.push('registration tap updates entry: entrant sees Payment received ' + !!card()?.querySelector('.cal-mine-ent .cal-ent-row[data-eid="local_1"] .cal-ent-paid'));
    await go('calendar'); S.canWrite = true; await go('calendar.' + tid); for (let i = 0; i < 40 && !btn('u3_1'); i++) await w(100);
    // and the other way: Not paid on the panel clears Registration's tick
    btn('u3_1').click(); await w(400);
    await go(tid); await w(200); q('[data-tab="entries"]').click(); await w(400);
    L.push('desk tap updates registration: ' + txt(regBtn('u3_1')));
    // removing the listing's entries takes the payments too
    await S.store.deleteCalEntries(tid); await w(200);
    L.push('remove listing deletes payments: ' + !(await store('local_1')) + ' | stored ' + JSON.stringify(JSON.parse(localStorage.getItem('carreau-local-v1')).cp?.[tid] || null));
  `));
  console.log(out.join('\n')); console.log('errs', errs); await b.close();
})();
