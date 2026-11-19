# Poster maker: sponsor logos, and a logo for events run elsewhere

- **Status:** ready to build (Sam, 19 Nov 2026)
- **Size:** one pull request.
- **Touches:** src/carreau.html: the poster functions (`renderPosterModal`, `posterDraw`) and the on-device picture store from specs/poster-background.md
- **Depends on:** specs/poster-background.md merged first.

## Why
Club competitions often have sponsors who expect their logo on the poster. Events run elsewhere (listed with "Add an event") have no competition, so there's no club logo for the poster to use.

## What changes
In the poster sheet, a **Logos** section after Background picture:
- **Your logo**: only for events run elsewhere, which have no club logo. **Choose a logo** / **Remove**, plus the "Show the club logo" tick from specs/poster-maker.md. For a competition, the existing club logo is used as before, and this button isn't shown.
- **Sponsors:** **Add a sponsor logo** (up to 4), each with **Remove**. With at least one sponsor:
  - "Show the sponsors" (tick, on by default)
  - "With thanks to our sponsors" (tick, on by default): the line drawn above the logos.
- **On the poster:** the sponsor logos sit in a strip along the bottom, above any bottom band, each scaled to the same height (about 7% of the poster's height), evenly spaced and centred. On coloured or picture backgrounds the strip gets a white panel, so the logos read clearly.
- **Stored on this device only,** in the same IndexedDB store as the background picture:
  - Sponsor logos are kept per device, not per listing, so they're there for the next poster. Their ticks are saved per listing with the rest of the design.
  - "Your logo" is kept per listing.
  - The line from specs/poster-background.md covers these too: "Your pictures stay on this phone. They aren't uploaded." (This replaces the singular wording.)
- Logos are shrunk on the device to at most 600 px on their longer side, as PNG, which keeps transparency.

## Not changing
Nothing is uploaded. The competition's club logo (Setup → Colours and logo) is unchanged.

## Data and rules
None (IndexedDB on the device).

## New text
"Logos", "Your logo", "Choose a logo", "Sponsors", "Add a sponsor logo", "Show the sponsors", "With thanks to our sponsors", "Your pictures stay on this phone. They aren't uploaded.", "You can add up to 4 sponsor logos."

## Acceptance checks
Extend `tests/app-poster.js`:
- `poster sponsors: 2 drawn | same height true | thanks line true | fifth refused You can add up to 4 sponsor logos.`
- `poster sponsors kept: on a second listing 2 true | ticks per listing true`
- `poster own-event logo: button shown true | comp listing button shown false`
- `poster logos stay on device: store writes 0`
- `errs []`

## Notes for the builder
- Reuse the picture store's helpers from poster-background. Keep sponsor logos as PNG Blobs, so transparent logos stay transparent on the white panel.
- With 4 logos on a square poster, cap each at 22% of the width so the strip never overflows. Wide logos shrink to fit their slot.
- Screenshots: a square Band poster with 3 sponsors; an A4 Photo poster with 4 sponsors (white panel).

## Open questions
None.
