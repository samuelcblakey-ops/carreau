# Competition changes save only what changed

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `saveT` and `writeMatches` in src/carreau.html; `setTournament` and `setMatches` in the Firestore store in src/web-boot.js (a new `updateTournament`); new test helper `tests/two-organisers.js`; new `tests/web-race-edits.js`.
- **Depends on:** none. First of six race specs (race-comp-fields → race-draw-once → race-comp-merge → race-live-desk → race-pistes → race-scores).

## Why

On the website, every change to a competition (a check-in, a Setup choice, a new team, a draw) writes the whole competition from that organiser's phone. If two organisers change different things at the same moment, the second write puts back the first phone's old copy, and one change is lost. Organisers see a check-in vanish, or a Setup choice flip back; a lost check-in leaves that team out of the draw.

## What changes

Nothing on screen. On the website, saving a competition sends only the parts that changed (for example only `teams`, or only `target`), so two organisers changing different things at once both keep their change:

- organiser A changes Setup while organiser B checks a team in: both stay;
- organiser A draws round 1 while organiser B checks in a late team: both stay (the late team joins from the next round, as now);
- works offline too: the change waits and goes through when the phone is back online.

Two organisers changing the same list at once (two check-ins, two new teams) can still lose one. That's the next spec, `race-comp-merge.md`.

## Not changing

- The from-disk version (Claude artifact, local store) keeps saving the whole competition. Only one device writes there.
- A brand-new competition's first save (it creates the document and its codes) stays a full write.
- What gets saved, and the Firestore rules.

## Data and rules

None. The same fields, written with `updateDoc` instead of `setDoc`. The rules for `/tournaments/{tid}` already check the merged document, so an update is allowed or refused exactly as a full write was.

## New text

None.

## Acceptance checks

First write the test and run it against main, to show the race. Put the output of that run in the pull request ("before"). Then fix it.

Add `tests/two-organisers.js` (a helper, not a test, so `tests/run.js` doesn't run it on its own). It:

- opens two separate browser contexts on the emulators: A creates a competition, and B joins with A's organiser link (role `edit`), so both are organisers;
- exports `together(...fns)`, which runs the taps at the same moment (`Promise.all`, no waits between them).

The race specs after this one reuse it.

Add `tests/web-race-edits.js` and its regexes in `tests/run.js`. Swiss, 12 teams, check-in on.

- 5 tries, each time A sets "Points to win" to a new value while B checks in a different team, together:
  - `setup and check-in together, 5 tries: both kept 5 of 5`
- A taps "Draw round 1" while B checks in a team that wasn't checked in, together:
  - `late check-in during the draw: kept true | round 1 games 6`
- A goes offline and changes "Points to win", B checks in a team, then A comes back online:
  - `offline setup change after sync: kept true | B's check-in kept true`
- `errs []`

Before the fix, the first line shows fewer than 5 of 5, and the second shows `kept false` in some runs.

## Notes for the builder

- Root cause: `saveT` → `S.store.setTournament` → `setDoc(doc(db, "tournaments", t.id), body)` writes the phone's own copy of the whole competition. `S.store.setMatches` (the draw batch, #120) does the same with `b.set` on the competition.
- Every caller of `saveT` passes a clone (`const t = clone(T())` / `nt`). So when `saveT` starts, `S.tournaments[t.id]` is still the copy the change was made from. Take that as the base **before** `saveT` overwrites it, and send the top-level keys whose JSON differs from the base. Do the same in `writeMatches`, which also overwrites `S.tournaments[t.id]` before writing.
- A key that's gone from the new copy (e.g. `delete t.koPlan` when the system changes) is sent as `deleteField()`.
- `updated` always changes; send it.
- New store method `updateTournament(tid, patch)` in the Firestore store, wrapped in `track()` like the others. The draw batch uses `b.update(ref, patch)` for the competition instead of `b.set`. The local store and `dbStore` don't need it: `saveT` falls back to `setTournament` when the store has no `updateTournament`, when `t._new` is set, or when there's no base.
- Keep the archive path in `setArchived` (it calls `S.store.setTournament` directly after it stops listening) as it is.
- Don't change who can write. A `permission-denied` must still reach `handleWriteError` as now.
- Screenshots: none needed (nothing visible changes), but look at the Registration tab on both phones in the test's screenshots to check the check-ins match.

## Open questions

None.
