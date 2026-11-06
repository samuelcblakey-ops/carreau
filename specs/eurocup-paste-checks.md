# EuroCup: pasting squads gets the same checks as typing them

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the EuroCup bulk-paste branch of the Registration add-form submit handler in src/carreau.html.
- **Depends on:** none

## Why

Pasting clubs and squads (`Club: Player (W), …`) skips the form's checks:
- the same club pasted twice is added twice
- the same player twice in a squad is accepted
- more than 40 players are silently cut to 40

These only come to light at the draw or the next squad edit.

## What changes

- Paste refuses a club that's already entered, and a squad with the same name twice, with the same messages the form uses.
- A squad over 40 players is refused with "A club can have up to 40 players."

## Not changing

The paste format.

## Data and rules

None.

## New text

"A club can have up to 40 players.", in 8 languages, unless the form already has such a message.

## Acceptance checks

Extend `tests/app-eurocup.js`:
- `paste same club twice: refused | clubs 1`
- `paste duplicate player: refused`
- `paste 45 players: refused | message A club can have up to 40 players.`
- `errs []`

## Notes for the builder

The form's own checks are in the same submit handler's EuroCup squad branch; reuse them.

## Open questions

None.
