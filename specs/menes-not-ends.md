# Live desk and overlay say mènes, not ends

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the live desk, overlay and stream set-up text in src/carreau.html (~3624 "Who won the end?", the overlay's "End N ·", the desk's "END" label, ~3779 "Reset clears the score and ends…").
- **Depends on:** none

## Why
CLAUDE.md's wording is mènes, but the live desk and overlay say "End": "END", "Who won the end?", "End 3 ·" and "Reset clears the score and ends…". French already says "Mène".

## What changes
- English says mène/mènes in those places: "MÈNE", "Who won the mène?", "Mène 3 ·" and "Reset clears the score and mènes…".
- Translations keep their own words; re-key them to the new English.

## Not changing
Behaviour.

## Data and rules
None.

## New text
The changed lines, re-keyed in 8 languages.

## Acceptance checks
Extend `tests/app-streams.js`:
- `desk: Who won the mène?`
- `overlay: Mène 3`
- `fr desk: Mène`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
