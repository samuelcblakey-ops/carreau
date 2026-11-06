# Lines joined with "·" translate part by part

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `trCore` (~1230); the code that builds the items listed in `overrideBox` (src/carreau.html).
- **Depends on:** none

## Why

- Summary lines such as "4 Nov 2026 · Triples · 4 teams · Fixtures drawn" come out half translated: "Fixtures tiré" in French, and the whole line garbled in Thai. `trCore` tries patterns like `{x} drawn` on the whole line before splitting it on " · ", so the `{x}` swallows the other parts.
- In the override box, items such as "Semi-finals · Final: Team A v Team B" and "· Third-place game: …" keep "Final:" and "Third-place game:" in English.

## What changes

- A line made of " · " parts is translated part by part, so each part that has a key is translated ("Fixtures drawn" → its existing translation).
- Override box items translate their stage and game names; team names stay as they are.

## Not changing

Single phrases that already translate.

## Data and rules

None.

## New text

None (the keys exist).

## Acceptance checks

Extend `tests/app-languages.js`:
- `fr summary line: <the existing French for "Fixtures drawn"> | no English parts`
- `th summary line: no English parts`
- `fr override box: Finale | Petite finale`
- `errs []`

## Notes for the builder

- Either stop `{x}` captures from spanning " · " (e.g. `((?:(?! · ).)+)`), or split on " · " first when the whole line has no exact key.
- For the override items, build the stage/game label and the team names as separate parts (names in `data-notr`).

## Open questions

None.
