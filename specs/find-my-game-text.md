# Find my game: results in every language, and the bye shown

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `gameLine` (~1580) in src/carreau.html.
- **Depends on:** none

## Why

- Find my game's "No game right now. Last game: Won 13–7 v …" keeps "Won" and "Lost" in English in every other language (French shows "Dernière partie : Lost 12–13 v …"). The line is built as one string, so the translator can't match it.
- A team with the bye is told "No game drawn yet." during and after its bye round.

## What changes

- "Won" and "Lost" are translated like the rest of the line. Team names and scores stay as they are.
- In a round where the team has the bye, its line reads "Bye this round."

## Not changing

The rest of Find my game and "This is me".

## Data and rules

None.

## New text

- "Bye this round."
- "Won" and "Lost" as stand-alone words, if they aren't keys yet

All in 8 languages.

## Acceptance checks

Extend `tests/app-find-game.js`:
- `fr last game: Dernière partie : Gagné 13–7` (or the French wording the keys give)
- `bye team in round 1: Bye this round.`
- `errs []`

## Notes for the builder

- `gameLine` filters out `m.bye` and builds "Won/Lost …" inside one template string.
- Put the translatable words in their own text nodes, with names and scores in `data-notr`, so `localize()` translates the words.

## Open questions

None.
