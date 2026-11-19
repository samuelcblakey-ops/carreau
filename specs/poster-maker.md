# Poster maker: a poster for a Season Calendar listing

- **Status:** ready to build (Sam, 19 Nov 2026: build the poster maker and the "bring your own ChatGPT" route; no AI inside the site for now)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: the Season Calendar block (a "Make a poster" button in `calCard` and `calPanel`); new poster functions (`posterOpen`, `renderPosterModal`, `posterDraw`, `posterExport`) next to it; the modal router (`renderModal`) for `S.modal.poster`
  - src/web-boot.js: `S.downloads.save` accepts a Blob; a small hook that hands the QR generator to the app (`S.qrMatrix`)
- **Depends on:** the Season Calendar specs up to specs/calendar-cleanup.md merged first. They're being built in the same part of the app, and this spec uses `calOrganiser` (calendar-entry-form) and the listing's `online` field.

## Why
Organisers advertise competitions on Facebook and on the club noticeboard, and most of them make a flyer in ChatGPT or Canva by typing the details in again. The listing already has every detail, so the site can make a good-looking poster in a few taps. It always has the right date and contact, plus a QR code that opens the listing.

## What changes
- **Where:** a **Make a poster** button for the listing's organisers (and the admin):
  - on the full listing (`calCard`), in the row with Edit and Remove
  - in Setup → Season Calendar (`calPanel`) once the competition is listed and not hidden
  - Not for players, and not on hidden listings.
