# Hall of Fame waits for the afternoon knockouts

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `hofDrawPanel` (~2780) and `hofOpen` (~2787) in src/carreau.html.
- **Depends on:** none

## Why

After the morning rounds of a Swiss, round robin or league competition with afternoon knockouts planned, "Publish to the Hall of Fame" already shows at the top of Draw & results, before the knockouts are drawn. Publishing then records the morning leader as the winner. Updating the entry after the final opens with the knockout unticked, and saving says "Tick at least one part to publish." until it's ticked by hand.

## What changes

- The publish panel at the top of Draw & results waits until the last planned knockout's final has a score, as #79 intended. Competitions with no knockout planned are unchanged.
- When an entry is updated and none of its parts exist any more, the update sheet starts with every finished part ticked.

## Not changing

Publishing from Standings, and what an entry contains.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-hall-of-fame.js`:
- `swiss with knockout planned, morning done: draw panel shows publish false`
- `after the final: draw panel shows publish true`
- `update after knockouts: knockout ticked true | saved true`
- `errs []`

## Notes for the builder

- `hofResult`'s Swiss part (~2744) is ready even with no bracket drawn. `getPlan` always holds at least one bracket, so check whether a planned knockout is drawn and finished.
- `hofOpen` ticks only the parts already in the entry.

## Open questions

None.
