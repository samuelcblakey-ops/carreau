# The round clock warns the organiser

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the clock ticker and `clockPanel` from time-round-clock; a small `beep()` helper (Web Audio); `S.alert` and `renderAlert` for a "Time" banner; a screen wake lock helper; CSS (amber state, flash, reduced motion); tests/app-timed-games.js; tests/run.js.
- **Depends on:** specs/time-round-clock.md merged first.

## Why

The organiser is usually busy at the desk or out on a piste, not watching the phone. They need to hear when time is nearly up and when it's up. The phone also mustn't go to sleep while a round is being timed.

## What changes

These alerts are for anyone who sees the clock (organisers and scorer links, `canScore()`), with the competition open on any tab.

1. **5 minutes left on a round's clock.**
   - The digits and the row turn amber (`--jack`).
   - One short beep, and a short vibration on Android.
   - There's no warning if the time limit is 5 minutes or less, and none for late games.
2. **Time up on a round's clock.**
   - Three beeps, and a longer vibration on Android.
   - The red row flashes for 10 seconds, then stays red.
   - If the organiser is on another tab, the banner that announces a new draw shows "Time: Round 2" for 15 seconds. Its View button goes to Draw & results.
3. **A late game's time up.** The same three beeps, and the banner "Time: Piste 4".
4. **Each alert sounds once per phone.**
   - A phone that opens the competition after the moment has passed doesn't beep.
   - Only a crossing seen in the last few seconds counts.
5. **Turning sound on.**
   - Browsers only allow sound after a tap. Tapping "Start the clock" turns sound on, and so does any tap on the page.
   - While a clock is running and sound isn't on yet (after reloading the page, say), the panel shows a button: "Turn on the beep".
6. **A reminder.** While a clock is running, the panel shows the line "Keep this phone unlocked with the volume up to hear the beep."
7. **The screen stays awake (Screen Wake Lock).**
   - It's on while the page is visible and any round with a clock still has games being played.
   - It's asked for again when the page becomes visible again.
   - It's let go when no timed round is being played, or when the organiser leaves the competition.
   - Where the browser doesn't support it, nothing happens and no message appears.
8. **Reduced motion.** With `prefers-reduced-motion`, nothing flashes; the row just turns red.

## Not changing

- Players, team links and spectators get no sound, banner or wake lock.
- The clock itself (specs/time-round-clock.md).
- There are no sound settings.

## Data and rules

None. Nothing is saved.

## New text

- Time: {x}
- Turn on the beep
- Keep this phone unlocked with the volume up to hear the beep.

## Acceptance checks

Extend tests/app-timed-games.js.

- Use `page.clock` to move time on.
- Stub sound and the wake lock:
  - count beeps through a hook such as `window.__beeps`
  - replace `navigator.wakeLock` with a fake that records requests and releases

Lines:

- `55 min: amber true | beeps 1`
- `60 min: beeps 4 | flash true | red true`
- `after 10 s: flash false | red true`
- `on Registration at time up: banner Time: Round 1`
- `late game time up: beeps 7 | banner Time: Piste 1`
- `opened after time up: beeps 0`
- `limit 5 min: warning beeps 0`
- `wake lock: on while clock runs true | off after round finished true | asked again when visible true`
- `spectator: beeps 0 | wake lock false`
- `reduced motion: flash false | red true`
- `sound locked after reload: Turn on the beep shown true | after tap shown false`
- `errs []`

## Notes for the builder

- **Beep.**
  - Use Web Audio: an `AudioContext` with a short oscillator tone, created or resumed inside a tap handler. Keep it to one small helper, with no audio files.
  - iPhones mute Web Audio when the silent switch is on. Where `navigator.audioSession` exists, set its `type` to "playback" before playing.
- **Vibration.** `navigator.vibrate` exists on Android only. The app already uses it for new draws (`checkNewRound`).
- **Wake lock.**
  - Use `navigator.wakeLock.request("screen")`. The browser releases it when the page is hidden.
  - Listen for `visibilitychange` to ask again.
  - Wrap it all in try/catch.
- **Remembering alerts.** Keep the alerts already given in memory, per phone: for example a Set of `<round key>:warn`, `<round key>:up` and `<game id>:up`.
- **Screenshots** at 390 px: the amber row, the red row, and the banner on another tab.

## Open questions

None.
