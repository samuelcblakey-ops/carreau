# The organiser starts a countdown for each round

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - in src/carreau.html:
    - `timeUp`, plus new helpers beside it: round key, round clock, a game's start, round label
    - a new `clockPanel(t)`, called from `renderDraw`
    - the "save-live" branch of `modalAction` (a game moving piste keeps `courtAt`)
    - new `clock-*` actions in the main click handler
    - a 1-second ticker beside the 60-second redraw `setInterval`
    - CSS for the panel
  - tests: new lines in tests/app-timed-games.js; step 5 of tests/app-quick-score.js; tests/run.js
- **Depends on:** specs/time-extra-menes.md merged first (this uses `timeExtra` and its wording).

## Why

With a time limit set, the organiser can't see how long is left. Each game's "Playing" badge turns to "Time" once its minutes have passed, but they're counted from when the game got its piste, not from when play started. Organisers want to start the clock themselves when they call the round, see it count down, and see at a glance when time is up and what players do next.

## What changes

This applies to Draw & results in competitions with a time limit above 0 (shooting competitions have none).

- Anyone who can enter scores sees the clock (`canScore()`: organisers and scorer links).
- Only organisers (`canEdit()`) get the Start and Stop buttons.
- Players, team links and spectators see no clock.

1. **Clock panel.**
   - It sits under the "Draw & results" heading row, above the round boxes.
   - Its eyebrow reads "Timed games · {n} min".
   - It has one row per round that has at least one unfinished game on a piste.
   - A round is every game with the same `group` and `round`: a Swiss or mêlée round, a round-robin or snake round, a barrage or league round across all barrages, a knockout round of one bracket, or a round or day of a club event.
   - Row labels:
     - "Round 2"
     - "Round robin · Round 2"
     - "Snake · Round 2"
     - "Barrage · Round 2" ("Leagues · Round 2")
     - a knockout round named as in `matchContext`, e.g. "Main · Semi-finals". A third-place game belongs to its final's row.
     - "Round 2" or "Day 2" for club events, as in `matchContext`
2. **Before the clock starts.**
   - The row shows its label, "{n} games on pistes" (or "1 game on a piste"), and a primary button "Start the clock" for organisers.
   - Under the rows: "Start it when play begins. Games still waiting for a piste get their full time from when they're given one."
   - Scorer links see "Clock not started" instead of the button.
3. **Starting.**
   - Tapping "Start the clock" stamps the time (`clockAt`) on every unfinished, non-bye game of that round.
   - The row then shows large digits counting down from the time limit ("60:00"), followed by "left" and "Time at 15:05": the moment time runs out, in local hours and minutes.
4. **Games that start later.**
   - A game in the round that gets a piste after the clock started gets its full time from that moment.
   - While it's being played, it's listed under the round's clock as "Piste 4 · started later", with its own countdown and "left".
5. **Time up.**
   - When the round's clock reaches 0:00, the row turns red (`--danger`) and shows "Time!".
   - Under it, from the competition's setting: "Finish the mène in progress and play two more. If it's still level, play one extra mène." (with +1: "…play one more. …")
   - It also shows how many games are still being played (the existing `gamesLeft` text).
   - Each game whose time is up gets the existing red "Time" badge, on its card and on its Pistes tile, as now.
   - A late game gets its badge when its own time is up.
6. **Stop.**
   - A running row has a small "Stop the clock" button for organisers, for a clock started by mistake.
   - Tapping it asks inline: "Stop the clock for Round 2? Its games won't be timed any more." The choices are "Stop the clock" (danger) and "Keep it running".
   - Stopping clears `clockAt` on the round's games, and the row goes back to "Start the clock".
7. **When every game of a round is finished,** its row goes. With no rows left, the panel isn't shown.
8. **Ticking.**
   - The digits update every second by changing the clock elements' text, without redrawing the page.
   - The page redraws once when a round's clock or a late game reaches 0:00, so the badges and the red row appear.
   - The existing 60-second redraw stays.
9. **Phones.** At 390 px the panel fits with no sideways scrolling. The digits are large (about 40 px, tabular figures). Buttons are at least 44 px high.

## Not changing

- One time limit per competition, not one per game type.
- No pause or add-time buttons.
- No sounds. Sounds, the 5-minute warning and keeping the screen awake are in specs/time-clock-alerts.md.
- Players, spectators, the Big screen and the stream overlay show no clock.
- The score box, the "Ended on time" result and how results are saved.
- Quick setup.

## Data and rules

