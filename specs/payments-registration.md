# Payments 1: organisers tick teams as paid in Registration

- **Status:** ready to build (Sam, 20 Nov 2026: one tap from Not paid to Paid, as few taps as possible; the payment method doesn't matter; organisers only; no effect on the draw)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: `renderEntries` (a Paid button on each row, a summary line and a "Not paid" filter), the action dispatch (`case "pay"`), new `payOf`, `payBtn`, `paySet`, `paySum` next to the check-in code; `localStore` and `dbStore` (payments methods)
  - src/web-boot.js: `fbStore` (`watchPayments`, `setPayment`); the admin's competition delete also deletes the new private document
  - firestore.rules: `match /tournaments/{tid}/private/{docId}` (a new `payments` document)
- **Depends on:** none. Payments 2 (specs/payments-online-entries.md) builds on it.

## Why
Organisers collect entry fees in cash on the day or by bank transfer beforehand, and keep track on paper. They need to see at a glance who has paid and who hasn't, with as few taps as possible, and without it being visible to players or spectators.

## What changes
- **Registration, for organisers only** (`canEdit()`): each team (or player, for mêlée and precision shooting) gets a **Paid** button on its row, next to the check-in button. On phones it goes on the row's second line if it doesn't fit. At least 44 px, like check-in.
  - Not paid: an outline button "Not paid".
  - Paid: a green button "Paid" with a tick.
  - **One tap switches it**, either way, and saves straight away. There's no question and no choice of method.
  - The toast "Marked as paid." (or "Marked as not paid.") has **Undo** for 6 seconds, like "Result saved.", in case of a slip.
- **A summary line** above the list: "Paid: {n} of {x}", counting teams (or players) that aren't withdrawn. Next to it, a **Not paid** chip shows only the teams still to pay; tap it again to show everyone.
- **Withdrawn teams** keep their payment, so the organiser can see who to refund. They don't count in the summary.
- **Nothing else changes.** The draw, check-in, standings and the competition's CSV export ignore payments. Players, spectators and the big screen never see them.

## Not changing
Online entries (Payments 2). The competition's CSV export. Entry fees on Season Calendar listings (still free text). No payment method or amount is recorded.

## Data and rules
- One private document per competition: `tournaments/{tid}/private/payments`, holding `{ paid: { <team or player id>: { at, by } } }`.
  - `at` is ms; `by` is the uid of the device that ticked it.
  - A team that isn't paid has no key. Use a field delete, not `null`.
  - It's a map of objects, so there are no arrays inside arrays.
- **Why a private document:** competitions are readable by anyone, so payments can't go on the team objects.
- **Rules:** add `payments` to `match /tournaments/{tid}/private/{docId}`.
  - read and write: `canEdit(tid)`, like `teamcodes`.
  - shape on write: `request.resource.data.keys().hasOnly(['paid']) && request.resource.data.paid is map`.
- **Store methods** (`localStore`, `dbStore`, `fbStore`):
  - `watchPayments(tid, cb)` is only started on a device that can edit, so spectators make no read.
  - `setPayment(tid, id, rec)` with `rec` = `{ at, by }` or `null` to clear. In Firebase, use `setDoc(..., { merge: true })` with a field path, so two organisers ticking different teams don't overwrite each other.
- **Deleting a competition** (admin only) must also delete `private/payments`, the same way it deletes the other private documents. Check web-boot's delete, and the 7-day inactivity clean-up if it deletes competitions.

## New text
"Paid", "Not paid", "Marked as paid.", "Marked as not paid.", "Paid: {n} of {x}". "Undo" already exists.

## Acceptance checks
New `tests/app-payments.js` (local store) and `tests/web-payments.js` (emulators). Lines:
- `paid button: organiser true | spectator false`
- `one tap: Paid | toast Marked as paid. | summary Paid: 1 of 4`
- `tap again: Not paid | summary Paid: 0 of 4`
- `undo: Paid → Not paid true`
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
- The Undo toast: copy how score entry offers Undo on "Result saved." for 6 seconds.
- Screenshots: Registration with a mix of paid and unpaid at 390 px and on desktop.

## Open questions
None.
