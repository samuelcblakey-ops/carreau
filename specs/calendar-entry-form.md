# Season Calendar 4: players enter online

- **Status:** ready to build (Sam, 19 Nov 2026: online entry in the first version; first come, first served by default with an "I'll approve each entry" choice; "Who's entered" is the organiser's choice)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: the Season Calendar block (an Entries section in the sheet; the entry form, "Your entries" and "Who's entered" on the full listing; the "Entries open" chip and row line on the page); `localStore` and `dbStore` (entry methods)
  - src/web-boot.js: `fbStore` (entry methods), the #admin site switch "Season Calendar online entry", `SITE.calendarEntry`
  - firestore.rules: `match /calendar/{cid}` (new listing fields) and new `/entries/{eid}`, `/teams/{eid}`, `/contacts/{eid}` under it; `calEntryOn()`
  - public/privacy.html: a Season Calendar section
- **Depends on:** specs/calendar-own-events.md merged first.

## Why
Players should be able to enter a competition from its listing, and see whether they've got a place, without phoning round. Competitions can only be changed by their organisers (open testing has been off since 19 Nov), so entries need their own way in, and must never be written into the competition. Contact details must stay private, because competitions and listings are public.

## What changes
- **Site switch** in #admin, next to the streaming and team score switches: "Season Calendar online entry: Off / Admin only / Everyone". It saves as `config/site.calendarEntry` (`false` | `"admin"` | `true`) and is **Off** by default. Sam turns it on after the rest of the Season Calendar specs, up to calendar-cleanup, have shipped and been checked on the live site. While it's off, nothing below shows to anyone but the admin (when set to Admin only).
- **The sheet** (both kinds of listing) gains an "Entries" section:
  - **Players can enter online on SN Pétanque** (tick). It's only offered when the format is singles, doubles, triples, mêlée or precision shooting. For EuroCup, inter-club and Other: "Online entry isn't available for this format yet."
  - Then: Places (number, blank for no limit), Entries close (date, default the day before the event; it can't be after the event's date), **I'll approve each entry**, and **Show who's entered on the listing**.
- **On the page:**
  - Rows of listings with online entry show "Enter online · closes Thu 20 Nov", or "Entries closed".
  - A chip "Entries open" filters to listings taking online entries now.
- **On the full listing**, when online entry is on:
  - A places line: "20 of 32 places taken · entries close Thu 20 Nov", "Full · 3 on the waiting list", "18 entered" (no limit), or "Entries closed".
  - A bar like the check-in meter (`.meter`) when there's a limit.
  - **Enter online** (while entries are open) opens the form:
    - Singles: Player name. Doubles or triples: Team name (optional) and Player 1…N. Mêlée or shooting: Your name.
    - Club (optional).
    - "Phone or email for the organiser" (required).
    - Then the line: "Your team and player names will be shown on this listing. Your phone or email goes to the organiser only." (the first sentence only when "Who's entered" is on).
    - **Send my entry**, and **Cancel**.
    - Problems: "Name every player.", "Add a phone number or email so the organiser can reach you.", "This phone has already sent 5 entries for this competition.", "Entries have closed."
    - Sent: the toast "Entry sent."
  - **Your entries**: this device's entries for the listing. Each shows the team name and one of:
    - "You have a place ({n} of {x})", or "You have a place" (no limit)
    - "On the waiting list (number {n})"
    - "Waiting for the organiser to accept it"
    - with **Edit** (while entries are open) and **Withdraw**. Withdraw asks "Withdraw this entry? Your place goes to the next team." and gives the toast "Entry withdrawn."
    - An entry that has gone (removed by the organiser) shows once: "This entry was withdrawn or removed."
  - **Who's entered** (when the organiser shows it): a fold with the teams in queue order (number, team name, players, club), then a "Waiting list" heading for the rest. Teams waiting for approval aren't listed.

## Not changing
The competition and its Registration (calendar-entries-desk adds online entries there). No payments. No emails or notifications.

## Data and rules
- New listing fields: `online` (bool), `places` (int 0–512, 0 = no limit), `closesAt` (ms, end of the chosen day on the organiser's device), `approve` (bool), `showEntrants` (bool). Rules: `online == true` only when `fmt` is singles, doubles, triples, melee or shooting.
- Each entry is three documents, written together in one batch, with the same id `eid = <device uid>_<1..5>` (so each device can make at most 5 per listing):
  - `calendar/{cid}/entries/{eid}`: `{ uid, at, status, queuedAt }`. Public, with no names in it, so anyone can count places and see the queue. `at` is the server time (`request.time`). `status` is `"in"`, or `"pending"` when the listing has `approve`. `queuedAt` is the server time when the entry joins the queue: on create for `"in"`, and when an organiser accepts a pending one.
  - `calendar/{cid}/teams/{eid}`: `{ name, players, club }` (name ≤60, players: a list of 1–3 strings ≤60, club ≤60).
  - `calendar/{cid}/contacts/{eid}`: `{ contact }` (≤120). Never public.
- **The queue:** `"in"` entries ordered by `queuedAt`, then `at`, then id. The first `places` have a place, and the rest are the waiting list. A withdrawal moves everyone behind up by one. Nothing has to enforce the cap when an entry is made, and rules can't count documents anyway.
- **Rules:**
  - `calEntryOn()`: `config/site.calendarEntry == true`, or `== "admin"` and `isAdmin()`.
  - Entries are open when the listing's `online == true`, `hidden != true`, `status == "on"` and `request.time.toMillis() < closesAt`, and `calEntryOn()`.
  - `entries/{eid}`:
    - `get` and `list`: anyone.
    - `create`: signed in; `eid.matches(request.auth.uid + '_[1-5]')`; keys only uid, at, status, queuedAt; `uid == request.auth.uid`; `at == request.time`; `status` is `"pending"` if the listing has `approve`, else `"in"` with `queuedAt == request.time`; entries open; `existsAfter` the matching `teams` and `contacts` documents.
    - `update`: the listing's organisers or the admin only, and only `status` from `"pending"` to `"in"` with `queuedAt == request.time` (calendar-entries-desk uses it).
    - `delete`: the entrant (the id starts with their uid), the listing's organisers, or the admin.
  - `teams/{eid}`:
    - `get`: the entrant, organisers, admin, or anyone when the listing's `showEntrants == true`. `list`: organisers, admin, or when `showEntrants == true`.
    - `create` / `update`: the entrant only, while entries are open, with the shape above (`create` also needs `existsAfter` the entry).
    - `delete`: as for entries.
  - `contacts/{eid}`:
    - `get` / `list`: the entrant (`get` only), organisers, admin.
    - `create` / `update`: the entrant only, while entries are open, with the shape above.
    - `delete`: as for entries.
  - "The listing's organisers" means the calendar-publish test for `kind == "comp"` and the calendar-own-events test for `kind == "event"`. Put it in one function, e.g. `calOrganiser(cid)`.
- Store methods: `watchCalEntries(cid, cb)` (public entry docs), `watchCalTeams(cid, cb)` (when allowed), `addCalEntry(cid, eid, entry, team, contact)` (one batch), `updateCalEntry(cid, eid, team, contact)`, `withdrawCalEntry(cid, eid)` (deletes all three in one batch).
- **Privacy page:** a new section, "The Season Calendar", and an updated "Last updated" date:
  - Listings are public.
  - Entering online stores your team and player names, which are shown on the listing only if the organiser chooses, and a phone number or email that only the organisers and the site admin can see, used to contact you about that competition.
  - Withdrawing deletes your entry.
  - Entries and contact details are deleted 30 days after the event (calendar-cleanup does this).

## New text
"Season Calendar online entry", "Entries", "Players can enter online on SN Pétanque", "Online entry isn't available for this format yet.", "Places", "Blank for no limit", "Entries close", "I'll approve each entry", "Show who's entered on the listing", "Enter online", "Enter online · closes {x}", "Entries closed", "Entries open", "{n} of {x} places taken · entries close {x}" (split if two `{x}` don't fit the key scheme), "Full · {n} on the waiting list", "{n} entered", "Player name", "Team name (optional)", "Player {n}", "Your name", "Club (optional)", "Phone or email for the organiser", "Your team and player names will be shown on this listing.", "Your phone or email goes to the organiser only.", "Send my entry", "Name every player.", "Add a phone number or email so the organiser can reach you.", "This phone has already sent 5 entries for this competition.", "Entries have closed.", "Entry sent.", "Your entries", "You have a place ({n} of {x})", "You have a place", "On the waiting list (number {n})", "Waiting for the organiser to accept it", "Withdraw", "Withdraw this entry? Your place goes to the next team.", "Entry withdrawn.", "This entry was withdrawn or removed.", "Who's entered", "Waiting list", and the privacy page section.

## Acceptance checks
Extend `tests/web-calendar.js` (and `tests/app-calendar.js` for the form and queue maths):
- `switch off: Enter online shown false | create refused true`
- `entry: Entry sent. | status in | place 1 of 2`
- `queue: third entry On the waiting list (number 1) | first withdraws: third has a place true`
- `approve on: status pending | Waiting for the organiser to accept it | organiser accepts: in | entrant sets in itself false`
- `privacy: stranger reads contact false | stranger reads team (shown off) false | stranger reads team (shown on) true | organiser reads contact true | entrant reads own contact true`
- `limits: sixth entry from one device false | entry after close false | entry on hidden listing false | eurocup listing online false`
- `entrant edits after close false | entrant changes status false | stranger deletes another entry false`
- `who's entered: 2 listed | waiting list heading true | pending not listed true`
- `phone 390: form no sideways scroll true`
- `errs []`

## Notes for the builder
- Never copy a contact into the competition or the listing. Competitions are readable by anyone.
- `existsAfter` / `getAfter` let one rule check the other two documents in the same batch. Write all three with one `writeBatch`.
- The places line needs only the public `entries` documents (one read each; listings are small). Rows on the page use the listing's own fields only, with no entry reads.
- Screenshots: the form at 390 px; "Your entries" with a place and on the waiting list; "Who's entered".

## Open questions
None.
