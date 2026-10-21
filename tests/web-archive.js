const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const mk = async (n) => { const c = await b.newContext({viewport:{width:1100,height:900}}); await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage(); p.on('pageerror', e => errs.push(n+': '+e.message)); return p; };
  const w = ms => new Promise(r => setTimeout(r, ms)); const log=(...a)=>console.log(...a);
  const sees = (p, t) => p.evaluate(t=>!!window.__carreau.S.tournaments[t], t);
  const A = await mk('A'); await A.goto(process.env.WEB_URL+''); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(()=>location.hash.slice(1));
  await A.fill('#bulk', 'One\nTwo\nThree\nFour'); await A.click('#bulk-form button[type=submit]'); await w(1000);
  await A.click('[data-act="checkin-all"]'); await w(800);
  await A.click('[data-tab="draw"]'); await w(300); await A.click('[data-act="first-draw"]'); await w(1500);
  const B = await mk('B'); await B.goto(process.env.WEB_URL+'#'+tid); await w(3500);
  log('B sees before archive:', await sees(B, tid), 'matches', await B.evaluate(()=>window.__carreau.MS().length));
  // second comp without archived field (legacy)
  await A.click('[data-act="new-t"]'); await w(2500);
  const legacy = await A.evaluate(()=>location.hash.slice(1));
  await A.evaluate(async()=>{ const S=window.__carreau.S; const t=JSON.parse(JSON.stringify(S.tournaments[S.tid])); delete t.archived; t.name='Legacy'; await S.store.setTournament(t); });
  await w(1500);
  // A archives first comp
  await A.evaluate(t=>{ location.hash=t; }, tid); await w(2000);
  await A.click('[data-tab="setup"]'); await w(800); await A.click('[data-act="archive"]'); await w(300); await A.click('[data-act="archive-yes"]'); await w(2500);
  log('A toast:', await A.textContent('#toast'), '| A sees archived:', await sees(A, tid));
  await B.reload(); await w(3500);
  log('B sees archived comp:', await sees(B, tid), '| B can read its matches:', await B.evaluate(async()=>{ return window.__carreau.MS().length; }));
  log('B sees legacy (before backfill):', await sees(B, legacy));
  const AD = await mk('admin'); await AD.goto(process.env.WEB_URL+'#admin'); await w(3000);
  await AD.evaluate(()=>window.__testGoogle('samuelcblakey@gmail.com')); await w(4000);
  const adm = (await AD.textContent('main')).replace(/\s+/g,' ');
  log('admin list shows archived:', adm.includes('Archived'), '| sees comp:', await sees(AD, tid));
  await AD.evaluate(t=>{ location.hash=t; }, tid); await w(2500);
  log('admin banner:', (await AD.textContent('main')).replace(/\s+/g,' ').slice(0,70), 'matches', await AD.evaluate(()=>window.__carreau.MS().length));
  await AD.click('main [data-act="restore"]'); await w(2500);
  await B.reload(); await w(3500);
  log('B sees after restore:', await sees(B, tid), '| B sees legacy after admin backfill:', await sees(B, legacy));
  log('errs', errs); await b.close();
})();
