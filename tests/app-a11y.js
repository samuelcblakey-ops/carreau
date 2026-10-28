// Keyboards and screen readers: a skip link, one main heading and a tab title per page, score dialogs that take the
// focus, keep it inside and hand it back, toasts that are read out (and stay while you're on them), plain button
// menus, named tables and meters, and nothing focused hidden under the phone's tab bar.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(process.env.APP_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  const ev = (fn, a) => p.evaluate(fn, a), w = ms => p.waitForTimeout(ms), key = k => p.keyboard.press(k);
  const focused = () => ev(() => { const a = document.activeElement; if (!a || a === document.body) return 'body';
    if (a.id) return '#' + a.id; const d = a.dataset; return a.tagName.toLowerCase() + (a.className && typeof a.className === 'string' ? '.' + a.className.trim().split(/\s+/)[0] : '') + (d.act ? `[${d.act}${d.k ? ':' + d.k : ''}${d.mode ? ':' + d.mode : ''}]` : '') + (d.match ? '[match]' : ''); });
  // 1. the start screen: the first Tab shows the skip link, which jumps to the content without touching the address
  await key('Tab');
  console.log('skip link: ' + await focused() + ' | shown ' + await ev(() => { const r = document.querySelector('.skip').getBoundingClientRect(); return r.top >= 0 && r.height > 20; }) + ' | ' + await ev(() => document.querySelector('.skip').textContent));
  const url0 = p.url(); await key('Enter'); await w(50);
  console.log('skip goes to: ' + await focused() + ' | address kept ' + (p.url() === url0) + ' | next ' + (await key('Tab'), await focused()));
  console.log('start: h1 ' + await ev(() => document.querySelectorAll('h1').length) + ' | title ' + await p.title());
  // a competition with a round drawn
  await ev(async () => { const C = window.__carreau, S = C.S, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s);
    q('[data-act="new-t"]').click(); await w(150); const t = JSON.parse(JSON.stringify(C.T()));
    Object.assign(t, { name: 'Spring Swiss', system: 'swiss', format: 'doubles', checkin: true, wizard: false, swissRounds: 3, seeding: 'entry' });
    t.teams = Array.from({ length: 8 }, (_, i) => ({ id: 'e' + i, name: 'Team ' + 'ABCDEFGH'[i], players: ['a' + i, 'b' + i], active: true, checkedIn: i < 6 }));
    await S.store.setTournament(t); S.tournaments[t.id] = t; await w(60); q('[data-tab="entries"]').click(); await w(80); });
  // 2. one main heading and a tab title for each page
  const heads = () => ev(() => [...document.querySelectorAll('h1')].map(h => h.textContent + (h.classList.contains('sr-only') ? ' (hidden)' : '')).join(' / '));
  console.log('registration: h1 ' + await heads() + ' | title ' + await p.title());
  console.log('meter: ' + await ev(() => { const m = document.querySelector('.meter'); return m.getAttribute('role') + ' "' + m.getAttribute('aria-label') + '" ' + m.getAttribute('aria-valuenow'); }));
  // a redraw keeps the focus where it was: checking a team in, then moving between pages with the tabs
  await p.focus('[data-act="checkin"][data-id="e6"]'); await key('Enter'); await w(200);
  console.log('check in by keyboard: ' + await ev(() => { const a = document.activeElement; return (a?.dataset.act === 'checkin' && a.dataset.id === 'e6') + ' ' + a?.getAttribute('aria-pressed'); }));
  await key('Enter'); await w(200); await p.focus('[data-tab="standings"]'); await key('Enter'); await w(150);
  console.log('tab by keyboard: ' + await ev(() => document.activeElement?.dataset.tab + ' ' + document.activeElement?.getAttribute('aria-current')) + ' | title ' + await p.title());
  await p.click('[data-tab="entries"]'); await w(100);
  await ev(async () => { const C = window.__carreau, w = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s); const t = JSON.parse(JSON.stringify(C.T()));
    t.teams.forEach(x => x.checkedIn = true); await C.S.store.setTournament(t); C.S.tournaments[t.id] = t; await w(40);
    q('[data-tab="draw"]').click(); await w(60); q('[data-act="first-draw"]').click(); await w(400); });
  console.log('draw: h1 ' + await heads() + ' | title ' + await p.title());
  // 3. the score dialog from the keyboard: focus goes in, stays in, follows a redraw and comes back to the game
  const gid = await ev(() => document.querySelector('main [data-match]').dataset.match);
  await p.focus(`main [data-match="${gid}"]`); await key('Enter'); await w(100);
  const st = () => ev(() => ({ open: !!document.querySelector('#modal .modal'), inside: !!document.activeElement?.closest('#modal .modal'), inert: ['header.app', '#main', '#foot', '.skip'].map(s => document.querySelector(s).inert).join(',') }));
  console.log('dialog opens: ' + JSON.stringify(await st()) + ' | focus ' + await focused());
  let out = 0, seen = new Set(); for (let i = 0; i < 40; i++) { await key('Tab'); const s = await st(); if (!s.inside) out++; seen.add(await focused()); }
  console.log('tab stays inside: ' + (out === 0) + ' | stops ' + seen.size);
  await ev(() => document.querySelector('#modal [data-act="close"]').focus()); await key('Shift+Tab');
  console.log('shift-tab from the first goes to the last: ' + await ev(() => { const f = [...document.querySelectorAll('#modal .modal button, #modal .modal select, #modal .modal input')].filter(n => n.getClientRects().length); return document.activeElement === f[f.length - 1]; }));
  await p.focus('#modal [data-act="mode"][data-mode="full"]'); await key('Enter'); await w(80);
  console.log('both scores: ' + await focused());
  await p.focus('#modal [data-act="inc"][data-k="sa"]'); await key('Enter'); await w(60); await key('Enter'); await w(60);
  console.log('plus one twice: focus ' + await focused() + ' | score ' + await ev(() => document.querySelector('#sc-sa').value));
  await key('Escape'); await w(80);
  console.log('escape: ' + JSON.stringify(await st()) + ' | back on the game ' + await ev(id => document.activeElement?.dataset.match === id, gid));
  // tapped (no focus on the game first): closing still lands on the game
  await ev(() => document.activeElement.blur()); await p.click(`main [data-match="${gid}"]`); await w(80);
  console.log('tapped open: ' + JSON.stringify(await st()));
  await p.click('#modal [data-act="close"]'); await w(80);
  console.log('closed: back on the game ' + await ev(id => document.activeElement?.dataset.match === id, gid) + ' | inert ' + (await st()).inert);
  // 4. toasts are read out, and stay while the pointer or focus is on them
  await ev(() => window.__carreau.toast('Copied.')); await w(150);
  console.log('read out: "' + await ev(() => document.querySelector('#sr-live').textContent) + '" | ' + await ev(() => document.querySelector('#sr-live').getAttribute('role')) + ' | toast is not a second live region ' + await ev(() => !document.querySelector('#toast').hasAttribute('aria-live')));
  await p.hover('#toast'); await w(4000); console.log('hovered: still shown ' + await ev(() => !document.querySelector('#toast').hidden));
  await p.mouse.move(5, 5); await w(1800); console.log('pointer away: gone ' + await ev(() => document.querySelector('#toast').hidden));
  await ev(() => window.__carreau.toast('Result saved.', async () => {})); await p.focus('.toast-undo'); await w(6800);
  console.log('undo focused: still shown ' + await ev(() => !document.querySelector('#toast').hidden));
  await ev(() => document.activeElement.blur()); await w(1800); console.log('focus away: gone ' + await ev(() => document.querySelector('#toast').hidden));
  // 5. header menus are plain lists of buttons
  console.log('no listboxes: ' + await ev(() => document.querySelectorAll('[role="listbox"], [role="option"], [aria-haspopup="listbox"]').length === 0));
  await p.focus('.lang-btn'); await key('Enter'); await w(60);
  console.log('language menu: expanded ' + await ev(() => document.querySelector('.lang-btn').getAttribute('aria-expanded')) + ' | focus ' + await focused() + ' | label ' + await ev(() => document.querySelector('.lang-btn').getAttribute('aria-label')) + ' | pressed ' + await ev(() => [...document.querySelectorAll('.lang-menu [aria-pressed="true"]')].map(x => x.dataset.lang).join()) + ' | names in their language ' + await ev(() => [...document.querySelectorAll('.lang-menu [data-lang]')].every(x => x.lang === x.dataset.lang)));
  await key('Tab'); console.log('tab into the menu: ' + await ev(() => document.activeElement.dataset.lang));
  await p.focus('.lang-menu [data-lang="fr"]'); await key('Enter'); await w(300);
  console.log('french picked: menu closed ' + await ev(() => document.querySelector('.lang-menu').hidden) + ' | focus ' + await focused() + ' | skip ' + await ev(() => document.querySelector('.skip').textContent) + ' | title ' + await p.title());
  await p.focus('.theme-btn'); await key('Enter'); await w(60);
  console.log('theme menu: ' + await ev(() => [...document.querySelectorAll('.theme-menu [data-theme-pick]')].map(x => x.dataset.themePick + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(',')));
  await key('Escape'); await w(40);
  await p.click('[data-act="picker"]'); await w(80);
  console.log('picker: ' + await ev(() => document.querySelector('.picker').getAttribute('role') + ' "' + document.querySelector('.picker').getAttribute('aria-label') + '" | current ' + [...document.querySelectorAll('.pick-row[aria-current="true"]')].map(x => x.textContent.trim().split('\n')[0]).join()));
  await key('Escape'); await w(40);
  await p.click('[data-act="lang-menu"]'); await w(60); await p.click('[data-lang="en"]'); await w(300);
  // 6. tables: no empty headings; tie-breaks that are off are still readable
  const emptyTh = () => ev(() => [...document.querySelectorAll('main th')].filter(th => !th.textContent.trim()).length);
  await p.click('[data-tab="standings"]'); await w(80); const e1 = await emptyTh();
  await p.click('[data-tab="setup"]'); await w(80); const e2 = await emptyTh();
  console.log('empty headings: ' + (e1 + e2));
  console.log('tie-breaks off: ' + await ev(() => { const C = window.__carreau; const el = document.querySelector('.tb-row.off .tb-name b'); if (!el) return 'none';
    const rgb = s => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number); const bgOf = n => { for (; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (!/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; } return 'rgb(255,255,255)'; };
    const lum = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    const a = lum(getComputedStyle(el).color), z = lum(bgOf(el)); const op = getComputedStyle(el.closest('.tb-name')).opacity; return 'contrast ' + ((Math.max(a, z) + .05) / (Math.min(a, z) + .05)).toFixed(2) + ' opacity ' + op; }));
  // 7. phones: a wide table can be reached and is named; Tab never leaves a control under the tab bar
  await p.setViewportSize({ width: 390, height: 844 }); await w(250);
  await p.click('[data-tab="standings"]'); await w(80);
  await ev(() => document.querySelector('[data-act="st-cols"]')?.click()); await w(120);
  console.log('wide table: ' + await ev(() => { const t = [...document.querySelectorAll('main .tw')].find(x => x.scrollWidth > x.clientWidth + 1); return t ? `${t.getAttribute('role')} ${t.tabIndex} "${t.getAttribute('aria-label')}"` : 'none'; }) + ' | narrow tables left alone ' + await ev(() => [...document.querySelectorAll('main .tw')].filter(x => x.scrollWidth <= x.clientWidth + 1).every(x => !x.hasAttribute('role'))));
  await ev(() => document.querySelector('[data-act="st-cols"]')?.click()); await w(80);
  await p.click('[data-tab="entries"]'); await w(100); await ev(() => { window.scrollTo(0, 0); document.querySelector('.skip').focus(); });
  let hidden = 0, tabbed = 0; for (let i = 0; i < 45; i++) { await key('Tab'); const r = await ev(() => { const a = document.activeElement; if (!a || !a.closest('main')) return null; const nav = document.querySelector('nav.tabs').getBoundingClientRect(); const x = a.getBoundingClientRect(); return x.bottom > nav.top + 1 && x.top < nav.bottom; }); if (r === null) continue; tabbed++; if (r) hidden++; }
  console.log('phone tab: controls ' + (tabbed > 10) + ' | hidden under the tab bar ' + hidden);
  console.log('errs', errs); await b.close();
})();
