# Hall of Fame: an "International" level (admin only)

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:**
  - in src/carreau.html: `HOF_LEVELS` and `HOF_COLOUR` (~3686), `HOF_I18N`, the publish/update sheet (`renderHofModal` ~3808 and its level handler ~3850), and the Hall of Fame page's level chips and badges (~4000, ~8110)
  - wherever #admin sets an entry's level in src/web-boot.js
  - `hofShape` and the hallOfFame create/update rules in firestore.rules
  - tests/app-hall-of-fame.js, tests/app-hall-of-fame-page.js and tests/web-hall-of-fame.js
- **Depends on:** none

## Why

On 27 Nov Sam published the 2026 World Championships to the Hall of Fame:
- Men's Triples: Madagascar beat France
- Nations Cup: Niger beat Monaco
- Precision Shooting: Thailand beat Algeria

The levels are National, Regional and Open, and a world championship fits none of them. The entries went in as National for now. Sam wants an **International** level for events like these, and the three entries moved to it.

## What changes

### The level

- **New level `international`, label "International".** It has its own colour: `#6b3fa0` (purple), with the same badge and chip style as the others and text contrast checked.
- **Order everywhere it's listed:** International, National, Regional, Open.
- **Only the admin can choose it.**
  - In the publish/update sheet, the admin sees four level buttons, with International first. Organisers still see National, Regional and Open, as now.
  - When the admin saves an entry as International, it's stored with `levelSetBy: "admin"`, so the organiser's sheet shows the level locked with "The site admin set the level." (existing text).
  - If #admin has its own level control for Hall of Fame entries, add International there too, admin only.

### The Hall of Fame page (everyone)

- **Level filter:** gets an **International** chip, after "All levels" and before National.
- **Badges:** International entries show the purple badge.
- **Country filter:** International entries show **whatever country is chosen**, as well as under their own country, because they aren't one country's event. The page opens on the visitor's country (England for most visitors), and without this the World Championships only appear under Thailand. Choosing the International chip with a country still shows all international entries.

### Season Calendar

- **Unchanged:** listings keep National, Regional and Open. Keep a separate list for the Hall of Fame (e.g. `HOF_ALL_LEVELS = ["international", ...HOF_LEVELS]`) so the calendar's pickers don't gain International.

## Not changing

- What an entry contains, who can publish, hiding, and the country and region fields.

## Data and rules

- `hofShape`: `d.level in ['international', 'national', 'regional', 'open']`.
- **Create:** a non-admin can't create with `level == 'international'`.
- **Update:** a non-admin can only have `level == 'international'` if it already was (`same('level')`), so an organiser updating an entry the admin moved to International keeps it.
- Rules go live on merge. Cover them with web tests that try both what's allowed and what's denied.

## New text

- International (all 8 languages: fr International, es Internacional, it Internazionale, de International, nl Internationaal, pt Internacional, th ระดับนานาชาติ). Check each with the pétanque wording used elsewhere.

## Acceptance checks

- **tests/web-hall-of-fame.js:**
  - `admin sets international: allowed | levelSetBy admin`
  - `organiser creates international: denied`
  - `organiser updates an admin-international entry, level kept: allowed`
  - `organiser changes international to open: denied`
- **tests/app-hall-of-fame.js:**
  - `admin sheet levels: International National Regional Open`
  - `organiser sheet levels: National Regional Open`
- **tests/app-hall-of-fame-page.js:**
  - `level chips: All levels | International | National | Regional | Open`
  - `international badge colour: #6b3fa0`
  - `country England: international entries shown true | Thailand-only national entry hidden true`
- **Calendar:** `calendar levels unchanged: National Regional Open`
- `390 px: no sideways scroll` (the chip row with 5 chips)
- `errs []`

## After it's live

Claude moves the three World Championships 2026 entries (tkpo1655, tefa7z63, td9rqc9j) to International from the admin's browser.

## Open questions

None.
