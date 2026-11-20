# Event pages: snpetanque.com/worlds2026

- **Status:** ready to build
- **Size:** one pull request (the front-page banner, share card and old-link notice come next, in specs/event-page-share.md).
- **Touches:**
  - a new event definition file, `src/events/worlds2026.json` or similar
  - `scripts/build.py`, which writes `dist/worlds2026/index.html`
  - a new event-mode shell in src/carreau.html: the header, tabs, bottom nav and footer when an event is open
  - routing at boot (event slug from the path)
  - private-link generation for the pick game
  - public/sw.js, if it needs to know the new path
- **Depends on:** none. Reuse the existing spectator renderers as they are. Other sessions are changing `renderPickPage` and `pickBoard`, so call them, don't edit them.

## Why

Sam's decision (20 Nov, 18:47): the 2026 World Championships mirror and the Pick the Winner game should live on their own **event page** at **snpetanque.com/worlds2026**. It should be one link to share (Facebook), clear of the normal organiser screens, with an easy way through to the main platform.

Pick the Winner and event pages are admin-only features, used now and then for big championships. Normal competitions don't need them.

Nothing moves:
- The event page is a new front door onto three existing competitions:
  - Men's Triples #tkpo1655, which carries the Pick the Winner game
  - Nations Cup #tefa7z63
  - Precision Shooting #td9rqc9j
- The hourly results updater keeps writing to those competitions.
- Old links (snpetanque.com/#tkpo1655) keep working.

## What changes

### The event definition

Add one file per event, in the repo. Event pages are set up by a build session when Sam asks, so no admin editor is needed now. For Worlds 2026:

```json
{
  "slug": "worlds2026",
  "title": "World Championships 2026",
  "subtitle": "Khon Kaen, Thailand · 21–24 November",
  "note": "Results come from the official FIPJP results site and update about every hour.",
  "tabs": [
    { "key": "pick",   "label": "Pick the Winner", "tid": "tkpo1655", "view": "pick" },
    { "key": "triples","label": "Triples",         "tid": "tkpo1655", "view": "results" },
    { "key": "nations","label": "Nations Cup",     "tid": "tefa7z63", "view": "results" },
    { "key": "shoot",  "label": "Shooting",        "tid": "td9rqc9j", "view": "results" }
  ],
  "live": { "from": "2026-11-20", "to": "2026-11-24" },
  "share": {
    "title": "Pick the Winner · World Championships 2026",
    "description": "Follow the Pétanque World Championships live and pick a winner each round. Free to play.",
    "image": "worlds2026-share.png"
  }
}
```

### The page at snpetanque.com/worlds2026 (everyone, phone and desktop)

- **The URL stays** snpetanque.com/worlds2026. The page carries its own preview tags (`og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`) from `share`, so Facebook and WhatsApp show the event, not the generic site.
  - Don't use a redirect. Link previews read the HTML at that address.
  - The share image file comes in the next spec. Until then, point at it anyway: a missing image is fine for now.
- **Header (event mode):**
  - the SN Pétanque logo, linking to the main site "/"
  - the event `title`, with `subtitle` under it
  - the language button and the light/dark button, as now
  - **not shown:** the competition picker, "+ New", Season Calendar, Hall of Fame, the "Organiser code" key, and any Organiser / Admin pill
- **Tabs** from `tabs`, in order. On phones they're the bottom bar (4 items, using the existing bottom-nav style); on desktop they're the top tabs. **Pick the Winner** opens first.
  - **pick:** the competition's Pick the Winner page, exactly as `renderPickPage` draws it: the How to play panel, join, your picks, the leaderboard.
  - **results:** that competition's spectator views, with a small switch between **Draw & results** and **Standings**, using the existing renderers. Brackets show inside Draw & results as now. Shooting uses its own existing views. Nothing is editable, even for organisers or the admin.
- **Switching tabs** switches the watched competition, the same way picking a competition does today. Only one competition's matches are listened to at a time, to keep Firebase reads down.
- **Under every tab:**
  - the `note` in small muted text
  - a card **Run your own competition** with the existing text and a **Start a competition** button. It opens the normal site's new-competition quick setup at "/", leaving event mode.
  - a link **Go to SN Pétanque** to "/"
- **The admin** (signed in at #admin on the same browser) sees exactly the same page, except that the pick leaderboard keeps its admin-only controls (Hide / Delete player).
- **Pick the Winner private links:** a player's private link is generated as an event link when the game's competition belongs to an event: `https://snpetanque.com/worlds2026#…`, with the same key part as today. Opening it lands on the Pick the Winner tab as that player. Old-style private links keep working.
- **Unknown slugs:** /something-else isn't built and stays a 404. Only events defined in the repo exist.

### Build

- `scripts/build.py` writes `dist/<slug>/index.html` for each event file: the normal app page with the event's preview tags and an event boot marker, e.g. `window.SN_EVENT = "worlds2026"` or a `<meta>`.
- Every relative asset path (fonts, icons, manifest, sw.js, firebase-config.js, language files) must still resolve from `/worlds2026/`. Use root-relative paths or a `<base href="/">`, and check the per-language files and the service worker.
- `build.txt` and the main page are unchanged.

## Not changing

- The competitions, their data, the results updater, the game's data and rules.
- The normal app at "/".

## Data and rules

None.

## New text

- Go to SN Pétanque
- Triples
- Shooting
- Draw & results (exists)
- Standings (exists)
- Pick the Winner (exists)

Event `title`, `subtitle`, `note` and `share` text come from the event file, in English. "Nations Cup" is a name: keep it as it is in every language.

## Acceptance checks

Web or app test `tests/web-event-page.js` (built site; emulators if it needs data). It prints:
- `event page title: World Championships 2026 | Khon Kaen, Thailand · 21–24 November`
- `event tabs: Pick the Winner, Triples, Nations Cup, Shooting`
- `event opens on: Pick the Winner`
- `event header hides: picker, new, calendar, hall of fame, organiser key`
- `triples tab: Draw & results shown, read-only`
- `nations tab switches competition: tefa7z63`
- `go to main: /`
- `start a competition: quick setup step 1 of 4 (normal mode)`
- `event private link: /worlds2026#…`
- `og:title on /worlds2026: Pick the Winner · World Championships 2026`
- `assets load from /worlds2026/: fonts ok, sw ok, no 404s`
- `390 px: no sideways scroll`
- `errs []`

## Notes for the builder

- After merging, check on the live site at a 390 px phone width:
  - https://snpetanque.com/worlds2026 shows the event
  - its HTML has the preview tags (`curl -s https://snpetanque.com/worlds2026/ | grep og:`)
- Don't change the live competitions.
- GitHub Pages serves `/worlds2026/index.html` for `/worlds2026/`. Check that `/worlds2026` without the slash redirects there too.

## Open questions

None.
