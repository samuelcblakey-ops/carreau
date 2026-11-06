# EuroCup screens say clubs, ties and rounds, with correct plurals

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the EuroCup text in `renderEntries`, the EuroCup line in `renderSetup` (~3966), `renderDraw`'s count line (~4312) and its Plan the rounds note (~4416), and the team links panel. All in src/carreau.html.
- **Depends on:** none

## Why

EuroCup is built on inter-club, and several lines still say teams and fixtures, without plurals:
- Before the draw: "2 teams entered · 2 clubs → 1 fixtures", "4 entered teams haven't checked in", "Check in at least 2 teams".
- Setup: "(2 clubs → 1 ties)".
- Draw & results: "6 ties over 1 rounds".
- Plan the rounds: "Pistes are filled from any day, earliest day first."
- Team links: "2/2 teams have a link".

## What changes

For EuroCup only:
- "2 clubs entered → 1 tie" (or "3 ties")
- "4 entered clubs haven't checked in"
- "Check in at least 2 clubs"
- Setup "(2 clubs → 1 tie)"
- "6 ties over 3 rounds" / "1 tie over 1 round"
- "Pistes are filled from any round, earliest round first."
- "2/2 clubs have a link"

## Not changing

Inter-club wording.

## Data and rules

None.

## New text

Each changed line above, in 8 languages.

## Acceptance checks

Extend `tests/app-eurocup.js`:
- `eurocup wording: 2 clubs entered → 1 tie | no "teams" | no "1 ties" | no "1 rounds"`
- `fr eurocup wording: no English`
- `errs []`

## Notes for the builder

`isEuro(t)` tells EuroCup apart from inter-club. Keep the inter-club text as it is.

## Open questions

None.
