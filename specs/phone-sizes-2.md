# Phones: shooting scorecard cells and the spectator header

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** CSS in src/carreau.html for the precision shooting scorecard grid and the header; the "Organiser code" header button in src/web-boot.js (~267) only if its label must change.
- **Depends on:** none

## Why
- On touch phones, the precision shooting scorecard grid cells are 40×36 px, under the 44 px house rule.
- A spectator's header at 390 px squeezes the competition name to one letter ("S ▾", 8 px), next to an "Organiser code" button that wraps onto two lines; at 320 px the name gets 0 px. Organisers, scorers and teams get 93 px at 390. #117 only covered 320 px for organisers.

## What changes
- On touch screens (`pointer: coarse`), scorecard cells are at least 44×44 px.
- A spectator's header at 390 and 320 px shows at least the first word of the competition name. The "Organiser code" button stays on one line, using a shorter label or an icon with an accessible name on narrow screens.

## Not changing
Desktop layouts.

## Data and rules
None.

## New text
Only if the button gets a shorter label. If so, add it in 8 languages.

## Acceptance checks
Extend `tests/app-mobile.js`, with touch emulation where it matters:
- `shooting grid cells under 44: none`
- `spectator header 390: name shows a word | organiser code button one line`
- `spectator header 320: name shows a word`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
