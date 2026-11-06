# Header and tab bar stay in the chosen language

- **Status:** ready to build
- **Size:** one pull request.
- **Touches:** `drawHeader` in src/carreau.html.
- **Depends on:** none

## Why

In any language other than English, the header ("Competition desk", "+ New") and the tab labels switch back to English until a tab is tapped. It happens after opening the language menu or the sun/moon menu (including closing it by tapping outside), and on Hall of Fame and Stream a game.

## What changes

The header and tabs stay in the chosen language everywhere.

## Not changing

Anything else.

## Data and rules

None.

## New text

None.

## Acceptance checks

Extend `tests/app-languages.js`:
- `fr after language menu: header Bureau du concours | tabs Inscriptions`
- `fr after sun/moon menu closed by an outside tap: header translated true`
- `fr hall of fame: header translated true`
- `fr stream a game: header translated true`
- `errs []`

## Notes for the builder

- `drawHeader` writes `#tsel` and `#tabs` in English.
- The `lang-menu`/`theme-menu` handlers (~4901) and the close-on-outside-tap code (~4803) call `renderHeader()` without `localize`.
- The `S.liveRoute` branch of `drawPage` (~3772) localizes only `#main`.
- Calling `localize($("header.app"))` at the end of `drawHeader()` covers all of them.

## Open questions

None.
