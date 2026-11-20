# Results feed: bring a competition up to date from a results file

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** new `tools/feed.js`, `tools/feed.md` and `tests/web-feed.js`. No app code, unless a tiny hook is needed to reach the save functions from the page.
- **Depends on:** specs/own-draw-rounds.md, specs/own-draw-bracket.md and specs/shooting-total-only.md (all merged).

## Why

Sam is mirroring the 2026 World Championships (Khon Kaen, 21–24 Nov) on snpetanque.com. The games run through the night UK time (Sunday's rounds start at 02:00 UK).

A scheduled cloud job will read the federation's results sheets every hour and write what it read to a results file. This tool is the deterministic second half: it makes a competition match that file, through the organiser link, using SN Pétanque's own save paths. That way rules, listeners and standings behave exactly as when an organiser types the results.

## What changes

`node tools/feed.js --link <organiser link> --file <event.json> [--dry-run]`

1. Opens the organiser link in headless Chromium (the same Playwright browser the tests use) and waits until the competition has loaded with organiser rights. If it doesn't load: `feed: no organiser access` and exit code 3.
2. Reads the file (format below), compares it with the competition, and does only what's missing, in this order:
   1. Teams (or shooters) in the file but not registered: add them.
   2. Swiss rounds in the file but not in the competition: enter them with "Enter the games yourself", using the file's round name. Only add round n once rounds 1 to n−1 exist.
   3. Brackets in the file but not drawn: set them with "Set the bracket yourself".
   4. Finished games in the file whose game in SN Pétanque has no result: save the result. Use "Winner to 13" when a side has 13. Use "Ended on time" (`timed: true`) otherwise.
   5. Shooting results: totals via the total-only entry.
3. **It never overwrites.** If SN Pétanque already has a different result, round or bracket from the file, it changes nothing for that item. It prints `CONFLICT <what>: site <x>, file <y>` and exits with code 2 at the end, after doing everything else.
4. `--dry-run` prints the same plan and changes nothing.
5. It always ends with one line, e.g. `feed: +0 teams, +1 rounds, +0 brackets, +24 results, 0 conflicts`.

### File format (document it in `tools/feed.md`)

```json
{
  "kind": "swiss",
  "teams": ["Italy (ITA)", "Canada (CAN)"],
  "rounds": [
    { "name": "Round 1", "games": [ { "a": "ITA", "b": "CAN", "sa": 13, "sb": 7 }, { "a": "FRA", "b": "CHN" } ] }
  ],
  "brackets": [
    { "name": "World Championship", "lines": ["ITA v bye", "FRA v CHN"],
      "results": [ { "a": "FRA", "b": "CHN", "sa": 13, "sb": 10 } ] }
  ]
}
```

- Teams can be given by full name or by the code in brackets, as in the hand-entry boxes.
- A game with no `sa`/`sb` is listed but not played yet.
- `timed: true` marks a game that ended on time.

For shooting: `"kind": "shooting"`, with

```json
"shooting": {
  "qualifying": [ { "name": "SEN", "total": 64 } ],
  "knockout": { "lines": ["…"], "results": [ { "a": "…", "b": "…", "ta": 66, "tb": 61 } ] }
}
```

## Not changing

- The app's screens and rules.

## Data and rules

None. It writes through the organiser's existing rights.

## New text

None. This is a command-line tool, so its output stays in English.

## Acceptance checks

`tests/web-feed.js` (emulators). Make a Swiss competition with 8 teams, open its organiser link, and run the feed with a fixture file of 2 rounds:
- `feed first run: +0 teams, +2 rounds, +0 brackets, +8 results, 0 conflicts`
- `feed second run: +0 teams, +0 rounds, +0 brackets, +0 results, 0 conflicts`
- `feed conflict: CONFLICT result R1 ITA-CAN: site 13-7, file 13-9` (exit 2, and the site still says 13-7)
- `feed dry run: no writes`
- `feed bracket: set 4 lines, +2 results`
- `feed shooting totals: +4 results`
- `errs []`

## Notes for the builder

- Prefer calling the app's own functions in the page (`page.evaluate`) over clicking. Use the same functions the hand-entry boxes call, so the saved data is identical.
- Match games to results by the pair of teams within the round or bracket, not by position.
- Keep it quiet: print only the plan lines and the summary.
- The scheduled job runs in a fresh cloud checkout. It has Node 22, and Playwright's browsers are in /opt/pw-browsers.

## Open questions

None.
