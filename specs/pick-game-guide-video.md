# Pick the Winner: the "how to play" guide video on the game page

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - public/videos/pick-the-winner.mp4 and .jpg (**already on this branch**)
  - the GUIDES list in src/web-boot.js
  - `renderPickPage` in src/carreau.html (the link)
  - the event page's hash handling (`#guide`)
  - the text in all 8 languages
  - tests/web-guides.js and tests/web-event-page.js
- **Depends on:** event-page-leaderboard-tab (#200, merged). It added the tab links (#leaderboard, #triples …).

## Why

On 21 Nov Claude made a 1 min 32 s guide video for Pick the Winner, in the same style as the other guides (two phones, captions, no sound). Sam is struggling to upload it to Facebook. He wants it on the site, where the game is, with a link he can share.

## What changes

### The video

- **Files:** public/videos/pick-the-winner.mp4 (1280×800, 30 fps, 2 MB, no sound) and public/videos/pick-the-winner.jpg (the 960×600 poster). Both are already committed on this branch.
- **New GUIDES entry in web-boot.js, id `pick`,** like the others: title **How to play Pick the Winner**, length **1½ min**, the poster and the video. It shows on the Guides page with the rest and plays in the same guide player (`data-act="guide-play"`).

### The link on the game page

On the Pick the Winner page, which is the event page's Picks tab and the competition's own Pick the Winner tab:
- A watch button sits **above the How to play panel**, outside it, so joined players still see it when the panel is closed.
- It uses the same style as the front page's "Watch how it works" card (`start-card watch` with the ▶).
- It reads **Watch how to play** with the line **A 1½-minute video guide**.
- It opens the guide player with `data-act="guide-play" data-id="pick"`.
- Show it only when the site's guide player exists (`S.guideLink`), as the front page does. The artifact version shows nothing.
- It must fit at 390 px.

### A link straight to the video

- **snpetanque.com/worlds2026#guide** opens the event page on the Picks tab and starts the guide player.
- Closing the player leaves the visitor on the Picks tab, with the hash replaced by `#pick` (`history.replaceState`).
- On the main site, **snpetanque.com/#guides** already lists the guides. Nothing else is needed there.

## Not changing

- The game, the How to play text, the other guides and the share card.

## Data and rules

None.

## New text

- Watch how to play
- A 1½-minute video guide
- How to play Pick the Winner

All in all 8 languages, using each country's pétanque terms.

## Acceptance checks

- **tests/web-guides.js:** the new guide's poster and video files are served; the Guides page lists "How to play Pick the Winner · 1½ min"; and the player opens and plays it. Do this the same way as the existing guides.
- **tests/web-event-page.js:**
  - `picks tab: Watch how to play -> guide player: true`
  - `#guide opens the player on the Picks tab: true`
  - `closing the guide -> #pick: true`
- **App test:** `artifact version: no watch button: true`
- `390 px: no sideways scroll`
- `errs []`

## Notes for the builder

- Look at the Picks tab at 390 px, before and after joining.
- The video has no sound track. If the player or a test expects one, say so in the pull request.

## Open questions

None.
