# Payments 1: organisers tick teams as paid in Registration

- **Status:** ready to build (Sam, 20 Nov 2026: track paid and not paid, with how it was paid; organisers only; no effect on the draw)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: `renderEntries` (a Paid control on each row, a summary line and a "Not paid" filter), the action dispatch (`case "pay-…"`), new `payOf`, `payHtml`, `paySet`, `paySum` next to the check-in code; `localStore` and `dbStore` (payments methods)
  - src/web-boot.js: `fbStore` (`watchPayments`, `setPayment`); the admin's competition delete also deletes the new private document
  - firestore.rules: `match /tournaments/{tid}/private/{docId}` (a new `payments` document)
- **Depends on:** none. Payments 2 (specs/payments-online-entries.md) builds on it.

## Why
Organisers collect entry fees in cash on the day or by bank transfer beforehand, and keep track on paper. They need to see at a glance who has paid and who hasn't, without that being visible to players or spectators.

## What changes
- **Registration, for organisers only** (`canEdit()`): each team (or player, for mêlée and precision shooting) gets a **Paid** control on its row, next to the check-in button. On phones it goes on the row's second line if it doesn't fit.
  - Not paid: an outline button "Not paid".
  - Paid: a green pill, e.g. "Paid · Cash", "Paid · Bank transfer" or "Paid · Other".
  - Tapping either opens a small chooser under the row: "How was it paid?" with **Cash**, **Bank transfer** and **Other**, plus **Not paid** when it's already paid, and **Cancel**. Choosing saves straight away.
- **A summary line** above the list: "Paid: {n} of {x}", counting teams (or players) that aren't withdrawn. Next to it, a **Not paid** chip shows only the teams still to pay; tap it again to show everyone.
- **Withdrawn teams** keep their payment, so the organiser can see who to refund. They don't count in the summary.
- **Nothing else changes.** The draw, check-in, standings and the competition's CSV export ignore payments. Players, spectators and the big screen never see them.

## Not changing
Online entries (Payments 2). The competition's CSV export. Entry fees on Season Calendar listings (still free text).

## Data and rules
- One private document per competition: `tournaments/{tid}/private/payments`, holding `{ paid: { <team or player id>: { how, at, by } } }`.
  - `how` is "cash", "transfer" or "other"; `at` is ms; `by` is the uid of the device that ticked it.
  - A team that isn't paid has no key. Use a field delete, not `null`.
  - It's a map of objects, so there are no arrays inside arrays.
- **Why a private document:** competitions are readable by anyone, so payments can't go on the team objects.
- **Rules:** add `payments` to `match /tournaments/{tid}/private/{docId}`.
  - read and write: `canEdit(tid)`, like `teamcodes`.
  - shape on write: `request.resource.data.keys().hasOnly(['paid']) && request.resource.data.paid is map`.
- **Store methods** (`localStore`, `dbStore`, `fbStore`):
  - `watchPayments(tid, cb)` is only started on a device that can edit, so spectators make no read.
  - `setPayment(tid, id, rec)` with `rec` = `{ how, at, by }` or `null` to clear. In Firebase, use `setDoc(..., { merge: true })` with a field path, so two organisers ticking different teams don't overwrite each other.
- **Deleting a competition** (admin only) must also delete `private/payments`, the same way it deletes the other private documents. Check web-boot's delete, and the 7-day inactivity clean-up if it deletes competitions.

## New text
"Paid", "Not paid", "Paid · {x}", "Cash", "Bank transfer", "Other" (exists), "How was it paid?", "Paid: {n} of {x}", "Cancel" (exists).

## Acceptance checks
New `tests/app-payments.js` (local store) and `tests/web-payments.js` (emulators). Lines:
- `paid control: organiser true | spectator false`
- `tick: Paid · Cash | summary Paid: 1 of 4`
- `change: Paid · Bank transfer | clear: Not paid | summary Paid: 0 of 4`
- `not paid chip: 3 shown | again: 4 shown`
- `withdrawn keeps paid: true | not counted: Paid: 1 of 3`
- `melee: player row has Paid true`
- `draw unaffected: unpaid team drawn true`
- `rules: owner writes true | organiser link writes true | stranger reads false | stranger writes false | bad shape false`
- `two organisers: both ticks kept true`
- `admin delete removes payments: true`
- `phone 390: no sideways scroll true`
- `errs []`

## Notes for the builder
- The row markup is in `renderEntries` (the `.erow` lines, around the `data-act="checkin"` button). The check-in toggle is in the action dispatch at `case "checkin"`. Follow the same pattern, and keep the new code in its own functions, so other branches touching `renderEntries` don't collide.
- Keep the chooser inline (no modal). One row's chooser open at a time.
- Screenshots: Registration with a mix of paid and unpaid, and the chooser open, at 390 px and on desktop.

## Open questions
None.
