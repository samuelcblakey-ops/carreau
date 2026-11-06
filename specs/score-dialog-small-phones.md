# Score dialog fits small phones

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the `.modal` and `.modeseg` CSS rules in src/carreau.html; the "Round N is out" banner's stacking if needed.
- **Depends on:** none

## Why

On 375×667 phones (iPhone SE/8 size), the score dialog's "Winner to 13 | Ended on time" switch is squashed to 2 px and can't be tapped, so an organiser can't enter a timed result such as 11–9. On 390×844 phones it squashes too, while a toast is showing and team names are long.

## What changes

- Every part of a dialog keeps its natural height; the dialog scrolls instead.
- On the built site at 375×667, the "Round N is out · View" banner covered the top of the score dialog, including its ✕. Check this; the dialog must sit above the banner.

## Not changing

What the dialogs contain.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-quick-score.js` (or `tests/app-mobile.js`), using real taps (`locator.tap()` / touchscreen), not `.click()`:
- `score dialog 375x667: switch 44+ px | ended on time tappable true | 11-9 saved Ended on time`
- `score dialog 390x844 with toast and long names: switch 44+ px`
- `score dialog close button visible over the new-round banner: true`
- `errs []`

## Notes for the builder

- `.modal` (CSS ~290) is a flex column with max-height and overflow:auto.
- `.seg` (~127) has overflow:hidden, so it can shrink to nothing, and `.modeseg` (~370, a direct child at ~3231) takes the shrink.
- The toast rule (~368) adds 84 px of padding.
- `.modal.lineups` already keeps its children at full height (flex-shrink:0). Applying `.modal>*{flex-shrink:0}` to every dialog gave 46 px and a working tap when tested.
- App tests set the page size with Playwright's `viewport` (no isMobile), which lays out at that width.

## Open questions

None.
