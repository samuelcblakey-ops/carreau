# Pick the Winner: one tap, one player (join once)

- **Status:** ready to build (urgent: the World Championships game is live)
- **Size:** one pull request.
- **Touches:** `pickAction` `pk-join` and the join button in `renderPickPage` (src/carreau.html); `S.pickGame.join` (src/web-boot.js)
- **Depends on:** specs/pick-game-fixes-join-repeat.md

## Why

On the live game, Sam's phone created FOUR players named "Teat" within 130 ms (pickers 5D642ASP, 9VKM9V5R, LZ5UUK62, SGQEFTE8, all at 2026-11-20T17:59:50.9Z). Joining was slow with no feedback, so repeated taps each started a join and all went through.

## What changes

1. While a join is in progress the button is disabled and reads **Joining…** (new text, 8 languages), and `pk-join` ignores further taps/submits until it finishes.
2. `S.pickGame.join` refuses to create a second player for a device that already has one in this competition: if a join is already in flight or a player exists for this device, it returns that player instead.

## Not changing

- The existing duplicate players on the live competition (the planning session will deal with those).
- Rules, data, scoring.

## New text

- Joining…

## Acceptance checks

The tests print:
- `join tapped 4 times fast: 1 player`
- `join button while joining: Joining… (disabled)`
- `device with a player joins again: same player`
- `errs []`
