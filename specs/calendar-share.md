# Season Calendar 7: add a listing to your calendar, maps or a share

- **Status:** ready to build (Sam, 17–19 Nov 2026)
- **Size:** one pull request.
- **Touches:** src/carreau.html: the Season Calendar block only (buttons on the full listing and in "Your entries"; `calIcs`, `calMapsUrl`, `calShare`).
- **Depends on:** specs/calendar-cancel.md merged first.

## Why
Players want the competition in their phone's calendar, directions to the venue, and an easy way to pass the listing to teammates on WhatsApp or Facebook.

## What changes
On the full listing, a row of three buttons under the details:
- **Add to calendar** downloads `<competition name>.ics`, a single event that iPhone, Android, Outlook and Google Calendar open. The event has:
  - the listing's name
  - the date, starting at the check-in time if set, else the start time, else all day; it lasts until 18:00, or all day
  - the venue and address as its location
  - the listing's link (`#calendar.<id>`) and "How to enter" in its description
- **Open in Maps** opens `https://www.google.com/maps/search/?api=1&query=<address, or venue and region>` in a new tab. It's only shown when there's an address or a venue.
- **Share**: on phones, the native share sheet with the listing's name and link; elsewhere, it copies the link with the toast "Link copied.", like `hofShare`.

"Your entries" also gets **Add to calendar** next to each entry. A cancelled listing hides Add to calendar.

## Not changing
Anything saved. The Hall of Fame's Share.

## Data and rules
None.

## New text
"Add to calendar", "Open in Maps", "Share". "Link copied." already exists.

## Acceptance checks
Extend `tests/app-calendar.js`:
- `ics: BEGIN:VCALENDAR | SUMMARY:<name> | DTSTART:<yyyymmdd>T091500 | LOCATION:<venue>, <address> | URL:...#calendar.<id>`
- `ics all day: DTSTART;VALUE=DATE:<yyyymmdd>`
- `maps: https://www.google.com/maps/search/?api=1&query=<encoded>`
- `share desktop: Link copied.`
- `cancelled: Add to calendar shown false`
- `errs []`

## Notes for the builder
- .ics: CRLF line endings, escape `,`, `;`, `\` and new lines in text, and fold lines over 75 characters. Use floating local time (no `Z`, no time zone): the times are the venue's, as typed. Give it a `UID` of `<id>@snpetanque.com` and a `DTSTAMP`.
- Save the file with `S.downloads.save`, as `exportCsv` does.

## Open questions
None.
