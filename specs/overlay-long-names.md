# Long team names stay whole on the overlay

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `renderStream` and the `.ov-name` / `.ov-jack` overlay styles in src/carreau.html, plus a new `fitOvNames` called from `drawPage` for the overlay.
- **Depends on:** none

## Why

On the stream overlay's landscape score bar, "Les Pointeurs" shows as "LES POINTE…" as soon as the holding dot appears next to it, and 15–16 letter names are cut off even without the dot. Viewers of a streamed game can't read the team name.

## What changes

- The holding dot always keeps its room next to the name (hidden while the team doesn't hold), so the name doesn't change size or move when the point changes hands.
- A name too long for its box is shrunk to fit (down to 55% of its normal size) instead of being cut off. Only names past that are still ended with "…".
- In landscape, team B's dot sits on the inner side of its name (mirroring team A), so the name lines up with its boules row.
- Landscape and portrait; the overlay re-fits when its window is resized or the fonts finish loading.

## Not changing

The bar's size and layout, the score boxes, the info line, the desk.

## Data and rules

None.

## New text

None.

## Acceptance checks

New `tests/app-overlay-names.js`: 13–16 letter names ("Les Pointeurs", "Boule Lyonnaise", "Pétanque Royale", "Les Tireurs d'Or", "Carreau du Midi", "Les Bouchonnes"), each team holding in turn and neither, at 1280x720 (landscape) and 720x1280 (portrait).

- `landscape 1280x720: truncated none | holding dot visible true`
- `portrait 720x1280: truncated none | holding dot visible true`
- `errs []`

## Notes for the builder

- Root cause: in landscape each team's text column is about 15 vw wide at a 2.3 vw name size. The dot (0.95 vw + 0.7 vw gap) only appeared while holding, taking room from the name's `text-overflow: ellipsis` span. Team B's `.ov-name` wasn't capped at its column (`align-items: flex-end`), so it ran past it under the bar's `overflow: hidden`.
- Screenshots: `test-results/overlay-long-names-l.png`, `-l-b.png`, `-p.png`, `-p-b.png`.

## Open questions

None.
