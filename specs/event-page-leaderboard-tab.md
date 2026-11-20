# Event pages: the Pick the Winner leaderboard as its own tab

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - in src/carreau.html: `renderEvent`, `evRO`, `evGo`, `drawEventHeader` and `EV_ICON`
  - the event boot (reading the URL hash)
  - `renderPickPage` (event page only: leave out the board when the event has a board tab)
  - src/events/worlds2026.json
  - tests/web-event-page.js
- **Depends on:** specs/event-page.md, event-page-share.md and event-page-visitor-polish.md (all merged: #194, #198, #199).

## Why

Sam (20 Nov, 22:08): "can we also have the leaderboard as a separate item on the menu?" On snpetanque.com/worlds2026 the leaderboard sits at the bottom of the Picks tab, under How to play, the join form and your own picks. Followers who just want to see who's winning have to scroll past all that, and there's no link straight to it to share.

## What changes

### A new event tab view, "board"

- **In the event file**, a tab can have `"view": "board"` (with the game's `tid`). For worlds2026, add it **second**, so the menu reads **Picks · Leaderboard · Triples · Nations Cup · Shooting**:
  - `{ "key": "board", "label": "Leaderboard", "tid": "tkpo1655", "view": "board", "icon": "board" }`
- **The Leaderboard tab shows:**
  - a **Leaderboard** heading
  - the same leaderboard as the Picks tab today (`pickBoard`): the Place / Name / Right / Diff table, the stage row, flags per stage, tapping a name for the detail, and the subtitle ("{n} players so far" / "After {x}")
  - then the event foot (note, Run your own competition, Go to SN Pétanque), as on the other tabs
- **It behaves like the Picks tab for permissions:** treat `"board"` like `"pick"` in `evRO()`, so the admin keeps Hide / Delete player there and a player's own row still shows "(you)". Visitors get no organiser controls, as now.
- **It loads the game's data** the same way the Picks tab does: the same competition, so switching between Picks and Leaderboard doesn't reload anything.
- **The menu:**
  - The bottom bar on phones and the tab row on desktop get the new tab.
  - The label is **Leaderboard** on both. Five tabs must fit at 390 px with no sideways scroll; at 360 px and below the existing 10 px short-label rule applies.
  - New icon `EV_ICON.board`: a simple line podium or trophy, in the same style as the others.

### The Picks tab, on event pages only

When the event has a `board` tab for the same competition, the Picks tab **leaves out the leaderboard panel**. In its place, under the join form (or under your picks once joined), there's a button-styled link:
- **See the leaderboard**

It opens the Leaderboard tab. The "Run your own competition" card stays where it is. On the main site (snpetanque.com/#tkpo1655), the Pick the Winner tab is unchanged and still shows the leaderboard.

### Links straight to a tab

- **snpetanque.com/worlds2026#leaderboard** opens the Leaderboard tab. Also accept the tab keys: `#pick`, `#board`, `#triples`, `#nations`, `#shoot`.
- Tapping a tab updates the hash with `history.replaceState` (no new history entries), using `#leaderboard` for the board tab and the tab key for the others. Copying the address then gives a link to that tab.
- A Pick the Winner private link (`/worlds2026#<key>`) still opens the Picks tab as that player. Check that no tab name can be mistaken for a private key, and the other way round.
- An unknown hash opens the first tab, as now.

## Not changing

- Scoring, joining, picking, hiding and deleting.
- The leaderboard's look.
- The main site's Pick the Winner tab.
- The share card and og tags (still the event's).

## Data and rules

None saved. The event file gets one more tab.

## New text

- See the leaderboard

("Leaderboard" already exists.)

## Acceptance checks

Extend `tests/web-event-page.js`. Print:
- `event tabs: Picks | Leaderboard | Triples | Nations Cup | Shooting`
- `leaderboard tab: table with Place Name Right Diff: true`
- `picks tab has no board: true | See the leaderboard -> board tab: true`
- `#leaderboard opens board: true`
- `tap Triples -> hash #triples: true`
- `private link still opens Picks as the player: true`
- `admin on board tab: Delete player shown: true | visitor: false`
- `main site pick tab still has the board: true`
- `390 px, 5 tabs: no sideways scroll`
- `errs []`

## Notes for the builder

- `evRO()` is `view !== "pick"` today; make it `!["pick", "board"].includes(view)`.
- In `evGo`, a `board` tab sets `S.tab = "pick"` (or whatever the Picks tab sets) so the game state and watchers are the same.
- Look at it at 390 px and 360 px with long names, and in French. "Classement" will be wider.

## Open questions

None.
