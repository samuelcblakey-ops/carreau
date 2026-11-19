# Season Calendar 1: organisers list a competition

- **Status:** ready to build (Sam named it "Season Calendar" and chose its scope on 19 Nov 2026; plan in the Cowork project, claude/whats-on-plan.md)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: a new "Season Calendar" block after the Hall of Fame block (`hofMarkGone`): `calPanel`, `calOpen`, `renderCalModal`, `calInput`, `calAction`, `calEntry`, `calRemove`; `renderSetup` (the panel, next to `hofPanel(t, "setup")`); the modal dispatch where `renderHofModal` / `hofAction` / `hofInput` are wired; `localStore` and `dbStore` (new store methods)
  - src/web-boot.js: `fbStore` (new store methods), `S.calCanPublish`
  - firestore.rules: new `match /calendar/{cid}`
- **Depends on:** none. First of eight: calendar-publish → calendar-page → calendar-own-events → calendar-entry-form → calendar-entries-desk → calendar-cancel → calendar-share → calendar-cleanup. Build them in that order (they all touch the same new block).

## Why
Players can't find out what competitions are coming up or how to enter. Organisers who run a competition on SN Pétanque should be able to put it on a public Season Calendar straight from Setup. This spec saves the listing; calendar-page shows it to everyone.

## What changes
- **Setup**, for the competition's organisers (the device that made it, an organiser link, or the organiser code it was made with; the admin too), not for examples or archived competitions: a "Season Calendar" panel above the Hall of Fame panel.
  - Not listed: "List this competition on the Season Calendar so players can find it and see how to enter." and a **List on the Season Calendar** button.
  - Listed: "On the Season Calendar" · level pill · country, with **Update** and **Remove** (Remove asks "Take it off the Season Calendar?" with **Remove** / **Keep it**, like `hofPanel`).
  - If the competition's name, date or venue no longer match the listing: a notice "The competition's name, date or venue has changed since it was listed." with **Update the listing**.
  - The panel isn't shown once the competition's date is more than a day past.
- **The sheet** (a modal like `renderHofModal`), titled "List on the Season Calendar" (or "Update the listing"), pre-filled from the competition:
  - Competition (read-only line: name, and the format as `hofFmtLabel` would show it)
  - Date (from the competition; required, today or later: "Pick a date from today on.")
  - Check-in from (time, optional) and Play starts (time, optional)
  - Venue (from the competition) and Address (optional, for maps)
  - Level: National / Regional / Open, the Hall of Fame's coloured buttons (`HOF_LEVELS`, `hofWord`)
  - Country and Region (optional), the Hall of Fame's select and box, defaulting to `hofDefaultCountry()`
  - Who can enter: chips, any number: Open to all, Men, Ladies, Mixed, Veterans, Juniors, Club members only, Licence required. Default: Open to all.
  - Entry fee (optional, e.g. "£5 per player"), Prizes (optional, e.g. "Prize fund £300")
  - How to enter (optional, e.g. "Call Jane on 07700 900123 or enter at the club bar")
  - Contact (optional, shown on the listing)
  - Note (optional)
  - The line "Everything here will be public."
  - **List it** / **Update the listing**, and **Cancel**.
- Saving shows the toast "Listed on the Season Calendar." (or "Listing updated."). A refused save shows "Only this competition's organisers can list it."; any other failure "That didn't save. Check your connection and try again."
- Archiving a competition marks its listing `gone` (restoring unmarks it), the same way `hofMarkGone` does, so the calendar doesn't link to it.

## Not changing
The Hall of Fame. The competition itself (no new fields on it). No public page yet (calendar-page). No events run elsewhere (calendar-own-events). No online entry (calendar-entry-form).

