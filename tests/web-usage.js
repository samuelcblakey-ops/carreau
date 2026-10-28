// Admin usage panel: today's reads/writes/deletes against the free limits, the last 7 days, devices connected, biggest
// competitions (count queries on the emulator), and the error states. Google's monitoring service is stubbed here.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; const w = ms => new Promise(r => setTimeout(r, ms));
  const c = await b.newContext({ viewport: { width: 1100, height: 900 } }); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message));
  // the stub answers like Cloud Monitoring: sums depend on the metric, 60s points for today, hourly points for the week
  let mode = 'ok', reads = 12345, auth = '';
  const pty = () => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', day: 'numeric' }).format(new Date()); // day of the month, Pacific time
  await p.route('https://monitoring.googleapis.com/**', async route => {
    const u = new URL(route.request().url()); auth = route.request().headers().authorization || '';
    if (mode === 'off') return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { code: 403, status: 'PERMISSION_DENIED', message: 'Cloud Monitoring API has not been used in project 1 before or it is disabled.', details: [{ reason: 'SERVICE_DISABLED' }] } }) });
    if (mode === 'billing') return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { code: 403, status: 'PERMISSION_DENIED', message: 'This API method requires billing to be enabled. Please enable billing on project #1 by visiting https://console.developers.google.com/billing/enable?project=1 then retry.', details: [{ reason: 'BILLING_DISABLED' }] } }) });
    if (mode === 'expired') return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 401, status: 'UNAUTHENTICATED', message: 'Request had invalid authentication credentials.' } }) });
    if (u.pathname.endsWith('/metricDescriptors')) return route.fulfill({ contentType: 'application/json', body: '{}' });
    const f = u.searchParams.get('filter'), per = u.searchParams.get('aggregation.alignmentPeriod'), end = Date.parse(u.searchParams.get('interval.endTime')), start = Date.parse(u.searchParams.get('interval.startTime'));
    if (/_count"/.test(f) && !/_ops_count/.test(f)) return route.fulfill({ contentType: 'application/json', body: '{}' }); // the older names: unused when the new ones answer
    const total = /read/.test(f) ? reads : /write/.test(f) ? 4321 : /delete/.test(f) ? 210 : 7;
    let pts;
    if (/active_connections/.test(f)) pts = [{ interval: { endTime: new Date(end).toISOString() }, value: { doubleValue: 7 } }];
    else if (per === '60s') pts = [0, 1, 2].map(i => ({ interval: { endTime: new Date(end - i * 60e3).toISOString() }, value: { int64Value: String(i === 0 ? total - 2 * Math.floor(total / 3) : Math.floor(total / 3)) } }));
    else { pts = []; for (let t = start + 3600e3; t <= end; t += 3600e3) pts.push({ interval: { endTime: new Date(t).toISOString() }, value: { int64Value: String(Math.round(total / 24)) } }); }
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ timeSeries: [{ points: pts }] }) });
  });
  await p.goto(process.env.WEB_URL + '#admin'); await w(3000);
  await p.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3000);
  // a competition with games in it, for the count
  await p.goto(process.env.WEB_URL); await w(2500); await p.click('[data-act="new-t"]'); await w(2500);
  await p.evaluate(() => document.querySelector('[data-act="wiz-skip"]')?.click()); await w(500);
  await p.click('[data-tab="entries"]'); await w(300);
  await p.fill('#bulk', 'Club Pins\nCarreau Vents\nGravier Collines\nMistral Lions'); await p.click('#bulk-form button[type=submit]'); await w(1200);
  await p.click('[data-act="checkin-all"]'); await w(800); await p.click('[data-tab="draw"]'); await w(300); await p.click('[data-act="first-draw"]'); await w(2500);
  await p.goto(process.env.WEB_URL + '#admin'); await w(3000);
  const panel = () => p.evaluate(() => (document.querySelector('#adm-usage')?.innerText || 'no panel').replace(/\s+/g, ' '));
  console.log('before: ' + /Show live usage/.test(await panel()) + ' | fixed costs ' + await p.evaluate(() => /GitHub Pages[\s\S]*GitHub Actions[\s\S]*snpetanque\.com/.test(document.querySelector('#adm-usage .use-fixed')?.textContent || '')) + ' | blaze ' + await p.evaluate(() => /Blaze plan[\s\S]*budget alert/.test(document.querySelector('#adm-usage .use-fixed')?.textContent || '')));
  // the game count works before Google's figures are switched on (it uses the site's own database)
  await p.click('[data-act="adm-usage-count"]'); await w(3000);
  const t0 = await panel();
  console.log('count: ' + /Biggest competitions/.test(t0) + ' | ' + ((t0.match(/\d+ competitions?, [\d,]+ games? in all/) || ['?'])[0]) + ' | rough size ' + /Stored data roughly \d+ KB of the free 1 GB/.test(t0) + ' | still not live ' + /Show live usage/.test(t0));
  // a competition with games, for the count
  await p.evaluate(() => { window.__testUsageToken = 'test-token'; });
  await p.click('[data-act="adm-usage-connect"]'); await w(2500);
  const t1 = await panel();
  console.log('connected: auth ' + (auth === 'Bearer test-token') + ' | live ' + /Usage and limits Live/i.test(t1));
  console.log('today: ' + (t1.match(/Reads 12,345 of 50,000 25% · Fine/) || ['?'])[0] + ' | ' + (t1.match(/Writes 4,321 of 20,000 22% · Fine/) || ['?'])[0] + ' | ' + (t1.match(/Deletes 210 of 20,000 1% · Fine/) || ['?'])[0]);
  console.log('devices: ' + /7 devices connected now/.test(t1) + ' | resets: ' + /free allowance resets at \d\d:\d\d your time/.test(t1) + ' | estimate ' + /Stored data \d+ KB of 1.00 GB · rough estimate/.test(t1) + ' | games kept ' + /Biggest competitions Competition Games/i.test(t1));
  console.log('cost under the allowance: ' + ((t1.match(/Estimated charge.*?Today \$[\d.]+ · this month \$[\d.]+/) || ['?'])[0]).replace(/Estimated charge.*?Today/, 'Today'));
  console.log('week rows: ' + await p.evaluate(() => [...document.querySelectorAll('#adm-usage table.use-week tbody tr')].map(r => r.cells[0].textContent).join(',')));
  reads = 45000; await p.click('[data-act="adm-usage-refresh"]'); await w(2000);
  console.log('near the limit: ' + ((await panel()).match(/Reads 45,000 of 50,000 90% · Near the free allowance/) || ['?'])[0] + ' | red ' + await p.evaluate(() => !!document.querySelector('#adm-usage .use-bar i.use-danger')));
  // above the allowance: 150,000 reads a day is 100,000 over, $0.03 at list price, every day of the month so far
  reads = 150000; await p.click('[data-act="adm-usage-refresh"]'); await w(2000);
  const t2 = await panel(), m = t2.match(/Today \$([\d.]+) · this month \$([\d.]+)/) || [];
  const want = (0.03 * +pty()).toFixed(2), month = +m[2];
  console.log('over the allowance: ' + /Reads 150,000 of 50,000 300% · Above the free allowance, so the extra is charged/.test(t2));
  console.log('cost over: today $' + m[1] + ' | month matches days so far ' + (Math.abs(month - want) <= 0.031) + ' | day column ' + await p.evaluate(() => [...document.querySelectorAll('#adm-usage table.use-week tbody tr')].slice(0, 7).map(r => r.cells[4]?.textContent).join(',')));
  mode = 'billing'; await p.click('[data-act="adm-usage-refresh"]'); await w(1500);
  const t3 = await panel();
  console.log('billing: ' + /Billing needs to be on/.test(t3) + ' | blaze ' + /Blaze \(pay as you go\) plan/.test(t3) + ' | link ' + await p.evaluate(() => /console\.firebase\.google\.com\/project\/[\w-]+\/usage\/details/.test(document.querySelector('#adm-usage .notice a.btn')?.href || '')) + ' | google said ' + /Google said: This API method requires billing/.test(t3));
  mode = 'off'; await p.click('[data-act="adm-usage-refresh"]'); await w(1500);
  console.log('api off: ' + /One switch to turn on first/.test(await panel()) + ' | link ' + await p.evaluate(() => /apis\/library\/monitoring\.googleapis\.com\?project=/.test(document.querySelector('#adm-usage a.btn')?.href || '')));
  mode = 'expired'; await p.click('[data-act="adm-usage-refresh"]'); await w(1500);
  console.log('expired: ' + /access ran out/.test(await panel()) + ' | connect again ' + await p.evaluate(() => !!document.querySelector('[data-act="adm-usage-connect"]')));
  if (process.env.SHOT) { mode = 'ok'; reads = 12345; await p.evaluate(() => { window.__testUsageToken = 'test-token'; }); await p.click('[data-act="adm-usage-connect"]').catch(() => {}); await w(2500); await p.click('[data-act="adm-usage-count"]').catch(() => {}); await w(2500);
    await (await p.$('#adm-usage')).screenshot({ path: process.env.SHOT }); }
  console.log('errs', JSON.stringify(errs)); await b.close();
})();
