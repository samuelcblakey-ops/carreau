# No shooting winner until a tied final is decided

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `shootStandings` in src/carreau.html (Standings and the big screen both use it).
- **Depends on:** none

## Why

In a precision shooting final, when two finalists finish level (same points, same 5s and 3s), Draw & results correctly says "Shoot-out needed". But Standings and the public big screen already show WINNER and RUNNER-UP, in entry order. Spectators see the wrong winner, and after the shoot-out the other shooter may win.

## What changes

- While a final tie for a podium place is undecided, Standings and the big screen show no Winner/Runner-up labels for those places. They show the final in points order, with the same "Shoot-out needed · Bob, Cat" line Draw & results shows.
- Once the shoot-out is scored, the winner shows as now.

## Not changing

Qualifying, count-back rules, duels, and the Hall of Fame, which already waits.

## Data and rules

None.

## New text

None (it reuses the existing "Shoot-out needed" text).

## Acceptance checks

Extend `tests/app-shoot-ties.js`:
- `final tie standings: no winner | shoot-out needed Bob, Cat`
- `final tie big screen: no winner`
- `after shoot-out: winner Cat`
- `errs []`

## Notes for the builder

- `shootStandings` (~2650) only checks `f.every(r => r.done)`. Also require `!shootTies(t, "F").length`, as `hofResult` (~2733) already does.
- `renderDisplay` reuses `shootStandings`, so the big screen follows.
- Repro: Qualifying → final, 3 shooters in the final, entry order. Ann, Bob, Cat, Dan, Eve. In the final, Ann 50, and Bob and Cat 66 each with 12 fives and 2 threes.

## Open questions

None.