## Data and rules
- New collection `calendar/{cid}`. For a competition's listing, `cid` is the competition id (one listing per competition, like `hallOfFame/{tid}`).
- Fields:
  - `kind: "comp"` and `tid` (== cid)
  - `name` (≤120), `date` ("YYYY-MM-DD"), `checkin` and `start` ("HH:MM" or ""), `venue` (≤120), `address` (≤200)
  - `country` (2–8, the Hall of Fame's codes), `region` (≤60), `level` (national | regional | open)
  - `fmt` (singles | doubles | triples | melee | shooting | eurocup | clubs: the `hofFmtKey` idea, plus clubs for inter-club), `system` (`sysOf(t)`)
  - `who`: a list of strings from open, men, ladies, mixed, veterans, juniors, members, licence (≤8)
  - `fee` (≤60), `prizes` (≤120), `howTo` (≤300), `contact` (≤120), `note` (≤300)
  - `status: "on"` (calendar-cancel adds postponed and cancelled)
  - `lang`, `byUid`, `byCode`, `createdAt`, `updatedAt` (ms)
  - `hidden` (false; only the admin changes it, in calendar-page), `hiddenAt` (admin only), `gone` (bool)
- Store methods, in `localStore`, `dbStore` and `fbStore`, named like the Hall of Fame's: `watchCal(cid, cb, onErr)`, `getCal(cid)`, `setCal(cid, L)`, `updateCal(cid, patch)`, `deleteCal(cid)`, `listCal({ country })`. `listCal` uses equality filters only (`hidden == false`, and `country` when given) with `limit(300)`, like `listHof`. The repo deploys no indexes, so don't add `orderBy`.
- Rules, `match /calendar/{cid}`:
  - `get`: if the listing is missing, or not hidden, or by the admin or the listing's organisers. `list`: the admin, or `resource.data.hidden == false`.
  - `create` / `update` / `delete` for `kind == "comp"`: the admin, or the competition's organisers. Reuse the `hofOrganiser(tid)` test (it exists, isn't archived, isn't an example; owner, organiser link or its organiser code). Open testing doesn't count.
  - A shape check like `hofShape`: `keys().hasOnly([...])`, sizes, `level`, `date.matches('[0-9]{4}-[0-9]{2}-[0-9]{2}')`, `who is list && who.size() <= 8`, `hidden is bool`, `status == "on"`.
  - Organisers can't set or change `hidden` or `hiddenAt` (create with `hidden == false` and no `hiddenAt`; update keeps both), or `byUid`, `byCode` or `createdAt`.
- Existing competitions: nothing changes until an organiser lists one.

## New text
"Season Calendar", "List this competition on the Season Calendar so players can find it and see how to enter.", "List on the Season Calendar", "On the Season Calendar", "Update", "Remove", "Take it off the Season Calendar?", "Keep it", "The competition's name, date or venue has changed since it was listed.", "Update the listing", "List on the Season Calendar" (sheet title), "Date", "Pick a date from today on.", "Check-in from", "Play starts", "Venue", "Address (optional)", "Level", "Country", "Region (optional)", "Who can enter", "Open to all", "Men", "Ladies", "Mixed", "Veterans", "Juniors", "Club members only", "Licence required", "Entry fee (optional)", "e.g. £5 per player", "Prizes (optional)", "e.g. Prize fund £300", "How to enter (optional)", "e.g. Call Jane on 07700 900123 or enter at the club bar", "Contact (optional)", "Note (optional)", "Everything here will be public.", "List it", "Listed on the Season Calendar.", "Listing updated.", "Taken off the Season Calendar.", "Only this competition's organisers can list it.". Some already exist from the Hall of Fame. Reuse those keys.

Suggested translations of the name (check them against each language's existing wording): Calendrier de la saison, Calendario de la temporada, Calendario della stagione, Saisonkalender, Seizoenskalender, Calendário da época, ปฏิทินฤดูกาล.

## Acceptance checks
New `tests/app-calendar.js` (local store) and `tests/web-calendar.js` (emulators). Lines:
- `panel owner: List on the Season Calendar`
- `sheet prefill: <name> | <date> | <venue> | GB-ENG | open`
- `listed: Listed on the Season Calendar. | kind comp | level regional | who open,veterans`
- `changed notice after rename: true`
- `remove: Taken off the Season Calendar. | gone from store true`
- `archive marks gone: true | restore unmarks: true`
- `rules: owner create true | organiser link update true | stranger create false | stranger update false | stranger reads shown true`
- `rules: organiser sets hidden false | example listed false | archived competition false | bad level false`
- `no panel: spectator true | example true`
- `errs []`

## Notes for the builder
- Copy the Hall of Fame's publishing pattern closely: `hofCan`, `hofWatch` (watch the competition's listing on Setup only), `hofPanel`, `hofOpen`, `renderHofModal`, `hofEntry`, `hofAction`, `hofRemove`, `hofMarkGone`, and in web-boot.js `S.hofCanPublish` and `S.hofWho` (byUid, byCode). Call the new function `S.calCanPublish`.
- Keep times as typed ("HH:MM", the venue's local time). Don't convert time zones.
- Look at the sheet at 390 px wide. Two fields per row on desktop, one on phones.

## Open questions
None.
