# Season Calendar: upload a finished flyer, with our QR code added

- **Status:** ready to build (Sam, 19 Nov 2026: organisers who make a whole flyer in ChatGPT or Canva can put it on their listing, and the site adds the QR code)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: `calCard` (the flyer on the full listing, and its organiser and admin controls); the poster sheet (`renderPosterModal`: a "Your own flyer" section); the listing's removal (`calRemove`, `calPageRemove`, and the remove-with-entries path from calendar-entries-desk); `localStore` and `dbStore` (flyer methods)
  - src/web-boot.js: `fbStore` (flyer methods)
  - firestore.rules: new `match /calendar/{cid}/media/{m}`
  - the clean-up from specs/calendar-cleanup.md (delete flyers with their listings)
  - public/privacy.html: one line in the Season Calendar section
- **Depends on:** specs/poster-sponsors.md merged first (same poster functions).

## Why
Some organisers will still make the whole flyer in ChatGPT, Canva or Word. They should be able to show it on their listing, and get a copy with a QR code that opens the listing, which ChatGPT can't make.

## What changes
- **In the poster sheet,** a **Your own flyer** section at the end, for the listing's organisers:
  - **Add your flyer**: pick an image (JPEG, PNG or WebP). It's shrunk on the device (see Data) and saved with the listing. Toast "Flyer added. It shows on your listing." Afterwards the section shows a thumbnail with **Replace** and **Remove** (Remove asks "Take the flyer off your listing?" with **Remove** / **Keep it**; toast "Flyer removed.").
  - **Download with our QR code** and **Share with our QR code** (phones that can share files): the flyer with the QR code drawn in a white rounded box in the chosen corner, with "Scan to enter" or "Scan for details" under it, as on the poster. Corner chips: Bottom right (default), Bottom left, Top right, Top left. The box is 22% of the flyer's width. The saved flyer itself doesn't change.
  - **Copy a full-flyer prompt for ChatGPT**, with the toast "Prompt copied. Paste it into ChatGPT." It's the listing's details written into a prompt (below), and it asks ChatGPT to leave room for the QR code.
  - The line: "Check every detail on your flyer before you share it. AI tools can get dates, names and numbers wrong."
