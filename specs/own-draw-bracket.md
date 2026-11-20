# Knockouts: set a bracket yourself

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `createBracket` (a new `fixed` option) and the knockout-drawing controls on Draw & results (knockout plan brackets, knockout-only competitions and the precision shooting knockout) in src/carreau.html.
- **Depends on:** specs/own-draw-rounds.md merged first (same area of Draw & results).

## Why

Events drawn by someone else, like the 2026 World Championships, publish their own knockout brackets. SN Pétanque always builds the bracket from its own standings, so an organiser mirroring such an event can't show the real bracket.

Examples:
- The World Championship bracket: 8 teams with byes, 8 cadrage games, last 16 onwards.
- The Nations Cup last 16.
- The precision shooting quarter-finals.

## What changes

On Draw & results, for organisers, wherever SN Pétanque draws a knockout bracket today (phone and desktop):
- the knockout plan's brackets after the morning
- a knockout-only competition
- the precision shooting knockout

There's a second button there: **Set the bracket yourself**. With a plan of several brackets (e.g. main and second), each bracket gets its own button, so one can be drawn normally and another set by hand.

The box:
- title: **{x}: set the bracket** ({x} = the bracket's name)
- a large text box labelled **One first-round game per line, top of the bracket first: Team A v Team B**
- hint: **Write "bye" for a team that goes straight through, e.g. "Italy v bye". You need 2, 4, 8, 16 or 32 lines.**
- buttons **Save bracket** and **Cancel**

Team matching is the same as in specs/own-draw-rounds.md: exact name ignoring capitals and accents, or the code in brackets. Any active team can be used, not only the plan's rank range.

Flag emoji at the start of a team's name are ignored when matching (regional indicators U+1F1E6–1F1FF, U+1F3F4 with tag characters U+E0020–E007F, and the space after them), so "Italy (ITA)", "italy" and "ITA" all match "🇮🇹 Italy (ITA)". Error messages show the team name with its flag.

Checks before saving:
- the wrong number of lines: **A bracket needs 2, 4, 8, 16 or 32 first-round games. You have {n}.**
- an unknown or ambiguous team: the same messages as specs/own-draw-rounds.md
- a team twice: **{x} is in more than one game.**
- a line with two byes: **Line {n}: a game needs at least one team.**

After saving:
- Games are placed top to bottom in the typed order, exactly as typed (no seeding, no flipping).
- A team with a bye goes straight to the next round, as byes do today.
- Winners move on as usual.
- The third-place play-off setting still applies.
- The bracket view, standings, Hall of Fame and the big screen work as for a drawn bracket.
- Undo bracket works as it does today, while no game has finished.

For precision shooting the button reads **Set the knockout yourself**. Shooters are matched by name, or by code in brackets, the same way.

## Not changing

- Normal seeded or random bracket drawing.
- Swiss and pools.
- Scores.

## Data and rules

- Bracket matches have the same shape as today. The bracket's draw record gets `own: true`.
- No arrays inside arrays.
- No rules changes.
- Existing competitions aren't affected.

## New text

- Set the bracket yourself
- Set the knockout yourself
- {x}: set the bracket
- One first-round game per line, top of the bracket first: Team A v Team B
- Write "bye" for a team that goes straight through, e.g. "Italy v bye". You need 2, 4, 8, 16 or 32 lines.
- Save bracket
- A bracket needs 2, 4, 8, 16 or 32 first-round games. You have {n}.
- Line {n}: a game needs at least one team.

## Acceptance checks

Add `tests/app-own-bracket.js`. It prints:

- `own bracket 16 lines: r1 games 8, byes 8` (a 32-size bracket: 8 "X v bye" lines and 8 real games, typed in mixed order)
- `own bracket order kept: line 1 top = Italy (ITA)`
- `bye advanced: Italy (ITA) in r2`
- `winner moves on: r2 has <name>` (score a first-round game and the winner appears in round 2)
- `wrong count: A bracket needs 2, 4, 8, 16 or 32 first-round games. You have 3.`
- `second bracket drawn normally while main set by hand: ok`
- `shooting knockout set by hand: 4 duels`
- `errs []`

## Notes for the builder

- `createBracket(t, bid, name, entrants, opts)` places entrants with `seedOrder(size)` and `flip`. Add `opts.fixed = [{ a: id|null, b: id|null }, …]` (a list of objects, not pairs, for Firestore). When it's set, skip the seeding, `flip` and `groupOf` steps, and fill round 1 from the list in order. Keep the bye handling that's already there (`m.a && !m.b` gives `done/bye` and advances).
- `drawShootKnockout` calls `createBracket` and sets `m.shoot = true` on each match. Do the same for the hand-set version.
- Look at the bracket screenshots at 390 px and on desktop.

## Open questions

None.
