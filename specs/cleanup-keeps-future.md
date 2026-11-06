# Clean-up keeps competitions dated in the future

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `isAbandoned` and `cleanupPanel` in src/web-boot.js.
- **Depends on:** none

## Why

The admin clean-up (#72) counts any competition with no entries and no changes for 7 days as abandoned. An organiser who sets up next month's competition early, taking entries on the day, loses it. The manual list doesn't show the date, Automatic deletes without showing a list, and links already shared stop working.

## What changes

- A competition dated today or later is never counted as abandoned, however long it's been untouched.
- Admin, #admin → Clean-up → Show list: each line also shows the competition's date, in the app's usual date format, e.g. "Spring Open · 10 Apr 2027 · untouched 8 days". With no date, the line stays as now.

## Not changing

The 7-day rule, what counts as empty, the Automatic switch, and the re-read from the server before deleting.

## Data and rules

None. Empty competitions dated in the future simply stop being listed.

## New text

None.

## Acceptance checks

Extend `tests/web-cleanup.js`:
- `future competition kept: true`: dated a month ahead, no entries, untouched 10 days. It isn't in the list, isn't deleted by Delete now, and isn't deleted by Automatic.
- `past competition still listed: true`
- `list shows date: true`
- `errs []`

## Notes for the builder

- `isAbandoned` (src/web-boot.js ~822) ignores `t.date`, which is stored as "YYYY-MM-DD". Add `&& !(t.date && t.date >= today)`, with today as the local date in the same format.
- The list is built in `cleanupPanel` (~861, lines ~875).
- The emulator clock can't move: seed the test competitions with old `created`/`updated` values, as the test's `seed()` already does.

## Open questions

None.
