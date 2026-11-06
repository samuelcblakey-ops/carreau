# Two phones on one live desk both keep their ends

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `deskAction` and `saveLive` in src/carreau.html (and the layout drag's call to `saveLive`, plus a note in `liveWatch` of when this phone first saw each mène); `setLive` and `setStream` in the Firestore store in src/web-boot.js (a new `changeLive` and `changeStream`); `runTransaction` added to the Firestore import in scripts/build.py; new `tests/web-race-desk.js`.
- **Depends on:** specs/race-comp-fields.md merged first (for `tests/two-organisers.js`). It doesn't touch the files of the other race specs, so it can be built alongside them.

## Why

When two phones run the same live desk (a competition game's desk, or a standalone stream from the Stream tab) and both record something at the same moment, one is lost. Each phone writes its own copy of the whole live score. In the 6 Nov check, 3 of 3 tries lost an end on both kinds of desk. The overlay and the board then show the wrong score.

## What changes

- Each tap on the desk (an end won, a boule thrown, holding the point, a player event, Undo, Finish) is applied to the server's latest live score, not to this phone's copy. Two phones scoring at once both count.
- Undo takes back the latest thing recorded on the desk, whichever phone recorded it, as it does now with one phone.
- Two scorers watching the same game: if a phone records a mène within a couple of seconds (2 s) of another phone recording one on the same desk, it's the same mène entered twice. The first one is kept, the second isn't counted, and the second phone shows "Another phone just recorded this mène." Mènes recorded normally one after the other (by one phone or two) all count. Only mènes are matched this way; boules, holding the point, player events and Undo from two phones all count.
- Offline, a tap still saves as now and goes through when the phone reconnects.

## Not changing

- The desk's screens and buttons.
- The overlay.
- The from-disk version (Claude artifact, local store).

## Data and rules

None. The live documents keep the same fields; each mène in `ends` also notes which phone recorded it (`by`, the phone's sign-in id), so a phone can tell another phone's mène from its own. A transaction reads the document, which anyone may already do. A phone with the desk link (role `live`) still changes only `live` and `updated` on a standalone stream, as the rules require.

## New text

- "Another phone just recorded this mène." (all 8 languages)

## Acceptance checks

First write the test and run it against main to show the race. Put that output in the pull request ("before").

`tests/web-race-desk.js`, using `tests/two-organisers.js` with streaming switched on (as `web-live.js` does). Phone B opens the live desk link. A spectator's phone shows the overlay.

- 3 tries, each time A gives team A a mène of 2 while B gives team B a mène of 1, together (the same mène, entered twice):
  - `competition desk, mènes together, 3 tries: mènes kept 3 of 6 | notice on the other phone 3 of 3 | same score on both true | overlay matches true`
- 3 tries, A gives team A 2, then 3 seconds later B gives team B 1 (one after the other):
  - `competition desk, one after the other, 3 tries: mènes kept 6 of 6 | notices 0 | added 6-3 | overlay matches true`
- `undo on B: mènes 8 | took back 0-1`
- 3 tries, A throws a boule for team A while B throws one for team B, together:
  - `boules together, 3 tries: thrown a 3 b 3`
- the same two mène checks on a standalone stream:
  - `stream desk, mènes together, 3 tries: mènes kept 3 of 6 | notice on the other phone 3 of 3 | same score on both true`
  - `stream desk, one after the other, 3 tries: mènes kept 6 of 6 | notices 0 | added 6-3`
- `errs []`

Before the fix, the duplicate mène shows no notice (the last phone to write wins instead of the first), and boules together lose some throws.

## Notes for the builder

- Root cause: `saveLive` writes the whole live document (`setDoc` in `setLive`) or the whole stream (`setStream`) from this phone's copy, `L = clone(c.L)`.
- Make each `deskAction` branch a function that changes a live score, `mutate(L)`, and pass it to `saveLive(mutate)`. On the website, `S.store.changeLive(tid, mid, fn)` runs `runTransaction`: read the live doc, `normLive` it, apply `fn`, trim `events` and `hist` as `saveLive` does now, and write. `changeStream(sid, fn)` does the same on `streams/{sid}`, changing `live` and `updated` only.
- Draw the change on screen straight away, as now, by applying `mutate` to the local copy too.
- Offline, or if the store has no `changeLive` (local store, `dbStore`), apply `mutate` to the local copy and write it as today.
- `lv-pts` caps the points at the target. Do that inside `mutate`, from the server's score.
- The running score copied onto the game (`updateMatch` with `sa`, `sb` at the end of `saveLive`) should use the score the transaction wrote.
- Screenshots: the two desks after the test, at 390 px.

## Open questions

1. When two phones on one desk record a mène within a second or two of each other, is that two different mènes, or the same mène entered twice by two scorers?
   **Sam:** the same mène. Keep the first one, don't count the second, and show the second phone "Another phone just recorded this mène."
