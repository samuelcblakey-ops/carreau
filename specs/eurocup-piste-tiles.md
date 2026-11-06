# EuroCup piste tiles show the game and the players

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `renderCourts` (~4531) and the `.pt-ctx` CSS rule in src/carreau.html.
- **Depends on:** none

## Why

On the Pistes tab of a EuroCup competition, every live tile shows only the two club names. The game ("· Singles 3") is cut off by a two-line limit and no players are named, so twelve tiles look the same and players can't find their piste there. Draw & results does show it.

## What changes

For EuroCup games, each tile shows the game first (e.g. "Open triple", "Doubles 2", "Singles 3") and each club's line-up names under the club, as Draw & results does.

## Not changing

Tiles for other formats.

## Data and rules

None.

## New text

None (the game labels already exist).

## Acceptance checks

Extend `tests/app-eurocup.js`:
- `pistes tiles distinct: 12 of 12 | game label visible true | players shown true`
- `pistes 390: page width 390`
- `errs []`

## Notes for the builder

- In the `renderCourts` tile, `side()` uses `sideName` (the club).
- `matchContext` (~3250) puts the game label last, and `.pt-ctx` (CSS ~192) is clamped to 2 lines.
- The line-ups are in `m.la`/`m.lb`; see how Draw & results lists them (~4194).
- The live EuroCup Final example shows the problem on its Pistes tab.

## Open questions

None.
