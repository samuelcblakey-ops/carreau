# Big draws arrive all at once

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `writeMatches` (~2298) and `addDraw` (~2306) in src/carreau.html; the Firestore store in src/web-boot.js (a batch write).
- **Depends on:** none

## Why

When a round of more than 20 games is drawn on the website, the games are written in batches of 20. The organiser's round box flickers between counts, and spectators see part of the round (20 games, then 23, then 30) for about 1–2 seconds.

## What changes

All of a draw's games and the competition are written together, so every screen goes from no round to the full round in one step.

## Not changing

Draws of 20 games or fewer, apart from using the same path. The from-disk version.

## Data and rules

None. Firestore allows up to 500 writes per batch; split only above that.

## New text

None.

## Acceptance checks

Extend a web test (e.g. `tests/web-live.js`), with Swiss 60 teams and round 2 drawn:
- `spectator counts seen: 0 → 30` (no partial counts)
- `organiser counts seen: 30 only` (no flicker)
- `errs []`

## Notes for the builder

- `writeMatches` does `Promise.all` over slices of 20, and `saveT` starts after the first batch.
- `watchMatches` replaces `S.matches` with each local snapshot.
- Add a `S.store.setMatches(list, t)` that uses `writeBatch` on the website, and falls back to the loop elsewhere.
- Keep yesterday's fix (#89): no "Round finished" flash after a draw, and a double tap draws one round.

## Open questions

None.
