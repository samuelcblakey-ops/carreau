# Archive and Delete confirmations translate whatever the name

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the Archive and Delete confirmation lines in `renderSetup` (src/carreau.html ~4138 and ~4142).
- **Depends on:** none

## Why
Since #114, "{x}" can't span " · ", so in other languages the Archive confirmation stays English when the competition's name contains " · ". Every example's name does. For example, French shows `Archive “Club day · Hitchin”? Only the admin will be able to see it.` "Delete “…” for everyone?" is built the same way.

## What changes
The name sits in its own element marked `data-notr`, and the sentence around it translates in every language, whatever the name.

## Not changing
The wording.

## Data and rules
None.

## New text
Only if the sentence needs new keys once the name is separate. If so, add them in 8 languages.

## Acceptance checks
Extend `tests/app-languages.js`:
- `fr archive confirm, name with ·: translated true | name as typed`
- `de delete confirm, name with ·: translated true | name as typed`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
