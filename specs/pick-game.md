# Pick the Winner: setup, joining and picks

- **Status:** ready to build
- **Size:** one pull request (scoring and the leaderboard come next, in specs/pick-game-leaderboard.md).
- **Touches:** a new Pick the Winner section in Setup, a new Pick the Winner tab (new `renderPickPage`), the website storage layer in src/web-boot.js for the new collections, and new `match` blocks under `/tournaments/{tid}` in firestore.rules.
- **Depends on:** none

## Why

Sam wants followers of a big event to play along: each round, pick a team to win. The first use is the 2026 World Championships, where round 1 picks close on Sunday 22 Nov at 02:00 UK. Players and spectators have no accounts on SN Pétanque, so joining has to be as light as team links.

The game rules (Sam's):
- each round a player picks one team to win its game
- **a player can pick each team only once**
- the leaderboard ranks **correct picks, then best points difference**

## What changes

Website only. The Claude artifact version doesn't show any of this.

### Setup (organisers)

A new section, **Pick the Winner**:

- Checkbox **Run a Pick the Winner game for this competition**.
- Explanation (small, muted): **Each round, players pick one team to win its game. Each team can be picked only once. The leaderboard ranks right picks, then points difference.**
- A list of pick rounds. Each row has:
  - **Name**
  - **Games**: a select with "Swiss round {n}" for each planned Swiss round, and "Knockout: {round}" for each round of the plan's main bracket (Last 32, Last 16, Quarter-finals, Semi-finals, Final), using the existing round labels
  - **Picks close**: a date and a time, in this device's time zone, with the zone shown, e.g. "UK time" or "GMT+7"
  - a remove button (×, aria-label "Remove round")
- **Add the rounds from the plan** fills one row per Swiss round and one per main-bracket knockout round, with names "Round 1"… and the knockout round labels, and empty close times.
- **Add a round** adds an empty row.
- Saving with a row missing its name, games or close time shows **Each round needs a name, its games and a closing time.**

### The Pick the Winner tab (everyone)

When the game is on, a **Pick the Winner** tab appears after Standings, for everyone.

If this device hasn't joined:
- **Pick one team to win in each round. You can pick each team only once, so save the strong ones for later. One point for each right pick; points difference breaks ties.**
- **Your name** (text box, up to 30 characters) and **Join the game**.
- An empty name: **Enter your name.**
- After joining, a box: **This is your private link. Save it to play on another phone or browser.** with the link and **Copy link** (shows "Copied").
- Opening the private link on another device joins it as the same player.

When this device has joined, there's one card per pick round, in order:
- The round name, and **Picks close {day} {time}** in the viewer's local time.
- **Open**: a select **Your pick**, then **Save pick**.
  - Once that round's games exist, it lists only teams with a game in that round (byes don't count). Before then, it lists all active teams.
  - Teams already picked in another round are shown but disabled, with "(picked in {x})".
  - After saving: **Your pick: {x}**. It can be changed until the round closes.
- **Closed**: **Your pick: {x}** or **No pick**. The select is gone.
- Saving after the close time, e.g. because the page sat open: **Picks for this round have closed.**
- At the top: **You're playing as {x}** and **Show my private link**.

## Not changing

- The competition, its draw and its scores.
- Standings.
- Players and spectators who don't join see the tab, the intro and (later) the leaderboard.

## Data and rules

Tournament doc:
- `pick: { on: bool, rounds: [{ id: "p1", name, src: "swiss:1" | "ko:<bracketId>:<round>" }] }` (a list of objects).
- `pickClose: { p1: <epoch ms>, … }`, a map from round id to close time, kept in step with `rounds` on save, so rules can look it up.

New collections under `tournaments/{tid}`:
- `pickers/{pid}`: `{ name, at }`. Anyone can read it (names are public).
- A private key per player, which the private link carries. Use the team-link pattern: a device proves the key once, through a member-style doc for its uid, and is then allowed to write that player's picks. The key itself is never readable.
- `picks/{pid}_{roundId}`: `{ pid, round, team, at }`.

Rules:
- Create, update or delete a pick only for your own player, and only if `request.time` is before `pickClose[round]`.
- `team` must be a string and `round` a key of `pickClose`.
- Read a pick: your own any time. Anyone's once `request.time` is at or after `pickClose[resource.data.round]`.
- The organiser can't write anyone's picks.
- Only the organiser (canEdit) can change `pick` and `pickClose`, through the existing tournament update rule.

"Pick each team once" is stopped in the app. Scoring (next spec) also ignores any repeat, so the rules don't need to check it.

Existing competitions: `pick` is absent, so the game is off.

## New text

- Pick the Winner
- Run a Pick the Winner game for this competition
- Each round, players pick one team to win its game. Each team can be picked only once. The leaderboard ranks right picks, then points difference.
- Name
- Games
- Swiss round {n}
- Knockout: {x}
- Picks close
- Remove round
- Add the rounds from the plan
- Add a round
- Each round needs a name, its games and a closing time.
- Pick one team to win in each round. You can pick each team only once, so save the strong ones for later. One point for each right pick; points difference breaks ties.
- Your name
- Join the game
- Enter your name.
- This is your private link. Save it to play on another phone or browser.
- Copy link
- Copied
- Picks close {x}
- Your pick
- Save pick
- Your pick: {x}
- No pick
- (picked in {x})
- Picks for this round have closed.
- You're playing as {x}
- Show my private link
- Open
- Closed

## Acceptance checks

App test `tests/app-pick-setup.js`:
- `pick setup rows from plan: Round 1, Round 2, Round 3, Last 16, Quarter-finals, Semi-finals, Final` (Swiss 3 rounds, main bracket of 16)
- `pick setup missing time: Each round needs a name, its games and a closing time.`
- `pick list round 1: 16 teams` (no games yet: all active teams)
- `pick list after draw: only teams with a game` (a bracket round: byes left out)
- `used team disabled: Italy (ITA) (picked in Round 1)`
- `errs []`

Web test `tests/web-pick-rules.js` (emulators), printing allowed/denied for each:
- `own pick before close: allowed`
- `own pick after close: denied`
- `change pick after close: denied`
- `pick for another player: denied`
- `read another's open pick: denied`
- `read another's closed pick: allowed`
- `second device with private link writes pick: allowed`
- `wrong key joins: denied`
- `organiser writes a player's pick: denied`
- `errs []`

## Notes for the builder

- Copy the team-link join flow: `members/{uid}` with `role: 'team'` and `private/teamcodes` in firestore.rules, and how the app stores and reads a team link. Use a separate member-style collection (e.g. `pickdev/{uid}: { pid, key }`), so pick players never get any scoring rights in `members`.
- Close times: store epoch ms. In rules, use `timestamp.value(...)`.
- Cost: the World Championships may draw hundreds of players, and Firebase is on a £25 budget. Listen only to this player's own picks. Load other players' picks per closed round once (they can't change after close), not as live listeners.
- Time zones: show the organiser's zone in Setup. Show close times to players in their own local time.
- Phones first: 44 px controls, 16 px text boxes, nothing scrolls sideways at 390 px. Look at the screenshots of the tab before and after joining.

## Open questions

None.
