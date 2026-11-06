# Phones: Setup and Draw & results don't scroll sideways

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the `.tw` CSS rule; the EuroCup "<club> win the tie" pill in `renderDraw` (src/carreau.html ~4401).
- **Depends on:** none

## Why

On phones, the Setup tab of any competition with an afternoon knockout plan is 493 px wide on a 390 px screen. The bottom tab bar stretches with it, so "Stream" is off-screen and "Table" is cut in half. The organiser's Draw & results does the same once the morning is finished, because the knockout plan opens itself, right when they need "Draw the knockouts". Separately, at 320 px the EuroCup "<club> win the tie" pill makes Draw & results scroll sideways in French, Spanish, German, Dutch and Portuguese.

## What changes

No sideways scrolling, and the tab bar fits the screen.

## Not changing

The layout on computers.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-mobile.js`:
- `setup with knockout plan 390: page width 390 | tab bar width 390`
- `setup with knockout plan 320: page width 320`
- `draw & results with plan open 390: page width 390`
- `eurocup tie pill 320 de: page width 320`
- `errs []`

## Notes for the builder

- The plan table's hidden "Remove" column label (`.sr-only`, position:absolute) escapes its scroll box, because `.tw{overflow-x:auto}` (CSS ~172) isn't positioned. `.tw{overflow-x:auto;position:relative}` brings the page back to 390 and 320 (tested).
- Give the EuroCup tie pill the `.wrap` class, as the knockout winner pill got on 27 Oct (#59).
- App tests set the page size with Playwright's `viewport` (no isMobile), which lays out at that width.

## Open questions

None.
