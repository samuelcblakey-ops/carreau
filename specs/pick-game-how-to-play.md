# Pick the Winner: a "How to play" panel (rules, scoring, when to pick)

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the intro / join panel at the top of `renderPickPage` in src/carreau.html, plus a new `pickHowTo(t)`.
- **Depends on:** specs/pick-game-fixes-join-repeat.md merged first (same function).

## Why

Sam wants the Pick the Winner page to explain the game: how it works, how it's scored and **when you need to choose your teams by**.

Today there's one sentence. For the 2026 World Championships, picks lock **once a day**: all of Sunday's rounds at Sun 02:00 UK, Monday's knockouts at Mon 03:00, and Tuesday's at Tue 03:00. Players must know to pick the night before.

## What changes

At the top of the Pick the Winner tab, for everyone (phone and desktop), a **How to play** panel:
- It's a `<details>` element, **open** for anyone who hasn't joined and **closed** for joined players, whose summary reads "How to play".
- It replaces today's one-sentence intro. The join form stays below it, in its own panel, as now.

### How to play (heading)

- **Pick one team to win in each round.**
- **You can pick each team only once in the whole game.**
- **You can change a pick until it closes.**

### When to pick (subheading)

One line per close time, grouping rounds that close together, in round order. Each line reads **{x}: picks close {x}**. The first {x} lists the round names, joined with the viewer's language list format (`Intl.ListFormat`, type "conjunction"). The second {x} is the day and time in the viewer's local time, in the same format as "Picks close" on the cards.

For the World Championships that gives:
- Round 1, Round 2, Round 3, Round 4 and Round 5: picks close Sun 22 Nov, 02:00
- Cadrage, Last 16 and Quarter-finals: picks close Mon 23 Nov, 03:00
- Semi-finals and Final: picks close Tue 24 Nov, 03:00

More:
- A closed group gets **(closed)** after it, in muted text.
- Under the lines: **Times are in your time zone.**

### Scoring (subheading)

- **1 point for each pick whose team wins its game in that round.**
- **Players level on points are split by points difference: the score difference of each picked team's game. A win adds the margin and a loss takes it away (13–7 is +6, 9–13 is −4).**
- **A pick scores nothing if its team has no game in that round (a bye, or already knocked out), or if you've already used that team in an earlier round.**
- **Results are added as they come in, and the leaderboard updates on its own.**

## Not changing

- Joining, picking, scoring, the leaderboard and the "Run your own competition" card.

## Data and rules

None. It reads `t.pick.rounds` and `t.pickClose`.

## New text

- How to play
- Pick one team to win in each round.
- You can pick each team only once in the whole game.
- You can change a pick until it closes.
- When to pick
- {x}: picks close {x}
- (closed)
- Times are in your time zone.
- Scoring
- 1 point for each pick whose team wins its game in that round.
- Players level on points are split by points difference: the score difference of each picked team's game. A win adds the margin and a loss takes it away (13–7 is +6, 9–13 is −4).
- A pick scores nothing if its team has no game in that round (a bye, or already knocked out), or if you've already used that team in an earlier round.
- Results are added as they come in, and the leaderboard updates on its own.

The old intro sentence ("Pick one team to win in each round. You can pick each team only once, so save the strong ones for later. One point for each right pick; points difference breaks ties.") is no longer used. Leave its translations in place: they're harmless.

## Acceptance checks

App test (extend `tests/app-pick-setup.js`). Use rounds R1–R3 closing together, then a Final closing a day later. It prints:
- `how to play open before joining: true`
- `how to play closed after joining: true`
- `when to pick: Round 1, Round 2 and Round 3: picks close <day time> | Final: picks close <day time>`
- `closed group marked: (closed)` (a past close time)
- `french list format: Round 1, Round 2 et Round 3` (in French, round names stay as the organiser typed them)
- `390 px: no sideways scroll`
- `errs []`

## Notes for the builder

- Group rounds by identical `pickClose` value. Sort the groups by time, and keep round order within a group.
- Round names go through `tr()` like elsewhere on the page.
- Look at the panel at 390 px, open and closed, and in one other language.

## Open questions

None.
