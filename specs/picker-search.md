# Competition search works on every device

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the competition picker's search input handler and its Enter key handler in src/carreau.html (~4998 and ~5050).
- **Depends on:** none

## Why

On phones, and in any browser that offers "Add to home screen", typing in the competition search throws an error on every key ("Cannot read properties of undefined (reading 'includes')"), and "No competitions match." never shows. Pressing Enter with no match saves a broken "last competition" (`carreau-tid="undefined"`) and lands on the start page. Search also misses accents: "melee" doesn't find "Mêlée".

## What changes

- No errors, and "No competitions match." shows when nothing matches.
- Enter only ever opens a competition.
- Search ignores accents and capitals, as the Hall of Fame search already does.

## Not changing

The picker's groups and the "Add SN Pétanque to your home screen" row.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-picker.js` with a footer row like the website's install row (`S.pickerFooter`), or add a web test:
- `search zzzz: no match message true | errors 0`
- `enter with no match: no competition opened | carreau-tid unchanged`
- `search melee finds Mêlée: true`
- `errs []`

## Notes for the builder

- `S.pickerFooter` in web-boot.js (~986) adds a `.pick-row` with no `data-name` (the install row), and the search handler calls `r.dataset.name.includes(q)` on every `.pick-row`. Enter picks the first visible `.pick-row`.
- Use `.pick-row[data-id]` for both.
- Fold accents with `hofNorm` (~2864), which the Hall of Fame search uses.

## Open questions

None.
