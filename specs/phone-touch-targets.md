# Phones: controls at least 44 px, and labels that fit

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** CSS in src/carreau.html; the header's picker and tab label markup only if CSS can't do it.
- **Depends on:** none

## Why

The house rule is 44 px controls on phones, but several are smaller:
- round/knockout/day chips (`.rchip`, 34 px) and number chips (34×34)
- inter-club results-grid cells (38×30)
- bracket zoom −/+/Fit (36–38×40)
- the header logo link (26 px)
- quick score pad buttons (36 px wide)
- Setup ranking-order toggles (28 px)
- the plan's third-place checkbox (13×13) and ✕ (33 px)

Also:
- Tab bar labels overflow their tabs: German "Einstellungen", Dutch "Inschrijvingen" and Portuguese "Configuração" at 390 px; most languages at 320 px, where Dutch and Portuguese run off the screen.
- At 320 px the header picker shows one letter.
- EuroCup Registration rows squeeze the club column (71 px at 390, 1 px at 320). Long names in line-up places break mid-word, and the squad form's Man/Woman drop-downs are 39 px.
- In dark mode, the knockout "PISTE N" badge is white on #ef7a70 (2.7:1).

## What changes

- On touch screens (`pointer: coarse`), every control above is at least 44×44 px (the hit area may be larger than the visible chip).
- Tab labels fit their tab in every language at 390 and 320 px: smaller type or two lines, never cut off or off-screen.
- At 320 px the picker shows at least the first word of the competition name.
- EuroCup Registration: the badges wrap under the name on phones, names break only between words, and the drop-downs are 44 px.
- The dark-mode piste badge has at least 4.5:1 contrast.

## Not changing

Desktop layouts. `.btn.sm` (40 px, kept small on purpose).

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-mobile.js` (390 and 320, touch emulation):
- `touch targets under 44: none` (the list above)
- `tab labels fit 320 nl pt de: true`
- `picker 320 shows a word: true`
- `eurocup registration 320: name column 120+ px`
- `dark piste badge contrast 4.5+: true`
- `errs []`

## Notes for the builder

`.rchip` (~324), `.bkm-pst` (~225), `.t-short` (~64/77).

## Open questions

None.
