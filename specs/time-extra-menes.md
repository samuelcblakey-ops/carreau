# Organisers choose how many mènes follow the time limit

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the time limit field in `renderSetup`; the `data-set` handler in the main click handler (save `timeExtra` as a number); the last step ("Pistes") of `wizPanel`, plus `wizDraft` and `wizFinish`; the "Ended on time" notice in `renderModal` and the level-score error in `modalAction`; the `keep` list in the `use-template` action; new `tests/app-timed-games.js`; `tests/run.js`.
- **Depends on:** none

## Why

When time runs out, organisers have to tell players what happens next: finish the mène in progress, then play one or two more. Pétanque England's 2025 rules say two more, and some clubs and countries play one. Setup and Quick setup both ask for a time limit, but neither has anywhere to say which. The score box also still says "end" rather than "mène".

## What changes

Setup tab, organisers, phone and desktop:

- When the time limit is above 0, a new block appears under "Time limit (minutes, 0 = none)":
  - the label "When time is up"
  - a segmented control (the `seg()` helper) with "+1 mène" and "+2 mènes". "+2 mènes" is selected for every competition that hasn't chosen yet.
  - a help line underneath. With +2: "Players finish the mène in progress and play two more. If it's still level, they play one extra mène." With +1: "Players finish the mène in progress and play one more. If it's still level, they play one extra mène."
- When the time limit is 0, the block is hidden. It appears as soon as the organiser sets a limit, without leaving Setup.
- A run-through made from a competition (`use-template`) copies the choice, as it does `timeLimit`.

Quick setup (the wizard), organisers, phone and desktop:

- The last step ("Pistes") gets the same choice under "Time limit (minutes, 0 = none)":
  - the label "When time is up"
  - the options "+1 mène" and "+2 mènes", drawn as Quick setup's own option buttons (the `opt` helper). "+2 mènes" is selected to start with.
  - the same help line as in Setup
- It shows as soon as a time limit above 0 is typed, without tapping Next, and hides again at 0. Typing mustn't move the cursor out of the box.
- Precision shooting has no time limit in Quick setup, so it has no choice either.
- Finish saves the choice along with the time limit.
- Running Quick setup again from Setup (`wiz-again`) starts from the competition's saved choice.

Score box in "Ended on time" mode, for anyone who can enter scores:

- The notice becomes "Ended on time: enter the score once the extra mènes are played. If it's still level, play one more mène first." It was "…when play stopped. If it's level, play one more end first."
- The error for a level score becomes "Level when time ran out: play one more mène, then enter the score." It said "end".

## Not changing

- How a result ended on time is saved and shown ("Ended on time", the facts card).
- Quick setup's four steps and their order.
- Shooting competitions, which have no time limit.
- There's no clock yet: that's specs/time-round-clock.md.

## Data and rules

- New competition field `timeExtra`: the number 1 or 2. A missing field means 2. `data-val` arrives as a string, so convert it before saving.
- Quick setup keeps the choice in its draft (`S.wiz.d.timeExtra`, starting from the competition's value or 2). `wizFinish` saves it as a number, next to `timeLimit`.
- No rules change. Existing competitions read as +2.

## New text

- When time is up
- +1 mène
- +2 mènes
- Players finish the mène in progress and play one more. If it's still level, they play one extra mène.
- Players finish the mène in progress and play two more. If it's still level, they play one extra mène.
- Ended on time: enter the score once the extra mènes are played. If it's still level, play one more mène first. (replaces the old key; re-key its 7 translations)
- Level when time ran out: play one more mène, then enter the score. (replaces the old key; re-key its 7 translations)

## Acceptance checks

New `tests/app-timed-games.js` (an app test, like the others), with its regexes in tests/run.js:

- `setup time 0: extra mènes shown false`
- `setup time 60: When time is up | +1 mène / +2 mènes | pressed +2 mènes`
- `help +2: Players finish the mène in progress and play two more. If it's still level, they play one extra mène.`
- `tap +1: saved 1 number | help Players finish the mène in progress and play one more. If it's still level, they play one extra mène.`
- `run-through keeps +1: true`
- `quick setup time 0: when time is up shown false`
- `quick setup time 45 typed: When time is up | +1 mène / +2 mènes | on +2 mènes | cursor still in the box true`
- `quick setup +1 finished: time 45 | extra 1 number`
- `quick setup again: on +1 mène`
- `quick setup shooting: when time is up shown false`
- `quick setup phone 390: options 44+ px true | no sideways scroll true`
- `ended on time notice: Ended on time: enter the score once the extra mènes are played. If it's still level, play one more mène first.`
- `level refused: Level when time ran out: play one more mène, then enter the score.`
- `fr setup: translated true` (the label and both buttons differ from the English)
- `phone 390: no sideways scroll true`
- `errs []`

Check that tests/app-quick-score.js and tests/app-wizard.js still pass. In app-quick-score.js, the `/level refused: Level when time ran out/` regex and the French line should still match.

## Notes for the builder

- `seg(name, cur, opts)` draws `data-set`/`data-val` buttons. The generic `data-set` branch in the main click handler stores `dataset.val` as it comes, which is a string.
- **Quick setup.**
  - The `opt(k, v, label)` helper in `wizPanel` draws `data-act="wiz-set"` buttons. The `wiz-set` action reads the typed boxes first (`wizRead`), stores `dataset.v` as a string, then redraws.
  - To show the choice while a limit is being typed, show or hide the block on the box's `input` event. A full redraw there would take the cursor out of the box.
  - tests/app-wizard.js shows how to drive the wizard (`#wz-time`, `wiz-next`, `wiz-set`).
- Translations: French has "mène" already. In other languages, use the word for an end that the existing time-limit texts use (for example es "mano", de "Aufnahme").
- Screenshots at 390 px: Setup with a 60-minute limit, and Quick setup's last step with a 45-minute limit.

## Open questions

None.
