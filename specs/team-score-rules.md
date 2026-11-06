# Team score proposals must be real scores

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `teamUpdate` in firestore.rules (~60–71); the publishing check in `applyProposals` (~1577) in src/carreau.html.
- **Depends on:** spec 1 merged first (same area)

## Why
With team score entry in auto-confirm mode, a team's phone can use the browser console to write a proposal with `at: 0`, a 99–0, or a level 7–7 with `time: true`. The rules accept all three, and the organiser's phone publishes them within seconds; the other team never gets its 10 minutes. The rules check only the proposal's keys and `by`.

## What changes
- The rules accept a pending proposal only if:
  - `sa` and `sb` are whole numbers from 0 to the competition's winning score (13 unless set otherwise);
  - exactly one side has the winning score, unless `time` is true;
  - with `time`, the scores differ and both are below the winning score;
  - `at == request.time`.
- `applyProposals` checks a proposal the same way as the score dialog before publishing, and skips any that fail.

## Not changing
How teams propose, confirm and dispute in the app.

## Data and rules
Rules change, live on merge.

## New text
None.

## Acceptance checks
Extend `tests/web-team-scoring.js`. From a team phone's console:
- `console at 0 refused`
- `console 99-0 refused`
- `console 7-7 time refused`
- `console 13-14 refused`
- `valid 13-7 accepted`
- `valid ended on time 9-7 accepted`
- `organiser's phone skips an invalid proposal: true`
- `errs []`

## Notes for the builder
`proposalDue` trusts `at`. The winning score is on the competition document.

## Open questions
None.
