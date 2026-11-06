# EuroCup: renaming a squad player updates the line-ups

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the EuroCup squad-edit branch of the Registration add-form submit handler (~5022) in src/carreau.html.
- **Depends on:** none

## Why

If an organiser corrects a player's name in a club's squad after the line-ups are named, the line-ups keep the old name. The mixed triple and mixed double then fail "needs a man and a woman", and Save line-ups is disabled until the player is picked again.

## What changes

Saving a squad edit also renames the player in that club's line-ups, in every game not yet finished. A renamed player is one in the same place in the squad.

## Not changing

Finished games keep the names they were played with. Adding or removing players works as now.

## Data and rules

None. The line-ups (`la`/`lb`) keep storing names.

## New text

None.

## Acceptance checks

Extend `tests/app-eurocup.js`:
- `rename after line-ups: line-up shows Alice Long | mixed triple ok | save line-ups enabled`
- `errs []`

## Notes for the builder

- Line-ups store names (`saveLineups` ~3144).
- `lineupIssues` (~3073) looks up each player's sex by name, so a renamed player isn't found.

## Open questions

None.
