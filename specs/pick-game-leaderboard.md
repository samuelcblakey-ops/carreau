# Pick the Winner: scoring and leaderboard

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `renderPickPage` (adds the leaderboard and right/wrong marks), a new `pickScores(t, ms, pickers, picks)`, and the `pickers` rule in firestore.rules (organiser hide).
- **Depends on:** specs/pick-game.md merged first.

## Why

Players need to see how they're doing. Sam's ranking: **correct picks, then best points difference**.

## What changes

On the Pick the Winner tab, for everyone, whether they've joined or not:

**Leaderboard** section, with the heading **Leaderboard** and the subtitle **After {x}** (the latest closed round with any finished games).

Columns: **Place**, **Name**, **Right**, **Diff**.

Ranking:
1. Right picks, most first.
2. Points difference, highest first.
3. Players level on both share the place, shown with "=", e.g. "=3".

Scoring each pick:
- A pick counts once its round has closed and the picked team's game in that round has finished.
  - "Its game in that round": for `swiss:{n}`, the team's game in Swiss round n. For `ko:{bracket}:{r}`, its game in that bracket round.
- **Right**: the picked team won that game.
- **Diff**: the picked team's score minus its opponent's, so a wrong pick takes points off. Games ended on time count by their final score.
- The team had no game in that round (a bye, knocked out, or sitting out): 0 right, 0 diff.
- A team picked in more than one round counts only in the earliest of those rounds. Later picks of it score 0.
- A corrected result updates the leaderboard.

More on the tab:
- **The viewer's own row** is highlighted, with **(you)** after the name.
- **Tapping a name** opens that player's closed picks: round, team, ✓ or ✗, and the game's score, e.g. "Round 2 · Italy (ITA) ✓ 13–7". Picks for open rounds aren't shown.
- **The joined player's own round cards** (from specs/pick-game.md) now show **✓ Right ({x})**, **✗ Wrong ({x})**, where {x} is the score, or **Waiting for the result**.
- **Organisers** see a **Hide from the leaderboard** button on each player when they tap a name (for unsuitable names), or **Show on the leaderboard** if hidden. Hidden players don't show for anyone else. The player still sees their own cards.
- **No players yet:** **No one has joined yet.**
- **Before any round has closed:** **The leaderboard starts when the first round's picks close.**

## Not changing

- Joining and picking (specs/pick-game.md).
- Competition standings.

## Data and rules

- Nothing new is saved for scores: they're computed from the matches and the picks.
- `pickers/{pid}` gets an optional `hidden: bool`. Only the organiser (canEdit) can change it. The rules let canEdit update `hidden` only (`diff().affectedKeys().hasOnly(['hidden'])`).

## New text

- Leaderboard
- After {x}
- Place
- Right
- Diff
- (you)
- ✓ Right ({x})
- ✗ Wrong ({x})
- Waiting for the result
- Hide from the leaderboard
- Show on the leaderboard
- No one has joined yet.
- The leaderboard starts when the first round's picks close.

## Acceptance checks

App test `tests/app-pick-scores.js`.

Fixture: teams A, B, C, D in a Swiss competition with 2 rounds entered as follows. Pick rounds: p1 = `swiss:1` and p2 = `swiss:2`, both closed.
- Round 1: A 13–5 B, C 13–11 D.
- Round 2: A 13–9 C, B 13–2 D.

Picks (p1, p2):
- Ann: A, B
- Bob: C, A
- Fay: C, A
- Cat: B, A
- Dan: D, C
- Eve: A, A (a repeat)

It prints:
- `scores: Ann 2 +19, Bob 2 +6, Fay 2 +6, Eve 1 +8, Cat 1 -4, Dan 0 -6`
- `places: 1 Ann, =2 Bob, =2 Fay, 4 Eve, 5 Cat, 6 Dan`
- `wrong pick diff: Cat round 1 -8`
- `repeat team: Eve round 2 counts 0`
- `bye pick: 0 right 0 diff` (a separate small case: a pick whose team has a bye in that round)
- `open round not shown: ok` (a third round, still open, is left out of another player's view)
- `corrected result updates: Ann 1 +10, Eve 0 -1` (change round 1 A 13–5 B to B 13–12 A)
- `errs []`

Web test: extend `tests/web-pick-rules.js`:
- `organiser hides player: allowed`
- `player hides another: denied`
- `organiser renames player: denied`

## Notes for the builder

- Read the closed rounds' picks once per round (see the cost note in specs/pick-game.md). Recompute scores when matches change, which the app already listens to.
- Look at the leaderboard at 390 px with long names (30 characters).

## Open questions

None.
