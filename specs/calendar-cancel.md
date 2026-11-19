# Season Calendar 6: organisers postpone or cancel a listing

- **Status:** ready to build (Sam, 17–19 Nov 2026: postponed and cancelled carry a short reason)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: the Season Calendar block (a Status section in the sheet; the status on rows, on the full listing and in "Your entries")
  - firestore.rules: `match /calendar/{cid}` (`status`, `statusNote`)
- **Depends on:** specs/calendar-entries-desk.md merged first.

## Why
Pétanque competitions get rained off or moved. Players who planned to go, or have entered online, need to see that on the listing straight away.

## What changes
- **The sheet** (both kinds of listing) gains a "Status" choice: Going ahead / Postponed / Cancelled, with "Reason (optional)" (≤120, e.g. "Rained off") when it isn't Going ahead.
- **On the page:**
  - A postponed listing's row shows a pill "Postponed". A cancelled one shows "Cancelled" in red and its name struck through.
  - Both stay on the page until their date has passed.
  - The "Entries open" chip leaves them out.
- **On the full listing:** a notice at the top: "Postponed: Rained off" or "Cancelled: Rained off" (just "Postponed" or "Cancelled" with no reason). For a postponed listing: "A new date will be shown here when the organiser sets one."
- **Online entries:**
  - While a listing isn't Going ahead, the form isn't offered and the places line reads "Entries are paused" (postponed) or "Entries closed" (cancelled).
  - "Your entries" shows "This competition has been postponed." or "This competition has been cancelled." above the entries. Withdraw still works.
- Setting it back to Going ahead (for example, with a new date) reopens entries if the closing date hasn't passed.

## Not changing
The competition itself: cancelling a listing doesn't archive or change the competition. Entries aren't deleted (calendar-cleanup does that later).

## Data and rules
- `status`: "on" | "postponed" | "cancelled" (calendar-publish allowed only "on"), and `statusNote` (≤120).
- The entry rules from calendar-entry-form already require `status == "on"`. Add a web test that proves it for both values.

## New text
"Status", "Going ahead", "Postponed", "Cancelled", "Reason (optional)", "e.g. Rained off", "Postponed: {x}", "Cancelled: {x}", "A new date will be shown here when the organiser sets one.", "Entries are paused", "This competition has been postponed.", "This competition has been cancelled.".

## Acceptance checks
Extend `tests/web-calendar.js`:
- `postponed: row pill Postponed | notice Postponed: Rained off | Enter online shown false | entry refused true`
- `cancelled: row pill Cancelled | struck true | entries chip excludes true | entrant sees: This competition has been cancelled. | withdraw works true`
- `back on: entry allowed true`
- `rules: status bogus false | statusNote 200 chars false`
- `errs []`

## Notes for the builder
- Screenshots: a cancelled row and listing at 390 px.

## Open questions
None.
