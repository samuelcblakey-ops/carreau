# Pick the Winner: the leaderboard table from the start (no name chips)

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `pickBoard` in src/carreau.html (the "no round closed yet" branch, and each player's picks in the table).
- **Depends on:** specs/pick-game-picks-public.md merged first (#190, same function).

## Why

Sam's decision (20 Nov, 18:40): before the first close, the leaderboard shows name "bubbles" (chips). He wants the real leaderboard table from the start, filled in with the scoring columns, so it looks the same before and after results come in. The admin delete (specs/pick-game-admin-delete.md, next) then lives on the table rows.

Sam, 18:41: "I want the picks to be shown as flags for each stage of the competition that each person has saved so far."

## What changes

On the Pick the Winner tab, once at least one player has joined, the Leaderboard panel **always** shows the table: **Place / Name / Right / Diff**. That includes before any round has closed.

- **Before any round has closed:**
  - every row shows Right **0** and Diff **0**
  - Place shows **–** for everyone (no places until there's something to rank)
  - rows are in the table's usual order, which is alphabetical when everyone is level
- **Above the table, before the first close:** the subtitle **{n} players so far** (or **1 player so far**) and the line **Places start when the first round's picks close: {x}.**, as now.
- **After the first close:** exactly as today, with places, Right and Diff from the results. The subtitle is "After {x}".
- **Tapping a name** opens the detail, as now: picks, and Hide / Show for organisers. The admin delete will go here.
- **The name chips are removed.** So is their "Show all {n}" button, unless the table already pages long lists. If it doesn't, show the first 40 rows and a **Show all {n}** button that shows the rest.
- With no players: **No one has joined yet.**, as now.

### Each player's picks: a fixed strip, one slot per stage (18:41)

In the table, each player's picks are a **fixed** strip with one slot per pick round, in round order, lined up across all rows (not a list that shifts when a round is skipped):

- Under each player row, a second row spanning all 4 columns with the strip. One slot per round, about 30 px each, so 10 slots fit at 390 px with no sideways scroll.
- Above the first player, a matching header strip of short stage labels: "Round n" → "R{n}"; Cadrage → "Cad"; Last 32 / Last 16 → "L32" / "L16"; Quarter-finals → "QF"; Semi-finals → "SF"; Final → "F"; any other name → its first 3 letters. Give each label a title and aria-label with the full round name.
- Slot contents: the picked team's flag (or its code, e.g. "TPE", when the name has no flag) for any saved pick, open or closed; a small ✓ or ✗ once the result is in; "–" for a closed round with no pick; an empty slot (faint dot) for an open round not picked yet.
- Each slot's title / aria-label: "{round}: {team}", plus " · right" or " · wrong".
- This replaces the chip line under the name from picks-public: keep that information, just in fixed slots.

## Not changing

- Scoring, ranking, picks-public, joining, hiding.

## Data and rules

None.

## New text

None. It reuses existing strings.

## Acceptance checks

Update the players-so-far lines in the app test:
- `before close: table | 3 players so far | Ann – 0 0, Bob – 0 0, Cat – 0 0`
- `before close flags under names: Ann 🇫🇷`
- `before close no chips: true`
- `after first close: places shown` (as before)
- `45 players: 40 rows, Show all 45`
- `stage header: R1 R2 R3 R4 R5 Cad L16 QF SF F`
- `slots fixed: Bob skipped R2 -> R3 flag in slot 3`
- `390 px, 10 slots: no sideways scroll`
- `errs []`

## Notes for the builder

- `pickScores` already returns rows with right 0 and diff 0 when no round has closed. Render them with place "–" while `!anyClosed`.
- Look at it at 390 px with 45 players and long names.

## Open questions

None.
