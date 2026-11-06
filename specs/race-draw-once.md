# A round can only be drawn once

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `addDraw` and `undoDraw` in src/carreau.html; `setMatches` and `deleteTournament` in the Firestore store in src/web-boot.js; a new `match /drawn/{did}` block inside `match /tournaments/{tid}` in firestore.rules; new `tests/web-race-draw.js`.
- **Depends on:** specs/race-comp-fields.md merged first (it adds `tests/two-organisers.js`, and the draw batch then writes only the competition's changed fields).

## Why

If two organisers tap "Draw round 1" at the same moment, both phones draw the round, each with its own random shuffle, and both write games with the same ids (R1-m1, R1-m2…). The games mix: some teams end up in two games and others in none ("in two games 3 | missing 3"), and every screen shows the broken round. In the 6 Nov check this happened in 3 of 4 tries with Swiss (12 teams) and 1 of 4 with mêlée (20 players). Barrage, random knockouts and EuroCup ties are built the same way.

## What changes

- The first phone's draw is saved. The second phone's draw is refused as a whole, so nothing of it mixes in, and that phone shows the first phone's round with the toast:
  - "Round 1 was already drawn on another phone." (the draw's own label: "Barrage", "EuroCup ties", "Main", "Day 2 fixtures"…)
- The second phone stays an organiser. It must **not** switch to "You can follow this competition but not change it."
- This works for every kind of draw: Swiss and mêlée rounds, Barrage and leagues, knockouts (seeded or random), round robin, snake, inter-club and EuroCup fixtures, day 2 fixtures, and the shooting qualifying round and final.
- It also works offline. If an offline organiser draws a round that someone else has already drawn, their draw is refused when they reconnect: their phone then shows the saved round and the same toast.
- "Undo round N" frees the round, so it can be drawn again.

## Not changing

- How rounds are drawn and paired.
- The double-tap guard (`S.drawing`) and the Undo hold-back after a draw (#89, #98).
- The from-disk version (Claude artifact, local store): one device, no change.

## Data and rules

- New documents `tournaments/{tid}/drawn/{drawId}` = `{ by: <uid>, at: <ms> }`, one for each draw (draw ids: `R1`, `R2`…, `pools`, `RR`, `SN`, `CL`, `CL2`, a bracket's id, `Q`, `F`). They're written in the same batch as the draw's games and the competition. Firestore rejects a batch as a whole, so a refused claim also stops the games.
- Rules, inside `match /tournaments/{tid}`:
  - `match /drawn/{did}`: read if `notArchived(tid) || isAdmin()`;
  - create if `(canEdit(tid) && notArchived(tid)) || isAdmin()`, with keys only `by` and `at`;
  - **no update** (a second claim on the same draw is an update, so it's refused);
  - delete if `(canEdit(tid) && notArchived(tid)) || isAdmin()` (Undo).
- Competitions drawn before this have no claims. Their next draw creates its own claim, and nothing else changes.
- The admin's delete of a competition also deletes its `drawn` documents.

## New text

- "{x} was already drawn on another phone."

## Acceptance checks

First write the test and run it against main, to show the race. Put that output in the pull request ("before").

`tests/web-race-draw.js`, using `tests/two-organisers.js`. "Clean" means: every checked-in team (or player) is in exactly one game or bye, no game id appears twice, and A's and B's screens show the same games.

- `swiss 12 round 1 together, 4 tries: clean 4 of 4 | games 6`
- `melee 20 round 1 together, 4 tries: clean 4 of 4`
- `barrage 16 together: clean true`
- `random knockout 16 together: clean true`
- `eurocup 4 clubs together: clean true`
- `second phone: toast Round 1 was already drawn on another phone. | still organiser true`
- `undo then draw again: rounds 1 | clean true`
- `offline draw of a drawn round, after sync: clean true | toast Round 1 was already drawn on another phone.`
- rules, called straight on the store:
  - `rules: second claim permission-denied | follower claim permission-denied | organiser claim and delete allowed true`
- `errs []`

Also run `web-big-draw.js` and `web-eurocup.js`. They must still pass.

## Notes for the builder

- Root cause: `addDraw` → `writeMatches` → `S.store.setMatches` writes the batch without checking whether the round is already on the server. Game ids are fixed per round, and round 1 and mêlée rounds are shuffled, so two writes interleave.
- In `setMatches` (web-boot.js), add `b.set(doc(db, "tournaments", tid, "drawn", id), { by, at })` for each draw id to the **first** batch. Pass the draw ids in from `addDraw`; with mêlée "in advance", `res.draws` has several.
- When online, read each claim with `getDocFromServer` first. If one exists, show the toast and don't write. Otherwise a slow second phone briefly shows its own round. Still rely on the rules for the true race.
- When the batch fails with `permission-denied`, check whether the claim now exists. If it does, show the new toast and let the snapshot bring back the server's round. Don't call `handleWriteError`, because that switches the phone to follow-only. An offline phone gets the failure through `track()`, which today shows "A change made offline couldn't be saved." The draw needs its own handler there too.
- `undoDraw`: delete the games, save the competition, then delete the claims last, so nobody can redraw while the old games are still going.
- `deleteTournament` (admin): also delete the `drawn` collection.
- Rules change: this goes live on merge. The rules lines in the acceptance checks cover both what's allowed and what's denied.
- Screenshots: the second phone after the refused draw, at 390 px.

## Open questions

None.
