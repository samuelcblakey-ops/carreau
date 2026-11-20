// Renders an event page's link-preview image (1200 × 630 PNG) from tools/share-image.html with Playwright.
//   node tools/share-image.js worlds2026        → public/worlds2026-share.png (the file named in the event's share.image)
// The words are set below, per event; change them (or add an event) and run it again.
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const TEXT = {
  worlds2026: { title: 'World Championships 2026', where: 'Khon Kaen · 21–24 November', cta: 'Play Pick the Winner · free', flags: 'th,fr,it,es,be,de,nl' },
};
(async () => {
  const slug = process.argv[2] || 'worlds2026', root = path.join(__dirname, '..');
  const ev = JSON.parse(fs.readFileSync(path.join(root, 'src', 'events', slug + '.json'), 'utf8')), t = TEXT[slug];
  if (!t) throw new Error(`no text for ${slug} in tools/share-image.js`);
  const out = path.join(root, 'public', ev.share?.image || `${slug}-share.png`);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'share-image.html') + '?' + new URLSearchParams(t)); await p.evaluate(() => document.fonts.ready);
  await p.locator('#card').screenshot({ path: out }); await b.close();
  console.log('wrote ' + path.relative(root, out));
})();
