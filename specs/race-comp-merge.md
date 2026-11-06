# Two organisers changing the same list at once both keep their change

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `saveT` in src/carreau.html; `updateTournament` in the Firestore store in src/web-boot.js (from race-comp-fields); new `tests/web-race-checkin.js`.
- **Depends on:** specs/race-comp-fields.md merged first.

## Why

After race-comp-fields, a change saves only the fields it touched. Check-ins, new teams and withdrawals all live in one field, though (the `teams` or `players` list). So two organisers checking in **different** teams at the same moment still overwrite each other. In the 6 Nov check, 5 of 10 such check-ins were lost, once with the taps 150 ms apart. The lost team is then left out of the draw.

## What changes

Nothing on screen. On the website, when a phone saves a change to a list, it is merged into the server's latest copy instead of replacing it:

- two organisers check in different teams: both are checked in;
- one adds a team while the other checks one in: both kept;
- one withdraws a team while the other checks another in: both kept;
- both change the **same** thing on the same team (e.g. both rename it): the one that reaches the server last wins, with no error.

## Not changing

- What a change does, and the screens.
- Offline: a change made offline still saves the changed fields (race-comp-fields) when the phone reconnects. Merging needs the server, so two offline edits to the same list can still lose one. That's rare, and a check-in can simply be tapped again.
- The from-disk version (Claude artifact, local store).

## Data and rules

None. Same fields; the rules already check the merged document.

## New text

None.

## Acceptance checks

First write the test and run it against main to show the race. Put that output in the pull request ("before").

`tests/web-race-checkin.js`, using `tests/two-organisers.js`. Swiss, 12 teams, check-in on.

- 10 tries, each time A and B check in two different teams together:
  - `two check-ins together, 10 tries: 10 of 10 kept`
- `two teams added together: both listed true`
- `withdraw on A, check in on B together: both kept true`
- `same team renamed on both: one of the two names true | errs on phones 0`
- `offline check-in after sync: kept true`
- `round 1 after the check-ins: every checked-in team drawn true`
- `errs []`

Before the fix, the first line shows fewer than 10 of 10.

## Notes for the builder

- On the website, `saveT` runs the save in a Firestore transaction (`runTransaction`): read the competition, merge, write the changed fields.
- Three-way merge of each changed top-level field, with `base` (the copy the change was made from, as in race-comp-fields), `mine` (the phone's new copy) and `server` (read in the transaction):
  - Lists where every item is an object with an `id` (`teams`, `players`, `courts`, `pools`, `draws`, `brackets`, `clubs`, `clubFix`…) are merged by id, starting from the server's list:
    - an item in `mine` but not in `base` is added, if the server doesn't have it already;
    - an item in `base` but not in `mine` is removed;
    - for an item in all three, only the properties that differ between `base` and `mine` are copied onto the server's item.
  - Every other field (numbers, text, plain objects such as `koPlan`, lists of plain values): `mine` wins if it changed from `base`, else the server's copy stays.
- Put the merge in a small pure function and test it from an app test too, e.g. extend `tests/app-checkin.js` with `merge: two check-ins kept true`.
- Offline (`navigator.onLine === false`), or if the transaction fails with `unavailable`, fall back to the plain field update from race-comp-fields. Don't make the screen wait: `saveT` already renders before the write.
- Watch the clock: a transaction does a round trip to the server. Keep the check-in button instant (the change is on screen before the write), and look at `tests/app-checkin.js` and `web-offline.js`.
- `permission-denied` must still reach `handleWriteError` as now.
- Screenshots: Registration on both phones after the 10 tries, at 390 px.

## Open questions

None.
