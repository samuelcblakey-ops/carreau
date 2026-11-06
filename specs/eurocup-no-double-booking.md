# EuroCup: a club never plays two ties at once

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `planCourts` (~1697) and `drawClubs` (~1989) in src/carreau.html.
- **Depends on:** none

## Why

A EuroCup club can end up on pistes in two ties at the same time, with the same players on two pistes, in two ways:
1. Draw & results → Plan the rounds lets a tie be moved into a round where one of its clubs already has a tie, and the pistes are filled for both.
2. The draw uses Inter-club's hidden "Number of days". If that was changed before switching to EuroCup, all ties land in round 1.

## What changes

- The EuroCup draw always spreads the ties over the usual number of rounds (clubs − 1), whatever Inter-club's days setting says.
- When the pistes are filled, a club that has games live in one tie doesn't get games of another tie until that tie is finished. A tie moved into a busy round waits.

## Not changing

Plan the rounds still allows the move. Inter-club is unchanged.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-eurocup.js`:
- `eurocup draw after inter-club days 1: rounds 3`
- `tie moved into a busy round: clubs in two ties on pistes none | same player on two pistes none`
- `after the first tie finishes: moved tie on pistes true`
- `errs []`

## Notes for the builder

- `drawClubs`: `D = Math.max(1, t.clubDays || n - 1)`; use `n - 1` for EuroCup (`isEuro(t)`).
- `planCourts`: `keyOf = m => m.eu ? [m.id] : ...` makes each EuroCup game its own busy key. For EuroCup, treat a club as busy while it has an unfinished game on a piste in a different tie.

## Open questions

None.
