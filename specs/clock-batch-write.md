# Starting or stopping a round clock saves in one go

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `clockStart` and `clockStop` in src/carreau.html; a new `updateMatches` in the Firestore store in src/web-boot.js, beside `updateMatch`; new tests/web-clock.js; tests/run.js.
- **Depends on:** specs/clock-alerts-restart.md merged first (only so the two don't meet in tests/run.js).

## Why

"Start the clock" and "Stop the clock" save one game at a time, about 0.2 seconds each on the live site. Each live update replaces the whole list of games, so the games not yet saved snap back to their old state. Seen on the live site:

- After Stop, the row shows "Start the clock", flips back to running (or "Time!") within a tenth of a second, and only settles once the last game is saved: 0.7 seconds for 4 games, 1.9 seconds for 10.
- After Start, the games are stamped one by one over the same time.

At 32 games that's about 6 seconds, and at 500 games well over a minute. An organiser who closes the page part-way leaves a round half started or half stopped.

## What changes

- Tapping "Start the clock" or "Stop the clock" saves the whole round's clock in one write. Above 450 games it goes in chunks of 450.
- Every game of the round changes together, on this phone and on every other phone.
- After Stop, the row shows "Start the clock" and stays that way.
- Only each game's `clockAt` is written, as now, so a score saved on another phone at the same moment is kept.
- A failed write is handled as other writes are (`guard`).

## Not changing

- What the clock shows, who sees it, and its alerts.
- `watchMatches`, `setMatches` and `updateMatch`.
- Firestore rules.

## Data and rules

- No new saved fields.
- New store method `updateMatches(tid, list)`, where `list` is `[{ id, patch }]`. In the Firestore store it's a `writeBatch` with one `update` per game, 450 per batch, sent through `track` like the other writes.
- Stores without `updateMatches` (the local and db stores in src/carreau.html) keep saving game by game with `updateMatch`.
- No rules change: each update in a batch is checked by the existing `match /matches/{mid}` rule.

## New text

None.

## Acceptance checks

New `tests/web-clock.js`, a web test on the emulators. Use tests/two-organisers.js so that A and B are both organisers. Set up a Swiss round of 6 games on 6 pistes, with a time limit of 60.

Count the calls by wrapping `S.store.updateMatches` and `S.store.updateMatch` on A's page.

- `start: updateMatches calls 1 | updateMatch calls 0 | stamped 6 of 6 | B sees the clock running true`
- `stop: updateMatches calls 1 | updateMatch calls 0 | row went back to running false | clockAt on 0 games | B sees Start the clock true`
- `score saved by B during A's Start is kept: true | that game stamped true`
- `errs []`

For "row went back to running", read the row's state every 20 ms for 2 seconds after the Stop tap.

tests/app-timed-games.js must still pass as it is. It runs on the local store, which has no `updateMatches`, so it covers the game-by-game path.

## Notes for the builder

- `setMatches` in src/web-boot.js shows the pattern for chunked batches sent through `track`.
- specs/race-scores.md (not built yet) also changes `updateMatch` and `track` in src/web-boot.js. Add `updateMatches` as its own method and leave `updateMatch` alone, so the two don't collide.
- In `clockStart` and `clockStop`, keep the order: change `S.matches`, redraw, then save. Only the save changes.

## Open questions

None.
