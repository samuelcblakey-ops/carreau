# Admin archive and restore keep the Hall of Fame entry's link right

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the bulk "Archive selected" handler (~895) and the list "Restore" handler (~295) in src/web-boot.js.
- **Depends on:** none

## Why
- #admin → bulk "Archive selected" leaves the competition's Hall of Fame entry with "View the competition", and the link silently lands on the start page.
- Restore in the #admin list leaves the entry `gone: true` with no link, although the competition is public again.

The organiser's own Archive and Restore buttons get this right: they call `hofMarkGone` and unmark.

## What changes
Bulk archive marks each archived competition's entry gone, and the list Restore unmarks it, exactly as the organiser's buttons do.

## Not changing
Anything else in #admin.

## Data and rules
None.

## New text
None.

## Acceptance checks
Extend `tests/web-hall-of-fame.js`:
- `admin bulk archive: entry link hidden true`
- `admin list restore: entry link shown true`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
