# Season Calendar 2: the public page

- **Status:** ready to build (Sam, 19 Nov 2026)
- **Size:** one pull request.
- **Touches:**
  - src/carreau.html: the Season Calendar block (`renderCalPage`, `calCard`, `calRow`, `calLoad`, `calDeep`, `calFiltered`, `calPaint`); `parseLiveHash` (`calendar` route); `drawHeader` (header button, footer link); `renderWelcome` (start card); CSS next to `.hof-btn`
  - src/web-boot.js: `handleHash` and boot treat `calendar` as a route, not a competition id (as they do `halloffame`)
  - firestore.rules: `match /calendar/{cid}`, the admin's hide
- **Depends on:** specs/calendar-publish.md merged first.

## Why
Players need one place to see what's coming up near them and how to enter. This is the public page for the listings that calendar-publish saves.

## What changes
- **Route:** `#calendar` (the page) and `#calendar.<id>` (one listing, opened in place). Open to everyone, with no sign-in needed to read.
- **Links:**
  - A header button with a calendar icon, between the competition picker and the Hall of Fame button. Its text "Season Calendar" shows on desktop only, and it's highlighted on the page, like `.hof-btn`.
  - "Season Calendar" in the footer, before "Hall of Fame".
  - A start-screen card before the Hall of Fame card: **Season Calendar** / "Upcoming competitions and how to enter".
- **The page:**
  - Title "Season Calendar", with "Upcoming competitions and how to enter, published by their organisers." under it, and a ‹ Back button like the Hall of Fame's.
  - Tools: a search box ("Competition, venue, club or town"; accents and case ignored, like `hofNorm`), a Country select (default `hofDefaultCountry()`, plus "All countries"), a Format select (`HOF_FORMATS`), and level chips (All levels / National / Regional / Open).
  - Only listings dated today or later. Soonest first, grouped under "This week" (to Sunday), "Next week", then the month and year ("December 2026").
  - One row per listing:
    - a date block (day name, day and month, start time if set)
    - the competition name with its level pill
    - venue and region
    - format and who can enter, e.g. "Triples · Swiss → knockouts · Veterans"
    - on the day itself, a "Live now" pill for a competition's listing
  - Tapping a row opens the full listing in place (Close goes back), the same way Hall of Fame tiles open.
- **The full listing:**
  - level pill · country · region; name
  - date, check-in and start times; venue and address; format; who can enter; entry fee; prizes
  - "How to enter" with the organiser's text, then Contact and Note (`data-notr` on anything typed)
  - For a competition's listing (not `gone`):
    - **Follow the draw** (`#<tid>`) once the competition has a draw. The listing reads the competition once to check.
    - Before that, **View the competition**.
  - Its organisers see **Edit** (opens the calendar-publish sheet on that competition) and **Remove**.
- **States:**
  - "Loading the Season Calendar…"
  - Failed: "The Season Calendar couldn't be loaded. Check your connection and try again." with **Try again**
  - Empty for one country: "Nothing on the calendar for this country yet." with **Show all countries**
  - Empty everywhere: "Nothing's on the calendar yet. Organisers add their competitions from Setup."
  - No match: "Nothing matches your search." with **Clear the search and filters**
  - A link to a hidden or missing listing: "That listing isn't on the Season Calendar any more."
- **Admin:** signed in as the admin, each open listing has a strip, "Only you see this", with **Hide from the Season Calendar** / **Show again**. This writes `hidden` and `hiddenAt`. A hidden listing drops off the page at once. Its organisers see "Hidden from the Season Calendar by the site admin. Questions? Contact Info@FoundryITadvisory.com." on their Setup panel, and can still Remove it.
- Phones: one column, rows about 2 lines plus the date block, no sideways scrolling at 390 px.

## Not changing
The Hall of Fame page. The listing sheet (calendar-publish). No Add to calendar, Share or maps yet (calendar-share). No online entry (calendar-entry-form).

## Data and rules
- Rules: the admin may change `hidden` and `hiddenAt` on any listing. Organisers still can't (calendar-publish).
- Loading: `listCal({ country })` once per country, cached for five minutes (reset after this device lists, updates, removes or hides one), like `hofLoad`. The date filter and sort happen on the page. Opening `#calendar.<id>` reads that one listing from the server (`getCal`), like `hofDeep`.

## New text
"Season Calendar", "Upcoming competitions and how to enter, published by their organisers.", "Upcoming competitions and how to enter", "Competition, venue, club or town", "Search the Season Calendar", "This week", "Next week", "Live now", "How to enter", "Contact", "Entry fee", "Prizes", "Follow the draw", "View the competition", "Edit", "Loading the Season Calendar…", "The Season Calendar couldn't be loaded. Check your connection and try again.", "Nothing on the calendar for this country yet.", "Nothing's on the calendar yet. Organisers add their competitions from Setup.", "That listing isn't on the Season Calendar any more.", "Only you see this", "Hide from the Season Calendar", "Show again", "Hidden from the Season Calendar by the site admin.". Reuse the Hall of Fame's keys where the English is the same (All countries, All formats, All levels, Try again, Close, Nothing matches your search., Clear the search and filters, Show all countries, ‹ Back).

## Acceptance checks
Extend `tests/app-calendar.js` and `tests/web-calendar.js`:
- `page: title Season Calendar | header button true | footer link true | start card true`
- `rows: <soonest name> first | past listing shown false | groups This week,Next week,<Month YYYY>`
- `filters: country GB-ENG 2 | all countries 3 | level national 1 | search accents 1`
- `open listing: How to enter true | Follow the draw false before draw | Follow the draw true after draw`
- `deep link: #calendar.<id> opens true | missing shows notice true`
- `admin hide: hidden true | gone from page true | organiser notice true | stranger hides false`
- `phone 390: no sideways scroll true`
- `errs []`

## Notes for the builder
- Copy the Hall of Fame page: `hofPage`, `hofLoad`, `hofDeep`, `hofFiltered`, `hofResultsHtml`, `hofPaint` (repaints results only, so the search box keeps focus), `hofRedraw`, `renderHofPage`, and `hofOnPage` for the header highlight. One list layout only, with no Grid / Cards / List switch.
- "This week" runs from today to Sunday in the device's time zone. Compare "YYYY-MM-DD" strings, not Date objects, so the time zone can't shift a day.
- Screenshots: the page and an open listing, at 390 px and on desktop.

## Open questions
None.
