# Pick the Winner: show who's joined before the first round closes

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `pickBoard` in src/carreau.html (only the "no round closed yet" branch).
- **Depends on:** none (pick-game, pick-game-leaderboard and pick-game-own-competition are merged).

## Why

Until the first round's picks close, the leaderboard only says "The leaderboard starts when the first round's picks close." even when people have joined. For the 2026 World Championships that lasts until Sun 22 Nov 02:00 UK.

Sam wants the build-up to show who has entered their names, so visitors see the game is busy and players can see themselves on the list.

## What changes

On the Pick the Winner tab, in the Leaderboard panel, **only while no round has closed and at least one player has joined** (everyone, phone and desktop):

- Under the heading, the subtitle **{n} players so far** (**1 player so far** for one).
- A line: **Places start when the first round's picks close: {x}.**, where {x} is the first close time, as day and time in the viewer's local time, formatted like the "Picks close" times.
- The names as small chips that wrap onto new lines, **newest first** (by `pickers/{pid}.at`).
  - The viewer's own chip is highlighted, with **(you)** after the name.
  - Show the first 40, then a button **Show all {n}** that shows the rest.
- **Organisers** can tap a chip to get the existing **Hide from the leaderboard** / **Show on the leaderboard** button.
  - Hidden players aren't shown or counted for anyone else. The player still sees their own chip.
  - The organiser sees hidden chips faded.
- **No picks are shown.** Open rounds' picks stay private, as now.

Unchanged:
- with no players: **No one has joined yet.**
- once any round has closed: the existing Place / Name / Right / Diff table

## Not changing

- Joining, picking, scoring, rules and the table after the first close.

## Data and rules

None. It uses the `pickers` names the board already loads, which anyone can read.

## New text

- {n} players so far
- 1 player so far
- Places start when the first round's picks close: {x}.
- Show all {n}

## Acceptance checks

Extend `tests/app-pick-scores.js`, or add `tests/app-pick-players.js`. It prints:
- `before close: 3 players so far | Cat, Bob, Ann` (joined Ann, then Bob, then Cat; shown newest first)
- `before close own chip: Bob (you)`
- `before close picks hidden: ok` (a saved open-round pick isn't in the panel)
- `before close hidden player: spectator 2 players so far, organiser 3`
- `before close 45 players: 40 shown, Show all 45`
- `after first close: table`
- `errs []`

## Notes for the builder

- `pickBoard(t, st, data)`: the `!anyClosed` branch currently returns the one-line message. Build the chips from `data.pickers`, using the same hidden filter as the table branch (`!p.hidden || org || pid === me`).
- First close time: the earliest value in `t.pickClose`.
- Keep the chips 44 px tall for organisers, since they're tappable. Spectators can't tap them, so they can be plain smaller pills.
- Look at it at 390 px with 45 names, including long ones (30 characters).

## Open questions

None.
