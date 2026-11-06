# "Show on the front page" features a competition without locking it

- **Status:** ready to build (Sam chose "Featured, not locked", 6 Nov)
- **Size:** one pull request.
- **Touches:**
  - src/web-boot.js: the "Show this competition on the site's front page" option in `sharingPanel`, the visitor-role logic (~141–150, `listed`), the front-page/picker query (~68) and `S.hofCanPublish` (~150)
  - firestore.rules: the `listed` checks (~43–47, ~182)
  - the picker/start-page groups in src/carreau.html
- **Depends on:** none

## Why
Ticking "Show this competition on the site's front page" in Setup → Sharing sets `listed`, which is also what makes a competition an Example. So it becomes locked for visitors ("Example competition… Nothing can be changed"). Its organiser's own picker files it under Examples, spectators get every tab, and publishing it to the Hall of Fame is refused, both by the app and by the rules. This is probably why "Inter Regionals 2026" shows under Examples on the live site.

## What changes
- The option marks the competition featured (a new `featured` field), not as an Example.
- A featured competition shows on the front page and in new visitors' picker, in its own group "Featured" above Examples.
- It stays a normal competition:
  - its organisers run it as before and can publish it to the Hall of Fame;
  - spectators see the usual Draw & results, Standings and Big screen;
  - visitors can't change it unless open testing applies, as for any competition.
- The admin's Examples (`listed`) are unchanged.
- Existing data: competitions listed through this option by their organiser become featured instead of Examples. Inter Regionals 2026 is one. The admin's seeded examples stay Examples. Work out how to tell them apart (e.g. an `example` field, who created them, or how `listed` was set), and do the move safely. If you can't tell them apart reliably, stop and say so.

## Not changing
Examples. The admin's controls for examples.

## Data and rules
- New field `featured` (bool), which the competition's owner or organisers can set.
- Reads stay public.
- Rules: `featured` doesn't make a competition view-only, and doesn't block Hall of Fame publishing.

## New text
"Featured" in 8 languages, and any changed explanation under the option.

## Acceptance checks
Add or extend web tests (e.g. `tests/web-open-testing.js` and `tests/web-hall-of-fame.js`):
- `featured: on front page true | group Featured | not an example`
- `featured, organiser publishes to the Hall of Fame: true`
- `featured, spectator tabs: draw, standings, big screen`
- `featured, visitor writes refused (open testing off): true`
- `example still view-only: true`
- `errs []`

## Notes for the builder
`listed` is used as the Example flag in web-boot.js (~141, ~144, ~150, ~68) and firestore.rules (~43–47, ~182).

## Open questions
None.

## Decision (6 Nov, after building started)
The stored data can't tell them apart: all 14 listed competitions on the live site have the same owner, device and creation day, and nothing records how `listed` was set. Sam chose to move only Inter Regionals 2026 (`tai2wt9p`) to featured, as a one-off by that ID; the other 13 stay Examples. The move must leave its games and results untouched.
