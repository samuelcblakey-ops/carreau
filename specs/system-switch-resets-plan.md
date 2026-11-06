# Changing the system resets the knockout plan

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the "system" setting handler in src/carreau.html.
- **Depends on:** none

## Why
Choosing a knockout plan (e.g. Swiss "Top 8 + Plate 9–16") and then switching the system to Barrage keeps the old ranges, now read as barrage places. The Main knockout then gets all 16 teams and the Plate none.

## What changes
When the system changes and no knockout has been drawn yet, the knockout plan goes back to the new system's default.

## Not changing
A plan that already has drawn knockouts.

## Data and rules
None.

## New text
None.

## Acceptance checks
Extend `tests/app-features.js`:
- `swiss top8+plate then barrage: plan is barrage default`
- `errs []`

## Notes for the builder
The handler doesn't reset `t.koPlan`.

## Open questions
None.
