# Payments 2: organisers tick online entries as paid

- **Status:** ready to build (Sam, 20 Nov 2026: payments tracked on online entries before the day and in Registration, joined up; a player sees their own "Payment received")
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: the Season Calendar block (`calDeskHtml` gets a Paid control per row and a paid count; `calDeskCsv` gets two columns; "Your entries" shows "Payment received"; `calRegPanel` "Add to Registration" carries the payment over); the Payments 1 code (`paySet` keeps an online entry in step); `localStore` and `dbStore` (calendar payments methods)
  - src/web-boot.js: `fbStore` (calendar payments; `deleteCalEntries` and the 30-day clean-up also delete payments)
  - firestore.rules: new `match /calendar/{cid}/payments/{eid}`
  - public/privacy.html: one line in the Season Calendar section
- **Depends on:** specs/payments-registration.md merged first.

## Why
Many organisers take entry fees by bank transfer before the day. They need to tick online entries as paid as the money arrives. Players want to know their transfer arrived without having to ask. On the day, a team that paid in advance should already show as paid in Registration.

## What changes
- **The organiser's "Online entries" panel** (on the full listing): each row gets the same **Paid** control as in Registration: "Not paid", or "Paid · Cash", "Paid · Bank transfer" or "Paid · Other", with the same inline chooser.
  - The summary line adds "{n} of {x} paid" (entries not removed, places and waiting list together).
  - **Paid, then withdrawn:** if a paid entry is withdrawn by the player, a short section "Withdrew after paying" lists its team name and how it was paid, with **Clear**. The organiser can then sort out a refund.
- **CSV download:** two more columns, "Paid" ("Yes" or empty) and "How paid".
- **"Your entries"** (the player's own phone): a paid entry shows "Payment received" under its status line. An unpaid entry shows nothing about payment, so organisers who don't use this aren't affected.
- **Joined up with Registration** (competition listings):
  - "Add to Registration" and "Add everyone with a place" copy a paid entry's payment to the new team in Registration (Payments 1).
  - Ticking or clearing Paid in Registration on a team that came from an online entry (`calEntry`) also updates that entry's payment while the entry still exists, so the player's "Payment received" stays right.
  - The same works the other way: ticking an entry in the Online entries panel that's already in Registration updates Registration too.
- **Events run elsewhere:** the panel and CSV work the same. There's no Registration to keep in step.

## Not changing
Payments 1's Registration control. Online payment (players still pay the organiser directly). Who can see entries.

## Data and rules
- `calendar/{cid}/payments/{eid}`: `{ how, at, by, team }`. `how` is "cash", "transfer" or "other"; `at` is ms; `by` is a uid; `team` is the team name at the time of ticking (≤60), so a "Withdrew after paying" line can still name the team after its teams document has gone. Not paid means no document.
- **Rules:**
  - `get`: `calMine(eid) || isAdmin() || calOrganiser(cid)`. `list`: `isAdmin() || calOrganiser(cid)`.
  - `create` / `update`: `isAdmin() || calOrganiser(cid)`, with `keys().hasOnly(['how', 'at', 'by', 'team'])`, `how in ['cash', 'transfer', 'other']`, `at is int`, `team is string && team.size() <= 60`.
  - `delete`: `isAdmin() || calOrganiser(cid)`. The entrant can't create, change or delete it.
  - A player's withdrawal (entries, teams, contacts in one batch) doesn't touch payments, and still works.
- **Store methods:** `watchCalPayments(cid, cb)` (organisers: the whole list), `getCalPayment(cid, eid)` (the entrant's own), `setCalPayment(cid, eid, rec)` (`null` clears).
- **Deleting:** removing a listing (`deleteCalEntries`) and the 30-day clean-up also delete `payments`.
- **Privacy page**, Season Calendar section, add: "Organisers can mark your entry as paid. Only you, the organisers and the site admin can see that, and it's deleted with the listing 30 days after the event."

## New text
"{n} of {x} paid", "Withdrew after paying", "Clear", "Payment received", "How paid", "Yes", and the privacy line. Reuse Payments 1's keys for the control.

## Acceptance checks
New `tests/web-payments-online.js` (emulators) and lines in `tests/app-calendar.js` or a new `tests/app-payments-online.js`:
- `desk paid: Paid · Bank transfer | summary 1 of 3 paid`
- `csv: header …,Paid,How paid | row Yes,Bank transfer`
- `entrant: Payment received true | unpaid shows nothing true`
- `withdrew after paying: Pair A | Bank transfer | clear removes true`
- `add to registration carries paid: Paid · Bank transfer`
- `registration tick updates entry: entrant sees Payment received true`
- `rules: organiser writes true | entrant reads own true | entrant writes own false | entrant reads other false | stranger reads false | admin deletes true | bad how false`
- `remove listing deletes payments: true`
- `errs []`

## Notes for the builder
- Put the Paid control's markup in one function shared by Registration and the Online entries panel, so both look the same.
- "Your entries" reads only this device's own payment documents (`getCalPayment` per entry), never the list.
- Add the clean-up's deletion to `tests/web-cleanup.js`.
- Screenshots: the Online entries panel with paid and unpaid rows, and "Your entries" with "Payment received", at 390 px.

## Open questions
None.