- **New game field `clockAt`.** A number of milliseconds, set on every unfinished, non-bye game of a round when its clock starts.
  - Write it with `S.store.updateMatch`, one game at a time and only that field, not with `setMatches`. That way a score another phone saves at the same moment isn't overwritten.
  - Stopping writes `clockAt: null`.
- **The round's clock** is the earliest `clockAt` among its games. A game created after the start is timed too (a barrage's winners' game, say).
- **A game's own start** is the later of the round's clock and its `courtAt`. Its time is up once that start is more than `timeLimit` minutes ago and the game isn't finished.
- **`timeUp(t, m)` uses that start.** This changes behaviour: a game is never timed until its round's clock has been started. Before, every game was timed from its `courtAt`.
- **Moving piste keeps the time.** Moving a game from one piste to another in the score box ("save-live") keeps its `courtAt`. Only a game going onto a piste from none gets a new `courtAt`. (Undoing a score already keeps it.)
- **Undo and run-throughs.** Undoing a round, schedule, barrage or knockout deletes its games, so a redrawn round starts with no clock. A run-through (`use-template`) copies no games, so it copies no clock.
- **No Firestore rules change:** organisers and scorer links can already update games.

## New text

- Timed games · {n} min
- Start the clock
- Start it when play begins. Games still waiting for a piste get their full time from when they're given one.
- Clock not started
- {n} games on pistes
- 1 game on a piste
- left
- Time at {x}
- started later
- Time!
- Finish the mène in progress and play one more. If it's still level, play one extra mène.
- Finish the mène in progress and play two more. If it's still level, play one extra mène.
- Stop the clock
- Stop the clock for {x}? Its games won't be timed any more.
- Keep it running
- Barrage · Round {n} and Leagues · Round {n}, unless they can be built from keys that already exist

## Acceptance checks

Extend tests/app-timed-games.js.

- Install Playwright's `page.clock` before the page loads, and move time on with it.
- Setup: Swiss, 6 teams, 2 pistes, time limit 60. Round 1 has 3 games: 2 on pistes and 1 waiting.

Lines:

- `round 1 drawn: Timed games · 60 min | Round 1 | 2 games on pistes | Start the clock`
- `badges before start: 0`
- `started: 60:00 | clockAt on 3 of 3 games | time at shown true`
- `after 1 s: 59:59 | page redrawn false`
- `game finished at 20 min: waiting game on a piste true | started later true | 40:00`
- `at 60 min: Time! | Finish the mène in progress and play two more. If it's still level, play one extra mène. | badges 1 | late game badge false`
- `late game at 80 min: badge true`
- `+1 setting: Finish the mène in progress and play one more. If it's still level, play one extra mène.`
- `moved piste keeps time: true`
- `stop asks: Stop the clock for Round 1? Its games won't be timed any more.`
- `stopped: Start the clock | clockAt on 0 games | badges 0`
- `round finished: panel shown false`
- `undo and redraw: clock started false`
- `round robin row: Round robin · Round 1`
- `scorer link: clock shown true | start button false`
- `spectator: clock shown false`
- `fr: start button translated true`
- `phone 390: no sideways scroll true | start button 44+ px true`
- `errs []`

Update step 5 of tests/app-quick-score.js. It sets only `courtAt`, and that no longer times a game.

- Also set `clockAt` on the round's games, with the same values, so `time badge: late Time | on time Playing` still holds.
- Add a line before it: `time badge without a clock: Playing`.

## Notes for the builder

- `timeUp` is used by `matchCard` and by `renderCourts` (the Pistes tiles), so changing it updates both.
- **`courtAt` is set in three places:** `planCourts` (automatic), the plan write in `assignCourts`, and "save-live" in the score box. specs/race-pistes.md (not built yet) also changes `assignCourts`. Whatever it does, a game going onto a piste must still get `courtAt`.
- **Round key.**
  - Every game has `group` and `round`: `R2`/2, `RR`/r, `SN`/r, `pools`/r, the bracket id/r, `CL`/r.
  - Byes (`m.bye`) aren't timed.
  - A knockout third-place game has the same `round` as its final.
- **Two organisers.** If both tap Start within seconds, each game keeps whichever `clockAt` saved last, and the round uses the earliest. They're seconds apart, so no harm done.
- **The digits.**
  - Put them in an element with `data-notr`, so translation leaves them alone.
  - Give that element its end time (e.g. `data-end`), so the ticker only does arithmetic.
- **Keep the Start button's tap handler easy to extend.** specs/time-clock-alerts.md turns sound on in it.
- **Screenshots** of Draw & results at 390 px and on desktop, in three states: before start, running with a late game, and time up.

## Open questions

None.
