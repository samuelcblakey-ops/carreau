# Results feed

`tools/feed.js` makes a competition on snpetanque.com match a results file. It opens the competition's
**organiser link** in headless Chromium and uses SN Pétanque's own save paths, so rules, listeners and standings
behave exactly as when an organiser types the results in.

```bash
node tools/feed.js --link "https://snpetanque.com/#<competition>.<code>" --file event.json
node tools/feed.js --link "…" --file event.json --dry-run   # print the plan, save nothing
```

Needs Node 22 and Playwright (`npm install`; in a cloud session the browser is already in `/opt/pw-browsers`).

## What it does

In this order, only what's missing:

1. **Teams (or shooters)** in `teams` that aren't registered: adds them (checked in, if check-in is on).
2. **Swiss rounds** not in the competition yet: entered as with *Enter the games yourself*, with the file's round
   name. Round n is only added once rounds 1 to n−1 exist. A round with no games is skipped (not drawn yet).
   Shooting: the qualifying scorecards are made once the file has qualifying totals.
3. **Brackets** not drawn yet: set as with *Set the bracket yourself*. A file bracket goes to the knockout with the
   same name in the knockout plan, otherwise to the plan's knockout in the same position (first file bracket →
   first knockout in the plan).
4. **Finished games** whose game on the site has no result. *Winner to 13* when a side has 13, *Ended on time*
   otherwise. Games are matched by the pair of teams within the round or bracket, not by position. Knockout
   winners move on as each result is saved, so later-round results in the same file go in on the same run.
5. **Shooting totals**, through the total-only entry: qualifying totals, then knockout duels.

**It never overwrites.** A result, round or bracket on the site that differs from the file is left alone and printed:

```
CONFLICT result R1 ITA-CAN: site 13-7, file 13-9
```

Something in the file it can't use (an unknown team, 13-13, a shooting duel level on totals that needs a
shoot-out) is printed as `BAD <what>: <why>` and left alone too.

It prints one line per change (`+ team …`, `+ round …`, `+ bracket …`, `+ result …`, `+ total …`), the
CONFLICT and BAD lines, and always ends with one summary line:

```
feed: +0 teams, +1 rounds, +0 brackets, +24 results, 0 conflicts
```

(`, 2 not usable` is added when there are BAD lines; `(dry run, nothing saved)` on a dry run.)

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Done: the competition matches the file (as far as the file goes). |
| 1 | Couldn't run: unreadable file, browser or page didn't load. Nothing or only part was done; safe to run again. |
| 2 | Done everything it could, but there are CONFLICT or BAD lines to look at. |
| 3 | `feed: no organiser access`: the link didn't give organiser rights (wrong or old code, or a spectator link). |

Running it again is always safe: a second run with the same file prints just `feed: +0 teams, … 0 conflicts`.

## File format

```json
{
  "kind": "swiss",
  "teams": ["🇮🇹 Italy (ITA)", "Canada (CAN)"],
  "rounds": [
    { "name": "Round 1", "games": [ { "a": "ITA", "b": "CAN", "sa": 13, "sb": 7 }, { "a": "FRA", "b": "CHN" } ] }
  ],
  "brackets": [
    { "name": "World Championship", "lines": ["ITA v bye", "FRA v CHN"],
      "results": [ { "a": "FRA", "b": "CHN", "sa": 13, "sb": 10 } ] }
  ]
}
```

- `kind`: `"swiss"`, `"knockout"` (brackets only) or `"shooting"`.
- Teams are given by full name or by the code in brackets, as in the hand-entry boxes: `"ITA"`, `"Italy"`,
  `"Italy (ITA)"` and `"🇮🇹 Italy (ITA)"` all mean the team registered as "🇮🇹 Italy (ITA)". Capitals, accents
  and flags don't matter. New teams are registered exactly as written in `teams`, so put the flag first there.
- `rounds[i]` is round i+1. `name` is the round's name on the site (default "Round n").
- A game with no `sa`/`sb` is listed but not played yet. `timed: true` marks a game that ended on time (a score
  below 13 is always saved as ended on time).
- `brackets[].lines`: first-round games, top of the bracket first, `"bye"` for a team that goes straight through.
  2, 4, 8, 16 or 32 lines. `results` can include later rounds.

### Shooting

```json
{
  "kind": "shooting",
  "teams": ["🇸🇳 Senegal (SEN)", "🇫🇷 France (FRA)"],
  "shooting": {
    "qualifying": [ { "name": "SEN", "total": 64 } ],
    "knockout": { "lines": ["SEN v FRA", "…"], "results": [ { "a": "SEN", "b": "FRA", "ta": 66, "tb": 61 } ] }
  }
}
```

- Totals are whole numbers from 0 to 100, saved with the total-only entry.
- A duel level on totals needs the shoot-out typed in by hand; the feed prints it as BAD and leaves it.
- The knockout goes into the competition's shooting knockout (top 8 or top 16). A "qualifying → final" competition
  has no knockout to set.

## Scheduled runs

The scheduled job runs it every hour in a fresh cloud checkout:

```bash
npm ci --silent && node tools/feed.js --link "$ORGANISER_LINK" --file event.json
```

Treat exit code 2 as "look at the CONFLICT lines", and 1 as "try again next hour".
