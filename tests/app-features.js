const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1200,height:900}});
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const out = await p.evaluate(async () => {
    const C=window.__carreau, S=C.S, w=ms=>new Promise(r=>setTimeout(r,ms)); const log=[]; try {
    const mk = async (cfg, n, indiv) => { document.querySelector('[data-act="new-t"]').click(); await w(60); const t = JSON.parse(JSON.stringify(C.T())); Object.assign(t, cfg, {checkin:false});
      for (let i=0;i<n;i++) { if (indiv) t.players.push({id:'p'+i,name:'Shooter '+i,active:true}); else t.teams.push({id:'e'+i,name:'Team '+i,players:['a'],active:true}); }
      await S.store.setTournament(t); S.tournaments[t.id]=t; await w(30); document.querySelector('[data-tab="draw"]').click(); await w(40); };
    const modalSave = async (id, sa, sb) => { C.S.modal=null; document.querySelector(`[data-match="${id}"]`).click(); await w(30); document.querySelector('#sc-sa').value=sa; document.querySelector('#sc-sb').value=sb; document.querySelector('[data-act="save-final"]').click(); await w(80); return document.querySelector('#modal').innerText.replace(/\s+/g,' '); };
    const play = async (f) => { let g=0; while(g++<50){ const live=C.MS().filter(m=>!m.done&&m.a&&m.b&&(!f||f(m))); if(!live.length) break; await C.recordResult(live[0].id,13,4,true);} };
    // 1. KO override
    await mk({system:'knockout', name:'KO override'}, 8);
    document.querySelector('[data-act="first-draw"]').click(); await w(100);
    await play(m=>m.round<=2);
    const qf = C.MS().find(m=>m.round===1 && m.order===0); const sf = C.MS().find(m=>m.id===qf.next.id);
    log.push('before: QF '+qf.a+' v '+qf.b+' '+qf.sa+'-'+qf.sb+' | SF '+sf.a+' v '+sf.b+' '+sf.sa+'-'+sf.sb+' done '+sf.done);
    document.querySelector('[data-tab="draw"]').click(); await w(40);
    const txt = await modalSave(qf.id, 6, 13);
    log.push('modal: '+txt.slice(0,260));
    document.querySelector('[data-act="override"]').click(); await w(200);
    const sf2 = C.MS().find(m=>m.id===sf.id); const fin = C.MS().find(m=>m.id===sf.next.id);
    log.push('after: QF winner '+JSON.stringify(C.MS().find(m=>m.id===qf.id).b)+' | SF '+sf2.a+' v '+sf2.b+' done '+sf2.done+' | final side '+JSON.stringify([fin.a,fin.b])+' toast '+document.querySelector('#toast').textContent);
    log.push('override moved winner through: '+(JSON.stringify(sf2.a)===JSON.stringify(qf.b)||JSON.stringify(sf2.b)===JSON.stringify(qf.b))+' later game reset: '+(!sf2.done)+' final side cleared: '+(!fin.a||!fin.b));
    await play(); log.push('overrideAllowed QF after final: '+C.overrideAllowed(C.MS().find(m=>m.id===qf.id)));
    // 2. French pools override
    await mk({system:'pools', poolStyle:'french', name:'Pool override'}, 8);
    document.querySelector('[data-act="first-draw"]').click(); await w(100);
    await play(m=>m.pool==='PA'&&m.round===1); await play(m=>m.pool==='PA'&&m.round===2);
    const g2wb = JSON.stringify(C.MS().find(m=>m.id==='PA-g2w').a);
    document.querySelector('[data-tab="draw"]').click(); await w(40);
    const t2 = await modalSave('PA-g1a', 2, 13); log.push('pool modal blocked: '+t2.includes('Override and reset'));
    document.querySelector('[data-act="override"]').click(); await w(200);
    const g2w = C.MS().find(m=>m.id==='PA-g2w'); log.push('pool g2w a before '+g2wb+' after '+JSON.stringify(g2w.a)+' done '+g2w.done);
    // 3. Swiss previous-round edit
    await mk({system:'swiss', name:'Swiss edit'}, 8);
    document.querySelector('[data-act="first-draw"]').click(); await w(400); await play(); await w(200);
    document.querySelector('[data-act="next-round"]').click(); await w(100);
    document.querySelector('[data-tab="draw"]').click(); await w(40);
    await modalSave('R1-m1', 9, 13); log.push('swiss R1 edit: corrected='+!!C.MS().find(m=>m.id==='R1-m1').corrected+' modal closed='+!document.querySelector('#modal .modal'));
    // 4. Shooting KO 8 with 10 shooters
    await mk({entry:'shooting', system:'knockout', shootFormat:'ko8', name:'Shoot KO', koThird:true}, 10, true);
    document.querySelector('[data-act="first-draw"]').click(); await w(100);
    log.push('quals: '+C.MS().filter(m=>m.stage==='shoot').length);
    const fill = (pre, base, k) => { const side = pre === 'sa' ? 'a' : 'b'; const n = document.querySelectorAll(`[data-act="shot-cell"][data-side="${side}"]`).length;
      for (let i = 0; i < n; i++) { document.querySelectorAll(`[data-act="shot-cell"][data-side="${side}"]`)[i].click(); document.querySelector(`[data-act="cell-pick"][data-v="${k != null ? (i < k ? 5 : 0) : [0, 1, 3, 5][(i + base) % 4]}"]`).click(); } };
    for (const m of C.MS().filter(m=>m.stage==='shoot')) {
      document.querySelector('[data-tab="draw"]').click(); await w(30);
      document.querySelector(`[data-shoot="${m.id}"]`).click(); await w(40); document.querySelector('[data-act=\"shoot-mode\"]')?.click(); await w(60);
      fill('sa', 0, m.order + 1); document.querySelector('[data-act="shoot-save"][data-final="1"]').click(); await w(60);
    }
    log.push('qual ranking: '+C.shootRanking(C.T(),'Q').map(r=>r.total).join(','));
    document.querySelector('[data-tab="draw"]').click(); await w(40);
    document.querySelector('[data-act="shoot-next"]').click(); await w(150);
    log.push('KO entrants '+C.T().brackets[0].entrants+' duels '+C.MS().filter(m=>m.shoot).length);
    let g=0; while(g++<20){ const live=C.MS().filter(m=>m.shoot&&!m.done&&m.a&&m.b); if(!live.length) break; const m=live[0];
      document.querySelector('[data-tab="draw"]').click(); await w(30); document.querySelector(`[data-match="${m.id}"]`).click(); await w(40); document.querySelector('[data-act=\"shoot-mode\"]')?.click(); await w(60);
      fill('sa', 1); fill('sb', g===1 ? 1 : 2); document.querySelector('[data-act="shoot-save"][data-final="1"]').click(); await w(80);
      if (document.querySelector('#modal .so')) { log.push('tie prompt shown'); document.querySelector('[data-act="so-cell"][data-key="a"][data-i="0"]').click(); await w(10);
        for (let i = 0; i < 10; i++) { document.querySelector(`[data-act="so-pick"][data-v="${i % 2 ? 3 : 0}"]`).click(); await w(5); }
        document.querySelector('[data-act="shoot-save"][data-final="1"]').click(); await w(80); }
    }
    const fin2 = C.MS().find(m=>m.shoot&&m.round===C.T().brackets[0].rounds&&!m.third);
    log.push('shoot final done '+fin2.done+' winner '+JSON.stringify(fin2.win? fin2[fin2.win] : (fin2.sa>fin2.sb?fin2.a:fin2.b)));
    document.querySelector('[data-tab="standings"]').click(); await w(50); log.push('standings: '+document.querySelector('main').innerText.replace(/\s+/g,' ').slice(0,140));
    // 5. Shooting final format
    await mk({entry:'shooting', system:'knockout', shootFormat:'final', shootFinal:4, name:'Shoot final'}, 6, true);
    document.querySelector('[data-act="first-draw"]').click(); await w(100);
    for (const m of C.MS().filter(m=>m.stage==='shoot')) { document.querySelector(`[data-shoot="${m.id}"]`).click(); await w(30); document.querySelector('[data-act=\"shoot-mode\"]')?.click(); await w(60); fill('sa', 0, m.order + 1); document.querySelector('[data-act="shoot-save"][data-final="1"]').click(); await w(50); }
    document.querySelector('[data-act="shoot-next"]').click(); await w(120);
    for (const m of C.MS().filter(m=>m.phase==='F')) { document.querySelector(`[data-shoot="${m.id}"]`).click(); await w(30); document.querySelector('[data-act=\"shoot-mode\"]')?.click(); await w(60); fill('sa', 0, m.order + 2); document.querySelector('[data-act="shoot-save"][data-final="1"]').click(); await w(50); }
    document.querySelector('[data-tab="standings"]').click(); await w(50); log.push('final standings: '+document.querySelector('main').innerText.replace(/\s+/g,' ').slice(0,160));
    // 6. Archive (local: owner/admin sees)
    document.querySelector('[data-tab="setup"]').click(); await w(40);
    document.querySelector('[data-act="archive"]').click(); await w(40); document.querySelector('[data-act="archive-yes"]').click(); await w(100);
    log.push('archived visible locally: '+!!C.S.tournaments[C.S.tid]+' banner: '+document.querySelector('main').innerText.slice(0,60).replace(/\s+/g,' '));
    document.querySelector('main [data-act="restore"]').click(); await w(80); log.push('restored: '+(C.T().archived===false));
    } catch(e) { log.push('ERR '+e.message+' | modal: '+document.querySelector('#modal').innerText.slice(0,200)+' | main: '+document.querySelector('main').innerText.slice(0,200)); }
    return log;
  });
  console.log(out.join('\n')); console.log('errs', errs);
  await p.evaluate(async()=>{ const C=window.__carreau; const t=Object.values(C.S.tournaments).find(x=>x.name==='Shoot KO'); C.S.tid=t.id; C.S.matches={}; C.watchMatches(); await new Promise(r=>setTimeout(r,100)); document.querySelector('[data-tab="draw"]').click(); });
  await p.waitForTimeout(200); await p.screenshot({path:process.env.OUT+'/shoot1.png', fullPage:true});
  await p.evaluate(async()=>{ const m=window.__carreau.MS().find(m=>m.shoot&&m.done); document.querySelector(`[data-match="${m.id}"]`).click(); });
  await p.waitForTimeout(200); await p.screenshot({path:process.env.OUT+'/shoot2.png'});
  await b.close();
})();
