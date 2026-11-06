# Find my game: "Bye this round." only during the bye's round

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `gameLine` in src/carreau.html.
- **Depends on:** none

## Why
Since #109, a team whose last morning game was the bye sees "Bye this round." all afternoon and after the end. Before, it showed its last real result.

## What changes
"Bye this round." shows only while the bye's round is the round being played. After that, the line goes back to "No game right now. Last game: …", ignoring the bye.

## Not changing
The rest of #109.

## Data and rules
None.

## New text
None.

## Acceptance checks
Extend `tests/app-find-game.js`:
- Swiss, 7 teams, 2 rounds, final for the top 2: look up the team that had the round-2 bye and isn't in the final.
  - `bye team during the final: No game right now. Last game: …`
  - `bye team in its bye round: Bye this round.`
- `errs []`

## Notes for the builder
`gameLine` takes the team's latest game and, if it's a bye, says "Bye this round." without checking that this round is still in play.

## Open questions
None.
