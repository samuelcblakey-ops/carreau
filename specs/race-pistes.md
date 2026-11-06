# One game per piste, even when two organisers finish games at once

- **Status:** needs answers (see Open questions)
- **Size:** one pull request.
- **Touches:** `assignCourts` in src/carreau.html (and the court write in the "save-final" undo in `modalAction`), plus a new check in `watchMatches`; `deleteTournament` in the Firestore store in src/web-boot.js; a new `match /pistes/{cid}` block inside `match /tournaments/{tid}` in firestore.rules; new `tests/web-race-pistes.js`.
- **Depends on:** specs/race-draw-once.md merged first (both change firestore.rules and `deleteTournament`).

## Why

When two organisers finish different games at the same moment, each phone hands the freed pistes out from its own copy of the draw. Two waiting games can end up on one piste while another piste stays free. The same happens when an organiser who was offline reconnects, and the pistes their phone handed out while offline arrive on top of newer ones. Players are sent to a piste that's already in use.

## What changes

- Online: a piste is given to a game only if, on the server, nobody else holds it and that game hasn't already been given a piste. If another phone got there first, this phone plans again from the latest draw. Every free piste still goes to a waiting game.
- After an offline phone reconnects, two games may still share a piste, because both were already announced. Any organiser's or scorer's phone that sees this fixes it straight away:
  - the game that got the piste first keeps it;
  - the other game moves to a free piste if there is one, otherwise back to waiting;
  - organisers see a toast: "Piste {x} had two games. {x} moved to Piste {x}." or "Piste {x} had two games. {x} is waiting for a piste."
- Undo on "Result saved." still gives the game its piste back (#101).

## Not changing

- Which game goes to which piste (`planCourts`: order, rest between rounds, EuroCup club holds, random pistes).
- Moving a game to a piste by hand.
- The from-disk version (Claude artifact, local store): one device, so it hands pistes out as now.

## Data and rules

- New documents `tournaments/{tid}/pistes/{courtId}` = `{ mid, at }`: the game that last took this piste. A piste is free when its document is missing, or when its game is finished, has gone, or is no longer on that piste. So the code that clears `court` (a result saved, an Undo, a knockout reset) doesn't need to touch these documents.
- Rules, inside `match /tournaments/{tid}`:
  - `match /pistes/{cid}`: read if `notArchived(tid) || isAdmin()`;
  - write if `(canScore(tid) && notArchived(tid)) || isAdmin()`, with keys only `mid` and `at`.
- Existing competitions: the first assignment after this creates the documents. Games already on pistes keep them.
- The admin's delete of a competition also deletes its `pistes` documents.

## New text

- "Piste {x} had two games. {x} moved to Piste {x}."
- "Piste {x} had two games. {x} is waiting for a piste."

## Acceptance checks

First write the test and run it against main to show the race. Put that output in the pull request ("before").

`tests/web-race-pistes.js`, using `tests/two-organisers.js`. Swiss, 16 teams, 5 pistes, round 1 drawn: 5 games on pistes and 3 waiting.

- 5 tries, each time A and B save results for two different games on pistes, together:
  - `two results together, 5 tries: one game per piste 5 of 5 | no free piste while a game waits 5 of 5`
- A goes offline and saves a result (its phone gives the freed piste to a waiting game), B saves another result online, then A reconnects:
  - `offline result after sync: one game per piste true | toast Piste \d+ had two games\.`
- `undo after result: game back on its piste true`
- rules, called straight on the store:
  - `rules: follower piste write permission-denied | scorer piste write allowed true`
- `errs []`

Also run `app-quick-score.js` and `app-busy-day.js`. They must still pass.

## Notes for the builder

- Root cause: `assignCourts` runs `planCourts` on this phone's copy (`MS()`), then writes `court` with `updateMatch`, without checking the server.
- New store method `takePiste(tid, mid, cid)` in the Firestore store, using `runTransaction`. It reads `pistes/{cid}`, the game holding it (if any) and game `mid`. If the piste is held by an unfinished game that is still on it, or `mid` is done or already on a piste, it refuses. Otherwise it writes the piste document and `{ court, courtAt }` on the game. Stores without `takePiste` (local store, `dbStore`) keep `updateMatch`.
- In `assignCourts`, if any `takePiste` is refused, wait for the next matches snapshot and plan again, at most 2 more times.
- Offline (`navigator.onLine === false`): assign as now with `updateMatch`, and also write the piste documents.
- The fix-up after a reconnect runs in `watchMatches` on a remote snapshot (`meta.remote`), only on phones that `canScore()`. "Got it first" means the earlier `courtAt` (if equal, the lower game id). It moves the other game with `takePiste` (or clears its `court` in a transaction that checks it's still on that piste), so two phones fixing it at once do it once.
- The "save-final" undo in `modalAction` writes `court` straight onto a game. Route that through `takePiste` too.
- Rules change: this goes live on merge. The rules lines in the acceptance checks cover both what's allowed and what's denied.
- Screenshots: Draw & results on both phones after each part, at 390 px and on desktop.

## Open questions

1. After an offline phone reconnects and two games share a piste, should the app move the later game to a free piste on its own and tell the organisers (what this spec says), or only warn the organisers and let them choose? Either way, both games' players were already sent to that piste, so someone has to walk over and tell one game to move.
