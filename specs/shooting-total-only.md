# Precision shooting: enter a total when the shots aren't known

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `renderShootModal` (the shooting score box), `shotTotal`, and the shooting ranking (`shootRanking`, `shootTies`) in src/carreau.html.
- **Depends on:** none

## Why

When an organiser mirrors a shooting competition run elsewhere, for example the 2026 World Championships on 21 Nov, the published results may give only each shooter's total out of 100, not all 20 shots. Today a score can only be entered shot by shot, so those results can't be shown.

## What changes

In the shooting score box, for organisers and scorers (qualifying, final and knockout duels):

- Under the shot grid there's a link-style button: **Enter the total only**.
- Tapping it swaps the grid for one number box (0–100) labelled **Total (out of 100)**, plus **Save result**. With two shooters (a duel) there's a box for each.
- **Enter shot by shot** switches back. If a total was saved, switching back and saving shots replaces it.
- A total-only result:
  - counts in the ranking by its total, like any other total
  - shows as the total, with **(total only)** in small muted text, wherever the grid would show
- Ties between totals entered this way can't be broken by count-back (no 5s or 3s). The existing "Shoot-out needed" handling applies, as for any unbroken tie.
- Players and spectators see the total.
- Numbers outside 0–100, or not whole: **Enter a whole number from 0 to 100.**

## Not changing

- Shot-by-shot entry, the live shooter view and count-back when shots are known.

## Data and rules

- The match stores `shotTotal: n` (a number). The side B total in a duel is `shotTotalB: n`. `shots` stays empty.
- `shotTotal(sh)` callers use the stored total when it's present.
- No rules changes.

## New text

- Enter the total only
- Enter shot by shot
- Total (out of 100)
- (total only)
- Enter a whole number from 0 to 100.

## Acceptance checks

Extend `tests/app-shoot-ties.js`, or add `tests/app-shoot-total.js`. It prints:

- `total only qualifying: Ann 64 (total only)`
- `ranking with totals: Bob 71, Ann 64, Cat 58`
- `total-only tie: shoot-out needed`
- `duel totals: winner Bob 66-61`
- `bad total: Enter a whole number from 0 to 100.`
- `errs []`

## Notes for the builder

- `shootRanking` and the count-back sort read the shots. Make shooters with only a total sort by total, with no count-back.
- Check the Hall of Fame result (`hofResult`) still waits for an undecided tie.
- Look at the score box at 390 px.

## Open questions

None.
