# Admin: private notes on organiser codes and competitions

- **Status:** built in the same pull request (asked for by Sam on 21 Nov 2026)
- **Size:** one pull request.
- **Touches:**
  - `orgAdminPanel` and `adminView` (the Competitions list and its search) in src/web-boot.js
  - `adminAction`, `S.overlayInput` and `S.overlayChange` in src/web-boot.js
  - `deleteTournament` in the Firebase store in src/web-boot.js (the competition's note goes with it)
- **Depends on:** none

## Why

Sam hands out organiser codes and organiser links, and wants to write down in #admin who has each one, so he knows who is using what.

## What changes

In #admin, for the admin only:

- **Organiser codes** (Organiser login panel): each code gets an **Add note** button (**Edit note** once it has one).
- **Competitions** list: each competition gets the same button. A competition has one organiser link, so its note says who has that link.
- Tapping it opens a box under the row with **Save note** and **Cancel**, and the line **Only you see notes.**
  - Placeholder for a code: *Who has this code, e.g. club secretary, Bristol PC · sent on WhatsApp*
  - Placeholder for a competition: *Who has the organiser link, e.g. club secretary, Bristol PC · sent on WhatsApp*
  - Up to 300 characters; line breaks are kept.
  - Saving an empty box removes the note.
- A saved note shows under the row's details as **Note: …**
- The Competitions search also looks in the notes, so typing a name finds the competitions noted against that person. Its placeholder becomes **Search by name or note**.
- Deleting a competition (from #admin, the bulk delete or the clean-up) deletes its note too.
- Text typed into the box survives the page redrawing while it's open (a competition changing elsewhere).

## Not changing

- The code's label ("Who it's for"), which the organiser sees on their login page.
- Device nicknames under Who's creating.
- Anything organisers, players or spectators see.

## Data and rules

- New document `config/notes`: `{ codes: { <code>: text }, comps: { <competition id>: text }, updated }`.
- No rules change: `match /config/{docId}` already lets only the admin read or write anything but `config/site`.
- The notes are kept out of `orgcodes/{code}`, because anyone who holds a code can read that document.

## New text

Admin page only (English, like the rest of #admin): Add note, Edit note, Save note, Note:, Only you see notes., Note saved., Note removed., Search by name or note, the two placeholders above.

## Acceptance checks

Extend `tests/web-admin.js`:

- `note kept while typing during a redraw: true`
- `competition note shown: true | button Edit note`
- `search by note: Adm B1 | count 1 shown`
- `code note shown: true | not in the code's own document: true`
- `notes on another admin device: true`
- `visitor reads notes: permission-denied | writes: permission-denied`
- `note of a deleted competition gone: true | other note kept: true`
- `errs []`

## Open questions

None.
