// Helper for the race tests (not a test itself; tests/run.js doesn't list it).
// Opens two separate browser contexts on the emulators: A creates a competition, B joins it with A's organiser link
// (role "edit"), so both are organisers. `together(...fns)` runs taps at the same moment (no waits between them).
//   const { open, together, w } = require('./two-organisers');
//   const o = await open({ teams: 12, checkin: true });   // o.A, o.B, o.tid, o.mk, o.errs, o.close()
// Open testing is switched off first (by the signed-in admin, o.AD), so the rules decide who can do what and B needs the link.
const { chromium } = require('playwright');
const w = ms => new Promise(r => setTimeout(r, ms));
const together = (...fns) => Promise.all(fns.map(f => f()));
const NAMES = ['Club Pins', 'Carreau Vents', 'Gravier Collines', 'Mistral Lions', 'Boule Rouge', 'Pointeurs Sud', 'Tireurs Nord', 'Cochonnet Bleu',
  'Petit Bouchon', 'Les Platanes', 'Terrain Vague', 'Rafle Dorée', 'Boule Lyonnaise', 'Le Carreau', 'Bec de Canard', 'La Fanny',
  'Les Cigales', 'Plombée Fine', 'Demi-Portée', 'Pointe Haute'];
async function open({ teams = 12, checkin = false, width = 390, names } = {}) {
  const base = process.env.WEB_URL; const errs = [];
  const b = await chromium.launch();
  const mk = async (n, vw = width) => { const c = await b.newContext({ viewport: { width: vw, height: 844 } });
    await c.addInitScript(() => { window.__CARREAU_EMULATOR = true; }); const p = await c.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); return p; };
  const AD = await mk('admin', 1100); await AD.goto(base + '#admin'); await w(3000);
  await AD.evaluate(() => window.__testGoogle('samuelcblakey@gmail.com')); await w(3500);
  if (await AD.$('[data-act="open-testing"][data-on="0"]')) { await AD.click('[data-act="open-testing"]'); await w(2500); }
  const A = await mk('A'); await A.goto(base); await w(3500);
  await A.click('[data-act="new-t"]'); await w(2500);
  const tid = await A.evaluate(() => location.hash.slice(1));
  await A.click('[data-act="wiz-skip"]'); await w(800); await A.click('[data-tab="entries"]'); await w(400);
  const list = names || NAMES.slice(0, teams);
  if (list.length) { await A.fill('#bulk', list.join('\n')); await A.click('#bulk-form button[type=submit]'); await w(1500); }
  for (let k = 0; checkin && k < 3 && !(await A.evaluate(() => window.__carreau.T().checkin)); k++) {
    await A.evaluate(() => { const el = document.querySelector('[data-check="checkin"]'); el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }); await w(1200);
  }
  await A.click('[data-tab="setup"]'); await w(1200);
  const editLink = await A.inputValue('#share-edit');
  const B = await mk('B'); await B.goto(editLink); await w(4500);
  const role = await B.evaluate(() => { const C = window.__carreau; return C.S.permFn(C.T()).edit; });
  if (!role) throw new Error('B did not become an organiser');
  await A.click('[data-tab="entries"]'); await B.click('[data-tab="entries"]'); await w(500);
  // put open testing back on for the tests that run after this one (they share the emulators)
  const close = async () => { try { await AD.goto(base + '#admin'); await w(2500); if (await AD.$('[data-act="open-testing"][data-on="1"]')) { await AD.click('[data-act="open-testing"]'); await w(2000); } } catch {} await b.close(); };
  return { b, A, B, AD, tid, mk, errs, base, editLink, close };
}
module.exports = { open, together, w };
