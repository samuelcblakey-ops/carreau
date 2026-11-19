# Season Calendar 8: past listings and contact details are deleted after 30 days

- **Status:** ready to build (Sam, 17–19 Nov 2026: contact details deleted about 30 days after the event)
- **Size:** one pull request.
- **Touches:** src/web-boot.js: the admin clean-up in #admin (the one `tests/web-cleanup.js` covers), plus `fbStore` (list all listings for the admin; delete a listing with everything under it).
- **Depends on:** specs/calendar-share.md merged first. The privacy section from calendar-entry-form promises this, so online entry's site switch stays Off until this has shipped.

## Why
The privacy page promises that entries and contact details are deleted 30 days after the event. Old listings would also crowd the page's 300-listing query in time.

## What changes
- The admin clean-up (its button and its automatic run when #admin opens) also deletes every Season Calendar listing dated more than 30 days ago. For each one it first deletes the listing's entries, teams, contacts, members and private code, then the listing.
- The clean-up's list in #admin gets a line: "Season Calendar: {n} listings from more than 30 days ago, with their entries and contact details". It shows only when there are some.
- Hidden listings are included. A competition's listing goes, but the competition itself is untouched (the clean-up's existing rules for competitions still apply to it).

## Not changing
The clean-up of competitions. The Hall of Fame.

## Data and rules
- No new fields. The rules already let the admin list all listings and delete anything under them. Check that, and cover it in the test.
- Existing data: nothing to move.

## New text
"Season Calendar: {n} listings from more than 30 days ago, with their entries and contact details".

## Acceptance checks
Extend `tests/web-cleanup.js`:
- `calendar cleanup: old listing gone true | its entries 0 | teams 0 | contacts 0 | code gone true`
- `calendar cleanup keeps: listing 29 days ago true | future listing true | competition of old listing true`
- `calendar cleanup line: Season Calendar: 1 listings from more than 30 days ago, with their entries and contact details`
- `errs []`

## Notes for the builder
- Delete in batches of up to 450 writes, like `deleteTournament`, and the listing last, so a failure part-way never leaves entries without their listing.
- Compare dates as "YYYY-MM-DD" strings.

## Open questions
None.
