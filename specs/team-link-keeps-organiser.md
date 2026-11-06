# An organiser who opens a team link keeps organiser control

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `joinTeam` in src/web-boot.js (~369). Only if needed, the team-phone checks in `applyProposals` (~1577) and `checkPanel` (~1689) in src/carreau.html.
- **Depends on:** none

## Why
When the competition's owner taps a team's link on their own phone (to check it works), the phone becomes that team. It gets the "My team" panel, loses "To check", and stops publishing confirmed team scores; they stay unpublished. An organiser-link phone that opens a team link drops to the three spectator tabs and can no longer edit. The only way back is to reopen the organiser link.

## What changes
A phone that already runs the competition (owner, organiser link or code, or admin) keeps that role when it opens a team link. It still publishes team scores and keeps "To check". Show a short notice instead: "You run this competition, so this phone stays an organiser. Open the team link on the team's phone."

## Not changing
Team links on phones that don't run the competition.

## Data and rules
None.

## New text
"You run this competition, so this phone stays an organiser. Open the team link on the team's phone." in 8 languages.

## Acceptance checks
Extend `tests/web-team-scoring.js`:
- `owner opens team link: role organiser | to check shown | notice shown`
- `team proposes, other team confirms: published by the owner's phone true`
- `organiser-link phone opens team link: can still edit true`
- `errs []`

## Notes for the builder
`joinTeam` overwrites the phone's role without checking whether it already runs the competition.

## Open questions
None.
