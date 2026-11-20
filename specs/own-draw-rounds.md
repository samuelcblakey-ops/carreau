# Swiss: enter a round's games yourself

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the Swiss "Draw round {n}" controls on Draw & results, a new `ownSwissRound(t, ms, lines, name)` next to `drawSwissRound` in src/carreau.html, and the round label shown on Draw & results.
- **Depends on:** none

## Why

Some events are drawn by someone else, for example a federation. The 2026 World Championships (Khon Kaen, 22 Nov) publish their own Swiss pairings for each round. An organiser who mirrors such an event on SN Pétanque has to show exactly those games. Today SN Pétanque always makes its own pairings (round 1 shuffled, later rounds by wins), so the draw shown is wrong.

## What changes

On Draw & results, for organisers in a Swiss competition (phone and desktop):

- Next to **Draw round {n}** there's a second button: **Enter the games yourself**.
- It opens a box:
  - title: **Round {n}: enter the games**
  - a text box labelled **Round name** (pre-filled "Round {n}"; the organiser can change it, e.g. "Cadrage")
  - a large text box labelled **One game per line: Team A v Team B**
  - hint under it: **"v", "vs" or "-" between the teams. You can use a team's code in brackets, e.g. ITA for "Italy (ITA)".**
  - buttons **Save round** and **Cancel**
- Matching each side of a line to a registered, active team:
  - The exact team name, ignoring capitals and accents.
  - Or a code: if the team's name ends with a code in brackets, e.g. "Italy (ITA)", then "ITA" (any case) matches it.
  - Flag emoji at the start of a team's name are ignored when matching (regional indicators U+1F1E6–1F1FF, U+1F3F4 with tag characters U+E0020–E007F, and the space after them), so "Italy (ITA)", "italy" and "ITA" all match "🇮🇹 Italy (ITA)". Error messages show the team name with its flag.
- Checks before saving (shown in the box, nothing saved until they all pass):
  - A side that matches no team: **Line {n}: no team called "{x}".**
  - A side that matches two teams: **Line {n}: "{x}" matches more than one team.**
  - A team twice in the round: **{x} is in more than one game.**
  - A team against itself: **Line {n}: a team can't play itself.**
  - Blank lines are skipped. No lines at all: **Add at least one game.**
- Warnings that don't stop saving (shown after saving, in the same place as the draw notes today):
  - Rematches: **{n} rematch(es) in this round.**
  - Active teams left out: **{n} team(s) have no game this round: {x}.** Those teams just don't play this round. They get no bye and no points.
- After saving, the round works exactly like a drawn round:
  - scores, pistes, the clock, standings and Find my game all work the same
  - Undo round works as it does today
- **Draw round {n+1}** still works afterwards. The organiser can mix drawn rounds and rounds entered by hand.
- The round name shows wherever "Round {n}" shows today for that round.

## Not changing

- How SN Pétanque draws its own rounds.
- The knockout plan (see specs/own-draw-bracket.md).
- Players and spectators: they see the round as usual.

## Data and rules

- The draw record gets `own: true` and `label` = the round name. The matches have the same shape as drawn ones (`stage: "swiss"`, `group: "R{n}"`, `round: n`, `a: [id]`, `b: [id]`), in the order typed.
- No arrays inside arrays.
- No rules changes.
- Existing competitions aren't affected.

## New text

- Enter the games yourself
- Round {n}: enter the games
- Round name
- One game per line: Team A v Team B
- "v", "vs" or "-" between the teams. You can use a team's code in brackets, e.g. ITA for "Italy (ITA)".
- Save round
- Line {n}: no team called "{x}".
- Line {n}: "{x}" matches more than one team.
- {x} is in more than one game.
- Line {n}: a team can't play itself.
- Add at least one game.
- {n} rematch(es) in this round.
- {n} team(s) have no game this round: {x}.

## Acceptance checks

Add `tests/app-own-round.js`. Set up a Swiss competition with 8 teams named "Italy (ITA)", "Canada (CAN)", "France (FRA)", "China (CHN)", "Spain (ESP)", "Japan (JPN)", "Mali (MLI)", "Benin (BEN)". It prints:

- `own round 1: ITA-CAN FRA-CHN ESP-JPN MLI-BEN` (pasted with codes, "v", "vs" and "-" mixed; games in typed order)
- `own round name: Round 1`
- `unknown team: Line 2: no team called "Narnia".`
- `twice: Italy (ITA) is in more than one game.`
- `left out: 2 team(s) have no game this round`
- `after scores standings top: <name>` (after scoring round 1, the standings leader is the team with the biggest win)
- `draw round 2 after own round: 4 games` (SN Pétanque draws round 2 normally)
- `flag name match: ITA, Italy (ITA) -> 🇮🇹 Italy (ITA)`
- `own round renamed: Cadrage` (a round entered with the name "Cadrage" shows that name on Draw & results)
- `errs []`

## Notes for the builder

- `drawSwissRound(t, ms)` returns `{ matches, draw, note }`. Make `ownSwissRound` return the same shape so the existing save path (the one used after a draw) stores it unchanged.
- Use `mkMatch` for each game, with ids `R{n}-m{i}`, as `drawSwissRound` does.
- Name matching: normalise with the same accent folding used elsewhere (search for `normalize("NFD")`).
- Look at the screenshot at 390 px: the two buttons must fit side by side or stack, with no sideways scrolling.
- Text box 16 px (no iPhone zoom).

## Open questions

None.
