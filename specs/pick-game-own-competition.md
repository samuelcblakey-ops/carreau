# Pick the Winner: invite players to run their own competition

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `renderPickPage` (one card at the bottom) in src/carreau.html.
- **Depends on:** specs/pick-game.md and specs/pick-game-leaderboard.md merged first.

## Why

Sam is using Pick the Winner on the 2026 World Championships to bring players and club organisers to snpetanque.com. Organiser login is off (since 20 Nov), so anyone can start a competition straight away. The game page should invite them to.

## What changes

On the Pick the Winner tab, below the leaderboard, a card for everyone who isn't an organiser of this competition (phone and desktop):

- heading **Run your own competition**
- text **SN Pétanque is free for clubs and organisers: draws, pistes, live scores and standings on every phone.**
- button **Start a competition**, which opens the same new-competition quick setup as "+ New" in the header
- a small muted link under it, **How it works**, to how-it-works.html

Organisers of this competition don't see the card.

## Not changing

- The game, the leaderboard and the header's "+ New".

## Data and rules

None. Don't add any tracking: the site promises "No cookies, no tracking".

## New text

- Run your own competition
- SN Pétanque is free for clubs and organisers: draws, pistes, live scores and standings on every phone.
- Start a competition
- How it works (already exists; reuse it)

## Acceptance checks

Extend `tests/app-pick-setup.js` (or the leaderboard test). It prints:
- `pick cta spectator: Run your own competition`
- `pick cta opens quick setup: step 1 of 4`
- `pick cta organiser: hidden`
- `errs []`

## Notes for the builder

- Reuse the handler behind the header's "+ New" button, so this follows any future changes to creating a competition.
- Look at it at 390 px under a long leaderboard: the button must be at least 44 px tall.

## Open questions

None.
