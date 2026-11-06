# Knockout plan names: translated, and no doubled labels

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `planPresets` (~2182) and the plan editor; the knockout game label (`matchContext`), only for the doubled-name case. All in src/carreau.html.
- **Depends on:** none

## Why

- In the knockout plan editor, the default names "Main knockout", "Plate" and "Silver" show in English text boxes in every language. They're stored as data and shown as input values, which the translator can't reach.
- The "Semi-finals (top 4)" preset names its knockout "Semi-finals", so games read "Semi-finals · Semi-finals" and "Semi-finals · Final". "Final (top 2)" gives "Final · Final".

## What changes

- When a knockout's name is one of the default English names, the editor's box shows it in the chosen language. It's saved back in English unless the organiser types a different name.
- The "Semi-finals (top 4)" and "Final (top 2)" presets name their knockout "Main knockout".
- For existing competitions, a game label leaves out the knockout's name when it's the same as the round's name.

## Not changing

Names organisers typed themselves.

## Data and rules

Stored names stay as they are; new presets store "Main knockout".

## New text

None.

## Acceptance checks

Extend `tests/app-ko-seeding.js` (or `tests/app-features.js`):
- `fr plan editor names: Tableau principal | Complémentaire`
- `preset top 4 game labels: Main knockout · Semi-finals | Main knockout · Final`
- `existing semi-finals named bracket: Semi-finals | no doubling`
- `errs []`

## Notes for the builder

- Preset names come from `planPresets`.
- The doubled label comes from joining the bracket name and the round name.

## Open questions

None.
