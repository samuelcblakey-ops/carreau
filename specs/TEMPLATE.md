# <What changes, in a few words>

- **Status:** ready to build | needs answers (list them under Open questions)
- **Size:** one pull request. If the title needs "and", split it into more specs.
- **Touches:** the functions and areas it changes, e.g. `renderEntries` in src/carreau.html, or `match /tournaments` in firestore.rules. This stops two overlapping specs being built at the same time.
- **Depends on:** none | specs/<other>.md merged first

## Why

One or two sentences: the problem, and who has it (organiser, player, spectator or admin).

## What changes

What people see and do, step by step:

- which tab or screen
- phone and desktop
- which roles

Give the exact English wording for any new text.

## Not changing

What stays as it is, so the change doesn't grow.

## Data and rules

- New or changed saved fields. Use lists of objects, never arrays inside arrays.
- Firestore rules changes.
- What happens to existing competitions.

Write "None" if there's nothing here.

## New text

Every new English string, so the builder can add all 8 languages. Write "None" if there isn't any.

## Acceptance checks

Name the test: extend `tests/app-<x>.js`, or add `tests/web-<x>.js` when it touches Firebase, rules or sign-in. Then list the lines it prints when the change works, for example:

- `subtitle shooting: Precision shooting`
- `errs []`

## Notes for the builder

The root cause if it's a bug, code pointers (function names), gotchas, and which screenshots to look at.

## Open questions

None. (A spec with open questions isn't ready to build.)
