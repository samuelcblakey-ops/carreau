# Wording: pistes, mènes and Barrage everywhere

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** scripts/build.py (meta description, line ~49), the Stream a game intro in src/carreau.html (~3661), and public/how-it-works.html.
- **Depends on:** none

## Why
The house wording isn't used in three places:
- The page's meta description says "draws, courts and scores".
- Stream a game's intro says "score, ends, boules left".
- How it works calls the Barrage "small groups", "groups of 4" and "knockouts by group place".

## What changes
- The meta description says "draws, pistes and scores".
- Stream a game says "score, mènes, boules left".
- How it works says "barrages", "barrages of 4" and "knockouts by barrage place".

## Not changing
Anything else. The data field, CSS class and tab id named `courts` stay as they are.

## Data and rules
None.

## New text
The changed lines in 8 languages, wherever they're translated.

## Acceptance checks
- `node scripts/i18n-check.js` passes.
- `grep -c "draws, courts" dist/index.html` is 0.
- `grep -c "score, ends" dist/index.html` is 0.
- `grep -ci "group place" dist/how-it-works.html` is 0.
- `errs []` in `tests/app-streams.js`.

## Notes for the builder
None.

## Open questions
None.
