# A double tap on "Draw round N" can't remove the round on tablets and computers

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the `"undo"` case of the click handler's action switch (or `undoDraw`) in src/carreau.html.
- **Depends on:** none

## Why

#89 made a double tap draw only one round. But on screens 768 px and wider, "Undo round N" appears exactly where "Draw round N" was, so the second tap removes the round that was just drawn ("Draw removed."). This happens from round 2 on; phones are fine.

## What changes

A tap on Undo is ignored if it comes within 1.5 seconds of that round being drawn, or while a draw is still saving. After that, Undo works as now.

## Not changing

Where the buttons sit, and Undo itself.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-round-status.js`, using Playwright's `dblclick` and two quick touchscreen taps:
- `double tap draw round 2 at 1024: rounds 2 | toast not "Draw removed."`
- `double tap draw round 2 at 768: rounds 2`
- `double tap draw round 2 at 390: rounds 2`
- `undo after 2 s: rounds 1`
- `errs []`

## Notes for the builder

- The round box in `renderDraw` (~4276) puts Undo in the Draw button's place at 768 px and wider.
- `case "undo"` (~4929) and `undoDraw` (~2302) have no guard, and `S.drawing` is already clear by the time the second tap lands.
- Ignore the undo while `S.drawing`, or when the draw's `created` is less than ~1.5 s ago.
- "Draw round 1" is already safe at every width.

## Open questions

None.
