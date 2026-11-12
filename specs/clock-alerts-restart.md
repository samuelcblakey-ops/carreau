# A restarted round clock gives its alerts again

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `clockAlerts` in src/carreau.html (the ids it keeps in `S.clockGiven`, `S.clockArmed` and `S.clockFlash`), and the place in `clockPanel` that reads `S.clockFlash`; tests/app-timed-games.js; tests/run.js.
- **Depends on:** none

## Why

On a phone that has already heard a round's beeps, stopping the clock and starting it again gives no more beeps, flash or banner for that round. The app remembers the alerts it has given for each round and never forgets them. "Stop the clock" is the only way to pause a round (rain, a dispute), so an organiser who restarts the clock is left with a silent phone.

## What changes

- Alerts are remembered for each clock, not for each round. A clock is a round together with the time its clock was started.
- When a round's clock is started again, so its start time is new, these all happen again:
  - the beep and amber row at 5 minutes left
  - the three beeps at time up
  - the 10-second flash
  - the "Time: Round 1" banner on other tabs
- That holds on every phone that sees the clock, whichever phone restarted it.
- A late game's own time-up alert is remembered for that game and its piste time (`courtAt`).
- The rest stays as it is:
  - each alert sounds once per phone for each clock
  - only if that phone saw the moment coming, and within 10 seconds of it passing
  - a phone opened after the moment stays quiet

## Not changing

- `clockStart`, `clockStop` and what they save. specs/clock-batch-write.md changes those.
- Sounds, the wake lock and all wording.

## Data and rules

None. The alerts given are only kept in memory, on each phone.

## New text

None.

## Acceptance checks

Extend the alerts part of tests/app-timed-games.js (it uses `page.clock`). Set `window.__beeps = 0` at each restart, so the counts below start from the restart.

- `restart after time up: 55 min beeps 1 amber true | 60 min beeps 4 flash true red true`
- `restart, on Registration at time up: banner Time: Round 1`
- `restarted by another phone: 60 min beeps 4`
- `same clock, page redrawn: repeat beeps 0`
- `errs []`

For "restarted by another phone", don't tap. Write a new `clockAt` to each of the round's games with `S.store.updateMatch`, as another phone's Start would.

The lines the test already prints must still pass, including `opened after time up: beeps 0` and `late game time up: beeps 7 | banner Time: Piste 1`.

## Notes for the builder

- **Root cause.** `clockAlerts` builds its ids from the competition and the round key (`t.id + ":" + r.key`), and nothing ever removes them from `S.clockGiven`.
- **Fix.** Put the clock's start in the id, for example `` `${t.id}:${r.key}:${r.clk}` ``. For a late game, use its `courtAt`. `S.clockFlash` uses the same id, so change the lookup in `clockPanel` to match.
- **Two organisers starting seconds apart.** The round's clock is the earliest `clockAt` among its games, so it can move by a few seconds while the second phone's writes land. That only re-arms alerts that haven't sounded yet, which is fine.

## Open questions

None.
