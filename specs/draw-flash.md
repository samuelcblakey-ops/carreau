# Draw a round without the "Round finished" flash

- **Status:** ready to build
- **Size:** one pull request
- **Touches:** `addDraw` and the `next-round` action in src/carreau.html (the order of `saveT` and `writeMatches`, plus a busy flag); `tests/app-round-status.js`
- **Depends on:** none

## Why

When the organiser taps "Draw round N", their screen first shows the new round with no games: "0/0 games finished · Round finished", with an active "Draw round N+1" button. That lasts about 2.5 s on the emulator and longer on a weak signal. Other screens also get the competition before its games. A second tap in that moment draws another round, with the new round's games missing from the pairings.

## What changes

- After "Draw round N", the round box goes straight to red with the new games listed. It never shows "Round finished" for the new round, and it never shows an active "Draw round N+1" before those games are there.
- Other devices get the new games no later than the new round, so they don't show an empty round either.
- A second tap on "Draw round N" while the draw is saving does nothing: one tap means one round.

## Not changing

How rounds are drawn (pairings, piste allocation), the toast after the draw, and knockouts. Knockouts get the same write order for free, since they also go through `addDraw`.

## Data and rules

None. The same documents are written, in a different order.

## New text

None.

## Acceptance checks

Extend `tests/app-round-status.js`. While "Draw round 2" is drawn, record every state of the round box with a MutationObserver (state, `.rp-state` text, next-round button), then print:

- `draw round 2 renders: finished seen false | next enabled seen false | games shown 2`
- `double tap: rounds 2`. Click "Draw round 2" twice in the same tick on a fresh copy; the competition has 2 rounds, not 3.
- `errs []`

Also run `scripts/check.sh --web live team` before shipping (web-live and web-team-scoring), because the order of writes changes what other screens receive.

## Notes for the builder

- Today: `addDraw` does `await saveT(t)` (this renders the new round, then waits for the server) and only then `await writeMatches(res.matches)`.
- Fix idea:
  1. Start `writeMatches(res.matches)` first. It puts the games into `S.matches` straight away, and the first 20 game writes go out before the competition's.
  2. Then `saveT(t)`.
  3. Then `await` both.
  This screen then renders with the games, and other screens get the games before the draw. A Firestore batch write would also work, but it needs a batch in both stores (`localStore`, `dbStore`); only do it if the simple order isn't enough.
- Busy flag: set something like `S.drawing` for the whole of `addDraw` (in a `try/finally`), and make `next-round` (and the other draw actions that call `addDraw`) return early while it's set.
- `tests/app-busy-day.js` covers bursts of score publishing. Check it still passes.

## Open questions

None.
