# Season Calendar 5: organisers manage online entries

- **Status:** ready to build (Sam, 19 Nov 2026)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: the Season Calendar block (the organiser's "Online entries" panel on the full listing, CSV export, removing a listing with entries); `renderEntries` (an "Entered online" panel for a competition's listing) and its actions
  - src/web-boot.js: `fbStore` (organiser reads of teams and contacts; delete a listing with its entries)
  - firestore.rules: nothing new beyond calendar-entry-form, unless the builder finds a gap (then cover it with a test)
- **Depends on:** specs/calendar-entry-form.md merged first.

## Why
Once players enter online, the organiser needs to see who has entered, reach them, accept them if they approve entries, and get them into the draw on the day without retyping anything.

## What changes
- **On the full listing, for its organisers**, an "Online entries" panel:
  - A summary: "{n} with a place · {n} on the waiting list · {n} waiting for you" (the parts with nothing in them left out).
  - One row per entry, in queue order, then the waiting list, then entries waiting for approval. Each row shows:
    - its number, or "Waiting list {n}", or "Waiting for you"
    - the team name, players and club
    - the contact as a link (`tel:` for a phone number, `mailto:` for an email)
    - when it was sent ("19 Nov, 14:05")
  - Buttons per row:
    - **Accept** (pending ones only).
    - **Remove**, which asks "Remove this entry? The team won't be told." The entrant's device later shows "This entry was withdrawn or removed."
  - **Download the entries (CSV)**, with columns Number, Status, Team, Players, Club, Contact, Sent. Build it the way `exportCsv` does (a BOM first, quoted cells, `S.downloads.save`). Move its row-to-CSV lines into a small shared helper rather than copying them.
  - Typed text goes into the file, so guard against spreadsheet formulas: put an apostrophe before any cell that starts with =, @, + or -, except a phone number (a + followed by digits and spaces).
- **Removing a listing** that has entries asks "Remove the listing and its {n} online entries? Contact details are deleted too." It deletes the entries, teams and contacts first, then the listing.
- **Registration, for a competition with a listing that takes online entries**: an "Entered online" panel above the Teams (or Players) list:
  - One row per online entry, in queue order, with its place or "Waiting list {n}", or "Waiting for you" plus **Accept**.
  - **Add to Registration** copies the team name, players and club into the competition as a new team (or player for mêlée and shooting), not checked in. The row then shows "In Registration".
  - **Add everyone with a place** does that for every entry with a place that isn't in yet.
  - Contacts are never copied.
  - A team added and then withdrawn online keeps its Registration row, which gets a pill "Withdrew online". The organiser decides whether to remove it.
  - If the draw has been made, the panel follows the existing rules for late entries (the notice under it already explains).
- Organisers of an event run elsewhere get the panel on the listing only, since there's no Registration.

## Not changing
The entry form and the queue rules (calendar-entry-form). Check-in. Draws.

## Data and rules
- A team added from an online entry carries `calEntry: "<eid>"` on the competition's team (or player), so it can't be added twice and its row can show "In Registration" or "Withdrew online". Keep it a string field on the team object; no arrays inside arrays.
- No contact, phone or email ever goes into `tournaments/{tid}`.
- Rules: calendar-entry-form already lets organisers read teams and contacts, accept pending entries and delete entries. Check those rules against what this spec does, and add a web test for each.

## New text
"Online entries", "{n} with a place", "{n} on the waiting list", "{n} waiting for you", "Waiting list {n}", "Waiting for you", "Accept", "Remove this entry? The team won't be told.", "Download the entries (CSV)", "Number", "Status", "Team", "Players", "Club", "Contact", "Sent", "Remove the listing and its {n} online entries? Contact details are deleted too.", "Entered online", "Add to Registration", "Add everyone with a place", "In Registration", "Withdrew online". Reuse existing keys where the English is the same.

## Acceptance checks
Extend `tests/web-calendar.js` (and `tests/app-calendar.js` for Registration):
- `desk: rows 3 | contact link tel true | stranger sees panel false`
- `accept: Waiting for you → place 2 | entrant view You have a place (2 of 2)`
- `remove: entry gone true | team gone true | contact gone true | entrant sees: This entry was withdrawn or removed.`
- `csv: header Number,Status,Team,Players,Club,Contact,Sent | rows 3`
- `registration: Entered online 3 | add one: teams +1, calEntry set | add everyone with a place: +1 | twice: no duplicate`
- `registration: contact in tournament doc false`
- `withdrew online pill: true`
- `remove listing with entries: listing gone true | contacts left 0`
- `errs []`

## Notes for the builder
- `renderEntries` is long. Add the panel as its own function (e.g. `calRegPanel(t)`) and call it once, so other branches touching `renderEntries` don't collide.
- Mêlée and shooting entries are single players: add them to `t.players` the way the "Add a player" form does, not to `t.teams`.
- Screenshots: the organiser's panel at 390 px, and Registration with the "Entered online" panel.

## Open questions
None.
