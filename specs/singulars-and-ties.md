# Singular counts, and EuroCup says ties in Plan the rounds

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `compMeta` (count part only), and the Plan the rounds heading and empty-round text in `renderDraw` (~4490, ~4510), in src/carreau.html.
- **Depends on:** none

## Why
- The summary line says "1 clubs" (and "1 teams").
- EuroCup's Plan the rounds still says "Choose the round for each fixture", and an empty round shows "No fixtures in this round yet. Choose this round for a fixture in Plan the rounds."

## What changes
- "1 club" and "1 team" in the summary line.
- For EuroCup only: "Choose the round for each tie", and "No ties in this round yet. Choose this round for a tie in Plan the rounds."

## Not changing
Inter-club wording.

## Data and rules
None.

## New text
The new lines, in 8 languages.

## Acceptance checks
Extend `tests/app-eurocup.js` and `tests/app-picker.js`:
- `summary one club: 1 club`
- `eurocup plan heading: Choose the round for each tie | no "fixture"`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
