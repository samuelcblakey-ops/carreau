# Organisers choose which games the time limit covers

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - in src/carreau.html:
    - a new helper beside `timeUp` that says whether a game is timed
    - `timeUp`, `clockRounds` and `clockPanel`
    - the time limit block in `renderSetup`
    - the last step ("Pistes") of `wizPanel`, plus `wizDraft` and `wizFinish`
    - the `keep` list in the `use-template` action
    - the translation tables
  - tests/app-timed-games.js; tests/run.js
- **Depends on:** specs/clock-per-leg.md merged first.

## Why

Many competitions time the morning games and play the knockouts out, or time everything except the last rounds. Today the time limit covers every game, so the organiser gets clocks and "Time" badges on games that have no limit.

## What changes

### Setup

When the time limit is above 0 and the competition can have knockouts, a new block appears under "When time is up":

- the label "Time limit covers"
- four options, with "All games" selected for every competition that hasn't chosen:
  - "All games"
  - "Morning games only"
  - "Afternoon knockouts only"
  - "Up to a knockout stage"
- a help line underneath, for the selected option:
  - All games: "Every game has the time limit."
  - Morning games only: "Games before the knockouts have the time limit. Knockout games are played out."
  - Afternoon knockouts only: "Knockout games have the time limit. Games before them are played out."
  - Up to a knockout stage: "Every game has the time limit until the knockouts reach the stage you choose. From then on, games are played out."
- with "Up to a knockout stage", a drop-down labelled "No time limit from", with "Last 16", "Quarter-finals", "Semi-finals" and "Final". "Semi-finals" is selected to start with.

Which competitions get which options:

- **Swiss, snake, barrage, leagues and round robin** (the systems in `PLAN_SYSTEMS`, including teams drawn once that then play one of them): all four.
- **Straight knockout:** only "All games" and "Up to a knockout stage".
- **Mêlée with new teams each round, inter-club and EuroCup:** the block isn't shown, and the limit covers every game.
- **Precision shooting:** no time limit, as now.

The stage applies to every knockout of the competition (main, plate and so on), each by its own rounds. A third-place game goes with its final.

### Quick setup

The last step gets the same block under "When time is up", drawn with Quick setup's own option buttons (the `opt` helper) and the same drop-down. The same rules decide whether it shows and which options it has. It appears as soon as a limit above 0 is typed, like the "When time is up" choice. Finish saves it, and running Quick setup again starts from the saved choice.

### Draw & results

- A round the time limit doesn't cover gets no clock row, and its games never show the "Time" badge, on their cards or on the Pistes tiles.
- If games are on pistes and the limit covers none of them, the panel shows one line under "Timed games · 60 min": "No time limit for the games being played." Organisers and scorer links see it, as with the clock.
- Changing the choice in Setup takes effect straight away, even with a clock running. A round that's no longer covered loses its row and badges. If it's covered again, its clock shows again with the same end time.

### Run-throughs

A run-through made from a competition (`use-template`) copies the choice, as it does `timeLimit` and `timeExtra`.

## Not changing

- There's still one number of minutes for the competition.
- The "+1 mène / +2 mènes" choice.
- The score box: "Ended on time" stays available for any game.
- How a clock row works.

## Data and rules

- New competition field `timeScope`: "all", "morning", "ko" or "stage". A missing field means "all".
- New competition field `timeKoFree`: a number from 1 to 4, read only when `timeScope` is "stage". It's how many of a knockout's last rounds have no limit: 1 is the final only, 2 from the semi-finals, 3 from the quarter-finals, 4 from the last 16. A missing field means 2. Save it as a number.
- A saved choice that doesn't fit the competition's system reads as "all" (for example "morning" in a straight knockout).
- No rules change. Existing competitions read as "all".

## New text

- Time limit covers
- All games
- Morning games only
- Afternoon knockouts only
- Up to a knockout stage
- Every game has the time limit.
- Games before the knockouts have the time limit. Knockout games are played out.
- Knockout games have the time limit. Games before them are played out.
- Every game has the time limit until the knockouts reach the stage you choose. From then on, games are played out.
- No time limit from
- No time limit for the games being played.
- Last 16, Quarter-finals, Semi-finals and Final are already translated.

## Acceptance checks

Extend tests/app-timed-games.js.

Setup:

- `setup swiss 60 min: Time limit covers | All games / Morning games only / Afternoon knockouts only / Up to a knockout stage | pressed All games`
- `setup time 0: covers shown false`
- `setup straight knockout: All games / Up to a knockout stage`
- `setup mêlée, inter-club, eurocup: covers shown false false false`
- `stage chosen: No time limit from | Last 16 / Quarter-finals / Semi-finals / Final | selected Semi-finals | saved stage 2 number`
- `run-through keeps the choice: true`
- `fr setup: translated true`
- `phone 390: no sideways scroll true | options 44+ px true`

Draw & results (Swiss morning, then knockouts of 8 teams):

- `morning only, swiss round on pistes: rows Round 1`
- `morning only, knockout on pistes: rows 0 | No time limit for the games being played. | badges 0`
- `knockouts only, swiss round on pistes: rows 0 | No time limit for the games being played.`
- `knockouts only, knockout on pistes: rows 1 | quarter-finals true`
- `up to the semi-finals: quarter-finals row true | semi-finals row false | final row false | third-place badge false`
- `up to the final, plate knockout: plate semi-finals row true | plate final row false`
- `choice changed while a clock runs: row gone true | back with the same end time true`

Quick setup:

- `quick setup swiss 45 typed: covers shown true | on All games | cursor still in the box true`
- `quick setup stage, quarter-finals, finished: scope stage | free 3 number`
- `quick setup again: on Up to a knockout stage | Quarter-finals`
- `quick setup eurocup and shooting: covers shown false false`
- `errs []`

## Notes for the builder

- **Which games are timed.** Write one helper, used by both `timeUp` and `clockRounds`. A knockout game has `m.stage === "ko"`, and its bracket's `rounds` gives the number of rounds; `roundLabel(R, r)` shows how the stage names are worked out. With `timeKoFree` as `free`, a knockout game has no limit when `rounds - m.round < free`.
- **Which systems.** `sysOf(t)` and `PLAN_SYSTEMS`.
- **Setup at 390 px.** `seg()` with four options has to wrap without sideways scrolling, with each option at least 44 px high.
- **Quick setup.** Show or hide the block on the time box's `input` event, as `#wz-extra` does, so the cursor stays in the box.
- **Screenshots** at 390 px: Setup with "Up to a knockout stage", Quick setup's last step, and Draw & results with the "No time limit" line.

## Open questions

None.