- **On the full listing** (`calCard`), when it has a flyer: the flyer above the details, at most 360 px wide on a computer and full width on a phone. Tapping it opens it full size in a new tab. Alt text: "Flyer for {x}" (the listing's name).
- **Errors:** "That picture couldn't be used. Try a JPEG or PNG." · "Only this listing's organisers can add a flyer." · "That didn't save. Check your connection and try again."
- **Admin:** the admin strip on the full listing gains **Remove the flyer** (no question asked; toast "Flyer removed."). Hiding the listing hides its flyer too (rules).
- **Removing the listing** deletes its flyer first. The 30-day clean-up deletes flyers with their listings.
- **Privacy page,** in the Season Calendar section: "A flyer added to a listing is public, like the listing. It's deleted when the listing is removed or cleaned up."

### The full-flyer prompt (in English)
> Design a poster advertising a pétanque competition. Shape: portrait A4. Spell every detail exactly as written here and add nothing else: Title: {name}. Date: {date in English, e.g. Sunday 7 December 2026}. {Check-in from {checkin}. }{Play starts {start}. }Venue: {venue}{, {address}}. Format: {format}. {Who can enter: {who}. }{Entry fee: {fee}. }{Prizes: {prizes}. }{Contact: {contact}. }Leave the bottom-right corner empty, a plain square about a fifth of the poster's width, for a QR code that will be added later. No recognisable real people, brands or famous landmarks.

The parts in braces are left out when the listing doesn't have them.

## Not changing
The poster maker's own designs are still never uploaded. Rows on the calendar page don't show flyers, only the full listing does. Players can't add flyers.

## Data and rules
- **New document** `calendar/{cid}/media/flyer`: `{ flyer, w, h, at }`
  - `flyer`: a data URL (`data:image/jpeg;base64,…` or `data:image/webp;base64,…`) under 700,000 characters
  - `w`, `h`: its pixel size (ints, 1–2000)
  - `at`: when it was saved (ms)
- **On the device:** shrink to at most 1600 px on the longer side, then try WebP at 0.85, JPEG at 0.85, WebP at 0.7, JPEG at 0.7 and 1200 px, until it's under 700,000 characters. The same idea as `logoFromFile`.
- **Rules:**
  ```
  match /calendar/{cid}/media/{m} {
    allow get: if m == 'flyer' && (isAdmin() || calOrganiser(cid)
                 || (exists(/databases/$(database)/documents/calendar/$(cid)) && get(/databases/$(database)/documents/calendar/$(cid)).data.hidden != true));
    allow create, update: if m == 'flyer' && (isAdmin() || calOrganiser(cid))
                 && exists(/databases/$(database)/documents/calendar/$(cid))
                 && request.resource.data.keys().hasOnly(['flyer', 'w', 'h', 'at'])
                 && request.resource.data.flyer is string && request.resource.data.flyer.size() < 700000
                 && request.resource.data.flyer.matches('data:image/(jpeg|webp);base64,[A-Za-z0-9+/=]+')
                 && request.resource.data.w is int && request.resource.data.w > 0 && request.resource.data.w <= 2000
                 && request.resource.data.h is int && request.resource.data.h > 0 && request.resource.data.h <= 2000
                 && request.resource.data.at is int;
    allow delete: if m == 'flyer' && (isAdmin() || calOrganiser(cid));
  }
  ```
  `calOrganiser` comes from specs/calendar-entry-form.md. No `list`.
- **Store methods:** `getCalFlyer(cid)` (one read, made when the full listing opens), `setCalFlyer(cid, f)`, `deleteCalFlyer(cid)`.
- Existing listings have no flyer. Nothing to migrate.

## New text
"Your own flyer", "Add your flyer", "Flyer added. It shows on your listing.", "Replace", "Take the flyer off your listing?", "Flyer removed.", "Download with our QR code", "Share with our QR code", "Bottom right", "Bottom left", "Top right", "Top left", "Copy a full-flyer prompt for ChatGPT", "Check every detail on your flyer before you share it. AI tools can get dates, names and numbers wrong.", "Flyer for {x}", "Only this listing's organisers can add a flyer.", "Remove the flyer", and the privacy page line. (The prompt stays in English.)

## Acceptance checks
Add `tests/web-poster-flyer.js` (rules and storage on the emulators) and extend `tests/app-poster.js` (the QR stamp and the prompt):
- web: `flyer: organiser adds true | shown on listing true | under 700000 true`
- web: `flyer rules: stranger adds false | stranger reads (listing shown) true | stranger reads (listing hidden) false | png data refused false | 800000 chars refused false | without listing false`
- web: `flyer admin: removes true | organiser removes true | stranger removes false`
- web: `flyer with listing: removing the listing deletes flyer true`
- app: `flyer qr: corner bottom right true | box 22% true | saved flyer unchanged true | label Scan for details`
- app: `flyer prompt: name true | Leave the bottom-right corner empty true | fee left out when empty true`
- `phone 390: listing with flyer no sideways scroll true`
- `errs []`

## Notes for the builder
- One read per full listing opened is fine. Don't read flyers for rows on the page.
- `matches` runs over the whole string. If the emulator rejects or times out on a 700,000-character regex, check the prefix with `flyer.split(',')[0] in ['data:image/jpeg;base64', 'data:image/webp;base64']` and the length instead, and say so in the PR.
- The QR stamp reuses the poster's QR drawing (`S.qrMatrix`) and its "Scan to enter" / "Scan for details" choice.
- The clean-up (calendar-cleanup) deletes entries, teams and contacts; add `media/flyer` to the same batch.
- Screenshots: a listing with a flyer at 390 px and on desktop; the stamped download in each corner.

## Open questions
None.
