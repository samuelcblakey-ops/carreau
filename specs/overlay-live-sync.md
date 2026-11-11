# A newly opened overlay follows the desk from the start

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `liveWatch` in src/carreau.html; `boot` and the `onAuthStateChanged` handler in src/web-boot.js.
- **Depends on:** none

## Why

On the live site (11 Nov, Playwright, stand-alone stream), a freshly opened overlay sometimes missed desk changes made in its first seconds, and stayed behind until it was reloaded (3 cases; 1 missed change in 36 across 12 overlays, the next one took 3.5 s). Every overlay load also logged "FirebaseError: Missing or insufficient permissions". Streamers (spectator overlays in OBS or a phone streaming app) are the ones hit.

## What changes

- An open overlay (stand-alone `#s.<id>.stream` or competition `#<comp>.stream.<game>`) shows the desk's latest state within about 2 seconds, from the moment it opens, with no reload.
- A spectator's overlay logs no permissions error.

## Not changing

The overlay's look, the desk, the rules, what gets saved. Competition links still start loading before the sign-in finishes (web-early-load.js).

## Data and rules

None.

## New text

None.

## Acceptance checks

New `tests/web-overlay-sync.js` (emulators, anonymous sign-in slowed to 3 s as in web-early-load.js): the desk changes the score 0.5 s, 1 s, 2 s, 5 s and 10 s after a fresh overlay shows, each in a newly opened overlay.

- `overlay follows desk: 0.5s ok | 1s ok | 2s ok | 5s ok | 10s ok`
- `overlay matches desk within 2 s every time: true`
- `console errors none`
- `errs []`

## Notes for the builder

- **The permissions error** is not the stream members/role listener. `boot()` read `#s.<id>.stream` with `readHash()` as competition id `"s"` (and `#streams` as `"streams"`), so the page watched `tournaments/s` and listed `tournaments/s/matches`, which the rules refuse for a competition that doesn't exist. Stream links now never set `S.tid` unless they name a competition.
- **The missed changes.** Because of that `"s"`, a stand-alone overlay started Firestore before the anonymous sign-in, so its stream listener (`store.watchStream`, made once by `liveWatch`) was already open when the sign-in landed and Firestore restarted its connection for the new user. `liveWatch` only re-subscribes when `liveKey` changes, and its error callback only logged. Now:
  - a stand-alone overlay makes its first listener after the sign-in;
  - once signed in, `S.liveRewatch()` makes the overlay's or desk's listener again, so no listener is left over from before the restart (this covers competition overlays, which still load early on purpose);
  - a listener that stops with an error is made again after 2 s (then longer, up to 30 s), except for permission errors.
- The emulators never missed a change, before or after (24 of 24 in a stress run), so the test guards the behaviour but couldn't reproduce the live miss. Re-run the live Playwright check after this ships.

## Open questions

None.
