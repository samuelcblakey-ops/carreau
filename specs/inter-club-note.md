# Inter-club team table note matches how ties are broken

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the note under the inter-club team table in `clubStandings` (~4714) in src/carreau.html.
- **Depends on:** none

## Why
The note says level teams go to the drawn lot, but the games between the level teams decide first (the mini-league in `rankStats`).

## What changes
The note says: "Level teams are split by the games between them, then by the drawn lot."

## Not changing
The ranking itself.

## Data and rules
None.

## New text
"Level teams are split by the games between them, then by the drawn lot.", in 8 languages.

## Acceptance checks
Extend `tests/app-clubs.js`:
- `team table note: Level teams are split by the games between them, then by the drawn lot.`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
