# Hall of Fame waits for the knockouts after Quick setup too

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `hofKoWait` (~2892) in src/carreau.html.
- **Depends on:** none

## Why
#102 made "Publish to the Hall of Fame" wait for the planned knockouts. But when the knockout plan was never edited (e.g. after Quick setup → Swiss), the panel still shows at the top of Draw & results once the morning is done. Publishing then records the morning leader. Draw & results offers "Draw the knockouts" from the default plan all the same.

## What changes
A competition with no saved plan waits for its default plan's knockouts, exactly like one whose plan was edited.

## Not changing
Everything else #102 did.

## Data and rules
None.

## New text
None.

## Acceptance checks
Extend `tests/app-hall-of-fame.js`:
- `quick setup swiss, morning done: draw panel shows publish false`
- `quick setup swiss, after the final: draw panel shows publish true`
- `errs []`

## Notes for the builder
`hofKoWait` returns false when `!t.koPlan`; `getPlan` falls back to `defaultPlan`.

## Open questions
None.
