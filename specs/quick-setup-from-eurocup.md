# Quick setup: switching from EuroCup to mêlée picks a usable system

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `wizFinish` (~4051) and `sysPick` in `wizPanel` (~4026) in src/carreau.html.
- **Depends on:** none

## Why

Running Quick setup again on a EuroCup competition and choosing Mêlée → Teams drawn once leaves the system on EuroCup, with no system highlighted in the wizard. The draw is then stuck at "Not ready to draw yet … 3 of at least 6 players in the squad".

## What changes

Changing to mêlée from EuroCup sets the system to Swiss, as changing from Inter-club already does.

## Not changing

Everything else in Quick setup.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-wizard.js`:
- `wizard eurocup → melee once: system swiss | draw button true`
- `errs []`

## Notes for the builder

- `wizFinish`'s mêlée-once branch maps only `clubs` to `swiss`; map `eurocup` too.
- Do the same in `sysPick`, because `wizDraft` (~4018) seeds `d.system` from `t.system`.

## Open questions

None.
