# Two phones on one live desk both keep their ends

- **Status:** needs answers (see Open questions)
- **Size:** one pull request.
- **Touches:** `deskAction` and `saveLive` in src/carreau.html; `setLive` and `setStream` in the Firestore store in src/web-boot.js (a new `changeLive` and `changeStream`); new `tests/web-race-desk.js`.
- **Depends on:** specs/race-comp-fields.md merged first (for `tests/two-organisers.js`). It doesn't touch the files of the other race specs, so it can be built alongside them.

## Why

When two phones run the same live desk (a competition game's desk, or a standalone stream from the Stream tab) and both record something at the same moment, one is lost. Each phone writes its own copy of the whole live score. In the 6 Nov check, 3 of 3 tries lost an end on both kinds of desk. The overlay and the board then show the wrong score.

## What changes

- Each tap on the desk (an end won, a boule thrown, holding the point, a player event, Undo, Finish) is applied to the server's latest live score, not to this phone's copy. Two phones scoring at once both count.
- Undo takes back the latest thing recorded on the desk, whichever phone recorded it, as it does now with one phone.
- Offline, a tap still saves as now and goes through when the phone reconnects.

## Not changing

- The desk's screens and buttons.
- The overlay.
- The from-disk version (Claude artifact, local store).

## Data and rules

None. The live documents keep the same fields. A transaction reads the document, which anyone may already do. A phone with the desk link (role `live`) still changes only `live` and `updated` on a standalone stream, as the rules require.

## New text

None (unless the answer to the open question adds a notice).

## Acceptance checks

First write the test and run it against main to show the race. Put that output in the pull request ("before").

`tests/web-race-desk.js`, using `tests/two-organisers.js` with streaming switched on (as `web-live.js` does). Phone B opens the live desk link.

- 3 tries, each time A gives team A an end of 2 while B gives team B an end of 1, together:
  - `competition desk, ends together, 3 tries: ends kept 6 of 6 | score 6-3 | overlay 6-3`
- the same on a standalone stream:
  - `stream desk, ends together, 3 tries: ends kept 6 of 6 | score 6-3`
- `undo on B: ends 5 | score 6-2`
- `boules together: thrown a 1 b 1`
- `errs []`

Before the fix, the first two lines show fewer than 6 of 6.

## Notes for the builder

- Root cause: `saveLive` writes the whole live document (`setDoc` in `setLive`) or the whole stream (`setStream`) from this phone's copy, `L = clone(c.L)`.
- Make each `deskAction` branch a function that changes a live score, `mutate(L)`, and pass it to `saveLive(mutate)`. On the website, `S.store.changeLive(tid, mid, fn)` runs `runTransaction`: read the live doc, `normLive` it, apply `fn`, trim `events` and `hist` as `saveLive` does now, and write. `changeStream(sid, fn)` does the same on `streams/{sid}`, changing `live` and `updated` only.
- Draw the change on screen straight away, as now, by applying `mutate` to the local copy too.
- Offline, or if the store has no `changeLive` (local store, `dbStore`), apply `mutate` to the local copy and write it as today.
- `lv-pts` caps the points at the target. Do that inside `mutate`, from the server's score.
- The running score copied onto the game (`updateMatch` with `sa`, `sb` at the end of `saveLive`) should use the score the transaction wrote.
- Screenshots: the two desks after the test, at 390 px.

## Open questions

1. When two phones on one desk record an end within a second or two of each other, is that two different ends, or the same end entered twice by two scorers? This spec counts both, as the bug report expects. If two scorers usually watch the same game, it might be better to show a notice on the second phone, "Another phone just recorded this end. Undo if it's the same one."
