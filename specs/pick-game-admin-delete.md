# Pick the Winner: the admin can delete a player

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - the player detail and chip controls in `pickBoard` in src/carreau.html
  - a `deletePicker(t, pid)` in the pick game storage in src/web-boot.js
  - the admin competition delete in src/web-boot.js
  - the delete rules for the pick game collections under `/tournaments/{tid}` in firestore.rules
- **Depends on:** specs/pick-game-picks-public.md merged first (same panel and rules file).

## Why

On the live World Championships game (snpetanque.com/#tkpo1655), repeated taps on Join created four players called "Teat", and Sam also made a "Sam Test". Sam wants the admin to **delete** players, not just hide them.

This follows the site rule: only the admin deletes. Organisers keep **Hide from the leaderboard**.

## What changes

For **the admin only** (signed in at #admin), wherever a player's controls appear (the tapped row's detail in the table, or a tapped chip before the first close):

- A **Delete player** button, next to Hide / Show, styled as a destructive ghost button.
- Tapping it shows an inline confirm: **Delete {x} and all their picks? This can't be undone.** with **Delete** and **Keep**.
- **Delete** removes, for that player:
  - `pickers/{pid}`
  - every pick of theirs (`picks/{pid}_*`)
  - their private key doc
  - every device-link doc pointing at that pid
- The player vanishes from the leaderboard for everyone, along with the "players so far" count.
- **The deleted player's own phone** shows the join form again the next time it loads, or straight away if it's open: its saved player id and link are cleared quietly. If they open their old private link: **This player has been removed. Join again with your name.**
- Organisers who aren't the admin see no Delete button, only Hide / Show as now.

Also: when the admin deletes a whole competition (the existing admin delete), its pick game data goes too: players, keys, picks and device links. Today they're left behind.

(Order change from Sam, 18:40: specs/pick-game-table-always.md ships first, so the controls are on the table rows; the name chips are gone.)

## Not changing

- Joining, picking, hiding, scoring.

## Data and rules

firestore.rules: `allow delete: if isAdmin();` on the pick game collections (`pickers`, `picks`, the private key collection and the device-link collection).
- The existing delete rule for a player's own pick before close stays as it is.
- Nobody else gains delete rights.

## New text

- Delete player
- Delete {x} and all their picks? This can't be undone.
- Delete (reuse it if it already exists)
- Keep (reuse it if it already exists)
- This player has been removed. Join again with your name.

## Acceptance checks

Web test: extend `tests/web-pick-rules.js`.
- `admin deletes player, picks, key, device links: allowed`
- `organiser deletes a player: denied`
- `player deletes another player: denied`
- `player deletes own player doc: denied`
- `admin deletes competition: pick data gone`

App test (`tests/app-pick-scores.js` or the players test):
- `admin sees Delete player: true`
- `organiser sees Delete player: false`
- `confirm text: Delete Teat and all their picks? This can't be undone.`
- `after delete: 5 players so far` (from 6)
- `deleted player's device: join form shown`
- `errs []`

## Notes for the builder

- Batch the deletes. A player has at most about 10 picks, so a single batched write is fine.
- After merging, don't touch the live duplicates yourself. Sam or the planning session will delete them with the new button.

## Open questions

None.