- **The poster sheet** (a modal like `renderCalModal`; full screen on phones), titled "Make a poster":
  - **The preview** at the top. It redraws as soon as anything changes (debounced, about 150 ms). On a phone it's the full width of the sheet; on a computer it sits beside the controls.
  - **Size:** chips **Facebook post** (square, 1080 × 1080), **Story** (1080 × 1920), **A4 to print** (2480 × 3508) and **A5 to print** (1748 × 2480).
  - **Layout:** three chips with small thumbnails:
    - **Bold**: a big block in the main colour with the headline, then the details on white, with the QR code at the bottom right.
    - **Band**: white, with a band in the main colour at the top (logo and headline) and a thin band in the second colour at the bottom (the QR code and "snpetanque.com").
    - **Classic**: a warm off-white background (#f6f1e7) with a simple drawn motif of three boules and a jack (plain circles, drawn by the code; no images), the headline in the main colour, and the details centred.
  - **Colours:**
    - Main colour: the `ACCENTS` swatches plus a custom colour box, defaulting to the competition's colour (`t.accent`). Events run elsewhere start on Green.
    - Second colour: swatches Gold (#d4a72c), White (#ffffff), Black (#1a2320), plus the `ACCENTS` and a custom box. Default Gold.
    - **Match the logo** (shown when there's a logo): sets the main colour to the logo's strongest colour, ignoring near-white, near-black and transparent pixels.
    - Text on a coloured block is white or near-black (#14201c), whichever has more contrast.
  - **Logo:** "Show the club logo" (tick, on by default), shown only when the competition has a logo (`logoSrc`).
  - **Words:**
    - Headline: a text box, defaulting to the competition's name.
    - Strapline: an optional text box, e.g. "Open triples · £300 prize fund".
    - Ticks for what to show: Date, Times, Venue, Address, Format, Who can enter, Entry fee, Prizes, How to enter, Contact. Each is offered only when the listing has it. The defaults are on, except Address and How to enter.
  - **QR code:** "Show the QR code" (tick, on by default). It opens the listing (`<site>/#calendar.<id>`), with the words "Scan to enter" when the listing takes online entries and entries are open, or "Scan for details" otherwise. "snpetanque.com" goes under it.
  - **Buttons:**
    - **Download**: saves `<headline> poster.png`.
    - **Share** (phones, when the browser can share files): the share sheet with the image and the listing's link. If file sharing isn't available, the button isn't shown.
    - **Print** (A4 and A5 only): prints the poster on one page at that size, which also gives "Save as PDF".
    - **Close**.
  - Under the buttons: "Check the details before you share it. Change them in the listing, not here."
- **The poster's words** use the language the site is showing (`tr`, and the date in that language), so a French organiser gets "Inscription", "Lots" and so on. Anything the organiser typed stays as typed (`data-notr` in the preview's text version).
- **Remembered on this device:** the size, layout, colours and ticks are kept per listing in localStorage (`carreau-poster:<listing id>`). A listing with no saved design starts from the last design used on this device. Headline and strapline are kept per listing only.
- Phones: the sheet is 390 px wide with no sideways scrolling, and its controls are at least 44 px tall.

## Not changing
- The listing itself; nothing is saved to Firestore.
- No picture backgrounds, ChatGPT prompts, sponsor logos or uploaded flyers. Those are specs/poster-background.md, poster-sponsors.md and poster-flyer.md.
- Players don't see the poster maker.

## Data and rules
None. Designs stay on the device (localStorage).

## New text
"Make a poster", "Facebook post", "Story", "A4 to print", "A5 to print", "Layout", "Bold", "Band", "Classic", "Main colour", "Second colour", "Gold", "White", "Match the logo", "Show the club logo", "Headline", "Strapline", "e.g. Open triples · £300 prize fund", "Show on the poster", "Times", "Address", "Show the QR code", "Scan to enter", "Scan for details", "Download", "Print", "Check the details before you share it. Change them in the listing, not here.", "The poster couldn't be made. Try again.", plus the words drawn on the poster itself that aren't already translated ("Check-in from {x}", "Play starts {x}", "Entry fee", "Prizes", "Contact", "How to enter", "Who can enter", "Format").

## Acceptance checks
Add `tests/app-poster.js` (the poster maker with the local store) and `tests/web-poster.js` (the QR code, which needs the website's generator):
- `poster button: listing true | setup panel true | player false | hidden listing false`
- `poster sizes: square 1080x1080 | story 1080x1920 | a4 2480x3508 | a5 1748x2480`
- `poster words: headline Spring Triples | date shown true | prizes hidden after untick true`
- `poster colours: main #1f5fbf | text on main white | match the logo changes main true`
- `poster layouts: bold true | band true | classic true`
- `poster remembered: layout band after reopen true | new listing starts band true`
- `poster download: png true | name Spring Triples poster.png`
- `poster print: a4 page true | square print button false`
- web: `poster qr: drawn true | link ends #calendar.<id> true | label Scan for details`
- `phone 390: poster sheet no sideways scroll true`
- `errs []`

## Notes for the builder
- **Drawing:** use a canvas at the full output size; the preview is that canvas scaled down with CSS. Draw text with the self-hosted fonts. Wait for them first: `await document.fonts.load('700 100px "Barlow Condensed"')` and Barlow 400 and 600. Without that, the first draw falls back to a system font.
- **Fitting text:** the headline shrinks to fit at most 3 lines, and long details wrap and end in "…" after 2 lines. Measure with `measureText`. Lay everything out in units of the poster's width so all four sizes come out in proportion.
- **QR code:** the generator (`public/qr.js`, loaded by `loadQr` in web-boot.js) only exists on the website. Expose a hook from web-boot, e.g. `S.qrMatrix = async url => { const q = (await loadQr())(0, "M"); q.addData(url); q.make(); return { n: q.getModuleCount(), dark: (r, c) => q.isDark(r, c) }; }`, and draw the modules as squares in a white box with a 4-module quiet zone. Make it at least 22% of the poster's width (A4: about 45 mm). In the Claude artifact version, where there's no generator, leave the QR box out and print the link in its place.
- **Download:** `S.downloads.save` in web-boot.js always makes a `text/csv` Blob. Let it take a Blob as `data` and use it as it is. Make the file with `canvas.toBlob(cb, "image/png")`. Clean the file name of characters that aren't allowed.
- **Share:** `navigator.canShare?.({ files: [file] })`, then `navigator.share({ files: [file], title, text: link })`. AbortError means the person cancelled, so stay quiet.
- **Print:** add a print-only element holding the poster as an `<img>`, with `@page { size: A4 portrait; margin: 0 }` (or A5), call `window.print()`, and remove the element on `afterprint`.
- Dates: reuse `calDate` with the site's language.
- Screenshots: each layout at square and A4, a Story, and the sheet at 390 px and on desktop.

## Open questions
None.
