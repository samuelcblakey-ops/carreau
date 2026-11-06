# CSV export: games in order, readable status, accents kept

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `exportCsv` (~5131) in src/carreau.html.
- **Depends on:** none

## Why

The CSV export:
- mixes knockout rows in between Swiss rounds
- shows internal codes in Status (done, playing, pending)
- strips accents from the file name ("Concours de l'Été à Hitchin" becomes "Concours de lt  Hitchin.csv")
- has no BOM, so Excel garbles accented names

## What changes

- Rows run in playing order: all morning rounds in order, then each knockout by round.
- Status reads "Finished", "Playing" or "Waiting", in the chosen language.
- The file name keeps accents and spaces; only characters that aren't allowed in file names are removed (/ \ : * ? " < > |).
- The file starts with a UTF-8 BOM.

## Not changing

The columns.

## Data and rules

None.

## New text

"Finished", "Playing" and "Waiting" if they aren't keys yet, in 8 languages.

## Acceptance checks

Extend `tests/app-features.js` (capture through `S.downloads`):
- `csv order: Round 1, Round 2, Semi-finals, Final`
- `csv status: Finished | Playing | Waiting`
- `csv file name: Concours de l'Été à Hitchin.csv`
- `csv bom: true`
- `errs []`

## Notes for the builder

`exportCsv` sorts with `byOrder`, writes `mStatus` and filters the name with `/[^\w\- ]/`.

## Open questions

None.
