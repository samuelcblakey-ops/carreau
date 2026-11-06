# Changing a morning result after the knockouts are drawn asks first

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `recordResult` (~2326), `overrideBox` (~3006) and the score dialog's correction note, in src/carreau.html.
- **Depends on:** none

## Why

When a Swiss, snake, barrage, league or round robin result is corrected after the afternoon knockouts have been drawn, it saves silently. The standings change (a semi-finalist can drop to 6th), but the knockouts keep the old qualifiers, and nothing says so. The score dialog even promises "you'll be asked to confirm an override".

## What changes

In that situation, Update result shows a notice instead of saving straight away, in the same box used for other corrections that change who went through:
- the existing heading "This correction changes who went through."
- then: "The knockouts were drawn from these standings. Saving keeps them as they are. To redraw them, cancel and use Undo bracket first, while no knockout game has finished."
- buttons "Save anyway" (saves the correction, knockouts unchanged) and "Cancel".

Show it only when the correction changes who qualified for a knockout or their seed. If that's hard to work out reliably, show it for any corrected result in a stage that has knockouts drawn from it.

## Not changing

Corrections inside the knockouts, which already use the override box. Corrections before any knockout is drawn.

## Data and rules

None.

## New text

- "The knockouts were drawn from these standings. Saving keeps them as they are. To redraw them, cancel and use Undo bracket first, while no knockout game has finished."
- "Save anyway"

## Acceptance checks

Extend `tests/app-features.js` (or add `tests/app-correction-after-ko.js`):
- Swiss 8 teams, 2 rounds, semi-finals of the top 4 drawn. Change a round-2 result so a semi-finalist drops out of the top 4:
  - `swiss correction after ko: notice true | saved before confirm false`
  - `save anyway: standings changed true | semi-finals unchanged true`
- Barrage (round robin) into knockouts by pool place: `barrage correction after ko: notice true`
- `errs []`

## Notes for the builder

- `recordResult` (~2326–2349) only checks games linked by `next`/`lnext` and the French-poule follow-ons.
- `startKnockouts` (~2236) and `koEntrants` snapshot the entrants with no link back to the morning results.
- Return `{ blocked }` with the new notice and handle "Save anyway", as the existing override flow does.

## Open questions

None.
