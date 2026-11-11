# Overlay layout chips don't overlap

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the `.lay-chip` styles (Overlay layout editor in `renderDesk`) in src/carreau.html.
- **Depends on:** none

## Why

On the live desk's Overlay layout editor, the "Score bar" and "Info line" chips sit on top of each other in the default landscape layout on a 390 px phone, so the score bar is hard to grab. Whoever runs the desk (organiser or desk-link phone) has it.

## What changes

- The Score bar chip is drawn at the score bar's real size and shape on the picture (landscape 62.5% x 11%, portrait 91% x 14%): wide and easy to grab.
- The Info line chip is a thin pill that fits in the gap under the bar, as the real info line does.
- No two chips overlap in the default landscape and portrait layouts at 390 px. Dragging still moves each box on the overlay, and the saved positions are unchanged (centre of the box, as a percentage of the picture).

## Not changing

The default positions (`LIVE_POS`), the overlay itself, how dragging and saving work, the Card chip.

## Data and rules

None.

## New text

None.

## Acceptance checks

New `tests/app-overlay-layout.js` (390 x 844, stand-alone stream desk, Overlay layout open):

- `landscape default at 390: overlaps none`
- `portrait default at 390: overlaps none`
- `drag moves box: l bar moved | l line moved | l card moved | p bar moved | p line moved | p card moved`
- `errs []`

## Notes for the builder

- Root cause: the chips were sized by their text (bar 107x39 px, line 66x29 px) while the landscape preview is only 182 px tall at 390 px, so the bar (83%) and line (92.5%) centres are 17 px apart.
- The chips keep `translate(-50%,-50%)` at the box centre, so drag maths and saved layouts stay the same.
- Screenshots: `test-results/overlay-layout-landscape-390.png`, `overlay-layout-portrait-390.png`.

## Open questions

None.
