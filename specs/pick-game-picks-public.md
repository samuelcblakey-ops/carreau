# Pick the Winner: everyone's picks shown by name, as soon as they're saved

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - the `picks` read rule in firestore.rules
  - the pick board loader in src/web-boot.js
  - `pickBoard` in src/carreau.html, both branches: the players-so-far list and the table
  - one line under Save pick
  - one sentence on public/privacy.html
- **Depends on:** specs/pick-game-players-so-far.md merged first (same panel).

## Why

Sam's decision (20 Nov): for the 2026 World Championships he wants the Pick the Winner page to show **each player's name and what they've picked**, visible to everyone **as soon as a pick is saved**, not only once the round closes. He wants the buzz of seeing who's backing whom, and accepts that players can copy each other.

Layout he chose: **a row per player, with every round's pick as a flag, and ✓ or ✗ once the result is in.**

## What changes

### Who can see picks

- Everyone, spectators included, can read every pick as soon as it's saved.
- Writing is unchanged: only your own player, and only before that round closes.

### The Leaderboard panel (phone and desktop)

Each player's row shows their name, then a line of **pick chips**, one per pick round in round order:

- **Picked, result not in yet:** the team's flag, e.g. 🇫🇷.
- **Right:** flag + ✓.
- **Wrong:** flag + ✗.
- **No pick for a closed round:** "–".
- **No pick yet for an open round:** no chip. The line simply ends.
- **A team with no flag in its name** (Chinese Taipei): show its code from the brackets instead, e.g. "TPE". If there's no code either, show the name's first three letters.
- **Each chip's aria-label and title:** "{round}: {team}", plus " · right" or " · wrong" when scored. The chip itself stays tiny.
- Chips **wrap onto a new line** under the name. Nothing scrolls sideways at 390 px, even with all 10 rounds.

**Before any round has closed** (the players-so-far view):
- each name becomes a row: name, "(you)" where it's the viewer, then their chips
- still newest first, still "{n} players so far" and Show all after 40

**After a round has closed** (the table):
- the chips sit under the name in the Name cell
- Place / Right / Diff stay as they are
- tapping a name still opens the full detail

Hidden players: unchanged. They aren't shown to others, and the organiser sees them faded.

### Under the pick select

A small muted line under **Save pick**: **Everyone can see your pick.**

### Privacy page

On public/privacy.html, where it says what others can see, add one sentence: **In a Pick the Winner game, the name you play under and your picks are shown to everyone following that competition.**

## Not changing

- Joining, the "each team once" rule, close times, scoring, the ranking and the hide button.

## Data and rules

- firestore.rules: the `picks/{id}` read rule becomes `allow read: if notArchived(tid) || isAdmin();`, with no close-time condition. Create, update and delete stay exactly as they are.
- Loader:
  - Keep loading closed rounds' picks once per round; they can't change.
  - Add one live listener for **open rounds' picks only**: a query on `round in [open round ids]`, at most 10.
  - When a round closes, drop it from the live query and keep what's loaded.
  - That keeps reads down: Firebase is on a £25 budget, and the game may draw hundreds of players.

## New text

- Everyone can see your pick.
- {x}: {x} (the chip label; reuse existing wording if a pattern exists)
- right
- wrong
- In a Pick the Winner game, the name you play under and your picks are shown to everyone following that competition. (privacy page)

## Acceptance checks

App test (extend `tests/app-pick-scores.js` or `tests/app-pick-players.js`). It prints:
- `open round chips: Ann 🇫🇷 | Bob 🇮🇹` (both picked for open Round 1; no marks yet)
- `chip no flag: TPE`
- `closed chips: Ann 🇫🇷✓ 🇮🇹✗ – 🇪🇸` (R1 right, R2 wrong, R3 closed with no pick, R4 open with a pick)
- `chip label: Round 1: 🇫🇷 France (FRA) · right`
- `pick note: Everyone can see your pick.`
- `390 px, 10 rounds, 30-char name: no sideways scroll`
- `errs []`

Web test: update `tests/web-pick-rules.js`.
- `read another's open pick: allowed` (was denied)
- `spectator with no player reads picks: allowed`
- `pick for another player: denied` (unchanged)
- `own pick after close: denied` (unchanged)
- `read picks of an archived competition: denied`

## Notes for the builder

- The flag is the leading run of regional-indicator / tag characters in `entName(t, id)`. The flag-font spec's ranges are U+1F1E6–1F1FF, U+1F3F4 and U+E0020–E007F.
- Rules change live on merge, so run `scripts/check.sh --web pick-rules` and look at both allowed and denied lines.
- Look at the panel at 390 px before and after a close, with 45 players and long names.

## Open questions

None.
