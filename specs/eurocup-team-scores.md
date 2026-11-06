# EuroCup team score entry covers every game being played

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `teamPanel` (~1538) in src/carreau.html.
- **Depends on:** none

## Why

With team score entry on, a EuroCup club's link shows only one game: the first unfinished one. A club plays several games at once in a tie (two triples, then three doubles), so it can't enter the mixed triple until the open triple's score is in.

## What changes

For EuroCup, the My team panel lists every unfinished game of the club's current tie that is on a piste. Each has its own Enter score, Confirm and Dispute buttons, like the single game has now.

## Not changing

Fixed-team formats keep the one-game panel.

## Data and rules

None. Team score entry and its rules are unchanged.

## New text

None.

## Acceptance checks

Extend `tests/web-team-scoring.js`:
- EuroCup, 2 clubs, "Teams enter, other team confirms", both triples on pistes:
  - `eurocup team panel: games 2 | can enter mixed triple true`
- `errs []`

## Notes for the builder

- `teamPanel`: `cur = mine.find(m => !m.done && m.a && m.b)` gives one card.
- A EuroCup club is the same entry in every game of a leg.

## Open questions

None.
