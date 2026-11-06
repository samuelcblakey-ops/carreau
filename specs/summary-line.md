# Competition summary line: EuroCup reads right, and mêlée shows the round in play

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `compMeta` (~3840) and `SYS_NAME` (~3839) in src/carreau.html.
- **Depends on:** none

## Why

- The start-page card and picker line for a EuroCup competition reads "4 Nov 2026 · Triples · · 4 teams · Fixtures drawn": an empty part, a format that doesn't apply, and "teams" for clubs. `SYS_NAME` has no `eurocup` entry.
- For mêlée "all rounds drawn in advance", the line says "· Round 4" while round 1 is being played.

## What changes

- EuroCup: "4 Nov 2026 · EuroCup · 4 clubs · Ties drawn".
- Mêlée drawn in advance: the round shown is the lowest round with games still to play.

## Not changing

Other formats' lines.

## Data and rules

None.

## New text

- "EuroCup", if it isn't a key yet
- "{n} clubs"
- "Ties drawn"

All in 8 languages.

## Acceptance checks

Extend `tests/app-picker.js`:
- `eurocup summary: 4 Nov 2026 · EuroCup · 4 clubs · Ties drawn`
- `melee in advance summary after 2 results: Round 1`
- `errs []`

## Notes for the builder

None beyond the Touches.

## Open questions

None.
