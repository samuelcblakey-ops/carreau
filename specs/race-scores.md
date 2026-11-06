# An older score can't silently overwrite a newer one

- **Status:** needs answers (see Open questions)
- **Size:** one pull request.
- **Touches:** `recordResult` and `rebuildFrench` in src/carreau.html, plus the other writes that change a finished game's score (the shooting score writes in `modalAction`); `handleWriteError` and a new conflict dialog; `track` and `updateMatch` in src/web-boot.js; `match /matches/{mid}` in firestore.rules; new `tests/web-race-scores.js`.
- **Depends on:** specs/race-pistes.md merged first (both change firestore.rules and the "save-final" undo area).

## Why

Organiser A, offline, enters 13–5 for a game. Organiser B, online, then enters 13–8 for the same game. When A's phone reconnects, its 13–5 overwrites B's newer 13–8 on every screen, with no "Corrected" mark, so nobody notices. Two organisers entering a game's score at the same moment online have the same problem. A wrong result moves the wrong team on in a knockout and changes the standings.

## What changes

- Each game carries a version number that goes up by one with every score change. A phone may change a score only if it saw the version that's on the server. Otherwise the server refuses the change.
- The phone whose score was refused (straight away, or when it reconnects) gets a dialog:
  - title: "Score not saved"
  - text: "{x} v {x}: another phone saved {x} first. Your score was {x}."
  - buttons: "Keep {x}" (closes the dialog; the score from the other phone stays) and "Use {x}" (saves this phone's score as a correction, marked "Corrected", like any other correction).
- Every screen shows the score that was kept. If the refused score had already moved a team on in a knockout, or into a later French-poule game, that team is put back, so the next games follow the kept score.
- The refused phone stays an organiser. It must **not** switch to "You can follow this competition but not change it."

## Not changing

- Corrections made on purpose (editing a finished game): they work as now and are marked "Corrected".
- The live desk's running score (an unfinished game's `sa`/`sb`, written by `saveLive`).
- Team score entry (proposals) and how a confirmed proposal is applied.
- The from-disk version (Claude artifact, local store).

## Data and rules

- New field on games: `ver` (number, missing = 0). A write that changes `done`, `win`, or the score of a finished game, or a reset of a later game, also sets `ver` to this phone's `ver + 1`.
- Rules, `match /matches/{mid}` → `allow update`: for organisers, scorers and the admin, add "if the write changes `ver`, it must be exactly the server's `ver` (or 0) plus 1". Leave `teamUpdate` as it is.
- A phone still on an older version of the app (before it reloads) doesn't send `ver` and is let through as today. Those phones update by themselves (the PWA), so this gap closes.
- Existing games have no `ver`; they start at 0.

## New text

- "Score not saved"
- "{x} v {x}: another phone saved {x} first. Your score was {x}."
- "Keep {x}"
- "Use {x}"

## Acceptance checks

First write the test and run it against main to show the race. Put that output in the pull request ("before").

`tests/web-race-scores.js`, using `tests/two-organisers.js`. Swiss, 8 teams, round 1 drawn.

- A offline enters 13–5, then B online enters 13–8 for the same game, then A reconnects:
  - `offline 13-5 then online 13-8: A shows 13-8 | B shows 13-8 | spectator 13-8`
  - `A asked: Score not saved | Keep 13–8 | Use 13–5`
- A taps "Use 13–5":
  - `use mine: every screen 13-5 | corrected true`
- A and B save different scores for one game, together:
  - `two results together: one kept on every screen true | other phone asked true | still organiser true`
- Knockout of 8, A offline enters a quarter-final win for one team, B online enters a win for the other, then A reconnects:
  - `knockout: semi-final has the kept winner true`
- rules, called straight on the store:
  - `rules: stale ver permission-denied | next ver allowed true | write without ver allowed true`
- `live desk running score still saves: true`
- `errs []`

Also run `web-offline.js` (its offline score must still reach the other phone) and `app-features.js` (corrections, knockout resets, French poules).

## Notes for the builder

- Root cause: `recordResult` → `S.store.updateMatch` writes the patch without checking what the server has. An offline write is queued and lands on top of whatever happened in the meantime.
- Add `ver: (prev.ver || 0) + 1` to the patch in `recordResult`, to the next-game resets in its knockout loop (where `done` goes back to false), to the resets in `rebuildFrench`, and to the shooting writes that set `done`. Search for every `updateMatch` whose patch has `done`, `win`, `sa` or `sb`, and leave out `saveLive`'s running score.
- A refused write rejects with `permission-denied`: online straight away, offline through `track()` once the phone reconnects (as long as the page wasn't reloaded). Read the game from the server (`getDocFromServer`). If its `ver` is past the one this phone wrote from, it's a conflict: show the dialog and don't call `handleWriteError`. Anything else is a real `permission-denied` and goes to `handleWriteError` as now.
- When the knockout or French-poule moves from the refused result have already been written, run the same code a correction uses, with the kept score, so the next games follow it.
- If the phone was reloaded while offline, its refused write fails with nobody to hear it. The server's score stays and no dialog shows. That's acceptable; say so in the pull request.
- Rules change: this goes live on merge. The rules lines in the acceptance checks cover both what's allowed and what's denied.
- Screenshots: the dialog at 390 px and on desktop; Draw & results on all three screens after "Use 13–5".

## Open questions

1. When two phones enter different scores for the same game, which should win? This spec keeps the one that reached the server first and asks the other phone ("Keep 13–8" / "Use 13–5"). The other option is to keep the one entered later by the clock, automatically. That's not recommended: an offline phone's clock can be off, and nobody would be asked.
