# Stream overlays: no site footer, and the card clears on ad hoc streams

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** the stream-mode CSS rule (src/carreau.html ~494, `body.stream …{display:none}`) and the overlay card timer in `drawPage`'s stream branch.
- **Depends on:** none

## Why
- Every stream overlay draws the site footer over the video, at the top of the overlay: "In loving memory of Steve Noel", the © 2026 Sam Blakey line and "No cookies, no tracking". This affects ad hoc "Overlay (everything)", "Score bar only" and competition game overlays. Stream mode hides the header, round alert and toast, but not `#foot`.
- On ad hoc streams, the Carreau card stays on the overlay until the next tap on the desk. It was still there after 12 s; competition overlays clear it by 8 s. The card timer is keyed to a competition game, which an ad hoc stream doesn't have, so it gets cancelled.

## What changes
- Overlay pages don't show the footer. Keep the footer's lines in the page, as CLAUDE.md requires; just hide them in stream mode.
- On ad hoc streams, the card clears after the same time as on competition overlays.

## Not changing
The footer everywhere else. The desk.

## Data and rules
None.

## New text
None.

## Acceptance checks
Extend `tests/app-streams.js`:
- `overlay everything: footer visible false`
- `score bar only: footer visible false`
- `competition overlay: footer visible false`
- `start page: footer visible true | memorial line present`
- `ad hoc overlay card cleared by 9 s: true`
- `errs []`

## Notes for the builder
None.

## Open questions
None.
