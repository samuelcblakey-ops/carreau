# Pick the Winner: only the admin can set a game up

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - the Pick the Winner section of Setup in src/carreau.html (the renderer behind `pick-on`, `pk-from-plan`, `pk-row-add` and `pk-rows-save`)
  - the `match /tournaments/{tid}` update rule in firestore.rules
- **Depends on:** none

## Why

Sam's decision (20 Nov, 18:36): Pick the Winner is a one-off for the 2026 World Championships (snpetanque.com/#tkpo1655), not a feature for every organiser.

In that game, organisers and players are the same: nobody but the admin needs any game controls. Today any organiser can switch a pick game on for their own competition in Setup.

## What changes

- **In Setup**, the Pick the Winner section (the switch, the rounds editor and Save rounds) shows **only to the admin**. Other organisers don't see it at all.
- **Competitions that already have a game** keep working for players and spectators: the Picks tab, joining, picking and the leaderboard are unchanged. Only the admin can change or switch off their setup.

## Not changing

- The game itself.
- Hide / Show on the leaderboard (organisers keep it; in the Worlds game that's only Sam anyway).
- The admin delete (specs/pick-game-admin-delete.md).

## Data and rules

firestore.rules, in the tournaments update rule: a change that touches `pick` or `pickClose` is allowed only for `isAdmin()`.

Use `request.resource.data.diff(resource.data).affectedKeys().hasAny(['pick', 'pickClose'])`, the same way `flagsOk` guards `featured` and `listed`.

Every other organiser update stays as it is. That includes the hourly results updater, which writes through the Worlds competition's organiser link and never touches `pick`.

## New text

None.

## Acceptance checks

App test (extend `tests/app-pick-setup.js`):
- `setup pick section admin: shown`
- `setup pick section organiser: hidden`
- `errs []`

Web test: extend `tests/web-pick-rules.js`.
- `organiser switches pick game on: denied`
- `organiser changes pickClose: denied`
- `admin switches pick game on: allowed`
- `organiser updates name with a pick game present: allowed` (unrelated organiser edits still work)

## Notes for the builder

- The setup tests that used an organiser to turn the game on need the admin instead. Keep their checks the same.

## Open questions

None.
