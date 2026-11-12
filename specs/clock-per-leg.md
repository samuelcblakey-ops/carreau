# Each part of a EuroCup round gets its own clock

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `roundKey` and `roundName` in src/carreau.html, and through them `clockRounds`, `clockStart`, `clockStop` and `gameStart`; the translation tables; tests/app-timed-games.js; tests/run.js.
- **Depends on:** specs/clock-batch-write.md merged first (both change the round clock code).

## Why

A EuroCup round has one clock, but its ties are played part by part: the triples, then the doubles, then the singles at the finals. On the live site, once the triples finish, each doubles game appears as "Piste 2 · started later" under the triples' clock. The organiser can't start the doubles together, the big digits belong to the triples, and the later games get no 5-minute warning. Inter-club days played as "Game 1", "Game 2" and so on (the rotation pairing) have the same problem.

## What changes

On Draw & results, for organisers and scorer links, as with every other clock row:

- **EuroCup:** each part of a round has its own row and clock, named after the part: "Round 1 · Triples", "Round 1 · Doubles", "Round 1 · Singles".
- **Inter-club with the rotation pairing:** each game number has its own row: "Day 1 · Game 1", "Day 1 · Game 2". Where the event counts rounds rather than days, it's "Round 1 · Game 2".
- Each of these rows works like any other row:
  - it appears when one of its games is on a piste
  - "Start the clock" stamps only that part's games
  - it has its own countdown, 5-minute warning, time up, and Stop
- A game that gets its piste after its own part's clock has started is still listed as "started later".
- The banner on other tabs uses the row's name: "Time: Round 1 · Doubles".

## Not changing

- Inter-club with one game per team per day (the default pairing): still "Day 1".
- Inter-club where every team plays every team of the other club: still one row per day, with later games listed as "started later". Those games have no game numbers to split on.
- Every other format's rows.
- What a clock row looks like, and the time limit itself.

## Data and rules

- No new saved fields, and no rules change.
- Existing competitions: a EuroCup round whose clock was started before this change stamped all its games, so its later parts will show as already running. "Stop the clock" clears them.

## New text

Build these from keys that already exist where possible:

- Round {n} · Triples
- Round {n} · Doubles
- Round {n} · Singles
- Day {n} · Game {n}
- Round {n} · Game {n}

## Acceptance checks

Extend tests/app-timed-games.js. Set EuroCup up as tests/app-eurocup.js does (4 clubs with squads), write the line-ups straight to the games, and use enough pistes for a whole part to play at once.

- `eurocup round 1: Round 1 · Triples | 4 games on pistes | Start the clock`
- `eurocup triples started: triples stamped 4 of 4 | doubles stamped 0`
- `eurocup doubles on pistes: Round 1 · Doubles | not started | triples row gone true`
- `eurocup doubles 55 min: amber true | beeps 1`
- `eurocup doubles time up, on Registration: banner Time: Round 1 · Doubles`
- `inter-club rotation: Day 1 · Game 1 | then Day 1 · Game 2`
- `inter-club default pairing: Day 1`
- `swiss: Round 1`
- `fr eurocup row: translated true`
- `errs []`

## Notes for the builder

- `roundKey` is `` `${m.group}|${m.round}` ``. For `m.stage === "club"`, add the game number `m.game`: it's the leg in EuroCup, the game number in the rotation pairing, and always 1 otherwise.
- The part names are in `euroFmt(t).legs` (`leg`, `name`).
- Round keys are only used on screen and in memory (`data-key`, `data-k`, `S.clockAsk`, the alert ids). Nothing saved depends on them.

## Open questions

None.
