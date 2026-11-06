# The "N waiting" count survives an offline reload

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `track` and the connection light in src/web-boot.js (~39).
- **Depends on:** none

## Why
An organiser offline with 9 scores waiting sees "Offline · 9 waiting to sync". After a reload while still offline, it shows just "Offline", and "1 waiting" after one more score. Everything still syncs once back online, but the count is wrong. `track` counts in memory only.

## What changes
After a reload, the count includes what's still waiting from before. For example, count from Firestore's pending writes (snapshot metadata `hasPendingWrites` on the competition's documents), or keep the count on the device until it's synced.

## Not changing
Syncing itself.

## Data and rules
None.

## New text
None.

## Acceptance checks
Extend `tests/web-offline.js`:
- `offline reload: Offline · 3 waiting`
- `back online: Live | waiting 0`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
