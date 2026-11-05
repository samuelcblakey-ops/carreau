# Mêlée "teams drawn once": team names in the organiser's language

- **Status:** ready to build
- **Size:** one pull request
- **Touches:** `drawMeleeTeams` in src/carreau.html (the `name: \`Team ${i + 1}\`` line); `tests/app-melee.js`
- **Depends on:** none

## Why

With Mêlée style "teams drawn once", the app names the teams "Team 1", "Team 2" and so on in English, and saves those names. So a French organiser's teams stay "Team 3" on every screen, including the big screen and the stream.

## What changes

- When the teams are drawn (and redrawn), each one is named in the language the organiser's screen is using at that moment, from the existing "Team" key: English "Team 1", French "Équipe 1", Spanish "Equipo 1", Italian "Squadra 1", German "Team 1", Dutch "Team 1", Portuguese "Equipa 1", Thai "ทีม 1".
- The names are saved like that. They're data, so everyone sees them in the organiser's language, just like names the organiser types.

## Not changing

Competitions that already exist keep their saved names. Typed team names, renaming, and every other format are unchanged.

## Data and rules

None. The name is still a string.

## New text

None. "Team" is already in all 8 languages.

## Acceptance checks

Extend `tests/app-melee.js`, which already draws teams once:

- `drawn names en: Team 1, Team 2`
- `drawn names fr: Équipe 1, Équipe 2`. Switch to French before "Draw teams" on a second competition.
- `drawn names th: ทีม 1`
- `redraw keeps language: Équipe 1`. Use "Redraw teams" while in French.
- `errs []`

## Notes for the builder

- Use `tr("Team")` when the teams are built: `` name: `${tr("Team")} ${i + 1}` ``. In English, `tr` returns its input.
- Check that "Redraw teams" goes through `drawMeleeTeams` too.
- The existing expectation `/teams drawn: teams 5 sizes 23333 players kept 14/` must still pass.

## Open questions

None.
