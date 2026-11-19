# Season Calendar 3: events run elsewhere

- **Status:** ready to build (Sam chose to allow both kinds of listing, 19 Nov 2026)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: the Season Calendar block (the sheet gains an event mode; "Add an event"; "Your listings"; the organiser link on an open listing); `parseLiveHash` (`#calendar.<id>.org.<code>`)
  - src/web-boot.js: `fbStore` (create an event with its private code; join with a code), `S.calCanEdit`, a joined-listings list kept on the device like `joined()`
  - firestore.rules: `match /calendar/{cid}` (`kind == "event"`), plus `/private/{docId}` and `/members/{uid}` under it
- **Depends on:** specs/calendar-page.md merged first.

## Why
Many competitions are still run on paper or with other tools. Their organisers should be able to put them on the Season Calendar too, which fills the calendar for players. There's no competition behind such a listing, so it needs its own organisers.

## What changes
- **On the Season Calendar page**, for anyone who can create competitions (`S.canCreate()`): an **Add an event** button in the tools panel, with the line "For a competition run on SN Pétanque, list it from its Setup instead."
- **The sheet in event mode**, titled "Add an event" (or "Edit the event"). Everything calendar-publish has, with these changes:
  - Competition name (required, ≤120) instead of the read-only line
  - Format: Singles / Doubles / Triples / Mêlée / Precision shooting / Other
  - Format details (optional, ≤80, e.g. "Swiss, 4 rounds then knockouts")
  - Date, Venue and the rest are typed in, with nothing pre-filled except country, level (Open) and who can enter (Open to all)
  - **Add the event** / **Update the event**. Toasts: "Added to the Season Calendar." and "Listing updated."
  - A refused save: "Only this event's organisers can change it."
- **After adding**, the full listing opens. Its organisers see, under it:
  - **Edit** and **Remove** (Remove asks "Take it off the Season Calendar?")
  - An "Organiser link" box: the link, a **Copy** button, and the line "Anyone with this link can change or remove this listing. Share it only with people helping you organise."
- **The organiser link** `#calendar.<id>.org.<code>`: opening it joins this device as one of the event's organisers (a members record, as for competitions and streams) and opens the listing, with the toast "You can now edit this listing." A wrong or old code: "That organiser link didn't work. Ask for a new one." The code is stripped from the address bar after use.
- **"Your listings"**: at the top of the page, for listings this device organises (events it added or joined, and its competitions' listings), a short section with the same rows. It shows only when there are some, including ones the admin has hid, marked "Hidden by the site admin".
- **Rows and full listing:**
  - The format reads from the event's fields, e.g. "Doubles · Swiss, 4 rounds then knockouts".
  - An event never shows "Live now", **Follow the draw** or **View the competition**.

## Not changing
Competitions' listings (calendar-publish). No "turn this event into a competition" (later). No online entry (calendar-entry-form).

## Data and rules
- An event is `calendar/{cid}` with `kind: "event"`, no `tid`, a new id (`"c" + uid()`), plus:
  - `ownerUid` (the device that added it)
  - `orgCode` (the organiser login code it was made with, when organiser login is on; else "")
  - `fmt` (singles | doubles | triples | melee | shooting | other) and `formatNote` (≤80)
- `calendar/{cid}/private/code` holds `{ code }` (`newCode()`). It's written on the first save, like a stream's desk code.
- `calendar/{cid}/members/{uid}` holds `{ role: "edit", code, joinedAt }`. It's accepted only when the code matches, like `match /streams/{sid}/members/{uid}`.
- Rules for `kind == "event"`:
  - `create`: signed in, `ownerUid == request.auth.uid`, `hidden == false`, and the same organiser-login test as `match /tournaments` create (`!loginOn() || isAdmin() || (orgValid() && orgCode == myCode())`).
  - `update` / `delete`: the admin, or the event's organisers: members role `edit`, or, with organiser login off, the owner; with it on, `orgEdits`-style (the listing's `orgCode` is this device's valid code). `ownerUid`, `orgCode`, `kind`, `byUid`, `createdAt` can't change, and the calendar-publish rules on `hidden` still hold.
  - `private/code`: read and write by the event's organisers and the admin.
  - `list`: also allow `resource.data.ownerUid == request.auth.uid` (for "Your listings", including hidden ones).
  - `kind` can never change between `comp` and `event`.

## New text
"Add an event", "For a competition run on SN Pétanque, list it from its Setup instead.", "Edit the event", "Competition name", "Format", "Other", "Format details (optional)", "e.g. Swiss, 4 rounds then knockouts", "Add the event", "Update the event", "Added to the Season Calendar.", "Only this event's organisers can change it.", "Organiser link", "Copy", "Anyone with this link can change or remove this listing. Share it only with people helping you organise.", "You can now edit this listing.", "That organiser link didn't work. Ask for a new one.", "Your listings", "Hidden by the site admin".

## Acceptance checks
Extend `tests/app-calendar.js` and `tests/web-calendar.js`:
- `add event: Added to the Season Calendar. | kind event | fmt doubles | on page true`
- `event organiser: Edit true | Organiser link true | stranger Edit false`
- `join link: You can now edit this listing. | second device updates true | wrong code: That organiser link didn't work. Ask for a new one.`
- `your listings: event true | competition listing true | hidden marked true`
- `rules: stranger updates event false | stranger reads code false | member reads code true | change kind false | change ownerUid false`
- `rules, organiser login on: device without a code creates event false | with a valid code true`
- `errs []`

## Notes for the builder
- The model is the standalone stream: `match /streams/{sid}` in firestore.rules, and `setStream` (private code on first save), `watchStream` and `joinStream` in web-boot.js.
- Keep the code out of anything public: never in the listing document, never in a competition.
- "Your listings" gathers three sources: events this device added (query `ownerUid == uid`), events it joined (ids kept on the device, read one by one with `getCal`), and the listings of the device's own competitions (`getCal(t.id)` for each competition where `S.isMine(t)`; a missing one just isn't shown).
- Screenshots: the event sheet at 390 px, and an open event as its organiser and as a stranger.

## Open questions
None.
