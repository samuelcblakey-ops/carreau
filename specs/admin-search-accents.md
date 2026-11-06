# #admin search ignores accents

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the #admin competitions search (src/web-boot.js ~915).
- **Depends on:** none

## Why
In #admin, "melee" finds nothing, while "mêlée" finds "Mêlée du jeudi". The picker search got accent folding in #95; #admin didn't.

## What changes
#admin search ignores accents and capitals, using the same folding as the picker (`hofNorm`).

## Not changing
Anything else.

## Data and rules
None.

## New text
None.

## Acceptance checks
Extend `tests/web-admin.js`:
- `admin search melee finds Mêlée du jeudi: true`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
