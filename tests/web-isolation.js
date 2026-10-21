const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const mk = async (n) => { const c = await b.newContext({viewport:{width:1100,height:900}}); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n+': '+e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log=(...a)=>console.log(...a);
  const names = p => p.evaluate(()=>Object.values(window.__carreau.S.tournaments).map(t=>t.name).sort().join(', '));
  const A = await mk('A'); await A.goto(process.env.WEB_URL+''); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500); const ta = await A.evaluate(()=>location.hash.slice(1));
  await A.evaluate(async()=>{const S=window.__carreau.S; const t=JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name='A comp'; await S.store.setTournament(t);});
  await A.click('[data-act="new-t"]'); await w(2500); const ex = await A.evaluate(()=>location.hash.slice(1));
  await A.evaluate(async()=>{const S=window.__carreau.S; const t=JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name='Example comp'; await S.store.setTournament(t);});
  const B = await mk('B'); await B.goto(process.env.WEB_URL+''); await w(3500);
  await B.click('[data-act="new-t"]'); await w(2500);
  await B.evaluate(async()=>{const S=window.__carreau.S; const t=JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name='B comp'; await S.store.setTournament(t);}); await w(1000);
  log('A list:', await names(A)); log('B list (should be B comp only):', await names(B));
  const AD = await mk('admin'); await AD.goto(process.env.WEB_URL+'#admin'); await w(3000);
  await AD.evaluate(()=>window.__testGoogle('samuelcblakey@gmail.com')); await w(4000);
  log('admin list:', await names(AD));
  await AD.evaluate(id=>document.querySelector(`[data-act="admin-example"][data-id="${id}"]`).click(), ex); await w(2000);
  await B.reload(); await w(4000);
  log('B list after example:', await names(B));

  await B.evaluate(id=>{location.hash=id;}, ex); await w(2500);
  log('example tabs:', await B.evaluate(()=>[...document.querySelectorAll('#tabs button')].map(x=>x.dataset.tab).join(',')));
  await B.click('[data-tab="setup"]'); await w(400);
  log('example setup locked:', await B.evaluate(()=>!!document.querySelector('fieldset.ro-view[disabled] #f-name') && document.querySelector('main').innerText.includes('Example competition.') && !document.querySelector('main').innerText.includes('Sharing')));
  await B.click('[data-tab="entries"]'); await w(400); log('example entries locked:', await B.evaluate(()=>!!document.querySelector('fieldset.ro-view[disabled]')));
  await B.click('[data-tab="draw"]'); await w(300);
  // B tries to edit example via direct link
  await B.evaluate(id=>{location.hash=id;}, ex); await w(2500);
  const r = await B.evaluate(async()=>{ const S=window.__carreau.S; const t=JSON.parse(JSON.stringify(S.tournaments[S.tid])); t.name='hacked'; try { await S.store.setTournament(t); return 'saved'; } catch(e){ return 'denied '+e.code; } });
  log('B edit example:', r, '| canEdit UI:', await B.evaluate(()=>window.__carreau.S.permFn ? window.__carreau.S.permFn(window.__carreau.T()) : 'nofn'));
  // B opens A's private comp by direct link (open testing: allowed to view+edit)
  await B.evaluate(id=>{location.hash=id;}, ta); await w(2500);
  log('B direct link to A comp opens:', await B.evaluate(id=>!!window.__carreau.S.tournaments[id], ta));
  // admin delete
  await AD.evaluate(()=>{location.hash='admin';}); await w(1500);
  await AD.evaluate(id=>document.querySelector(`[data-act="admin-del"][data-id="${id}"]`).click(), ta); await w(300);
  await AD.evaluate(id=>document.querySelector(`[data-act="admin-del-yes"][data-id="${id}"]`).click(), ta); await w(2000);
  log('admin after delete:', await names(AD), '| toast', await AD.textContent('#toast'));
  log('errs', errs); await b.close();
})();
