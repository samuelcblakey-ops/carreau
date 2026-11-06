# Undo on "Result saved" puts the game back on its piste

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the "save-final" undo callback in `modalAction` (src/carreau.html ~3318).
- **Depends on:** none

## Why

When a result is saved, its piste goes straight to the next waiting game. If the organiser then taps Undo on the "Result saved." toast, the piste isn't taken back. The undone game, which is still being played there, shows "Waiting for piste", while the other game holds the piste and Next up lists the wrong game.

## What changes

Undo puts the game back on its piste, and the game that had just been given that piste goes back to waiting, if it has no score yet.

## Not changing

Undo when no game was waiting (that already works), and the 6-second toast.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-quick-score.js`:
- Swiss, 8 teams, 3 pistes, round 1: 3 games on pistes and 1 waiting. Save a result on Piste 1, then tap Undo:
  - `undo with a waiting game: undone game Piste 1 | other game waiting`
- `errs []`

## Notes for the builder

- `recordResult` → `assignCourts` (~2373) hands the freed piste out on save.
- The undo (~3318–3322) only restores the piste if nobody else holds it.
- Remember which game took the piste and give it back (if that game has no score yet), then call `assignCourts`.

## Open questions

None.
