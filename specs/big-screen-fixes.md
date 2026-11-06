# Big screen: tables for barrage and leagues, the round in play, the name as typed

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `renderDisplay` (~4818) in src/carreau.html, and the Next up list it shows.
- **Depends on:** none

## Why

- The big screen shows no tables for a barrage (pools) or for leagues. Swiss and round robin show their standings.
- For mêlée "all rounds drawn in advance", it says "ROUND 4" while round 1 is being played, and Next up lists games from rounds 2 and 3.
- In other languages it translates the competition's name ("Suisse · 5 rounds → afternoon knockouts"), and the date shows as 2026-10-26.

## What changes

- Barrage: each barrage's table; leagues: each league's table. Same columns as on Draw & results, sized for the big screen.
- Mêlée drawn in advance: the round shown is the lowest round with games still to play, and Next up lists only that round's games.
- The competition name is shown exactly as typed. The date uses the app's usual date format.

## Not changing

Big screen layouts for other formats.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-features.js` (or add `tests/app-big-screen.js`):
- `big screen barrage: tables 3`
- `big screen leagues: tables 2`
- `big screen melee in advance after 2 results: Round 1 | next up round 1 only`
- `fr big screen name: exactly as typed | date 26 Oct 2026` (or the app's date format)
- `errs []`

## Notes for the builder

- `renderDisplay` has no branch for pools or leagues, and counts drawn rounds (`t.draws.filter(d => d.kind === "round").length`).
- The `<h2>` with `esc(t.name)` needs `data-notr`.

## Open questions

None.
