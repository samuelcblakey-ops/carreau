# Registration subtitle for precision shooting

- **Status:** ready to build
- **Size:** one pull request
- **Touches:** the subtitle beside the `<h2>Registration</h2>` heading in `renderEntries` (src/carreau.html), and one test
- **Depends on:** none

## Why

On a precision shooting competition, the small line beside "Registration" reads "Singles (tête-à-tête) · Mêlée". A shooting competition is neither a mêlée nor a singles game, so the organiser is shown the wrong format.

## What changes

The grey subtitle beside the Registration heading, on phone and desktop, for anyone who sees Registration:

- **Precision shooting** competitions: `Precision shooting`.
- **Everything else:** unchanged. For example: "Doubles · Swiss rounds", "Triples · Mêlée", "Doubles · Mêlée, teams drawn once · Swiss rounds", "EuroCup · …".

## Not changing

The rest of Registration for shooting. It still counts players and offers "Add a player", which is right, because shooting entries are individual players.

## Data and rules

None.

## New text

None. "Precision shooting" is already in all 8 languages (French: "Tir de précision").

## Acceptance checks

Add `tests/app-entries-subtitle.js` and its expectations to `tests/run.js`. The test creates a competition of each kind through the test hook (`window.__carreau`, as `tests/app-round-status.js` does), opens Registration and prints:

- `subtitle shooting: Precision shooting`
- `subtitle melee: Doubles · Mêlée`
- `subtitle swiss: Doubles · Swiss rounds`
- `subtitle shooting fr: Tir de précision`
- `errs []`

## Notes for the builder

- Cause: `renderEntries` sets `const melee = isIndiv(t)`, and `isIndiv` is true for shooting too (`const isIndiv = t => t.entry === "melee" || isShoot(t)`). The subtitle's `melee ? "Mêlée"` branch then fires, after `FORMAT_LABEL[t.format]` ("Singles (tête-à-tête)").
- Fix: give the subtitle its own `isShoot(t) ? "Precision shooting" : …` branch, before the format label. Leave `melee` alone for the rest of `renderEntries`.
- Look at a phone screenshot of Registration for a shooting competition and for a doubles one.

## Open questions

None.
