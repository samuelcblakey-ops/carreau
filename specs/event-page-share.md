# Event pages: front-page banner, share card and links from the competitions

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - the start screen (front page) in src/carreau.html: one banner card
  - the spectator view of a competition that belongs to an event: one notice
  - a new image, `public/worlds2026-share.png`
- **Depends on:** specs/event-page.md merged first.

## Why

The event page (snpetanque.com/worlds2026) is how Sam wants to bring people to the site during the 2026 World Championships. People landing on the front page or on an old competition link should find it, and links shared on Facebook should show a proper preview.

## What changes

### Front page (everyone)

While today (UK date) is within the event's `live.from` to `live.to`, a banner card shows at the top of the start screen, above "Run a competition":
- the heading **World Championships live**
- the text **Follow the results and play Pick the Winner. Free to play.**
- a button **Open** linking to /worlds2026

With several live events, show one card each. Outside the dates, nothing shows.

### Competition pages that belong to an event (spectators)

On a competition listed in an event's `tabs`, while the event is live, show a slim notice under the header for anyone who isn't an organiser of it: **Part of World Championships 2026. Open the event page**, where the last part is a link to /worlds2026. The event title comes from the file.

### Share image

Make `public/worlds2026-share.png`, 1200 × 630, in SN Pétanque's own style (colours, Barlow fonts):
- the text "World Championships 2026", "Khon Kaen · 21–24 November" and "Play Pick the Winner · free"
- the SN Pétanque name at the bottom
- **No FIPJP, WPBF or event logos and no mascot.** They aren't ours to use.
- A simple row of a few flag shapes is fine.
- Render it from an HTML page with Playwright, so it's easy to remake for future events, and keep that source in `tools/`.

## Not changing

- The event page itself, and the competitions.

## Data and rules

None. Taking the three competitions off the front page's Featured list is a settings change. The planning session does it from the admin browser once this is live, not in code.

## New text

- World Championships live
- Follow the results and play Pick the Winner. Free to play.
- Open
- Part of {x}. Open the event page

## Acceptance checks

App test. It prints:
- `front banner during event: World Championships live → /worlds2026`
- `front banner outside dates: none`
- `competition notice for spectator: Part of World Championships 2026. Open the event page`
- `competition notice for organiser: none`
- `share image: 1200x630`
- `errs []`

## Notes for the builder

- Look at the front page at 390 px with the banner, and at the share image itself.
- After merging, check the live /worlds2026 preview tags point at an image that loads: `curl -sI https://snpetanque.com/worlds2026-share.png`.

## Open questions

None.
